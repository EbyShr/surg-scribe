/**
 * GoogleSheetsSyncEngine - Surg-Scribe v0.4-Surg
 * Direct, zero-backend Google Sheets synchronization engine using Google Apps Script Web App.
 * Handles offline queueing in localStorage and avoids CORS preflight issues with text/plain payloads.
 */

import { SURGICAL_SCHEMA } from './schema.js';

const CONFIG_KEY = 'surg_gsheet_config_v04';
const QUEUE_KEY = 'surg_gsheet_offline_queue_v04';
const STAGED_KEY = 'surg_gsheet_staged_v04';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWKN6I80lNriVfPFr7XzZZm9wGdJckmms9led7xn7ieQJnbXz6oumHtWQ85uUHV0Q8/exec';

let _cachedLabelMap = null;
function getClinicalLabelMap() {
  if (_cachedLabelMap) return _cachedLabelMap;
  _cachedLabelMap = new Map();
  (SURGICAL_SCHEMA.chiefComplaints || []).forEach(c => (c.symptomGroups || []).forEach(g => (g.chips || []).forEach(ch => _cachedLabelMap.set(ch.id, ch.label))));
  (SURGICAL_SCHEMA.pmhItems || []).forEach(i => _cachedLabelMap.set(i.id, i.label));
  (SURGICAL_SCHEMA.rosGroups || []).forEach(g => (g.items || []).forEach(i => _cachedLabelMap.set(i.id, i.label)));
  Object.values(SURGICAL_SCHEMA.peFindings || {}).forEach(arr => (arr || []).forEach(i => _cachedLabelMap.set(i.id, i.label)));
  (SURGICAL_SCHEMA.fhItems || []).forEach(i => _cachedLabelMap.set(i.id, i.label));
  return _cachedLabelMap;
}

