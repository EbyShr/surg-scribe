/**
 * MedHistorism v3.2 — Ob/Gyn Deterministic Bilingual Clinical Narrative Engine
 * Pure ES Module (Node-safe, Zero DOM Access, Zero Emojis, Strict Not Assessed != Negative)
 *
 * Classic charting order (both Obstetrics & Gynecology):
 *   1. CC -> 2. HPI -> 3. PMH & PSH -> 4. DH / AH / SH / FH -> 5. ROS -> 6. PE -> 7. Paraclinics -> 8. Assessment & Plan
 */

import {
  OBGYN_OBSTETRIC_ARCHETYPES,
  OBGYN_GYN_ARCHETYPES,
  OBGYN_SYMPTOM_BANK,
  OBGYN_PE_BANK,
  OBGYN_CONTRACEPTION_OPTIONS,
  OBGYN_CONCEPTION_METHODS,
  OBGYN_ANEMIA_SYMPTOMS,
  OBGYN_ALLERGY_REACTIONS,
  OBGYN_PARACLINIC_STUDY_TYPES,
  OBGYN_PE_OPTIONS,
  OBGYN_GENERAL_PE_SYSTEM_KEYS,
  OBGYN_BLEED_VOLUME_OPTIONS,
  OBGYN_CLOT_OPTIONS
} from './obgyn-data.js';
import {
  normalizeObgynState,
  normalizeDigits,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory
} from './obgyn-state.js';
import { getCurrentLanguage, tLabel } from '../../i18n.js';
import { ROS_SYSTEM_META, PE_SYSTEMS_CONFIG } from '../../schema.js';
import { MASTER_ROS_BANK } from '../../data/ros-bank.js';
import { MASTER_PE_BANK } from '../../data/pe-bank.js';

const CONTRACEPTION_MAP = Object.fromEntries(OBGYN_CONTRACEPTION_OPTIONS.map((o) => [o.val, o]));
const CONCEPTION_MAP = Object.fromEntries(OBGYN_CONCEPTION_METHODS.map((o) => [o.val, o]));
const NOTABLE_CONCEPTION = new Set(['IVF', 'ICSI', 'IUI', 'egg_donation']);
const ROS_BANK_MAP = Object.fromEntries(MASTER_ROS_BANK.map((it) => [it.id, it]));
const PE_BANK_MAP = Object.fromEntries(MASTER_PE_BANK.map((it) => [it.id, it]));
const LEGACY_PE_BANK_MAP = Object.fromEntries(OBGYN_PE_BANK.map((it) => [it.id, it]));

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

const sepOf = (isEn) => (isEn ? ', ' : '، ');
const semiOf = (isEn) => (isEn ? '; ' : '؛ ');

function stripNumberingAndLatin(title) {
  return String(title || '')
    .replace(/^[۰-۹0-9]+[.\-–\s]*[۰-۹0-9]*[.\s]*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

function freeText(val, isEn) {
  if (!hasValue(val)) return '';
  return isEn ? cleanEn(val) : String(val).trim();
}

function optLabel(listKey, val, isEn) {
  if (!hasValue(val)) return '';
  const list = OBGYN_PE_OPTIONS[listKey] || [];
  const opt = list.find((o) => o.val === val);
  if (opt) return isEn ? opt.en : opt.fa;
  return freeText(val, isEn);
}

function lookupLabel(list, val, isEn) {
  if (!hasValue(val)) return '';
  const opt = list.find((o) => o.val === val);
  if (opt) return isEn ? opt.en : opt.fa;
  return freeText(val, isEn);
}

function resolveReactionLabel(r, isEn) {
  if (r && typeof r === 'object') {
    return isEn ? cleanEn(r.en || r.fa || r.label || '') : String(r.fa || r.label || r.en || '').trim();
  }
  const key = String(r || '').trim();
  const known = OBGYN_ALLERGY_REACTIONS.find((x) => x.id === key || x.fa === key || x.en === key);
  if (known) return isEn ? known.en : known.fa;
  return isEn ? cleanEn(key) : key;
}

function collectSharedHistories(clinicalState, ob, isEn) {
  const c = clinicalState || {};
  const notDoc = isEn ? 'Not documented.' : 'ثبت نشده / بررسی نشده.';

  // PMHx
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
    pmhText = pmhPos.join(sepOf(isEn));
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

  // PSHx (anesthesia / surgical complication notes live inside the row note)
  const surgeries = Array.isArray(c.psh?.surgeries) ? c.psh.surgeries : [];
  let pshText = notDoc;
  if (surgeries.length > 0) {
    pshText = surgeries.map((s) => {
      const nm = isEn ? cleanEn(s.en || s.label || s.procedure || s.name) : (s.label || s.procedure || s.name || s.en);
      const extra = [s.year, s.note].filter(Boolean).map((x) => (isEn ? cleanEn(x) : x)).join(' — ');
      return extra ? `${nm} (${extra})` : nm;
    }).filter(Boolean).join(sepOf(isEn));
  } else if (c.psh?.noSurgeries) {
    pshText = isEn ? 'Denies prior surgical history.' : 'سابقه عمل جراحی قبلی را ذکر نمی‌کند.';
  } else if (c.psh?.note && String(c.psh.note).trim()) {
    pshText = isEn ? cleanEn(c.psh.note) : String(c.psh.note).trim();
  }

  // Drug history
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
    }).filter(Boolean).join(sepOf(isEn));
  } else if (c.dh?.noRoutineMeds) {
    dhText = isEn ? 'Denies routine medications.' : 'داروی خاصی به صورت روتین مصرف نمی‌کند.';
  } else if (c.dh?.note && String(c.dh.note).trim()) {
    dhText = isEn ? cleanEn(c.dh.note) : String(c.dh.note).trim();
  }

  // Allergy history: each allergen is paired with its exact reaction(s)
  const ahSel = Array.isArray(c.ah?.selected) ? c.ah.selected : [];
  let allergyText = notDoc;
  if (c.ah?.nkda && ahSel.length === 0) {
    allergyText = isEn ? 'No known drug or food allergies (NKDA).' : 'حساسیت دارویی یا غذایی شناخته‌شده‌ای ذکر نمی‌کند (NKDA).';
  } else if (ahSel.length > 0) {
    allergyText = ahSel.map((a) => {
      const obj = a && typeof a === 'object' ? a : { label: String(a) };
      const lbl = isEn ? cleanEn(obj.en || obj.label) : (obj.label || obj.en);
      const rx = (Array.isArray(obj.reactions) ? obj.reactions : []).map((r) => resolveReactionLabel(r, isEn)).filter(Boolean);
      const det = hasValue(obj.detail) ? (isEn ? cleanEn(obj.detail) : String(obj.detail).trim()) : '';
      const rxParts = [...rx, det].filter(Boolean);
      if (rxParts.length === 0) return lbl;
      return isEn
        ? `${lbl} (reaction: ${rxParts.join('; ')})`
        : `${lbl} (واکنش: ${rxParts.join('؛ ')})`;
    }).join(sepOf(isEn));
  } else if (c.ah?.note && String(c.ah.note).trim()) {
    allergyText = isEn ? cleanEn(c.ah.note) : String(c.ah.note).trim();
  }

  // SH & FH
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
    fhParts.push(c.fh.diseases.map((f) => (isEn ? cleanEn(f.name || f.en) : f.name)).filter(Boolean).join(sepOf(isEn)));
  }
  if (hasValue(c.fh?.note)) fhParts.push(isEn ? cleanEn(c.fh.note) : String(c.fh.note).trim());

  return {
    pmhText,
    pshText,
    dhText,
    allergyText,
    shText: shParts.join(semiOf(isEn)),
    fhText: fhParts.filter(Boolean).join(semiOf(isEn))
  };
}

