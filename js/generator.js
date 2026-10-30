import { getCurrentLanguage, getLocalizedItemLabel } from './i18n.js';
import {
  HPI_QUALIFIERS_AND_SYMPTOMS,
  MASTER_ROS_BANK,
  MASTER_PE_BANK,
  SURGICAL_SCHEMA,
  LAB_PANELS,
  ROS_GROUPS_BILINGUAL,
  PMH_CATEGORIES,
  DH_CATEGORIES,
  PE_MANDATORY_PILLARS,
  PE_UNLOCKABLE_MODULES,
  PE_COMPREHENSIVE_SYSTEMS,
  HPI_UNLOCKABLE_MODULES,
  HPI_BASIC_SYMPTOMS,
  PAIN_BODY_REGIONS,
  MASS_EXAM_SCHEMA,
  ATLS_EXAM_SCHEMA,
  tLabel,
  DIRECT_FA_TO_EN_MAP
} from './schema.js';

export function normalizePersianClinicalText(text) {
  if (!text) return '';
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\b(می|نمی)\s+/g, '$1\u200c') // نیم‌فاصله افعال
    .replace(/\s+ها\b/g, '\u200cها')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * PII Privacy Sanitizer for Cloud Sync & Research Dataset Exports.
 * Strictly strips patient identifying information (fullName, fatherName, birthDate, bed)
 * while preserving demographic metadata (age, gender, marital, city, occupation, ward).
 */
export function sanitizeRecordForExport(rawState) {
  const cloned = JSON.parse(JSON.stringify(rawState || {}));
  ['demographics', 'admission', 'context'].forEach((sec) => {
    if (cloned[sec]) {
      delete cloned[sec].fullName;
      delete cloned[sec].fatherName;
      delete cloned[sec].birthDate;
      delete cloned[sec].bed;
    }
  });
  delete cloned.fullName;
  delete cloned.fatherName;
  delete cloned.birthDate;
  delete cloned.bed;
  return cloned;
}

function getRegionLabel(regionId) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  const found = SURGICAL_SCHEMA.abdominalRegions.find((r) => r.id === regionId);
  if (found) return lang === 'en' ? (found.code || found.label) : found.label;

  for (const group of (PAIN_BODY_REGIONS || [])) {
    const sub = group.subregions.find((s) => s.id === regionId);
    if (sub) {
      return lang === 'en' ? (sub.code || sub.label) : (sub.fa || sub.label);
    }
  }
  return regionId;
}

/**
 * Narrative Sentence Generator for each of the 5 Presentation Archetypes (Persian)
 */
export function renderArchetypeNarrative(item, index = 0, totalCount = 1) {
  const prefix = totalCount > 1 ? (index === 0 ? 'در بررسی مشکل اصلی، ' : 'همچنین در خصوص شکایت دیگر، ') : '';

  if (item.archetype === 'mass_lesion_archetype') {
    const parts = [];
    parts.push(`${prefix}بیمار از وجود توده/ضایعه‌ای در ناحیه **${item.location || 'موضع اشاره‌شده'}** شاکی است`);
    if (item.discoveryTime) parts.push(`که از حدود ${item.discoveryTime} قبل متوجه آن شده است`);
    if (item.growthPattern) parts.push(`و در این مدت سیر ${item.growthPattern} داشته است`);
    let sentence = parts.join(' ') + '.';
    if (item.painStatus) sentence += ` ضایعه مذکور ${item.painStatus} می‌باشد.`;
    if (item.posFindings?.length) sentence += ` بیمار ذکر از ${item.posFindings.join('، ')} در موضع دارد.`;
    if (item.negFindings?.length) sentence += ` شواهدی از ${item.negFindings.join('، ')} ذکر نمی‌شود.`;
    return sentence;
  }

  if (item.archetype === 'trauma_burn_archetype') {
    let sentence = `${prefix}بیمار به دنبال **${item.mechanism || 'تروما'}**`;
    if (item.timeSinceInjury) sentence += ` در حدود ${item.timeSinceInjury} قبل`;
    if (item.injuredZones?.length) sentence += ` و آسیب به نواحی **${item.injuredZones.join(' و ')}**`;
    if (item.transportMode) sentence += `، توسط ${item.transportMode}`;
    sentence += ` به اورژانس منتقل شده است.`;
    if (item.posFindings?.length) sentence += ` در شرح‌حال تروما، ${item.posFindings.join('، ')} گزارش می‌شود.`;
    if (item.negFindings?.length) sentence += ` بیمار ${item.negFindings.join('، ')} را ذکر نمی‌کند.`;
    return sentence;
  }

  if (item.archetype === 'elective_asymptomatic_archetype') {
    if (item.isProcedureOnly) {
      let sentence = `${prefix}بیمار به صورت الکتیو و صرفاً جهت **${normalizePersianClinicalText(item.procedureName || 'اقدام درمانی/پروسیجر جراحی')}** بستری شده و در حال حاضر فاقد هرگونه درد حاد شکمی، تهوع/استفراغ یا شکایت حاد جراحی است.`;
      if (item.insertionReasonAndTime) sentence += ` (سابقه و علت تعبیه/اقدام قبلی: ${normalizePersianClinicalText(item.insertionReasonAndTime)}).`;
      if (item.lastChemoOrInterventionDate) sentence += ` آخرین نوبت شیمی‌درمانی/مداخله: ${normalizePersianClinicalText(item.lastChemoOrInterventionDate)}.`;
      if (item.siteExamStatus) sentence += ` در معاینه موضعی: ${normalizePersianClinicalText(item.siteExamStatus)}.`;
      return sentence;
    }
    let sentence = `${prefix}بیمار در حال حاضر فاقد درد یا شکایت حاد بالینی بوده`;
    if (item.discoveryMethod) sentence += ` و بیماری وی به دنبال ${item.discoveryMethod} شناسایی شده است.`;
    else sentence += `.`;
    if (item.workupSummary) sentence += ` در سیر بررسی‌های سرپایی، ${item.workupSummary}.`;
    return sentence;
  }

  if (item.archetype === 'functional_bleeding_archetype') {
    let sentence = `${prefix}بیمار از **${item.symptomTitle || 'علائم فوق'}**`;
    if (item.duration) sentence += ` از ${item.duration} قبل`;
    if (item.onset) sentence += ` با شروع ${item.onset}`;
    sentence += ` شاکی است`;
    if (item.severityOrFrequency) sentence += ` (${item.severityOrFrequency})`;
    sentence += '.';
    if (item.aggravating?.length) sentence += ` این وضعیت با ${item.aggravating.join('، ')} تشدید شده`;
    if (item.relieving?.length) sentence += ` و با ${item.relieving.join('، ')} بهبود نسبی می‌یابد.`;
    return sentence;
  }

  // default fallback: pain_archetype
  const siteName = item.site || (item.selectedRegions || []).map(getRegionLabel).join(' و ') || item.title || `کانون درد #${index + 1}`;
  const painPrefix = totalCount > 1
    ? (index === 0 ? `در بررسی کانون اول (${siteName})، درد بیمار ` : `همچنین در خصوص کانون بعدی (${siteName})، درد `)
    : 'به گفته بیمار، درد ';
  const segments = [];

  if (item.duration) segments.push(`از ${normalizePersianClinicalText(item.duration)} قبل`);
  if (item.onset) segments.push(`با ${item.onset}`);
  segments.push('آغاز شده است');

  let locSentence = '';
  const regNames = (item.selectedRegions || []).map(getRegionLabel).join(' و ');
  if (item.bodyRegionGroup && item.bodyRegionGroup !== 'abdomen_pelvis' && regNames) {
    locSentence = `در ناحیه ${regNames} متمرکز بوده`;
  } else if (item.spatialPattern === 'localized' && regNames) {
    locSentence = `در ناحیه ${regNames} لوکالیزه بوده`;
  } else if (item.spatialPattern === 'generalized_predominant' && regNames) {
    locSentence = `در کل موضع با ارجحیت و حداکثر شدت در ناحیه ${regNames} احساس شده`;
  } else if (item.spatialPattern === 'localized_to_generalized') {
    const initNames = (item.initialRegions || []).map(getRegionLabel).join(' و ');
    locSentence = `ابتدا در ناحیه ${initNames || 'نقطه اولیه'} شروع شده و سپس به سایر نواحی گسترش یافته`;
  } else if (item.spatialPattern === 'generalized_to_localized') {
    const curNames = (item.currentRegions || []).map(getRegionLabel).join(' و ');
    const delayPhrase = item.localizationDelay ? ` (${normalizePersianClinicalText(item.localizationDelay)})` : '';
    locSentence = `در ابتدا به صورت منتشر و ژنرالیزه در کل شکم شروع شده و سپس${delayPhrase} در ناحیه ${curNames || 'موضع خاص'} لوکالیزه و متمرکز گردیده`;
  } else if (item.spatialPattern === 'migratory_shifting') {
    const initNames = (item.initialRegions || []).map(getRegionLabel).join(' و ');
    const curNames = (item.currentRegions || []).map(getRegionLabel).join(' و ');
    locSentence = `الگوی مهاجر (Shifting) داشته و از ناحیه ${initNames || 'محل اولیه'} به ناحیه ${curNames || 'محل ثانویه'} تغییر مکان داده`;
  } else if (item.site) {
    locSentence = `در ناحیه ${normalizePersianClinicalText(item.site)} احساس شده`;
  } else if (regNames) {
    locSentence = `در ناحیه ${regNames} احساس شده`;
  }

  const qualParts = [];
  if (locSentence) qualParts.push(locSentence);
  if (item.character) qualParts.push(`ماهیت ${item.character}`);
  if (item.course) qualParts.push(`سیر ${item.course}`);
  if (item.timing) qualParts.push(`الگوی زمانی ${item.timing}`);

  let painParagraph = `${painPrefix}${segments.join(' ')}`;
  if (qualParts.length > 0) {
    painParagraph += `؛ این درد ${qualParts.join('، ')} دارد`;
  }
  if (item.severity !== undefined && item.severity !== null && item.severity !== '') {
    painParagraph += ` و شدت آن توسط بیمار ${item.severity} از ۱۰ توصیف می‌شود`;
  }
  painParagraph += '.';

  const modSentences = [];
  if (item.radiationList && item.radiationList.length > 0) {
    const radStr = item.radiationList.map((r) => (r.detail ? `${r.label || r} (${normalizePersianClinicalText(r.detail)})` : (r.label || r))).join(' و ');
    modSentences.push(`درد مذکور به ${radStr} انتشار دارد`);
  } else if (item.radiation && Array.isArray(item.radiation) && item.radiation.length > 0) {
    const radStr = item.radiation.map((r) => (typeof r === 'object' ? `${r.label || r.id} (${r.detail || ''})` : r)).join(' و ');
    modSentences.push(`درد مذکور به ${radStr} انتشار دارد`);
  } else if (typeof item.radiation === 'string' && item.radiation.trim()) {
    modSentences.push(`درد مذکور به ${normalizePersianClinicalText(item.radiation)} انتشار دارد`);
  } else if (item.noRadiation) {
    modSentences.push(`درد به جایی انتشار ندارد`);
  }

  if (item.aggravating) {
    const aggText = Array.isArray(item.aggravating) ? item.aggravating.join('، ') : String(item.aggravating).trim();
    if (aggText) modSentences.push(`با ${aggText} تشدید می‌شود`);
  }
  if (item.relieving) {
    const relText = Array.isArray(item.relieving) ? item.relieving.join('، ') : String(item.relieving).trim();
    if (relText) modSentences.push(`با ${relText} بهبود نسبی می‌یابد`);
  }
  if (modSentences.length > 0) {
    painParagraph += ' ' + modSentences.join(' و ') + '.';
  }

  return painParagraph;
}

/**
 * Helper to resolve schema item English/Persian label by ID across ROS, PE & HPI schemas
 */
function findRosItemLabel(itemId, fallbackLabel, lang = 'en') {
  const found = MASTER_ROS_BANK.find((it) => it.id === itemId);
  if (found) return lang === 'en' ? found.en : (found.fa || found.en);
  for (const grp of (ROS_GROUPS_BILINGUAL || [])) {
    const it = (grp.items || []).find((x) => x.id === itemId);
    if (it) return lang === 'en' ? (it.en || tLabel(it.label, it.en)) : (it.fa || it.label);
  }
  return lang === 'en' ? tLabel(fallbackLabel || itemId) : (fallbackLabel || itemId);
}

function findPeItemLabel(itemId, fallbackLabel, lang = 'en') {
  const found = MASTER_PE_BANK.find((it) => it.id === itemId);
  if (found) return lang === 'en' ? found.en : (found.fa || found.en);
  for (const p of (PE_MANDATORY_PILLARS || [])) {
    const it = (p.items || []).find((x) => x.id === itemId);
    if (it) return lang === 'en' ? (it.en || tLabel(it.label, it.en)) : (it.fa || it.label);
  }
  return lang === 'en' ? tLabel(fallbackLabel || itemId) : (fallbackLabel || itemId);
}

function findHpiSymptomLabel(symId, fallbackLabel, lang = 'en') {
  const found = HPI_QUALIFIERS_AND_SYMPTOMS.find((it) => it.id === symId);
  if (found) return lang === 'en' ? found.en : (found.fa || found.en);
  const basic = (HPI_BASIC_SYMPTOMS || []).find((s) => s.id === symId);
  if (basic) return lang === 'en' ? (basic.en || tLabel(basic.label, basic.en)) : (basic.fa || basic.label);
  for (const mod of (HPI_UNLOCKABLE_MODULES || [])) {
    const chip = (mod.chips || []).find((c) => c.id === symId);
    if (chip) return lang === 'en' ? (chip.en || tLabel(chip.label, chip.en)) : (chip.fa || chip.label);
  }
  return lang === 'en' ? tLabel(fallbackLabel || symId) : (fallbackLabel || symId);
}

/**
 * Narrative Sentence Generator for each of the 5 Presentation Archetypes (English)
 */
export function renderArchetypeNarrativeEn(item, index = 0, totalCount = 1) {
  const prefix = totalCount > 1 ? (index === 0 ? 'Regarding primary presentation: ' : 'Regarding concurrent presentation: ') : '';

  if (item.archetype === 'mass_lesion_archetype') {
    let sentence = `${prefix}The patient reports a palpable mass/lesion located at **${tLabel(item.location) || 'the specified anatomical region'}**`;
    if (item.discoveryTime) sentence += `, first noted approximately ${tLabel(item.discoveryTime)} prior to evaluation`;
    if (item.growthPattern) sentence += `, exhibiting a ${tLabel(item.growthPattern)} growth pattern`;
    sentence += '.';
    if (item.painStatus) sentence += ` The lesion is currently ${tLabel(item.painStatus)}.`;
    if (item.posFindings?.length) sentence += ` Associated local signs: positive for ${item.posFindings.map((f) => tLabel(f)).join(', ')}.`;
    if (item.negFindings?.length) sentence += ` Negative for: ${item.negFindings.map((f) => tLabel(f)).join(', ')}.`;
    return sentence;
  }

  if (item.archetype === 'trauma_burn_archetype') {
    let sentence = `${prefix}The patient presented following **${tLabel(item.mechanism) || 'acute trauma'}**`;
    if (item.timeSinceInjury) sentence += ` sustained approximately ${tLabel(item.timeSinceInjury)} prior to arrival`;
    if (item.injuredZones?.length) sentence += ` with injuries involving **${item.injuredZones.map((z) => tLabel(z)).join(', ')}**`;
    if (item.transportMode) sentence += `, transported to the emergency department via ${tLabel(item.transportMode)}`;
    sentence += '.';
    if (item.posFindings?.length) sentence += ` Trauma review: positive for ${item.posFindings.map((f) => tLabel(f)).join(', ')}.`;
    if (item.negFindings?.length) sentence += ` Denies: ${item.negFindings.map((f) => tLabel(f)).join(', ')}.`;
    return sentence;
  }

  if (item.archetype === 'elective_asymptomatic_archetype') {
    if (item.isProcedureOnly) {
      let sentence = `${prefix}The patient is admitted electively solely for planned **${tLabel(item.procedureName) || 'surgical procedure/intervention'}** and is currently free of acute distress, abdominal pain, or acute surgical symptoms.`;
      if (item.insertionReasonAndTime) sentence += ` History/indication for previous device: ${tLabel(item.insertionReasonAndTime)}.`;
      if (item.lastChemoOrInterventionDate) sentence += ` Last chemotherapy/intervention date: ${tLabel(item.lastChemoOrInterventionDate)}.`;
      if (item.siteExamStatus) sentence += ` Local site examination: ${tLabel(item.siteExamStatus)}.`;
      return sentence;
    }
    let sentence = `${prefix}The patient is currently asymptomatic with no acute pain or surgical distress`;
    if (item.discoveryMethod) sentence += `, identified through ${tLabel(item.discoveryMethod)}`;
    sentence += '.';
    if (item.workupSummary) sentence += ` Outpatient diagnostic trajectory: ${tLabel(item.workupSummary)}.`;
    return sentence;
  }

  if (item.archetype === 'functional_bleeding_archetype') {
    let sentence = `${prefix}The patient reports **${tLabel(item.symptomTitle) || 'functional symptoms'}**`;
    if (item.duration) sentence += ` starting ${tLabel(item.duration)} ago`;
    if (item.onset) sentence += ` (${tLabel(item.onset)})`;
    if (item.severityOrFrequency) sentence += ` [${tLabel(item.severityOrFrequency)}]`;
    sentence += '.';
    const aggArr = Array.isArray(item.aggravating) ? item.aggravating : (item.aggravating ? [item.aggravating] : []);
    const relArr = Array.isArray(item.relieving) ? item.relieving : (item.relieving ? [item.relieving] : []);
    if (aggArr.length) sentence += ` Aggravated by ${aggArr.map((x) => tLabel(x)).join(', ')}.`;
    if (relArr.length) sentence += ` Partially relieved by ${relArr.map((x) => tLabel(x)).join(', ')}.`;
    return sentence;
  }

  // pain_archetype
  const siteStr = tLabel(item.site) || (item.selectedRegions || []).map(getRegionLabel).join(', ') || tLabel(item.title) || `Focus #${index + 1}`;
  let pSentence = `${prefix}Pain focus #${index + 1} (${siteStr}): Onset ${tLabel(item.duration) || 'recently'} prior to admission`;
  if (item.onset) pSentence += ` (${tLabel(item.onset)})`;
  if (item.character) pSentence += `, characterized as ${tLabel(item.character)}`;
  if (item.course) pSentence += `, clinical course is ${tLabel(item.course)}`;
  if (item.timing) pSentence += `, timing pattern: ${tLabel(item.timing)}`;
  if (item.severity !== undefined && item.severity !== null && item.severity !== '') pSentence += `, severity rated ${item.severity}/10 on NRS`;
  pSentence += '.';
  if (item.radiationList && item.radiationList.length > 0) {
    pSentence += ` Radiation: ${item.radiationList.map((r) => tLabel(r.label || r)).join(', ')}.`;
  } else if (item.radiation) {
    const rList = Array.isArray(item.radiation) ? item.radiation.map((r) => tLabel(r.label || r)).join(', ') : tLabel(item.radiation);
    if (rList) pSentence += ` Radiation: ${rList}.`;
  } else if (item.noRadiation) {
    pSentence += ` No radiation.`;
  }
  const aggList = Array.isArray(item.aggravating) ? item.aggravating : (item.aggravating ? [item.aggravating] : []);
  const relList = Array.isArray(item.relieving) ? item.relieving : (item.relieving ? [item.relieving] : []);
  if (aggList.length > 0) {
    pSentence += ` Aggravated by: ${aggList.map((x) => tLabel(x)).join(', ')}.`;
  }
  if (relList.length > 0) {
    pSentence += ` Relieved by: ${relList.map((x) => tLabel(x)).join(', ')}.`;
  }
  return pSentence;
}

/**
 * Flowing Medical Narrative Generator for Chief Complaint (CC) and History of Present Illness (HPI)
 * Generates natural, cohesive prose structured like an expert attending surgeon's note.
 */
