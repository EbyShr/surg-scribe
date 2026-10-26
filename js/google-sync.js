/**
 * GoogleSheetsSyncEngine - Surg-Scribe v0.5-Surg
 * Direct, zero-backend Google Sheets synchronization engine using Google Apps Script Web App.
 * Handles offline queueing in localStorage and avoids CORS preflight issues with text/plain payloads.
 * Strictly enforces PII sanitization (fullName, fatherName, birthDate) before transmission.
 */

import {
  SURGICAL_SCHEMA,
  ROS_GROUPS_BILINGUAL,
  PMH_CATEGORIES,
  DH_CATEGORIES,
  PE_MANDATORY_PILLARS,
  PE_UNLOCKABLE_MODULES,
  HPI_BASIC_SYMPTOMS,
  HPI_UNLOCKABLE_MODULES
} from './schema.js';
import { sanitizeRecordForExport } from './generator.js';

const CONFIG_KEY = 'surg_gsheet_config_v04';
const QUEUE_KEY = 'surg_gsheet_offline_queue_v04';
const STAGED_KEY = 'surg_gsheet_staged_v04';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWKN6I80lNriVfPFr7XzZZm9wGdJckmms9led7xn7ieQJnbXz6oumHtWQ85uUHV0Q8/exec';

let _cachedLabelMap = null;
function getClinicalLabelMap() {
  if (_cachedLabelMap) return _cachedLabelMap;
  _cachedLabelMap = new Map();

  HPI_BASIC_SYMPTOMS.forEach(s => _cachedLabelMap.set(s.id, s.label));
  HPI_UNLOCKABLE_MODULES.forEach(m => m.chips.forEach(c => _cachedLabelMap.set(c.id, c.label)));
  PMH_CATEGORIES.forEach(c => c.items.forEach(i => _cachedLabelMap.set(i.id, i.label)));
  ROS_GROUPS_BILINGUAL.forEach(g => g.items.forEach(i => _cachedLabelMap.set(i.id, i.label)));
  PE_MANDATORY_PILLARS.forEach(p => p.items.forEach(i => _cachedLabelMap.set(i.id, i.label)));
  PE_UNLOCKABLE_MODULES.forEach(m => m.items.forEach(i => _cachedLabelMap.set(i.id, i.label)));
  SURGICAL_SCHEMA.abdominalRegions.forEach(r => _cachedLabelMap.set(r.id, r.label));
  SURGICAL_SCHEMA.radiationSites.forEach(r => _cachedLabelMap.set(r.id, r.label));
  (SURGICAL_SCHEMA.fhItems || []).forEach(i => _cachedLabelMap.set(i.id, i.label));

  return _cachedLabelMap;
}