/* ---------------------------------- HPI ---------------------------------- */

function buildAnemiaParts(ob, isEn) {
  const map = ob.ccAndHpi?.anemiaSymptoms || {};
  const pos = [];
  const neg = [];
  OBGYN_ANEMIA_SYMPTOMS.forEach((it) => {
    const st = map[it.id]?.state;
    if (st === 1) pos.push(isEn ? it.en : it.fa);
    else if (st === -1) neg.push(isEn ? it.en : it.fa);
  });
  return { pos, neg, allNeg: neg.length === OBGYN_ANEMIA_SYMPTOMS.length };
}

function buildHpiSymptomSentences(ob, isEn) {
  const sub = ob.subMode === 'gynecology' ? 'gynecology' : 'obstetrics';
  const symMap = ob.ccAndHpi?.symptoms || {};
  const bank = OBGYN_SYMPTOM_BANK.filter((s) => s.subMode === sub);

  const posParts = [];
  const negParts = [];

  const pushEntry = (item, entry) => {
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
      const det = hasValue(entry.detail) ? (isEn ? cleanEn(entry.detail) : String(entry.detail).trim()) : '';
      const qualifiers = [...mods, det].filter(Boolean);
      posParts.push(qualifiers.length > 0 ? `${label} (${qualifiers.join(semiOf(isEn))})` : label);
    } else if (entry.state === -1) {
      negParts.push(label);
    }
  };

  bank.forEach((item) => {
    const entry = symMap[item.id];
    if (!entry || (entry.state !== 1 && entry.state !== -1)) return; // Strict Not Assessed != Negative
    pushEntry(item, entry);
  });

  Object.entries(symMap).forEach(([id, entry]) => {
    if (!entry || (entry.state !== 1 && entry.state !== -1)) return;
    if (bank.some((b) => b.id === id)) return;
    const bankAny = OBGYN_SYMPTOM_BANK.find((b) => b.id === id);
    if (!bankAny) return;
    pushEntry(bankAny, entry);
  });

  const anemia = buildAnemiaParts(ob, isEn);
  if (anemia.pos.length > 0) {
    posParts.push(isEn ? `anemia-related symptoms (${anemia.pos.join(', ')})` : `علائم کم‌خونی (${anemia.pos.join('، ')})`);
  }
  if (anemia.allNeg) {
    negParts.push(isEn ? 'symptoms of anemia (fatigue, orthostatic dizziness, palpitations, exertional dyspnea, headache or tinnitus)' : 'علائم کم‌خونی (ضعف، سرگیجه وضعیتی، تپش قلب، تنگی نفس فعالیتی، سردرد یا وزوز گوش)');
  } else if (anemia.neg.length > 0) {
    negParts.push(...anemia.neg);
  }

  const sentences = [];
  if (posParts.length > 0) {
    sentences.push(isEn
      ? `Associated symptoms include ${posParts.join(', ')}.`
      : `از نظر علائم همراه، بیمار وجود ${posParts.join('، ')} را ذکر می‌کند.`);
  }
  if (negParts.length > 0) {
    sentences.push(isEn
      ? `The patient denies ${negParts.join(', ')}.`
      : `بیمار وجود ${negParts.join('، ')} را ذکر نمی‌کند.`);
  }
  return sentences.join(' ');
}

function bleedingClause(volume, clots, isEn) {
  const vLabel = hasValue(volume) ? lookupLabel(OBGYN_BLEED_VOLUME_OPTIONS, volume, isEn) : '';
  const cLabel = hasValue(clots) ? lookupLabel(OBGYN_CLOT_OPTIONS, clots, isEn) : '';
  if (!vLabel && !cLabel) return '';
  if (vLabel && cLabel) {
    if (clots === 'none') {
      return isEn ? `${vLabel.toLowerCase()}-volume bleeding without clots` : `خونریزی با حجم ${vLabel} و بدون دفع لخته`;
    }
    return isEn ? `${vLabel.toLowerCase()}-volume bleeding with ${cLabel.toLowerCase()}` : `خونریزی با حجم ${vLabel} همراه با ${cLabel}`;
  }
  if (vLabel) return isEn ? `${vLabel.toLowerCase()}-volume bleeding` : `خونریزی با حجم ${vLabel}`;
  return isEn ? cLabel.toLowerCase() : cLabel;
}

function buildArchetypeChronologyProse(ob, isEn) {
  const hpi = ob.ccAndHpi || {};
  const list = ob.subMode === 'gynecology' ? OBGYN_GYN_ARCHETYPES : OBGYN_OBSTETRIC_ARCHETYPES;
  const presentations = Array.isArray(hpi.presentations) && hpi.presentations.length > 0
    ? hpi.presentations
    : (hpi.selectedArchetype
        ? [{ id: `legacy_${hpi.selectedArchetype}`, archetypeId: hpi.selectedArchetype, fields: hpi.archetypeFields || {} }]
        : []);

  const sentences = [];
  presentations.forEach((pres) => {
    const arch = list.find((a) => a.id === pres.archetypeId);
    if (!arch) return;
    const fields = pres.fields || {};
    const BLEED_KEYS = new Set(['bleedingAmount', 'bleedingVolume', 'clotPassage']);
    const isBleedCard = pres.archetypeId === 'OB-3' || pres.archetypeId === 'GYN-1';
    const details = [];

    if (isBleedCard) {
      const clause = bleedingClause(fields.bleedingAmount ?? fields.bleedingVolume, fields.clotPassage, isEn);
      if (clause) details.push(clause);
    }
    (arch.fields || []).forEach((f) => {
      if (isBleedCard && BLEED_KEYS.has(f.key)) return;
      const val = fields[f.key];
      if (!hasValue(val)) return;
      const vLabel = getFieldOptionLabel(list, arch.id, f.key, val, isEn);
      if (!vLabel) return;
      details.push(`${isEn ? f.en : f.fa}: ${vLabel}`);
    });

    const archName = isEn ? arch.en : arch.fa;
    if (details.length > 0) {
      sentences.push(`**${archName}** — ${details.join(semiOf(isEn))}.`);
    } else {
      sentences.push(isEn ? `Presenting problem: **${archName}**.` : `مشکل اصلی بیمار: **${archName}**.`);
    }
  });

  if (hasValue(hpi.narrativeExtra)) {
    sentences.push(isEn ? cleanEn(hpi.narrativeExtra) : String(hpi.narrativeExtra).trim());
  }
  return sentences.join(' ');
}

