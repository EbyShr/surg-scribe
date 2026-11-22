/**
 * MedHistorism v3.1 — Ob/Gyn Deterministic Bilingual Clinical Narrative Engine
 * Pure ES Module (Node-safe, Zero DOM Access, Zero Emojis, Not Assessed != Negative)
 */

import {
  OBGYN_OBSTETRIC_ARCHETYPES,
  OBGYN_GYN_ARCHETYPES,
  OBGYN_SYMPTOM_BANK,
  OBGYN_PE_BANK,
  OBGYN_CONTRACEPTION_OPTIONS
} from './obgyn-data.js';
import {
  normalizeObgynState,
  normalizeDigits,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory
} from './obgyn-state.js';
import { getCurrentLanguage, tLabel } from '../../i18n.js';

const CONTRACEPTION_MAP = Object.fromEntries(OBGYN_CONTRACEPTION_OPTIONS.map((o) => [o.val, o]));

function cleanEn(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  const s = String(val).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!s) return fallback;
  if (!/[\u0600-\u06FF]/.test(s)) return s;
  const translated = tLabel(s);
  if (translated && !/[\u0600-\u06FF]/.test(translated)) return translated;
  // Extract parenthetical English if present e.g. "سفالیک (Cephalic)" -> "Cephalic"
  const paren = s.match(/\(([A-Za-z0-9\s\/\-\.,+%<>≥≤=]+)\)/);
  if (paren && paren[1]) return paren[1].trim();
  const stripped = s.replace(/[\u0600-\u06FF،؛؟ـ\u200B-\u200D\uFEFF]+/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped || fallback;
}

function getFieldOptionLabel(archetypeList, archId, key, val, isEn) {
  if (!val) return '';
  const arch = archetypeList.find((a) => a.id === archId);
  const f = arch?.fields?.find((fld) => fld.key === key);
  if (f?.options) {
    const opt = f.options.find((o) => o.val === val);
    if (opt) return isEn ? opt.en : opt.fa;
  }
  return isEn ? cleanEn(val, String(val)) : String(val);
}

function formatObstetricFormula(idx, subMode) {
  const g = idx.G !== '' && idx.G !== null && idx.G !== undefined ? idx.G : '0';
  const p = idx.P !== '' && idx.P !== null && idx.P !== undefined ? idx.P : '0';
  const l = idx.L !== '' && idx.L !== null && idx.L !== undefined ? idx.L : '0';
  const d = idx.D !== '' && idx.D !== null && idx.D !== undefined ? idx.D : '0';
  const ab = idx.Ab !== '' && idx.Ab !== null && idx.Ab !== undefined ? idx.Ab : '0';
  const iufd = idx.IUFD !== '' && idx.IUFD !== null && idx.IUFD !== undefined ? idx.IUFD : '0';
  const ep = idx.EP !== '' && idx.EP !== null && idx.EP !== undefined ? idx.EP : '0';
  const mole = idx.Mole !== '' && idx.Mole !== null && idx.Mole !== undefined ? idx.Mole : '0';

  if (subMode === 'gynecology' && !idx.expandZeroIndexFields) {
    let formula = `G${g}P${p}L${l}Ab${ab}`;
    if (Number(d) > 0) formula += `D${d}`;
    if (Number(ep) > 0) formula += `EP${ep}`;
    if (Number(mole) > 0) formula += `Mole${mole}`;
    return formula;
  }

  let formula = `G${g}P${p}L${l}D${d}Ab${ab}`;
  if (idx.expandZeroIndexFields || Number(iufd) > 0) formula += `IUFD${iufd}`;
  if (idx.expandZeroIndexFields || Number(ep) > 0) formula += `EP${ep}`;
  if (idx.expandZeroIndexFields || Number(mole) > 0) formula += `Mole${mole}`;
  return formula;
}

function collectSharedHistories(clinicalState, ob, isEn) {
  const c = clinicalState || {};

  // 3. PMHx
  const pmhPos = [];
  const pmhNeg = [];
  const pmhCats = c.pmh?.categories || {};
  Object.values(pmhCats).forEach((cat) => {
    if (!cat || typeof cat !== 'object') return;
    if (cat.items && typeof cat.items === 'object') {
      Object.entries(cat.items).forEach(([itemId, val]) => {
        const st = val && typeof val === 'object' ? val.state : val;
        const lbl = val && typeof val === 'object' ? (isEn ? cleanEn(val.en || val.label || itemId, itemId) : (val.label || itemId)) : itemId;
        if (st === 1) pmhPos.push(lbl);
        else if (st === -1) pmhNeg.push(lbl);
      });
    }
    if (cat.otherNote && String(cat.otherNote).trim()) {
      pmhPos.push(isEn ? cleanEn(cat.otherNote) : String(cat.otherNote).trim());
    }
  });
  let pmhText = '';
  if (pmhPos.length > 0) pmhText = pmhPos.join(isEn ? ', ' : '، ');
  else if (c.pmh?.masterRoutineNegative) {
    pmhText = isEn
      ? 'No history of chronic medical illness (denies DM, HTN, IHD, renal, or thyroid disease).'
      : 'سابقه بیماری زمینه‌ای خاصی (فشار خون مزمن، دیابت، بیماری قلبی، کلیوی یا تیروئیدی) را ذکر نمی‌کند.';
  } else if (pmhNeg.length > 0) {
    pmhText = isEn ? `Denies ${pmhNeg.join(', ')}.` : `سابقه ${pmhNeg.join('، ')} را ذکر نمی‌کند.`;
  } else {
    pmhText = isEn ? 'Not documented.' : 'ثبت‌نشده.';
  }

  // 4. PSHx
  const surgeries = Array.isArray(c.psh?.surgeries) ? c.psh.surgeries : [];
  let pshText = '';
  if (surgeries.length > 0) {
    pshText = surgeries.map((s) => (isEn ? cleanEn(s.en || s.label || s.name) : (s.label || s.name || s.en))).filter(Boolean).join(isEn ? ', ' : '، ');
  } else if (c.psh?.noSurgeries) {
    pshText = isEn ? 'No prior surgical history.' : 'سابقه عمل جراحی قبلی ندارد.';
  } else if (c.psh?.note && String(c.psh.note).trim()) {
    pshText = isEn ? cleanEn(c.psh.note) : String(c.psh.note).trim();
  } else {
    pshText = isEn ? 'Not documented.' : 'ثبت‌نشده.';
  }

  // 5. Drug Hx
  const drugs = [
    ...(Array.isArray(c.dh?.activeDrugs) ? c.dh.activeDrugs : []),
    ...(Array.isArray(c.dh?.customDrugs) ? c.dh.customDrugs : [])
  ];
  let dhText = '';
  if (drugs.length > 0) {
    dhText = drugs.map((dr) => {
      const nm = isEn ? cleanEn(dr.en || dr.name || dr.label) : (dr.name || dr.label || dr.en);
      const extra = [dr.dose, dr.sig].filter(Boolean).map((x) => (isEn ? cleanEn(x) : x)).join(' ');
      return extra ? `${nm} (${extra})` : nm;
    }).filter(Boolean).join(isEn ? ', ' : '، ');
  } else if (c.dh?.noRoutineMeds) {
    dhText = isEn ? 'No routine medications.' : 'داروی خاصی به صورت روتین مصرف نمی‌کند.';
  } else if (c.dh?.note && String(c.dh.note).trim()) {
    dhText = isEn ? cleanEn(c.dh.note) : String(c.dh.note).trim();
  } else {
    dhText = isEn ? 'Not documented.' : 'ثبت‌نشده.';
  }

  // 6. PAHx (Mandatory dedicated Ob/Gyn section!)
  const pahx = ob.gynScreeningAndRecords?.pahx || {};
  let pahxText = '';
  const anesTypes = Array.isArray(pahx.anesthesiaTypes) && pahx.anesthesiaTypes.length > 0
    ? pahx.anesthesiaTypes.map((a) => (isEn ? cleanEn(a) : a)).join(isEn ? ', ' : '، ')
    : '';
  const compStr = (pahx.complications || '').trim();
  if (pahx.hasPriorAnesthesia || anesTypes || compStr) {
    if (isEn) {
      const base = anesTypes || 'Prior anesthesia';
      const comp = compStr ? cleanEn(compStr, compStr) : 'without complications';
      pahxText = `${base} (${comp}).`;
    } else {
      const base = anesTypes || 'سابقه بیهوشی/بی‌حسی قبلی';
      const comp = compStr || 'بدون عارضه بیهوشی';
      pahxText = `${base} (${comp}).`;
    }
  } else {
    pahxText = isEn ? 'No prior anesthesia history.' : 'سابقه بیهوشی یا بی‌حسی قبلی ندارد.';
  }

  // 7. Allergy
  const ahSel = Array.isArray(c.ah?.selected) ? c.ah.selected : [];
  let allergyText = '';
  if (c.ah?.nkda) {
    allergyText = isEn ? 'No known drug or food allergies (NKDA).' : 'حساسیت دارویی یا غذایی شناخته‌شده‌ای ذکر نمی‌کند (NKDA).';
  } else if (ahSel.length > 0) {
    allergyText = ahSel.map((a) => {
      const lbl = isEn ? cleanEn(a.en || a.label) : (a.label || a.en);
      return a.detail ? `${lbl} (${isEn ? cleanEn(a.detail) : a.detail})` : lbl;
    }).join(isEn ? ', ' : '، ');
  } else if (c.ah?.note && String(c.ah.note).trim()) {
    allergyText = isEn ? cleanEn(c.ah.note) : String(c.ah.note).trim();
  } else {
    allergyText = isEn ? 'Not documented.' : 'ثبت‌نشده.';
  }

  return { pmhText, pshText, dhText, pahxText, allergyText };
}