export function extractDetailedFindings(state) {
  const labelMap = getClinicalLabelMap();
  const positives = [];
  const negatives = [];

  // 1. Pain Episodes
  if (state.hpi?.painList && Array.isArray(state.hpi.painList)) {
    state.hpi.painList.forEach((p, idx) => {
      const pTitle = p.title || `کانون ${idx + 1}`;
      const regNames = (p.selectedRegions || []).map(r => labelMap.get(r) || r).join(' و ') || p.site || '';
      if (regNames) positives.push(`${pTitle}: ناحیه ${regNames} (شدت: ${p.severity || '—'}/10)`);
      if (p.radiationList && p.radiationList.length > 0) {
        p.radiationList.forEach(r => positives.push(`انتشار ${pTitle}: ${r.label || r}${r.detail ? ' (' + r.detail + ')' : ''}`));
      } else if (p.radiation && Array.isArray(p.radiation) && p.radiation.length > 0) {
        p.radiation.forEach(r => positives.push(`انتشار ${pTitle}: ${typeof r === 'object' ? r.label : r}`));
      } else if (p.noRadiation) {
        negatives.push(`انتشار ${pTitle}: بدون انتشار`);
      }
      if (p.aggravating) {
        const aggStr = Array.isArray(p.aggravating) ? p.aggravating.join('، ') : String(p.aggravating).trim();
        if (aggStr) positives.push(`عوامل تشدید: ${aggStr}`);
      }
      if (p.relieving) {
        const relStr = Array.isArray(p.relieving) ? p.relieving.join('، ') : String(p.relieving).trim();
        if (relStr) positives.push(`عوامل تسکین: ${relStr}`);
      }
    });
  }

  // 2. Scan HPI symptoms
  const scanObj = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [id, val] of Object.entries(obj)) {
      if (id === 'systemGapNote' || id === 'notes' || id === 'detail' || id === 'note') continue;
      const st = typeof val === 'object' && val !== null ? (val.state !== undefined ? val.state : (val.active ? 1 : 0)) : val;
      const detail = typeof val === 'object' && val !== null && (val.detail || val.note) ? (val.detail || val.note).trim() : '';
      const rawLabel = (typeof val === 'object' && val !== null && val.label) || labelMap.get(id) || id;

      if (st === 1 || st === '+1') {
        positives.push(detail ? `${rawLabel} (${detail})` : rawLabel);
      } else if (st === -1 || st === '-1') {
        negatives.push(rawLabel);
      }
    }
  };

  scanObj(state.hpi && state.hpi.symptoms);
  if (state.hpi && state.hpi.unlockedModules) {
    HPI_UNLOCKABLE_MODULES.forEach(m => {
      if (state.hpi[m.id]) scanObj(state.hpi[m.id]);
    });
  }

  // 3. Scan Categorized PMH
  if (state.pmh) {
    if (state.pmh.masterRoutineNegative) {
      negatives.push('بیماری‌های زمینه‌ای روتین (DM, HTN, DLP, IHD)');
    }
    if (state.pmh.categories) {
      Object.entries(state.pmh.categories).forEach(([catId, catData]) => {
        if (catData.status === 'negated' || catData.negativeAll === true) {
          const foundCat = PMH_CATEGORIES.find(c => c.id === catId || c.id === `pmh_${catId}`);
          negatives.push(foundCat ? foundCat.title : catId);
        }
        scanObj(catData.items);
        if (catData.otherNote && catData.otherNote.trim()) {
          positives.push(`سایر بیماری‌های ${catId}: ${catData.otherNote.trim()}`);
        }
      });
    }
    scanObj(state.pmh.items);
  }

  // 4. PSH & Ob/Gyn
  if (state.psh?.note && state.psh.note.trim()) {
    positives.push(`سابقه جراحی (PSH): ${state.psh.note.trim()}`);
  }
  if (state.psh?.surgeries && Array.isArray(state.psh.surgeries)) {
    state.psh.surgeries.forEach(s => {
      positives.push(`جراحی: ${s.procedure || ''} (${s.yearHospital || ''})`);
    });
  }
  if (state.obgyn?.pregnancies && Array.isArray(state.obgyn.pregnancies)) {
    state.obgyn.pregnancies.forEach((preg, i) => {
      positives.push(`بارداری #${i + 1}: ${preg.outcome || preg.deliveryType || ''} (${preg.year || ''})`);
    });
  }

  // 5. Categorized DH
  if (state.dh?.categories) {
    DH_CATEGORIES.forEach(cat => {
      const catDrugs = state.dh.categories[cat.id]?.drugs || state.dh.categories[cat.id]?.items || {};
      cat.drugs.forEach(d => {
        const entry = catDrugs[d.id] || (state.dh.categories[cat.id.replace('endocrine_steroid', 'antidiabetics')]?.drugs?.[d.id]);
        if (entry && (entry.active || entry === true)) {
          const details = [entry.dose || d.defaultDose, entry.sig, entry.note].filter(Boolean);
          positives.push(`دارو: ${d.label} [${details.join(' | ')}]`);
        }
      });
    });
  }
  if (state.dh?.customDrugs && Array.isArray(state.dh.customDrugs)) {
    state.dh.customDrugs.forEach(cd => {
      if (cd.name && cd.name.trim()) {
        const details = [cd.dose, cd.sig, cd.note].filter(Boolean);
        positives.push(`داروی دستی: ${cd.name} [${details.join(' | ')}]`);
      }
    });
  }

  // 6. AH, SH, FH
  if (state.ah?.nkda) {
    negatives.push('حساسیت دارویی یا غذایی (NKDA)');
  }
  scanObj(state.ah && state.ah.items);
  if (state.ah?.selected && Array.isArray(state.ah.selected)) {
    state.ah.selected.forEach(a => {
      positives.push(`حساسیت: ${a.label || a.id}${a.detail ? ' (' + a.detail + ')' : ''}`);
    });
  }

  if (state.sh?.cigsPerDay && Number(state.sh.cigsPerDay) > 0) {
    positives.push(`مصرف سیگار: ${state.sh.cigsPerDay} نخ/روز (${state.sh.yearsSmoked || 0} سال)`);
  }
  if (state.sh?.opium && state.sh.opium.trim() && state.sh.opium !== 'no') {
    positives.push(`مصرف اپیوم: ${state.sh.opium.trim()}`);
  }

  if (state.fh?.selected && Array.isArray(state.fh.selected)) {
    state.fh.selected.forEach(f => {
      positives.push(`سابقه خانوادگی: ${f.label || f.id}${f.detail ? ' (' + f.detail + ')' : ''}`);
    });
  }

  // 7. ROS
  if (state.ros) {
    Object.values(state.ros).forEach(group => {
      if (typeof group === 'object' && group !== null) scanObj(group);
    });
  }

  // 8. PE (4 Pillars, Findings & Unlocked modules)
  scanObj(state.pe && state.pe.findings);
  if (state.pe && state.pe.abdomen) {
    Object.values(state.pe.abdomen).forEach(pillar => scanObj(pillar));
  }
  if (state.pe && state.pe.unlockedModules) {
    PE_UNLOCKABLE_MODULES.forEach(m => {
      if (state.pe[m.id]) scanObj(state.pe[m.id]);
    });
  }

  // 9. Paraclinics Imaging
  if (state.paraclinics?.imagingReports && Array.isArray(state.paraclinics.imagingReports)) {
    state.paraclinics.imagingReports.forEach(rep => {
      if (rep.tags && Array.isArray(rep.tags)) {
        rep.tags.forEach(t => positives.push(`${rep.modalityLabel || 'تصویربرداری'}: ${t.label || t.id}${t.detail ? ' (' + t.detail + ')' : ''}`));
      }
      if (rep.findings) {
        positives.push(`${rep.modality || rep.modalityLabel || 'تصویربرداری'}: ${rep.findings}`);
      }
    });
  }

  const summary = `[مثبت‌ها: ${positives.join('، ') || 'هیچ'}] | [منفی‌ها: ${negatives.join('، ') || 'هیچ'}]`;

  return {
    positiveFindingsList: positives.join(' | ') || 'یافته مثبت شاخصی ثبت نشده',
    negativeFindingsList: negatives.join(' | ') || 'یافته منفی ردشده‌ای ثبت نشده',
    summaryText: summary,
    detailedFindingsSummary: summary,
    positiveCount: positives.length,
    negativeCount: negatives.length
  };
}