export function generateNarrativeCCAndHPI(state) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  const isEn = lang === 'en';
  const demo = state.demographics || state.admission || {};
  const cc = state.cc || state.admission || {};
  const hpi = state.hpi || {};

  // Support 5 Archetypes via presentations array; fallback seamlessly to painList
  const presentations = (hpi.presentations && hpi.presentations.length > 0)
    ? hpi.presentations
    : (hpi.painList && hpi.painList.length > 0
        ? hpi.painList.map(p => ({ ...p, archetype: 'pain_archetype' }))
        : []);

  const out = [];

  if (isEn) {
    if (demo.fullName || demo.fatherName || demo.birthDate || demo.age || demo.ward || demo.bed) {
      const agePart = demo.age ? `${demo.age} y/o` : (demo.birthDate || '—');
      const genderLabel = demo.gender === 'female' ? 'Female' : demo.gender === 'male' ? 'Male' : (demo.gender === 'other' ? 'Other' : '—');
      const wardPart = demo.ward ? ` | **Ward:** **${tLabel(demo.ward)}**` : '';
      const bedPart = demo.bed ? ` | **Bed:** **${demo.bed}**` : '';
      out.push(
        `> **Patient ID:** Name: **${tLabel(demo.fullName) || '—'}** | Father's Name: **${tLabel(demo.fatherName) || '—'}** | Age: **${agePart}** | Sex: **${genderLabel}**${wardPart}${bedPart}\n`
      );
    }

    const ccText = tLabel(cc.ccPhrase || cc.patientQuote || '') || 'Acute Surgical Presentation';
    if (state.admission?.unresponsiveTrauma) {
      out.push(`### 1. Reason for Presentation & EMS Handover`);
      out.push(`- **Emergent transport via EMS / acute presentation following severe trauma/unresponsiveness (Patient unable to provide direct history at presentation due to acute critical condition/altered mental status/intubation).**`);
    } else {
      out.push(`### 1. Chief Complaint (CC)`);
      out.push(`- **"${ccText}"**`);
    }

    out.push(`\n### 2. History of Present Illness (HPI)`);
    const narrativeSentences = [];

    let subjectDesc = 'patient';
    if (demo.gender === 'female') {
      subjectDesc = demo.age ? `${demo.age}-year-old female` : 'female patient';
    } else if (demo.gender === 'male') {
      subjectDesc = demo.age ? `${demo.age}-year-old male` : 'male patient';
    } else if (demo.age) {
      subjectDesc = `${demo.age}-year-old patient`;
    }
    const maritalEn = demo.marital ? `, ${tLabel(demo.marital).toLowerCase()}` : '';
    const cityEn = demo.city ? `, residing in ${tLabel(demo.city)}` : '';
    const occEn = demo.occupation ? `, occupation: ${tLabel(demo.occupation)}` : '';

    let introSentence = state.admission?.unresponsiveTrauma
      ? `The patient is an emergent trauma admission (${subjectDesc}${maritalEn}) transported by EMS following severe trauma/acute critical condition with altered mental status.`
      : `The patient is a ${subjectDesc}${maritalEn}${cityEn}${occEn} presenting with a chief complaint of "${ccText}".`;
    if (cc.pathway === 'elective_clinic' || cc.pathway === 'clinic_referral') {
      const att = tLabel(cc.clinicAttending || cc.referringAttending || cc.attendingPhysician || '') || 'Attending Surgeon';
      const diag = tLabel(cc.clinicInitialDiagnosis || cc.establishedDiagnosis || cc.preliminaryDiagnosis || '');
      const proc = tLabel(cc.clinicPlannedProcedure || cc.plannedProcedure || '');
      introSentence += ` Admitted electively from surgical clinic under ${att}${diag ? ` with initial diagnosis of "${diag}"` : ''}${proc ? ` for planned "${proc}"` : ''}.`;
    } else if (cc.pathway === 'inpatient_transfer') {
      const src = tLabel(cc.transferSource || cc.originWardHospital || '') || 'inpatient service';
      const rsn = tLabel(cc.transferReason || cc.primaryAdmissionReason || '');
      const ind = tLabel(cc.transferSurgIndication || cc.transferConsultReason || '');
      introSentence += ` Admitted via inpatient transfer from "${src}"${rsn ? ` (initial admission reason: ${rsn})` : ''} following surgical consultation${ind ? ` for "${ind}"` : ''}.`;
    } else if (cc.pathway === 'postop_complication') {
      introSentence += ` Presenting with acute post-operative complaint/complication following recent surgical intervention.`;
    } else {
      introSentence += ` Evaluated acutely in the Emergency Department / Surgical Service for surgical management.`;
    }
    narrativeSentences.push(introSentence);

    if (presentations.length > 0) {
      presentations.forEach((item, idx) => {
        narrativeSentences.push(renderArchetypeNarrativeEn(item, idx, presentations.length));
      });
    }

    if (hpi.narrativeNote) {
      narrativeSentences.push(tLabel(hpi.narrativeNote));
    }
    if (hpi.preAdmissionWorkup) {
      narrativeSentences.push(`Prior diagnostic workup & pre-admission care: ${tLabel(hpi.preAdmissionWorkup)}.`);
    }

    const posSyms = [];
    const negSyms = [];
    if (hpi.symptoms) {
      Object.entries(hpi.symptoms).forEach(([symId, data]) => {
        const symName = findHpiSymptomLabel(symId, typeof data === 'object' ? data?.label : symId);
        const st = typeof data === 'object' && data !== null ? data.state : data;
        const dt = typeof data === 'object' && data !== null ? (data.detail || data.note || '') : '';
        if (st === 1 || st === '+1') posSyms.push(dt ? `${symName} (${tLabel(dt)})` : symName);
        else if (st === -1 || st === '-1') negSyms.push(symName);
      });
    }
    if (posSyms.length > 0) narrativeSentences.push(`- **Associated Symptoms:** Positive for ${posSyms.join(', ')}.`);
    if (negSyms.length > 0) narrativeSentences.push(`- **Pertinent HPI Negatives:** Denies ${negSyms.join(', ')}.`);

    const unlockedHpiModules = hpi.unlockedModules || [];
    HPI_UNLOCKABLE_MODULES.forEach((mod) => {
      const isUnlocked = Array.isArray(unlockedHpiModules)
        ? unlockedHpiModules.includes(mod.id)
        : !!unlockedHpiModules[mod.id];
      if (isUnlocked) {
        const modPos = [];
        const modNeg = [];
        mod.chips.forEach((c) => {
          const itemData = (hpi.symptoms && hpi.symptoms[c.id] !== undefined)
            ? hpi.symptoms[c.id]
            : (hpi[mod.id] && hpi[mod.id][c.id] !== undefined ? hpi[mod.id][c.id] : undefined);
          if (itemData !== undefined) {
            const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
            const det = typeof itemData === 'object' && itemData !== null && (itemData.detail || itemData.note)
              ? ` (${tLabel(itemData.detail || itemData.note)})`
              : '';
            const labelEn = tLabel(c.label, c.en);
            if (st === 1 || st === '+1') modPos.push(`${labelEn}${det}`);
            else if (st === -1 || st === '-1') modNeg.push(labelEn);
          }
        });
        if (modPos.length > 0 || modNeg.length > 0) {
          const modTitleEn = tLabel(mod.title, mod.en);
          const segments = [];
          if (modPos.length > 0) segments.push(`**Positive:** ${modPos.join(', ')}`);
          if (modNeg.length > 0) segments.push(`**Negative:** ${modNeg.join(', ')}`);
          narrativeSentences.push(`- **${modTitleEn}:** ${segments.join(' | ')}`);
        }
      }
    });

    if (hpi.systemGapNote) {
      narrativeSentences.push(`- **Additional HPI Findings:** ${tLabel(hpi.systemGapNote)}`);
    }

    if (demo.informant) {
      const infEn = demo.informant === 'خود بیمار' ? 'Patient' : tLabel(demo.informant);
      narrativeSentences.push(`(History source: ${infEn || 'Patient'}, reliable).`);
    }

    out.push(narrativeSentences.join('\n\n'));
    return out.join('\n');
  }

  // 1. کادر مشخصات هویتی برای بالای برگه شرح‌حال (فقط در نمایش محلی و پرینت بیمارستان)
  if (demo.fullName || demo.fatherName || demo.birthDate || demo.age || demo.ward || demo.bed) {
    const agePart = demo.birthDate
      ? `${demo.birthDate} (${demo.age ? demo.age + ' ساله' : ''})`
      : (demo.age ? `${demo.age} ساله` : '—');
    const genderLabel = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقا' : (demo.gender === 'other' ? 'سایر/ترنس' : '—');
    const wardPart = demo.ward ? ` | **بخش:** **${demo.ward}**` : '';
    const bedPart = demo.bed ? ` | **تخت:** **${demo.bed}**` : '';

    out.push(
      `> **مشخصات بیمار:** نام و نام خانوادگی: **${demo.fullName || '—'}** | نام پدر: **${demo.fatherName || '—'}** | تاریخ تولد / سن: **${agePart}** | جنسیت: **${genderLabel}**${wardPart}${bedPart}\n`
    );
  }

  // 2. شکایت اصلی (CC) یا نحوه انتقال و علت ارجاع در ترومای بدحال
  const ccText = normalizePersianClinicalText(cc.ccPhrase || cc.patientQuote || 'شکایت حاد جراحی');
  if (state.admission?.unresponsiveTrauma) {
    const moiText = state.admission?.traumaMoi || state.hpi?.presentations?.find(p => p.archetype === 'trauma_burn_archetype')?.mechanism || 'تروما و کاهش سطح هوشیاری';
    out.push(`### ۱. علت مراجعه و نحوه انتقال به اورژانس (Reason for Presentation & EMS Handover)`);
    out.push(`- **انتقال توسط اورژانس ۱۱۵ / مراجعه حاد به دنبال ${normalizePersianClinicalText(moiText)} (بیمار در بدو ورود به علت وضعیت بالینی قادر به بیان شکایت مستقیم نمی‌باشد).**`);
  } else {
    out.push(`### ۱. شکایت اصلی (Chief Complaint - CC)`);
    out.push(`- **${ccText}**`);
  }

  // 3. شرح بیماری فعلی (HPI) به صورت کاملاً روایی و مبتنی بر کهن‌الگوها
  out.push(`\n### ۲. شرح بیماری فعلی (History of Present Illness - HPI)`);
  const narrativeSentences = [];

  const genderWord = demo.gender === 'female' ? 'خانم ' : demo.gender === 'male' ? 'آقای ' : '';
  const agePhrase = demo.age ? `${demo.age} ساله` : '';
  const maritalPhrase = demo.marital ? `، ${demo.marital}` : '';
  const cityPhrase = demo.city ? `، اهل و ساکن ${normalizePersianClinicalText(demo.city)}` : '';
  const jobPhrase = demo.occupation ? `، شغل ${normalizePersianClinicalText(demo.occupation)}` : '';
  const ptIntro = `بیمار ${genderWord}${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase}`.replace(/\s+/g, ' ').trim();

  // جمله اول: معرفی بیمار بر اساس ۳ مسیر بالینی پذیرش
  if (cc.pathway === 'elective_clinic' || cc.pathway === 'clinic_referral') {
    const att = normalizePersianClinicalText(cc.clinicAttending || cc.referringAttending || cc.attendingPhysician || '');
    const diag = normalizePersianClinicalText(cc.clinicInitialDiagnosis || cc.establishedDiagnosis || cc.preliminaryDiagnosis || '');
    const proc = normalizePersianClinicalText(cc.clinicPlannedProcedure || cc.plannedProcedure || '');
    let refSentence = `${ptIntro} هستند که با شکایت «${ccText}» مراجعه نموده و با نامه ارجاع استاد محترم ${att ? '**' + att + '**' : 'درمانگاه جراحی'}`;
    if (diag) refSentence += ` با تشخیص اولیه «${diag}»`;
    if (proc) refSentence += ` جهت اقدام برنامه‌ریزی‌شده «${proc}»`;
    refSentence += ` از درمانگاه به صورت الکتیو در این بخش بستری شده‌اند.`;
    narrativeSentences.push(refSentence);
  } else if (cc.pathway === 'inpatient_transfer') {
    const src = normalizePersianClinicalText(cc.transferSource || cc.originWardHospital || '');
    const rsn = normalizePersianClinicalText(cc.transferReason || cc.primaryAdmissionReason || '');
    const ind = normalizePersianClinicalText(cc.transferSurgIndication || cc.transferConsultReason || '');
    let transSentence = `${ptIntro} هستند که به صورت انتقال بین‌بخشی / اعزام از ${src ? '«' + src + '»' : 'بخش/مرکز دیگر'}`;
    if (rsn) transSentence += ` (علت بستری اولیه: «${rsn}»)`;
    if (ind) transSentence += `، به دنبال مشاوره و با اندیکاسیون «${ind}» به سرویس جراحی منتقل و پذیرش گردیدند.`;
    else transSentence += `، جهت ادامه درمان تحت نظر سرویس جراحی پذیرش گردیدند.`;
    narrativeSentences.push(transSentence);
  } else if (cc.pathway === 'postop_complication') {
    narrativeSentences.push(
      `${ptIntro} هستند که به دنبال عمل جراحی اخیر، با شکایت «${ccText}» به این مرکز مراجعه کرده‌اند.`
    );
  } else if (state.admission?.unresponsiveTrauma) {
    const moiText = state.admission?.traumaMoi || state.hpi?.presentations?.find(p => p.archetype === 'trauma_burn_archetype')?.mechanism || 'تروما و کاهش سطح هوشیاری';
    let admSentence = `${ptIntro} هستند که به دنبال ${normalizePersianClinicalText(moiText)} توسط تیم فوریت‌های پزشکی ۱۱۵ (EMS) در شرایط حاد و فاقد هوشیاری کافی جهت اخذ شرح‌حال مستقیم به اورژانس جراحی منتقل گردیده‌اند.`;
    narrativeSentences.push(admSentence);
  } else {
    // emergency_acute
    let admSentence = `${ptIntro} هستند که با شکایت اصلی «${ccText}» به صورت حاد به اورژانس / بخش جراحی مراجعه و پذیرش نموده‌اند.`;
    narrativeSentences.push(admSentence);
  }

  // توصیف روایی کهن‌الگوهای مواجهه بالینی (5 Clinical Presentation Archetypes)
  if (presentations.length > 0) {
    presentations.forEach((item, idx) => {
      narrativeSentences.push(renderArchetypeNarrative(item, idx, presentations.length));
    });
  }

  // توضیحات روایی آزاد بیمار و سیر اقدامات قبل از بستری
  if (hpi.narrativeNote) {
    narrativeSentences.push(normalizePersianClinicalText(hpi.narrativeNote));
  }
  if (hpi.preAdmissionWorkup) {
    narrativeSentences.push(`در سیر اقدامات پیش از بستری، ${normalizePersianClinicalText(hpi.preAdmissionWorkup)}.`);
  }

  // علائم همراه مثبت و منفی کلیدی در قالب نثر روایی
  const posSymptoms = [];
  const negSymptoms = [];
  Object.entries(hpi.symptoms || {}).forEach(([symId, obj]) => {
    const st = typeof obj === 'object' && obj !== null ? obj.state : obj;
    const det = typeof obj === 'object' && obj !== null && (obj.detail || obj.note) ? ` (${normalizePersianClinicalText(obj.detail || obj.note)})` : '';
    const label = (typeof obj === 'object' && obj !== null && obj.label) || symId;
    if (st === 1 || st === '+1') posSymptoms.push(`${label}${det}`);
    if (st === -1 || st === '-1') negSymptoms.push(label);
  });

  if (posSymptoms.length > 0 || negSymptoms.length > 0) {
    let symLine = `- **علائم همراه و عمومی:** `;
    if (posSymptoms.length > 0 && negSymptoms.length > 0) {
      symLine += `بیمار از وجود ${posSymptoms.join('، ')} شاکی است؛ اما وجود ${negSymptoms.join('، ')} را در سیر بیماری اخیر نفی می‌کند.`;
    } else if (posSymptoms.length > 0) {
      symLine += `بیمار ذکر از ${posSymptoms.join('، ')} دارد.`;
    } else {
      symLine += `بیمار در سیر بیماری اخیر وجود ${negSymptoms.join('، ')} را نفی می‌کند.`;
    }
    narrativeSentences.push(symLine);
  }

  // ماژول‌های علامتی آنلاک‌شده HPI
  const unlockedHpiModules = hpi.unlockedModules || [];
  HPI_UNLOCKABLE_MODULES.forEach((mod) => {
    const isUnlocked = Array.isArray(unlockedHpiModules)
      ? unlockedHpiModules.includes(mod.id)
      : !!unlockedHpiModules[mod.id];
    if (isUnlocked) {
      const modPos = [];
      const modNeg = [];
      mod.chips.forEach((c) => {
        const itemData = (hpi.symptoms && hpi.symptoms[c.id] !== undefined)
          ? hpi.symptoms[c.id]
          : (hpi[mod.id] && hpi[mod.id][c.id] !== undefined ? hpi[mod.id][c.id] : undefined);
        if (itemData !== undefined) {
          const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
          const det = typeof itemData === 'object' && itemData !== null && (itemData.detail || itemData.note)
            ? ` (${normalizePersianClinicalText(itemData.detail || itemData.note)})`
            : '';
          const label = (typeof itemData === 'object' && itemData !== null && itemData.label) || c.label;
          if (st === 1 || st === '+1') modPos.push(`${label}${det}`);
          else if (st === -1 || st === '-1') modNeg.push(label);
        }
      });

      if (modPos.length > 0 || modNeg.length > 0) {
        let modText = `- **${mod.title}:** `;
        if (modPos.length > 0 && modNeg.length > 0) {
          modText += `**مثبت:** ${modPos.join('، ')} | **منفی:** ${modNeg.join('، ')}`;
        } else if (modPos.length > 0) {
          modText += `**مثبت:** ${modPos.join('، ')}`;
        } else {
          modText += `**منفی:** ${modNeg.join('، ')}`;
        }
        narrativeSentences.push(modText);
      }
    }
  });

  if (demo.informant) {
    narrativeSentences.push(`(منبع اخذ شرح‌حال: ${demo.informant}، با قابلیت اعتماد مناسب).`);
  }

  out.push(narrativeSentences.join('\n\n'));
  return out.join('\n');
}

/**
 * Pure English Clinical Admission Note Generator (v1.2-Bilingual-CleanUI)
 */