function buildHpiSymptomSentences(ob, isEn) {
  const sub = ob.subMode === 'gynecology' ? 'gynecology' : 'obstetrics';
  const symMap = ob.ccAndHpi?.symptoms || {};
  const bank = OBGYN_SYMPTOM_BANK.filter((s) => s.subMode === sub);

  const posParts = [];
  const negParts = [];

  bank.forEach((item) => {
    const entry = symMap[item.id];
    if (!entry || (entry.state !== 1 && entry.state !== -1)) return; // Strict Not Assessed != Negative
    const label = isEn ? item.en : item.fa;
    if (entry.state === 1) {
      const mods = Array.isArray(entry.modifiers) && entry.modifiers.length > 0
        ? entry.modifiers.map((m) => {
            if (!isEn) return m;
            const idx = (item.modifiers || []).indexOf(m);
            if (idx >= 0 && item.modifiersEn?.[idx]) return item.modifiersEn[idx];
            return cleanEn(m);
          }).filter(Boolean)
        : [];
      const det = entry.detail && String(entry.detail).trim()
        ? (isEn ? cleanEn(entry.detail) : String(entry.detail).trim())
        : '';
      const qualifiers = [...mods, det].filter(Boolean);
      posParts.push(qualifiers.length > 0 ? `${label} (${qualifiers.join(isEn ? '; ' : '؛ ')})` : label);
    } else if (entry.state === -1) {
      negParts.push(label);
    }
  });

  // Also include any custom symptoms stored outside the filtered bank
  Object.entries(symMap).forEach(([id, entry]) => {
    if (!entry || (entry.state !== 1 && entry.state !== -1)) return;
    if (bank.some((b) => b.id === id)) return;
    const bankAny = OBGYN_SYMPTOM_BANK.find((b) => b.id === id);
    if (!bankAny) return;
    const label = isEn ? bankAny.en : bankAny.fa;
    if (entry.state === 1) {
      const det = entry.detail ? (isEn ? cleanEn(entry.detail) : entry.detail) : '';
      posParts.push(det ? `${label} (${det})` : label);
    } else {
      negParts.push(label);
    }
  });

  const sentences = [];
  if (posParts.length > 0) {
    sentences.push(isEn
      ? `Associated pertinent positive symptoms include ${posParts.join(', ')}.`
      : `از نظر علائم همراه، بیمار وجود ${posParts.join('، ')} را ذکر می‌کند.`);
  }
  if (negParts.length > 0) {
    sentences.push(isEn
      ? `The patient explicitly denies ${negParts.join(', ')}.`
      : `بیمار وجود ${negParts.join('، ')} را ذکر نمی‌کند.`);
  }
  return sentences.join(' ');
}

function buildArchetypeChronologyProse(ob, isEn) {
  const hpi = ob.ccAndHpi || {};
  const list = ob.subMode === 'gynecology' ? OBGYN_GYN_ARCHETYPES : OBGYN_OBSTETRIC_ARCHETYPES;
  const arch = list.find((a) => a.id === hpi.selectedArchetype);
  const fields = hpi.archetypeFields || {};

  const parts = [];
  if (arch) {
    const details = (arch.fields || []).map((f) => {
      const val = fields[f.key];
      if (!val || !String(val).trim()) return '';
      const fLabel = isEn ? f.en : f.fa;
      const vLabel = getFieldOptionLabel(list, arch.id, f.key, val, isEn);
      return `${fLabel}: ${vLabel}`;
    }).filter(Boolean);

    if (details.length > 0) {
      parts.push(isEn
        ? `Regarding the primary presentation (${arch.en}), clinical details include ${details.join('; ')}.`
        : `در شرح وضعیت فعلی (${arch.fa})، جزئیات بالینی شامل ${details.join('؛ ')} است.`);
    }
  }
  if (hpi.narrativeExtra && String(hpi.narrativeExtra).trim()) {
    parts.push(isEn ? cleanEn(hpi.narrativeExtra) : String(hpi.narrativeExtra).trim());
  }
  return parts.join(' ');
}

function buildAdcaOrdersLines(adca, isEn) {
  if (!adca || typeof adca !== 'object') return [];
  const fields = [
    ['A', 'Admission', adca.A_admission],
    ['D', 'Diagnosis', adca.D_diagnosis],
    ['C', 'Condition', adca.C_condition],
    ['A', 'Allergies', adca.A_allergies],
    ['V', 'Vital Signs', adca.V_vitals],
    ['A', 'Activity', adca.A_activity],
    ['N', 'Nursing', adca.N_nursing],
    ['D', 'Diet', adca.D_diet],
    ['I', 'IV Orders', adca.I_iv],
    ['M', 'Medications', adca.M_medications],
    ['L', 'Laboratory Studies', adca.L_labs],
    ['S', 'Special Orders', adca.S_special]
  ];
  const lines = [];
  fields.forEach(([letter, title, raw]) => {
    if (!raw || !String(raw).trim()) return;
    const text = isEn ? cleanEn(raw, String(raw).trim()) : String(raw).trim();
    lines.push(`- **${letter} (${title}):** ${text.replace(/\n+/g, ' | ')}`);
  });
  if (lines.length > 0 && (adca.physicianName || adca.dateTime)) {
    const sig = [adca.physicianName ? (isEn ? cleanEn(adca.physicianName) : adca.physicianName) : '', adca.dateTime || ''].filter(Boolean).join(' — ');
    if (sig) lines.push(isEn ? `- **Order Sign-Off:** ${sig}` : `- **امضا و زمان ثبت دستورات:** ${sig}`);
  }
  return lines;
}

function buildPeFindingsByGroups(ob, groupOrder, isEn, excludeInternalIfVirgin = false) {
  const findings = ob.pe?.findings || {};
  const isVirgin = Boolean(ob.obstetricIndex?.isVirgin);
  const sub = ob.subMode === 'gynecology' ? 'gynecology' : 'obstetrics';

  const lines = [];
  groupOrder.forEach((grp) => {
    const items = OBGYN_PE_BANK.filter((it) =>
      (it.subMode === 'both' || it.subMode === sub) && it.subGroup === grp
    );
    if (items.length === 0) return;

    const grpLabel = isEn ? items[0].subGroupEn : grp;
    const itemSentences = [];
    items.forEach((it) => {
      if (excludeInternalIfVirgin && isVirgin && it.isInternalPelvic) return;
      const entry = findings[it.id];
      if (!entry || (entry.state !== 1 && entry.state !== -1)) return; // Strict Not Assessed != Negative
      const name = isEn ? it.en : it.fa;
      const det = entry.detail && String(entry.detail).trim()
        ? (isEn ? cleanEn(entry.detail) : String(entry.detail).trim())
        : '';
      if (entry.state === 1) {
        itemSentences.push(det ? `${name}: ${det}` : (isEn ? `${name}: Positive / Normal baseline` : `${name}: مثبت / طبیعی`));
      } else {
        itemSentences.push(det ? `${name}: ${det}` : (isEn ? `${name}: Negative / Absent` : `${name}: منفی / ندارد`));
      }
    });

    if (itemSentences.length > 0) {
      lines.push(`- **${grpLabel}:** ${itemSentences.join(isEn ? '; ' : '؛ ')}`);
    }
  });
  return lines;
}

function generateObstetricsNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const gd = ob.gestationalDating || {};
  const hpi = ob.ccAndHpi || {};
  const shared = collectSharedHistories(clinicalState, ob, isEn);

  const patientName = isEn ? cleanEn(d.fullName, 'Unnamed Patient') : (d.fullName || 'بیمار بدون نام');
  const age = normalizeDigits(d.age || '') || '—';
  const ccText = isEn
    ? cleanEn(hpi.ccText || clinicalState.cc?.patientQuote, 'Obstetric evaluation')
    : (hpi.ccText || clinicalState.cc?.patientQuote || 'مراجعه جهت ارزیابی مامایی');
  const duration = isEn ? cleanEn(hpi.duration, 'recent onset') : (hpi.duration || 'اخیر');

  const formula = formatObstetricFormula(idx, 'obstetrics');
  const nd = idx.ND !== '' && idx.ND !== null && idx.ND !== undefined ? idx.ND : '0';
  const cs = idx.CS !== '' && idx.CS !== null && idx.CS !== undefined ? idx.CS : '0';
  const csIndStr = Number(cs) > 0 && idx.priorCsIndications
    ? (isEn ? ` due to ${cleanEn(idx.priorCsIndications)}` : ` به علت ${idx.priorCsIndications}`)
    : '';
  const bgRh = idx.maternalBgRh || (isEn ? 'Pending' : 'نامشخص');

  const gaCalc = calculateTripleGestationalAge(gd);
  const ntStr = gaCalc.gaByNt ? `GA = ${gaCalc.gaByNt.code}` : (isEn ? 'Not recorded' : 'ثبت‌نشده');
  const lmpStr = gaCalc.gaByLmp ? `GA = ${gaCalc.gaByLmp.code}` : (gd.isReliableLmp === false ? (isEn ? 'Unreliable LMP' : 'LMP نامطمئن') : (isEn ? 'Not recorded' : 'ثبت‌نشده'));
  const lastSonoStr = gaCalc.gaByLastSono ? `GA = ${gaCalc.gaByLastSono.code}` : (isEn ? 'Not recorded' : 'ثبت‌نشده');
  const eddStr = gaCalc.officialEdd || (isEn ? '—' : '—');

  // Opening Sentence (Section 2.4 Formula)
  const openingSentence = isEn
    ? `The patient is a ${age}-year-old **${formula}** woman (history of **${nd}** prior normal vaginal deliveries [ND] and **${cs}** cesarean sections [CS]${csIndStr}), blood group **${bgRh}**, at a gestational age of **${ntStr}** by first-trimester NT ultrasound, **${lmpStr}** by LMP (${gd.lmpDate || '—'}), and **${lastSonoStr}** by last ultrasound (${gd.lastSonoDate || '—'}) (Official EDD: **${eddStr}**), who presents with ${ccText} starting ${duration} prior to arrival.`
    : `بیمار خانم ${age} ساله، **${formula}** (با سابقه **${nd}** زایمان طبیعی [ND] و **${cs}** سزارین [CS]${csIndStr})، گروه خونی **${bgRh}**، با سن بارداری **${ntStr}** بر اساس سونوگرافی NT، **${lmpStr}** بر اساس LMP (${gd.lmpDate || '—'})، و **${lastSonoStr}** بر اساس آخرین سونوگرافی (${gd.lastSonoDate || '—'}) (EDD رسمی: **${eddStr}**) می‌باشد که از ${duration} قبل با شکایت «${ccText}» به این مرکز مراجعه کرده است.`;

  const archProse = buildArchetypeChronologyProse(ob, isEn);
  const symProse = buildHpiSymptomSentences(ob, isEn);

  // Past Obstetric History Paragraph
  const poh = ob.pastObstetricHistory || {};
  const flags = poh.priorComplicationFlags || {};
  const flagLabels = [
    ['priorIugr', 'IUGR', 'IUGR'],
    ['priorPreeclampsia', 'Preeclampsia', 'پره‌اکلامپسی'],
    ['priorPph', 'PPH', 'خونریزی پس از زایمان (PPH)'],
    ['priorPretermLabor', 'Preterm labor', 'زایمان زودرس'],
    ['priorGdm', 'GDM', 'دیابت بارداری (GDM)'],
    ['priorPlacentaAccretaOrPrevia', 'Placenta previa/accreta', 'جفت پرویا یا آکرتا'],
    ['priorShoulderDystociaOrMacrosomia', 'Shoulder dystocia/macrosomia', 'دیستوشی شانه یا ماکروزومی'],
    ['priorNicuOrAnomaly', 'NICU admission/anomaly', 'بستری NICU یا آنومالی']
  ].filter(([k]) => flags[k]).map(([, enL, faL]) => (isEn ? enL : faL));

  const pregRows = (poh.pregnancies || []).map((p, idxRow) => {
    const out = isEn ? cleanEn(p.outcomeType, p.outcomeType) : p.outcomeType;
    const ga = p.gaAtOutcomeWeeks ? `${p.gaAtOutcomeWeeks}w` : '';
    const wt = p.birthWeightGrams ? `${p.birthWeightGrams}g` : '';
    const reason = p.csIndicationOrLossMethod ? (isEn ? cleanEn(p.csIndicationOrLossMethod) : p.csIndicationOrLossMethod) : '';
    const yr = p.yearOrChildAge ? (isEn ? cleanEn(p.yearOrChildAge) : p.yearOrChildAge) : '';
    return `G${p.orderNumber || idxRow + 1}: ${[yr, out, ga, wt, reason].filter(Boolean).join(', ')}`;
  });

  let pohText = '';
  if (pregRows.length > 0 || flagLabels.length > 0) {
    if (isEn) {
      pohText = [
        pregRows.length ? `Prior pregnancies: ${pregRows.join(' | ')}.` : '',
        flagLabels.length ? `Notable prior obstetric complications: ${flagLabels.join(', ')}.` : ''
      ].filter(Boolean).join(' ');
    } else {
      pohText = [
        pregRows.length ? `**پیامدهای بارداری قبلی:** ${pregRows.join(' | ')}.` : '',
        flagLabels.length ? `سوابق عوارض مامایی قبلی شامل: ${flagLabels.join('، ')}.` : ''
      ].filter(Boolean).join(' ');
    }
  }

  // Rh follow-up if Rh negative
  const rhNote = /[-−]/.test(idx.maternalBgRh || '') && (idx.paternalBgRh || idx.indirectCoombsRhogam)
    ? (isEn
        ? `Paternal Blood Group: ${idx.paternalBgRh || '—'}; Indirect Coombs / RhoGAM: ${cleanEn(idx.indirectCoombsRhogam, '—')}.`
        : `گروه خونی همسر: ${idx.paternalBgRh || '—'}؛ وضعیت کومبس غیرمستقیم / روگام: ${idx.indirectCoombsRhogam || '—'}.`)
    : '';

  // 8. Last Obstetric Ultrasound (6 Checkpoints) + Antenatal Audit + NST
  const us = ob.paraclinics?.lastObstetricUltrasound || {};
  const usLines = [
    us.presentation ? (isEn ? `- **Fetal Presentation:** ${cleanEn(us.presentation)}` : `- **پرزانتاسیون جنین:** ${us.presentation}`) : '',
    us.placentalLocationAndGrade ? (isEn ? `- **Placental Location:** ${cleanEn(us.placentalLocationAndGrade)}` : `- **محل جفت:** ${us.placentalLocationAndGrade}`) : '',
    us.amnioticFluidVolume ? (isEn ? `- **Amniotic Fluid Volume:** ${cleanEn(us.amnioticFluidVolume)}` : `- **میزان مایع آمنیوتیک:** ${us.amnioticFluidVolume}`) : '',
    us.sonographicGa ? (isEn ? `- **Sonographic GA:** ${cleanEn(us.sonographicGa)}` : `- **سن بارداری سونوگرافی:** ${us.sonographicGa}`) : '',
    us.efwGramsAndPercentile ? (isEn ? `- **Estimated Fetal Weight (EFW):** ${cleanEn(us.efwGramsAndPercentile)}` : `- **وزن تخمینی جنین و صدک:** ${us.efwGramsAndPercentile}`) : '',
    us.placentaAccretaColorDoppler ? (isEn ? `- **Placenta Accreta Color Doppler:** ${cleanEn(us.placentaAccretaColorDoppler)}` : `- **نتیجه کالرداپلر آکرتای جفت:** ${us.placentaAccretaColorDoppler}`) : '',
    us.bppScore || us.umbilicalAndMcaDoppler || us.cervicalLengthMm
      ? (isEn
          ? `- **BPP / Doppler / CL:** ${[us.bppScore ? `BPP ${us.bppScore}` : '', cleanEn(us.umbilicalAndMcaDoppler), us.cervicalLengthMm ? `CL ${us.cervicalLengthMm}` : ''].filter(Boolean).join(' | ')}`
          : `- **BPP / داپلر / طول سرویکس:** ${[us.bppScore ? `BPP ${us.bppScore}` : '', us.umbilicalAndMcaDoppler, us.cervicalLengthMm ? `CL ${us.cervicalLengthMm}` : ''].filter(Boolean).join(' | ')}`)
      : ''
  ].filter(Boolean);

  // Antenatal Screening Audit
  const ac = ob.antenatalCareChecklist || {};
  const acAuditParts = [
    ac.careRegularity ? (isEn ? cleanEn(ac.careRegularity) : ac.careRegularity) : '',
    ac.firstTrimesterScreening?.ntScanDone ? (isEn ? `1st-Trimester NT: ${ac.firstTrimesterScreening.ntMeasurementMm || 'Done'} mm, NB: ${cleanEn(ac.firstTrimesterScreening.nasalBone, '—')}, Risk: ${ac.firstTrimesterScreening.doubleMarkerRisk || '—'}` : `غربالگری سه‌ماهه اول: NT=${ac.firstTrimesterScreening.ntMeasurementMm || 'انجام شده'}mm، NB: ${ac.firstTrimesterScreening.nasalBone || '—'}، ریسک: ${ac.firstTrimesterScreening.doubleMarkerRisk || '—'}`) : '',
    ac.secondTrimesterScreening?.anomalyScanDone ? (isEn ? `Anomaly scan: ${cleanEn(ac.secondTrimesterScreening.anomalyScanResult, 'Done')}` : `آنومالی اسکن: ${ac.secondTrimesterScreening.anomalyScanResult || 'انجام شده'}`) : '',
    ac.secondTrimesterScreening?.amniocentesisOrNipt ? (isEn ? `Amniocentesis/NIPT: ${cleanEn(ac.secondTrimesterScreening.amniocentesisOrNipt)}` : `آمنیوسنتز/NIPT: ${ac.secondTrimesterScreening.amniocentesisOrNipt}`) : '',
    ac.routineAntenatalLabsAudit?.gdmScreening75gOgtt ? (isEn ? `OGTT: ${cleanEn(ac.routineAntenatalLabsAudit.gdmScreening75gOgtt)}` : `OGTT: ${ac.routineAntenatalLabsAudit.gdmScreening75gOgtt}`) : '',
    ac.routineAntenatalLabsAudit?.hemoglobinAndAnemia ? (isEn ? `Hb/Anemia: ${cleanEn(ac.routineAntenatalLabsAudit.hemoglobinAndAnemia)}` : `هموگلوبین/آنمی: ${ac.routineAntenatalLabsAudit.hemoglobinAndAnemia}`) : '',
    ac.routineAntenatalLabsAudit?.plateletCount ? (isEn ? `Platelets: ${cleanEn(ac.routineAntenatalLabsAudit.plateletCount)}` : `پلاکت: ${ac.routineAntenatalLabsAudit.plateletCount}`) : '',
    ac.routineAntenatalLabsAudit?.viralMarkers ? (isEn ? `Viral Markers: ${cleanEn(ac.routineAntenatalLabsAudit.viralMarkers)}` : `ویرال مارکرها: ${ac.routineAntenatalLabsAudit.viralMarkers}`) : '',
    ac.notableSonographicFindingsInPregnancy?.uterineFibroids ? (isEn ? `Fibroids: ${cleanEn(ac.notableSonographicFindingsInPregnancy.uterineFibroids)}` : `فیبروم: ${ac.notableSonographicFindingsInPregnancy.uterineFibroids}`) : '',
    ac.notableSonographicFindingsInPregnancy?.placentaPreviaHistory ? (isEn ? `Previa Hx: ${cleanEn(ac.notableSonographicFindingsInPregnancy.placentaPreviaHistory)}` : `سابقه جفت پرویا: ${ac.notableSonographicFindingsInPregnancy.placentaPreviaHistory}`) : ''
  ].filter(Boolean);

  // NST / Fetal Monitoring (5-step PDF 4 Slide 33)
  const fm = ob.paraclinics?.fetalMonitoring || {};
  let nstLine = '';
  if (fm.baselineBpm || fm.variability || fm.accelerations || (fm.decelerations?.type && fm.decelerations.type !== 'None')) {
    const nichd = evaluateNichdCategory(fm);
    const dec = fm.decelerations || {};
    const decStr = dec.type && dec.type !== 'None'
      ? `${dec.type}${dec.isRecurrent ? (isEn ? ' (Recurrent)' : ' (راجعه)') : ''}${dec.cordCompressionPatternVariant && dec.cordCompressionPatternVariant !== 'None' ? ` [${dec.cordCompressionPatternVariant}]` : ''}`
      : (isEn ? 'No decelerations' : 'فاقد افت ضربان');
    nstLine = isEn
      ? `- **${fm.testType || 'NST'} (5-Step EFM):** Baseline ${fm.baselineBpm || '—'} bpm, Variability: ${fm.variability || '—'}, Accelerations: ${cleanEn(fm.accelerations, '—')}, Decelerations: ${decStr}, Contractions: ${cleanEn(fm.contractionsIn10Min, '—')} — **${fm.nichdCategory || nichd.labelEn}**`
      : `- **${fm.testType || 'NST'} (تفسیر ۵ مرحله‌ای):** پایه (Baseline): ${fm.baselineBpm || '—'} bpm، تغییرپذیری (Variability): ${fm.variability || '—'}، تسریع (Accelerations): ${fm.accelerations || '—'}، افت ضربان (Decelerations): ${decStr}، انقباضات: ${fm.contractionsIn10Min || '—'} — **${fm.nichdCategory || nichd.labelFa}**`;
  }

  // Key Labs
  const kl = ob.paraclinics?.keyLabs || {};
  const labItems = [
    kl.bhcg ? `β-hCG: ${kl.bhcg}` : '',
    kl.wbc ? `WBC: ${kl.wbc}` : '',
    kl.hb ? `Hb: ${kl.hb}` : '',
    kl.plt ? `Plt: ${kl.plt}` : '',
    kl.cr ? `Cr: ${kl.cr}` : '',
    kl.ast ? `AST: ${kl.ast}` : '',
    kl.alt ? `ALT: ${kl.alt}` : '',
    kl.ldh ? `LDH: ${kl.ldh}` : '',
    kl.urinePrCr ? `Urine Pr/Cr: ${kl.urinePrCr}` : '',
    kl.ptInr ? `PT/INR: ${kl.ptInr}` : '',
    kl.tsh ? `TSH: ${kl.tsh}` : '',
    kl.ogtt75 ? `OGTT 75g: ${kl.ogtt75}` : ''
  ].filter(Boolean);

  // 9. Vitals
  const v = ob.pe?.vitals || {};
  const vitalsLine = [
    v.bp ? `BP: ${v.bp}${v.bpRepeat ? ` (${isEn ? 'Repeat' : 'تکرار'}: ${v.bpRepeat})` : ''}` : '',
    v.pr ? `PR: ${v.pr}` : '',
    v.rr ? `RR: ${v.rr}` : '',
    v.temp ? `T: ${v.temp}` : '',
    v.urineDipstick ? `Urine Dipstick: ${v.urineDipstick}` : ''
  ].filter(Boolean).join(' | ');

  // 10. Obstetric Abdomen, FHR & FH
  const om = ob.pe?.obsMeasurements || {};
  const fhrFhParts = [
    om.fhr ? `FHR: ${om.fhr} bpm${om.fhrQuadrant ? ` (${om.fhrQuadrant})` : ''}` : '',
    om.fundalHeightCm ? `${isEn ? 'Fundal Height (FH)' : 'ارتفاع رحم (FH)'}: ${om.fundalHeightCm} cm` : ''
  ].filter(Boolean);

  const peAbdomenAndExtLines = buildPeFindingsByGroups(ob, [
    'معاینه شکم حاملگی و سمع FHR',
    'معاینه اندام‌ها و رفلکس‌ها (DTR)'
  ], isEn, false);

  // 11. TV & Pelvimetry + Bishop Score
  const tvParts = [
    om.dilationCm !== '' && om.dilationCm !== undefined ? `${isEn ? 'Dilation' : 'دیلاتاسیون'}: ${om.dilationCm} cm` : '',
    om.effacementPct !== '' && om.effacementPct !== undefined ? `${isEn ? 'Effacement' : 'افاسمان'}: ${om.effacementPct}%` : '',
    om.stationValue !== '' && om.stationValue !== undefined ? `Station (${om.stationScale === '3' ? '-3..+3' : '-5..+5'}): ${om.stationValue}` : '',
    om.presentingPart ? `${isEn ? 'Presenting Part' : 'عضو پرزانته'}: ${isEn ? cleanEn(om.presentingPart) : om.presentingPart}` : '',
    om.membranesStatus ? `${isEn ? 'Membranes' : 'وضعیت پرده‌ها'}: ${isEn ? cleanEn(om.membranesStatus) : om.membranesStatus}${om.amnioticFluidChar ? ` (${isEn ? cleanEn(om.amnioticFluidChar) : om.amnioticFluidChar})` : ''}` : ''
  ].filter(Boolean);

  const bishop = calculateBishopScore(om);
  const tvPeLines = idx.isVirgin
    ? [isEn ? '- **Pelvic / TV Exam:** Patient is Virgin; digital vaginal and speculum exams deferred.' : '- **معاینه واژینال:** با توجه به Virgin بودن بیمار، معاینه با اسپکولوم و توشه واژینال (TV) انجام نشد.']
    : buildPeFindingsByGroups(ob, ['معاینه واژینال مامایی (TV) و لگن'], isEn, true);

  // 12. DDx & 13. Plan + ADCA VAN DIMLS
  const ap = ob.assessmentAndPlan || {};
  const ddxList = [
    ...(Array.isArray(ap.ddx) ? ap.ddx.map((x) => (isEn ? cleanEn(x) : x)) : []),
    ...(ap.ddxCustom ? ap.ddxCustom.split(/\n+/).map((x) => (isEn ? cleanEn(x) : x.trim())).filter(Boolean) : [])
  ];
  const orderLines = buildAdcaOrdersLines(ap.adcaVanDimls, isEn);

  const dateDisplay = ap.adcaVanDimls?.dateTime || new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');

  if (isEn) {
    return [
      `> **Patient Demographics:** ${patientName} | Age: ${age} | ${formula} | Date: ${dateDisplay}`,
      `### OBSTETRICS & GYNECOLOGY WARD ADMISSION NOTE (OBSTETRIC PATIENT)`,
      `**1. Chief Complaint (CC):** "${ccText}"`,
      `### 2. History of Present Illness (PI)\n${openingSentence}${rhNote ? ` ${rhNote}` : ''}\n\n${[archProse, symProse].filter(Boolean).join(' ')}\n\n${pohText}`.trim(),
      `### 3–7. Core Histories & Past Anesthesia History (PAHx)\n- **3. PMHx:** ${shared.pmhText}\n- **4. PSHx:** ${shared.pshText}\n- **5. Drug Hx:** ${shared.dhText}\n- **6. PAHx:** ${shared.pahxText}\n- **7. Allergies:** ${shared.allergyText}`,
      `### 8. Last Obstetric Ultrasound, Antenatal Screening & Fetal Surveillance\n${usLines.length ? usLines.join('\n') : '- Last obstetric ultrasound not yet recorded.'}${acAuditParts.length ? `\n- **Antenatal Screening & Labs Audit:** ${acAuditParts.join(' | ')}` : ''}${labItems.length ? `\n- **Admission Labs:** ${labItems.join(' | ')}` : ''}${ob.paraclinics?.keyLabsNote ? `\n- **Lab Notes:** ${cleanEn(ob.paraclinics.keyLabsNote)}` : ''}${nstLine ? `\n${nstLine}` : ''}`,
      `### 9. Vital Signs\n- ${vitalsLine || 'Vital signs not yet recorded.'}`,
      `### 10. Obstetric Abdominal Exam & FHR\n${fhrFhParts.length ? `- ${fhrFhParts.join(' | ')}\n` : ''}${peAbdomenAndExtLines.length ? peAbdomenAndExtLines.join('\n') : (!fhrFhParts.length ? '- Not yet assessed.' : '')}`,
      `### 11. Vaginal Exam (TV), Clinical Pelvimetry & Extremities\n${!idx.isVirgin && tvParts.length ? `- **TV Measurements:** ${tvParts.join(' | ')}${bishop.assessedCount > 0 ? ` — **${bishop.labelEn}**` : ''}\n` : ''}${tvPeLines.length ? tvPeLines.join('\n') : (!tvParts.length ? '- Not yet assessed.' : '')}`,
      `### 12. Differential Diagnoses (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- Pending clinical synthesis.'}`,
      `### 13. Management Plan & Admission Orders (ADCA VAN DIMLS)\n${ap.planSummary ? `${cleanEn(ap.planSummary)}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- Admission orders not yet entered.'}`
    ].filter(Boolean).join('\n\n');
  }

  return [
    `> **مشخصات هویتی بیمار:** نام و نام خانوادگی: **${patientName}** | سن: **${age} ساله** | فرمول مامایی: **${formula}** | تاریخ: **${dateDisplay}**`,
    `### شرح حال بخش زنان و زایمان (خانم باردار)`,
    `**۱. CC:** «${ccText}»`,
    `### ۲. PI (شرح بیماری فعلی و سوابق بارداری)\n${openingSentence}${rhNote ? ` ${rhNote}` : ''}\n\n${[archProse, symProse].filter(Boolean).join(' ')}\n\n${pohText}`.trim(),
    `### ۳ تا ۷. سوابق بالینی و سابقه بیهوشی (PAHx)\n- **۳. PMHx:** ${shared.pmhText}\n- **۴. PSHx:** ${shared.pshText}\n- **۵. Drug Hx:** ${shared.dhText}\n- **۶. PAHx:** ${shared.pahxText}\n- **۷. Allergy:** ${shared.allergyText}`,
    `### ۸. آخرین سونوگرافی بارداری، غربالگری‌ها و آزمایشات\n${usLines.length ? usLines.join('\n') : '- آخرین سونوگرافی بارداری هنوز ثبت نشده است.'}${acAuditParts.length ? `\n- **بررسی مدارک، غربالگری‌ها و آزمایشات قبلی:** ${acAuditParts.join(' | ')}` : ''}${labItems.length ? `\n- **آزمایشات بدو پذیرش:** ${labItems.join(' | ')}` : ''}${ob.paraclinics?.keyLabsNote ? `\n- **توضیحات آزمایشات:** ${ob.paraclinics.keyLabsNote}` : ''}${nstLine ? `\n${nstLine}` : ''}`,
    `### ۹. علائم حیاتی (Vital Signs)\n- ${vitalsLine || 'علائم حیاتی هنوز ثبت نشده است.'}`,
    `### ۱۰. معاینه شکم حاملگی و سمع FHR\n${fhrFhParts.length ? `- ${fhrFhParts.join(' | ')}\n` : ''}${peAbdomenAndExtLines.length ? peAbdomenAndExtLines.join('\n') : (!fhrFhParts.length ? '- هنوز ارزیابی نشده است.' : '')}`,
    `### ۱۱. معاینه TV، معاینه لگن و رفلکس‌ها\n${!idx.isVirgin && tvParts.length ? `- **یافته‌های TV:** ${tvParts.join(' | ')}${bishop.assessedCount > 0 ? ` — **${bishop.labelFa}**` : ''}\n` : ''}${tvPeLines.length ? tvPeLines.join('\n') : (!tvParts.length ? '- هنوز ارزیابی نشده است.' : '')}`,
    `### ۱۲. تشخیص‌های افتراقی (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- در حال جمع‌بندی بالینی.'}`,
    `### ۱۳. برنامه درمانی (Plan) و دستورات بستری (ADCA VAN DIMLS)\n${ap.planSummary ? `${ap.planSummary}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- دستورات بستری هنوز ثبت نشده است.'}`
  ].filter(Boolean).join('\n\n');
}

function generateGynecologyNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const mh = ob.menstrualHistory || {};
  const gsr = ob.gynScreeningAndRecords || {};
  const hpi = ob.ccAndHpi || {};
  const shared = collectSharedHistories(clinicalState, ob, isEn);

  const patientName = isEn ? cleanEn(d.fullName, 'Unnamed Patient') : (d.fullName || 'بیمار بدون نام');
  const age = normalizeDigits(d.age || '') || '—';
  const ccText = isEn
    ? cleanEn(hpi.ccText || clinicalState.cc?.patientQuote, 'Gynecologic evaluation')
    : (hpi.ccText || clinicalState.cc?.patientQuote || 'مراجعه جهت ارزیابی ژنیکولوژی');
  const duration = isEn ? cleanEn(hpi.duration, 'recent onset') : (hpi.duration || 'اخیر');

  const maritalMap = {
    married: isEn ? 'married' : 'متأهل',
    single: isEn ? 'single' : 'مجرد',
    divorced: isEn ? 'divorced' : 'مطلقه',
    widowed: isEn ? 'widowed' : 'همسر فوت‌شده'
  };
  const reproMap = {
    reproductive: isEn ? 'reproductive age' : 'در سنین باروری',
    perimenopausal: isEn ? 'perimenopausal' : 'در دوره حوالی یائسگی (پری‌منوپوز)',
    postmenopausal: isEn ? `postmenopausal (since age ${mh.menopauseAge || idx.menopauseAge || '—'})` : `یائسه (سن یائسگی: ${mh.menopauseAge || idx.menopauseAge || '—'} سال)`,
    pregnant: isEn ? 'pregnant' : 'باردار',
    postpartum: isEn ? 'postpartum' : 'دوره پس از زایمان'
  };

  const formula = formatObstetricFormula(idx, 'gynecology');
  const nd = idx.ND !== '' && idx.ND !== null && idx.ND !== undefined ? idx.ND : '0';
  const cs = idx.CS !== '' && idx.CS !== null && idx.CS !== undefined ? idx.CS : '0';
  const marriageDur = idx.marriageDurationYears
    ? (isEn ? ` (married ${idx.marriageDurationYears} years)` : ` (مدت ازدواج: ${idx.marriageDurationYears} سال)`)
    : '';

  const regText = mh.regularity === 'irregular' ? (isEn ? 'irregular' : 'نامنظم') : (isEn ? 'regular' : 'منظم');
  const flowMap = {
    light: isEn ? 'light' : 'کم‌حجم',
    normal: isEn ? 'moderate/normal' : 'متوسط/طبیعی',
    heavy: isEn ? 'heavy (hypermenorrhea)' : 'شدید (همراه با دفع لخته / تعویض مکرر پد)'
  };
  const contraObj = CONTRACEPTION_MAP[gsr.contraception?.currentMethod || 'none'];
  const contraStr = contraObj ? (isEn ? contraObj.en : contraObj.fa) : (isEn ? 'None' : 'ندارد');
  const lmpDateStr = mh.lmpDate || ob.gestationalDating?.lmpDate || '—';

  const openingSentence = isEn
    ? `The patient is a ${age}-year-old ${maritalMap[idx.maritalStatus] || 'married'}${marriageDur} **${formula}** ${reproMap[idx.reproductiveStatus] || 'reproductive-age'} woman (${nd} prior NVD, ${cs} prior CS), with an LMP of ${lmpDateStr}, a ${regText} menstrual pattern (${mh.cycleIntervalDays || '—'}-day cycles, ${mh.bleedingDurationDays || '—'} days duration, ${flowMap[mh.flowVolume] || 'moderate'} flow${mh.padsPerDay ? `, ${mh.padsPerDay} pads/day` : ''}), using ${contraStr} for contraception, who presents with a ${duration} history of ${ccText}.`
    : `بیمار خانم ${age} ساله، ${maritalMap[idx.maritalStatus] || 'متأهل'}${marriageDur}، **${formula}** (سابقه ${nd} زایمان طبیعی و ${cs} سزارین)، ${reproMap[idx.reproductiveStatus] || 'در سنین باروری'}، با LMP مورخ ${lmpDateStr} و الگوی منس ${regText} (طول سیکل ${mh.cycleIntervalDays || '—'} روز، مدت خونریزی ${mh.bleedingDurationDays || '—'} روز، با حجم ${flowMap[mh.flowVolume] || 'متوسط'}${mh.padsPerDay ? `، مصرف ${mh.padsPerDay} پد در روز` : ''})، و روش پیشگیری از بارداری ${contraStr} می‌باشد که از ${duration} قبل به علت «${ccText}» مراجعه کرده است.`;

  const archProse = buildArchetypeChronologyProse(ob, isEn);
  const symProse = buildHpiSymptomSentences(ob, isEn);

  // Prior Records, Pathology, Pap Smear, HPV, TVS/TAS & Labs
  const scr = gsr.cervicalAndBreastScreening || {};
  const pathRecs = Array.isArray(gsr.priorPathologyAndCurettage?.records) ? gsr.priorPathologyAndCurettage.records : [];
  const tvs = ob.paraclinics?.gynecologicUltrasound || {};
  const kl = ob.paraclinics?.keyLabs || {};

  const recordBullets = [
    scr.lastPapSmearResult && scr.lastPapSmearResult !== 'انجام نشده'
      ? (isEn ? `- **Pap Smear (${scr.lastPapSmearDate || 'recent'}):** ${cleanEn(scr.lastPapSmearResult)}` : `- **پاپ‌اسمیر (${scr.lastPapSmearDate || 'اخیر'}):** ${scr.lastPapSmearResult}`)
      : '',
    scr.hpvTestStatus && scr.hpvTestStatus !== 'انجام نشده'
      ? (isEn ? `- **HPV DNA Test:** ${cleanEn(scr.hpvTestStatus)}` : `- **تست HPV:** ${scr.hpvTestStatus}`)
      : '',
    pathRecs.length > 0
      ? (isEn
          ? `- **Prior D&C / Biopsy Pathology:** ${pathRecs.map((r) => `${cleanEn(r.procedureType)} (${r.date || '—'}): ${cleanEn(r.pathologyResult)}`).join(' | ')}`
          : `- **جواب پاتولوژی کورتاژ و عمل‌های قبلی:** ${pathRecs.map((r) => `${r.procedureType} (${r.date || '—'}): ${r.pathologyResult}`).join(' | ')}`)
      : '',
    (tvs.uterusDimensionsMm || tvs.myometrialEchoAndMyomas || tvs.endometrialThicknessMm || tvs.rightOvary || tvs.leftOvary)
      ? (isEn
          ? `- **Pelvic Ultrasound (${tvs.scanType || 'TVS'} ${tvs.scanDate || ''}):** ${[
              tvs.uterusDimensionsMm ? `Uterus ${tvs.uterusDimensionsMm}` : '',
              tvs.myometrialEchoAndMyomas ? cleanEn(tvs.myometrialEchoAndMyomas) : '',
              tvs.endometrialThicknessMm ? `ET ${tvs.endometrialThicknessMm} mm` : '',
              tvs.rightOvary ? `Right ovary: ${cleanEn(tvs.rightOvary)}` : '',
              tvs.leftOvary ? `Left ovary: ${cleanEn(tvs.leftOvary)}` : '',
              tvs.culDeSacFreeFluid ? `Cul-de-sac: ${cleanEn(tvs.culDeSacFreeFluid)}` : ''
            ].filter(Boolean).join('; ')}`
          : `- **سونوگرافی (${tvs.scanType || 'TVS'} ${tvs.scanDate || ''}):** ${[
              tvs.uterusDimensionsMm ? `ابعاد رحم ${tvs.uterusDimensionsMm}` : '',
              tvs.myometrialEchoAndMyomas || '',
              tvs.endometrialThicknessMm ? `ضخامت اندومتر (ET) ${tvs.endometrialThicknessMm} mm` : '',
              tvs.rightOvary ? `تخمدان راست: ${tvs.rightOvary}` : '',
              tvs.leftOvary ? `تخمدان چپ: ${tvs.leftOvary}` : '',
              tvs.culDeSacFreeFluid ? `کل‌دوساک: ${tvs.culDeSacFreeFluid}` : ''
            ].filter(Boolean).join('؛ ')}`)
      : ''
  ].filter(Boolean);

  const labItems = [
    kl.bhcg ? `β-hCG: ${kl.bhcg}` : '',
    kl.wbc ? `WBC: ${kl.wbc}` : '',
    kl.hb ? `Hb: ${kl.hb}` : '',
    kl.plt ? `Plt: ${kl.plt}` : '',
    kl.tsh ? `TSH: ${kl.tsh}` : '',
    kl.ptInr ? `PT/INR: ${kl.ptInr}` : '',
    kl.cr ? `Cr: ${kl.cr}` : ''
  ].filter(Boolean);
  if (labItems.length > 0) {
    recordBullets.push(isEn ? `- **Admission Labs:** ${labItems.join(' | ')}` : `- **آزمایشات بدو مراجعه:** ${labItems.join(' | ')}`);
  }

  // 8. Vitals
  const v = ob.pe?.vitals || {};
  const vitalsLine = [
    v.bp ? `BP: ${v.bp}` : '',
    v.pr ? `PR: ${v.pr}` : '',
    v.rr ? `RR: ${v.rr}` : '',
    v.temp ? `T: ${v.temp}` : ''
  ].filter(Boolean).join(' | ');

  // 9. Breast/Abd + Speculum + Bimanual (respecting isVirgin!)
  const abdLines = buildPeFindingsByGroups(ob, ['معاینه پستان و شکم'], isEn, false);
  const pelvicLines = idx.isVirgin
    ? [
        ...buildPeFindingsByGroups(ob, ['معاینه با اسپکولوم و ژنیتال خارجی'], isEn, true),
        isEn
          ? '- **Speculum & Bimanual Pelvic Exam:** Patient is Virgin; internal speculum and bimanual vaginal examination deferred.'
          : '- **معاینه اسپکولوم و دودستی لگن:** با توجه به Virgin بودن بیمار، معاینه با اسپکولوم و توشه واژینال انجام نشد.'
      ]
    : buildPeFindingsByGroups(ob, ['معاینه با اسپکولوم و ژنیتال خارجی', 'معاینه دودستی لگن (Bimanual Exam)'], isEn, false);

  const ap = ob.assessmentAndPlan || {};
  const ddxList = [
    ...(Array.isArray(ap.ddx) ? ap.ddx.map((x) => (isEn ? cleanEn(x) : x)) : []),
    ...(ap.ddxCustom ? ap.ddxCustom.split(/\n+/).map((x) => (isEn ? cleanEn(x) : x.trim())).filter(Boolean) : [])
  ];
  const orderLines = buildAdcaOrdersLines(ap.adcaVanDimls, isEn);
  const dateDisplay = ap.adcaVanDimls?.dateTime || new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');

  if (isEn) {
    return [
      `> **Patient Demographics:** ${patientName} | Age: ${age} | ${formula} | Date: ${dateDisplay}`,
      `### OBSTETRICS & GYNECOLOGY WARD ADMISSION NOTE (GYNECOLOGY PATIENT)`,
      `**1. Chief Complaint (CC):** "${ccText}"`,
      `### 2. History of Present Illness (PI)\n${openingSentence}\n\n${[archProse, symProse].filter(Boolean).join(' ')}`.trim(),
      `### 3–7. Core Histories & Past Anesthesia History (PAHx)\n- **3. PMHx:** ${shared.pmhText}\n- **4. PSHx:** ${shared.pshText}\n- **5. Drug Hx:** ${shared.dhText}\n- **6. PAHx:** ${shared.pahxText}\n- **7. Allergies:** ${shared.allergyText}`,
      `### Prior Labs, Ultrasounds, Pathology, Pap Smear & HPV Audit\n${recordBullets.length ? recordBullets.join('\n') : '- No prior records entered.'}`,
      `### 8. Vital Signs\n- ${vitalsLine || 'Vital signs not yet recorded.'}`,
      `### 9. Physical, Speculum & Bimanual Pelvic Exam\n${[...abdLines, ...pelvicLines].length ? [...abdLines, ...pelvicLines].join('\n') : '- Not yet assessed.'}`,
      `### 10. Differential Diagnoses (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- Pending clinical synthesis.'}`,
      `### 11. Management Plan & Admission Orders (ADCA VAN DIMLS)\n${ap.planSummary ? `${cleanEn(ap.planSummary)}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- Admission orders not yet entered.'}`
    ].filter(Boolean).join('\n\n');
  }

  return [
    `> **مشخصات هویتی بیمار:** نام و نام خانوادگی: **${patientName}** | سن: **${age} ساله** | فرمول مامایی: **${formula}** | تاریخ: **${dateDisplay}**`,
    `### شرح حال بخش زنان و زایمان (ژنیکولوژی)`,
    `**۱. CC:** «${ccText}»`,
    `### ۲. PI (شرح بیماری فعلی و الگوی قاعدگی)\n${openingSentence}\n\n${[archProse, symProse].filter(Boolean).join(' ')}`.trim(),
    `### ۳ تا ۷. سوابق بالینی و سابقه بیهوشی (PAHx)\n- **۳. PMHx:** ${shared.pmhText}\n- **۴. PSHx:** ${shared.pshText}\n- **۵. Drug Hx:** ${shared.dhText}\n- **۶. PAHx:** ${shared.pahxText}\n- **۷. Allergy:** ${shared.allergyText}`,
    `### بررسی آزمایشات، سونوگرافی‌ها، پاتولوژی‌ها، پاپ‌اسمیر و تست HPV قبلی\n${recordBullets.length ? recordBullets.join('\n') : '- مدرک یا سونوگرافی قبلی ثبت نشده است.'}`,
    `### ۸. علائم حیاتی (Vital Signs)\n- ${vitalsLine || 'علائم حیاتی هنوز ثبت نشده است.'}`,
    `### ۹. معاینه شکم، اسپکولوم واژینال و معاینه دودستی لگن\n${[...abdLines, ...pelvicLines].length ? [...abdLines, ...pelvicLines].join('\n') : '- هنوز ارزیابی نشده است.'}`,
    `### ۱۰. تشخیص‌های افتراقی (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- در حال جمع‌بندی بالینی.'}`,
    `### ۱۱. برنامه درمانی (Plan) و دستورات بستری (ADCA VAN DIMLS)\n${ap.planSummary ? `${ap.planSummary}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- دستورات بستری هنوز ثبت نشده است.'}`
  ].filter(Boolean).join('\n\n');
}

function generateSoapeAndDischargeNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const patientName = isEn ? cleanEn(d.fullName, 'Unnamed Patient') : (d.fullName || 'بیمار بدون نام');
  const age = normalizeDigits(d.age || '') || '—';
  const days = Array.isArray(ob.soapeHistory) ? ob.soapeHistory : [];
  const activeDay = days.find((x) => x.id === ob.activeSoapeId) || days[days.length - 1];

  const blocks = [
    isEn
      ? `> **Patient Demographics:** ${patientName} | Age: ${age}`
      : `> **مشخصات هویتی بیمار:** نام و نام خانوادگی: **${patientName}** | سن: **${age} ساله**`,
    isEn
      ? `### OB/GYN WARD PROGRESS NOTE (SOAPE)`
      : `### یادداشت سیر روزانه بخش زنان و زایمان (SOAPE)`
  ];

  const NOTE_TYPE_EN_MAP = {
    'سیر روزانه': 'Daily Progress',
    'پست-اپ روز ۱': 'Post-Op Day 1',
    'ارزیابی لیبر / مامایی': 'Labor / Obstetric Evaluation',
    'پیگیری پس از زایمان': 'Postpartum Follow-Up'
  };

  if (activeDay) {
    const typeLabel = isEn
      ? (NOTE_TYPE_EN_MAP[activeDay.noteType] || cleanEn(activeDay.noteType, 'Daily Progress'))
      : (activeDay.noteType || 'سیر روزانه');
    const pModEn = cleanEn(activeDay.P_modifications);
    const pReasonEn = cleanEn(activeDay.P_reason);
    const pOrdersEn = cleanEn(activeDay.P_newOrders);
    blocks.push(isEn
      ? `**Day #${activeDay.dayNumber || 1} (${typeLabel}) — ${cleanEn(activeDay.dateTime, '')}**\n- **S (Subjective):** ${cleanEn(activeDay.S, '—')}\n- **O (Objective — Factual Only):** ${cleanEn(activeDay.O, '—')}\n- **A (Assessment & Prioritized Problem List):** ${cleanEn(activeDay.A, '—')}\n- **P (Plan — Modifications & Reason):** ${[pModEn, pReasonEn ? `Reason: ${pReasonEn}` : '', pOrdersEn ? `New Orders: ${pOrdersEn}` : ''].filter(Boolean).join(' | ') || '—'}\n- **E (Patient Education):** ${cleanEn(activeDay.E, '—')}`
      : `**روز #${activeDay.dayNumber || 1} (${typeLabel}) — ${activeDay.dateTime || ''}**\n- **S (گزارش و احوالپرسی بیمار):** ${activeDay.S || '—'}\n- **O (یافته‌های عینی بدون تفسیر):** ${activeDay.O || '—'}\n- **A (ارزیابی و لیست اولویت‌دار مشکلات):** ${activeDay.A || '—'}\n- **P (تغییر دستورات با ذکر علت و دستورات جدید):** ${[activeDay.P_modifications, activeDay.P_reason ? `علت تغییر: ${activeDay.P_reason}` : '', activeDay.P_newOrders ? `دستورات جدید: ${activeDay.P_newOrders}` : ''].filter(Boolean).join(' | ') || '—'}\n- **E (آموزش بر بالین بیمار):** ${activeDay.E || '—'}`
    );
  } else {
    blocks.push(isEn ? '- No SOAPE progress day recorded yet.' : '- هنوز یادداشت SOAPE برای این بیمار ثبت نشده است.');
  }

  const ds = ob.dischargeSadaf || {};
  if (ds.active || ds.finalDx || ds.sadaf?.S_stitches || ds.sadaf?.D_drugsDiet) {
    const courseMap = {
      improving: isEn ? 'Improving' : 'رو به بهبود',
      worsening: isEn ? 'Worsening' : 'رو به وخامت',
      unchanged: isEn ? 'Unchanged' : 'بدون تغییر'
    };
    blocks.push(isEn
      ? `### DISCHARGE SUMMARY (PD / DS) & SADAF INSTRUCTIONS\n- **CC & Initial Dx:** ${cleanEn(ds.ccAndInitialDx, '—')}\n- **Final Diagnosis:** ${cleanEn(ds.finalDx, '—')}\n- **Treatments & Surgical Procedures:** ${cleanEn(ds.treatmentsAndProcedures, '—')}\n- **Positive & Pertinent Negative Labs:** ${cleanEn(ds.labSummary, '—')}\n- **Disease Course & Condition at Discharge:** ${courseMap[ds.diseaseCourse] || 'Improving'} — ${cleanEn(ds.dischargeCondition, 'Stable')}\n- **S (Stitches / Incision Care):** ${cleanEn(ds.sadaf?.S_stitches, '—')}\n- **A (Activity):** ${cleanEn(ds.sadaf?.A_activity, '—')}\n- **D (Drugs & Diet):** ${cleanEn(ds.sadaf?.D_drugsDiet, '—')}\n- **F (Follow-up & Pathology):** ${cleanEn(ds.sadaf?.F_followUp, '—')}`
      : `### خلاصه پرونده ترخیص (PD / DS) و آموزش SADAF\n- **شکایت و تشخیص اولیه:** ${ds.ccAndInitialDx || '—'}\n- **تشخیص نهایی:** ${ds.finalDx || '—'}\n- **اقدامات درمانی و جراحی انجام‌شده:** ${ds.treatmentsAndProcedures || '—'}\n- **نتایج مثبت و منفی آزمایشات:** ${ds.labSummary || '—'}\n- **سیر بیماری و وضعیت زمان ترخیص:** ${courseMap[ds.diseaseCourse] || 'رو به بهبود'} — ${ds.dischargeCondition || 'پایدار'}\n- **S (بخیه و مراقبت زخم):** ${ds.sadaf?.S_stitches || '—'}\n- **A (سطح فعالیت):** ${ds.sadaf?.A_activity || '—'}\n- **D (داروها و رژیم غذایی):** ${ds.sadaf?.D_drugsDiet || '—'}\n- **F (مراجعه بعدی و پیگیری پاتولوژی):** ${ds.sadaf?.F_followUp || '—'}`
    );
  }

  const cn = ob.consultNote || {};
  if (cn.active || cn.consultReason || cn.targetService) {
    const urg = cn.urgency === 'urgent' ? (isEn ? 'URGENT / STAT' : 'اورژانس') : (isEn ? 'Non-Urgent / Routine' : 'غیراورژانس');
    blocks.push(isEn
      ? `### CONSULTATION REQUEST\n- **To Service:** ${cleanEn(cn.targetService, '—')} (${urg})\n- **Patient & Admission Reason:** ${patientName} (${age} y/o) — ${cleanEn(cn.admissionReason, '—')}\n- **Reason for Consultation:** ${cleanEn(cn.consultReason, '—')}\n- **Clinical Summary:** ${cleanEn(cn.summary, '—')}\n- **Requesting Physician & Date/Time:** ${cleanEn(cn.requestingPhysician, '—')} | ${cn.dateTime || '—'}`
      : `### برگه درخواست مشاوره تخصصی\nبا سلام و احترام، لطفاً بیمار خانم **${patientName}** (${age} ساله) بستری در بخش زنان به علت **${cn.admissionReason || '—'}** از نظر **${cn.consultReason || '—'}** مورد بررسی و مشاوره **${urg}** سرویس محترم **${cn.targetService || '—'}** قرار گیرند.\n- **خلاصه نکات کلیدی:** ${cn.summary || '—'}\n- **پزشک درخواست‌کننده و زمان:** ${cn.requestingPhysician || '—'} | ${cn.dateTime || '—'} — با تشکر و خسته نباشید.`
    );
  }

  return blocks.filter(Boolean).join('\n\n');
}

export function generateObgynNote(clinicalState, langOverride = null) {
  if (!clinicalState) return '';
  const lang = langOverride || getCurrentLanguage();
  const isEn = lang === 'en';
  const ob = normalizeObgynState(clinicalState.obgynModule || clinicalState.obgyn);

  if (ob.subMode === 'gynecology') {
    return generateGynecologyNote(clinicalState, ob, isEn);
  }
  if (ob.subMode === 'soape') {
    return generateSoapeAndDischargeNote(clinicalState, ob, isEn);
  }
  return generateObstetricsNote(clinicalState, ob, isEn);
}