function conceptionClause(idx, isEn) {
  const m = idx.conceptionMethod;
  if (!NOTABLE_CONCEPTION.has(m)) return '';
  const o = CONCEPTION_MAP[m];
  return isEn ? `conceived via ${o.enShort}` : `بارداری از طریق ${o.faShort}`;
}

function menstrualSummary(mh, ob, isEn) {
  const parts = [];
  const lmp = mh.lmpDate || ob.gestationalDating?.lmpDate;
  if (hasValue(lmp)) parts.push(`LMP: ${isEn ? cleanEn(lmp) : lmp}`);
  if (mh.regularity) {
    parts.push(mh.regularity === 'irregular'
      ? (isEn ? 'irregular cycles' : 'الگوی منس نامنظم')
      : (isEn ? 'regular cycles' : 'الگوی منس منظم'));
  }
  if (hasValue(mh.cycleIntervalDays)) parts.push(isEn ? `${mh.cycleIntervalDays}-day interval` : `طول سیکل ${mh.cycleIntervalDays} روز`);
  if (hasValue(mh.bleedingDurationDays)) parts.push(isEn ? `${mh.bleedingDurationDays} days of flow` : `مدت خونریزی ${mh.bleedingDurationDays} روز`);
  const flow = bleedingClause(mh.flowVolume, mh.clotStatus, isEn);
  if (flow) parts.push(flow);
  if (hasValue(mh.padsPerDay)) parts.push(isEn ? `${mh.padsPerDay} pads/day` : `مصرف ${mh.padsPerDay} پد در روز`);
  if (mh.floodingOrNightChange) parts.push(isEn ? 'flooding / nocturnal pad change' : 'نیاز به تعویض پد شبانه');
  if (hasValue(mh.dysmenorrhea)) parts.push(isEn ? `dysmenorrhea: ${cleanEn(mh.dysmenorrhea)}` : `دیسمنوره: ${mh.dysmenorrhea}`);
  return parts;
}

function buildObstetricsOpening(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const gd = ob.gestationalDating || {};
  const hpi = ob.ccAndHpi || {};
  const age = normalizeDigits(d.age || '');
  const ccRaw = hasValue(hpi.ccText) ? hpi.ccText : (hasValue(clinicalState.cc?.patientQuote) ? clinicalState.cc.patientQuote : '');
  const ccText = freeText(ccRaw, isEn);
  const durRaw = freeText(hpi.duration, isEn);

  const formula = formatObstetricFormula(idx, 'obstetrics');
  const hasNdCs = hasValue(idx.ND) || hasValue(idx.CS);
  const nd = hasValue(idx.ND) ? String(idx.ND).trim() : '0';
  const cs = hasValue(idx.CS) ? String(idx.CS).trim() : '0';
  const csIndStr = Number(cs) > 0 && hasValue(idx.priorCsIndications)
    ? (isEn ? ` due to ${cleanEn(idx.priorCsIndications)}` : ` به علت ${idx.priorCsIndications}`)
    : '';
  const bgRh = hasValue(idx.maternalBgRh) ? idx.maternalBgRh : '';
  const conc = conceptionClause(idx, isEn);

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

  if (isEn) {
    const subject = [
      age ? `The patient is a ${age}-year-old` : 'The patient is an adult',
      formula ? `**${formula}**` : '',
      'female',
      hasNdCs ? `(${nd} prior NVD, ${cs} prior CS${csIndStr})` : '',
      bgRh ? `blood group **${bgRh}**` : '',
      conc
    ].filter(Boolean).join(' ');
    const gaSeg = gaClausesEn.length > 0
      ? `, at ${gaClausesEn.join(', ')}${gaCalc.officialEdd ? ` (EDD: **${gaCalc.officialEdd}**)` : ''}`
      : '';
    const tail = ccText
      ? `, presenting${durRaw ? ` ${durRaw} prior to arrival` : ''} with a chief complaint of "${ccText}".`
      : `${durRaw ? `, presenting ${durRaw} prior to arrival` : ''} for obstetric admission and evaluation.`;
    return `${subject}${gaSeg}${tail}`;
  }

  const subject = [
    age ? `بیمار خانم ${age} ساله` : 'بیمار خانم',
    formula ? `**${formula}**` : '',
    hasNdCs ? `(سابقه ${nd} زایمان طبیعی و ${cs} سزارین${csIndStr})` : '',
    bgRh ? `گروه خونی **${bgRh}**` : '',
    conc
  ].filter(Boolean).join('، ');
  const gaSeg = gaClausesFa.length > 0
    ? `، با سن بارداری ${gaClausesFa.join('، ')}${gaCalc.officialEdd ? ` (EDD: **${gaCalc.officialEdd}**)` : ''}`
    : '';
  const tail = ccText
    ? ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} با شکایت «${ccText}» به این مرکز مراجعه کرده است.`
    : ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} جهت ارزیابی و اقدامات مامایی پذیرش شده است.`;
  return `${subject}${gaSeg}${tail}`;
}