export function generateEnglishClinicalNote(state) {
  const lines = [];
  const demo = state.demographics || {};

  // 1 & 2: CC and HPI
  lines.push(generateNarrativeCCAndHPI(state));

  // 3. PMH / PSH
  lines.push(`\n### 3. Past Medical & Surgical History (PMH / PSH)`);
  const pmhState = state.pmh || {};
  const pmhCategoriesState = pmhState.categories || {};
  const masterNeg = pmhState.masterRoutineNegative;

  if (masterNeg) {
    lines.push(`- **PMH Routine Negatives:** Patient explicitly denies common chronic medical conditions (Diabetes Mellitus, Hypertension, Dyslipidemia, and Ischemic Heart Disease).`);
  }

  const catLines = [];
  PMH_CATEGORIES.forEach((cat) => {
    const catData = pmhCategoriesState[cat.id] || {};
    const catItems = catData.items || {};
    const isNeg = catData.status === 'negated' || catData.negativeAll === true;
    const posItems = [];
    cat.items.forEach((item) => {
      const val = catItems[item.id] || pmhState.items?.[item.id];
      const st = typeof val === 'object' && val !== null ? (val.state !== undefined ? val.state : (val.active ? 1 : 0)) : val;
      const dt = typeof val === 'object' && val !== null ? (val.detail || val.note || '') : '';
      if (st === 1 || st === '+1') {
        const itemEn = tLabel(item.label, item.en);
        posItems.push(dt ? `${itemEn} (${tLabel(dt)})` : itemEn);
      }
    });
    const catTitleEn = tLabel(cat.title, cat.en);
    if (posItems.length > 0) {
      const otherNoteEn = catData.otherNote ? ` | Other: ${tLabel(catData.otherNote)}` : '';
      catLines.push(`  * **${catTitleEn}:** ${posItems.join(', ')}${otherNoteEn}`);
    } else if (isNeg) {
      catLines.push(`  * **${catTitleEn}:** Negative (denies conditions in this category)`);
    }
  });

  if (catLines.length > 0) {
    lines.push(`- **Past Medical History (PMH):**\n${catLines.join('\n')}`);
  } else if (!masterNeg) {
    lines.push(`- **Past Medical History (PMH):** Denies significant chronic medical illnesses.`);
  }
  if (pmhState.systemGapNote) {
    lines.push(`- **Additional Medical History:** ${tLabel(pmhState.systemGapNote)}`);
  }

  const pshPartsEn = [];
  if (state.psh?.surgeries && Array.isArray(state.psh.surgeries) && state.psh.surgeries.length > 0) {
    const surgStr = state.psh.surgeries.map(s => {
      const name = s.en || tLabel(s.label || s.procedure || 'Surgery', s.en);
      const yearPart = s.year ? `Year: ${tLabel(s.year)}` : '';
      const notePart = (s.note || s.yearHospital) ? tLabel(s.note || s.yearHospital) : '';
      const det = [yearPart, notePart].filter(Boolean).join(' | ');
      return det ? `${name} (${det})` : name;
    }).join(', ');
    pshPartsEn.push(surgStr);
  }
  if (state.psh?.note && state.psh.note.trim()) {
    pshPartsEn.push(tLabel(state.psh.note.trim()));
  }
  if (pshPartsEn.length > 0) {
    lines.push(`- **Past Surgical History (PSH):** ${pshPartsEn.join(' | ')}`);
  } else {
    lines.push(`- **Past Surgical History (PSH):** Denies prior abdominal or major surgical procedures.`);
  }
  if (state.psh?.systemGapNote) {
    lines.push(`- **Additional Surgical History:** ${tLabel(state.psh.systemGapNote)}`);
  }

  if (demo.gender !== 'male' && state.obgyn) {
    const o = state.obgyn;
    const gVal = o.g !== undefined && o.g !== '' ? o.g : (o.gravida || 0);
    const pVal = o.p !== undefined && o.p !== '' ? o.p : (o.para || 0);
    const abVal = o.ab !== undefined && o.ab !== '' ? o.ab : (o.abortion || 0);
    const lVal = o.l !== undefined && o.l !== '' ? o.l : (o.living || 0);
    const obSegments = [`G${gVal} P${pVal} Ab${abVal} L${lVal}`];
    if (o.deliveryType) obSegments.push(`Delivery Mode: ${tLabel(o.deliveryType)}`);
    if (o.lmp) obSegments.push(`LMP / Menstrual Status: ${tLabel(o.lmp)}`);
    if (o.dysmenorrhea) obSegments.push(`Menstrual Pattern: ${tLabel(o.dysmenorrhea)}`);
    if (demo.gender === 'female' || o.g || o.p || o.deliveryType || o.lmp || (o.pregnancies && o.pregnancies.length > 0)) {
      lines.push(`- **Obstetric & Gynecologic History (Ob/Gyn):** ${obSegments.join(' | ')}.`);
      if (Array.isArray(o.pregnancies) && o.pregnancies.length > 0) {
        o.pregnancies.forEach((preg, idx) => {
          const pDet = [
            preg.outcome ? `Outcome: ${tLabel(preg.outcome)}` : '',
            (preg.deliveryType || preg.deliveryMethod) ? `Mode: ${tLabel(preg.deliveryType || preg.deliveryMethod)}` : '',
            preg.year ? `Year: ${tLabel(preg.year)}` : '',
            preg.complications ? `Notes: ${tLabel(preg.complications)}` : ''
          ].filter(Boolean);
          if (pDet.length > 0) lines.push(`  * Pregnancy #${idx + 1}: ${pDet.join(' | ')}`);
        });
      }
    }
  }

  // 4. Medications, Allergies, Social & Family History
  lines.push(`\n### 4. Medications, Allergies, Social & Family History (DH / AH / SH / FH)`);
  const ahState = state.ah || {};
  if (ahState.nkda) {
    lines.push(`- **Allergies (AH):** No Known Drug Allergies (NKDA).`);
  } else {
    const ahSel = (ahState.selected || []).map((item) => {
      if (typeof item === 'object' && item !== null) {
        return item.detail ? `${tLabel(item.label)} (${tLabel(item.detail)})` : tLabel(item.label);
      }
      return tLabel(item);
    }).filter(Boolean);
    const ahCombined = [
      ...(ahSel.length ? [ahSel.join(', ')] : []),
      ...(ahState.drugAllergies ? [tLabel(ahState.drugAllergies)] : []),
      ...(ahState.note ? [tLabel(ahState.note)] : [])
    ].join(' — ');
    lines.push(`- **Allergies (AH):** ${ahCombined || 'No known drug or food allergies reported.'}`);
  }
  if (ahState.systemGapNote) {
    lines.push(`- **Additional Allergies:** ${tLabel(ahState.systemGapNote)}`);
  }

  const dhState = state.dh || {};
  if (dhState.noRoutineMeds) {
    lines.push(`- **Current Medications (DH):** Denies routine medication use (No routine medications).`);
  } else {
    const activeList = [];
    if (dhState.activeDrugs && Array.isArray(dhState.activeDrugs)) {
      dhState.activeDrugs.forEach(ad => {
        const parts = [ad.dose ? `dose: ${tLabel(ad.dose)}` : '', ad.sig ? `sig: ${ad.sig}` : '', ad.note ? `note: ${tLabel(ad.note)}` : ''].filter(Boolean);
        activeList.push(`${tLabel(ad.name || ad.label || ad.id)}${parts.length ? ' (' + parts.join(' | ') + ')' : ''}`);
      });
    }
    if (dhState.customDrugs && Array.isArray(dhState.customDrugs)) {
      dhState.customDrugs.forEach(cd => {
        if (cd.name && cd.name.trim()) {
          const parts = [cd.dose ? `dose: ${tLabel(cd.dose)}` : '', cd.sig ? `sig: ${cd.sig}` : '', cd.note ? `note: ${tLabel(cd.note)}` : ''].filter(Boolean);
          activeList.push(`${tLabel(cd.name)}${parts.length ? ' (' + parts.join(' | ') + ')' : ''}`);
        }
      });
    }
    if (dhState.drugs && Array.isArray(dhState.drugs)) {
      dhState.drugs.forEach(d => {
        const parts = [d.dose, d.sig, d.note ? '(' + tLabel(d.note) + ')' : ''].filter(Boolean);
        activeList.push(`${tLabel(d.name || '')}${parts.length ? ' ' + parts.join(' ') : ''}`.trim());
      });
    }
    if (activeList.length > 0) {
      lines.push(`- **Current Medications (DH):** ${activeList.join(', ')}`);
    } else {
      lines.push(`- **Current Medications (DH):** Denies regular prescription medication use.`);
    }
  }
  if (dhState.note) {
    lines.push(`- **Medication Notes:** ${tLabel(dhState.note)}`);
  }
  if (dhState.systemGapNote) {
    lines.push(`- **Additional Medications:** ${tLabel(dhState.systemGapNote)}`);
  }

  const shState = state.sh || {};
  const shParts = [];
  if (demo.occupation) shParts.push(`Occupation: ${tLabel(demo.occupation)}`);
  if (shState.negSmoking) shParts.push('Tobacco: Denies smoking/tobacco');
  else if (shState.cigsPerDay && shState.yearsSmoked) {
    const py = ((Number(shState.cigsPerDay) / 20) * Number(shState.yearsSmoked)).toFixed(1);
    shParts.push(`Tobacco: ${shState.cigsPerDay} cigs/day for ${shState.yearsSmoked} yrs (~${py} pack-years)`);
  } else if (shState.smoking) shParts.push(`Tobacco: ${tLabel(shState.smoking)}`);

  if (shState.negOpium) shParts.push('Substances: Denies opium/substance use');
  else if (shState.opium) shParts.push(`Substances: ${tLabel(shState.opium)}`);
  else if (shState.substance) shParts.push(`Substances: ${tLabel(shState.substance)}`);

  if (shState.negAlcohol) shParts.push('Alcohol: Denies alcohol use');
  else if (shState.alcohol) shParts.push(`Alcohol: ${tLabel(shState.alcohol)}`);
  if (shState.note) shParts.push(tLabel(shState.note));

  lines.push(`- **Social History (SH):** ${shParts.length > 0 ? shParts.join('; ') : 'Non-contributory (denies tobacco, alcohol or substance use).'}`);
  if (shState.systemGapNote) {
    lines.push(`- **Additional Social History:** ${tLabel(shState.systemGapNote)}`);
  }

  const fhState = state.fh || {};
  if (fhState.negFamilyHistory || fhState.masterNeg) {
    lines.push(`- **Family History (FH):** Negative for familial malignancies or premature CAD in first-degree relatives.`);
  } else if (fhState.diseases && Array.isArray(fhState.diseases) && fhState.diseases.length > 0) {
    const fhListEn = fhState.diseases.map(d => {
      const dName = tLabel(d.en || d.diseaseLabel || d.name || d.label || 'Condition');
      if (d.relatives && Array.isArray(d.relatives) && d.relatives.length > 0) {
        const relParts = d.relatives.map(r => {
          if (typeof r === 'object' && r !== null) {
            const vStr = r.vitalStatus === 'deceased' ? 'deceased' : 'living';
            const noteStr = r.ageOrNote ? ` — ${tLabel(r.ageOrNote)}` : '';
            return `${tLabel(r.relation) || 'relative'} (${vStr}${noteStr})`;
          }
          return tLabel(String(r));
        });
        return `${dName} in ${relParts.join(' & ')}`;
      }
      const vit = (d.status === 'deceased' || d.isAlive === false) ? 'deceased' : 'living';
      const age = (d.ageNotes || d.ageNote) ? `, ${tLabel(d.ageNotes || d.ageNote)}` : '';
      return `${dName} in family (${vit}${age})`;
    });
    lines.push(`- **Family History (FH):** Positive for ${fhListEn.join('; ')}.`);
  } else {
    const fhNoteEn = fhState.note || fhState.notes;
    lines.push(`- **Family History (FH):** ${fhNoteEn ? tLabel(fhNoteEn) : 'Non-contributory (denies familial malignancies or hereditary disorders in first-degree relatives).'}`);
  }
  if (fhState.systemGapNote) {
    lines.push(`- **Additional Family History:** ${tLabel(fhState.systemGapNote)}`);
  }

  // 5. ROS
  lines.push(`\n### 5. Review of Systems (ROS)`);
  if (state.ros?.unobtainable) {
    lines.push(`- **Review of Systems Unobtainable:** Standard 11-point ROS could not be obtained due to altered level of consciousness, intubation, and acute critical trauma status. Clinical evaluation relies on physical examination, primary/secondary survey, and ATLS protocol.`);
  } else {
    const rosItems = state.ros?.items || {};
    const rosPos = [];
    const rosNeg = [];
    Object.entries(rosItems).forEach(([rId, val]) => {
      const st = typeof val === 'object' && val !== null ? val.state : val;
      const dt = typeof val === 'object' && val !== null && val.detail ? ` (${tLabel(val.detail)})` : '';
      const enLb = findRosItemLabel(rId, typeof val === 'object' ? val?.label : rId);
      if (st === 1 || st === '+1') rosPos.push(`${enLb}${dt}`);
      else if (st === -1 || st === '-1') rosNeg.push(enLb);
    });
    if (rosPos.length > 0) lines.push(`- **Positive System Review:** ${rosPos.join(', ')}`);
    if (rosNeg.length > 0) lines.push(`- **Negative System Review:** Denies ${rosNeg.join(', ')}`);
    if (rosPos.length === 0 && rosNeg.length === 0) lines.push(`- **System Review:** 11-point review of systems otherwise negative except as noted in HPI.`);
    if (state.ros?.systemGapNote) {
      lines.push(`- **Additional ROS Findings:** ${tLabel(state.ros.systemGapNote)}`);
    }
  }

  // 6. PE
  lines.push(`\n### 6. Physical Examination (PE)`);
  const vitals = state.pe?.vitals || {};
  const npoEn = vitals.npo ? tLabel(String(vitals.npo)) : 'Unspecified';
  lines.push(`- **Vital Signs:** BP: ${vitals.bp || '—'} mmHg | PR: ${vitals.pr || '—'} bpm | RR: ${vitals.rr || '—'} /min | Temp: ${vitals.temp || '—'} °C | SpO2: ${vitals.spo2 || '—'}% on RA | Fasting (NPO): ${npoEn}`);

  lines.push(`- **Comprehensive Physical Examination (12 Clinical Pillars):**`);
  PE_MANDATORY_PILLARS.forEach((pillar) => {
    const pTitleEn = pillar.en || tLabel(pillar.title);
    const secPos = [];
    const secNeg = [];
    pillar.items.forEach((item) => {
      const itemData = state.pe?.findings?.[item.id] || (state.pe?.abdomen && (state.pe.abdomen[pillar.id]?.[item.id] || state.pe.abdomen[item.id])) || state.pe?.[item.id];
      const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
      const detail = typeof itemData === 'object' && itemData !== null ? (itemData.detail || itemData.note || '') : '';
      const itemEn = item.en || tLabel(item.label, item.en);
      const dtEn = detail ? tLabel(detail) : '';
      if (st === 1 || st === '+1') {
        secPos.push(dtEn && dtEn.trim() ? `${itemEn} (${dtEn})` : itemEn);
      } else if (st === -1 || st === '-1') {
        secNeg.push(itemEn);
      }
    });
    if (secPos.length > 0 && secNeg.length > 0) {
      lines.push(`  * **${pTitleEn}:** **Positive:** ${secPos.join(', ')} | **Negative:** No ${secNeg.join(', ')}`);
    } else if (secPos.length > 0) {
      lines.push(`  * **${pTitleEn}:** **Positive:** ${secPos.join(', ')}`);
    } else if (secNeg.length > 0) {
      lines.push(`  * **${pTitleEn}:** Negative for ${secNeg.join(', ')}`);
    } else {
      lines.push(`  * **${pTitleEn}:** Unremarkable routine baseline examination`);
    }
  });

  // Local Mass Exam Module
  const massExamsEn = state.pe?.massExams || state.pe?.massExamList || [];
  if (massExamsEn.length > 0) {
    lines.push(`- **Local Mass & Lesion Examination:**`);
    massExamsEn.forEach((m, idx) => {
      lines.push(
        `  * **Lesion #${idx + 1} (${tLabel(m.location) || 'Specified Site'}):** Dimensions: ${m.dimensions || 'Unspecified'} | Consistency: ${tLabel(m.consistency) || '—'} | Margins: ${tLabel(m.margin || m.margins) || '—'} | Mobility: ${tLabel(m.mobility) || '—'} | Skin & Tenderness: ${tLabel(m.skinSign || m.tendernessSkin) || 'Normal'} | Remarks: ${tLabel(m.note || m.neuroLymph) || 'Intact'}`
      );
    });
  }

  // ATLS Trauma Exam Module inside H&P (strictly rendered only if active and real data entered)
  const atlsEn = state.pe?.atlsExam || {};
  const hasPrimarySurveyEn = Object.values(atlsEn.primarySurvey || {}).some(v => typeof v === 'string' ? v.trim().length > 0 : (Array.isArray(v) ? v.length > 0 : Boolean(v)));
  const hasWoundsEn = Array.isArray(atlsEn.wounds) && atlsEn.wounds.length > 0;
  const hasBurnEn = Boolean(atlsEn.burn && (atlsEn.burn.degree || atlsEn.burn.tbsa || atlsEn.burn.regions || (Array.isArray(atlsEn.burn.inhalationSigns) && atlsEn.burn.inhalationSigns.length > 0)));
  const hasAtlsExamEn = (atlsEn.active === true || atlsEn.enabled === true) && (hasPrimarySurveyEn || hasWoundsEn || hasBurnEn);

  if (hasAtlsExamEn) {
    lines.push(`- **ATLS Trauma & Burn Survey:**`);
    if (hasPrimarySurveyEn) {
      const ps = atlsEn.primarySurvey || {};
      const psTokens = [
        ps.airway ? `Airway: ${tLabel(ps.airway)}` : '',
        ps.breathing ? `Breathing: ${tLabel(ps.breathing)}` : '',
        ps.circulation ? `Circulation: ${tLabel(ps.circulation)}` : '',
        ps.disability ? `Disability: ${tLabel(ps.disability)}` : '',
        ps.exposure ? `Exposure: ${tLabel(ps.exposure)}` : ''
      ].filter(Boolean);
      if (psTokens.length > 0) {
        lines.push(`  * **Primary Survey (ABCDE):** ${psTokens.join(' | ')}`);
      }
    }
    if (hasWoundsEn) {
      lines.push(`  * **Wound Registry:**`);
      atlsEn.wounds.forEach((w, wIdx) => {
        lines.push(`    - #${wIdx + 1}: ${tLabel(w.type) || 'Wound'} at ${tLabel(w.location) || 'Site'} (${w.dimensions || '—'}) | Bleeding: ${tLabel(w.bleedingStatus || w.bleeding) || '—'} | Distal NV: ${tLabel(w.distalNv || w.distalNV) || 'Intact'}`);
      });
    }
    if (hasBurnEn) {
      lines.push(`  * **Burn Assessment:** Degree: ${tLabel(atlsEn.burn.degree) || '—'} | % TBSA: ${atlsEn.burn.tbsa || '—'}%${atlsEn.burn.regions ? ` (Involved: ${tLabel(atlsEn.burn.regions)})` : ''} | Inhalation Signs: ${atlsEn.burn.inhalationSigns?.map(s => tLabel(s)).join(', ') || 'None'}`);
    }
  }
  if (state.pe?.note) lines.push(`- **Supplementary PE Notes:** ${tLabel(state.pe.note)}`);
  if (state.pe?.systemGapNote) lines.push(`- **Additional PE Findings:** ${tLabel(state.pe.systemGapNote)}`);

  // 7. Paraclinics (Imaging + Labs)
  lines.push(`\n### 7. Diagnostic Studies & Paraclinics`);
  const modalitiesEn = state.paraclinics?.imagingReports || [];
  if (modalitiesEn.length > 0) {
    lines.push(`- **Diagnostic Imaging, Endoscopy & Pathology:**`);
    modalitiesEn.forEach((rep) => {
      const modTitle = tLabel(rep.modalityTitle || rep.modalityLabel || rep.modality || 'Diagnostic Study');
      const chipArr = (rep.findingChips || rep.tags || []).map((t) => {
        if (typeof t === 'object' && t !== null) {
          return t.detail ? `${tLabel(t.label)} (${tLabel(t.detail)})` : tLabel(t.label);
        }
        return tLabel(t);
      }).filter(Boolean);
      const chipText = chipArr.length ? `[${chipArr.join(', ')}] ` : '';
      const contentEn = tLabel(rep.impression || rep.findings || rep.summary || '');
      lines.push(
        `  * **${modTitle}${rep.targetOrgan ? ` (${tLabel(rep.targetOrgan)})` : ''}${rep.date ? ` [${rep.date}]` : ''}:** ${chipText}${contentEn}`
      );
    });
  } else {
    lines.push(`- **Diagnostic Imaging:** No formal imaging studies recorded yet.`);
  }

  const labs = state.paraclinics?.labs || {};
  const panelLinesEn = [];
  LAB_PANELS.forEach((panel) => {
    const pTests = [];
    panel.tests.forEach((def) => {
      const val = labs[def.id];
      if (val !== undefined && val !== '' && val !== null) {
        const num = parseFloat(val);
        let flag = '';
        if (!isNaN(num)) {
          if (num > def.max) flag = ' ↑(H)';
          else if (num < def.min) flag = ' ↓(L)';
        }
        const unitStr = def.unit ? ` ${def.unit}` : '';
        pTests.push(`${tLabel(def.label, def.en)}: ${val}${unitStr}${flag}`);
      }
    });
    if (pTests.length > 0) {
      panelLinesEn.push(`  * **${tLabel(panel.title, panel.en)}:** ${pTests.join(' | ')}`);
    }
  });

  const addLabsEn = state.paraclinics?.additionalLabs || {};
  const addEntriesEn = Object.entries(addLabsEn).filter(([k, v]) => {
    if (!v) return false;
    if (typeof v === 'object') return v.value && String(v.value).trim();
    return String(v).trim();
  });
  if (addEntriesEn.length > 0) {
    const addParts = addEntriesEn.map(([k, v]) => {
      const val = typeof v === 'object' ? v.value : v;
      const unit = typeof v === 'object' && v.unit ? ` ${v.unit}` : '';
      const name = typeof v === 'object' && v.name ? tLabel(v.name) : tLabel(k);
      return `${name}: ${val}${unit}`;
    });
    panelLinesEn.push(`  * **Specialized / Additional Labs:** ${addParts.join(' | ')}`);
  }

  if (panelLinesEn.length > 0) {
    lines.push(`- **Laboratory Investigations:**\n${panelLinesEn.join('\n')}`);
  } else {
    lines.push(`- **Laboratory Investigations:** Results pending at time of admission.`);
  }
  if (state.paraclinics?.labNote) {
    lines.push(`- **Laboratory Trends & Notes:** ${tLabel(state.paraclinics.labNote)}`);
  }
  if (state.paraclinics?.systemGapNote) {
    lines.push(`- **Additional Diagnostic Studies:** ${tLabel(state.paraclinics.systemGapNote)}`);
  }

  // 8. DDx & Plan
  lines.push(`\n### 8. Clinical Reasoning, Differential Diagnoses & Initial Plan`);
  const reasoning = state.reasoning || {};
  if (reasoning.problemRepresentation) {
    lines.push(`- **Problem Representation:** ${tLabel(reasoning.problemRepresentation)}`);
  }
  if (reasoning.ddx) {
    lines.push(`- **Differential Diagnoses (DDx) & Initial Surgical Plan:**\n${reasoning.ddx.split('\n').filter(Boolean).map(l => `  * ${tLabel(l)}`).join('\n')}`);
  } else {
    if (reasoning.topDifferential) lines.push(`- **Primary Differential:** ${tLabel(reasoning.topDifferential)}`);
    if (reasoning.managementPlan) lines.push(`- **Management Plan:** ${tLabel(reasoning.managementPlan)}`);
  }

  return lines.join('\n');
}

