import { getCurrentLanguage, getLocalizedItemLabel } from './i18n.js';
import {
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
  ATLS_EXAM_SCHEMA
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
 * Strictly strips patient identifying information (fullName, fatherName, birthDate)
 * while preserving demographic metadata (age, gender, marital, city, occupation).
 */
export function sanitizeRecordForExport(rawState) {
  const cloned = JSON.parse(JSON.stringify(rawState || {}));
  ['demographics', 'admission', 'context'].forEach((sec) => {
    if (cloned[sec]) {
      delete cloned[sec].fullName;
      delete cloned[sec].fatherName;
      delete cloned[sec].birthDate;
    }
  });
  delete cloned.fullName;
  delete cloned.fatherName;
  delete cloned.birthDate;
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
 * Narrative Sentence Generator for each of the 5 Presentation Archetypes (English)
 */
export function renderArchetypeNarrativeEn(item, index = 0, totalCount = 1) {
  const prefix = totalCount > 1 ? (index === 0 ? 'Regarding primary presentation: ' : 'Regarding concurrent presentation: ') : '';

  if (item.archetype === 'mass_lesion_archetype') {
    let sentence = `${prefix}The patient reports a palpable mass/lesion located at **${item.location || 'the specified anatomical region'}**`;
    if (item.discoveryTime) sentence += `, first noted approximately ${item.discoveryTime} prior to evaluation`;
    if (item.growthPattern) sentence += `, exhibiting a ${item.growthPattern} growth pattern`;
    sentence += '.';
    if (item.painStatus) sentence += ` The lesion is currently ${item.painStatus}.`;
    if (item.posFindings?.length) sentence += ` Associated local signs: positive for ${item.posFindings.join(', ')}.`;
    if (item.negFindings?.length) sentence += ` Negative for: ${item.negFindings.join(', ')}.`;
    return sentence;
  }

  if (item.archetype === 'trauma_burn_archetype') {
    let sentence = `${prefix}The patient presented following **${item.mechanism || 'acute trauma'}**`;
    if (item.timeSinceInjury) sentence += ` sustained approximately ${item.timeSinceInjury} prior to arrival`;
    if (item.injuredZones?.length) sentence += ` with injuries involving **${item.injuredZones.join(', ')}**`;
    if (item.transportMode) sentence += `, transported to the emergency department via ${item.transportMode}`;
    sentence += '.';
    if (item.posFindings?.length) sentence += ` Trauma review: positive for ${item.posFindings.join(', ')}.`;
    if (item.negFindings?.length) sentence += ` Denies: ${item.negFindings.join(', ')}.`;
    return sentence;
  }

  if (item.archetype === 'elective_asymptomatic_archetype') {
    let sentence = `${prefix}The patient is currently asymptomatic with no acute pain or surgical distress`;
    if (item.discoveryMethod) sentence += `, identified through ${item.discoveryMethod}`;
    sentence += '.';
    if (item.workupSummary) sentence += ` Outpatient diagnostic trajectory: ${item.workupSummary}.`;
    return sentence;
  }

  if (item.archetype === 'functional_bleeding_archetype') {
    let sentence = `${prefix}The patient reports **${item.symptomTitle || 'functional symptoms'}**`;
    if (item.duration) sentence += ` starting ${item.duration} ago`;
    if (item.onset) sentence += ` (${item.onset})`;
    if (item.severityOrFrequency) sentence += ` [${item.severityOrFrequency}]`;
    sentence += '.';
    if (item.aggravating?.length) sentence += ` Aggravated by ${item.aggravating.join(', ')}.`;
    if (item.relieving?.length) sentence += ` Partially relieved by ${item.relieving.join(', ')}.`;
    return sentence;
  }

  // pain_archetype
  const siteStr = item.site || (item.selectedRegions || []).map(getRegionLabel).join(', ') || item.title || `Focus #${index + 1}`;
  let pSentence = `${prefix}Pain focus #${index + 1} (${siteStr}): Onset ${item.duration || 'recently'} prior to admission`;
  if (item.character) pSentence += `, characterized as ${item.character}`;
  if (item.course) pSentence += `, clinical course is ${item.course}`;
  if (item.timing) pSentence += `, timing pattern: ${item.timing}`;
  if (item.severity !== undefined && item.severity !== null && item.severity !== '') pSentence += `, severity rated ${item.severity}/10 on NRS`;
  pSentence += '.';
  if (item.radiationList && item.radiationList.length > 0) {
    pSentence += ` Radiation: ${item.radiationList.map(r => r.label || r).join(', ')}.`;
  }
  if (item.aggravating && item.aggravating.length > 0) {
    pSentence += ` Aggravated by: ${item.aggravating.join(', ')}.`;
  }
  if (item.relieving && item.relieving.length > 0) {
    pSentence += ` Relieved by: ${item.relieving.join(', ')}.`;
  }
  return pSentence;
}

/**
 * Flowing Medical Narrative Generator for Chief Complaint (CC) and History of Present Illness (HPI)
 * Generates natural, cohesive Persian prose structured like an expert attending surgeon's note.
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
    if (demo.fullName || demo.fatherName || demo.birthDate || demo.age) {
      const agePart = demo.age ? `${demo.age} y/o` : (demo.birthDate || '—');
      const genderLabel = demo.gender === 'female' ? 'Female' : demo.gender === 'male' ? 'Male' : (demo.gender || '—');
      out.push(
        `> **Patient Demographics:** Name: **${demo.fullName || '—'}** | Father's Name: **${demo.fatherName || '—'}** | Age: **${agePart}** | Sex: **${genderLabel}**\n`
      );
    }

    const ccText = cc.ccPhrase || cc.patientQuote || 'Acute Surgical Complaint';
    out.push(`### 1. Chief Complaint (CC)`);
    out.push(`- **"${ccText}"**`);

    out.push(`\n### 2. History of Present Illness (HPI)`);
    const narrativeSentences = [];

    const genderNoun = demo.gender === 'female' ? 'female' : demo.gender === 'male' ? 'male' : 'patient';
    const agePhrase = demo.age ? `${demo.age}-year-old` : '';
    let introSentence = `The patient is a ${agePhrase} ${genderNoun} presenting with chief complaint of "${ccText}".`;
    if (cc.pathway === 'elective_clinic' || cc.pathway === 'clinic_referral') {
      const att = cc.clinicAttending || cc.referringAttending || cc.attendingPhysician || 'Attending Surgeon';
      const diag = cc.clinicInitialDiagnosis || cc.establishedDiagnosis || cc.preliminaryDiagnosis;
      const proc = cc.clinicPlannedProcedure || cc.plannedProcedure;
      introSentence += ` Admitted electively from surgical clinic under Dr. ${att}${diag ? ` with initial diagnosis of "${diag}"` : ''}${proc ? ` for planned "${proc}"` : ''}.`;
    } else if (cc.pathway === 'inpatient_transfer') {
      const src = cc.transferSource || cc.originWardHospital || 'inpatient service';
      const rsn = cc.transferReason || cc.primaryAdmissionReason;
      const ind = cc.transferSurgIndication || cc.transferConsultReason;
      introSentence += ` Admitted via inpatient transfer from "${src}"${rsn ? ` (initial admission reason: ${rsn})` : ''} following surgical consultation${ind ? ` for "${ind}"` : ''}.`;
    } else if (cc.pathway === 'postop_complication') {
      introSentence += ` Presenting with acute post-operative complaint/complication following recent surgical intervention.`;
    } else {
      // emergency_acute
      introSentence += ` Evaluated acutely in the Emergency Department / Surgical Service for emergent management.`;
    }
    narrativeSentences.push(introSentence);

    if (presentations.length > 0) {
      presentations.forEach((item, idx) => {
        narrativeSentences.push(renderArchetypeNarrativeEn(item, idx, presentations.length));
      });
    }

    const posSyms = [];
    const negSyms = [];
    if (hpi.symptoms) {
      Object.entries(hpi.symptoms).forEach(([symId, data]) => {
        const symObj = HPI_BASIC_SYMPTOMS.find(s => s.id === symId);
        const symName = symObj ? (symObj.label.match(/\(([^)]+)\)/)?.[1] || symObj.label) : symId;
        const st = typeof data === 'object' ? data.state : data;
        const dt = typeof data === 'object' ? data.detail : '';
        if (st === 1) posSyms.push(dt ? `${symName} (${dt})` : symName);
        else if (st === -1) negSyms.push(symName);
      });
    }
    if (posSyms.length > 0) narrativeSentences.push(`Associated symptoms: Positive for ${posSyms.join(', ')}.`);
    if (negSyms.length > 0) narrativeSentences.push(`Pertinent review negatives: Denies ${negSyms.join(', ')}.`);

    out.push(narrativeSentences.join('\n\n'));
    return out.join('\n');
  }

  // 1. کادر مشخصات هویتی برای بالای برگه شرح‌حال (فقط در نمایش محلی و پرینت بیمارستان)
  if (demo.fullName || demo.fatherName || demo.birthDate || demo.age) {
    const agePart = demo.birthDate
      ? `${demo.birthDate} (${demo.age ? demo.age + ' ساله' : ''})`
      : (demo.age ? `${demo.age} ساله` : '—');
    const genderLabel = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقا' : (demo.gender || 'سایر/ترنس');

    out.push(
      `> **مشخصات بیمار:** نام و نام خانوادگی: **${demo.fullName || '—'}** | نام پدر: **${demo.fatherName || '—'}** | تاریخ تولد / سن: **${agePart}** | جنسیت: **${genderLabel}**\n`
    );
  }

  // 2. شکایت اصلی (CC): صرفاً عبارت کوتاه شکایت بیمار بدون هیچ توضیح اضافی
  const ccText = normalizePersianClinicalText(cc.ccPhrase || cc.patientQuote || 'شکایت حاد جراحی');
  out.push(`### ۱. شکایت اصلی (Chief Complaint - CC)`);
  out.push(`- **${ccText}**`);

  // 3. شرح بیماری فعلی (HPI) به صورت کاملاً روایی و مبتنی بر کهن‌الگوها
  out.push(`\n### ۲. شرح بیماری فعلی (History of Present Illness - HPI)`);
  const narrativeSentences = [];

  const genderWord = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقای' : 'بیمار';
  const agePhrase = demo.age ? `${demo.age} ساله` : '';
  const maritalPhrase = demo.marital ? `، ${demo.marital}` : '';
  const cityPhrase = demo.city ? `، اهل و ساکن ${normalizePersianClinicalText(demo.city)}` : '';
  const jobPhrase = demo.occupation ? `، شغل ${normalizePersianClinicalText(demo.occupation)}` : '';

  // جمله اول: معرفی بیمار بر اساس ۳ مسیر بالینی پذیرش
  if (cc.pathway === 'elective_clinic' || cc.pathway === 'clinic_referral') {
    const att = normalizePersianClinicalText(cc.clinicAttending || cc.referringAttending || cc.attendingPhysician || '');
    const diag = normalizePersianClinicalText(cc.clinicInitialDiagnosis || cc.establishedDiagnosis || cc.preliminaryDiagnosis || '');
    const proc = normalizePersianClinicalText(cc.clinicPlannedProcedure || cc.plannedProcedure || '');
    let refSentence = `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که با شکایت «${ccText}» مراجعه نموده و با نامه ارجاع استاد محترم ${att ? '**' + att + '**' : 'درمانگاه جراحی'}`;
    if (diag) refSentence += ` با تشخیص اولیه «${diag}»`;
    if (proc) refSentence += ` جهت اقدام برنامه‌ریزی‌شده «${proc}»`;
    refSentence += ` از درمانگاه به صورت الکتیو در این بخش بستری شده‌اند.`;
    narrativeSentences.push(refSentence);
  } else if (cc.pathway === 'inpatient_transfer') {
    const src = normalizePersianClinicalText(cc.transferSource || cc.originWardHospital || '');
    const rsn = normalizePersianClinicalText(cc.transferReason || cc.primaryAdmissionReason || '');
    const ind = normalizePersianClinicalText(cc.transferSurgIndication || cc.transferConsultReason || '');
    let transSentence = `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که به صورت انتقال بین‌بخشی / اعزام از ${src ? '«' + src + '»' : 'بخش/مرکز دیگر'}`;
    if (rsn) transSentence += ` (علت بستری اولیه: «${rsn}»)`;
    if (ind) transSentence += `، به دنبال مشاوره و با اندیکاسیون «${ind}» به سرویس جراحی منتقل و پذیرش گردیدند.`;
    else transSentence += `، جهت ادامه درمان تحت نظر سرویس جراحی پذیرش گردیدند.`;
    narrativeSentences.push(transSentence);
  } else if (cc.pathway === 'postop_complication') {
    narrativeSentences.push(
      `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که به دنبال عمل جراحی اخیر، با شکایت «${ccText}» به این مرکز مراجعه کرده‌اند.`
    );
  } else {
    // emergency_acute
    let admSentence = `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که با شکایت اصلی «${ccText}» به صورت حاد به اورژانس / بخش جراحی مراجعه و پذیرش نموده‌اند.`;
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
 * Complete Surgical Clinical Note Generator (v0.5-Surg)
 */
export function generateClinicalNote(state) {
  const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fa';
  const isEn = lang === 'en';
  const lines = [];
  const demo = state.demographics || {};

  // 1 & 2: CC and HPI
  lines.push(generateNarrativeCCAndHPI(state));

  if (isEn) {
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
          const itemEn = item.label.match(/\(([^)]+)\)/)?.[1] || item.label;
          posItems.push(dt ? `${itemEn} (${dt})` : itemEn);
        }
      });
      const catTitleEn = cat.title.match(/\(([^)]+)\)/)?.[1] || cat.title;
      if (posItems.length > 0) {
        catLines.push(`  * **${catTitleEn}:** ${posItems.join(', ')}`);
      } else if (isNeg) {
        catLines.push(`  * **${catTitleEn}:** Denies condition in this category`);
      }
    });

    if (catLines.length > 0) {
      lines.push(`- **Past Medical History (PMH):**\n${catLines.join('\n')}`);
    } else if (!masterNeg) {
      lines.push(`- **Past Medical History (PMH):** Denies significant chronic medical illnesses.`);
    }

    if (state.psh?.surgeries && state.psh.surgeries.length > 0) {
      const surgStr = state.psh.surgeries.map(s => `${s.procedure || 'Surgery'} (${s.yearHospital || ''})`).join(', ');
      lines.push(`- **Past Surgical History (PSH):** ${surgStr}`);
    } else {
      lines.push(`- **Past Surgical History (PSH):** Denies prior abdominal or major surgical procedures.`);
    }

    if (demo.gender === 'female' && state.obgyn) {
      const o = state.obgyn;
      lines.push(`- **Obstetric History (Ob/Gyn):** Gravida: ${o.gravida || 0}, Para: ${o.para || 0}, Abortion: ${o.abortion || 0}, Living: ${o.living || 0}.`);
    }

    // 4. Medications, Allergies, Social History
    lines.push(`\n### 4. Medications, Allergies & Social History (DH / SH / AH / FH)`);
    const ahState = state.ah || {};
    if (ahState.nkda) {
      lines.push(`- **Allergies:** No Known Drug Allergies (NKDA).`);
    } else if (ahState.drugAllergies) {
      lines.push(`- **Allergies:** Drug Allergies: ${ahState.drugAllergies}`);
    } else {
      lines.push(`- **Allergies:** NKDA.`);
    }

    const dhState = state.dh || {};
    if (dhState.noRoutineMeds) {
      lines.push(`- **Current Medications (DH):** Denies routine medication use (No routine medications).`);
    } else {
      const activeList = [];
      if (dhState.activeDrugs && Array.isArray(dhState.activeDrugs)) {
        dhState.activeDrugs.forEach(ad => {
          const parts = [ad.dose ? `dose: ${ad.dose}` : '', ad.sig ? `sig: ${ad.sig}` : '', ad.note ? `note: ${ad.note}` : ''].filter(Boolean);
          activeList.push(`${ad.name || ad.label || ad.id}${parts.length ? ' (' + parts.join(' | ') + ')' : ''}`);
        });
      }
      if (dhState.drugs && Array.isArray(dhState.drugs)) {
        dhState.drugs.forEach(d => {
          const parts = [d.dose, d.sig, d.note ? '(' + d.note + ')' : ''].filter(Boolean);
          activeList.push(`${d.name || ''}${parts.length ? ' ' + parts.join(' ') : ''}`.trim());
        });
      }
      if (activeList.length > 0) {
        lines.push(`- **Current Medications (DH):** ${activeList.join(', ')}`);
      } else {
        lines.push(`- **Current Medications (DH):** Denies regular prescription medication use.`);
      }
    }

    const shState = state.sh || {};
    const shParts = [];
    if (shState.negSmoking) shParts.push('Tobacco: Denies smoking/tobacco');
    else if (shState.cigsPerDay && shState.yearsSmoked) {
      const py = ((Number(shState.cigsPerDay) / 20) * Number(shState.yearsSmoked)).toFixed(1);
      shParts.push(`Tobacco: ${shState.cigsPerDay} cigs/day for ${shState.yearsSmoked} yrs (~${py} pack-years)`);
    } else if (shState.smoking) shParts.push(`Tobacco: ${shState.smoking}`);

    if (shState.negOpium) shParts.push('Substances: Denies opium/substance use');
    else if (shState.opium) shParts.push(`Substances: ${shState.opium}`);
    else if (shState.substance) shParts.push(`Substances: ${shState.substance}`);

    if (shState.negAlcohol) shParts.push('Alcohol: Denies alcohol use');
    else if (shState.alcohol) shParts.push(`Alcohol: ${shState.alcohol}`);

    lines.push(`- **Social History (SH):** ${shParts.length > 0 ? shParts.join('; ') : 'Non-contributory (denies tobacco, alcohol or substance use).'}`);

    const fhState = state.fh || {};
    if (fhState.negFamilyHistory || fhState.masterNeg) {
      lines.push(`- **Family History (FH):** Negative for familial malignancies or premature CAD in first-degree relatives.`);
    } else if (fhState.diseases && Array.isArray(fhState.diseases) && fhState.diseases.length > 0) {
      const fhListEn = fhState.diseases.map(d => {
        const rels = (d.relatives && d.relatives.length > 0) ? `in ${d.relatives.join(' & ')}` : 'in family';
        const vit = (d.status === 'deceased' || d.isAlive === false) ? 'deceased' : 'living';
        const age = (d.ageNotes || d.ageNote) ? `, ${d.ageNotes || d.ageNote}` : '';
        return `${d.en || d.name || d.label} ${rels} (${vit}${age})`;
      });
      lines.push(`- **Family History (FH):** Positive for ${fhListEn.join('; ')}.`);
    } else {
      lines.push(`- **Family History (FH):** ${fhState.noncontributory ? 'Non-contributory (denies familial GI cancers or early deaths).' : (fhState.notes || 'Non-contributory.')}`);
    }

    // 5. ROS
    lines.push(`\n### 5. Review of Systems (ROS)`);
    const rosItems = state.ros?.items || {};
    const rosPos = [];
    const rosNeg = [];
    Object.entries(rosItems).forEach(([rId, val]) => {
      const st = typeof val === 'object' ? val.state : val;
      const lb = typeof val === 'object' ? val.label : rId;
      const enLb = lb.match(/\(([^)]+)\)/)?.[1] || lb;
      if (st === 1) rosPos.push(enLb);
      else if (st === -1) rosNeg.push(enLb);
    });
    if (rosPos.length > 0) lines.push(`- **Positive System Review:** ${rosPos.join(', ')}`);
    if (rosNeg.length > 0) lines.push(`- **Negative System Review:** Denies ${rosNeg.join(', ')}`);
    if (rosPos.length === 0 && rosNeg.length === 0) lines.push(`- **System Review:** 11-point review of systems otherwise negative except as noted in HPI.`);

    // 6. PE
    lines.push(`\n### 6. Physical Examination (PE)`);
    const vitals = state.pe?.vitals || {};
    lines.push(`- **Vital Signs:** BP: ${vitals.bp || '—'} mmHg | PR: ${vitals.pr || '—'} bpm | RR: ${vitals.rr || '—'} /min | Temp: ${vitals.temp || '—'} °C | SpO2: ${vitals.spo2 || '—'}% on RA | Fasting (NPO): ${vitals.npo ? 'Yes' : 'No'}`);

    const peFindings = state.pe?.findings || {};
    const pePos = [];
    const peNeg = [];
    Object.entries(peFindings).forEach(([fId, val]) => {
      const st = typeof val === 'object' ? val.state : val;
      const lb = typeof val === 'object' ? val.label : fId;
      const enLb = lb.match(/\(([^)]+)\)/)?.[1] || lb;
      if (st === 1) pePos.push(enLb);
      else if (st === -1) peNeg.push(enLb);
    });
    lines.push(`- **Abdominal Examination (4 Pillars):**`);
    if (pePos.length > 0) lines.push(`  * **Pertinent Positive Findings:** ${pePos.join(', ')}`);
    if (peNeg.length > 0) lines.push(`  * **Normal / Negative Findings:** ${peNeg.join(', ')}`);

    // Systemic Examination (Only included if examined, marked normal or has findings)
    const compSystemsEn = state.pe?.comprehensiveSystems || {};
    const otherSysLinesEn = [];
    PE_COMPREHENSIVE_SYSTEMS.filter(s => !s.isPrioritySurgical).forEach((sys) => {
      const sysData = compSystemsEn[sys.id] || {};
      const sysTitleEn = sys.title.match(/\(([^)]+)\)/)?.[1] || sys.title;
      const hasNormal = !!sysData.isNormal;
      const tags = Array.isArray(sysData.selectedTags) ? sysData.selectedTags : [];
      const note = sysData.text ? sysData.text.trim() : '';

      if (hasNormal && tags.length === 0 && !note) {
        otherSysLinesEn.push(`  * **${sysTitleEn}:** Normal baseline examination; unremarkable.`);
      } else if (tags.length > 0 || note) {
        const parts = [];
        if (tags.length > 0) parts.push(`Findings: ${tags.join(', ')}`);
        if (note) parts.push(note);
        if (hasNormal) parts.push('Otherwise unremarkable');
        otherSysLinesEn.push(`  * **${sysTitleEn}:** ${parts.join('; ')}`);
      }
    });
    if (otherSysLinesEn.length > 0) {
      lines.push(`- **Systemic Examination (Non-Abdominal Systems):**`);
      lines.push(otherSysLinesEn.join('\n'));
    }

    // Local Mass Exam Module
    const massExamsEn = state.pe?.massExams || state.pe?.massExamList || [];
    if (massExamsEn.length > 0) {
      lines.push(`- **Local Mass & Lesion Examination:**`);
      massExamsEn.forEach((m, idx) => {
        lines.push(
          `  * **Lesion #${idx + 1} (${m.location || 'Specified Site'}):** Dimensions: ${m.dimensions || 'Unspecified'} | Consistency: ${m.consistency || '—'} | Margins: ${m.margin || m.margins || '—'} | Mobility: ${m.mobility || '—'} | Skin & Tenderness: ${m.skinSign || m.tendernessSkin || 'Normal'} | Remarks: ${m.note || m.neuroLymph || 'Intact'}`
        );
      });
    }

    // ATLS Trauma Exam Module
    const atlsEn = state.pe?.atlsExam || {};
    if (atlsEn.active || atlsEn.enabled || Object.keys(atlsEn.primarySurvey || {}).length > 0 || (atlsEn.wounds && atlsEn.wounds.length > 0) || atlsEn.burn?.degree || atlsEn.burn?.tbsa) {
      lines.push(`- **ATLS Trauma & Burn Survey:**`);
      const ps = atlsEn.primarySurvey || {};
      lines.push(`  * **Primary Survey (ABCDE):** Airway: ${ps.airway || 'Patent'} | Breathing: ${ps.breathing || 'Symmetric'} | Circulation: ${ps.circulation || 'Stable'} | Disability: ${ps.disability || 'PERRLA / GCS 15'} | Exposure: ${ps.exposure || 'Normal'}`);
      if (atlsEn.wounds && atlsEn.wounds.length > 0) {
        lines.push(`  * **Wound Registry:**`);
        atlsEn.wounds.forEach((w, wIdx) => {
          lines.push(`    - #${wIdx + 1}: ${w.type || 'Wound'} at ${w.location || 'Site'} (${w.dimensions || '—'}) | Bleeding: ${w.bleedingStatus || w.bleeding || '—'} | Distal NV: ${w.distalNv || w.distalNV || 'Intact'}`);
        });
      }
      if (atlsEn.burn && (atlsEn.burn.degree || atlsEn.burn.tbsa)) {
        lines.push(`  * **Burn Assessment:** Degree: ${atlsEn.burn.degree || '—'} | % TBSA: ${atlsEn.burn.tbsa || '—'}% (Involved: ${atlsEn.burn.regions || '—'}) | Inhalation Signs: ${atlsEn.burn.inhalationSigns?.join(', ') || 'None'}`);
      }
    }

    // 7. Paraclinics
    lines.push(`\n### 7. Diagnostic Studies & Paraclinics`);
    const labs = state.paraclinics?.labs || {};
    const labEntries = Object.entries(labs).filter(([k, v]) => v && String(v).trim());
    const addLabsEn = state.paraclinics?.additionalLabs || {};
    const addEntriesEn = Object.entries(addLabsEn).filter(([k, v]) => {
      if (!v) return false;
      if (typeof v === 'object') return v.value && String(v.value).trim();
      return String(v).trim();
    });

    if (labEntries.length > 0 || addEntriesEn.length > 0) {
      const parts = labEntries.map(([k, v]) => `${k}: ${v}`);
      addEntriesEn.forEach(([k, v]) => {
        const val = typeof v === 'object' ? v.value : v;
        const unit = typeof v === 'object' && v.unit ? ` ${v.unit}` : '';
        const name = typeof v === 'object' && v.name ? v.name : k;
        parts.push(`${name}: ${val}${unit}`);
      });
      lines.push(`- **Laboratory Investigations:** ${parts.join(' | ')}`);
    } else {
      lines.push(`- **Laboratory Investigations:** Results pending at time of admission.`);
    }

    // 8. DDx & Plan
    lines.push(`\n### 8. Clinical Reasoning & Plan (DDx & Plan)`);
    const reasoning = state.reasoning || {};
    if (reasoning.problemRepresentation) lines.push(`- **Problem Representation:** ${reasoning.problemRepresentation}`);
    if (reasoning.topDifferential) lines.push(`- **Primary Differential:** ${reasoning.topDifferential}`);
    if (reasoning.managementPlan) lines.push(`- **Management Plan:** ${reasoning.managementPlan}`);

    return lines.join('\n');
  }

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

  // PSH (ساده‌شده)
  let pshNote = '';
  if (state.psh?.surgeries && Array.isArray(state.psh.surgeries) && state.psh.surgeries.length > 0) {
    pshNote = state.psh.surgeries.map(s => `${s.procedure || ''} (${s.yearHospital || ''})`).join('، ');
    if (state.psh.historyOfAnesthesia) {
      pshNote += ` | بیهوشی: ${state.psh.historyOfAnesthesia}`;
    }
  } else if (state.psh?.note) {
    pshNote = normalizePersianClinicalText(state.psh.note);
  } else {
    pshNote = 'سابقه عمل جراحی قبلی و عوارض بیهوشی را ذکر نمی‌کند.';
  }
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

  // FH (سوابق خانوادگی ساختاریافته)
  const fhState = state.fh || {};
  if (fhState.negFamilyHistory || fhState.masterNeg) {
    lines.push(`- **سوابق خانوادگی (FH):** سابقه بیماری خاص، سکته قلبی زودرس یا بدخیمی در بستگان درجه یک بیمار نفی می‌شود (Negative for familial malignancies or premature CAD).`);
  } else if (fhState.diseases && Array.isArray(fhState.diseases) && fhState.diseases.length > 0) {
    const fhList = fhState.diseases.map((d) => {
      const rels = (d.relatives && d.relatives.length > 0) ? `در ${d.relatives.join(' و ')}` : 'در بستگان';
      const vit = (d.status === 'deceased' || d.isAlive === false) ? 'فوت‌شده در اثر این بیماری' : 'در قید حیات';
      const rawAge = normalizePersianClinicalText(d.ageNotes || d.ageNote || '');
      let vitDesc = vit;
      if (rawAge) {
        if (rawAge.includes('فوت') || rawAge.includes('حیات')) {
          vitDesc = rawAge;
        } else {
          vitDesc = `${vit}، ${rawAge}`;
        }
      }
      return `سابقه ${d.name || d.label || 'بیماری'} ${rels} (${vitDesc})`;
    });
    lines.push(`- **سوابق خانوادگی (FH):** ${fhList.join(' و ')}.`);
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

  if (state.ros?.systemGapNote) {
    lines.push(`- **موارد خارج از لیست ROS:** ${normalizePersianClinicalText(state.ros.systemGapNote)}`);
  }

  // ۶. معاینه فیزیکی (PE) با تفکیک ۴ رکن معاینه شکم و ماژول‌های Unlockable
  lines.push(`\n### ۶. معاینه فیزیکی (Physical Examination - PE)`);
  const v = state.pe?.vitals || {};
  lines.push(
    `- **علائم حیاتی (Vitals):** BP: ${v.bp || '—'} mmHg | PR: ${v.pr || '—'} /min | RR: ${v.rr || '—'} /min | T: ${v.temp || '—'} °C | SpO2: ${v.spo2 || '—'}% | وضعیت NPO: ${v.npo || 'نامشخص'}`
  );

  // ستون‌های ۴ گانه الزامی معاینه شکم
  lines.push(`- **معاینه شکم (Abdominal Examination - 4 Pillars):**`);
  PE_MANDATORY_PILLARS.forEach((pillar) => {
    const secPos = [];
    const secNeg = [];

    pillar.items.forEach((item) => {
      const itemData = state.pe?.findings?.[item.id] || (state.pe?.abdomen && (state.pe.abdomen[pillar.id]?.[item.id] || state.pe.abdomen[item.id])) || state.pe?.[item.id];
      const st = typeof itemData === 'object' && itemData !== null ? itemData.state : itemData;
      const detail = typeof itemData === 'object' && itemData !== null ? (itemData.detail || itemData.note || '') : '';
      if (st === 1 || st === '+1') {
        secPos.push(detail && detail.trim() ? `${item.label} (${normalizePersianClinicalText(detail)})` : item.label);
      } else if (st === -1 || st === '-1') {
        secNeg.push(item.label);
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

  // ماژول معاینه تروما و سوختگی (ATLS Trauma & Burn Exam)
  const atlsFa = state.pe?.atlsExam || {};
  if (atlsFa.active || atlsFa.enabled || Object.keys(atlsFa.primarySurvey || {}).length > 0 || (atlsFa.wounds && atlsFa.wounds.length > 0) || atlsFa.burn?.degree || atlsFa.burn?.tbsa) {
    lines.push(`- **ارزیابی اولیه ترومای جراحی (ATLS Primary Survey ABCDE):**`);
    const ps = atlsFa.primarySurvey || {};
    lines.push(`  * **ارزیابی اولیه (ABCDE):**`);
    if (ps.airway) lines.push(`    - A (Airway & C-Spine): ${ps.airway}`);
    if (ps.breathing) lines.push(`    - B (Breathing): ${ps.breathing}`);
    if (ps.circulation) lines.push(`    - C (Circulation): ${ps.circulation}`);
    if (ps.disability) lines.push(`    - D (Disability / GCS): ${ps.disability}`);
    if (ps.exposure) lines.push(`    - E (Exposure): ${ps.exposure}`);

    if (atlsFa.wounds && atlsFa.wounds.length > 0) {
      lines.push(`  * **ثبت زخم‌ها و جراحات تروما (Wound & Injury Registry):**`);
      atlsFa.wounds.forEach((w, wIdx) => {
        lines.push(
          `    - جراحت #${wIdx + 1}: ${w.type || 'زخم'} در ${w.location || 'موضع'} (ابعاد: ${w.dimensions || '—'}) | وضعیت خونریزی: ${w.bleedingStatus || w.bleeding || '—'} | وضعیت عصبی-عروقی دیستال: ${w.distalNv || w.distalNV || 'طبیعی'}`
        );
      });
    }

    if (atlsFa.burn && (atlsFa.burn.degree || atlsFa.burn.tbsa)) {
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
  const d = state.demographics || {};
  const cc = state.cc || {};
  const hpi = state.hpi || {};
  const pains = hpi.painList || [];

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


/**
 * Generates Daily Progress Note according to SOAP standard
 * v0.9-SOAP-Engine
 */
export function generateSOAPProgressNote(soapState, linkedCaseState = null) {
  const out = [];
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};
  const p = soapState.plan || {};

  // استخراج اطلاعات پایه از پرونده متصل یا هدر مستقل
  const demo = linkedCaseState?.demographics || ctx;
  const genderWord = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقای' : 'بیمار';
  const ageStr = demo.age ? `${demo.age} ساله` : '';
  const diagStr = normalizePersianClinicalText(ctx.workingDiagnosis || linkedCaseState?.cc?.establishedDiagnosis || linkedCaseState?.cc?.patientQuote || 'بستری در بخش جراحی');
  const procStr = normalizePersianClinicalText(ctx.procedureDone || '');
  const hdStr = ctx.hdNumber ? `HD #${ctx.hdNumber}` : '';
  const podStr = ctx.podNumber ? `${ctx.podType || 'POD'} #${ctx.podNumber}` : '';
  const timelineBadge = [hdStr, podStr].filter(Boolean).join(' | ');

  // 1. Header (فقط در نمایش محلی نام بیمار چاپ شود)
  if (demo.fullName) {
    out.push(`> **بیمار:** ${demo.fullName} (${ageStr}) | **تاریخ و ساعت ثبت پراگرس:** ${soapState.dateStr || new Date().toLocaleDateString('fa-IR')}`);
  }
  out.push(`### یادداشت سیر روزانه بیماری (Daily Progress Note — SOAP)`);
  out.push(
    `**مشخصات سیر:** بیمار ${genderWord} ${ageStr} | **تشخیص:** ${diagStr}${procStr ? ` | **عمل/پروسیجر:** ${procStr}` : ''}${timelineBadge ? ` | **[ ${timelineBadge} ]**` : ''}\n`
  );

  // 2. S — Subjective
  out.push(`#### S — Subjective (گزارش ۲۴ ساعت گذشته و علائم فعلی)`);
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

  const posOvernight = [];
  const negOvernight = [];
  Object.entries(s.overnightSymptoms || {}).forEach(([k, val]) => {
    const st = typeof val === 'object' ? val.state : val;
    const lbl = val.label || k;
    const det = val.detail ? ` (${normalizePersianClinicalText(val.detail)})` : '';
    if (st === 1) posOvernight.push(`${lbl}${det}`);
    if (st === -1) negOvernight.push(lbl);
  });
  if (posOvernight.length > 0) sParts.push(`شکایات مثبت شبانه‌روز اخیر: ${posOvernight.join('، ')}`);
  if (negOvernight.length > 0) sParts.push(`عدم وجود ${negOvernight.join('، ')}`);
  if (s.narrativeNote) sParts.push(normalizePersianClinicalText(s.narrativeNote));

  out.push(`- ${sParts.join(' | ') || 'بیمار در ۲۴ ساعت گذشته شکایت حاد جدیدی نداشته است.'}.\n`);

  // 3. O — Objective
  out.push(`#### O — Objective (یافته‌های عینی، بیلان، درن‌ها، معاینه و آزمایشگاه امروز)`);
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
  const ioTokens = [];
  if (o.intake24h) ioTokens.push(`جذب ۲۴ ساعته (Intake): ${o.intake24h} cc`);
  if (o.urineOutput24h) ioTokens.push(`برون‌ده ادراری (Urine Output): ${o.urineOutput24h} cc`);
  if (o.ngtOutput24h) ioTokens.push(`برون‌ده NGT: ${o.ngtOutput24h}`);
  if (ioTokens.length > 0) {
    out.push(`- **بیلان مایعات و لوله‌ها (I/O & Tubes):** ${ioTokens.join(' | ')}`);
  }

  if (o.drains && o.drains.length > 0) {
    const drainStrings = o.drains.map(
      (d, idx) => `درن #${idx + 1} (${d.typeAndSite || 'جراحی'}): حجم ۲۴ ساعته **${d.volumeCc || '—'} cc** با ماهیت **${d.character || 'سروزی'}**`
    );
    out.push(`- **وضعیت درن‌ها (Surgical Drains):** ${drainStrings.join(' ؛ ')}`);
  }

  // Focused Physical Exam
  const examParts = [];
  if (o.generalAndCardioPulm) examParts.push(normalizePersianClinicalText(o.generalAndCardioPulm));
  if (o.abdomenExam) examParts.push(`شکم: ${normalizePersianClinicalText(o.abdomenExam)}`);
  if (o.woundAndDressing) examParts.push(`زخم و پانسمان: ${normalizePersianClinicalText(o.woundAndDressing)}`);
  if (o.extremitiesDvt) examParts.push(`اندام‌ها: ${normalizePersianClinicalText(o.extremitiesDvt)}`);
  if (o.examNote) examParts.push(normalizePersianClinicalText(o.examNote));
  if (examParts.length > 0) {
    out.push(`- **معاینه فیزیکی متمرکز امروز (Focused PE):** ${examParts.join(' | ')}.`);
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
    : `بیمار ${genderWord} ${ageStr} با تشخیص ${diagStr}${procStr ? `، پس از ${procStr}` : ''}${timelineBadge ? ` (${timelineBadge})` : ''}؛ در حال حاضر وضعیت عمومی و همودینامیک ${v.hemodynamics || 'پایدار'} داشته و در سیر ${a.clinicalStatus || 'بهبودی و پیگیری'} قرار دارد.`;
  out.push(`- ${autoAssessment}\n`);

  // 5. P — Plan
  out.push(`#### P — Plan (پلن درمانی و اقدامات امروز)`);
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
