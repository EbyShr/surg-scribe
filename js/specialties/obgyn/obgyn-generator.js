/**
 * MedHistorism v3.1 — Ob/Gyn Deterministic Bilingual Clinical Narrative Engine
 * Pure ES Module (Node-safe, Zero DOM Access, Zero Emojis, Strict Not Assessed != Negative)
 */

import {
  OBGYN_OBSTETRIC_ARCHETYPES,
  OBGYN_GYN_ARCHETYPES,
  OBGYN_SYMPTOM_BANK,
  OBGYN_STRUCTURED_PE_IDS,
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
  const paren = s.match(/\(([A-Za-z0-9\s\/\-\.,+%<>≥≤=]+)\)/);
  if (paren && paren[1]) return paren[1].trim();
  const stripped = s.replace(/[\u0600-\u06FF،؛؟ـ\u200B-\u200D\uFEFF]+/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped || fallback;
}

function hasValue(val) {
  return val !== null && val !== undefined && String(val).trim() !== '';
}

function getFieldOptionLabel(archetypeList, archId, key, val, isEn) {
  if (!hasValue(val)) return '';
  const arch = archetypeList.find((a) => a.id === archId);
  const f = arch?.fields?.find((fld) => fld.key === key);
  if (f?.options) {
    const opt = f.options.find((o) => o.val === val);
    if (opt) return isEn ? opt.en : opt.fa;
  }
  return isEn ? cleanEn(val, String(val)) : String(val).trim();
}

function formatObstetricFormula(idx = {}, subMode = 'obstetrics') {
  const keys = ['G', 'P', 'L', 'D', 'Ab', 'IUFD', 'EP', 'Mole'];
  const anyFilled = keys.some((k) => hasValue(idx[k]));
  if (!anyFilled) return '';

  const num = (k) => (hasValue(idx[k]) ? String(idx[k]).trim() : '0');
  const g = num('G');
  const p = num('P');
  const l = num('L');
  const d = num('D');
  const ab = num('Ab');
  const iufd = num('IUFD');
  const ep = num('EP');
  const mole = num('Mole');

  if (subMode === 'gynecology' && !idx.expandZeroIndexFields) {
    let formula = `G${g}P${p}L${l}Ab${ab}`;
    if (Number(d) > 0) formula += `D${d}`;
    if (Number(iufd) > 0) formula += `IUFD${iufd}`;
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
  const notDoc = isEn ? 'Not documented.' : 'ثبت نشده / بررسی نشده.';

  // 3. PMHx
  const pmhPos = [];
  const pmhNeg = [];
  const pmhCats = c.pmh?.categories || {};
  Object.values(pmhCats).forEach((cat) => {
    if (!cat || typeof cat !== 'object') return;
    if (cat.items && typeof cat.items === 'object') {
      Object.entries(cat.items).forEach(([itemId, val]) => {
        const st = val && typeof val === 'object' ? val.state : val;
        const lbl = val && typeof val === 'object'
          ? (isEn ? cleanEn(val.en || val.label || val.fa || itemId, itemId) : (val.label || val.fa || itemId))
          : itemId;
        const det = val && typeof val === 'object' && val.detail ? (isEn ? cleanEn(val.detail) : val.detail) : '';
        if (st === 1) pmhPos.push(det ? `${lbl} (${det})` : lbl);
        else if (st === -1) pmhNeg.push(lbl);
      });
    }
    if (cat.otherNote && String(cat.otherNote).trim()) {
      pmhPos.push(isEn ? cleanEn(cat.otherNote) : String(cat.otherNote).trim());
    }
  });
  let pmhText = notDoc;
  if (pmhPos.length > 0) {
    pmhText = pmhPos.join(isEn ? ', ' : '، ');
    if (pmhNeg.length > 0) {
      pmhText += isEn ? ` (denies ${pmhNeg.join(', ')})` : ` (سابقه ${pmhNeg.join('، ')} را ذکر نمی‌کند)`;
    }
  } else if (c.pmh?.masterRoutineNegative) {
    pmhText = isEn
      ? 'Denies chronic medical illness (DM, HTN, IHD, renal, or thyroid disease).'
      : 'سابقه بیماری زمینه‌ای خاصی (فشار خون مزمن، دیابت، بیماری قلبی، کلیوی یا تیروئیدی) را ذکر نمی‌کند.';
  } else if (pmhNeg.length > 0) {
    pmhText = isEn ? `Denies ${pmhNeg.join(', ')}.` : `سابقه ${pmhNeg.join('، ')} را ذکر نمی‌کند.`;
  }

  // 4. PSHx
  const surgeries = Array.isArray(c.psh?.surgeries) ? c.psh.surgeries : [];
  let pshText = notDoc;
  if (surgeries.length > 0) {
    pshText = surgeries.map((s) => {
      const nm = isEn ? cleanEn(s.en || s.label || s.procedure || s.name) : (s.label || s.procedure || s.name || s.en);
      const extra = [s.year, s.note].filter(Boolean).map((x) => (isEn ? cleanEn(x) : x)).join(' — ');
      return extra ? `${nm} (${extra})` : nm;
    }).filter(Boolean).join(isEn ? ', ' : '، ');
  } else if (c.psh?.noSurgeries) {
    pshText = isEn ? 'Denies prior surgical history.' : 'سابقه عمل جراحی قبلی را ذکر نمی‌کند.';
  } else if (c.psh?.note && String(c.psh.note).trim()) {
    pshText = isEn ? cleanEn(c.psh.note) : String(c.psh.note).trim();
  }

  // 5. Drug Hx
  const drugs = [
    ...(Array.isArray(c.dh?.activeDrugs) ? c.dh.activeDrugs : []),
    ...(Array.isArray(c.dh?.customDrugs) ? c.dh.customDrugs : [])
  ];
  let dhText = notDoc;
  if (drugs.length > 0) {
    dhText = drugs.map((dr) => {
      const nm = isEn ? cleanEn(dr.en || dr.name || dr.label) : (dr.name || dr.label || dr.en);
      const extra = [dr.dose, dr.sig].filter(Boolean).map((x) => (isEn ? cleanEn(x) : x)).join(' ');
      return extra ? `${nm} (${extra})` : nm;
    }).filter(Boolean).join(isEn ? ', ' : '، ');
  } else if (c.dh?.noRoutineMeds) {
    dhText = isEn ? 'Denies routine medications.' : 'داروی خاصی به صورت روتین مصرف نمی‌کند.';
  } else if (c.dh?.note && String(c.dh.note).trim()) {
    dhText = isEn ? cleanEn(c.dh.note) : String(c.dh.note).trim();
  }

  // 6. PAHx (Strict Tri-State: 0 untouched, -1 denied, 1 positive)
  const pahx = ob.gynScreeningAndRecords?.pahx || {};
  const anesTypes = Array.isArray(pahx.anesthesiaTypes) && pahx.anesthesiaTypes.length > 0
    ? pahx.anesthesiaTypes.map((a) => (isEn ? cleanEn(a) : a)).join(isEn ? ', ' : '، ')
    : '';
  const compStr = (pahx.complications || '').trim();
  const isPosPahx = pahx.status === 1 || pahx.hasPriorAnesthesia || Boolean(anesTypes) || Boolean(compStr);
  let pahxText = notDoc;
  if (isPosPahx) {
    if (isEn) {
      const base = anesTypes || 'Prior anesthesia';
      const comp = compStr ? cleanEn(compStr, compStr) : 'without complications';
      pahxText = `${base} (${comp}).`;
    } else {
      const base = anesTypes || 'سابقه بیهوشی/بی‌حسی قبلی';
      const comp = compStr || 'بدون عارضه بیهوشی';
      pahxText = `${base} (${comp}).`;
    }
  } else if (pahx.status === -1) {
    pahxText = isEn ? 'Denies prior anesthesia history.' : 'سابقه بیهوشی یا بی‌حسی قبلی را ذکر نمی‌کند.';
  }

  // 7. Allergy
  const ahSel = Array.isArray(c.ah?.selected) ? c.ah.selected : [];
  let allergyText = notDoc;
  if (c.ah?.nkda) {
    allergyText = isEn ? 'No known drug or food allergies (NKDA).' : 'حساسیت دارویی یا غذایی شناخته‌شده‌ای ذکر نمی‌کند (NKDA).';
  } else if (ahSel.length > 0) {
    allergyText = ahSel.map((a) => {
      const lbl = isEn ? cleanEn(a.en || a.label) : (a.label || a.en);
      return a.detail ? `${lbl} (${isEn ? cleanEn(a.detail) : a.detail})` : lbl;
    }).join(isEn ? ', ' : '، ');
  } else if (c.ah?.note && String(c.ah.note).trim()) {
    allergyText = isEn ? cleanEn(c.ah.note) : String(c.ah.note).trim();
  }

  // Optional SH & FH line
  const shParts = [];
  if (c.sh?.negSmoking && c.sh?.negOpium && c.sh?.negAlcohol) {
    shParts.push(isEn ? 'Denies tobacco, opium, or alcohol use' : 'مصرف سیگار، مواد مخدر و الکل را ذکر نمی‌کند');
  } else {
    if (c.sh?.negSmoking) shParts.push(isEn ? 'Non-smoker' : 'عدم مصرف سیگار');
    if (c.sh?.negOpium) shParts.push(isEn ? 'No opium use' : 'عدم مصرف تریاک/مخدر');
    if (c.sh?.negAlcohol) shParts.push(isEn ? 'No alcohol use' : 'عدم مصرف الکل');
  }
  if (hasValue(c.sh?.note)) shParts.push(isEn ? cleanEn(c.sh.note) : String(c.sh.note).trim());

  const fhParts = [];
  if (c.fh?.negFamilyHistory || c.fh?.masterNeg) {
    fhParts.push(isEn ? 'Denies significant family history' : 'سابقه بیماری ارثی یا سرطان خانوادگی ذکر نمی‌کند');
  }
  if (Array.isArray(c.fh?.diseases) && c.fh.diseases.length > 0) {
    fhParts.push(c.fh.diseases.map((f) => (isEn ? cleanEn(f.name || f.en) : f.name)).filter(Boolean).join(isEn ? ', ' : '، '));
  }
  if (hasValue(c.fh?.note)) fhParts.push(isEn ? cleanEn(c.fh.note) : String(c.fh.note).trim());

  const shFhParts = [];
  if (shParts.length > 0) shFhParts.push(`**SH:** ${shParts.join(isEn ? '; ' : '؛ ')}`);
  if (fhParts.length > 0) shFhParts.push(`**FH:** ${fhParts.join(isEn ? '; ' : '؛ ')}`);

  return {
    pmhText,
    pshText,
    dhText,
    pahxText,
    allergyText,
    shFhText: shFhParts.join(' | ')
  };
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
  const presentations = Array.isArray(hpi.presentations) && hpi.presentations.length > 0
    ? hpi.presentations
    : (hpi.selectedArchetype
        ? [{ id: `legacy_${hpi.selectedArchetype}`, archetypeId: hpi.selectedArchetype, fields: hpi.archetypeFields || {} }]
        : []);

  const paragraphs = [];
  presentations.forEach((pres, pIdx) => {
    const arch = list.find((a) => a.id === pres.archetypeId);
    if (!arch) return;
    const fields = pres.fields || {};
    const details = (arch.fields || []).map((f) => {
      const val = fields[f.key];
      if (!hasValue(val)) return '';
      const fLabel = isEn ? f.en : f.fa;
      const vLabel = getFieldOptionLabel(list, arch.id, f.key, val, isEn);
      return vLabel ? `${fLabel}: ${vLabel}` : '';
    }).filter(Boolean);

    const archName = isEn ? arch.en : arch.fa;
    if (details.length > 0) {
      paragraphs.push(isEn
        ? `${pIdx === 0 ? 'Regarding' : 'Additionally, regarding'} **${archName}**, clinical chronology includes ${details.join('; ')}.`
        : `${pIdx === 0 ? 'در بررسی' : 'همچنین در خصوص'} **${archName}**، جزئیات بالینی شامل ${details.join('؛ ')} است.`);
    } else {
      paragraphs.push(isEn
        ? `${pIdx === 0 ? 'The primary presenting problem involves' : 'In addition, the patient presents with'} **${archName}**.`
        : `${pIdx === 0 ? 'تظاهر اصلی بیماری به صورت' : 'همچنین همزمان تابلوی'} **${archName}** مطرح است.`);
    }
  });

  if (hasValue(hpi.narrativeExtra)) {
    paragraphs.push(isEn ? cleanEn(hpi.narrativeExtra) : String(hpi.narrativeExtra).trim());
  }
  return paragraphs.join('\n\n');
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
    if (!hasValue(raw)) return;
    const text = isEn ? cleanEn(raw, String(raw).trim()) : String(raw).trim();
    if (text) lines.push(`- **${letter} (${title}):** ${text.replace(/\n+/g, ' | ')}`);
  });
  if (lines.length > 0 && (hasValue(adca.physicianName) || hasValue(adca.dateTime))) {
    const sig = [
      hasValue(adca.physicianName) ? (isEn ? cleanEn(adca.physicianName) : adca.physicianName) : '',
      hasValue(adca.dateTime) ? (isEn ? cleanEn(adca.dateTime) : adca.dateTime) : ''
    ].filter(Boolean).join(' — ');
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
      !OBGYN_STRUCTURED_PE_IDS.has(it.id) &&
      (it.subMode === 'both' || it.subMode === sub) &&
      it.subGroup === grp
    );
    if (items.length === 0) return;

    const grpLabel = isEn ? items[0].subGroupEn : grp;
    const itemSentences = [];
    items.forEach((it) => {
      if (excludeInternalIfVirgin && isVirgin && it.isInternalPelvic) return;
      const entry = findings[it.id];
      if (!entry || (entry.state !== 1 && entry.state !== -1)) return;
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

function buildDemographicHeader(d, formula, dateDisplay, isEn) {
  const patientName = hasValue(d.fullName)
    ? (isEn ? cleanEn(d.fullName, 'Unnamed Patient') : String(d.fullName).trim())
    : (isEn ? 'Unnamed Patient' : 'نام ثبت‌نشده');
  const age = normalizeDigits(d.age || '');
  const parts = isEn
    ? [
        `Patient: **${patientName}**`,
        age ? `Age: **${age} y/o**` : '',
        'Sex: **Female**',
        formula ? `Index: **${formula}**` : '',
        `Date: **${dateDisplay}**`
      ]
    : [
        `نام بیمار: **${patientName}**`,
        age ? `سن: **${age} ساله**` : '',
        'جنس: **خانم**',
        formula ? `فرمول مامایی: **${formula}**` : '',
        `تاریخ: **${dateDisplay}**`
      ];
  return `> ${parts.filter(Boolean).join(' | ')}`;
}

function generateObstetricsNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const gd = ob.gestationalDating || {};
  const hpi = ob.ccAndHpi || {};
  const shared = collectSharedHistories(clinicalState, ob, isEn);

  const age = normalizeDigits(d.age || '');
  const ccRaw = hasValue(hpi.ccText) ? hpi.ccText : (hasValue(clinicalState.cc?.patientQuote) ? clinicalState.cc.patientQuote : '');
  const ccText = hasValue(ccRaw) ? (isEn ? cleanEn(ccRaw) : String(ccRaw).trim()) : '';
  const durRaw = hasValue(hpi.duration) ? (isEn ? cleanEn(hpi.duration) : String(hpi.duration).trim()) : '';

  const formula = formatObstetricFormula(idx, 'obstetrics');
  const hasNdCs = hasValue(idx.ND) || hasValue(idx.CS);
  const nd = hasValue(idx.ND) ? String(idx.ND).trim() : '0';
  const cs = hasValue(idx.CS) ? String(idx.CS).trim() : '0';
  const csIndStr = Number(cs) > 0 && hasValue(idx.priorCsIndications)
    ? (isEn ? ` due to ${cleanEn(idx.priorCsIndications)}` : ` به علت ${idx.priorCsIndications}`)
    : '';
  const bgRh = hasValue(idx.maternalBgRh) ? idx.maternalBgRh : '';

  const gaCalc = calculateTripleGestationalAge(gd);
  const gaClausesFa = [];
  const gaClausesEn = [];
  if (gaCalc.gaByNt) {
    gaClausesFa.push(`**GA = ${gaCalc.gaByNt.code}** بر اساس سونوگرافی NT`);
    gaClausesEn.push(`**GA = ${gaCalc.gaByNt.code}** by first-trimester NT ultrasound`);
  }
  if (gaCalc.gaByLmp) {
    gaClausesFa.push(`**GA = ${gaCalc.gaByLmp.code}** بر اساس LMP (${gd.lmpDate})`);
    gaClausesEn.push(`**GA = ${gaCalc.gaByLmp.code}** by LMP (${cleanEn(gd.lmpDate)})`);
  } else if (gd.isReliableLmp === false && hasValue(gd.lmpDate)) {
    gaClausesFa.push(`LMP نامطمئن (${gd.lmpDate})`);
    gaClausesEn.push(`unreliable LMP (${cleanEn(gd.lmpDate)})`);
  }
  if (gaCalc.gaByLastSono) {
    gaClausesFa.push(`**GA = ${gaCalc.gaByLastSono.code}** بر اساس آخرین سونوگرافی (${gd.lastSonoDate})`);
    gaClausesEn.push(`**GA = ${gaCalc.gaByLastSono.code}** by last ultrasound (${cleanEn(gd.lastSonoDate)})`);
  }

  // Piece-by-piece conditional opening sentence (Zero broken placeholders!)
  let openingSentence = '';
  if (isEn) {
    const subjectParts = [
      age ? `The patient is a ${age}-year-old` : 'The patient is an adult',
      formula ? `**${formula}**` : '',
      'female patient',
      hasNdCs ? `(history of **${nd}** prior NVD and **${cs}** CS${csIndStr})` : '',
      bgRh ? `blood group **${bgRh}**` : ''
    ].filter(Boolean).join(' ');

    const gaSegment = gaClausesEn.length > 0
      ? `, at ${gaClausesEn.join(', ')}${gaCalc.officialEdd ? ` (Official EDD: **${gaCalc.officialEdd}**)` : ''}`
      : '';

    const tailSegment = ccText
      ? `, presenting${durRaw ? ` ${durRaw} prior to arrival` : ''} with a chief complaint of "${ccText}".`
      : `${durRaw ? `, presenting ${durRaw} prior to arrival` : ''} for obstetric admission and evaluation.`;

    openingSentence = `${subjectParts}${gaSegment}${tailSegment}`;
  } else {
    const subjectParts = [
      age ? `بیمار خانم ${age} ساله` : 'بیمار خانم',
      formula ? `**${formula}**` : '',
      hasNdCs ? `(با سابقه **${nd}** زایمان طبیعی [ND] و **${cs}** سزارین [CS]${csIndStr})` : '',
      bgRh ? `گروه خونی **${bgRh}**` : ''
    ].filter(Boolean).join('، ');

    const gaSegment = gaClausesFa.length > 0
      ? `، با سن بارداری ${gaClausesFa.join('، ')}${gaCalc.officialEdd ? ` (EDD رسمی: **${gaCalc.officialEdd}**)` : ''}`
      : '';

    const tailSegment = ccText
      ? ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} با شکایت «${ccText}» به این مرکز مراجعه کرده است.`
      : ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} جهت ارزیابی و اقدامات مامایی پذیرش شده است.`;

    openingSentence = `${subjectParts}${gaSegment}${tailSegment}`;
  }

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
    const ga = hasValue(p.gaAtOutcomeWeeks) ? `${p.gaAtOutcomeWeeks}w` : '';
    const wt = hasValue(p.birthWeightGrams) ? `${p.birthWeightGrams}g` : '';
    const reason = hasValue(p.csIndicationOrLossMethod) ? (isEn ? cleanEn(p.csIndicationOrLossMethod) : p.csIndicationOrLossMethod) : '';
    const yr = hasValue(p.yearOrChildAge) ? (isEn ? cleanEn(p.yearOrChildAge) : p.yearOrChildAge) : '';
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

  const rhNote = /[-−]/.test(idx.maternalBgRh || '') && (hasValue(idx.paternalBgRh) || hasValue(idx.indirectCoombsRhogam))
    ? (isEn
        ? `Paternal Blood Group: ${idx.paternalBgRh || 'Pending'}; Indirect Coombs / RhoGAM: ${cleanEn(idx.indirectCoombsRhogam, 'Pending')}.`
        : `گروه خونی همسر: ${idx.paternalBgRh || 'نامشخص'}؛ وضعیت کومبس غیرمستقیم / روگام: ${idx.indirectCoombsRhogam || 'ثبت نشده'}.`)
    : '';

  // 8. Last Obstetric Ultrasound, Antenatal Screening, Admission Labs & NST
  const us = ob.paraclinics?.lastObstetricUltrasound || {};
  const usLines = [
    hasValue(us.presentation) ? (isEn ? `- **Fetal Presentation:** ${cleanEn(us.presentation)}` : `- **پرزانتاسیون جنین:** ${us.presentation}`) : '',
    hasValue(us.placentalLocationAndGrade) ? (isEn ? `- **Placental Location:** ${cleanEn(us.placentalLocationAndGrade)}` : `- **محل جفت:** ${us.placentalLocationAndGrade}`) : '',
    hasValue(us.amnioticFluidVolume) ? (isEn ? `- **Amniotic Fluid Volume:** ${cleanEn(us.amnioticFluidVolume)}` : `- **میزان مایع آمنیوتیک:** ${us.amnioticFluidVolume}`) : '',
    hasValue(us.sonographicGa) ? (isEn ? `- **Sonographic GA:** ${cleanEn(us.sonographicGa)}` : `- **سن بارداری سونوگرافی:** ${us.sonographicGa}`) : '',
    hasValue(us.efwGramsAndPercentile) ? (isEn ? `- **Estimated Fetal Weight (EFW):** ${cleanEn(us.efwGramsAndPercentile)}` : `- **وزن تخمینی جنین و صدک:** ${us.efwGramsAndPercentile}`) : '',
    hasValue(us.placentaAccretaColorDoppler) ? (isEn ? `- **Placenta Accreta Color Doppler:** ${cleanEn(us.placentaAccretaColorDoppler)}` : `- **نتیجه کالرداپلر آکرتای جفت:** ${us.placentaAccretaColorDoppler}`) : '',
    (hasValue(us.bppScore) || hasValue(us.umbilicalAndMcaDoppler) || hasValue(us.cervicalLengthMm))
      ? (isEn
          ? `- **BPP / Doppler / CL:** ${[us.bppScore ? `BPP ${us.bppScore}` : '', cleanEn(us.umbilicalAndMcaDoppler), us.cervicalLengthMm ? `CL ${us.cervicalLengthMm}` : ''].filter(Boolean).join(' | ')}`
          : `- **BPP / داپلر / طول سرویکس:** ${[us.bppScore ? `BPP ${us.bppScore}` : '', us.umbilicalAndMcaDoppler, us.cervicalLengthMm ? `CL ${us.cervicalLengthMm}` : ''].filter(Boolean).join(' | ')}`)
      : ''
  ].filter(Boolean);

  const ac = ob.antenatalCareChecklist || {};
  const acAuditParts = [
    hasValue(ac.careRegularity) ? (isEn ? cleanEn(ac.careRegularity) : ac.careRegularity) : '',
    ac.firstTrimesterScreening?.ntScanDone ? (isEn ? `1st-Trimester NT: ${ac.firstTrimesterScreening.ntMeasurementMm || 'Done'}, Risk: ${ac.firstTrimesterScreening.doubleMarkerRisk || 'Done'}` : `غربالگری سه‌ماهه اول: NT=${ac.firstTrimesterScreening.ntMeasurementMm || 'انجام شده'}، ریسک: ${ac.firstTrimesterScreening.doubleMarkerRisk || 'ثبت شده'}`) : '',
    ac.secondTrimesterScreening?.anomalyScanDone ? (isEn ? `Anomaly scan: ${cleanEn(ac.secondTrimesterScreening.anomalyScanResult, 'Done')}` : `آنومالی اسکن: ${ac.secondTrimesterScreening.anomalyScanResult || 'انجام شده'}`) : '',
    hasValue(ac.routineAntenatalLabsAudit?.gdmScreening75gOgtt) ? `OGTT: ${isEn ? cleanEn(ac.routineAntenatalLabsAudit.gdmScreening75gOgtt) : ac.routineAntenatalLabsAudit.gdmScreening75gOgtt}` : '',
    hasValue(ac.routineAntenatalLabsAudit?.viralMarkers) ? (isEn ? `Viral Markers: ${cleanEn(ac.routineAntenatalLabsAudit.viralMarkers)}` : `ویرال مارکرها: ${ac.routineAntenatalLabsAudit.viralMarkers}`) : '',
    hasValue(ac.routineAntenatalLabsAudit?.gbsSwab35to37w) ? `GBS: ${isEn ? cleanEn(ac.routineAntenatalLabsAudit.gbsSwab35to37w) : ac.routineAntenatalLabsAudit.gbsSwab35to37w}` : ''
  ].filter(Boolean);

  const fm = ob.paraclinics?.fetalMonitoring || {};
  let nstLine = '';
  if (hasValue(fm.baselineBpm) || hasValue(fm.variability) || hasValue(fm.accelerations) || (fm.decelerations?.type && fm.decelerations.type !== 'None')) {
    const nichd = evaluateNichdCategory(fm);
    const dec = fm.decelerations || {};
    const decStr = dec.type && dec.type !== 'None'
      ? `${dec.type}${dec.isRecurrent ? (isEn ? ' (Recurrent)' : ' (راجعه)') : ''}${dec.cordCompressionPatternVariant && dec.cordCompressionPatternVariant !== 'None' ? ` [${dec.cordCompressionPatternVariant}]` : ''}`
      : (isEn ? 'No decelerations' : 'فاقد افت ضربان');
    nstLine = isEn
      ? `- **${fm.testType || 'NST'} (5-Step EFM):** Baseline ${fm.baselineBpm || 'Pending'} bpm${fm.variability ? `, Variability: ${fm.variability}` : ''}${hasValue(fm.accelerations) ? `, Accelerations: ${cleanEn(fm.accelerations)}` : ''}, Decelerations: ${decStr}${hasValue(fm.contractionsIn10Min) ? `, Contractions: ${cleanEn(fm.contractionsIn10Min)}` : ''} — **${fm.nichdCategory || nichd.labelEn}**`
      : `- **${fm.testType || 'NST'} (تفسیر ۵ مرحله‌ای):** پایه (Baseline): ${fm.baselineBpm || 'نامشخص'} bpm${fm.variability ? `، تغییرپذیری: ${fm.variability}` : ''}${hasValue(fm.accelerations) ? `، تسریع: ${fm.accelerations}` : ''}، افت ضربان: ${decStr}${hasValue(fm.contractionsIn10Min) ? `، انقباضات: ${fm.contractionsIn10Min}` : ''} — **${fm.nichdCategory || nichd.labelFa}**`;
  }

  const kl = ob.paraclinics?.keyLabs || {};
  const labItems = [
    hasValue(kl.bhcg) ? `β-hCG: ${kl.bhcg}` : '',
    hasValue(kl.wbc) ? `WBC: ${kl.wbc}` : '',
    hasValue(kl.hb) ? `Hb: ${kl.hb}` : '',
    hasValue(kl.plt) ? `Plt: ${kl.plt}` : '',
    hasValue(kl.cr) ? `Cr: ${kl.cr}` : '',
    hasValue(kl.ast) ? `AST: ${kl.ast}` : '',
    hasValue(kl.alt) ? `ALT: ${kl.alt}` : '',
    hasValue(kl.ldh) ? `LDH: ${kl.ldh}` : '',
    hasValue(kl.urinePrCr) ? `Urine Pr/Cr: ${kl.urinePrCr}` : '',
    hasValue(kl.ptInr) ? `PT/INR: ${kl.ptInr}` : '',
    hasValue(kl.tsh) ? `TSH: ${kl.tsh}` : '',
    hasValue(kl.ogtt75) ? `OGTT 75g: ${kl.ogtt75}` : '',
    hasValue(kl.viralMarkers) ? `Viral: ${isEn ? cleanEn(kl.viralMarkers) : kl.viralMarkers}` : '',
    hasValue(kl.indirectCoombs) ? `Indirect Coombs: ${isEn ? cleanEn(kl.indirectCoombs) : kl.indirectCoombs}` : '',
    hasValue(kl.gbs) ? `GBS: ${isEn ? cleanEn(kl.gbs) : kl.gbs}` : ''
  ].filter(Boolean);

  // 9. Vitals
  const v = ob.pe?.vitals || {};
  const vitalsLine = [
    hasValue(v.bp) ? `BP: ${v.bp}${hasValue(v.bpRepeat) ? ` (${isEn ? 'Repeat' : 'تکرار'}: ${v.bpRepeat})` : ''}` : '',
    hasValue(v.pr) ? `PR: ${v.pr}` : '',
    hasValue(v.rr) ? `RR: ${v.rr}` : '',
    hasValue(v.temp) ? `T: ${v.temp}` : '',
    hasValue(v.urineDipstick) ? `Urine Dipstick: ${v.urineDipstick}` : ''
  ].filter(Boolean).join(' | ');

  // 10. Obstetric Abdomen & Leopold + DTR/Edema
  const om = ob.pe?.obsMeasurements || {};
  const fhrFhParts = [
    hasValue(om.fhr) ? `FHR: ${om.fhr} bpm${om.fhrQuadrant ? ` (${om.fhrQuadrant})` : ''}` : '',
    hasValue(om.fundalHeightCm) ? `${isEn ? 'Fundal Height (FH)' : 'ارتفاع رحم (FH)'}: ${om.fundalHeightCm} cm` : ''
  ].filter(Boolean);

  const peAbdomenAndExtLines = buildPeFindingsByGroups(ob, [
    'مانورهای لئوپولد و لمس شکم حاملگی',
    'معاینه شکم حاملگی و سمع FHR',
    'معاینه اندام‌ها، ادم و رفلکس‌ها (DTR)',
    'معاینه اندام‌ها و رفلکس‌ها (DTR)'
  ], isEn, false);

  // 11. TV & Pelvimetry & Speculum
  const tvParts = [
    hasValue(om.dilationCm) ? `${isEn ? 'Dilation' : 'دیلاتاسیون'}: ${om.dilationCm} cm` : '',
    hasValue(om.effacementPct) ? `${isEn ? 'Effacement' : 'افاسمان'}: ${om.effacementPct}%` : '',
    hasValue(om.stationValue) ? `Station (${om.stationScale === '3' ? '-3..+3' : '-5..+5'}): ${om.stationValue}` : '',
    hasValue(om.presentingPart) ? `${isEn ? 'Presenting Part' : 'عضو پرزانته'}: ${isEn ? cleanEn(om.presentingPart) : om.presentingPart}` : '',
    hasValue(om.membranesStatus) ? `${isEn ? 'Membranes' : 'وضعیت پرده‌ها'}: ${isEn ? cleanEn(om.membranesStatus) : om.membranesStatus}${hasValue(om.amnioticFluidChar) ? ` (${isEn ? cleanEn(om.amnioticFluidChar) : om.amnioticFluidChar})` : ''}` : ''
  ].filter(Boolean);

  const bishop = calculateBishopScore(om);
  const tvPeLines = idx.isVirgin
    ? [isEn ? '- **Pelvic / TV Exam:** Patient is Virgin; internal speculum and digital vaginal exams deferred.' : '- **معاینه واژینال و اسپکولوم:** با توجه به Virgin بودن بیمار، معاینه داخلی و توشه واژینال (TV) انجام نشد.']
    : buildPeFindingsByGroups(ob, [
        'پلویمتری بالینی (Clinical Pelvimetry)',
        'معاینه واژینال مامایی (TV) و لگن',
        'معاینه با اسپکولوم و ژنیتال خارجی'
      ], isEn, true);

  // 12. DDx & 13. Plan
  const ap = ob.assessmentAndPlan || {};
  const ddxList = [
    ...(Array.isArray(ap.ddx) ? ap.ddx.map((x) => (isEn ? cleanEn(x) : x)) : []),
    ...(ap.ddxCustom ? ap.ddxCustom.split(/\n+/).map((x) => (isEn ? cleanEn(x) : x.trim())).filter(Boolean) : [])
  ].filter(Boolean);
  const orderLines = buildAdcaOrdersLines(ap.adcaVanDimls, isEn);

  const dateDisplay = hasValue(ap.adcaVanDimls?.dateTime) ? (isEn ? cleanEn(ap.adcaVanDimls.dateTime) : ap.adcaVanDimls.dateTime) : new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');
  const demoBanner = buildDemographicHeader(d, formula, dateDisplay, isEn);
  const hpiBody = [openingSentence + (rhNote ? ` ${rhNote}` : ''), archProse, symProse, pohText].filter(Boolean).join('\n\n');

  const workupBody = [
    usLines.length ? usLines.join('\n') : '',
    acAuditParts.length ? (isEn ? `- **Antenatal Screening Audit:** ${acAuditParts.join(' | ')}` : `- **بررسی غربالگری‌ها و مراقبت‌های قبلی:** ${acAuditParts.join(' | ')}`) : '',
    labItems.length ? (isEn ? `- **Admission Labs:** ${labItems.join(' | ')}` : `- **آزمایشات بدو پذیرش:** ${labItems.join(' | ')}`) : '',
    hasValue(ob.paraclinics?.keyLabsNote) ? (isEn ? `- **Lab Notes:** ${cleanEn(ob.paraclinics.keyLabsNote)}` : `- **توضیحات آزمایشات:** ${ob.paraclinics.keyLabsNote}`) : '',
    nstLine
  ].filter(Boolean).join('\n');

  const obsAbdBody = [
    fhrFhParts.length ? `- ${fhrFhParts.join(' | ')}` : '',
    ...peAbdomenAndExtLines
  ].filter(Boolean).join('\n');

  const tvBody = [
    (!idx.isVirgin && tvParts.length) ? (isEn ? `- **TV Exam:** ${tvParts.join(' | ')}${bishop.assessedCount > 0 ? ` — **${bishop.labelEn}**` : ''}` : `- **یافته‌های TV:** ${tvParts.join(' | ')}${bishop.assessedCount > 0 ? ` — **${bishop.labelFa}**` : ''}`) : '',
    ...tvPeLines
  ].filter(Boolean).join('\n');

  if (isEn) {
    return [
      demoBanner,
      `### OBSTETRICS & GYNECOLOGY WARD ADMISSION NOTE (OBSTETRIC PATIENT)`,
      ccText ? `**1. Chief Complaint (CC):** "${ccText}"` : `**1. Chief Complaint (CC):** Not yet recorded.`,
      `### 2. History of Present Illness (PI)\n${hpiBody}`,
      `### 3–7. Core Histories & Past Anesthesia History (PAHx)\n- **3. PMHx:** ${shared.pmhText}\n- **4. PSHx:** ${shared.pshText}\n- **5. Drug Hx:** ${shared.dhText}\n- **6. PAHx:** ${shared.pahxText}\n- **7. Allergies:** ${shared.allergyText}${shared.shFhText ? `\n- ${shared.shFhText}` : ''}`,
      `### 8. Last Obstetric Ultrasound, Antenatal Screening & Fetal Surveillance\n${workupBody || '- Not yet documented.'}`,
      `### 9. Vital Signs\n- ${vitalsLine || 'Not yet recorded.'}`,
      `### 10. Obstetric Abdominal Exam, FHR & DTR\n${obsAbdBody || '- Not yet assessed.'}`,
      `### 11. Vaginal Exam (TV), Clinical Pelvimetry & Speculum\n${tvBody || '- Not yet assessed.'}`,
      `### 12. Differential Diagnoses (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- Not yet documented.'}`,
      `### 13. Management Plan & Admission Orders (ADCA VAN DIMLS)\n${hasValue(ap.planSummary) ? `${cleanEn(ap.planSummary)}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- Orders not yet entered.'}`
    ].filter(Boolean).join('\n\n');
  }

  return [
    demoBanner,
    `### شرح حال بخش زنان و زایمان (بخش مامایی / پره‌ناتال)`,
    ccText ? `**۱. شکایت اصلی (CC):** «${ccText}»` : `**۱. شکایت اصلی (CC):** ثبت نشده است.`,
    `### ۲. شرح بیماری فعلی و سوابق بارداری (PI)\n${hpiBody}`,
    `### ۳ تا ۷. سوابق بالینی و سابقه بیهوشی (PAHx)\n- **۳. PMHx:** ${shared.pmhText}\n- **۴. PSHx:** ${shared.pshText}\n- **۵. Drug Hx:** ${shared.dhText}\n- **۶. PAHx:** ${shared.pahxText}\n- **۷. Allergy:** ${shared.allergyText}${shared.shFhText ? `\n- ${shared.shFhText}` : ''}`,
    `### ۸. آخرین سونوگرافی بارداری، غربالگری‌ها و آزمایشات\n${workupBody || '- هنوز ثبت نشده است.'}`,
    `### ۹. علائم حیاتی (Vital Signs)\n- ${vitalsLine || 'هنوز ثبت نشده است.'}`,
    `### ۱۰. معاینه شکم حاملگی، FHR و رفلکس‌ها\n${obsAbdBody || '- هنوز ارزیابی نشده است.'}`,
    `### ۱۱. معاینه واژینال (TV)، پلویمتری و اسپکولوم\n${tvBody || '- هنوز ارزیابی نشده است.'}`,
    `### ۱۲. تشخیص‌های افتراقی (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- هنوز ثبت نشده است.'}`,
    `### ۱۳. برنامه درمانی (Plan) و دستورات بستری (ADCA VAN DIMLS)\n${hasValue(ap.planSummary) ? `${ap.planSummary}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- دستورات بستری هنوز ثبت نشده است.'}`
  ].filter(Boolean).join('\n\n');
}

function generateGynecologyNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const mh = ob.menstrualHistory || {};
  const gsr = ob.gynScreeningAndRecords || {};
  const hpi = ob.ccAndHpi || {};
  const shared = collectSharedHistories(clinicalState, ob, isEn);

  const age = normalizeDigits(d.age || '');
  const ccRaw = hasValue(hpi.ccText) ? hpi.ccText : (hasValue(clinicalState.cc?.patientQuote) ? clinicalState.cc.patientQuote : '');
  const ccText = hasValue(ccRaw) ? (isEn ? cleanEn(ccRaw) : String(ccRaw).trim()) : '';
  const durRaw = hasValue(hpi.duration) ? (isEn ? cleanEn(hpi.duration) : String(hpi.duration).trim()) : '';

  const maritalMap = {
    married: isEn ? 'married' : 'متأهل',
    single: isEn ? 'single' : 'مجرد',
    divorced: isEn ? 'divorced' : 'مطلقه',
    widowed: isEn ? 'widowed' : 'همسر فوت‌شده'
  };
  const reproMap = {
    reproductive: isEn ? 'reproductive-age' : 'در سنین باروری',
    perimenopausal: isEn ? 'perimenopausal' : 'در دوره حوالی یائسگی (پری‌منوپوز)',
    postmenopausal: isEn
      ? `postmenopausal${hasValue(mh.menopauseAge || idx.menopauseAge) ? ` (since age ${mh.menopauseAge || idx.menopauseAge})` : ''}`
      : `یائسه${hasValue(mh.menopauseAge || idx.menopauseAge) ? ` (سن یائسگی: ${mh.menopauseAge || idx.menopauseAge} سال)` : ''}`,
    pregnant: isEn ? 'pregnant' : 'باردار',
    postpartum: isEn ? 'postpartum' : 'دوره پس از زایمان'
  };

  const formula = formatObstetricFormula(idx, 'gynecology');
  const hasNdCs = hasValue(idx.ND) || hasValue(idx.CS);
  const nd = hasValue(idx.ND) ? String(idx.ND).trim() : '0';
  const cs = hasValue(idx.CS) ? String(idx.CS).trim() : '0';

  const mensesParts = [];
  if (hasValue(mh.lmpDate || ob.gestationalDating?.lmpDate)) {
    mensesParts.push(`LMP: ${isEn ? cleanEn(mh.lmpDate || ob.gestationalDating.lmpDate) : (mh.lmpDate || ob.gestationalDating.lmpDate)}`);
  }
  if (mh.regularity) {
    mensesParts.push(mh.regularity === 'irregular' ? (isEn ? 'irregular cycles' : 'الگوی منس نامنظم') : (isEn ? 'regular cycles' : 'الگوی منس منظم'));
  }
  if (hasValue(mh.cycleIntervalDays)) {
    mensesParts.push(isEn ? `${mh.cycleIntervalDays}-day interval` : `طول سیکل ${mh.cycleIntervalDays} روز`);
  }
  if (hasValue(mh.bleedingDurationDays)) {
    mensesParts.push(isEn ? `${mh.bleedingDurationDays} days flow` : `مدت خونریزی ${mh.bleedingDurationDays} روز`);
  }
  if (mh.flowVolume) {
    const flowMap = {
      light: isEn ? 'light flow' : 'حجم کم',
      normal: isEn ? 'moderate flow' : 'حجم متوسط/طبیعی',
      heavy: isEn ? 'heavy flow (HMB)' : 'حجم شدید (لخته/پد مکرر)'
    };
    mensesParts.push(flowMap[mh.flowVolume] || '');
  }
  if (hasValue(mh.padsPerDay)) {
    mensesParts.push(isEn ? `${mh.padsPerDay} pads/day` : `مصرف ${mh.padsPerDay} پد در روز`);
  }

  const cMethod = gsr.contraception?.currentMethod;
  const contraObj = cMethod ? CONTRACEPTION_MAP[cMethod] : null;
  const contraClause = contraObj
    ? (isEn ? `contraception: ${contraObj.en}` : `روش پیشگیری از بارداری: ${contraObj.fa}`)
    : '';

  let openingSentence = '';
  if (isEn) {
    const segs = [
      age ? `The patient is a ${age}-year-old` : 'The patient is an adult',
      maritalMap[idx.maritalStatus] || '',
      hasValue(idx.marriageDurationYears) ? `(married ${idx.marriageDurationYears}y)` : '',
      formula ? `**${formula}**` : '',
      reproMap[idx.reproductiveStatus] || '',
      'female patient',
      hasNdCs ? `(${nd} prior NVD, ${cs} prior CS)` : ''
    ].filter(Boolean).join(' ');

    const extras = [
      mensesParts.length ? `menstrual history: ${mensesParts.filter(Boolean).join(', ')}` : '',
      contraClause
    ].filter(Boolean).join('; ');

    openingSentence = `${segs}${extras ? `, with ${extras}` : ''}${ccText ? `, presenting${durRaw ? ` ${durRaw} prior` : ''} with a chief complaint of "${ccText}".` : `${durRaw ? `, presenting ${durRaw} prior` : ''} for gynecologic evaluation.`}`;
  } else {
    const segs = [
      age ? `بیمار خانم ${age} ساله` : 'بیمار خانم',
      maritalMap[idx.maritalStatus] || '',
      hasValue(idx.marriageDurationYears) ? `(مدت ازدواج: ${idx.marriageDurationYears} سال)` : '',
      formula ? `**${formula}**` : '',
      hasNdCs ? `(سابقه ${nd} زایمان طبیعی و ${cs} سزارین)` : '',
      reproMap[idx.reproductiveStatus] || '',
      mensesParts.length ? `با ${mensesParts.filter(Boolean).join('، ')}` : '',
      contraClause
    ].filter(Boolean).join('، ');

    openingSentence = `${segs}${ccText ? ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} با شکایت «${ccText}» مراجعه کرده است.` : ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} جهت ارزیابی بیماری‌های زنان مراجعه کرده است.`}`;
  }

  const archProse = buildArchetypeChronologyProse(ob, isEn);
  const symProse = buildHpiSymptomSentences(ob, isEn);

  // Records, Pathology, Pap, HPV, TVS/TAS & Labs
  const scr = gsr.cervicalAndBreastScreening || {};
  const pathRecs = Array.isArray(gsr.priorPathologyAndCurettage?.records) ? gsr.priorPathologyAndCurettage.records : [];
  const tvs = ob.paraclinics?.gynecologicUltrasound || {};
  const kl = ob.paraclinics?.keyLabs || {};

  const recordBullets = [
    hasValue(scr.lastPapSmearResult)
      ? (isEn ? `- **Pap Smear${scr.lastPapSmearDate ? ` (${cleanEn(scr.lastPapSmearDate)})` : ''}:** ${cleanEn(scr.lastPapSmearResult)}` : `- **پاپ‌اسمیر${scr.lastPapSmearDate ? ` (${scr.lastPapSmearDate})` : ''}:** ${scr.lastPapSmearResult}`)
      : '',
    hasValue(scr.hpvTestStatus)
      ? (isEn ? `- **HPV DNA Test:** ${cleanEn(scr.hpvTestStatus)}` : `- **تست HPV:** ${scr.hpvTestStatus}`)
      : '',
    pathRecs.length > 0
      ? (isEn
          ? `- **Prior D&C / Biopsy Pathology:** ${pathRecs.map((r) => `${cleanEn(r.procedureType)} (${r.date || 'Prior'}): ${cleanEn(r.pathologyResult)}`).join(' | ')}`
          : `- **پاتولوژی کورتاژ و بیوپسی قبلی:** ${pathRecs.map((r) => `${r.procedureType} (${r.date || 'قبلی'}): ${r.pathologyResult}`).join(' | ')}`)
      : '',
    (hasValue(tvs.uterusDimensionsMm) || hasValue(tvs.myometrialEchoAndMyomas) || hasValue(tvs.endometrialThicknessMm) || hasValue(tvs.rightOvary) || hasValue(tvs.leftOvary) || hasValue(tvs.culDeSacFreeFluid))
      ? (isEn
          ? `- **Pelvic Ultrasound (${tvs.scanType || 'TVS'}${tvs.scanDate ? ` ${cleanEn(tvs.scanDate)}` : ''}):** ${[
              hasValue(tvs.uterusDimensionsMm) ? `Uterus ${tvs.uterusDimensionsMm}` : '',
              hasValue(tvs.myometrialEchoAndMyomas) ? cleanEn(tvs.myometrialEchoAndMyomas) : '',
              hasValue(tvs.endometrialThicknessMm) ? `ET ${tvs.endometrialThicknessMm} mm` : '',
              hasValue(tvs.rightOvary) ? `RO: ${cleanEn(tvs.rightOvary)}` : '',
              hasValue(tvs.leftOvary) ? `LO: ${cleanEn(tvs.leftOvary)}` : '',
              hasValue(tvs.culDeSacFreeFluid) ? `Cul-de-sac: ${cleanEn(tvs.culDeSacFreeFluid)}` : ''
            ].filter(Boolean).join('; ')}`
          : `- **سونوگرافی لگن (${tvs.scanType || 'TVS'}${tvs.scanDate ? ` ${tvs.scanDate}` : ''}):** ${[
              hasValue(tvs.uterusDimensionsMm) ? `ابعاد رحم ${tvs.uterusDimensionsMm}` : '',
              hasValue(tvs.myometrialEchoAndMyomas) ? tvs.myometrialEchoAndMyomas : '',
              hasValue(tvs.endometrialThicknessMm) ? `ضخامت اندومتر (ET) ${tvs.endometrialThicknessMm} mm` : '',
              hasValue(tvs.rightOvary) ? `تخمدان راست: ${tvs.rightOvary}` : '',
              hasValue(tvs.leftOvary) ? `تخمدان چپ: ${tvs.leftOvary}` : '',
              hasValue(tvs.culDeSacFreeFluid) ? `کل‌دوساک: ${tvs.culDeSacFreeFluid}` : ''
            ].filter(Boolean).join('؛ ')}`)
      : ''
  ].filter(Boolean);

  const labItems = [
    hasValue(kl.bhcg) ? `β-hCG: ${kl.bhcg}` : '',
    hasValue(kl.wbc) ? `WBC: ${kl.wbc}` : '',
    hasValue(kl.hb) ? `Hb: ${kl.hb}` : '',
    hasValue(kl.plt) ? `Plt: ${kl.plt}` : '',
    hasValue(kl.tsh) ? `TSH: ${kl.tsh}` : '',
    hasValue(kl.ptInr) ? `PT/INR: ${kl.ptInr}` : '',
    hasValue(kl.ca125) ? `CA-125: ${kl.ca125}` : '',
    hasValue(kl.prolactin) ? `Prolactin: ${kl.prolactin}` : '',
    hasValue(kl.fshLh) ? `FSH/LH: ${kl.fshLh}` : '',
    hasValue(kl.cr) ? `Cr: ${kl.cr}` : ''
  ].filter(Boolean);
  if (labItems.length > 0) {
    recordBullets.push(isEn ? `- **Admission Labs:** ${labItems.join(' | ')}` : `- **آزمایشات بدو مراجعه:** ${labItems.join(' | ')}`);
  }
  if (hasValue(ob.paraclinics?.keyLabsNote)) {
    recordBullets.push(isEn ? `- **Lab Notes:** ${cleanEn(ob.paraclinics.keyLabsNote)}` : `- **توضیحات آزمایشات:** ${ob.paraclinics.keyLabsNote}`);
  }

  const v = ob.pe?.vitals || {};
  const vitalsLine = [
    hasValue(v.bp) ? `BP: ${v.bp}` : '',
    hasValue(v.pr) ? `PR: ${v.pr}` : '',
    hasValue(v.rr) ? `RR: ${v.rr}` : '',
    hasValue(v.temp) ? `T: ${v.temp}` : ''
  ].filter(Boolean).join(' | ');

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
  ].filter(Boolean);
  const orderLines = buildAdcaOrdersLines(ap.adcaVanDimls, isEn);

  const dateDisplay = hasValue(ap.adcaVanDimls?.dateTime) ? (isEn ? cleanEn(ap.adcaVanDimls.dateTime) : ap.adcaVanDimls.dateTime) : new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');
  const demoBanner = buildDemographicHeader(d, formula, dateDisplay, isEn);
  const hpiBody = [openingSentence, archProse, symProse].filter(Boolean).join('\n\n');

  if (isEn) {
    return [
      demoBanner,
      `### OBSTETRICS & GYNECOLOGY WARD ADMISSION NOTE (GYNECOLOGY PATIENT)`,
      ccText ? `**1. Chief Complaint (CC):** "${ccText}"` : `**1. Chief Complaint (CC):** Not yet recorded.`,
      `### 2. History of Present Illness (PI)\n${hpiBody}`,
      `### 3–7. Core Histories & Past Anesthesia History (PAHx)\n- **3. PMHx:** ${shared.pmhText}\n- **4. PSHx:** ${shared.pshText}\n- **5. Drug Hx:** ${shared.dhText}\n- **6. PAHx:** ${shared.pahxText}\n- **7. Allergies:** ${shared.allergyText}${shared.shFhText ? `\n- ${shared.shFhText}` : ''}`,
      `### Prior Labs, Pelvic Ultrasound, Pathology, Pap Smear & HPV Audit\n${recordBullets.length ? recordBullets.join('\n') : '- Not yet documented.'}`,
      `### 8. Vital Signs\n- ${vitalsLine || 'Not yet recorded.'}`,
      `### 9. Physical, Speculum & Bimanual Pelvic Exam\n${[...abdLines, ...pelvicLines].length ? [...abdLines, ...pelvicLines].join('\n') : '- Not yet assessed.'}`,
      `### 10. Differential Diagnoses (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- Not yet documented.'}`,
      `### 11. Management Plan & Admission Orders (ADCA VAN DIMLS)\n${hasValue(ap.planSummary) ? `${cleanEn(ap.planSummary)}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- Orders not yet entered.'}`
    ].filter(Boolean).join('\n\n');
  }

  return [
    demoBanner,
    `### شرح حال بخش زنان و زایمان (بیماری‌های زنان / ژنیکولوژی)`,
    ccText ? `**۱. شکایت اصلی (CC):** «${ccText}»` : `**۱. شکایت اصلی (CC):** ثبت نشده است.`,
    `### ۲. شرح بیماری فعلی و الگوی قاعدگی (PI)\n${hpiBody}`,
    `### ۳ تا ۷. سوابق بالینی و سابقه بیهوشی (PAHx)\n- **۳. PMHx:** ${shared.pmhText}\n- **۴. PSHx:** ${shared.pshText}\n- **۵. Drug Hx:** ${shared.dhText}\n- **۶. PAHx:** ${shared.pahxText}\n- **۷. Allergy:** ${shared.allergyText}${shared.shFhText ? `\n- ${shared.shFhText}` : ''}`,
    `### بررسی آزمایشات، سونوگرافی لگن، پاتولوژی‌ها، پاپ‌اسمیر و تست HPV\n${recordBullets.length ? recordBullets.join('\n') : '- هنوز ثبت نشده است.'}`,
    `### ۸. علائم حیاتی (Vital Signs)\n- ${vitalsLine || 'هنوز ثبت نشده است.'}`,
    `### ۹. معاینه پستان و شکم، اسپکولوم و معاینه دودستی لگن\n${[...abdLines, ...pelvicLines].length ? [...abdLines, ...pelvicLines].join('\n') : '- هنوز ارزیابی نشده است.'}`,
    `### ۱۰. تشخیص‌های افتراقی (DDx)\n${ddxList.length ? ddxList.map((item, i) => `${i + 1}. ${item}`).join('\n') : '- هنوز ثبت نشده است.'}`,
    `### ۱۱. برنامه درمانی (Plan) و دستورات بستری (ADCA VAN DIMLS)\n${hasValue(ap.planSummary) ? `${ap.planSummary}\n\n` : ''}${orderLines.length ? orderLines.join('\n') : '- دستورات بستری هنوز ثبت نشده است.'}`
  ].filter(Boolean).join('\n\n');
}

function generateSoapeAndDischargeNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const dateDisplay = new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');
  const days = Array.isArray(ob.soapeHistory) ? ob.soapeHistory : [];
  const activeDay = days.find((x) => x.id === ob.activeSoapeId) || days[days.length - 1];

  const blocks = [
    buildDemographicHeader(d, '', dateDisplay, isEn),
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
    const vt = activeDay.vitals || {};
    const vitalStr = [
      hasValue(vt.bp) ? `BP: ${vt.bp}` : '',
      hasValue(vt.pr) ? `PR: ${vt.pr}` : '',
      hasValue(vt.rr) ? `RR: ${vt.rr}` : '',
      hasValue(vt.temp) ? `T: ${vt.temp}` : '',
      hasValue(vt.io) ? `I&O: ${isEn ? cleanEn(vt.io) : vt.io}` : ''
    ].filter(Boolean).join(' | ');

    const oTextRaw = isEn ? cleanEn(activeDay.O) : (activeDay.O || '').trim();
    const oCombined = [vitalStr, oTextRaw].filter(Boolean).join(' — ');

    const pMod = isEn ? cleanEn(activeDay.P_modifications) : (activeDay.P_modifications || '').trim();
    const pReason = isEn ? cleanEn(activeDay.P_reason) : (activeDay.P_reason || '').trim();
    const pOrders = isEn ? cleanEn(activeDay.P_newOrders) : (activeDay.P_newOrders || '').trim();

    blocks.push(isEn
      ? `**Day #${activeDay.dayNumber || 1} (${typeLabel})${activeDay.dateTime ? ` — ${cleanEn(activeDay.dateTime)}` : ''}**\n- **S (Subjective):** ${cleanEn(activeDay.S, 'Not documented.')}\n- **O (Objective — Factual Only):** ${oCombined || 'Not documented.'}\n- **A (Assessment & Prioritized Problem List):** ${cleanEn(activeDay.A, 'Not documented.')}\n- **P (Plan — Modifications & Reason):** ${[pMod, pReason ? `Reason: ${pReason}` : '', pOrders ? `New Orders: ${pOrders}` : ''].filter(Boolean).join(' | ') || 'Not documented.'}\n- **E (Patient Education):** ${cleanEn(activeDay.E, 'Not documented.')}`
      : `**روز #${activeDay.dayNumber || 1} (${typeLabel})${activeDay.dateTime ? ` — ${activeDay.dateTime}` : ''}**\n- **S (گزارش و احوالپرسی بیمار):** ${activeDay.S || 'ثبت نشده.'}\n- **O (یافته‌های عینی بدون تفسیر):** ${oCombined || 'ثبت نشده.'}\n- **A (ارزیابی و لیست اولویت‌دار مشکلات):** ${activeDay.A || 'ثبت نشده.'}\n- **P (تغییر دستورات با ذکر علت و دستورات جدید):** ${[pMod, pReason ? `علت تغییر: ${pReason}` : '', pOrders ? `دستورات جدید: ${pOrders}` : ''].filter(Boolean).join(' | ') || 'ثبت نشده.'}\n- **E (آموزش بر بالین بیمار):** ${activeDay.E || 'ثبت نشده.'}`
    );
  } else {
    blocks.push(isEn ? '- No SOAPE progress day recorded yet.' : '- هنوز یادداشت SOAPE برای این بیمار ثبت نشده است.');
  }

  const ds = ob.dischargeSadaf || {};
  if (ds.active || hasValue(ds.finalDx) || hasValue(ds.sadaf?.S_stitches) || hasValue(ds.sadaf?.D_drugsDiet)) {
    const courseMap = {
      improving: isEn ? 'Improving' : 'رو به بهبود',
      worsening: isEn ? 'Worsening' : 'رو به وخامت',
      unchanged: isEn ? 'Unchanged' : 'بدون تغییر'
    };
    blocks.push(isEn
      ? `### DISCHARGE SUMMARY (PD / DS) & SADAF INSTRUCTIONS\n- **CC & Initial Dx:** ${cleanEn(ds.ccAndInitialDx, 'Not documented.')}\n- **Final Diagnosis:** ${cleanEn(ds.finalDx, 'Not documented.')}\n- **Treatments & Surgical Procedures:** ${cleanEn(ds.treatmentsAndProcedures, 'Not documented.')}\n- **Positive & Pertinent Negative Labs:** ${cleanEn(ds.labSummary, 'Not documented.')}\n- **Disease Course & Condition at Discharge:** ${courseMap[ds.diseaseCourse] || 'Improving'}${hasValue(ds.dischargeCondition) ? ` — ${cleanEn(ds.dischargeCondition)}` : ''}\n- **S (Stitches / Incision Care):** ${cleanEn(ds.sadaf?.S_stitches, 'Not documented.')}\n- **A (Activity):** ${cleanEn(ds.sadaf?.A_activity, 'Not documented.')}\n- **D (Drugs & Diet):** ${cleanEn(ds.sadaf?.D_drugsDiet, 'Not documented.')}\n- **F (Follow-up & Pathology):** ${cleanEn(ds.sadaf?.F_followUp, 'Not documented.')}`
      : `### خلاصه پرونده ترخیص (PD / DS) و آموزش SADAF\n- **شکایت و تشخیص اولیه:** ${ds.ccAndInitialDx || 'ثبت نشده.'}\n- **تشخیص نهایی:** ${ds.finalDx || 'ثبت نشده.'}\n- **اقدامات درمانی و جراحی انجام‌شده:** ${ds.treatmentsAndProcedures || 'ثبت نشده.'}\n- **نتایج مثبت و منفی آزمایشات:** ${ds.labSummary || 'ثبت نشده.'}\n- **سیر بیماری و وضعیت زمان ترخیص:** ${courseMap[ds.diseaseCourse] || 'رو به بهبود'}${hasValue(ds.dischargeCondition) ? ` — ${ds.dischargeCondition}` : ''}\n- **S (بخیه و مراقبت زخم):** ${ds.sadaf?.S_stitches || 'ثبت نشده.'}\n- **A (سطح فعالیت):** ${ds.sadaf?.A_activity || 'ثبت نشده.'}\n- **D (داروها و رژیم غذایی):** ${ds.sadaf?.D_drugsDiet || 'ثبت نشده.'}\n- **F (مراجعه بعدی و پیگیری پاتولوژی):** ${ds.sadaf?.F_followUp || 'ثبت نشده.'}`
    );
  }

  const cn = ob.consultNote || {};
  if (cn.active || hasValue(cn.consultReason) || hasValue(cn.targetService)) {
    const urg = cn.urgency === 'urgent' ? (isEn ? 'URGENT / STAT' : 'اورژانس') : (isEn ? 'Non-Urgent / Routine' : 'غیراورژانس');
    const ptDisplay = hasValue(d.fullName) ? (isEn ? cleanEn(d.fullName) : d.fullName) : (isEn ? 'Female Patient' : 'بیمار خانم');
    const ageDisplay = normalizeDigits(d.age || '');
    blocks.push(isEn
      ? `### CONSULTATION REQUEST\n- **To Service:** ${cleanEn(cn.targetService, 'Not documented')} (${urg})\n- **Patient & Admission Reason:** ${ptDisplay}${ageDisplay ? ` (${ageDisplay} y/o)` : ''}${hasValue(cn.admissionReason) ? ` — ${cleanEn(cn.admissionReason)}` : ''}\n- **Reason for Consultation:** ${cleanEn(cn.consultReason, 'Not documented')}\n- **Clinical Summary:** ${cleanEn(cn.summary, 'Not documented')}\n- **Requesting Physician & Date/Time:** ${cleanEn(cn.requestingPhysician, 'Not documented')}${cn.dateTime ? ` | ${cleanEn(cn.dateTime)}` : ''}`
      : `### برگه درخواست مشاوره تخصصی\nبا سلام و احترام، لطفاً بیمار خانم **${ptDisplay}**${ageDisplay ? ` (${ageDisplay} ساله)` : ''} بستری در بخش زنان${hasValue(cn.admissionReason) ? ` به علت **${cn.admissionReason}**` : ''} از نظر **${cn.consultReason || 'ارزیابی تخصصی'}** مورد بررسی و مشاوره **${urg}** سرویس محترم **${cn.targetService || 'مشاوره‌شونده'}** قرار گیرند.\n- **خلاصه نکات کلیدی:** ${cn.summary || 'ثبت نشده.'}\n- **پزشک درخواست‌کننده و زمان:** ${cn.requestingPhysician || 'ثبت نشده'}${cn.dateTime ? ` | ${cn.dateTime}` : ''} — با تشکر و خسته نباشید.`
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