/**
 * Complete Surgical Clinical Note Generator (v1.2-Bilingual-CleanUI)
 */
export function generateClinicalNote(state) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  if (lang === 'en') {
    return generateEnglishClinicalNote(state);
  }

  const lines = [];
  const demo = state.demographics || {};

  // 1 & 2: CC and HPI
  lines.push(generateNarrativeCCAndHPI(state));

  // ۳. سوابق بیماری‌های داخلی (PMH) دسته‌بندی‌شده و سوابق جراحی (PSH) - حذف کامل HH
  lines.push(`\n### ۳. سوابق بیماری‌های داخلی و جراحی (PMH / PSH)`);

  const pmhState = state.pmh || {};
  const pmhCategoriesState = pmhState.categories || {};
  const masterNeg = pmhState.masterRoutineNegative;

  if (masterNeg) {
    lines.push(`- **منفی‌های روتین PMH:** بیمار سابقه تمام بیماری‌های زمینه‌ای روتین (دیابت شیرین، پرفشاری خون، دیس‌لیپیدمی و بیماری ایسکمیک قلبی) را به طور صریح نفی می‌کند.`);
  }

  const categoryLines = [];
  PMH_CATEGORIES.forEach((cat) => {
    const catData = pmhCategoriesState[cat.id] || {};
    const catItems = catData.items || {};
    const isNegated = catData.status === 'negated' || catData.negativeAll === true;

    const posInCat = [];
    cat.items.forEach((item) => {
      const val = catItems[item.id] || pmhState.items?.[item.id];
      const st = typeof val === 'object' && val !== null ? (val.state !== undefined ? val.state : (val.active ? 1 : 0)) : val;
      const detail = typeof val === 'object' && val !== null ? (val.detail || val.note || '') : '';
      if (st === 1 || st === '+1') {
        posInCat.push(detail && detail.trim() ? `${item.label} (${normalizePersianClinicalText(detail)})` : item.label);
      }
    });

    if (posInCat.length > 0) {
      const otherStr = catData.otherNote ? ` | سایر: ${normalizePersianClinicalText(catData.otherNote)}` : '';
      categoryLines.push(`  * **${cat.title}:** ${posInCat.join('، ')}${otherStr}`);
    } else if (isNegated) {
      categoryLines.push(`  * **${cat.title}:** منفی (عدم سابقه بیماری‌های این دسته)`);
    }
  });

  if (categoryLines.length > 0) {
    lines.push(`- **سوابق پزشکی (PMH):**\n${categoryLines.join('\n')}`);
  } else if (!masterNeg) {
    lines.push(`- **سوابق پزشکی (PMH):** سابقه بیماری داخلی مزمن شناخته‌شده‌ای را ذکر نمی‌کند.`);
  }

  if (pmhState.systemGapNote) {
    lines.push(`- **سایر بیماری‌های زمینه‌ای خارج از لیست:** ${normalizePersianClinicalText(pmhState.systemGapNote)}`);
  }

  // PSH (با پشتیبانی از تگ‌های جراحی و اکتومی‌ها + یادداشت آزاد)
  const pshParts = [];
  if (state.psh?.surgeries && Array.isArray(state.psh.surgeries) && state.psh.surgeries.length > 0) {
    const surgItems = state.psh.surgeries.map((s) => {
      const name = s.label || s.procedure || '';
      const yearPart = s.year ? `سال عمل: ${normalizePersianClinicalText(s.year)}` : '';
      const notePart = (s.note || s.yearHospital) ? normalizePersianClinicalText(s.note || s.yearHospital) : '';
      const det = [yearPart, notePart].filter(Boolean).join(' | ');
      return det ? `${name} (${det})` : name;
    }).filter(Boolean);
    if (surgItems.length > 0) {
      pshParts.push(surgItems.join('، '));
    }
  }
  if (state.psh?.note && state.psh.note.trim()) {
    pshParts.push(normalizePersianClinicalText(state.psh.note));
  }
  if (state.psh?.historyOfAnesthesia) {
    pshParts.push(`بیهوشی: ${state.psh.historyOfAnesthesia}`);
  }
  const pshNote = pshParts.length > 0
    ? pshParts.join(' | ')
    : 'سابقه عمل جراحی قبلی و عوارض بیهوشی را ذکر نمی‌کند.';
  lines.push(`- **سوابق جراحی قبلی (PSH):** ${pshNote}`);
  if (state.psh?.systemGapNote) {
    lines.push(`- **سایر سوابق جراحی خارج از لیست:** ${normalizePersianClinicalText(state.psh.systemGapNote)}`);
  }

  // Ob/Gyn (فقط در صورتی که بیمار آقا نباشد)
  if (demo.gender !== 'male' && state.obgyn) {
    const ob = state.obgyn;
    const obParts = [];
    const gpal = [];
    if (ob.g !== undefined && ob.g !== '') gpal.push(`G: ${ob.g}`);
    if (ob.p !== undefined && ob.p !== '') gpal.push(`P: ${ob.p}`);
    if (ob.ab !== undefined && ob.ab !== '') gpal.push(`Ab: ${ob.ab}`);
    if (ob.l !== undefined && ob.l !== '') gpal.push(`L: ${ob.l}`);
    if (gpal.length > 0) obParts.push(`بارداری/زایمان: ${gpal.join(' / ')}`);
    if (ob.deliveryType) obParts.push(`نوع زایمان‌های قبلی: ${ob.deliveryType}`);
    if (ob.lmp) obParts.push(`وضعیت قاعدگی و تاریخ LMP: ${normalizePersianClinicalText(ob.lmp)}`);
    if (ob.dysmenorrhea) obParts.push(`دیسمنوره/منوراژی: ${normalizePersianClinicalText(ob.dysmenorrhea)}`);
    if (ob.note) obParts.push(normalizePersianClinicalText(ob.note));

    lines.push(`- **سوابق بارداری و زایمان (Obstetric History):** ${obParts.join(' | ') || 'بررسی شد.'}`);

    if (ob.pregnancies && Array.isArray(ob.pregnancies) && ob.pregnancies.length > 0) {
      lines.push(`  * **جزئیات سوابق بارداری‌ها و زایمان‌ها:**`);
      ob.pregnancies.forEach((preg, i) => {
        const details = [];
        if (preg.outcome) details.push(`نتیجه: ${preg.outcome}`);
        if (preg.deliveryType || preg.deliveryMethod) details.push(`روش: ${preg.deliveryType || preg.deliveryMethod}`);
        if (preg.term) details.push(`سن بارداری: ${preg.term}`);
        if (preg.year) details.push(`سال/تاریخ: ${normalizePersianClinicalText(preg.year)}`);
        if (preg.weightSex) details.push(`وزن/جنس: ${normalizePersianClinicalText(preg.weightSex)}`);
        if (preg.complications) details.push(`علت/عوارض: ${normalizePersianClinicalText(preg.complications)}`);
        lines.push(`    - بارداری #${i + 1}: ${details.join(' | ')}`);
      });
    }
  }

  // ۴. DH / AH / SH / FH با دوز و نحوه مصرف
  lines.push(`\n### ۴. سوابق دارویی، حساسیت، عادات و خانوادگی (DH / AH / SH / FH)`);

  const dhState = state.dh || {};
  if (dhState.noRoutineMeds) {
    lines.push(`- **سوابق دارویی (DH):** عدم مصرف داروی روتین (No routine medications).`);
  } else {
    const activeDrugsList = [];

    // داروها در دیتابیس فعال v0.8
    if (dhState.activeDrugs && Array.isArray(dhState.activeDrugs) && dhState.activeDrugs.length > 0) {
      dhState.activeDrugs.forEach((ad) => {
        const parts = [
          ad.dose ? `دوز: ${normalizePersianClinicalText(ad.dose)}` : '',
          ad.sig ? `طریقه: ${ad.sig}` : '',
          ad.note ? `ملاحظات: ${normalizePersianClinicalText(ad.note)}` : ''
        ].filter(Boolean);
        const desc = parts.length > 0 ? ` (${parts.join(' | ')})` : '';
        activeDrugsList.push(`**${normalizePersianClinicalText(ad.name || ad.label || ad.id)}**${desc}`);
      });
    }

    // پشتیبانی تکمیلی از دسته‌بندی‌های قبلی
    DH_CATEGORIES.forEach((cat) => {
      const catDrugsState = dhState.categories?.[cat.id]?.drugs || {};
      cat.drugs.forEach((drug) => {
        const entry = catDrugsState[drug.id];
        if (entry && (entry.active || entry === true)) {
          const already = dhState.activeDrugs?.some((a) => a.id === drug.id);
          if (!already) {
            const doseStr = entry.dose ? `دوز: ${normalizePersianClinicalText(entry.dose)}` : `دوز: ${drug.defaultDose}`;
            const sigStr = entry.sig ? `طریقه: ${entry.sig}` : '';
            const noteStr = entry.note ? `ملاحظات: ${normalizePersianClinicalText(entry.note)}` : '';
            const parts = [doseStr, sigStr, noteStr].filter(Boolean);
            activeDrugsList.push(`**${drug.label}** (${parts.join(' | ')})`);
          }
        }
      });
    });

    if (dhState.customDrugs && Array.isArray(dhState.customDrugs)) {
      dhState.customDrugs.forEach((cd) => {
        if (cd.name && cd.name.trim()) {
          const parts = [
            cd.dose ? `دوز: ${normalizePersianClinicalText(cd.dose)}` : '',
            cd.sig ? `طریقه: ${cd.sig}` : '',
            cd.note ? `ملاحظات: ${normalizePersianClinicalText(cd.note)}` : ''
          ].filter(Boolean);
          activeDrugsList.push(`**${normalizePersianClinicalText(cd.name)}** (${parts.join(' | ')})`);
        }
      });
    }

    if (activeDrugsList.length > 0) {
      lines.push(`- **سوابق دارویی (DH):**\n  * ${activeDrugsList.join('\n  * ')}`);
    } else {
      lines.push(`- **سوابق دارویی (DH):** مصرف داروی روتین خاصی را ذکر نمی‌کند.`);
    }
  }

  if (dhState.note) {
    lines.push(`- **توضیحات تکمیلی دارو:** ${normalizePersianClinicalText(dhState.note)}`);
  }
  if (dhState.systemGapNote) {
    lines.push(`- **سایر داروهای خارج از لیست:** ${normalizePersianClinicalText(dhState.systemGapNote)}`);
  }

  // AH
  const ahItems = (state.ah?.selected || []).map((item) => {
    if (typeof item === 'object') {
      return item.detail ? `${item.label} (${normalizePersianClinicalText(item.detail)})` : item.label;
    }
    return item;
  });
  const ahText = state.ah?.nkda
    ? 'سابقه حساسیت دارویی، غذایی، لاتکس یا ماده حاجب ندارد (NKDA).'
    : `${ahItems.join('، ')} ${state.ah?.note ? `(${normalizePersianClinicalText(state.ah.note)})` : ''}`.trim() || 'حساسیت دارویی یا غذایی خاصی ذکر نشد.';
  lines.push(`- **حساسیت‌ها (AH):** ${ahText}`);
  if (state.ah?.systemGapNote) {
    lines.push(`- **سایر حساسیت‌های خارج از لیست:** ${normalizePersianClinicalText(state.ah.systemGapNote)}`);
  }

  // SH (با پشتیبانی از دکمه‌های منفی بصری)
  const shState = state.sh || {};
  const shParts = [];
  if (demo.occupation) shParts.push(`شغل: ${normalizePersianClinicalText(demo.occupation)}`);

  if (shState.negSmoking) {
    shParts.push('عدم مصرف سیگار و دخانیات (Non-smoker)');
  } else if (shState.cigsPerDay && shState.yearsSmoked) {
    const packYear = ((Number(shState.cigsPerDay) / 20) * Number(shState.yearsSmoked)).toFixed(1);
    shParts.push(`مصرف سیگار به میزان ${shState.cigsPerDay} نخ/روز به مدت ${shState.yearsSmoked} سال (~${packYear} Pack-Year)`);
  } else {
    shParts.push('عدم مصرف سیگار');
  }

  if (shState.negOpium) {
    shParts.push('عدم مصرف تریاک یا سایر مواد مخدر (Denies substance use)');
  } else if (shState.opium) {
    shParts.push(`مصرف اپیوم/مواد: ${normalizePersianClinicalText(shState.opium)}`);
  } else {
    shParts.push('عدم مصرف اپیوم و مواد مخدر');
  }

  if (shState.negAlcohol) {
    shParts.push('عدم مصرف الکل (Denies alcohol use)');
  } else if (shState.alcohol) {
    shParts.push(`مصرف الکل: ${normalizePersianClinicalText(shState.alcohol)}`);
  }

  if (shState.note) shParts.push(normalizePersianClinicalText(shState.note));
  lines.push(`- **سوابق اجتماعی و عادات (SH):** ${shParts.join(' | ')}.`);
  if (state.sh?.systemGapNote) {
    lines.push(`- **سایر عادات و سوابق اجتماعی خارج از لیست:** ${normalizePersianClinicalText(state.sh.systemGapNote)}`);
  }

  // FH (سوابق خانوادگی ساختاریافته به تفکیک هر عضو خانواده)
  const fhState = state.fh || {};
  if (fhState.negFamilyHistory || fhState.masterNeg) {
    lines.push(`- **سوابق خانوادگی (FH):** سابقه بیماری خاص، سکته قلبی زودرس یا بدخیمی در بستگان درجه یک بیمار نفی می‌شود (Negative for familial malignancies or premature CAD).`);
  } else if (fhState.diseases && Array.isArray(fhState.diseases) && fhState.diseases.length > 0) {
    const fhList = fhState.diseases.map((d) => {
      const dTitle = d.diseaseLabel || d.name || d.label || 'بیماری';
      if (d.relatives && Array.isArray(d.relatives) && d.relatives.length > 0) {
        const hasObjectRels = d.relatives.some((r) => typeof r === 'object' && r !== null);
        if (hasObjectRels) {
          const relDescriptions = d.relatives.map((r) => {
            if (typeof r === 'object' && r !== null) {
              const relName = r.relation || 'بستگان';
              const vStr = r.vitalStatus === 'deceased' ? 'فوت‌شده' : 'در قید حیات';
              const rawNote = normalizePersianClinicalText(r.ageOrNote || '');
              return rawNote ? `${relName} (${vStr} — ${rawNote})` : `${relName} (${vStr})`;
            }
            return String(r);
          });
          return `سابقه ${dTitle} در ${relDescriptions.join(' و ')}`;
        }
        const rels = `در ${d.relatives.join(' و ')}`;
        const vit = (d.status === 'deceased' || d.isAlive === false) ? 'فوت‌شده در اثر این بیماری' : 'در قید حیات';
        const rawAge = normalizePersianClinicalText(d.ageNotes || d.ageNote || '');
        const vitDesc = rawAge ? (rawAge.includes('فوت') || rawAge.includes('حیات') ? rawAge : `${vit}، ${rawAge}`) : vit;
        return `سابقه ${dTitle} ${rels} (${vitDesc})`;
      }
      const vit = (d.status === 'deceased' || d.isAlive === false) ? 'فوت‌شده' : 'در قید حیات';
      const rawAge = normalizePersianClinicalText(d.ageNotes || d.ageNote || '');
      const vitDesc = rawAge ? `${vit} — ${rawAge}` : vit;
      return `سابقه ${dTitle} در بستگان (${vitDesc})`;
    });
    lines.push(`- **سوابق خانوادگی (FH):** ${fhList.join(' ؛ ')}.`);
  } else {
    const fhItems = (state.fh?.selected || []).map((item) => {
      if (typeof item === 'object') {
        return item.detail ? `${item.label} (${normalizePersianClinicalText(item.detail)})` : item.label;
      }
      return item;
    });
    const fhText = [
      ...(fhItems.length ? [fhItems.join('، ')] : []),
      ...(state.fh?.note ? [normalizePersianClinicalText(state.fh.note)] : [])
    ].join(' — ') || 'سابقه بدخیمی یا بیماری ارثی خاص در بستگان درجه یک ذکر نمی‌شود.';
    lines.push(`- **سوابق خانوادگی (FH):** ${fhText}`);
  }
  if (state.fh?.systemGapNote) {
    lines.push(`- **سایر سوابق خانوادگی خارج از لیست:** ${normalizePersianClinicalText(state.fh.systemGapNote)}`);
  }

  // ۵. بررسی سیستم‌ها (ROS) - دوزبانه و تفکیک‌شده بر اساس زیرسیستم با فیلتر جنسیت
  lines.push(`\n### ۵. بررسی سیستم‌ها (Review of Systems - ROS)`);
  if (state.ros?.unobtainable) {
    const reasonText = state.ros?.unobtainableReason || 'به علت شرایط حاد بالینی، کاهش سطح هوشیاری و اینتوباسیون بیمار، اخذ مرور سیستم‌های معمول امکان‌پذیر نبوده و ارزیابی بر پایه یافته‌های بالینی، معاینه فیزیکی و پروتکل ترومای ATLS متمرکز می‌باشد.';
    lines.push(`- **عدم امکان اخذ ROS:** ${reasonText}`);
  } else {
    const showAllGenders = state.ros?.showAllGenders || false;
  const patientGender = demo.gender || 'male';

  ROS_GROUPS_BILINGUAL.forEach((group) => {
    // اعمال فیلتر جنسیت برای آیتم‌ها
    const filteredItems = group.items.filter((item) => {
      if (showAllGenders || item.gender === 'all') return true;
      if (patientGender === 'female' && item.gender === 'female') return true;
      if (patientGender === 'male' && item.gender === 'male') return true;
      if (patientGender === 'other') return true;
      return false;
    });

    if (filteredItems.length === 0) return;

    const groupPos = [];
    const groupNeg = [];
    const totalItems = filteredItems.length;

    filteredItems.forEach((item) => {
      const itemData = state.ros?.items?.[item.id];
      const st = typeof itemData === 'object' ? itemData.state : itemData;
      const detail = typeof itemData === 'object' ? itemData.detail : '';
      if (st === 1 || st === '+1') {
        groupPos.push(detail && detail.trim() ? `${item.label} (${normalizePersianClinicalText(detail)})` : item.label);
      } else if (st === -1 || st === '-1') {
        groupNeg.push(item.label);
      }
    });

    if (groupPos.length > 0 && groupNeg.length > 0) {
      lines.push(`- **${group.group}:** **مثبت:** ${groupPos.join('، ')} | **منفی:** ${groupNeg.join('، ')}`);
    } else if (groupPos.length > 0) {
      lines.push(`- **${group.group}:** **مثبت:** ${groupPos.join('، ')}`);
    } else if (groupNeg.length > 0) {
      if (groupNeg.length === totalItems) {
        lines.push(`- **${group.group}:** بررسی کامل سیستم بدون نکته پاتولوژیک`);
      } else {
        lines.push(`- **${group.group}:** منفی از نظر ${groupNeg.join('، ')}`);
      }
    } else {
      lines.push(`- **${group.group}:** بررسی اجمالی بدون نکته پاتولوژیک`);
    }
  });

    const knownGroupItemIds = new Set(ROS_GROUPS_BILINGUAL.flatMap((g) => (g.items || []).map((i) => i.id)));
    const extraPos = [];
    const extraNeg = [];
    Object.entries(state.ros?.items || {}).forEach(([rId, val]) => {
      if (!knownGroupItemIds.has(rId)) {
        const st = typeof val === 'object' && val !== null ? val.state : val;
        const dt = typeof val === 'object' && val !== null && val.detail ? ` (${normalizePersianClinicalText(val.detail)})` : '';
        const lb = typeof val === 'object' && val !== null && val.label ? val.label : rId;
        if (st === 1 || st === '+1') extraPos.push(`${lb}${dt}`);
        else if (st === -1 || st === '-1') extraNeg.push(lb);
      }
    });
    if (extraPos.length > 0) {
      lines.push(`- **سایر علائم سیستمیک مثبت:** ${extraPos.join('، ')}`);
    }
    if (extraNeg.length > 0) {
      lines.push(`- **سایر علائم سیستمیک منفی:** ${extraNeg.join('، ')}`);
    }

    if (state.ros?.systemGapNote) {
      lines.push(`- **موارد خارج از لیست ROS:** ${normalizePersianClinicalText(state.ros.systemGapNote)}`);
    }
  }

  // ۶. معاینه فیزیکی (PE) با تفکیک ۴ رکن معاینه شکم و ماژول‌های Unlockable
  lines.push(`\n### ۶. معاینه فیزیکی (Physical Examination - PE)`);
  const v = state.pe?.vitals || {};
  lines.push(
    `- **علائم حیاتی (Vitals):** BP: ${v.bp || '—'} mmHg | PR: ${v.pr || '—'} /min | RR: ${v.rr || '—'} /min | T: ${v.temp || '—'} °C | SpO2: ${v.spo2 || '—'}% | وضعیت NPO: ${v.npo || 'نامشخص'}`
  );

  // ستون‌های ۱۲ گانه جامع معاینه فیزیکی
  lines.push(`- **معاینه فیزیکی سیستمیک (۱۲ ستون بالینی):**`);
  PE_MANDATORY_PILLARS.forEach((pillar) => {
    const secPos = [];
    const secNeg = [];

    pillar.items.forEach((item) => {
      const itemData = state.pe?.findings?.[item.id] || (state.pe?.abdomen && (state.pe.abdomen[pillar.id]?.[item.id] || state.pe.abdomen[item.id])) || state.pe?.[item.id];
      const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
      const detail = typeof itemData === 'object' && itemData !== null ? (itemData.detail || itemData.note || '') : '';
      const itemTitle = item.fa || item.label;
      if (st === 1 || st === '+1') {
        secPos.push(detail && detail.trim() ? `${itemTitle} (${normalizePersianClinicalText(detail)})` : itemTitle);
      } else if (st === -1 || st === '-1') {
        secNeg.push(itemTitle);
      }
    });

    if (secPos.length > 0 && secNeg.length > 0) {
      lines.push(`  * **${pillar.title}:** **مثبت:** ${secPos.join('، ')} | **منفی (رد شده):** عدم وجود ${secNeg.join('، ')}`);
    } else if (secPos.length > 0) {
      lines.push(`  * **${pillar.title}:** **مثبت:** ${secPos.join('، ')}`);
    } else if (secNeg.length > 0) {
      if (secNeg.length === pillar.items.length) {
        lines.push(`  * **${pillar.title}:** معاینه کامل بدون نکته پاتولوژیک`);
      } else {
        lines.push(`  * **${pillar.title}:** منفی از نظر ${secNeg.join('، ')}`);
      }
    } else {
      lines.push(`  * **${pillar.title}:** معاینه روتین بدون نکته پاتولوژیک`);
    }
  });

  // ماژول‌های معاینه Unlockable (صرفاً در صورت باز شدن چاپ می‌شوند)
  const unlockedExamModules = state.pe?.unlockedModules || [];
  PE_UNLOCKABLE_MODULES.forEach((mod) => {
    const isUnlocked = Array.isArray(unlockedExamModules)
      ? unlockedExamModules.includes(mod.id)
      : !!unlockedExamModules[mod.id];
    if (isUnlocked) {
      const modPos = [];
      const modNeg = [];

      mod.items.forEach((item) => {
        const itemData = state.pe?.findings?.[item.id] !== undefined
          ? state.pe?.findings?.[item.id]
          : (state.pe?.[mod.id]?.[item.id] !== undefined ? state.pe?.[mod.id]?.[item.id] : undefined);
        if (itemData !== undefined) {
          const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
          const detail = typeof itemData === 'object' && itemData !== null ? (itemData.detail || itemData.note || '') : '';
          if (st === 1 || st === '+1') {
            modPos.push(detail && detail.trim() ? `${item.label} (${normalizePersianClinicalText(detail)})` : item.label);
          } else if (st === -1 || st === '-1') {
            modNeg.push(item.label);
          }
        }
      });

      if (modPos.length > 0 && modNeg.length > 0) {
        lines.push(`- **${mod.title}:** **مثبت:** ${modPos.join('، ')} | **منفی:** ${modNeg.join('، ')}`);
      } else if (modPos.length > 0) {
        lines.push(`- **${mod.title}:** **مثبت:** ${modPos.join('، ')}`);
      } else if (modNeg.length > 0) {
        lines.push(`- **${mod.title}:** منفی از نظر ${modNeg.join('، ')}`);
      } else {
        lines.push(`- **${mod.title}:** معاینه اختصاصی انجام شد؛ فاقد یافته غیرطبیعی.`);
      }
    }
  });

  // ماژول معاینه موضعی توده و ضایعات (Local Mass & Lesion Exam)
  const massExamsFa = state.pe?.massExams || state.pe?.massExamList || [];
  if (massExamsFa.length > 0) {
    lines.push(`- **معاینه موضعی توده و ضایعات (Local Mass & Lesion Exam):**`);
    massExamsFa.forEach((m, idx) => {
      lines.push(
        `  * **توده/ضایعه #${idx + 1} (${m.location || 'موضع اشاره‌شده'}):** ابعاد: ${m.dimensions || 'نامشخص'} | قوام: ${m.consistency || 'نامشخص'} | حدود: ${m.margin || m.margins || 'نامشخص'} | تحرک: ${m.mobility || 'نامشخص'} | وضعیت پوست و تندرنس: ${m.skinSign || m.tendernessSkin || 'نرمال'} | توضیحات: ${m.note || m.neuroLymph || 'طبیعی'}`
      );
    });
  }

  // ماژول معاینه تروما و سوختگی (ATLS Trauma & Burn Exam - فقط در صورت فعال‌سازی صریح و ورود داده توسط کاربر)
  const atlsFa = state.pe?.atlsExam || {};
  const hasPrimarySurveyFa = Object.values(atlsFa.primarySurvey || {}).some(v => typeof v === 'string' ? v.trim().length > 0 : (Array.isArray(v) ? v.length > 0 : Boolean(v)));
  const hasWoundsFa = Array.isArray(atlsFa.wounds) && atlsFa.wounds.length > 0;
  const hasBurnFa = Boolean(atlsFa.burn && (atlsFa.burn.degree || atlsFa.burn.tbsa || atlsFa.burn.regions || (Array.isArray(atlsFa.burn.inhalationSigns) && atlsFa.burn.inhalationSigns.length > 0)));
  const hasAtlsExamFa = (atlsFa.active === true || atlsFa.enabled === true) && (hasPrimarySurveyFa || hasWoundsFa || hasBurnFa);

  if (hasAtlsExamFa) {
    lines.push(`- **ارزیابی اولیه ترومای جراحی (ATLS Primary Survey ABCDE):**`);
    if (hasPrimarySurveyFa) {
      const ps = atlsFa.primarySurvey || {};
      lines.push(`  * **ارزیابی اولیه (ABCDE):**`);
      if (ps.airway) lines.push(`    - A (Airway & C-Spine): ${ps.airway}`);
      if (ps.breathing) lines.push(`    - B (Breathing): ${ps.breathing}`);
      if (ps.circulation) lines.push(`    - C (Circulation): ${ps.circulation}`);
      if (ps.disability) lines.push(`    - D (Disability / GCS): ${ps.disability}`);
      if (ps.exposure) lines.push(`    - E (Exposure): ${ps.exposure}`);
    }

    if (hasWoundsFa) {
      lines.push(`  * **ثبت زخم‌ها و جراحات تروما (Wound & Injury Registry):**`);
      atlsFa.wounds.forEach((w, wIdx) => {
        lines.push(
          `    - جراحت #${wIdx + 1}: ${w.type || 'زخم'} در ${w.location || 'موضع'} (ابعاد: ${w.dimensions || '—'}) | وضعیت خونریزی: ${w.bleedingStatus || w.bleeding || '—'} | وضعیت عصبی-عروقی دیستال: ${w.distalNv || w.distalNV || 'طبیعی'}`
        );
      });
    }

    if (hasBurnFa) {
      let burnLine = `  * **بررسی سوختگی:** درجه: ${atlsFa.burn.degree || 'نامشخص'} | وسعت: ${atlsFa.burn.tbsa ? atlsFa.burn.tbsa + '% TBSA' : 'نامشخص'}`;
      if (atlsFa.burn.regions) burnLine += ` (نواحی درگیر: ${atlsFa.burn.regions})`;
      if (atlsFa.burn.inhalationSigns?.length) burnLine += ` | شواهد آسیب استنشاقی: ${atlsFa.burn.inhalationSigns.join('، ')}`;
      lines.push(burnLine);
    }
  }

  // سایر سیستم‌های جامع معاینه فیزیکی (فقط در صورت تایید نرمال، انتخاب تگ یا ثبت یافته درج می‌شوند)
  const compSystemsFa = state.pe?.comprehensiveSystems || {};
  const otherSystemsLines = [];
  PE_COMPREHENSIVE_SYSTEMS.filter((s) => !s.isPrioritySurgical).forEach((sys) => {
    const sysData = compSystemsFa[sys.id] || {};
    const hasNormal = !!sysData.isNormal;
    const hasExamined = !!sysData.examined;
    const tags = Array.isArray(sysData.selectedTags) ? sysData.selectedTags : [];
    const note = sysData.text ? normalizePersianClinicalText(sysData.text) : '';

    if (hasNormal && tags.length === 0 && !note) {
      otherSystemsLines.push(`  * **${sys.title}:** ${sys.normalBaseline || 'معاینه طبیعی و بدون نکته پاتولوژیک.'}`);
    } else if (tags.length > 0 || note || (hasExamined && !hasNormal)) {
      const parts = [];
      if (tags.length > 0) parts.push(`یافته‌ها: ${tags.join('، ')}`);
      if (note) parts.push(note);
      if (hasNormal) parts.push('(سایر جهات نرمال)');
      otherSystemsLines.push(`  * **${sys.title}:** ${parts.join(' — ')}`);
    }
  });
  if (otherSystemsLines.length > 0) {
    lines.push(`- **سایر سیستم‌های معاینه فیزیکی (Systemic Physical Exam):**`);
    lines.push(otherSystemsLines.join('\n'));
  }

  if (state.pe?.note) lines.push(`- **توضیحات تکمیلی معاینه:** ${normalizePersianClinicalText(state.pe.note)}`);
  if (state.pe?.systemGapNote) {
    lines.push(`- **یافته‌های خارج از لیست معاینه فیزیکی:** ${normalizePersianClinicalText(state.pe.systemGapNote)}`);
  }

  // ۷. پاراکلینیک، پنل‌های آزمایشگاهی ۶ گانه و گزارش‌های تصویربرداری
  lines.push(`\n### ۷. یافته‌های پاراکلینیک (آزمایشگاه و تصویربرداری)`);
  lines.push(`- **تصویربرداری و اقدامات تشخیصی (Diagnostic Imaging):**`);
  const modalities = state.paraclinics?.imagingReports || [];
  if (modalities.length > 0) {
    modalities.forEach((rep) => {
      const modalityName = rep.modality === 'efast' || rep.modalityId === 'efast' || rep.modalityLabel?.includes('eFAST') || rep.modalityTitle?.includes('eFAST') ? 'سونوگرافی اورژانس eFAST (تروما)'
        : rep.modality === 'US' || rep.modalityId === 'us' || rep.modalityLabel?.includes('US') ? 'سونوگرافی (US)'
        : rep.modality === 'CT' || rep.modalityId === 'ct' || rep.modalityLabel?.includes('CT') ? 'سی‌تی اسکن (CT)'
        : rep.modality === 'MRI_MRCP' || rep.modalityId === 'mri_mrcp' || rep.modalityLabel?.includes('MRI') ? 'MRI / MRCP'
        : rep.modality === 'CXR_AXR' || rep.modalityId === 'cxr_axr' || rep.modalityLabel?.includes('CXR') ? 'گرافی قفسه سینه / شکم (CXR / AXR)'
        : rep.modality === 'EGD' ? 'آندوسکوپی فوقانی (EGD)'
        : rep.modality === 'Colonoscopy' ? 'کولونوسکوپی (Colonoscopy)'
        : rep.modality === 'Laryngoscopy' ? 'لارنگوسکوپی (Laryngoscopy)'
        : rep.modality === 'Pathology_FNA' ? 'پاتولوژی و FNA'
        : (rep.modalityTitle || rep.modalityLabel || rep.modality || 'تصویربرداری');

      const tagStrings = (rep.findingChips || rep.tags || []).map((t) => {
        if (typeof t === 'object') {
          return t.detail ? `${t.label} (${normalizePersianClinicalText(t.detail)})` : t.label;
        }
        return t;
      });
      const tagStr = tagStrings.length ? `[${tagStrings.join('، ')}] ` : '';
      const content = rep.impression || rep.findings || rep.summary || '';
      lines.push(
        `  * **${modalityName}${rep.targetOrgan ? ` (${rep.targetOrgan})` : ''}${rep.date ? ` [${rep.date}]` : ''}:** ${tagStr}${normalizePersianClinicalText(content)}`
      );
    });
  } else {
    lines.push(`  * اقدام تصویربرداری اختصاصی ثبت نشده است.`);
  }

  lines.push(`\n- **آزمایش‌های تشخیصی (Laboratory Panels):**`);
  const labs = state.paraclinics?.labs || {};

  LAB_PANELS.forEach((panel) => {
    const panelTests = [];
    panel.tests.forEach((def) => {
      const val = labs[def.id];
      if (val !== undefined && val !== '' && val !== null) {
        const num = parseFloat(val);
        let flag = '';
        if (!isNaN(num)) {
          if (num > def.max) flag = ' ↑(H)';
          else if (num < def.min) flag = ' ↓(L)';
        }
        const unitStr = def.unit ? ` ${def.unit}` : '';
        panelTests.push(`${def.label}: ${val}${unitStr}${flag}`);
      }
    });

    if (panelTests.length > 0) {
      lines.push(`  * **${panel.title}:** ${panelTests.join(' | ')}`);
    }
  });

  // آزمایش‌های تکمیلی و تخصصی (EXTENDED_LAB_DATABASE)
  const addLabsFa = state.paraclinics?.additionalLabs || {};
  const addLabEntriesFa = Object.entries(addLabsFa).filter(([k, v]) => {
    if (!v) return false;
    if (typeof v === 'object') return v.value && String(v.value).trim();
    return String(v).trim();
  });
  if (addLabEntriesFa.length > 0) {
    const addParts = addLabEntriesFa.map(([k, v]) => {
      const val = typeof v === 'object' ? v.value : v;
      const unit = typeof v === 'object' && v.unit ? ` ${v.unit}` : '';
      const name = typeof v === 'object' && v.name ? v.name : k;
      return `${name}: ${val}${unit}`;
    });
    lines.push(`  * **سایر آزمایش‌های تکمیلی و تخصصی (Additional Labs):** ${addParts.join(' | ')}`);
  }

  if (state.paraclinics?.labNote) {
    lines.push(`- **سایر آزمایش‌ها (ABG / U/A / کشت):** ${normalizePersianClinicalText(state.paraclinics.labNote)}`);
  }

  if (state.paraclinics?.systemGapNote) {
    lines.push(`- **یافته‌های خارج از لیست پاراکلینیک:** ${normalizePersianClinicalText(state.paraclinics.systemGapNote)}`);
  }

  // ۸. بازنمایی مسئله و استدلال بالینی (حذف کامل SQs)
  lines.push(`\n### ۸. بازنمایی مسئله و استدلال بالینی (Problem Representation & DDx)`);
  if (state.reasoning?.problemRepresentation) {
    lines.push(`- **خلاصه بازنمایی مسئله (Problem Representation):** ${normalizePersianClinicalText(state.reasoning.problemRepresentation)}`);
  }
  if (state.reasoning?.ddx) {
    lines.push(`- **تشخیص‌های افتراقی (DDx) و پلن اولیه:** ${normalizePersianClinicalText(state.reasoning.ddx)}`);
  }

  return lines.join('\n');
}