export class GoogleSheetsSyncEngine {
  constructor() {
    this.config = this.loadConfig();
    this.queue = this.loadQueue();
    this.staged = this.loadStaged();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushQueue();
      });
    }
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            scriptUrl: (parsed.scriptUrl && parsed.scriptUrl.trim().length > 0) ? parsed.scriptUrl.trim() : DEFAULT_SCRIPT_URL,
            collectorName: (parsed.collectorName || '').trim()
          };
        }
      }
      return { scriptUrl: DEFAULT_SCRIPT_URL, collectorName: '' };
    } catch (e) {
      return { scriptUrl: DEFAULT_SCRIPT_URL, collectorName: '' };
    }
  }

  saveConfig({ scriptUrl, collectorName }) {
    this.config = {
      scriptUrl: (scriptUrl && scriptUrl.trim().length > 0) ? scriptUrl.trim() : DEFAULT_SCRIPT_URL,
      collectorName: (collectorName || '').trim()
    };
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Failed to save Google Sheets config:', e);
    }
  }

  loadQueue() {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  saveQueue() {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      }
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }

  loadStaged() {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(STAGED_KEY);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  saveStaged() {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(STAGED_KEY, JSON.stringify(this.staged.slice(-50)));
      }
    } catch (e) {
      console.warn('Failed to save staged cases:', e);
    }
  }

  enqueue(payload) {
    this.queue.push({
      id: payload.caseId || `QUEUED-${Date.now()}`,
      queuedAt: new Date().toISOString(),
      payload
    });
    this.saveQueue();
  }

  getQueueCount() {
    return this.queue.length;
  }

  getStagedCount() {
    return this.staged.length;
  }

  /**
   * Prepares and validates sanitized payload for Google Sheets Web App.
   * Strictly strips PII (fullName, fatherName, birthDate).
   */
  prepareCasePayload(clinicalState, explicitCaseId = null, generatedNote = '', metadataSnapshot = null) {
    const sanitizedState = sanitizeRecordForExport(clinicalState);
    const isSoap = sanitizedState.recordType === 'SOAP_PROGRESS';
    const demo = isSoap
      ? (sanitizedState.context || {})
      : (sanitizedState.demographics || sanitizedState.admission || {});
    const cc = sanitizedState.cc || sanitizedState.admission || {};

    const caseId = explicitCaseId || sanitizedState.caseId || (isSoap ? `SOAP-${Date.now()}` : `SURG-${Date.now()}`);
    const pathway = isSoap
      ? (sanitizedState.context?.procedureDone ? `پس از عمل (${sanitizedState.context.procedureDone})` : 'پراگرس نوت بخش')
      : (cc.pathway || sanitizedState.admissionPathway || 'emergency_symptom');
    const chiefComplaint = isSoap
      ? (sanitizedState.context?.workingDiagnosis || 'پراگرس روزانه جراحی (SOAP)')
      : (cc.ccPhrase || cc.patientQuote || cc.selectedCategoryLabel || sanitizedState.chiefComplaint || 'شکایت جراحی');
    const collector = this.config.collectorName || 'پزشک ثبت‌کننده';
    const nowIso = new Date().toISOString();
    const vitals = isSoap ? (sanitizedState.objective?.vitals || {}) : (sanitizedState.pe?.vitals || {});
    const vitalsStr = `BP: ${vitals.bp || '—'} | PR: ${vitals.pr || '—'} | RR: ${vitals.rr || '—'} | Temp: ${vitals.temp || '—'} | SpO2: ${vitals.spo2 || '—'}`;
    const detailedFindings = isSoap
      ? { positiveCount: 0, negativeCount: 0, positiveFindingsList: '', negativeFindingsList: '', summaryText: '' }
      : extractDetailedFindings(sanitizedState);

    const firstPain = sanitizedState.hpi?.painList?.[0] || {};
    const painSite = firstPain.site || (firstPain.selectedRegions || []).join('، ') || '';
    const painRegionPattern = isSoap ? (sanitizedState.subjective?.painStatus || '—') : `${painSite || '—'} (${firstPain.spatialPattern || 'لوکالیزه'})`;
    const painSeverityDuration = isSoap ? (sanitizedState.subjective?.painDetail || '—') : `شدت: ${firstPain.severity !== undefined ? firstPain.severity : '—'}/10 | مدت: ${firstPain.duration || sanitizedState.hpi?.duration || '—'}`;

    return {
      action: 'record_case',
      schemaVersion: 'v0.9-Surg',
      recordType: isSoap ? 'SOAP_PROGRESS' : 'ADMISSION_HP',
      record_type: isSoap ? 'SOAP_PROGRESS' : 'ADMISSION_HP',

      // Primary Identifiers
      caseId: caseId,
      case_id: caseId,
      timestamp: nowIso,
      date: nowIso,

      // Collector Info
      collectorName: collector,
      collector_name: collector,
      collector: collector,

      // Patient Demographics (Sanitized: NO fullName, fatherName, or birthDate)
      age: demo.age || '',
      gender: demo.gender === 'female' ? 'زن' : demo.gender === 'male' ? 'مرد' : (demo.gender || 'سایر/ترنس'),
      patientGender: demo.gender || 'male',
      marital: demo.marital || '',
      city: demo.city || '',
      occupation: demo.occupation || '',

      // Pathway & Chief Complaint
      admissionPathway: pathway === 'clinic_referral' ? 'درمانگاه (الکتیو)' : (pathway === 'postop_complication' ? 'عوارض پس از عمل' : 'اورژانس'),
      admission_pathway: pathway === 'clinic_referral' ? 'درمانگاه (الکتیو)' : (pathway === 'postop_complication' ? 'عوارض پس از عمل' : 'اورژانس'),
      pathway: pathway,
      chiefComplaint: chiefComplaint,
      chief_complaint: chiefComplaint,
      cc: chiefComplaint,
      patientQuote: cc.patientQuote || '',
      patient_quote: cc.patientQuote || '',

      // Physical Exam & Vitals
      vitals: vitalsStr,
      bp: vitals.bp || '',
      pr: vitals.pr || '',
      rr: vitals.rr || '',
      temp: vitals.temp || '',
      spo2: vitals.spo2 || '',

      // Pain Findings
      pain_site: painSite,
      painSite: painSite,
      painRegionPattern: painRegionPattern,
      painSeverityDuration: painSeverityDuration,

      // Quantitative Findings Metrics
      positiveFindingsCount: metadataSnapshot?.metrics?.positiveFindingsCount || detailedFindings.positiveCount,
      positive_count: metadataSnapshot?.metrics?.positiveFindingsCount || detailedFindings.positiveCount,
      negativeFindingsCount: metadataSnapshot?.metrics?.negativeFindingsCount || detailedFindings.negativeCount,
      negative_count: metadataSnapshot?.metrics?.negativeFindingsCount || detailedFindings.negativeCount,
      labsRecordedCount: metadataSnapshot?.metrics?.labsRecordedCount || 0,
      labs_count: metadataSnapshot?.metrics?.labsRecordedCount || 0,

      // Qualitative Detailed Findings Lists & Summaries
      positiveFindingsList: detailedFindings.positiveFindingsList,
      positive_findings: detailedFindings.positiveFindingsList,
      positivesText: detailedFindings.positiveFindingsList,
      positiveFindings: detailedFindings.positiveFindingsList,

      negativeFindingsList: detailedFindings.negativeFindingsList,
      negative_findings: detailedFindings.negativeFindingsList,
      negativesText: detailedFindings.negativeFindingsList,
      negativeFindings: detailedFindings.negativeFindingsList,

      detailed_findings_summary: detailedFindings.summaryText,
      detailedFindingsSummary: detailedFindings.summaryText,

      // Generated Markdown Clinical Note
      fullClinicalNote: generatedNote || '',
      clinical_note: generatedNote || '',
      note: generatedNote || '',

      // Status
      review_status: 'approved',
      reviewStatus: 'approved',
      status: 'approved',

      // Pre-formatted Column Summaries for Google Sheets
      timestampFormatted: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR'),
      maritalCity: `${demo.marital || '—'} / ${demo.city || '—'}`,
      systemGapsSummary: (metadataSnapshot?.systemGapsLogged || []).map(g => `[${g.section}]: ${g.note}`).join(' | ') || 'ندارد',
      rawJsonString: JSON.stringify(sanitizedState, null, 2),

      // Structured Sanitized JSON Data
      systemGapsJSON: JSON.stringify(metadataSnapshot?.systemGapsLogged || []),
      system_gaps: JSON.stringify(metadataSnapshot?.systemGapsLogged || []),
      rawStateJSON: JSON.stringify(sanitizedState),
      record_json: sanitizedState,
      record: sanitizedState,
      clinicalState: sanitizedState
    };
  }

  /**
   * Send a clinical case to Google Sheets Web App.
   * Strips PII (fullName, fatherName, birthDate) automatically before sending.
   * Uses Content-Type: text/plain;charset=utf-8 to prevent CORS Preflight (OPTIONS) failure.
   */
  async sendCase(clinicalState, generatedNote, metadataSnapshot) {
    const payload = this.prepareCasePayload(clinicalState, null, generatedNote, metadataSnapshot);
    const caseId = payload.caseId;

    // Keep in local staged history
    this.staged.unshift({
      caseId,
      timestamp: payload.timestamp,
      collectorName: payload.collectorName,
      chiefComplaint: payload.chiefComplaint,
      noteLength: (generatedNote || '').length
    });
    this.saveStaged();

    // Check script URL configuration
    if (!this.config.scriptUrl) {
      this.enqueue(payload);
      return {
        success: false,
        queued: true,
        message: 'آدرس وب‌اپ گوگل اسکریپت در تنظیمات وارد نشده است. پرونده در صف ذخیره شد.'
      };
    }

    try {
      const response = await fetch(this.config.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          queued: false,
          caseId,
          message: `پرونده ${caseId} با موفقیت در Google Sheets ثبت گردید.`
        };
      } else {
        this.enqueue(payload);
        return {
          success: false,
          queued: true,
          caseId,
          message: `خطای سرور گوگل (${response.status}). پرونده در صف آفلاین ذخیره شد.`
        };
      }
    } catch (networkError) {
      console.warn('[GoogleSync] Network request failed. Enqueueing case for offline sync:', networkError);
      this.enqueue(payload);
      return {
        success: false,
        queued: true,
        caseId,
        message: `عدم اتصال به اینترنت. پرونده ${caseId} در صف ذخیره شد و پس از اتصال خودکار ارسال می‌گردد.`
      };
    }
  }

  async flushQueue() {
    if (this.queue.length === 0 || !this.config.scriptUrl) return 0;
    let sentCount = 0;
    const remaining = [];

    for (const item of this.queue) {
      try {
        const response = await fetch(this.config.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(item.payload)
        });

        if (response.ok) {
          sentCount++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    this.queue = remaining;
    this.saveQueue();
    return sentCount;
  }
}
