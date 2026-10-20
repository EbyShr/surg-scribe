import { getCurrentLanguage, getLocalizedItemLabel } from './i18n.js';
import {
  SURGICAL_SCHEMA,
  LAB_PANELS,
  ROS_GROUPS_BILINGUAL,
  PMH_CATEGORIES,
  DH_CATEGORIES,
  PE_MANDATORY_PILLARS,
  PE_UNLOCKABLE_MODULES,
  HPI_UNLOCKABLE_MODULES,
  HPI_BASIC_SYMPTOMS
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
  ['demographics', 'admission'].forEach((sec) => {
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
  if (!found) return regionId;
  return lang === 'en' ? (found.code || found.label) : found.label;
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
  const pains = hpi.painList && hpi.painList.length > 0 ? hpi.painList : [];
  const out = [];

  if (isEn) {
    if (demo.fullName || demo.fatherName || demo.birthDate || demo.age) {
      const agePart = demo.age ? `${demo.age} y/o` : (demo.birthDate || '—');
      const genderLabel = demo.gender === 'female' ? 'Female' : demo.gender === 'male' ? 'Male' : (demo.gender || '—');
      out.push(
        `> **Patient Demographics:** Name: **${demo.fullName || '—'}** | Father's Name: **${demo.fatherName || '—'}** | Age: **${agePart}** | Sex: **${genderLabel}**\n`
      );
    }

    const ccText = cc.ccPhrase || cc.patientQuote || 'Acute Abdominal Pain';
    out.push(`### 1. Chief Complaint (CC)`);
    out.push(`- **"${ccText}"**`);

    out.push(`\n### 2. History of Present Illness (HPI)`);
    const narrativeSentences = [];

    const genderNoun = demo.gender === 'female' ? 'female' : demo.gender === 'male' ? 'male' : 'patient';
    const agePhrase = demo.age ? `${demo.age}-year-old` : '';
    let introSentence = `The patient is a ${agePhrase} ${genderNoun} presenting with chief complaint of "${ccText}".`;
    if (cc.pathway === 'clinic_referral') {
      introSentence += ` Admitted from surgical clinic under Dr. ${cc.attendingPhysician || 'Attending Surgeon'} for ${cc.plannedProcedure || 'planned surgical evaluation'}.`;
    } else if (cc.pathway === 'postop_complication') {
      introSentence += ` Presenting with acute post-operative complaint/complication following recent surgical intervention.`;
    } else {
      introSentence += ` Evaluated in the Emergency Department for acute surgical management.`;
    }
    narrativeSentences.push(introSentence);

    if (pains.length > 0) {
      pains.forEach((p, idx) => {
        const siteStr = p.site || (p.selectedRegions || []).map(getRegionLabel).join(', ') || p.title || `Focus ${idx + 1}`;
        let pSentence = `Pain focus #${idx + 1} (${siteStr}): Onset ${p.duration || 'recently'} prior to admission`;
        if (p.character) pSentence += `, characterized as ${p.character}`;
        if (p.course) pSentence += `, clinical course is ${p.course}`;
        if (p.timing) pSentence += `, timing pattern: ${p.timing}`;
        if (p.severity !== undefined && p.severity !== null && p.severity !== '') pSentence += `, severity rated ${p.severity}/10 on NRS`;
        pSentence += '.';
        if (p.radiationList && p.radiationList.length > 0) {
          pSentence += ` Radiation: ${p.radiationList.map(r => r.label).join(', ')}.`;
        }
        if (p.aggravating && p.aggravating.length > 0) {
          pSentence += ` Aggravated by: ${p.aggravating.join(', ')}.`;
        }
        if (p.relieving && p.relieving.length > 0) {
          pSentence += ` Relieved by: ${p.relieving.join(', ')}.`;
        }
        narrativeSentences.push(pSentence);
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
  const ccText = normalizePersianClinicalText(cc.ccPhrase || cc.patientQuote || 'درد شکم');
  out.push(`### ۱. شکایت اصلی (Chief Complaint - CC)`);
  out.push(`- **${ccText}**`);

  // 3. شرح بیماری فعلی (HPI) به صورت کاملاً روایی و جمله‌بندی‌شده
  out.push(`\n### ۲. شرح بیماری فعلی (History of Present Illness - HPI)`);
  const narrativeSentences = [];

  const genderWord = demo.gender === 'female' ? 'خانم' : demo.gender === 'male' ? 'آقای' : 'بیمار';
  const agePhrase = demo.age ? `${demo.age} ساله` : '';
  const maritalPhrase = demo.marital ? `، ${demo.marital}` : '';
  const cityPhrase = demo.city ? `، اهل و ساکن ${normalizePersianClinicalText(demo.city)}` : '';
  const jobPhrase = demo.occupation ? `، شغل ${normalizePersianClinicalText(demo.occupation)}` : '';

  // جمله اول: معرفی بیمار و زمینه مراجعه، ارجاع درمانگاه یا عوارض پس از عمل
  if (cc.pathway === 'clinic_referral') {
    let refSentence = `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که با شکایت «${ccText}» مراجعه نموده و با نامه بستری استاد محترم **${normalizePersianClinicalText(cc.referringAttending || cc.attendingPhysician || 'بخش جراحی')}**`;
    if (cc.establishedDiagnosis || cc.preliminaryDiagnosis) {
      refSentence += ` با تشخیص اولیه «${normalizePersianClinicalText(cc.establishedDiagnosis || cc.preliminaryDiagnosis)}»`;
    }
    if (cc.plannedProcedure) {
      refSentence += ` جهت انجام «${normalizePersianClinicalText(cc.plannedProcedure)}»`;
    }
    refSentence += ` از درمانگاه جراحی در این بخش بستری شده‌اند.`;
    narrativeSentences.push(refSentence);
  } else if (cc.pathway === 'postop_complication') {
    narrativeSentences.push(
      `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که به دنبال عمل جراحی اخیر، با شکایت «${ccText}» به این مرکز مراجعه کرده‌اند.`
    );
  } else {
    let admSentence = `بیمار ${genderWord} ${agePhrase}${maritalPhrase}${cityPhrase}${jobPhrase} هستند که با شکایت اصلی «${ccText}» به اورژانس/بخش جراحی مراجعه نموده‌اند.`;
    if (cc.attendingPhysician) {
      admSentence += ` تحت نظر استاد محترم **${normalizePersianClinicalText(cc.attendingPhysician)}**`;
    }
    if (cc.preliminaryDiagnosis) {
      admSentence += ` با تشخیص احتمالی اولیه «${normalizePersianClinicalText(cc.preliminaryDiagnosis)}»`;
    }
    if (cc.plannedProcedure) {
      admSentence += ` جهت بررسی و تصمیم‌گیری در خصوص «${normalizePersianClinicalText(cc.plannedProcedure)}» پذیرش شدند.`;
    }
    narrativeSentences.push(admSentence);
  }

  // نمایش کانون‌های درد
  if (pains.length > 0) {
    if (pains.length === 1) {
      const siteStr = pains[0].site || (pains[0].selectedRegions || []).map(getRegionLabel).join(' و ');
      if (siteStr) {
        narrativeSentences.push(`- **کانون درد گزارش‌شده:** ${siteStr}`);
      }
    } else {
      narrativeSentences.push(`- **کانون‌های درد گزارش‌شده:**`);
      pains.forEach((p, idx) => {
        const siteStr = p.site || (p.selectedRegions || []).map(getRegionLabel).join(' و ') || p.title || `کانون ${idx + 1}`;
        narrativeSentences.push(`  * **کانون ${idx + 1}: ${siteStr}**`);
      });
    }
  }

  // توصیف روایی تک‌تک کانون‌های درد (Pain Episodes)
  pains.forEach((p, idx) => {
    const siteName = p.site || (p.selectedRegions || []).map(getRegionLabel).join(' و ') || p.title || `کانون ${idx + 1}`;
    const prefix = pains.length > 1
      ? (idx === 0 ? `در بررسی کانون اول (${siteName})، درد بیمار ` : `همچنین در خصوص کانون دوم (${siteName})، درد `)
      : 'به گفته بیمار، درد ';
    const segments = [];

    if (p.duration) segments.push(`از ${normalizePersianClinicalText(p.duration)} قبل`);
    if (p.onset) segments.push(`با ${p.onset}`);
    segments.push('آغاز شده است');

    let locSentence = '';
    const regNames = (p.selectedRegions || []).map(getRegionLabel).join(' و ');
    if (p.spatialPattern === 'localized' && regNames) {
      locSentence = `در ناحیه ${regNames} لوکالیزه بوده`;
    } else if (p.spatialPattern === 'generalized_predominant' && regNames) {
      locSentence = `در کل شکم با ارجحیت و حداکثر شدت در ناحیه ${regNames} احساس شده`;
    } else if (p.spatialPattern === 'localized_to_generalized') {
      const initNames = (p.initialRegions || []).map(getRegionLabel).join(' و ');
      locSentence = `ابتدا در ناحیه ${initNames || 'نقطه اولیه'} شروع شده و سپس به کل شکم گسترش یافته`;
    } else if (p.spatialPattern === 'migratory_shifting') {
      const initNames = (p.initialRegions || []).map(getRegionLabel).join(' و ');
      const curNames = (p.currentRegions || []).map(getRegionLabel).join(' و ');
      locSentence = `الگوی مهاجر (Shifting) داشته و از ناحیه ${initNames || 'محل اولیه'} به ناحیه ${curNames || 'محل ثانویه'} تغییر مکان داده`;
    } else if (p.site) {
      locSentence = `در ناحیه ${normalizePersianClinicalText(p.site)} احساس شده`;
    } else if (regNames) {
      locSentence = `در ناحیه ${regNames} احساس شده`;
    }

    const qualParts = [];
    if (locSentence) qualParts.push(locSentence);
    if (p.character) qualParts.push(`ماهیت ${p.character}`);
    if (p.course) qualParts.push(`سیر ${p.course}`);
    if (p.timing) qualParts.push(`الگوی زمانی ${p.timing}`);

    let painParagraph = `${prefix}${segments.join(' ')}`;
    if (qualParts.length > 0) {
      painParagraph += `؛ این درد ${qualParts.join('، ')} دارد`;
    }
    if (p.severity !== undefined && p.severity !== null && p.severity !== '') {
      painParagraph += ` و شدت آن توسط بیمار ${p.severity} از ۱۰ توصیف می‌شود`;
    }
    painParagraph += '.';

    // انتشار، تشدید و تسکین به صورت جمله روایی
    const modSentences = [];
    if (p.radiationList && p.radiationList.length > 0) {
      const radStr = p.radiationList.map((r) => (r.detail ? `${r.label || r} (${normalizePersianClinicalText(r.detail)})` : (r.label || r))).join(' و ');
      modSentences.push(`درد مذکور به ${radStr} انتشار دارد`);
    } else if (p.radiation && Array.isArray(p.radiation) && p.radiation.length > 0) {
      const radStr = p.radiation.map((r) => (typeof r === 'object' ? `${r.label || r.id} (${r.detail || ''})` : r)).join(' و ');
      modSentences.push(`درد مذکور به ${radStr} انتشار دارد`);
    } else if (typeof p.radiation === 'string' && p.radiation.trim()) {
      modSentences.push(`درد مذکور به ${normalizePersianClinicalText(p.radiation)} انتشار دارد`);
    } else if (p.noRadiation) {
      modSentences.push(`درد به جایی انتشار ندارد`);
    }

    if (p.aggravating) {
      const aggText = Array.isArray(p.aggravating) ? p.aggravating.join('، ') : String(p.aggravating).trim();
      if (aggText) {
        modSentences.push(`با ${aggText} تشدید می‌شود`);
      }
    }
    if (p.relieving) {
      const relText = Array.isArray(p.relieving) ? p.relieving.join('، ') : String(p.relieving).trim();
      if (relText) {
        modSentences.push(`با ${relText} بهبود نسبی می‌یابد`);
      }
    }
    if (modSentences.length > 0) {
      painParagraph += ' ' + modSentences.join(' و ') + '.';
    }

    narrativeSentences.push(painParagraph);
  });

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
    let symLine = `- **علائم گوارشی (GI Symptoms) و عمومی:** `;
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
      } else {
        narrativeSentences.push(`- **${mod.title}:** بررسی شد؛ فاقد علامت غیرطبیعی.`);
      }
    }
  });

  if (demo.informant) {
    narrativeSentences.push(`(منبع اخذ شرح‌حال: ${demo.informant}، با قابلیت اعتماد مناسب).`);
  }

  out.push(narrativeSentences.join('\n'));
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

    const dhRows = state.dh?.drugs || [];
    if (dhRows.length > 0) {
      const drugList = dhRows.map(d => `${d.name || ''} ${d.dose || ''} ${d.sig || ''} ${d.note ? '(' + d.note + ')' : ''}`.trim()).join(', ');
      lines.push(`- **Current Medications:** ${drugList}`);
    } else {
      lines.push(`- **Current Medications:** Denies regular prescription medication use.`);
    }

    const shState = state.sh || {};
    const shParts = [];
    if (shState.smoking) shParts.push(`Tobacco: ${shState.smoking}`);
    if (shState.alcohol) shParts.push(`Alcohol: ${shState.alcohol}`);
    if (shState.substance) shParts.push(`Substances: ${shState.substance}`);
    lines.push(`- **Social History:** ${shParts.length > 0 ? shParts.join('; ') : 'Non-contributory (denies tobacco, alcohol or substance use).'}`);

    const fhState = state.fh || {};
    lines.push(`- **Family History:** ${fhState.noncontributory ? 'Non-contributory (denies familial GI cancers or early deaths).' : (fhState.notes || 'Non-contributory.')}`);

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

    // 7. Paraclinics
    lines.push(`\n### 7. Diagnostic Studies & Paraclinics`);
    const labs = state.paraclinics?.labs || {};
    const labEntries = Object.entries(labs).filter(([k, v]) => v && String(v).trim());
    if (labEntries.length > 0) {
      lines.push(`- **Laboratory Investigations:** ${labEntries.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
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
  const activeDrugsList = [];

  // پیمایش دسته‌بندی ۵ گانه DH
  DH_CATEGORIES.forEach((cat) => {
    const catDrugsState = dhState.categories?.[cat.id]?.drugs || {};
    cat.drugs.forEach((drug) => {
      const entry = catDrugsState[drug.id];
      if (entry && (entry.active || entry === true)) {
        const doseStr = entry.dose ? `دوز: ${normalizePersianClinicalText(entry.dose)}` : `دوز: ${drug.defaultDose}`;
        const sigStr = entry.sig ? `طریقه: ${entry.sig}` : '';
        const noteStr = entry.note ? `ملاحظات: ${normalizePersianClinicalText(entry.note)}` : '';
        const parts = [doseStr, sigStr, noteStr].filter(Boolean);
        activeDrugsList.push(`**${drug.label}** (${parts.join(' | ')})`);
      }
    });
  });

  // داروهای دستی خارج از لیست
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

  // SH
  const packYear = (state.sh?.cigsPerDay && state.sh?.yearsSmoked)
    ? ((Number(state.sh.cigsPerDay) / 20) * Number(state.sh.yearsSmoked)).toFixed(1)
    : null;
  const shParts = [];
  if (demo.occupation) shParts.push(`شغل: ${normalizePersianClinicalText(demo.occupation)}`);
  if (packYear) shParts.push(`مصرف سیگار به میزان ${packYear} Pack-Year`);
  else shParts.push('عدم مصرف سیگار');
  if (state.sh?.opium) shParts.push(`مصرف اپیوم/مواد: ${normalizePersianClinicalText(state.sh.opium)}`);
  else shParts.push('عدم مصرف اپیوم و الکل');
  if (state.sh?.note) shParts.push(normalizePersianClinicalText(state.sh.note));
  lines.push(`- **سوابق اجتماعی و عادات (SH):** ${shParts.join(' | ')}.`);
  if (state.sh?.systemGapNote) {
    lines.push(`- **سایر عادات و سوابق اجتماعی خارج از لیست:** ${normalizePersianClinicalText(state.sh.systemGapNote)}`);
  }

  // FH
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
      const modalityName = rep.modality === 'US' || rep.modalityLabel?.includes('US') ? 'سونوگرافی (US)'
        : rep.modality === 'CT' || rep.modalityLabel?.includes('CT') ? 'سی‌تی اسکن (CT)'
        : rep.modality === 'MRI_MRCP' || rep.modalityLabel?.includes('MRI') ? 'MRI / MRCP'
        : rep.modality === 'CXR_AXR' || rep.modalityLabel?.includes('CXR') ? 'گرافی قفسه سینه / شکم (CXR / AXR)'
        : rep.modality === 'EGD' ? 'آندوسکوپی فوقانی (EGD)'
        : rep.modality === 'Colonoscopy' ? 'کولونوسکوپی (Colonoscopy)'
        : rep.modality === 'Laryngoscopy' ? 'لارنگوسکوپی (Laryngoscopy)'
        : rep.modality === 'Pathology_FNA' ? 'پاتولوژی و FNA'
        : (rep.modalityLabel || rep.modality || 'تصویربرداری');

      const tagStrings = (rep.tags || []).map((t) => {
        if (typeof t === 'object') {
          return t.detail ? `${t.label} (${normalizePersianClinicalText(t.detail)})` : t.label;
        }
        return t;
      });
      const tagStr = tagStrings.length ? `[${tagStrings.join('، ')}] ` : '';
      const content = rep.findings || rep.summary || '';
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

  const firstPain = pains[0];
  if (firstPain && firstPain.selectedRegions && firstPain.selectedRegions.length > 0) {
    const regLabels = firstPain.selectedRegions.map(getRegionLabel);
    mainComplaint += ` در ناحیه ${regLabels.join(' و ')}`;
  }

  const durationStr = (firstPain && firstPain.duration) || hpi.duration || 'مدت اخیر';

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