/**
 * High-Yield Problem Representation Auto-Synthesizer with Comprehensive Abnormal Labs
 * (Free of Semantic Qualifiers)
 */
export function synthesizeProblemRepresentation(state) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  const d = state.demographics || {};
  const cc = state.cc || {};
  const hpi = state.hpi || {};

  if (lang === 'en') {
    const genderEn = d.gender === 'female' ? 'female' : d.gender === 'male' ? 'male' : 'patient';
    const ageEn = d.age ? `${d.age}-year-old` : 'Adult';
    const ptPrefix = genderEn === 'patient' ? `${ageEn} patient` : `${ageEn} ${genderEn}`;

    let mainComplaintEn = tLabel(cc.patientQuote) || 'acute surgical presentation';
    let durationEn = tLabel(hpi.duration) || 'recent onset';

    const presentations = (hpi.presentations && hpi.presentations.length > 0)
      ? hpi.presentations
      : (hpi.painList || []);

    const firstPres = presentations[0];
    if (firstPres) {
      if (firstPres.archetype === 'mass_lesion_archetype') {
        mainComplaintEn = `mass/lesion in the ${tLabel(firstPres.location) || 'specified region'}`;
        if (firstPres.discoveryTime) durationEn = tLabel(firstPres.discoveryTime);
      } else if (firstPres.archetype === 'trauma_burn_archetype') {
        mainComplaintEn = tLabel(firstPres.mechanism) || 'acute trauma';
        if (firstPres.injuredZones && firstPres.injuredZones.length > 0) {
          mainComplaintEn += ` involving ${firstPres.injuredZones.map((z) => tLabel(z)).join(' and ')}`;
        }
        if (firstPres.timeSinceInjury) durationEn = tLabel(firstPres.timeSinceInjury);
      } else if (firstPres.archetype === 'elective_asymptomatic_archetype') {
        mainComplaintEn = `elective surgical admission (${tLabel(firstPres.procedureName || firstPres.discoveryMethod) || 'planned workup'})`;
      } else if (firstPres.archetype === 'functional_bleeding_archetype') {
        mainComplaintEn = tLabel(firstPres.symptomTitle) || 'functional surgical complaint';
        if (firstPres.duration) durationEn = tLabel(firstPres.duration);
      } else {
        if (firstPres.selectedRegions && firstPres.selectedRegions.length > 0) {
          const regLabels = firstPres.selectedRegions.map((r) => tLabel(getRegionLabel(r)));
          mainComplaintEn += ` localized to ${regLabels.join(' and ')}`;
        }
        if (firstPres.duration) durationEn = tLabel(firstPres.duration);
      }
    }

    const posSymptomsEn = [];
    const negSymptomsEn = [];
    Object.entries(hpi.symptoms || {}).forEach(([symId, obj]) => {
      const st = typeof obj === 'object' ? obj.state : obj;
      const det = typeof obj === 'object' && obj.detail ? ` (${tLabel(obj.detail)})` : '';
      const label = findHpiSymptomLabel(symId, typeof obj === 'object' ? obj.label : symId);
      if (st === 1 || st === '+1') posSymptomsEn.push(`${label}${det}`);
      if (st === -1 || st === '-1') negSymptomsEn.push(label);
    });

    const partsEn = [];
    partsEn.push(`${ptPrefix} presenting with "${mainComplaintEn}" of ${durationEn} duration.`);
    if (posSymptomsEn.length > 0) {
      partsEn.push(`Key pertinent positives include ${posSymptomsEn.slice(0, 3).join(', ')}`);
    }
    if (negSymptomsEn.length > 0) {
      partsEn.push(`${posSymptomsEn.length > 0 ? 'in the absence of' : 'Denies'} ${negSymptomsEn.slice(0, 3).join(', ')}.`);
    } else if (posSymptomsEn.length > 0) {
      partsEn[partsEn.length - 1] += '.';
    }

    const labs = state.paraclinics?.labs || {};
    const labFindingsEn = [];
    const wbc = parseFloat(labs['wbc']);
    if (!isNaN(wbc)) {
      if (wbc > 11.0) labFindingsEn.push(`leukocytosis (WBC: ${wbc})`);
      else if (wbc < 4.0) labFindingsEn.push(`leukopenia (WBC: ${wbc})`);
    }
    const hb = parseFloat(labs['hb']);
    if (!isNaN(hb)) {
      const anemiaCutoff = d.gender === 'female' ? 12.0 : 13.0;
      if (hb < anemiaCutoff) labFindingsEn.push(`anemia (Hb: ${hb})`);
    }
    const crp = parseFloat(labs['crp']);
    const esr = parseFloat(labs['esr']);
    const inflammatoryEn = [];
    if (!isNaN(crp) && crp > 10) inflammatoryEn.push(`CRP: ${crp}`);
    if (!isNaN(esr) && esr > 20) inflammatoryEn.push(`ESR: ${esr}`);
    if (inflammatoryEn.length) labFindingsEn.push(`elevated inflammatory markers (${inflammatoryEn.join(', ')})`);
    const ddimer = parseFloat(labs['ddimer']);
    if (!isNaN(ddimer) && ddimer > 500) labFindingsEn.push(`elevated D-Dimer (${ddimer})`);
    const amylase = parseFloat(labs['amylase']);
    const lipase = parseFloat(labs['lipase']);
    if (!isNaN(amylase) && amylase > 110) labFindingsEn.push(`elevated Amylase (${amylase})`);
    if (!isNaN(lipase) && lipase > 140) labFindingsEn.push(`elevated Lipase (${lipase})`);
    const ast = parseFloat(labs['ast']);
    const alt = parseFloat(labs['alt']);
    const alp = parseFloat(labs['alp']);
    const lftsEn = [];
    if (!isNaN(ast) && ast > 40) lftsEn.push(`AST: ${ast}`);
    if (!isNaN(alt) && alt > 40) lftsEn.push(`ALT: ${alt}`);
    if (!isNaN(alp) && alp > 130) lftsEn.push(`ALP: ${alp}`);
    if (lftsEn.length) labFindingsEn.push(`deranged hepatobiliary enzymes (${lftsEn.join(', ')})`);
    const bili_t = parseFloat(labs['bili_t']);
    if (!isNaN(bili_t) && bili_t > 1.2) labFindingsEn.push(`hyperbilirubinemia (Total Bili: ${bili_t})`);
    const cr = parseFloat(labs['cr']);
    if (!isNaN(cr) && cr > 1.3) labFindingsEn.push(`elevated Creatinine (Cr: ${cr})`);
    const na = parseFloat(labs['na']);
    if (!isNaN(na)) {
      if (na < 135) labFindingsEn.push(`hyponatremia (Na: ${na})`);
      else if (na > 145) labFindingsEn.push(`hypernatremia (Na: ${na})`);
    }
    const k = parseFloat(labs['k']);
    if (!isNaN(k)) {
      if (k < 3.5) labFindingsEn.push(`hypokalemia (K: ${k})`);
      else if (k > 5.1) labFindingsEn.push(`hyperkalemia (K: ${k})`);
    }
    const ph = parseFloat(labs['ph']);
    const pco2 = parseFloat(labs['pco2']);
    if (!isNaN(ph)) {
      if (ph < 7.35) labFindingsEn.push(`acidosis (pH: ${ph})`);
      else if (ph > 7.45) {
        if (!isNaN(pco2) && pco2 < 35) labFindingsEn.push(`respiratory alkalosis (pH: ${ph})`);
        else labFindingsEn.push(`alkalosis (pH: ${ph})`);
      }
    }
    const lactate = parseFloat(labs['lactate']);
    if (!isNaN(lactate) && lactate > 2.2) labFindingsEn.push(`hyperlactatemia (Lactate: ${lactate})`);

    if (labFindingsEn.length > 0) {
      partsEn.push(`Notable laboratory abnormalities: ${labFindingsEn.join(', ')}.`);
    }
    return partsEn.join(' ');
  }

  const genderStr = d.gender === 'female' ? 'خانم' : d.gender === 'male' ? 'آقای' : 'بیمار';
  const ageStr = d.age ? `${d.age} ساله` : '[نامشخص]';

  let mainComplaint = cc.patientQuote || 'شکایت حاد جراحی';
  let durationStr = hpi.duration || 'مدت اخیر';

  const presentations = (hpi.presentations && hpi.presentations.length > 0)
    ? hpi.presentations
    : (hpi.painList || []);

  const firstPres = presentations[0];
  if (firstPres) {
    if (firstPres.archetype === 'mass_lesion_archetype') {
      mainComplaint = `توده/ضایعه در ناحیه ${firstPres.location || 'موضع اشاره‌شده'}`;
      if (firstPres.discoveryTime) durationStr = firstPres.discoveryTime;
    } else if (firstPres.archetype === 'trauma_burn_archetype') {
      mainComplaint = firstPres.mechanism || 'تروما و آسیب حاد';
      if (firstPres.injuredZones && firstPres.injuredZones.length > 0) {
        mainComplaint += ` در نواحی ${firstPres.injuredZones.join(' و ')}`;
      }
      if (firstPres.timeSinceInjury) durationStr = firstPres.timeSinceInjury;
    } else if (firstPres.archetype === 'elective_asymptomatic_archetype') {
      mainComplaint = `بستری الکتیو جراحی (${firstPres.discoveryMethod || 'بررسی‌های قبلی'})`;
    } else if (firstPres.archetype === 'functional_bleeding_archetype') {
      mainComplaint = firstPres.symptomTitle || 'شکایت عملکردی';
      if (firstPres.duration) durationStr = firstPres.duration;
    } else {
      // pain_archetype or legacy pain episode
      if (firstPres.selectedRegions && firstPres.selectedRegions.length > 0) {
        const regLabels = firstPres.selectedRegions.map(getRegionLabel);
        mainComplaint += ` در ناحیه ${regLabels.join(' و ')}`;
      }
      if (firstPres.duration) durationStr = firstPres.duration;
    }
  }

  // جمع‌آوری علائم مثبت و منفی
  const posSymptoms = [];
  const negSymptoms = [];
  Object.entries(hpi.symptoms || {}).forEach(([symId, obj]) => {
    const st = typeof obj === 'object' ? obj.state : obj;
    const det = typeof obj === 'object' && obj.detail ? ` (${obj.detail})` : '';
    const label = obj.label || symId;
    if (st === 1 || st === '+1') posSymptoms.push(`${label}${det}`);
    if (st === -1 || st === '-1') negSymptoms.push(label);
  });

  const parts = [];
  parts.push(`بیمار ${genderStr} ${ageStr}`);
  parts.push(`که با «${mainComplaint}» از ${durationStr} قبل مراجعه نموده است.`);

  if (posSymptoms.length > 0) {
    parts.push(`یافته‌های مثبت شاخص شامل ${posSymptoms.slice(0, 3).join('، ')}`);
  }
  if (negSymptoms.length > 0) {
    parts.push(`در غیاب ${negSymptoms.slice(0, 3).join('، ')} می‌باشد.`);
  }

  // آزمایش‌های غیرطبیعی شاخص
  const labs = state.paraclinics?.labs || {};
  const labFindings = [];

  const wbc = parseFloat(labs['wbc']);
  if (!isNaN(wbc)) {
    if (wbc > 11.0) labFindings.push(`لکوسیتوز WBC: ${wbc}`);
    else if (wbc < 4.0) labFindings.push(`لوکوپنی WBC: ${wbc}`);
  }

  const hb = parseFloat(labs['hb']);
  if (!isNaN(hb)) {
    const anemiaCutoff = d.gender === 'female' ? 12.0 : 13.0;
    if (hb < anemiaCutoff) labFindings.push(`آنمی Hb: ${hb}`);
  }

  const crp = parseFloat(labs['crp']);
  const esr = parseFloat(labs['esr']);
  const inflammatory = [];
  if (!isNaN(crp) && crp > 10) inflammatory.push(`CRP: ${crp}`);
  if (!isNaN(esr) && esr > 20) inflammatory.push(`ESR: ${esr}`);
  if (inflammatory.length) {
    labFindings.push(`افزایش مارکرهای التهابی ${inflammatory.join(' و ')}`);
  }

  const ddimer = parseFloat(labs['ddimer']);
  if (!isNaN(ddimer) && ddimer > 500) {
    labFindings.push(`افزایش D-Dimer: ${ddimer}`);
  }

  const amylase = parseFloat(labs['amylase']);
  const lipase = parseFloat(labs['lipase']);
  if (!isNaN(amylase) && amylase > 110) labFindings.push(`افزایش آمیلاز: ${amylase}`);
  if (!isNaN(lipase) && lipase > 140) labFindings.push(`افزایش لیپاز: ${lipase}`);

  const ast = parseFloat(labs['ast']);
  const alt = parseFloat(labs['alt']);
  const alp = parseFloat(labs['alp']);
  const lfts = [];
  if (!isNaN(ast) && ast > 40) lfts.push(`AST: ${ast}`);
  if (!isNaN(alt) && alt > 40) lfts.push(`ALT: ${alt}`);
  if (!isNaN(alp) && alp > 130) lfts.push(`ALP: ${alp}`);
  if (lfts.length) labFindings.push(`اختلال تست‌های کبدی/صفراوی (${lfts.join('، ')})`);

  const bili_t = parseFloat(labs['bili_t']);
  if (!isNaN(bili_t) && bili_t > 1.2) {
    labFindings.push(`هیپربیلی‌روبینمی Total Bili: ${bili_t}`);
  }

  const cr = parseFloat(labs['cr']);
  if (!isNaN(cr) && cr > 1.3) {
    labFindings.push(`افزایش کراتینین Cr: ${cr}`);
  }

  const na = parseFloat(labs['na']);
  if (!isNaN(na)) {
    if (na < 135) labFindings.push(`هیپوناترمی Na: ${na}`);
    else if (na > 145) labFindings.push(`هیپرناترمی Na: ${na}`);
  }

  const k = parseFloat(labs['k']);
  if (!isNaN(k)) {
    if (k < 3.5) labFindings.push(`هیپوکالمی K: ${k}`);
    else if (k > 5.1) labFindings.push(`هیپرکالمی K: ${k}`);
  }

  const ph = parseFloat(labs['ph']);
  const pco2 = parseFloat(labs['pco2']);
  if (!isNaN(ph)) {
    if (ph < 7.35) labFindings.push(`اسیدوز (pH: ${ph})`);
    else if (ph > 7.45) {
      if (!isNaN(pco2) && pco2 < 35) labFindings.push(`آلکالوز تنفسی (pH: ${ph})`);
      else labFindings.push(`آلکالوز (pH: ${ph})`);
    }
  }

  const lactate = parseFloat(labs['lactate']);
  if (!isNaN(lactate) && lactate > 2.2) {
    labFindings.push(`هیپرلاکتاتمی Lactate: ${lactate}`);
  }

  if (labFindings.length > 0) {
    parts.push(`(همراه با ${labFindings.join('، ')})`);
  }

  return parts.join(' ');
}

