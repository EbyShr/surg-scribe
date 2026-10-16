import { SURGICAL_SCHEMA } from './schema.js';

export function normalizePersianClinicalText(text) {
  if (!text) return '';
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\b(می|نمی)\s+/g, '$1\u200c') // اصلاح نیم‌فاصله افعال
    .replace(/\s+ها\b/g, '\u200cها')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRegionLabel(regionId) {
  const found = SURGICAL_SCHEMA.abdominalRegions.find((r) => r.id === regionId);
  return found ? found.label : regionId;
}

function getRadiationLabel(radId) {
  const found = SURGICAL_SCHEMA.radiationSites.find((r) => r.id === radId);
  return found ? found.label : radId;
}

export function generateClinicalNote(state) {
  const lines = [];
  const demo = state.demographics || {};
  const cc = state.cc || {};
  const hpi = state.hpi || {};

  // 1. Header & CC
  const genderStr = demo.gender === 'female' ? 'خانم' : 'آقای';
  const ageStr = demo.age ? `${demo.age} ساله` : '[سن نامشخص]';
  const maritalStr = demo.marital ? `، ${demo.marital}` : '';
  const cityStr = demo.city ? `، اهل و ساکن ${normalizePersianClinicalText(demo.city)}` : '';
  const sourceStr = demo.informant ? ` (منبع شرح‌حال: ${demo.informant}، قابل اعتماد)` : '';

  lines.push(`### ۱. مشخصات دموگرافیک و شکایت اصلی (CC)`);
  if (cc.pathway === 'clinic_referral') {
    lines.push(
      `بیمار ${genderStr} ${ageStr}${maritalStr}${cityStr} که با تشخیص اولیه **«${normalizePersianClinicalText(cc.establishedDiagnosis || 'نامشخص')}»** و با نامه بستری استاد **${normalizePersianClinicalText(cc.referringAttending || 'محترم بخش')}** از درمانگاه جراحی جهت **${normalizePersianClinicalText(cc.plannedProcedure || 'تکمیل بررسی و اقدام جراحی الکتیو')}** در این بخش بستری شده‌اند.${sourceStr}`
    );
    if (cc.patientQuote) {
      lines.push(`- **شکایت اولیه از زبان بیمار:** «${normalizePersianClinicalText(cc.patientQuote)}»`);
    }
  } else {
    lines.push(
      `بیمار ${genderStr} ${ageStr}${maritalStr}${cityStr} که با شکایت اصلی **«${normalizePersianClinicalText(cc.patientQuote || cc.selectedCategoryLabel || 'درد شکم')}»** از ${normalizePersianClinicalText(hpi.duration || 'مدت اخیر')} قبل به اورژانس/بخش مراجعه کرده‌اند.${sourceStr}`
    );
  }

  // 2. HPI
  lines.push(`\n### ۲. شرح بیماری فعلی (HPI)`);
  const attrs = [];
  if (hpi.onset) attrs.push(`نحوه شروع: ${hpi.onset}`);
  if (hpi.course) attrs.push(`سیر: ${hpi.course}`);
  if (hpi.character) attrs.push(`ماهیت: ${hpi.character}`);
  if (hpi.severity) attrs.push(`شدت (NRS): ${hpi.severity}/10`);
  if (attrs.length > 0) {
    lines.push(`- **مشخصات علامت محوری (OLDCARTS):** ${attrs.join(' | ')}`);
  }

  // الگوی فضایی-زمانی درد شکم (Spatial-Temporal Pain Mapping)
  if (hpi.spatialPattern) {
    let locStatement = '';
    const selectedRegLabels = (hpi.selectedRegions || []).map(getRegionLabel);
    const initialRegLabels = (hpi.initialRegions || []).map(getRegionLabel);
    const currentRegLabels = (hpi.currentRegions || []).map(getRegionLabel);

    switch (hpi.spatialPattern) {
      case 'localized':
        if (selectedRegLabels.length > 0) {
          locStatement = `محل درد در ناحیه ${selectedRegLabels.join(' و ')} است.`;
        }
        break;
      case 'generalized_pure':
        locStatement = `درد به صورت ژنرالیزه و یکنواخت در کل شکم بیان می‌شود.`;
        break;
      case 'generalized_predominant':
        if (selectedRegLabels.length > 0) {
          locStatement = `درد به صورت ژنرالیزه در کل شکم با ارجحیت و حداکثر شدت در ناحیه ${selectedRegLabels.join(' و ')} بیان می‌شود.`;
        } else {
          locStatement = `درد به صورت ژنرالیزه در کل شکم بیان می‌شود.`;
        }
        break;
      case 'localized_to_generalized':
        const initStr = initialRegLabels.length ? initialRegLabels.join(' و ') : 'نقطه اولیه';
        locStatement = `درد ابتدا به صورت لوکالیزه در ناحیه ${initStr} آغاز شده و سپس به کل شکم (ژنرالیزه) گسترش یافته است.`;
        break;
      case 'migratory_shifting':
        const startStr = initialRegLabels.length ? initialRegLabels.join(' و ') : 'نقطه آغازین';
        const endStr = currentRegLabels.length ? currentRegLabels.join(' و ') : 'نواحی ثانویه';
        locStatement = `درد دارای الگوی مهاجر (Shifting) بوده؛ به طوری که ابتدا در ناحیه ${startStr} شروع شده و سپس به ناحیه ${endStr} تغییر محل داده است.`;
        break;
      default:
        if (selectedRegLabels.length > 0) {
          locStatement = `محل درد: ${selectedRegLabels.join('، ')}.`;
        }
    }
    if (locStatement) {
      lines.push(`- **محل و الگوی گسترش درد:** ${locStatement}`);
    }
  }

  // محل‌های انتشار درد
  if (hpi.radiation && hpi.radiation.length > 0) {
    const radList = hpi.radiation.map(getRadiationLabel);
    lines.push(`- **انتشار درد:** ${radList.join(' ، ')}.`);
  }

  // تفکیک نکات مثبت و منفی کلیدی در HPI با توضیحات درجا
  const allHpiChips = SURGICAL_SCHEMA.chiefComplaints.flatMap((c) =>
    (c.symptomGroups || []).flatMap((g) => g.chips)
  );
  const hpiPos = [];
  const hpiNeg = [];

  for (const [chipId, itemData] of Object.entries(hpi.symptoms || {})) {
    const stateVal = typeof itemData === 'object' ? itemData.state : itemData;
    const detail = typeof itemData === 'object' ? itemData.detail : '';
    const found = allHpiChips.find((x) => x.id === chipId);
    const label = found ? found.label : chipId;

    if (stateVal === 1) {
      hpiPos.push(detail && detail.trim() ? `${label} (${normalizePersianClinicalText(detail)})` : label);
    } else if (stateVal === -1) {
      hpiNeg.push(label);
    }
  }

  if (hpiPos.length > 0) {
    lines.push(`- **علائم همراه مثبت (Pertinent Positives):** بیمار ذکر از ${hpiPos.join('، ')} دارد.`);
  }
  if (hpiNeg.length > 0) {
    lines.push(`- **علائم منفی کلیدی (Pertinent Negatives):** بیمار وجود ${hpiNeg.join('، ')} را ذکر نمی‌کند.`);
  }
  if (hpi.preAdmissionWorkup) {
    lines.push(`- **سیر اقدامات تشخیصی پیش از بستری:** ${normalizePersianClinicalText(hpi.preAdmissionWorkup)}`);
  }
  if (hpi.systemGapNote) {
    lines.push(`- **موارد تکمیلی خارج از لیست (HPI):** ${normalizePersianClinicalText(hpi.systemGapNote)}`);
  }
  if (hpi.narrativeNote) {
    lines.push(`- **توضیحات تکمیلی HPI:** ${normalizePersianClinicalText(hpi.narrativeNote)}`);
  }

  // 3. PMH / PSH / HH
  lines.push(`\n### ۳. سوابق پزشکی، جراحی و بستری (PMH / PSH / HH)`);
  const pmhPos = [];
  const pmhNeg = [];
  for (const [id, itemData] of Object.entries(state.pmh?.items || {})) {
    const st = typeof itemData === 'object' ? itemData.state : itemData;
    const detail = typeof itemData === 'object' ? itemData.detail : '';
    const def = SURGICAL_SCHEMA.pmhItems.find((p) => p.id === id);
    const label = def ? def.label : id;

    if (st === 1) {
      pmhPos.push(detail && detail.trim() ? `${label} (${normalizePersianClinicalText(detail)})` : label);
    } else if (st === -1) {
      pmhNeg.push(label);
    }
  }

  const pmhPosText = pmhPos.length ? pmhPos.join('، ') : 'سابقه بیماری داخلی مثبت خاصی را ذکر نمی‌کند';
  lines.push(`- **سوابق بیماری‌های داخلی مثبت (PMH):** ${pmhPosText}.`);
  if (pmhNeg.length > 0) {
    lines.push(`- **منفی‌های کلیدی PMH:** بیمار سابقه ${pmhNeg.join('، ')} را ذکر نمی‌کند.`);
  }
  if (state.pmh?.systemGapNote) {
    lines.push(`- **سایر بیماری‌های زمینه‌ای خارج از لیست:** ${normalizePersianClinicalText(state.pmh.systemGapNote)}`);
  }
  lines.push(`- **سوابق جراحی قبلی (PSH):** ${state.psh?.note ? normalizePersianClinicalText(state.psh.note) : 'سابقه عمل جراحی قبلی و عوارض بیهوشی را ذکر نمی‌کند.'}`);
  if (state.psh?.systemGapNote) {
    lines.push(`- **سایر سوابق جراحی خارج از لیست:** ${normalizePersianClinicalText(state.psh.systemGapNote)}`);
  }
  lines.push(`- **سوابق بستری قبلی (HH):** ${state.hh?.note ? normalizePersianClinicalText(state.hh.note) : 'سابقه بستری غیرجراحی قبلی یا دریافت فرآورده خونی ندارد.'}`);
  if (state.hh?.systemGapNote) {
    lines.push(`- **سایر سوابق بستری خارج از لیست:** ${normalizePersianClinicalText(state.hh.systemGapNote)}`);
  }

  // 4. DH / AH / SH / FH
  lines.push(`\n### ۴. سوابق دارویی، حساسیت، عادات و خانوادگی (DH / AH / SH / FH)`);
  const highAlertActive = (state.dh?.highAlert || []).map((d) => {
    const details = [];
    if (d.lastDose) details.push(`آخرین دوز: ${d.lastDose}`);
    if (d.detail) details.push(d.detail);
    const detailStr = details.length ? ` [${details.join(' | ')}]` : '';
    return `${d.label}${detailStr}`;
  });
  const dhText = [
    ...(highAlertActive.length ? [`داروهای حساس جراحی: ${highAlertActive.join('، ')}`] : []),
    ...(state.dh?.note ? [normalizePersianClinicalText(state.dh.note)] : [])
  ].join(' | ') || 'مصرف داروی روتین خاصی را ذکر نمی‌کند.';
  lines.push(`- **سوابق دارویی (DH):** ${dhText}`);
  if (state.dh?.systemGapNote) {
    lines.push(`- **سایر داروهای مصرفی خارج از لیست:** ${normalizePersianClinicalText(state.dh.systemGapNote)}`);
  }

  const ahItems = (state.ah?.selected || []).map((item) => {
    if (typeof item === 'object') {
      return item.detail ? `${item.label} (${normalizePersianClinicalText(item.detail)})` : item.label;
    }
    return item;
  });
  const ahText = state.ah?.nkda
    ? 'سابقه حساسیت دارویی، غذایی، لاتکس یا ماده حاجب ندارد (NKDA).'
    : `${ahItems.join('، ')} ${state.ah?.note ? `(${normalizePersianClinicalText(state.ah.note)})` : ''}`.trim() || 'حساسیت خاصی ذکر نشد.';
  lines.push(`- **حساسیت‌ها (AH):** ${ahText}`);
  if (state.ah?.systemGapNote) {
    lines.push(`- **سایر حساسیت‌های خارج از لیست:** ${normalizePersianClinicalText(state.ah.systemGapNote)}`);
  }

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

  // 5. ROS (11 Systems)
  lines.push(`\n### ۵. بررسی سیستم‌ها (ROS)`);
  const rosPos = [];
  const rosNeg = [];
  const allRosItems = SURGICAL_SCHEMA.rosGroups.flatMap((g) => g.items);

  for (const [id, itemData] of Object.entries(state.ros?.items || {})) {
    const st = typeof itemData === 'object' ? itemData.state : itemData;
    const detail = typeof itemData === 'object' ? itemData.detail : '';
    const item = allRosItems.find((x) => x.id === id);
    const label = item ? item.label : id;

    if (st === 1) {
      rosPos.push(detail && detail.trim() ? `${label} (${normalizePersianClinicalText(detail)})` : label);
    } else if (st === -1) {
      rosNeg.push(label);
    }
  }

  lines.push(`- **یافته‌های مثبت ROS:** ${rosPos.length ? rosPos.join('، ') : 'نکته مثبت دیگری غیر از موارد HPI ندارد'}.`);
  lines.push(`- **یافته‌های منفی ROS:** ${rosNeg.length ? `عدم وجود ${rosNeg.join('، ')}` : 'سایر سیستم‌ها در بررسی اجمالی نکته پاتولوژیکی نداشتند'}.`);
  if (state.ros?.systemGapNote) {
    lines.push(`- **موارد خارج از لیست ROS:** ${normalizePersianClinicalText(state.ros.systemGapNote)}`);
  }

  // 6. PE
  lines.push(`\n### ۶. معاینه فیزیکی (Physical Examination)`);
  const v = state.pe?.vitals || {};
  lines.push(
    `- **علائم حیاتی (Vitals):** BP: ${v.bp || '—'} mmHg | PR: ${v.pr || '—'} /min | RR: ${v.rr || '—'} /min | T: ${v.temp || '—'} °C | SpO2: ${v.spo2 || '—'}% | وضعیت NPO: ${v.npo || 'نامشخص'}`
  );

  const allPeItems = Object.values(SURGICAL_SCHEMA.peFindings).flat();
  const pePos = [];
  const peNeg = [];

  for (const [id, itemData] of Object.entries(state.pe?.findings || {})) {
    const st = typeof itemData === 'object' ? itemData.state : itemData;
    const detail = typeof itemData === 'object' ? itemData.detail : '';
    const item = allPeItems.find((x) => x.id === id);
    const label = item ? item.label : id;

    if (st === 1) {
      pePos.push(detail && detail.trim() ? `${label} (${normalizePersianClinicalText(detail)})` : label);
    } else if (st === -1) {
      peNeg.push(label);
    }
  }

  if (pePos.length) lines.push(`- **یافته‌های مثبت معاینه:** ${pePos.join(' ، ')}.`);
  if (peNeg.length) lines.push(`- **یافته‌های منفی کلیدی معاینه (رد شده):** عدم وجود ${peNeg.join(' ، ')}.`);
  if (state.pe?.note) lines.push(`- **توضیحات تکمیلی معاینه:** ${normalizePersianClinicalText(state.pe.note)}`);
  if (state.pe?.systemGapNote) {
    lines.push(`- **یافته‌های خارج از لیست معاینه فیزیکی:** ${normalizePersianClinicalText(state.pe.systemGapNote)}`);
  }

  // 7. Paraclinics
  lines.push(`\n### ۷. یافته‌های پاراکلینیک (آزمایشگاه، تصویربرداری، اسکوپی و پاتولوژی)`);
  const labs = state.paraclinics?.labs || {};
  const enteredLabs = [];
  SURGICAL_SCHEMA.paraclinicLabDefinitions.forEach((def) => {
    const val = labs[def.id];
    if (val !== undefined && val !== '') {
      const num = parseFloat(val);
      let flag = '';
      if (!isNaN(num)) {
        if (num > def.max) flag = ' (↑ High)';
        else if (num < def.min) flag = ' (↓ Low)';
      }
      enteredLabs.push(`${def.label}: ${val} ${def.unit}${flag}`.trim());
    }
  });
  if (enteredLabs.length > 0) {
    lines.push(`- **آزمایشگاه و آنزیم‌ها (Labs):** ${enteredLabs.join(' | ')}`);
  }
  if (state.paraclinics?.labNote) {
    lines.push(`- **سایر آزمایش‌ها (ABG / U/A / کشت):** ${normalizePersianClinicalText(state.paraclinics.labNote)}`);
  }

  const modalities = state.paraclinics?.imagingReports || [];
  modalities.forEach((rep) => {
    if (rep.tags?.length || rep.summary) {
      const tagStrings = (rep.tags || []).map((t) => {
        if (typeof t === 'object') {
          return t.detail ? `${t.label} (${normalizePersianClinicalText(t.detail)})` : t.label;
        }
        return t;
      });
      const tagStr = tagStrings.length ? `[${tagStrings.join('، ')}] ` : '';
      lines.push(
        `- **${rep.modalityLabel}${rep.date ? ` (${rep.date})` : ''}:** ${tagStr}${normalizePersianClinicalText(rep.summary || '')}`
      );
    }
  });

  if (state.paraclinics?.systemGapNote) {
    lines.push(`- **یافته‌های خارج از لیست پاراکلینیک:** ${normalizePersianClinicalText(state.paraclinics.systemGapNote)}`);
  }

  // 8. Clinical Reasoning & Problem Representation
  lines.push(`\n### ۸. بازنمایی مسئله و استدلال بالینی (Problem Representation & Assessment)`);
  const sqs = (state.reasoning?.selectedSQs || []).join('، ');
  if (sqs) lines.push(`- **توصیفگرهای معنایی (Semantic Qualifiers):** ${sqs}`);
  if (state.reasoning?.problemRepresentation) {
    lines.push(`- **خلاصه بازنمایی مسئله:** ${normalizePersianClinicalText(state.reasoning.problemRepresentation)}`);
  }
  if (state.reasoning?.ddx) {
    lines.push(`- **تشخیص‌های افتراقی (DDx) و پلن اولیه:** ${normalizePersianClinicalText(state.reasoning.ddx)}`);
  }

  return lines.join('\n');
}