function buildGynecologyOpening(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const mh = ob.menstrualHistory || {};
  const hpi = ob.ccAndHpi || {};
  const age = normalizeDigits(d.age || '');
  const ccRaw = hasValue(hpi.ccText) ? hpi.ccText : (hasValue(clinicalState.cc?.patientQuote) ? clinicalState.cc.patientQuote : '');
  const ccText = freeText(ccRaw, isEn);
  const durRaw = freeText(hpi.duration, isEn);

  const maritalMap = {
    married: isEn ? 'married' : 'متأهل',
    single: isEn ? 'single' : 'مجرد',
    divorced: isEn ? 'divorced' : 'مطلقه',
    widowed: isEn ? 'widowed' : 'همسر فوت‌شده'
  };
  const menoAge = mh.menopauseAge || idx.menopauseAge;
  const reproMap = {
    reproductive: isEn ? 'of reproductive age' : 'در سنین باروری',
    perimenopausal: isEn ? 'perimenopausal' : 'در دوره حوالی یائسگی (پری‌منوپوز)',
    postmenopausal: isEn
      ? `postmenopausal${hasValue(menoAge) ? ` (since age ${menoAge})` : ''}`
      : `یائسه${hasValue(menoAge) ? ` (سن یائسگی: ${menoAge} سال)` : ''}`,
    pregnant: isEn ? 'pregnant' : 'باردار',
    postpartum: isEn ? 'postpartum' : 'دوره پس از زایمان'
  };

  const formula = formatObstetricFormula(idx, 'gynecology');
  const hasNdCs = hasValue(idx.ND) || hasValue(idx.CS);
  const nd = hasValue(idx.ND) ? String(idx.ND).trim() : '0';
  const cs = hasValue(idx.CS) ? String(idx.CS).trim() : '0';
  const conc = conceptionClause(idx, isEn);
  const mens = menstrualSummary(mh, ob, isEn);

  if (isEn) {
    const segs = [
      age ? `The patient is a ${age}-year-old` : 'The patient is an adult',
      maritalMap[idx.maritalStatus] || '',
      formula ? `**${formula}**` : '',
      reproMap[idx.reproductiveStatus] || '',
      'female',
      hasNdCs ? `(${nd} prior NVD, ${cs} prior CS)` : '',
      conc
    ].filter(Boolean).join(' ');
    const extras = mens.length > 0 ? `, with menstrual history notable for ${mens.join(', ')}` : '';
    const tail = ccText
      ? `, presenting${durRaw ? ` ${durRaw} prior` : ''} with a chief complaint of "${ccText}".`
      : `${durRaw ? `, presenting ${durRaw} prior` : ''} for gynecologic evaluation.`;
    return `${segs}${extras}${tail}`;
  }

  const segs = [
    age ? `بیمار خانم ${age} ساله` : 'بیمار خانم',
    maritalMap[idx.maritalStatus] || '',
    formula ? `**${formula}**` : '',
    hasNdCs ? `(سابقه ${nd} زایمان طبیعی و ${cs} سزارین)` : '',
    reproMap[idx.reproductiveStatus] || '',
    conc,
    mens.length > 0 ? `با ${mens.join('، ')}` : ''
  ].filter(Boolean).join('، ');
  const tail = ccText
    ? ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} با شکایت «${ccText}» مراجعه کرده است.`
    : ` می‌باشد که${durRaw ? ` از ${durRaw} قبل` : ''} جهت ارزیابی بیماری‌های زنان مراجعه کرده است.`;
  return `${segs}${tail}`;
}

function buildRhNote(idx, isEn) {
  const isNeg = /[-−]/.test(idx.maternalBgRh || '');
  if (!isNeg || !(hasValue(idx.paternalBgRh) || hasValue(idx.indirectCoombsRhogam))) return '';
  return isEn
    ? `Paternal blood group: ${idx.paternalBgRh || 'pending'}; Indirect Coombs / RhoGAM: ${cleanEn(idx.indirectCoombsRhogam, 'pending')}.`
    : `گروه خونی همسر: ${idx.paternalBgRh || 'نامشخص'}؛ کومبس غیرمستقیم / روگام: ${idx.indirectCoombsRhogam || 'ثبت نشده'}.`;
}

function buildHpiBody(clinicalState, ob, isEn) {
  const isGyn = ob.subMode === 'gynecology';
  const opening = isGyn ? buildGynecologyOpening(clinicalState, ob, isEn) : buildObstetricsOpening(clinicalState, ob, isEn);
  const rh = isGyn ? '' : buildRhNote(ob.obstetricIndex || {}, isEn);
  const para1 = [opening, rh].filter(Boolean).join(' ');
  const para2 = [buildArchetypeChronologyProse(ob, isEn), buildHpiSymptomSentences(ob, isEn)].filter(Boolean).join(' ');
  return [para1, para2].filter(Boolean).join('\n\n');
}

/* --------------------------- PMH / POH / Ob-Gyn history --------------------------- */

function buildObGynHistoryLine(ob, isEn) {
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
    const out = hasValue(p.outcomeType) ? (isEn ? cleanEn(p.outcomeType, p.outcomeType) : p.outcomeType) : '';
    const ga = hasValue(p.gaAtOutcomeWeeks) ? `${p.gaAtOutcomeWeeks}w` : '';
    const wt = hasValue(p.birthWeightGrams) ? `${p.birthWeightGrams}g` : '';
    const reason = hasValue(p.csIndicationOrLossMethod) ? (isEn ? cleanEn(p.csIndicationOrLossMethod) : p.csIndicationOrLossMethod) : '';
    const yr = hasValue(p.yearOrChildAge) ? (isEn ? cleanEn(p.yearOrChildAge) : p.yearOrChildAge) : '';
    return `G${p.orderNumber || idxRow + 1}: ${[yr, out, ga, wt, reason].filter(Boolean).join(', ')}`;
  });

  const idx = ob.obstetricIndex || {};
  const mh = ob.menstrualHistory || {};
  const gsr = ob.gynScreeningAndRecords || {};
  const extras = [];
  if (hasValue(mh.menarcheAge)) extras.push(isEn ? `menarche at age ${mh.menarcheAge}` : `سن منارک: ${mh.menarcheAge} سال`);
  if (ob.subMode === 'obstetrics') {
    // menstrual summary for obstetric patients is shown here (HPI carries LMP/GA only)
    const mens = menstrualSummary({ ...mh, lmpDate: '' }, { gestationalDating: {} }, isEn);
    if (mens.length > 0) extras.push(isEn ? `pre-pregnancy menses: ${mens.join(', ')}` : `الگوی منس قبل از بارداری: ${mens.join('، ')}`);
  }
  const cm = gsr.contraception?.currentMethod;
  const cObj = cm ? CONTRACEPTION_MAP[cm] : null;
  if (cObj) extras.push(isEn ? `contraception: ${cObj.en}` : `روش پیشگیری: ${cObj.fa}`);
  if (hasValue(gsr.contraception?.priorMethodsAndSideEffects)) {
    extras.push(isEn ? `prior contraception / side effects: ${cleanEn(gsr.contraception.priorMethodsAndSideEffects)}` : `روش‌های قبلی و عوارض: ${gsr.contraception.priorMethodsAndSideEffects}`);
  }
  if (hasValue(idx.priorCsIndications) && ob.subMode !== 'obstetrics') {
    extras.push(isEn ? `prior CS indication: ${cleanEn(idx.priorCsIndications)}` : `علت سزارین قبلی: ${idx.priorCsIndications}`);
  }

  const bits = [];
  if (pregRows.length > 0) bits.push(isEn ? `prior pregnancies: ${pregRows.join(' | ')}` : `پیامدهای بارداری قبلی: ${pregRows.join(' | ')}`);
  if (flagLabels.length > 0) bits.push(isEn ? `prior obstetric complications: ${flagLabels.join(', ')}` : `عوارض مامایی قبلی: ${flagLabels.join('، ')}`);
  bits.push(...extras);
  if (bits.length === 0) return '';
  return isEn ? `- **Ob/Gyn History:** ${bits.join('; ')}.` : `- **سوابق مامایی و زنان:** ${bits.join('؛ ')}.`;
}

/* ----------------------------------- ROS ----------------------------------- */

function buildRosLines(clinicalState, isEn) {
  const items = clinicalState.ros?.items || {};
  const lines = [];
  ROS_SYSTEM_META.forEach((meta) => {
    if (meta.id === 'male_reproductive') return;
    const pos = [];
    const neg = [];
    Object.entries(items).forEach(([id, val]) => {
      const st = val && typeof val === 'object' ? val.state : val;
      if (st !== 1 && st !== -1) return;
      const bi = ROS_BANK_MAP[id];
      const sys = (val && typeof val === 'object' && val.system) || bi?.system;
      if (sys !== meta.id) return;
      if (bi?.gender === 'male') return;
      const label = isEn
        ? (bi?.en || cleanEn(val?.en || val?.label || id, id))
        : (bi?.fa || val?.label || id);
      if (st === 1) {
        const subs = Array.isArray(val?.subTypes) ? val.subTypes.map((x) => (isEn ? cleanEn(x) : x)).filter(Boolean) : [];
        const det = hasValue(val?.detail) ? (isEn ? cleanEn(val.detail) : String(val.detail).trim()) : '';
        const q = [...subs, det].filter(Boolean);
        pos.push(q.length > 0 ? `${label} (${q.join(semiOf(isEn))})` : label);
      } else {
        neg.push(label);
      }
    });
    if (pos.length === 0 && neg.length === 0) return;
    const title = isEn ? meta.en : stripNumberingAndLatin(meta.group);
    if (isEn) {
      const segs = [];
      if (pos.length > 0) segs.push(`Positive for ${pos.join(', ')}.`);
      if (neg.length > 0) segs.push(`Denies ${neg.join(', ')}.`);
      lines.push(`- **${title}:** ${segs.join(' ')}`);
    } else {
      const segs = [];
      if (pos.length > 0) segs.push(`مثبت: ${pos.join('، ')}.`);
      if (neg.length > 0) segs.push(`منفی: ${neg.join('، ')}.`);
      lines.push(`- **${title}:** ${segs.join(' ')}`);
    }
  });
  return lines;
}

/* ------------------------------------ PE ------------------------------------ */

function peKv(isEn, fa, en, val) {
  return hasValue(val) ? `${isEn ? en : fa}: ${val}` : '';
}

function buildVitalsLine(ob, isEn, isObs) {
  const v = ob.pe?.vitals || {};
  return [
    hasValue(v.bp) ? `BP: ${v.bp}${isObs && hasValue(v.bpRepeat) ? ` (${isEn ? 'repeat' : 'تکرار'}: ${v.bpRepeat})` : ''}` : '',
    hasValue(v.pr) ? `PR: ${v.pr}` : '',
    hasValue(v.rr) ? `RR: ${v.rr}` : '',
    hasValue(v.temp) ? `T: ${v.temp}` : '',
    hasValue(v.spo2) ? `SpO2: ${v.spo2}` : '',
    isObs && hasValue(v.urineDipstick) ? `${isEn ? 'Urine dipstick protein' : 'پروتئین ادرار نواری'}: ${freeText(v.urineDipstick, isEn)}` : ''
  ].filter(Boolean).join(' | ');
}

function buildObstetricPeLines(ob, isEn) {
  const om = ob.pe?.obsMeasurements || {};
  const idx = ob.obstetricIndex || {};
  const lines = [];
  const sep = semiOf(isEn);

  // Gravid abdomen & Leopold
  const fh = [
    hasValue(om.fundalHeightCm) ? `${om.fundalHeightCm} cm` : '',
    hasValue(om.fundalHeightWeek) ? (isEn ? `corresponding to ${om.fundalHeightWeek} weeks` : `معادل ${om.fundalHeightWeek} هفته`) : ''
  ].filter(Boolean).join(' ');
  const fhr = hasValue(om.fhr)
    ? [`FHR ${om.fhr} bpm${hasValue(om.fhrQuadrant) ? ` (${om.fhrQuadrant})` : ''}`, optLabel('fhrRegularity', om.fhrRegularity, isEn)].filter(Boolean).join(isEn ? ', ' : '، ')
    : '';
  const leopold = [
    optLabel('leopoldLie', om.leopoldLie, isEn),
    optLabel('leopoldPresentation', om.leopoldPresentation, isEn),
    optLabel('leopoldBack', om.leopoldBack, isEn),
    optLabel('leopoldEngagement', om.leopoldEngagement, isEn)
  ].filter(Boolean);
  const contr = [
    hasValue(om.contractionsFreq) ? (isEn ? `every ${freeText(om.contractionsFreq, true)}` : `هر ${om.contractionsFreq}`) : '',
    hasValue(om.contractionsDuration) ? (isEn ? `lasting ${freeText(om.contractionsDuration, true)}` : `به مدت ${om.contractionsDuration}`) : '',
    optLabel('contractionsIntensity', om.contractionsIntensity, isEn)
  ].filter(Boolean);
  const abd = [
    fh ? `${isEn ? 'fundal height' : 'ارتفاع رحم'} ${fh}` : '',
    optLabel('scarStatus', om.scarStatus, isEn),
    optLabel('scarTenderness', om.scarTenderness, isEn),
    leopold.length > 0 ? `${isEn ? 'Leopold maneuvers' : 'مانورهای لئوپولد'}: ${leopold.join(isEn ? ', ' : '، ')}` : '',
    fhr,
    contr.length > 0 ? `${isEn ? 'contractions' : 'انقباضات'} ${contr.join(isEn ? ', ' : '، ')}` : '',
    optLabel('uterineTone', om.uterineTone, isEn),
    optLabel('epigastricRuqTenderness', om.epigastricRuqTenderness, isEn)
  ].filter(Boolean);
  if (abd.length > 0) lines.push(`- **${isEn ? 'Gravid Abdomen' : 'شکم حاملگی'}:** ${abd.join(sep)}.`);

  // TV & pelvimetry (virgin lock)
  if (idx.isVirgin) {
    lines.push(isEn
      ? '- **Vaginal Exam / Pelvimetry:** Patient is Virgin; digital vaginal and speculum examinations were not performed.'
      : '- **معاینه واژینال و پلویمتری:** با توجه به Virgin بودن بیمار، معاینه واژینال (TV) و اسپکولوم انجام نشد.');
  } else {
    const bishop = calculateBishopScore(om);
    const station = hasValue(om.stationValue) ? `${isEn ? 'station' : 'استیشن'} ${om.stationValue} (${om.stationScale === '3' ? '-3..+3' : '-5..+5'})` : '';
    const presenting = [optLabel('presentingPart', om.presentingPart, isEn), om.presentingPosition ? optLabel('presentingPosition', om.presentingPosition, isEn) : ''].filter(Boolean).join(' / ');
    const membranes = [optLabel('membranesStatus', om.membranesStatus, isEn), om.amnioticFluidChar ? `(${optLabel('amnioticFluidChar', om.amnioticFluidChar, isEn)})` : ''].filter(Boolean).join(' ');
    const tv = [
      hasValue(om.dilationCm) ? `${isEn ? 'dilation' : 'دیلاتاسیون'} ${om.dilationCm} cm` : '',
      hasValue(om.effacementPct) ? `${isEn ? 'effacement' : 'افاسمان'} ${om.effacementPct}%` : '',
      station,
      om.cervixConsistency ? `${isEn ? 'cervix' : 'سرویکس'} ${optLabel('cervixConsistency', om.cervixConsistency, isEn)}` : '',
      om.cervixPosition ? optLabel('cervixPosition', om.cervixPosition, isEn) : '',
      presenting ? `${isEn ? 'presenting part' : 'عضو پرزانته'} ${presenting}` : '',
      membranes ? `${isEn ? 'membranes' : 'پرده‌ها'} ${membranes}` : ''
    ].filter(Boolean);
    if (tv.length > 0) {
      lines.push(`- **${isEn ? 'Vaginal Exam (TV)' : 'معاینه واژینال (TV)'}:** ${tv.join(sep)}${bishop.assessedCount > 0 ? ` — **${isEn ? bishop.labelEn : bishop.labelFa}**` : ''}.`);
    }
    const rom = [
      om.romPooling ? `Pooling ${optLabel('romTest', om.romPooling, isEn)}` : '',
      om.romNitrazine ? `Nitrazine ${optLabel('romTest', om.romNitrazine, isEn)}` : '',
      om.romFern ? `Fern ${optLabel('romTest', om.romFern, isEn)}` : '',
      om.romAmnisure ? `AmniSure ${optLabel('romTest', om.romAmnisure, isEn)}` : ''
    ].filter(Boolean);
    if (rom.length > 0) lines.push(`- **${isEn ? 'Bedside ROM Tests' : 'تست‌های بالینی پارگی کیسه آب'}:** ${rom.join(sep)}.`);
    const pelv = [
      optLabel('pelvimetryPromontory', om.pelvimetryPromontory, isEn),
      optLabel('pelvimetrySpines', om.pelvimetrySpines, isEn),
      optLabel('pelvimetryArch', om.pelvimetryArch, isEn),
      optLabel('pelvimetryOverall', om.pelvimetryOverall, isEn)
    ].filter(Boolean);
    if (pelv.length > 0) lines.push(`- **${isEn ? 'Clinical Pelvimetry' : 'پلویمتری بالینی'}:** ${pelv.join(sep)}.`);
  }

  // Extremities & neuro
  const ext = [
    hasValue(om.edemaGrade) ? `${isEn ? 'edema' : 'ادم'} ${om.edemaGrade}${om.edemaLocation ? ` (${optLabel('edemaLocation', om.edemaLocation, isEn)})` : ''}` : '',
    optLabel('calfTendernessVaricosities', om.calfTendernessVaricosities, isEn),
    hasValue(om.dtrGrade) ? `DTR ${om.dtrGrade}` : '',
    optLabel('ankleClonus', om.ankleClonus, isEn)
  ].filter(Boolean);
  if (ext.length > 0) lines.push(`- **${isEn ? 'Extremities & Neurologic' : 'اندام‌ها و رفلکس‌ها'}:** ${ext.join(sep)}.`);
  return lines;
}

function buildGynecologicPeLines(ob, isEn) {
  const g = ob.pe?.gynExam || {};
  const idx = ob.obstetricIndex || {};
  const sep = semiOf(isEn);
  const lines = [];
  const note = (n) => (hasValue(n) ? freeText(n, isEn) : '');

  const br = g.breast || {};
  const brParts = [
    optLabel('breastSymmetry', br.symmetry, isEn),
    optLabel('breastMass', br.mass, isEn),
    optLabel('breastDischarge', br.discharge, isEn),
    optLabel('axillaryLad', br.axillaryLad, isEn),
    note(br.note)
  ].filter(Boolean);
  if (brParts.length > 0) lines.push(`- **${isEn ? 'Breast & Axillae' : 'پستان و آگزیلا'}:** ${brParts.join(sep)}.`);

  const ab = g.abdomen || {};
  const abParts = [
    freeText(ab.scars, isEn) ? `${isEn ? 'scars' : 'اسکار'}: ${freeText(ab.scars, isEn)}` : '',
    optLabel('tendernessQuadrant', ab.tendernessQuadrant, isEn),
    optLabel('reboundGuarding', ab.reboundGuarding, isEn),
    freeText(ab.palpableMass, isEn) ? `${isEn ? 'palpable mass' : 'توده قابل لمس'}: ${freeText(ab.palpableMass, isEn)}` : '',
    optLabel('cvaTenderness', ab.cvaTenderness, isEn),
    note(ab.note)
  ].filter(Boolean);
  if (abParts.length > 0) lines.push(`- **${isEn ? 'Abdomen' : 'شکم'}:** ${abParts.join(sep)}.`);

  const ex = g.externalGenitalia || {};
  const exParts = [
    optLabel('vulvaPerineum', ex.vulvaPerineum, isEn),
    optLabel('bartholinSkene', ex.bartholinSkene, isEn),
    optLabel('prolapse', ex.prolapse, isEn),
    optLabel('coughStressTest', ex.coughStressTest, isEn),
    note(ex.note)
  ].filter(Boolean);
  if (exParts.length > 0) lines.push(`- **${isEn ? 'External Genitalia' : 'ژنیتالیای خارجی'}:** ${exParts.join(sep)}.`);

  if (idx.isVirgin) {
    lines.push(isEn
      ? '- **Speculum & Bimanual Pelvic Exam:** Patient is Virgin; internal speculum and bimanual examinations were not performed.'
      : '- **معاینه اسپکولوم و دودستی لگن:** با توجه به Virgin بودن بیمار، معاینه اسپکولوم و دودستی انجام نشد.');
    return lines;
  }

  const sp = g.speculum || {};
  const vb = bleedingClause(sp.vbVolume === 'none' ? '' : sp.vbVolume, sp.vbClots === 'none' ? '' : sp.vbClots, isEn);
  const noBleed = sp.vbVolume === 'none' ? optLabel('vbVolume', 'none', isEn) : '';
  const spParts = [
    optLabel('vaginalWalls', sp.vaginalWalls, isEn),
    optLabel('cervixAppearance', sp.cervixAppearance, isEn),
    vb || noBleed,
    (sp.vbVolume === 'none' || !sp.vbVolume) && sp.vbClots ? optLabel('vbClots', sp.vbClots, isEn) : '',
    optLabel('dischargeChar', sp.dischargeChar, isEn),
    note(sp.note)
  ].filter(Boolean);
  if (spParts.length > 0) lines.push(`- **${isEn ? 'Speculum Exam' : 'معاینه با اسپکولوم'}:** ${spParts.join(sep)}.`);

  const bm = g.bimanual || {};
  const bmParts = [
    bm.uterusSizeWeeks ? `${isEn ? 'uterus' : 'رحم'} ${optLabel('uterusSizeWeeks', bm.uterusSizeWeeks, isEn)}` : '',
    optLabel('uterusContour', bm.uterusContour, isEn),
    optLabel('uterusConsistency', bm.uterusConsistency, isEn),
    optLabel('uterusPosition', bm.uterusPosition, isEn),
    optLabel('uterusMobility', bm.uterusMobility, isEn),
    optLabel('uterusTenderness', bm.uterusTenderness, isEn),
    optLabel('cervixConsistencyGyn', bm.cervixConsistency, isEn),
    optLabel('cervixMobility', bm.cervixMobility, isEn),
    optLabel('cmt', bm.cmt, isEn),
    bm.rightAdnexa ? `${isEn ? 'right adnexa' : 'آدنکس راست'}: ${optLabel('adnexa', bm.rightAdnexa, isEn)}` : '',
    bm.leftAdnexa ? `${isEn ? 'left adnexa' : 'آدنکس چپ'}: ${optLabel('adnexa', bm.leftAdnexa, isEn)}` : '',
    optLabel('culDeSac', bm.culDeSac, isEn),
    note(bm.note)
  ].filter(Boolean);
  if (bmParts.length > 0) lines.push(`- **${isEn ? 'Bimanual / Rectovaginal Exam' : 'معاینه دودستی و رکتوواژینال'}:** ${bmParts.join(sep)}.`);
  return lines;
}

function buildLegacyPeFindingLines(ob, isEn) {
  const findings = ob.pe?.findings || {};
  const parts = [];
  Object.entries(findings).forEach(([id, entry]) => {
    if (!entry || (entry.state !== 1 && entry.state !== -1)) return;
    const it = LEGACY_PE_BANK_MAP[id];
    if (!it) return;
    const name = isEn ? it.en : it.fa;
    const det = hasValue(entry.detail) ? freeText(entry.detail, isEn) : '';
    if (entry.state === 1) parts.push(det ? `${name}: ${det}` : name);
    else parts.push(det ? `${name}: ${det}` : (isEn ? `no ${name}` : `منفی از نظر ${name}`));
  });
  return parts.length > 0
    ? [`- **${isEn ? 'Additional Ob/Gyn Exam Findings' : 'سایر یافته‌های معاینه زنان و مامایی'}:** ${parts.join(semiOf(isEn))}.`]
    : [];
}

function buildGeneralPeLines(clinicalState, isEn) {
  const findings = clinicalState.pe?.findings || {};
  const lines = [];
  OBGYN_GENERAL_PE_SYSTEM_KEYS.forEach((sysKey) => {
    const cfg = PE_SYSTEMS_CONFIG.find((c) => c.id === sysKey);
    const pos = [];
    const neg = [];
    Object.entries(findings).forEach(([id, val]) => {
      const st = val && typeof val === 'object' ? val.state : val;
      if (st !== 1 && st !== -1) return;
      const bi = PE_BANK_MAP[id];
      if (!bi || bi.system !== sysKey) return;
      const label = isEn ? bi.en : bi.fa;
      const det = hasValue(val?.detail) ? (isEn ? cleanEn(val.detail) : String(val.detail).trim()) : '';
      if (st === 1) pos.push(det ? `${label} (${det})` : label);
      else neg.push(det ? `${label} (${det})` : label);
    });
    if (pos.length === 0 && neg.length === 0) return;
    const title = isEn ? (cfg?.en || sysKey) : stripNumberingAndLatin(cfg?.title || sysKey);
    const segs = [];
    if (isEn) {
      if (pos.length > 0) segs.push(pos.join('; ') + '.');
      if (neg.length > 0) segs.push(`No evidence of ${neg.join(', ')}.`);
    } else {
      if (pos.length > 0) segs.push(pos.join('؛ ') + '.');
      if (neg.length > 0) segs.push(`فاقد ${neg.join('، ')}.`);
    }
    lines.push(`- **${title}:** ${segs.join(' ')}`);
  });
  return lines;
}

function buildPeSection(clinicalState, ob, isEn) {
  const isObs = ob.subMode !== 'gynecology';
  const vitals = buildVitalsLine(ob, isEn, isObs);
  const special = isObs ? buildObstetricPeLines(ob, isEn) : buildGynecologicPeLines(ob, isEn);
  const legacy = buildLegacyPeFindingLines(ob, isEn);
  const general = buildGeneralPeLines(clinicalState, isEn);
  const out = [];
  if (vitals) out.push(`- **${isEn ? 'Vital Signs' : 'علائم حیاتی'}:** ${vitals}`);
  out.push(...special, ...legacy, ...general);
  return out;
}

/* -------------------------------- Paraclinics -------------------------------- */

function findStudyType(id) {
  return OBGYN_PARACLINIC_STUDY_TYPES.find((t) => t.id === id);
}

function buildStudyLine(study, isEn) {
  const type = findStudyType(study.type);
  if (!type) return '';
  const f = study.fields || {};
  const parts = [];
  type.fields.forEach((fd) => {
    const val = f[fd.key];
    if (!hasValue(val)) return;
    const label = isEn ? fd.en : fd.fa;
    let text;
    if (fd.type === 'select') {
      const o = (fd.options || []).find((x) => x.val === val);
      text = o ? (isEn ? o.en : o.fa) : freeText(val, isEn);
    } else {
      text = freeText(val, isEn);
    }
    if (text) parts.push(`${label}: ${text}`);
  });

  if (study.type === 'nst_efm' && hasValue(f.baselineBpm) && hasValue(f.variability) && hasValue(f.decelType)) {
    const nichd = evaluateNichdCategory({
      baselineBpm: f.baselineBpm,
      variability: f.variability,
      decelerations: {
        type: f.decelType,
        isRecurrent: f.decelRecurrent === 'yes',
        variablePathologicalFlags: {},
        cordCompressionPatternVariant: 'None'
      }
    });
    parts.push(`**${isEn ? nichd.labelEn : nichd.labelFa}**`);
  }
  if (parts.length === 0 && !hasValue(study.date)) return '';
  const title = isEn ? type.en : type.fa;
  const date = hasValue(study.date) ? ` (${freeText(study.date, isEn)})` : '';
  return `- **${title}${date}:** ${parts.length > 0 ? parts.join(semiOf(isEn)) : (isEn ? 'no details entered' : 'جزئیاتی ثبت نشده است')}.`;
}

function buildLabLines(ob, isEn) {
  const lines = [];
  const kl = ob.paraclinics?.keyLabs || {};
  const legacy = [
    ['bhcg', 'β-hCG'], ['wbc', 'WBC'], ['hb', 'Hb'], ['plt', 'Plt'], ['cr', 'Cr'], ['ast', 'AST'], ['alt', 'ALT'],
    ['ldh', 'LDH'], ['urinePrCr', 'Urine Pr/Cr'], ['ptInr', 'PT/INR'], ['tsh', 'TSH'], ['ogtt75', 'OGTT 75g'],
    ['ca125', 'CA-125'], ['prolactin', 'Prolactin'], ['fshLh', 'FSH/LH'], ['indirectCoombs', 'Indirect Coombs'],
    ['gbs', 'GBS'], ['viralMarkers', 'Viral markers']
  ].filter(([k]) => hasValue(kl[k])).map(([k, label]) => `${label}: ${isEn ? cleanEn(kl[k]) : kl[k]}`);
  const extra = (Array.isArray(ob.paraclinics?.extraLabs) ? ob.paraclinics.extraLabs : [])
    .filter((l) => l && hasValue(l.value))
    .map((l) => {
      const name = isEn ? cleanEn(l.en || l.label, l.label) : (l.label || l.en);
      const val = freeText(l.value, isEn);
      return `${name}: ${val}${hasValue(l.unit) ? ` ${l.unit}` : ''}`;
    });
  const all = [...extra, ...legacy];
  if (all.length > 0) lines.push(isEn ? `- **Laboratory Results:** ${all.join(' | ')}` : `- **نتایج آزمایشات:** ${all.join(' | ')}`);
  if (hasValue(ob.paraclinics?.keyLabsNote)) {
    lines.push(isEn ? `- **Lab Notes:** ${cleanEn(ob.paraclinics.keyLabsNote)}` : `- **توضیحات آزمایشات:** ${ob.paraclinics.keyLabsNote}`);
  }
  return lines;
}

function buildParaclinicsLines(ob, isEn) {
  const studies = Array.isArray(ob.paraclinics?.studies) ? ob.paraclinics.studies : [];
  const studyLines = studies.map((s) => buildStudyLine(s, isEn)).filter(Boolean);
  return [...buildLabLines(ob, isEn), ...studyLines];
}

/* ------------------------------ Assessment & Plan ------------------------------ */

function buildAssessmentPlan(ob, isEn) {
  const ap = ob.assessmentAndPlan || {};
  const ddxList = [
    ...(Array.isArray(ap.ddx) ? ap.ddx.map((x) => (isEn ? cleanEn(x) : x)) : []),
    ...(ap.ddxCustom ? ap.ddxCustom.split(/\n+/).map((x) => (isEn ? cleanEn(x) : x.trim())).filter(Boolean) : [])
  ].filter(Boolean);
  const orderLines = buildAdcaOrdersLines(ap.adcaVanDimls, isEn);
  const out = [];
  if (ddxList.length > 0) {
    out.push(isEn ? '**Differential Diagnosis:**' : '**تشخیص‌های افتراقی:**');
    ddxList.forEach((item, i) => out.push(`${i + 1}. ${item}`));
  }
  if (hasValue(ap.planSummary)) {
    out.push(isEn ? `**Plan:** ${cleanEn(ap.planSummary)}` : `**برنامه درمانی:** ${String(ap.planSummary).trim()}`);
  }
  if (orderLines.length > 0) {
    out.push(isEn ? '**Admission Orders (ADCA VAN DIMLS):**' : '**دستورات بستری (ADCA VAN DIMLS):**');
    out.push(...orderLines);
  }
  return out;
}

/* ------------------------------ Note assembly ------------------------------ */

const SECTION_TITLES = {
  en: [
    '1. Chief Complaint (CC)',
    '2. History of Present Illness (HPI)',
    '3. Past Medical & Surgical History (PMH & PSH)',
    '4. Drug, Allergy, Social & Family History (DH / AH / SH / FH)',
    '5. Review of Systems (ROS)',
    '6. Physical Examination (PE)',
    '7. Paraclinics (Laboratory, Imaging & Diagnostics)',
    '8. Assessment, Differential Diagnosis & Plan (ADCA VAN DIMLS)'
  ],
  fa: [
    '۱. شکایت اصلی (CC)',
    '۲. شرح بیماری فعلی (HPI)',
    '۳. سوابق بیماری‌ها و جراحی‌ها (PMH & PSH)',
    '۴. داروها، حساسیت‌ها، عادات و سابقه فامیلی (DH / AH / SH / FH)',
    '۵. مرور سیستم‌ها (ROS)',
    '۶. معاینه فیزیکی (PE)',
    '۷. پاراکلینیک (آزمایشات، تصویربرداری و پایش)',
    '۸. تشخیص افتراقی، برنامه درمانی و دستورات (ADCA VAN DIMLS)'
  ]
};

function assembleClassicNote(clinicalState, ob, isEn) {
  const d = clinicalState.demographics || {};
  const idx = ob.obstetricIndex || {};
  const hpi = ob.ccAndHpi || {};
  const isGyn = ob.subMode === 'gynecology';
  const titles = SECTION_TITLES[isEn ? 'en' : 'fa'];
  const none = isEn ? 'Not yet documented.' : 'هنوز ثبت نشده است.';

  const formula = formatObstetricFormula(idx, isGyn ? 'gynecology' : 'obstetrics');
  const ap = ob.assessmentAndPlan || {};
  const dateDisplay = hasValue(ap.adcaVanDimls?.dateTime)
    ? (isEn ? cleanEn(ap.adcaVanDimls.dateTime) : ap.adcaVanDimls.dateTime)
    : new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR');
  const banner = buildDemographicHeader(d, formula, dateDisplay, isEn);

  const ccRaw = hasValue(hpi.ccText) ? hpi.ccText : (hasValue(clinicalState.cc?.patientQuote) ? clinicalState.cc.patientQuote : '');
  const ccText = freeText(ccRaw, isEn);
  const ccLine = ccText
    ? (isEn ? `"${ccText}"${hasValue(hpi.duration) ? ` — duration: ${freeText(hpi.duration, true)}` : ''}` : `«${ccText}»${hasValue(hpi.duration) ? ` — مدت: ${hpi.duration}` : ''}`)
    : (isEn ? 'Not yet recorded.' : 'ثبت نشده است.');

  const shared = collectSharedHistories(clinicalState, ob, isEn);
  const obgynHist = buildObGynHistoryLine(ob, isEn);
  const pmhPsh = [
    `- **PMHx:** ${shared.pmhText}`,
    `- **PSHx:** ${shared.pshText}`,
    obgynHist
  ].filter(Boolean).join('\n');

  const dhAh = [
    `- **${isEn ? 'Drug History (DH)' : 'سابقه دارویی (DH)'}:** ${shared.dhText}`,
    `- **${isEn ? 'Allergy History (AH)' : 'سابقه حساسیت (AH)'}:** ${shared.allergyText}`,
    shared.shText ? `- **${isEn ? 'Social History (SH)' : 'عادات (SH)'}:** ${shared.shText}` : '',
    shared.fhText ? `- **${isEn ? 'Family History (FH)' : 'سابقه فامیلی (FH)'}:** ${shared.fhText}` : ''
  ].filter(Boolean).join('\n');

  const rosLines = buildRosLines(clinicalState, isEn);
  const peLines = buildPeSection(clinicalState, ob, isEn);
  const paraLines = buildParaclinicsLines(ob, isEn);
  const planLines = buildAssessmentPlan(ob, isEn);

  const heading = isEn
    ? `### OBSTETRICS & GYNECOLOGY WARD ADMISSION NOTE (${isGyn ? 'GYNECOLOGY' : 'OBSTETRIC'} PATIENT)`
    : `### شرح حال بخش زنان و زایمان (${isGyn ? 'بیماری‌های زنان / ژنیکولوژی' : 'بخش مامایی / پره‌ناتال'})`;

  return [
    banner,
    heading,
    `### ${titles[0]}\n${ccLine}`,
    `### ${titles[1]}\n${buildHpiBody(clinicalState, ob, isEn) || none}`,
    `### ${titles[2]}\n${pmhPsh}`,
    `### ${titles[3]}\n${dhAh}`,
    `### ${titles[4]}\n${rosLines.length > 0 ? rosLines.join('\n') : `- ${none}`}`,
    `### ${titles[5]}\n${peLines.length > 0 ? peLines.join('\n') : `- ${none}`}`,
    `### ${titles[6]}\n${paraLines.length > 0 ? paraLines.join('\n') : `- ${none}`}`,
    `### ${titles[7]}\n${planLines.length > 0 ? planLines.join('\n') : `- ${none}`}`
  ].join('\n\n');
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

  if (ob.subMode === 'soape') {
    return generateSoapeAndDischargeNote(clinicalState, ob, isEn);
  }
  return assembleClassicNote(clinicalState, ob, isEn);
}