function synthesizeFocusedDailyPeLines(o, isEn) {
  const fpe = o.focusedPe;
  const examParts = [];

  if (fpe && typeof fpe === 'object') {
    const rowConfigs = isEn
      ? [
          { key: 'general', title: 'General & Hemodynamics' },
          { key: 'cardio', title: 'Cardiopulmonary' },
          { key: 'abdomen', title: 'Abdomen' },
          { key: 'wound', title: 'Wound & Dressing' },
          { key: 'extremities', title: 'Extremities & DVT' }
        ]
      : [
          { key: 'general', title: 'عمومی و همودینامیک' },
          { key: 'cardio', title: 'قلب و ریه' },
          { key: 'abdomen', title: 'شکم' },
          { key: 'wound', title: 'زخم و پانسمان' },
          { key: 'extremities', title: 'اندام‌ها و DVT' }
        ];

    rowConfigs.forEach(({ key, title }) => {
      const rowObj = fpe[key] || {};
      const pills = Array.isArray(rowObj.pills) ? rowObj.pills : [];
      const note = rowObj.note ? String(rowObj.note).trim() : '';
      const segs = [];
      if (pills.length > 0) {
        segs.push(isEn ? pills.map((p) => tLabel(p)).join(', ') : pills.join('، '));
      }
      if (note) {
        segs.push(isEn ? tLabel(note) : normalizePersianClinicalText(note));
      }
      if (segs.length > 0) {
        examParts.push(`**${title}:** ${segs.join(isEn ? '; ' : ' — ')}`);
      }
    });
  } else {
    if (o.generalAndCardioPulm) {
      examParts.push(isEn ? tLabel(o.generalAndCardioPulm) : normalizePersianClinicalText(o.generalAndCardioPulm));
    }
    if (o.abdomenExam) {
      examParts.push(isEn ? `**Abdomen:** ${tLabel(o.abdomenExam)}` : `**شکم:** ${normalizePersianClinicalText(o.abdomenExam)}`);
    }
    if (o.woundAndDressing) {
      examParts.push(isEn ? `**Wound & Dressing:** ${tLabel(o.woundAndDressing)}` : `**زخم و پانسمان:** ${normalizePersianClinicalText(o.woundAndDressing)}`);
    }
    if (o.extremitiesDvt) {
      examParts.push(isEn ? `**Extremities:** ${tLabel(o.extremitiesDvt)}` : `**اندام‌ها:** ${normalizePersianClinicalText(o.extremitiesDvt)}`);
    }
  }

  if (o.examNote && String(o.examNote).trim()) {
    examParts.push(isEn ? tLabel(o.examNote) : normalizePersianClinicalText(o.examNote));
  }

  return examParts;
}

/**
 * Pure English Daily Progress Note Generator (v1.2-Bilingual-CleanUI)
 */