export function extractDetailedFindings(state) {
  const labelMap = getClinicalLabelMap();
  const positives = [];
  const negatives = [];

  const scan = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [id, val] of Object.entries(obj)) {
      if (id === 'systemGapNote' || id === 'notes' || id === 'detail' || id === 'note') continue;
      const st = typeof val === 'object' && val !== null ? val.state : val;
      const detail = typeof val === 'object' && val !== null && val.detail ? val.detail.trim() : '';
      const rawLabel = labelMap.get(id) || id;

      if (st === 1 || st === '+1') {
        positives.push(detail ? `${rawLabel} (${detail})` : rawLabel);
      } else if (st === -1 || st === '-1') {
        negatives.push(rawLabel);
      }
    }
  };

  scan(state.hpi && state.hpi.symptoms);
  scan(state.pmh && state.pmh.items);
  scan(state.ros && state.ros.items);
  scan(state.pe && state.pe.findings);
  scan(state.fh && state.fh.items);

  if (state.dh?.highAlert && Array.isArray(state.dh.highAlert)) {
    state.dh.highAlert.forEach(d => {
      positives.push(`داروی پرخطر: ${d.label || d.id}${d.detail ? ' (' + d.detail + ')' : ''}`);
    });
  }
  if (state.ah?.selected && Array.isArray(state.ah.selected)) {
    state.ah.selected.forEach(a => {
      positives.push(`حساسیت دارویی: ${a.label || a.id}${a.detail ? ' (' + a.detail + ')' : ''}`);
    });
  }

  return {
    positiveFindingsList: positives.join(' | ') || 'یافته مثبت شاخصی ثبت نشده',
    negativeFindingsList: negatives.join(' | ') || 'یافته منفی ردشده‌ای ثبت نشده',
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
   * Send a clinical case to Google Sheets Web App.
   * Uses Content-Type: text/plain;charset=utf-8 to prevent CORS Preflight (OPTIONS) failure.
   */
  async sendCase(clinicalState, generatedNote, metadataSnapshot) {
    const caseId = clinicalState.caseId || `SURG-${Date.now()}`;
    const pathway = clinicalState.cc?.pathway || clinicalState.admissionPathway || 'emergency_symptom';
    const chiefComplaint = clinicalState.cc?.patientQuote || clinicalState.cc?.selectedCategoryLabel || clinicalState.chiefComplaint || 'شکایت جراحی';
    const collector = this.config.collectorName || 'پزشک ثبت‌کننده';
    const nowIso = new Date().toISOString();
    const vitals = clinicalState.pe?.vitals || {};
    const vitalsStr = `BP: ${vitals.bp || '—'} | PR: ${vitals.pr || '—'} | RR: ${vitals.rr || '—'} | Temp: ${vitals.temp || '—'} | SpO2: ${vitals.spo2 || '—'}`;
    const detailedFindings = extractDetailedFindings(clinicalState);

    const payload = {
      action: 'record_case',
      schemaVersion: 'v0.4-Surg',

      // Primary Identifiers
      caseId: caseId,
      case_id: caseId,
      timestamp: nowIso,
      date: nowIso,

      // Collector Info
      collectorName: collector,
      collector_name: collector,
      collector: collector,

      // Patient Demographics
      age: clinicalState.demographics?.age || '',
      gender: clinicalState.demographics?.gender === 'female' ? 'زن' : 'مرد',
      patientGender: clinicalState.demographics?.gender || 'male',
      marital: clinicalState.demographics?.marital || '',
      city: clinicalState.demographics?.city || '',
      occupation: clinicalState.demographics?.occupation || '',

      // Pathway & Chief Complaint
      admissionPathway: pathway === 'clinic_referral' ? 'درمانگاه (الکتیو)' : 'اورژانس',
      admission_pathway: pathway === 'clinic_referral' ? 'درمانگاه (الکتیو)' : 'اورژانس',
      pathway: pathway,
      chiefComplaint: chiefComplaint,
      chief_complaint: chiefComplaint,
      cc: chiefComplaint,
      patientQuote: clinicalState.cc?.patientQuote || '',
      patient_quote: clinicalState.cc?.patientQuote || '',

      // Physical Exam & Vitals
      vitals: vitalsStr,
      bp: vitals.bp || '',
      pr: vitals.pr || '',
      rr: vitals.rr || '',
      temp: vitals.temp || '',
      spo2: vitals.spo2 || '',

      // Quantitative Findings Metrics
      positiveFindingsCount: metadataSnapshot?.metrics?.positiveFindingsCount || detailedFindings.positiveCount,
      positive_count: metadataSnapshot?.metrics?.positiveFindingsCount || detailedFindings.positiveCount,
      negativeFindingsCount: metadataSnapshot?.metrics?.negativeFindingsCount || detailedFindings.negativeCount,
      negative_count: metadataSnapshot?.metrics?.negativeFindingsCount || detailedFindings.negativeCount,
      labsRecordedCount: metadataSnapshot?.metrics?.labsRecordedCount || 0,
      labs_count: metadataSnapshot?.metrics?.labsRecordedCount || 0,

      // Qualitative Detailed Findings Lists (Full textual items with inline details)
      positiveFindingsList: detailedFindings.positiveFindingsList,
      positive_findings: detailedFindings.positiveFindingsList,
      positivesText: detailedFindings.positiveFindingsList,
      positiveFindings: detailedFindings.positiveFindingsList,

      negativeFindingsList: detailedFindings.negativeFindingsList,
      negative_findings: detailedFindings.negativeFindingsList,
      negativesText: detailedFindings.negativeFindingsList,
      negativeFindings: detailedFindings.negativeFindingsList,

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
      maritalCity: `${clinicalState.demographics?.marital || '—'} / ${clinicalState.demographics?.city || '—'}`,
      painSeverityDuration: `شدت: ${clinicalState.hpi?.severity || '—'}/10 | مدت: ${clinicalState.hpi?.duration || '—'}`,
      painRegionPattern: `${(clinicalState.hpi?.selectedRegions || []).join('، ') || '—'} (${clinicalState.hpi?.spatialPattern || 'لوکالیزه'})`,
      systemGapsSummary: (metadataSnapshot?.systemGapsLogged || []).map(g => `[${g.section}]: ${g.note}`).join(' | ') || 'ندارد',
      semanticQualifiersSummary: (metadataSnapshot?.semanticQualifiers || []).map(s => typeof s === 'object' ? (s.value || s.label || JSON.stringify(s)) : s).join('، ') || '—',
      rawJsonString: JSON.stringify(clinicalState, null, 2),

      // Structured JSON Data
      semanticQualifiersJSON: JSON.stringify(metadataSnapshot?.semanticQualifiers || []),
      semantic_qualifiers: JSON.stringify(metadataSnapshot?.semanticQualifiers || []),
      systemGapsJSON: JSON.stringify(metadataSnapshot?.systemGapsLogged || []),
      system_gaps: JSON.stringify(metadataSnapshot?.systemGapsLogged || []),
      rawStateJSON: JSON.stringify(clinicalState),
      record_json: clinicalState,
      record: clinicalState,
      clinicalState: clinicalState
    };

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

    // Check online status
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.enqueue(payload);
      return {
        success: true,
        queued: true,
        message: 'اینترنت قطع است؛ پرونده در صف آفلاین ذخیره شد و پس از اتصال اینترنت خودکار ارسال می‌شود.'
      };
    }

    return await this._transmit(payload);
  }

  async _transmit(payload) {
    try {
      // POST with text/plain prevents CORS preflight OPTIONS request
      const response = await fetch(this.config.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.type !== 'opaque') {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        queued: false,
        message: 'پرونده با موفقیت به Google Sheets ارسال و ثبت شد.'
      };
    } catch (err) {
      console.warn('Network send failed, queueing offline:', err);
      this.enqueue(payload);
      return {
        success: true,
        queued: true,
        message: 'به دلیل خطای شبکه، پرونده در صف آفلاین محلی ذخیره شد و پس از رفع خطا ارسال می‌شود.'
      };
    }
  }

  /**
   * Flush all offline queued cases sequentially
   */
  async flushQueue() {
    if (!navigator.onLine || !this.config.scriptUrl || this.queue.length === 0) {
      return { count: this.queue.length, flushed: 0 };
    }

    let flushed = 0;
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

        if (response.ok || response.type === 'opaque') {
          flushed++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
        break; // Stop loop on continuous network failure
      }
    }

    this.queue = remaining;
    this.saveQueue();
    return { count: this.queue.length, flushed };
  }
}