export function generateEnglishSOAPNote(soapState, linkedCaseState = null) {
  const out = [];
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};
  const p = soapState.plan || {};

  const demo = linkedCaseState?.demographics || ctx;
  let subjectDesc = 'Patient';
  if (demo.gender === 'female') {
    subjectDesc = demo.age ? `${demo.age}-year-old female` : 'Female patient';
  } else if (demo.gender === 'male') {
    subjectDesc = demo.age ? `${demo.age}-year-old male` : 'Male patient';
  } else if (demo.age) {
    subjectDesc = `${demo.age}-year-old patient`;
  }
  const ageStr = demo.age ? `${demo.age} y/o` : '';
  const diagStr = tLabel(ctx.workingDiagnosis || linkedCaseState?.cc?.establishedDiagnosis || linkedCaseState?.cc?.patientQuote || 'Surgical Inpatient');
  const procStr = tLabel(ctx.procedureDone || '');
  const hdStr = ctx.hdNumber ? `HD #${ctx.hdNumber}` : '';
  const podStr = ctx.podNumber ? `${tLabel(ctx.podType) || 'POD'} #${ctx.podNumber}` : '';
  const timelineBadge = [hdStr, podStr].filter(Boolean).join(' | ');

  const wardStr = demo.ward ? ` | **Ward:** ${tLabel(demo.ward)}` : '';
  const bedStr = demo.bed ? ` | **Bed:** ${demo.bed}` : '';
  const dateDisplay = (soapState.dateStr && !/[\u0600-\u06FF\u06F0-\u06F9]/.test(soapState.dateStr))
    ? soapState.dateStr
    : new Date(soapState.timestamp || Date.now()).toLocaleDateString('en-US');

  if (demo.fullName || demo.ward || demo.bed) {
    out.push(`> **Patient ID:** ${tLabel(demo.fullName) || '—'} (${ageStr || '-'})${wardStr}${bedStr} | **Progress Date:** ${dateDisplay}`);
  }
  out.push(`### Daily Progress Note — SOAP`);
  out.push(
    `**Clinical Trajectory:** Patient (${subjectDesc}) | **Diagnosis:** ${diagStr}${procStr ? ` | **Procedure:** ${procStr}` : ''}${timelineBadge ? ` | **[ ${timelineBadge} ]**` : ''}\n`
  );

  // 1. S — Subjective
  out.push(`#### S — Subjective (24-Hour Patient Report & Symptoms)`);
  const sParts = [];
  if (s.overallTrend) sParts.push(`Overall 24-hr clinical course: **${tLabel(s.overallTrend)}**`);
  if (s.painStatus) sParts.push(`Pain: ${tLabel(s.painStatus)}${s.painDetail ? ` (${tLabel(s.painDetail)})` : ''}`);
  if (s.dietTolerance) sParts.push(`Oral intake / Diet: ${tLabel(s.dietTolerance)}`);

  const bowelParts = [];
  if (s.flatus === 1) bowelParts.push('Flatus passed (+)');
  else if (s.flatus === -1) bowelParts.push('No flatus passed (−)');
  if (s.bowelMovement === 1) bowelParts.push(`Bowel movement (+) [${tLabel(s.bowelDetail) || 'normal'}]`);
  else if (s.bowelMovement === -1) bowelParts.push('No bowel movement (−)');
  if (bowelParts.length > 0) sParts.push(`Gastrointestinal function: ${bowelParts.join(', ')}`);

  if (s.ambulation) sParts.push(`Ambulation: ${tLabel(s.ambulation)}`);

  const OVERNIGHT_LABELS_EN = {
    nausea_vomiting: 'Nausea / Vomiting',
    fever_chills: 'Fever / Chills',
    cold_sweats: 'Cold Sweats',
    dyspnea_cp: 'Dyspnea / Chest Pain',
    dysuria_voiding: 'Dysuria / Urinary retention'
  };

  const posOvernight = [];
  const negOvernight = [];
  const symMap = s.symptoms || s.overnightSymptoms || {};
  const symDetails = s.symptomDetails || {};
  Object.entries(symMap).forEach(([k, val]) => {
    const st = typeof val === 'object' ? val.state : val;
    const lbl = OVERNIGHT_LABELS_EN[k] || tLabel(typeof val === 'object' ? val.label : k);
    const rawDet = (typeof val === 'object' && val.detail) ? val.detail : (symDetails[k] || '');
    const det = rawDet ? ` (${tLabel(rawDet)})` : '';
    if (st === 1 || st === '+1') posOvernight.push(`${lbl}${det}`);
    if (st === -1 || st === '-1') negOvernight.push(lbl);
  });

  if (Array.isArray(s.customSymptoms)) {
    s.customSymptoms.forEach((cs) => {
      const lbl = tLabel(cs.label || cs.id);
      const det = cs.detail ? ` (${tLabel(cs.detail)})` : '';
      if (cs.status === 1 || cs.status === '+1') posOvernight.push(`${lbl}${det}`);
      else if (cs.status === -1 || cs.status === '-1') negOvernight.push(lbl);
    });
  }

  if (posOvernight.length > 0) sParts.push(`Active overnight symptoms: ${posOvernight.join(', ')}`);
  if (negOvernight.length > 0) sParts.push(`Denies ${negOvernight.join(', ')}`);
  if (s.narrativeNote) sParts.push(tLabel(s.narrativeNote));

  out.push(`- ${sParts.join(' | ') || 'Patient reports no new acute complaints or distress over the past 24 hours.'}.\n`);

  // 2. O — Objective
  out.push(`#### O — Objective (Vitals, Fluid Balance, Focused PE & Paraclinics)`);
  const v = o.vitals || {};
  const vitalTokens = [];
  if (v.bp) vitalTokens.push(`BP: ${v.bp} mmHg`);
  if (v.pr) vitalTokens.push(`PR: ${v.pr} /min`);
  if (v.rr) vitalTokens.push(`RR: ${v.rr} /min`);
  if (v.temp) vitalTokens.push(`T: ${v.temp} °C`);
  if (v.tmax) vitalTokens.push(`Tmax (24h): ${v.tmax} °C`);
  if (v.spo2) vitalTokens.push(`SpO2: ${v.spo2}%`);
  out.push(`- **Vital Signs:** ${vitalTokens.join(' | ') || 'Pending'} ${v.hemodynamics ? `(${tLabel(v.hemodynamics)})` : ''}`);

  const ioObj = o.io || o;
  const ioTokens = [];
  if (ioObj.intake24h || o.intake24h) ioTokens.push(`24-hr Intake: ${ioObj.intake24h || o.intake24h} mL`);
  if (ioObj.urineStatus) ioTokens.push(`Voiding: ${tLabel(ioObj.urineStatus)}`);
  if (ioObj.urineOutput24h || o.urineOutput24h) ioTokens.push(`Urine Output: ${ioObj.urineOutput24h || o.urineOutput24h} mL`);
  if (ioObj.ngtOutput24h || o.ngtOutput24h) ioTokens.push(`NGT Output: ${tLabel(ioObj.ngtOutput24h || o.ngtOutput24h)}`);
  if (ioTokens.length > 0) {
    out.push(`- **Fluid Balance & Tubes (I/O):** ${ioTokens.join(' | ')}`);
  }

  if (o.drains && o.drains.length > 0) {
    const drainStrings = o.drains.map(
      (d, idx) => `Drain #${idx + 1} (${tLabel(d.typeAndSite) || 'Surgical'}): 24-hr output **${d.volumeCc || '—'} mL**, character **${tLabel(d.character) || 'Serous'}**`
    );
    out.push(`- **Surgical Drains:** ${drainStrings.join('; ')}`);
  }

  const examParts = synthesizeFocusedDailyPeLines(o, true);
  if (examParts.length > 0) {
    out.push(`- **Focused Daily Physical Exam:** ${examParts.join(' | ')}.`);
  }

  const prevLabs = linkedCaseState?.paraclinics?.labs || o.previousBaselineLabs || {};
  const todayLabStrings = [];
  Object.entries(o.labs || {}).forEach(([labId, val]) => {
    if (val !== undefined && val !== '') {
      const prevVal = prevLabs[labId];
      let trendStr = '';
      if (prevVal !== undefined && prevVal !== '' && String(prevVal) !== String(val)) {
        const nNow = parseFloat(val);
        const nPrev = parseFloat(prevVal);
        const arrow = !isNaN(nNow) && !isNaN(nPrev) ? (nNow > nPrev ? '↑' : '↓') : '';
        trendStr = ` (prior: ${prevVal}${arrow})`;
      }
      todayLabStrings.push(`${labId.toUpperCase()}: **${val}**${trendStr}`);
    }
  });
  if (todayLabStrings.length > 0) {
    out.push(`- **Today's Laboratory Studies & Trends:** ${todayLabStrings.join(' | ')}`);
  }
  if (o.newParaclinicNote) {
    out.push(`- **New Imaging / Diagnostics / Consults:** ${tLabel(o.newParaclinicNote)}`);
  }

  // 3. A — Assessment
  out.push(`\n#### A — Assessment (Today's Clinical Synthesis)`);
  const hasPersianInSummary = a.summaryText && /[\u0600-\u06FF]/.test(a.summaryText);
  const autoAssessment = (a.summaryText && !hasPersianInSummary)
    ? tLabel(a.summaryText)
    : `Patient (${subjectDesc}) admitted for ${diagStr}${procStr ? `, s/p ${procStr}` : ''}${timelineBadge ? ` (${timelineBadge})` : ''}; currently clinically and hemodynamically ${tLabel(v.hemodynamics) || 'stable'}, demonstrating an ${tLabel(a.clinicalStatus) || 'improving and stable'} clinical trajectory.`;
  out.push(`- ${autoAssessment}\n`);

  // 4. P — Plan
  out.push(`#### P — Plan (Daily Surgical Plan & Orders)`);
  const planItems = [];
  (p.selectedTags || []).forEach(tag => planItems.push(tLabel(tag)));
  if (p.customPlanText) {
    p.customPlanText.split('\n').filter(Boolean).forEach((line) => planItems.push(tLabel(line)));
  }
  if (planItems.length > 0) {
    planItems.forEach((item, i) => {
      out.push(`${i + 1}. ${item}`);
    });
  } else {
    out.push(`1. Continue ongoing medical management, vital sign monitoring, and strict fluid balance tracking.`);
  }

  return out.join('\n');
}

/**
 * Generates Daily Progress Note according to SOAP standard
 * v1.2-Bilingual-CleanUI
 */
export function generateSOAPProgressNote(soapState, linkedCaseState = null) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  if (lang === 'en') {
    return generateEnglishSOAPNote(soapState, linkedCaseState);
  }

  const out = [];
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};
  const p = soapState.plan || {};

  // استخراج اطلاعات پایه از پرونده متصل یا هدر مستقل
  const demo = linkedCaseState?.demographics || ctx;
  const genderWord = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقای' : '';
  const ageStr = demo.age ? `${demo.age} ساله` : '';
  const ptIntro = ['بیمار', genderWord, ageStr].filter(Boolean).join(' ');
  const diagStr = normalizePersianClinicalText(ctx.workingDiagnosis || linkedCaseState?.cc?.establishedDiagnosis || linkedCaseState?.cc?.patientQuote || 'بستری در بخش جراحی');
  const procStr = normalizePersianClinicalText(ctx.procedureDone || '');
  const hdStr = ctx.hdNumber ? `HD #${ctx.hdNumber}` : '';
  const podStr = ctx.podNumber ? `${ctx.podType || 'POD'} #${ctx.podNumber}` : '';
  const timelineBadge = [hdStr, podStr].filter(Boolean).join(' | ');

  // 1. Header (فقط در نمایش محلی نام بیمار چاپ شود)
  const wardStr = demo.ward ? ` | **بخش:** ${demo.ward}` : '';
  const bedStr = demo.bed ? ` | **تخت:** ${demo.bed}` : '';
  if (demo.fullName || demo.ward || demo.bed) {
    out.push(`> **بیمار:** ${demo.fullName || '—'} (${ageStr || '-'})${wardStr}${bedStr} | **تاریخ و ساعت ثبت پراگرس:** ${soapState.dateStr || new Date().toLocaleDateString('fa-IR')}`);
  }
  out.push(`### یادداشت سیر روزانه بیماری (Daily Progress Note — SOAP)`);
  out.push(
    `**مشخصات سیر و روز بستری (HD / POD):** ${ptIntro} | **تشخیص:** ${diagStr}${procStr ? ` | **عمل/پروسیجر:** ${procStr}` : ''}${timelineBadge ? ` | **[ ${timelineBadge} ]**` : ''}\n`
  );

  // 2. S — Subjective (Bug 6: استاندارد بیمارستانی ایران)
  out.push(`#### S — Subjective (گزارش بیمار و علائم ۲۴ ساعت اخیر)`);
  const sParts = [];
  if (s.overallTrend) sParts.push(`در ۲۴ ساعت گذشته، بیمار از نظر بالینی **${s.overallTrend}** داشته است`);
  if (s.painStatus) sParts.push(`وضعیت درد: ${normalizePersianClinicalText(s.painStatus)}${s.painDetail ? ` (${normalizePersianClinicalText(s.painDetail)})` : ''}`);
  if (s.dietTolerance) sParts.push(`وضعیت تغذیه: ${s.dietTolerance}`);

  const bowelParts = [];
  if (s.flatus === 1) bowelParts.push('دفع گاز برقرار است (+)');
  else if (s.flatus === -1) bowelParts.push('دفع گاز نداشته است (−)');
  if (s.bowelMovement === 1) bowelParts.push(`دفع مدفوع داشته است (+)${s.bowelDetail ? ` [${normalizePersianClinicalText(s.bowelDetail)}]` : ''}`);
  else if (s.bowelMovement === -1) bowelParts.push('دفع مدفوع نداشته است (−)');
  if (bowelParts.length > 0) sParts.push(`عملکرد روده: ${bowelParts.join('، ')}`);

  if (s.ambulation) sParts.push(`وضعیت حرکتی: ${s.ambulation}`);

  const OVERNIGHT_SYMPTOM_LABELS = {
    nausea_vomiting: 'تهوع و استفراغ',
    fever_chills: 'تب و لرز',
    cold_sweats: 'عرق سرد (Cold Sweats)',
    dyspnea_cp: 'تنگی نفس / درد قفسه سینه',
    dysuria_voiding: 'سوزش یا احتباس ادراری'
  };

  const posOvernight = [];
  const negOvernight = [];
  const symMap = s.symptoms || s.overnightSymptoms || {};
  const symDetails = s.symptomDetails || {};
  Object.entries(symMap).forEach(([k, val]) => {
    const st = typeof val === 'object' ? val.state : val;
    const lbl = (typeof val === 'object' && val.label) ? val.label : (OVERNIGHT_SYMPTOM_LABELS[k] || k);
    const rawDet = (typeof val === 'object' && val.detail) ? val.detail : (symDetails[k] || '');
    const det = rawDet ? ` (${normalizePersianClinicalText(rawDet)})` : '';
    if (st === 1 || st === '+1') posOvernight.push(`${lbl}${det}`);
    if (st === -1 || st === '-1') negOvernight.push(lbl);
  });

  if (Array.isArray(s.customSymptoms)) {
    s.customSymptoms.forEach((cs) => {
      const lbl = cs.label || cs.id;
      const det = cs.detail ? ` (${normalizePersianClinicalText(cs.detail)})` : '';
      if (cs.status === 1 || cs.status === '+1') posOvernight.push(`${lbl}${det}`);
      else if (cs.status === -1 || cs.status === '-1') negOvernight.push(lbl);
    });
  }

  if (posOvernight.length > 0) sParts.push(`شکایات مثبت شبانه‌روز اخیر: ${posOvernight.join('، ')}`);
  if (negOvernight.length > 0) sParts.push(`عدم وجود ${negOvernight.join('، ')}`);
  if (s.narrativeNote) sParts.push(normalizePersianClinicalText(s.narrativeNote));

  out.push(`- ${sParts.join(' | ') || 'بیمار در ۲۴ ساعت گذشته شکایت حاد جدیدی نداشته است.'}.\n`);

  // 3. O — Objective (Bug 6: استاندارد بیمارستانی ایران — حذف کامل کلمه «عینی»)
  out.push(`#### O — Objective (علائم حیاتی، بیلان، معاینه و پاراکلینیک)`);
  const v = o.vitals || {};
  const vitalTokens = [];
  if (v.bp) vitalTokens.push(`BP: ${v.bp} mmHg`);
  if (v.pr) vitalTokens.push(`PR: ${v.pr} /min`);
  if (v.rr) vitalTokens.push(`RR: ${v.rr} /min`);
  if (v.temp) vitalTokens.push(`T: ${v.temp} °C`);
  if (v.tmax) vitalTokens.push(`Tmax (24h): ${v.tmax} °C`);
  if (v.spo2) vitalTokens.push(`SpO2: ${v.spo2}%`);
  out.push(`- **علائم حیاتی (Vitals):** ${vitalTokens.join(' | ') || 'ثبت نشده'} ${v.hemodynamics ? `(${v.hemodynamics})` : ''}`);

  // I/O & Drains
  const ioObj = o.io || o;
  const ioTokens = [];
  if (ioObj.intake24h || o.intake24h) ioTokens.push(`جذب ۲۴ ساعته (Intake): ${ioObj.intake24h || o.intake24h} cc`);
  if (ioObj.urineStatus) ioTokens.push(`وضعیت ادراری: ${ioObj.urineStatus}`);
  if (ioObj.urineOutput24h || o.urineOutput24h) ioTokens.push(`برون‌ده ادراری (Urine Output): ${ioObj.urineOutput24h || o.urineOutput24h} cc`);
  if (ioObj.ngtOutput24h || o.ngtOutput24h) ioTokens.push(`برون‌ده NGT: ${ioObj.ngtOutput24h || o.ngtOutput24h}`);
  if (ioTokens.length > 0) {
    out.push(`- **بیلان مایعات و لوله‌ها (I/O & Tubes):** ${ioTokens.join(' | ')}`);
  }

  if (o.drains && o.drains.length > 0) {
    const drainStrings = o.drains.map(
      (d, idx) => `درن #${idx + 1} (${d.typeAndSite || 'جراحی'}): حجم ۲۴ ساعته **${d.volumeCc || '—'} cc** با ماهیت **${d.character || 'سروزی'}**`
    );
    out.push(`- **وضعیت درن‌ها (Surgical Drains):** ${drainStrings.join(' ؛ ')}`);
  }

  // Focused Daily Physical Exam (5-Row Capsule Matrix + Legacy Fallback)
  const examParts = synthesizeFocusedDailyPeLines(o, false);
  if (examParts.length > 0) {
    out.push(`- **معاینه فیزیکی متمرکز امروز (Focused Daily PE):** ${examParts.join(' | ')}.`);
  }

  // Labs with Trend comparison
  const prevLabs = linkedCaseState?.paraclinics?.labs || o.previousBaselineLabs || {};
  const todayLabStrings = [];
  Object.entries(o.labs || {}).forEach(([labId, val]) => {
    if (val !== undefined && val !== '') {
      const prevVal = prevLabs[labId];
      let trendStr = '';
      if (prevVal !== undefined && prevVal !== '' && String(prevVal) !== String(val)) {
        const nNow = parseFloat(val);
        const nPrev = parseFloat(prevVal);
        const arrow = !isNaN(nNow) && !isNaN(nPrev) ? (nNow > nPrev ? '↑' : '↓') : '';
        trendStr = ` (قبلی: ${prevVal}${arrow})`;
      }
      todayLabStrings.push(`${labId.toUpperCase()}: **${val}**${trendStr}`);
    }
  });
  if (todayLabStrings.length > 0) {
    out.push(`- **آزمایش‌های جدید امروز (Today's Labs & Trends):** ${todayLabStrings.join(' | ')}`);
  }
  if (o.newParaclinicNote) {
    out.push(`- **تصویربرداری / کشت / مشاوره جدید امروز:** ${normalizePersianClinicalText(o.newParaclinicNote)}`);
  }

  // 4. A — Assessment
  out.push(`\n#### A — Assessment (ارزیابی بالینی امروز)`);
  const autoAssessment = a.summaryText
    ? normalizePersianClinicalText(a.summaryText)
    : `${ptIntro} با تشخیص ${diagStr}${procStr ? `، پس از ${procStr}` : ''}${timelineBadge ? ` (${timelineBadge})` : ''}؛ در حال حاضر وضعیت عمومی و همودینامیک ${v.hemodynamics || 'پایدار'} داشته و در سیر ${a.clinicalStatus || 'بهبودی و پیگیری'} قرار دارد.`;
  out.push(`- ${autoAssessment}\n`);

  // 5. P — Plan
  out.push(`#### P — Plan (پلن درمانی و دستورات)`);
  const planItems = [...(p.selectedTags || [])];
  if (p.customPlanText) {
    p.customPlanText.split('\n').filter(Boolean).forEach((line) => planItems.push(normalizePersianClinicalText(line)));
  }
  if (planItems.length > 0) {
    planItems.forEach((item, i) => {
      out.push(`${i + 1}. ${item}`);
    });
  } else {
    out.push(`1. ادامه اقدامات درمانی و پایش علائم حیاتی و بیلان مایعات.`);
  }

  return out.join('\n');
}

function formatAtlsValue(val, isEn) {
  if (!val) return '';
  if (Array.isArray(val)) {
    const cleaned = val.filter(Boolean).map((item) => (isEn ? tLabel(item) : item));
    return cleaned.join(isEn ? ', ' : ' ، ');
  }
  return isEn ? tLabel(val) : String(val);
}

function synthesizeAtlsHeadToToeLines(sec, isEn) {
  const caps = sec.headToToeCapsules || {};
  const regions = isEn
    ? [
        { capKey: 'headFace', noteKey: 'headFace', title: 'Head & Maxillofacial' },
        { capKey: 'neck', noteKey: 'neck', title: 'Neck & Cervical Spine' },
        { capKey: 'chest', noteKey: 'chest', title: 'Chest & Thorax' },
        { capKey: 'abdomenPelvis', noteKey: 'abdomenPelvis', title: 'Abdomen & Pelvis' },
        { capKey: 'perineumBack', noteKey: 'perineumDre', title: 'Perineum, Back & DRE' },
        { capKey: 'extremities', noteKey: 'extremitiesNeuro', title: 'Extremities & Distal Neurovascular' }
      ]
    : [
        { capKey: 'headFace', noteKey: 'headFace', title: 'سر، فک و صورت' },
        { capKey: 'neck', noteKey: 'neck', title: 'گردن و ستون فقرات گردنی' },
        { capKey: 'chest', noteKey: 'chest', title: 'قفسه سینه' },
        { capKey: 'abdomenPelvis', noteKey: 'abdomenPelvis', title: 'شکم و لگن' },
        { capKey: 'perineumBack', noteKey: 'perineumDre', title: 'پرینه، پشت و DRE' },
        { capKey: 'extremities', noteKey: 'extremitiesNeuro', title: 'اندام‌ها و نوروواسکولار دیستال' }
      ];

  const lines = [];
  regions.forEach(({ capKey, noteKey, title }) => {
    const pillArr = Array.isArray(caps[capKey]) ? caps[capKey].filter(Boolean) : [];
    const noteText = sec[noteKey] ? String(sec[noteKey]).trim() : '';
    const segs = [];
    if (pillArr.length > 0) {
      segs.push(isEn ? pillArr.map((p) => tLabel(p)).join(', ') : pillArr.join('، '));
    }
    if (noteText) {
      segs.push(isEn ? tLabel(noteText) : normalizePersianClinicalText(noteText));
    }
    if (segs.length > 0) {
      lines.push(`**${title}:** ${segs.join(isEn ? '; ' : ' — ')}`);
    }
  });
  return lines;
}

/**
 * Pure English Emergency ATLS Trauma Resuscitation Note Generator (v1.2-Bilingual-CleanUI)
 */
export function generateEnglishATLSNote(atlsState = {}, clinicalState = null) {
  const out = [];
  const mist = atlsState.mist || {};
  const pri = atlsState.primary || {};
  const vit = pri.vitals || {};
  const ample = atlsState.ample || {};
  const sec = atlsState.secondary || {};
  const demo = clinicalState?.demographics || {};

  let subjectDesc = 'Patient';
  if (demo.gender === 'female') {
    subjectDesc = demo.age ? `${demo.age} y/o Female` : 'Female';
  } else if (demo.gender === 'male') {
    subjectDesc = demo.age ? `${demo.age} y/o Male` : 'Male';
  } else if (demo.age) {
    subjectDesc = `${demo.age} y/o Patient`;
  }
  const ageStr = demo.age ? `${demo.age} y/o` : '';
  const wardStr = demo.ward ? ` | **Ward:** ${tLabel(demo.ward)}` : '';
  const bedStr = demo.bed ? ` | **Bed:** ${demo.bed}` : '';

  if (demo.fullName || demo.ward || demo.bed) {
    out.push(`> **Trauma Patient:** ${tLabel(demo.fullName) || '—'} (${ageStr || '-'})${wardStr}${bedStr} | **Record #:** ${tLabel(demo.recordNumber) || 'Trauma Bay'}`);
  }

  out.push(`### Emergency ATLS Trauma Resuscitation Note`);
  out.push(
    `**Patient Profile:** ${subjectDesc} | **Arrival Mode:** ${tLabel(mist.arrivalMode) || 'EMS Ambulance (115)'} | **Time of Incident:** ${tLabel(mist.incidentTime) || 'Unspecified'}\n`
  );

  // 1. Primary Survey (ABCDE)
  out.push(`#### 1. Primary Survey (ABCDE) & Resuscitation Vitals`);
  const gcsTotal = vit.gcsTotal || ((Number(vit.gcsE) || 4) + (Number(vit.gcsV) || 5) + (Number(vit.gcsM) || 6));
  const gcsBreakdown = `GCS: **${gcsTotal}/15** (E${vit.gcsE || 4} V${vit.gcsV || 5} M${vit.gcsM || 6})`;
  const vTokens = [
    vit.bp ? `BP: **${vit.bp}** mmHg` : '',
    vit.pr ? `PR: **${vit.pr}** /min` : '',
    vit.rr ? `RR: **${vit.rr}** /min` : '',
    vit.spo2 ? `SpO2: **${vit.spo2}%**` : '',
    vit.temp ? `T: **${vit.temp}** °C` : '',
    gcsBreakdown
  ].filter(Boolean);
  out.push(`- **Resuscitation Vitals:** ${vTokens.join(' | ')}`);
  out.push(`- **A — Airway & C-Spine Protection:** ${formatAtlsValue(pri.airway, true) || 'Airway Patent & C-Spine Immobilized'}`);
  out.push(`- **B — Breathing & Ventilation:** ${formatAtlsValue(pri.breathing, true) || 'Symmetric Chest Wall Expansion & Clear Bilateral Breath Sounds'}`);
  out.push(`- **C — Circulation & Hemorrhage Control:** ${formatAtlsValue(pri.circulation, true) || 'Hemodynamically Stable, Full & Symmetric Pulses'}`);
  const disText = formatAtlsValue(pri.disability || pri.disabilityPupils, true) || 'Pupils Equal, Round & Reactive to Light (PERRLA), No Focal Deficit';
  out.push(`- **D — Disability & Neurological Status:** ${gcsBreakdown} | ${disText}`);
  out.push(`- **E — Exposure & Hypothermia Prevention:** ${formatAtlsValue(pri.exposure, true) || 'Full Exposure & Inline Log-Roll Performed; Hypothermia Prevention Applied'}\n`);

  // 2. MIST & AMPLE
  out.push(`#### 2. Mechanism, Prehospital Handover (MIST) & Rapid AMPLE History`);
  const mechs = Array.isArray(mist.mechanisms) && mist.mechanisms.length > 0
    ? mist.mechanisms.map((m) => tLabel(m)).join(', ')
    : 'Acute Trauma (Mechanism under evaluation)';
  out.push(`- **M — Mechanism of Injury:** ${mechs}`);
  if (mist.mechanismDetail) {
    out.push(`- **I/S — Injury & Scene Description:** ${tLabel(mist.mechanismDetail)}`);
  }
  const preHospList = Array.isArray(mist.prehospitalActions) && mist.prehospitalActions.length > 0
    ? mist.prehospitalActions
    : (Array.isArray(mist.prehospitalCare) ? mist.prehospitalCare : []);
  const preHosp = preHospList.length > 0
    ? preHospList.map((t) => tLabel(t)).join(', ')
    : 'No invasive prehospital interventions';
  out.push(`- **T — Prehospital Interventions:** ${preHosp}`);
  out.push(`- **A (Allergies):** ${tLabel(ample.allergies) || 'No Known Drug Allergies (NKDA)'}`);
  out.push(`- **M (Medications):** ${tLabel(ample.medications) || 'No Regular Medications or Anticoagulants'}`);
  out.push(`- **P (Past Illnesses / Pregnancy):** ${tLabel(ample.pastHistory) || 'No Significant Past Medical or Surgical History'}`);
  out.push(`- **L (Last Meal / NPO Status):** ${tLabel(ample.lastMeal) || 'Unspecified'}`);
  out.push(`- **E (Events / Tetanus):** ${tLabel(ample.eventsTetanus) || 'Evaluate & Administer Tetanus Prophylaxis if Indicated'}\n`);

  // 3. Secondary Survey, Injuries & Burn
  out.push(`#### 3. Head-to-Toe Secondary Survey, Injury Registry & Burn Assessment`);
  const h2tEn = synthesizeAtlsHeadToToeLines(sec, true);
  if (h2tEn.length > 0) {
    out.push(`- **Head-to-Toe Secondary Examination:**\n  * ${h2tEn.join('\n  * ')}`);
  }

  if (Array.isArray(sec.injuries) && sec.injuries.length > 0) {
    out.push(`- **Localized Trauma & Wound Registry:**`);
    sec.injuries.forEach((inj, idx) => {
      const nvVal = inj.neurovascular || inj.distalNv || '';
      const siteVal = inj.site || inj.location || '';
      const parts = [
        inj.type ? `Type: **${tLabel(inj.type)}**` : '',
        siteVal ? `Site: **${tLabel(siteVal)}**` : '',
        inj.dimensions ? `Dimensions: ${tLabel(inj.dimensions)}` : '',
        inj.bleeding ? `Bleeding: ${tLabel(inj.bleeding)}` : '',
        nvVal ? `Distal NV: **${tLabel(nvVal)}**` : ''
      ].filter(Boolean);
      out.push(`  * #${idx + 1}: ${parts.join(' | ')}`);
    });
  } else {
    out.push(`- **Localized Wound Registry:** No active open penetrating wound or laceration recorded.`);
  }

  if (sec.burnActive) {
    const bDeg = tLabel(sec.burnDegree) || 'Partial-Thickness (2nd Degree)';
    const bTbsa = sec.burnTbsa ? `${tLabel(sec.burnTbsa).replace(/%$/, '')}% TBSA` : 'Unspecified % TBSA';
    const bInh = tLabel(sec.burnInhalation) || 'No clinical signs of inhalation injury';
    out.push(`- **Burn Assessment:** **${bDeg}** involving **${bTbsa}** | Airway / Inhalation: ${bInh}`);
  } else if (sec.burn && (sec.burn.degree || sec.burn.tbsa)) {
    out.push(`- **Burn Assessment:** Degree: ${tLabel(sec.burn.degree) || '—'} | % TBSA: ${sec.burn.tbsa || '—'}%${sec.burn.regions ? ` (Involved: ${tLabel(sec.burn.regions)})` : ''} | Inhalation Signs: ${sec.burn.inhalationSigns?.map((s) => tLabel(s)).join(', ') || 'None'}`);
  }

  // 4. eFAST, Trauma Imaging, STAT Labs & Plan
  out.push(`\n#### 4. Bedside eFAST, Trauma Imaging, STAT Labs & Emergency Plan`);
  if (sec.efastStatus || (Array.isArray(sec.efastWindows) && sec.efastWindows.length > 0) || sec.efastDetail) {
    const winStr = Array.isArray(sec.efastWindows) && sec.efastWindows.length > 0
      ? ` [Positive Windows: ${sec.efastWindows.map((w) => tLabel(w)).join(', ')}]`
      : '';
    const detStr = sec.efastDetail ? ` (${tLabel(sec.efastDetail)})` : '';
    out.push(`- **Bedside eFAST:** **${tLabel(sec.efastStatus) || 'Not Performed'}**${winStr}${detStr}`);
  } else if (sec.efast) {
    const ef = sec.efast;
    const efParts = [
      `Pericardial: **${tLabel(ef.pericardial || 'Negative')}**`,
      `RUQ/Morison: **${tLabel(ef.ruq || 'Negative')}**`,
      `LUQ/Splenorenal: **${tLabel(ef.luq || 'Negative')}**`,
      `Pelvis/Suprapubic: **${tLabel(ef.pelvic || 'Negative')}**`,
      `Thoracic Sliding: **${tLabel(ef.thoracic || 'Sliding Present')}**`
    ];
    out.push(`- **Bedside eFAST Findings:** ${efParts.join(' | ')}`);
  }

  if (sec.imagingNote) {
    out.push(`- **Portable Radiographs & Trauma CT:** ${tLabel(sec.imagingNote)}`);
  }
  if (sec.statLabsNote) {
    out.push(`- **STAT Trauma Laboratories:** ${tLabel(sec.statLabsNote)}`);
  }

  out.push(`\n#### 5. Emergency Resuscitation Interventions & Disposition Plan`);
  const planItems = [];
  const rawPlanTags = Array.isArray(sec.actionsAndPlan) ? sec.actionsAndPlan : (Array.isArray(sec.planTags) ? sec.planTags : []);
  rawPlanTags.forEach((tag) => planItems.push(tLabel(tag)));
  const rawPlanNote = sec.planCustomNote || sec.planText || '';
  if (rawPlanNote) {
    rawPlanNote.split('\n').filter(Boolean).forEach((l) => planItems.push(tLabel(l)));
  }
  if (planItems.length > 0) {
    planItems.forEach((item, i) => {
      out.push(`${i + 1}. ${item}`);
    });
  } else {
    out.push(`1. Serial trauma physical examinations, resuscitation laboratories, and imaging per ATLS protocol.`);
  }

  return out.join('\n');
}

/**
 * Generates Dedicated Emergency ATLS Trauma Resuscitation Note
 * v1.2-Bilingual-CleanUI
 */
export function generateATLSNote(atlsState = {}, clinicalState = null) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  if (lang === 'en') {
    return generateEnglishATLSNote(atlsState, clinicalState);
  }

  const out = [];
  const mist = atlsState.mist || {};
  const pri = atlsState.primary || {};
  const vit = pri.vitals || {};
  const ample = atlsState.ample || {};
  const sec = atlsState.secondary || {};
  const demo = clinicalState?.demographics || {};

  const genderWord = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقای' : '';
  const ageStr = demo.age ? `${demo.age} ساله` : '';
  const ptIntro = ['مصدوم / بیمار', genderWord, ageStr].filter(Boolean).join(' ');

  const wardStr = demo.ward ? ` | **بخش:** ${demo.ward}` : '';
  const bedStr = demo.bed ? ` | **تخت:** ${demo.bed}` : '';
  if (demo.fullName || demo.ward || demo.bed) {
    out.push(`> **مصدوم / بیمار:** ${demo.fullName || '—'} (${ageStr || '-'})${wardStr}${bedStr} | **پرونده:** ${demo.recordNumber || 'اورژانس تروما'}`);
  }

  out.push(`### پرونده احیا و ترومای حاد اورژانس (Emergency ATLS Trauma Note)`);
  out.push(
    `**مشخصات مصدوم:** ${ptIntro} | **نحوه ورود:** ${mist.arrivalMode || 'اورژانس ۱۱۵ (EMS)'} | **زمان وقوع حادثه:** ${normalizePersianClinicalText(mist.incidentTime || 'نامشخص')}\n`
  );

  // 1. Primary Survey (ABCDE)
  out.push(`#### ۱. ارزیابی اولیه و علائم حیاتی احیا (Primary Survey — ABCDE)`);
  const gcsTotal = vit.gcsTotal || ((Number(vit.gcsE) || 4) + (Number(vit.gcsV) || 5) + (Number(vit.gcsM) || 6));
  const gcsBreakdown = `GCS: **${gcsTotal}/15** (E${vit.gcsE || 4} V${vit.gcsV || 5} M${vit.gcsM || 6})`;
  const vTokens = [
    vit.bp ? `BP: **${vit.bp}** mmHg` : '',
    vit.pr ? `PR: **${vit.pr}** /min` : '',
    vit.rr ? `RR: **${vit.rr}** /min` : '',
    vit.spo2 ? `SpO2: **${vit.spo2}%**` : '',
    vit.temp ? `T: **${vit.temp}** °C` : '',
    gcsBreakdown
  ].filter(Boolean);
  out.push(`- **علائم حیاتی بدو ورود به تریاژ/احیا (Admission Vitals):** ${vTokens.join(' | ')}`);
  out.push(`- **A — Airway & C-Spine Protection:** ${formatAtlsValue(pri.airway, false) || 'راه هوایی باز و ایمن (Patent & Intact)'}`);
  out.push(`- **B — Breathing & Ventilation:** ${formatAtlsValue(pri.breathing, false) || 'حرکات قفسه سینه قرینه و سمع دوطرفه شفاف'}`);
  out.push(`- **C — Circulation & Hemorrhage Control:** ${formatAtlsValue(pri.circulation, false) || 'همودینامیک پایدار، نبض‌های محیطی قرینه و پر'}`);
  const disFa = formatAtlsValue(pri.disability || pri.disabilityPupils, false) || 'مردمک‌ها قرینه و راکتیو به نور (PERRLA)، بدون نقص عصبی فوکال';
  out.push(`- **D — Disability & Neurological Status:** ${gcsBreakdown} | ${disFa}`);
  out.push(`- **E — Exposure & Environmental Control:** ${formatAtlsValue(pri.exposure, false) || 'برهنه‌سازی کامل و بررسی پشت (Log-roll) انجام شد؛ پیشگیری از هیپوترمی برقرار است'}\n`);

  // 2. MIST & AMPLE
  out.push(`#### ۲. مکانیسم تروما، اقدامات پیش‌بیمارستانی و شرح‌حال اورژانس (MIST & AMPLE)`);
  const mechs = Array.isArray(mist.mechanisms) && mist.mechanisms.length > 0
    ? mist.mechanisms.join(' ، ')
    : 'ترومای حاد (مکانیسم در حال بررسی)';
  out.push(`- **مکانیسم آسیب (M — Mechanism of Injury):** ${mechs}`);
  if (mist.mechanismDetail) {
    out.push(`- **شرح دقیق صحنه حادثه و آسیب‌های مشکوک (I/S):** ${normalizePersianClinicalText(mist.mechanismDetail)}`);
  }
  const preHospArr = Array.isArray(mist.prehospitalActions) && mist.prehospitalActions.length > 0
    ? mist.prehospitalActions
    : (Array.isArray(mist.prehospitalCare) ? mist.prehospitalCare : []);
  const preHosp = preHospArr.length > 0
    ? preHospArr.join(' ، ')
    : 'بدون اقدام تهاجمی پیش‌بیمارستانی';
  out.push(`- **اقدامات پیش‌بیمارستانی (T — Treatment Given):** ${preHosp}`);
  out.push(`- **A (Allergies):** ${normalizePersianClinicalText(ample.allergies || 'حساسیت دارویی یا غذایی شناخته‌شده‌ای ندارد (NKDA)')}`);
  out.push(`- **M (Medications):** ${normalizePersianClinicalText(ample.medications || 'عدم مصرف داروی خاص یا ضدانعقاد')}`);
  out.push(`- **P (Past Illnesses / Pregnancy):** ${normalizePersianClinicalText(ample.pastHistory || 'بدون سابقه بیماری زمینه‌ای یا جراحی قبلی')}`);
  out.push(`- **L (Last Meal / NPO Status):** ${normalizePersianClinicalText(ample.lastMeal || 'نامشخص')}`);
  out.push(`- **E (Events / Environment / Tetanus):** ${normalizePersianClinicalText(ample.eventsTetanus || 'نیازمند بررسی واکسیناسیون کزاز')}\n`);

  // 3. Secondary Survey, Injury Registry & Burn
  out.push(`#### ۳. ارزیابی ثانویه سر تا پا، نقشه جراحات و سوختگی (Secondary Survey & Injuries)`);
  const h2tFa = synthesizeAtlsHeadToToeLines(sec, false);
  if (h2tFa.length > 0) {
    out.push(`- **معاینه سرتاپایی (Head-to-Toe Secondary Survey):**\n  * ${h2tFa.join('\n  * ')}`);
  }

  if (Array.isArray(sec.injuries) && sec.injuries.length > 0) {
    out.push(`- **نقشه ضایعات، پارگی‌ها و آسیب‌های موضعی (Trauma Injury Registry):**`);
    sec.injuries.forEach((inj, idx) => {
      const nvVal = inj.neurovascular || inj.distalNv || '';
      const siteVal = inj.site || inj.location || '';
      const parts = [
        inj.type ? `نوع ضایعه: **${inj.type}**` : '',
        siteVal ? `محل آناتومیک: **${normalizePersianClinicalText(siteVal)}**` : '',
        inj.dimensions ? `ابعاد/عمق: ${normalizePersianClinicalText(inj.dimensions)}` : '',
        inj.bleeding ? `خونریزی: ${inj.bleeding}` : '',
        nvVal ? `وضعیت نوروواسکولار دیستال: **${normalizePersianClinicalText(nvVal)}**` : ''
      ].filter(Boolean);
      out.push(`  ${idx + 1}. ${parts.join(' | ')}`);
    });
  } else {
    out.push(`- **نقشه ضایعات ظاهری:** ضایعه نافذ یا لاسراسیون باز فعالی ثبت نشده است.`);
  }

  if (sec.burnActive) {
    const bDeg = sec.burnDegree || 'درجه ۲ سطحی / عمقی (Partial Thickness - II)';
    const bTbsa = sec.burnTbsa ? `${String(sec.burnTbsa).replace(/%$/, '')}% TBSA` : 'درصد تعیین نشده';
    const bInh = normalizePersianClinicalText(sec.burnInhalation || 'بدون شواهد سوختگی استنشاقی');
    out.push(`- **ارزیابی تخصصی سوختگی (Burn Assessment):** سوختگی **${bDeg}** به وسعت **${bTbsa}** | وضعیت راه هوایی و استنشاقی: ${bInh}`);
  } else if (sec.burn && (sec.burn.degree || sec.burn.tbsa)) {
    out.push(`- **ارزیابی سوختگی:** درجه: **${sec.burn.degree || '—'}** | وسعت: **${sec.burn.tbsa || '—'}% TBSA**`);
  }

  // 4. eFAST, Trauma Imaging, Stat Labs & Plan
  out.push(`\n#### ۴. eFAST، تصویربرداری تروما، آزمایش‌های اورژانس و پلن نهایی`);
  const efastWinFa = Array.isArray(sec.efastWindows) && sec.efastWindows.length > 0
    ? ` [پنجره‌های مثبت: ${sec.efastWindows.join(' ، ')}]`
    : '';
  out.push(`- **سونوگرافی بر بالین (eFAST):** **${sec.efastStatus || 'انجام نشده'}**${efastWinFa}${sec.efastDetail ? ` (${normalizePersianClinicalText(sec.efastDetail)})` : ''}`);
  if (sec.imagingNote) {
    out.push(`- **گرافی‌های پرتابل و سی‌تی‌اسکن تروما (Trauma Imaging):** ${normalizePersianClinicalText(sec.imagingNote)}`);
  }
  if (sec.statLabsNote) {
    out.push(`- **آزمایش‌های اورژانسی (STAT Trauma Labs):** ${normalizePersianClinicalText(sec.statLabsNote)}`);
  }

  // Emergency Actions & Disposition Plan
  out.push(`\n#### ۵. اقدامات احیا، پروفیلاکسی و تعیین تکلیف اورژانس (ATLS Resuscitation & Disposition Plan)`);
  const planActions = [...(Array.isArray(sec.actionsAndPlan) ? sec.actionsAndPlan : (Array.isArray(sec.planTags) ? sec.planTags : []))];
  const customPlanFa = sec.planCustomNote || sec.planText || '';
  if (customPlanFa) {
    customPlanFa.split('\n').filter(Boolean).forEach((line) => planActions.push(normalizePersianClinicalText(line)));
  }
  if (planActions.length > 0) {
    planActions.forEach((act, idx) => {
      out.push(`${idx + 1}. ${act}`);
    });
  } else {
    out.push(`1. پایش مداوم علائم حیاتی، تکرار معاینه شکم و سطح هوشیاری (Serial Exam) و پیگیری تصویربرداری‌های تروما.`);
  }

  return out.join('\n');
}
