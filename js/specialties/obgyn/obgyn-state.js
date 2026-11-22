/**
 * MedHistorism v3.1 — Ob/Gyn Clinical State Schema, Calendar Engine & Guardrails
 * 100% Pure ES Module (Node-safe, Zero DOM Access, Zero Emojis)
 */

import { OBGYN_SS_FIVE_IDS } from './obgyn-data.js';

export function normalizeDigits(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function div(a, b) {
  return ~~(a / b);
}

function mod(a, b) {
  return a - ~~(a / b) * b;
}

const JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    throw new Error(`Invalid Jalali year: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

export function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

export function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm = 0;
  let jd = 0;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd));
}

export function gregorianToJalali(gy, gm, gd) {
  return d2j(g2d(gy, gm, gd));
}

export function parseClinicalDate(dateStr, calendarHint = 'auto') {
  const clean = normalizeDigits(dateStr).trim();
  if (!clean) return null;
  const m = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const isJalali = calendarHint === 'jalali' || (calendarHint === 'auto' && y >= 1300 && y <= 1550);
  if (isJalali) {
    if (y < 1300 || y > 1550) return null;
    try {
      const jdn = j2d(y, mo, d);
      const g = d2g(jdn);
      return { jdn, calendar: 'jalali', jy: y, jm: mo, jd: d, ...g };
    } catch (_) {
      return null;
    }
  }
  if (y < 1900 || y > 2200) return null;
  const jdn = g2d(y, mo, d);
  const j = d2j(jdn);
  return { jdn, calendar: 'gregorian', gy: y, gm: mo, gd: d, ...j };
}

export function formatJdnDate(jdn, calendar = 'jalali') {
  if (!Number.isFinite(jdn)) return '';
  if (calendar === 'gregorian') {
    const g = d2g(jdn);
    return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
  }
  const j = d2j(jdn);
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function formatGaTuple(totalDays, isEn = false) {
  if (!Number.isFinite(totalDays) || totalDays < 0) return null;
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return {
    weeks,
    days,
    totalDays,
    code: `${weeks}W, ${days}d`,
    fa: `${weeks} هفته و ${days} روز (${weeks}W, ${days}d)`,
    en: `${weeks}W, ${days}d`
  };
}

/**
 * Triple-Anchor Gestational Age (LMP + NT + Last Sono) & ACOG Redating Engine
 */
export function calculateTripleGestationalAge(gestationalDating = {}, refDateOverride = null) {
  const gd = gestationalDating || {};
  const cal = gd.lmpCalendar === 'gregorian' ? 'gregorian' : 'jalali';

  let refJdn;
  if (refDateOverride) {
    const parsedRef = parseClinicalDate(refDateOverride, 'auto');
    refJdn = parsedRef ? parsedRef.jdn : null;
  } else if (gd.assessmentDate) {
    const parsedAssess = parseClinicalDate(gd.assessmentDate, 'auto');
    refJdn = parsedAssess ? parsedAssess.jdn : null;
  }
  if (!Number.isFinite(refJdn)) {
    const now = new Date();
    refJdn = g2d(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  const cycleLen = parseInt(normalizeDigits(gd.cycleLengthDays), 10);
  const cycleAdj = Number.isFinite(cycleLen) && cycleLen >= 21 && cycleLen <= 45 ? (cycleLen - 28) : 0;

  let gaByLmp = null;
  let eddByLmp = '';
  let effectiveLmpJdn = null;

  const lmpParsed = parseClinicalDate(gd.lmpDate, cal);
  if (lmpParsed && gd.isReliableLmp !== false) {
    effectiveLmpJdn = lmpParsed.jdn + cycleAdj;
    const lmpDays = refJdn - effectiveLmpJdn;
    if (lmpDays >= 0 && lmpDays <= 322) {
      gaByLmp = formatGaTuple(lmpDays);
      eddByLmp = formatJdnDate(effectiveLmpJdn + 280, cal);
    }
  }

  let gaByNt = null;
  let eddByNt = '';
  let ntScanDaysAtScan = null;
  let ntScanJdn = null;
  const ntParsed = parseClinicalDate(gd.ntScanDate, 'auto');
  const ntW = parseInt(normalizeDigits(gd.ntGaWeeks), 10);
  const ntD = parseInt(normalizeDigits(gd.ntGaDays || '0'), 10);
  if (ntParsed && Number.isFinite(ntW) && ntW >= 5 && ntW <= 42) {
    ntScanDaysAtScan = ntW * 7 + (Number.isFinite(ntD) ? ntD : 0);
    ntScanJdn = ntParsed.jdn;
    const gaNowNt = ntScanDaysAtScan + (refJdn - ntScanJdn);
    if (gaNowNt >= 0 && gaNowNt <= 322) {
      gaByNt = formatGaTuple(gaNowNt);
      eddByNt = formatJdnDate(ntScanJdn + (280 - ntScanDaysAtScan), cal);
    }
  }

  let gaByLastSono = null;
  let lastSonoAtScan = null;
  let lastSonoExtrapolatedDays = null;
  const lsParsed = parseClinicalDate(gd.lastSonoDate, 'auto');
  const lsW = parseInt(normalizeDigits(gd.lastSonoGaWeeks), 10);
  const lsD = parseInt(normalizeDigits(gd.lastSonoGaDays || '0'), 10);
  if (lsParsed && Number.isFinite(lsW) && lsW >= 5 && lsW <= 42) {
    const scanDays = lsW * 7 + (Number.isFinite(lsD) ? lsD : 0);
    lastSonoAtScan = formatGaTuple(scanDays);
    lastSonoExtrapolatedDays = scanDays + (refJdn - lsParsed.jdn);
    if (lastSonoExtrapolatedDays >= 0 && lastSonoExtrapolatedDays <= 322) {
      gaByLastSono = formatGaTuple(lastSonoExtrapolatedDays);
    }
  }

  // ACOG / Williams Redating Evaluation
  let redatingAlert = null;
  let officialSource = 'LMP';
  let officialGa = gaByLmp;
  let officialEdd = eddByLmp;

  if (gaByNt && gaByLmp && Number.isFinite(effectiveLmpJdn) && Number.isFinite(ntScanJdn)) {
    const lmpGaAtNtScan = ntScanJdn - effectiveLmpJdn;
    const diffDays = Math.abs(lmpGaAtNtScan - ntScanDaysAtScan);
    let threshold = 7;
    if (ntScanDaysAtScan <= 62) threshold = 5;
    else if (ntScanDaysAtScan <= 111) threshold = 7;
    else if (ntScanDaysAtScan <= 153) threshold = 10;
    else if (ntScanDaysAtScan <= 195) threshold = 14;
    else threshold = 21;

    if (ntScanDaysAtScan >= 196 && diffDays > 21) {
      redatingAlert = {
        shouldRedate: false,
        warningType: 'growth_discrepancy',
        discrepancyDays: diffDays,
        messageFa: `اختلاف ${diffDays} روزه در سه‌ماهه سوم (>۲۱ روز): به جای تغییر تاریخ (Redating)، بیمار را از نظر FGR/IUGR یا ماکروزومی بررسی کنید.`,
        messageEn: `3rd-trimester discrepancy of ${diffDays}d (>21d): Evaluate for FGR/IUGR or macrosomia rather than routine redating.`
      };
    } else if (diffDays > threshold) {
      officialSource = 'NT';
      officialGa = gaByNt;
      officialEdd = eddByNt;
      redatingAlert = {
        shouldRedate: true,
        warningType: 'redated_to_us',
        discrepancyDays: diffDays,
        messageFa: `اختلاف ${diffDays} روزه بین LMP و سونوگرافی سه‌ماهه اول (> ${threshold} روز): بر اساس معیار ACOG، سن بارداری و EDD رسمی بر مبنای سونوگرافی NT/سه‌ماهه اول (${gaByNt.code}) اصلاح (Redate) شد.`,
        messageEn: `Discrepancy of ${diffDays}d between LMP and 1st-trimester ultrasound (>${threshold}d): Per ACOG criteria, official GA/EDD is redated to NT/1st-trimester ultrasound (${gaByNt.code}).`
      };
    } else {
      officialSource = 'LMP';
      officialGa = gaByLmp;
      officialEdd = eddByLmp;
      redatingAlert = {
        shouldRedate: false,
        warningType: 'concordant',
        discrepancyDays: diffDays,
        messageFa: `سن بارداری LMP و سونوگرافی NT هم‌خوانی دارند (اختلاف ${diffDays} روز <= ${threshold} روز)؛ معیار رسمی: LMP.`,
        messageEn: `LMP and NT ultrasound are concordant (diff ${diffDays}d <= ${threshold}d); official dating remains LMP.`
      };
    }
  } else if (gaByNt && !gaByLmp) {
    officialSource = 'NT';
    officialGa = gaByNt;
    officialEdd = eddByNt;
  } else if (!gaByNt && !gaByLmp && gaByLastSono) {
    officialSource = 'LastSono';
    officialGa = gaByLastSono;
  }

  // Additional 3rd-trimester growth discrepancy check between official GA and Last Sono
  if (officialGa && gaByLastSono && gaByLastSono.totalDays >= 196 && (!redatingAlert || redatingAlert.warningType === 'concordant')) {
    const lateDiff = Math.abs(officialGa.totalDays - gaByLastSono.totalDays);
    if (lateDiff > 21) {
      redatingAlert = {
        shouldRedate: false,
        warningType: 'growth_discrepancy',
        discrepancyDays: lateDiff,
        messageFa: `اختلاف ${lateDiff} روزه بین سن تقویمی رسمی و بیومتری آخرین سونوگرافی (>۲۱ روز): شک به محدودیت رشد (FGR/IUGR) یا ماکروزومی.`,
        messageEn: `Discrepancy of ${lateDiff}d between official GA and last ultrasound biometry (>21d): Evaluate for FGR/IUGR or macrosomia.`
      };
    }
  }

  return {
    calendar: cal,
    gaByLmp,
    gaByNt,
    gaByLastSono,
    lastSonoAtScan,
    eddByLmp,
    eddByNt,
    officialSource,
    officialGa,
    officialEdd,
    redatingAlert
  };
}

/**
 * Modified Bishop Score (0-13) supporting both -5..+5 [UNI] and -3..+3 [REF] station scales
 */
export function calculateBishopScore(obsMeasurements = {}) {
  const m = obsMeasurements || {};
  let score = 0;
  let assessedCount = 0;

  // 1. Dilation (cm)
  if (m.dilationCm !== '' && m.dilationCm !== null && m.dilationCm !== undefined) {
    const dil = parseFloat(normalizeDigits(m.dilationCm));
    if (Number.isFinite(dil)) {
      assessedCount += 1;
      if (dil >= 5) score += 3;
      else if (dil >= 3) score += 2;
      else if (dil >= 1) score += 1;
    }
  }

  // 2. Effacement (%)
  if (m.effacementPct !== '' && m.effacementPct !== null && m.effacementPct !== undefined) {
    const eff = parseFloat(normalizeDigits(m.effacementPct));
    if (Number.isFinite(eff)) {
      assessedCount += 1;
      if (eff >= 80) score += 3;
      else if (eff >= 60) score += 2;
      else if (eff >= 40) score += 1;
    }
  }

  // 3. Station (-5..+5 or -3..+3)
  if (m.stationValue !== '' && m.stationValue !== null && m.stationValue !== undefined) {
    const st = parseFloat(normalizeDigits(m.stationValue));
    if (Number.isFinite(st)) {
      assessedCount += 1;
      if (st >= 1) score += 3;
      else if (st >= -1) score += 2;
      else if (st === -2) score += 1;
      // <= -3 (including -5, -4, -3) scores 0 on both scales
    }
  }

  // 4. Consistency
  if (m.cervixConsistency) {
    assessedCount += 1;
    if (m.cervixConsistency === 'soft') score += 2;
    else if (m.cervixConsistency === 'medium') score += 1;
  }

  // 5. Position
  if (m.cervixPosition) {
    assessedCount += 1;
    if (m.cervixPosition === 'anterior') score += 2;
    else if (m.cervixPosition === 'mid') score += 1;
  }

  const status = score >= 8 ? 'favorable' : score <= 6 ? 'unfavorable' : 'intermediate';
  return {
    score,
    assessedCount,
    isComplete: assessedCount === 5,
    status,
    labelFa: score >= 8
      ? `Bishop = ${score} (مناسب جهت القای زایمان با اکسی‌توسین)`
      : score <= 6
      ? `Bishop = ${score} (نامناسب؛ نیازمند آماده‌سازی سرویکس / Ripening)`
      : `Bishop = ${score} (حد واسط)`,
    labelEn: score >= 8
      ? `Bishop = ${score} (Favorable for oxytocin induction)`
      : score <= 6
      ? `Bishop = ${score} (Unfavorable; requires cervical ripening)`
      : `Bishop = ${score} (Intermediate)`
  };
}

/**
 * Automatic NICHD 3-Tier Category & Pathological Variable Deceleration Evaluator (PDF 4)
 */
export function evaluateNichdCategory(fetalMonitoring = {}) {
  const fm = fetalMonitoring || {};
  const baseline = parseInt(normalizeDigits(fm.baselineBpm), 10);
  const dec = fm.decelerations || {};
  const flags = dec.variablePathologicalFlags || {};

  const hasPathologicalVariable =
    dec.type === 'Variable' && (flags.dropBelow70Bpm || flags.durationOver60Sec || flags.moreThan3In20Min);

  if (
    dec.cordCompressionPatternVariant === 'Sinusoidal' ||
    (fm.variability === 'Absent' && (
      (dec.isRecurrent && (dec.type === 'Late' || dec.type === 'Variable')) ||
      (Number.isFinite(baseline) && baseline < 110)
    ))
  ) {
    return {
      category: 'Category III',
      hasPathologicalVariable,
      labelFa: 'Category III (غیرطبیعی — نیازمند احیا و تصمیم فوری)',
      labelEn: 'Category III (Abnormal — requires intrauterine resuscitation & immediate delivery consideration)'
    };
  }

  const baselineNormal = Number.isFinite(baseline) && baseline >= 110 && baseline <= 160;
  const variabilityModerate = fm.variability === 'Moderate';
  const noBadDecels = dec.type === 'None' || dec.type === 'Early';

  if (baselineNormal && variabilityModerate && noBadDecels && !hasPathologicalVariable) {
    return {
      category: 'Category I',
      hasPathologicalVariable: false,
      labelFa: 'Category I (طبیعی و اطمینان‌بخش)',
      labelEn: 'Category I (Normal / Reassuring)'
    };
  }

  return {
    category: 'Category II',
    hasPathologicalVariable,
    labelFa: hasPathologicalVariable
      ? 'Category II (افت متغیر پاتولوژیک — نیازمند پایش مداوم و اقدام اصلاحی)'
      : 'Category II (بینابینی / نیازمند پایش و ارزیابی مجدد)',
    labelEn: hasPathologicalVariable
      ? 'Category II (Pathological Variable Decelerations — requires resuscitation & close surveillance)'
      : 'Category II (Indeterminate — requires continued surveillance)'
  };
}

/**
 * Automated Clinical Safety Guardrails (Section 7.4 Top 10 Pitfalls)
 */
export function evaluateObgynSafetyGuardrails(obgynState = {}) {
  const ob = obgynState || {};
  const idx = ob.obstetricIndex || {};
  const hpi = ob.ccAndHpi || {};
  const symptoms = hpi.symptoms || {};

  const virginLock = Boolean(idx.isVirgin);

  const bleedingPos = symptoms.obs_vaginal_bleeding?.state === 1;
  const previaTvContraindicated =
    ob.subMode === 'obstetrics' && (bleedingPos || hpi.selectedArchetype === 'OB-3');

  const csCount = parseInt(normalizeDigits(idx.CS || '0'), 10) || 0;
  const pCount = parseInt(normalizeDigits(idx.P || '0'), 10) || 0;
  const ndCount = parseInt(normalizeDigits(idx.ND || '0'), 10) || 0;

  const accretaDopplerMandatory = ob.subMode === 'obstetrics' && csCount > 0;
  const priorCsIndicationMissing = csCount > 0 && !(idx.priorCsIndications || '').trim();
  const ndCsMismatch = pCount > 0 && (ndCount + csCount !== pCount);

  const isRepro = idx.reproductiveStatus === 'reproductive';
  const gynBleedingOrPain =
    hpi.selectedArchetype === 'GYN-1' ||
    hpi.selectedArchetype === 'GYN-2' ||
    symptoms.gyn_vaginal_bleeding?.state === 1 ||
    symptoms.gyn_abdominal_pelvic_pain?.state === 1;
  const bhcgMandatory = ob.subMode === 'gynecology' && isRepro && gynBleedingOrPain;

  const ssUnassessedCount = OBGYN_SS_FIVE_IDS.filter((id) => {
    const st = symptoms[id]?.state;
    return st !== 1 && st !== -1;
  }).length;

  return {
    virginLock,
    previaTvContraindicated,
    accretaDopplerMandatory,
    priorCsIndicationMissing,
    ndCsMismatch,
    bhcgMandatory,
    ssUnassessedCount,
    messages: {
      virginFa: 'با توجه به Virgin بودن بیمار، معاینه با اسپکولوم، معاینه دودستی لگن و TV قفل شده است.',
      virginEn: 'Patient is Virgin: Internal speculum, bimanual pelvic, and digital vaginal (TV) exams are locked.',
      previaFa: 'هشدار بالینی: در خونریزی نیمه دوم/سوم بارداری، قبل از رد کردن جفت پرویا با سونوگرافی، معاینه دیجیتال واژینال (TV) مطلقاً کنتراندیکه است!',
      previaEn: 'WARNING: In 2nd/3rd-trimester vaginal bleeding, digital vaginal exam (TV) is strictly contraindicated until Placenta Previa is ruled out by ultrasound.',
      accretaFa: 'بیمار سابقه سزارین دارد؛ طبق فرم بخش، ذکر علت سزارین قبلی و نتیجه کالرداپلر آکرتای جفت الزامی است.',
      accretaEn: 'Patient has prior CS: Documenting prior CS indication and Placenta Accreta Color Doppler result is mandatory.',
      ndCsFa: 'جمع تعداد زایمان طبیعی (ND) و سزارین (CS) باید با Parity (P) تطابق داشته باشد.',
      ndCsEn: 'Sum of prior ND and CS should reconcile with total Parity (P).',
      bhcgFa: 'در خانم در سنین باروری با شکایت AUB یا درد لگن، درخواست تیتر β-hCG جهت رد حاملگی/EP اولین آزمایش الزامی است.',
      bhcgEn: 'Mandatory #1 Lab Reminder: Order serum Beta-hCG to rule out pregnancy / ectopic pregnancy.'
    }
  };
}

export function createDefaultObgynState() {
  return {
    subMode: 'obstetrics', // 'obstetrics' | 'gynecology' | 'soape'
    activeTab: 'admission',
    obstetricIndex: {
      G: '',
      P: '',
      L: '',
      D: '',
      Ab: '',
      IUFD: '',
      EP: '',
      Mole: '',
      expandZeroIndexFields: false,
      ND: '',
      CS: '',
      priorCsIndications: '',
      isVirgin: false,
      maritalStatus: 'married',
      marriageDurationYears: '',
      reproductiveStatus: 'pregnant',
      menopauseAge: '',
      maternalBgRh: '',
      paternalBgRh: '',
      indirectCoombsRhogam: '',
      currentFetalCount: 1,
      chorionicity: ''
    },
    gestationalDating: {
      lmpDate: '',
      lmpCalendar: 'jalali',
      isReliableLmp: true,
      cycleLengthDays: 28,
      ntScanDate: '',
      ntGaWeeks: '',
      ntGaDays: '',
      lastSonoDate: '',
      lastSonoGaWeeks: '',
      lastSonoGaDays: '',
      assessmentDate: ''
    },
    ccAndHpi: {
      ccText: '',
      selectedArchetype: '',
      duration: '',
      archetypeFields: {},
      symptoms: {}, // id -> { state: 1 | -1, modifiers: [], detail: '' }
      narrativeExtra: ''
    },
    pastObstetricHistory: {
      priorComplicationFlags: {
        priorIugr: false,
        priorPreeclampsia: false,
        priorPph: false,
        priorPretermLabor: false,
        priorGdm: false,
        priorPlacentaAccretaOrPrevia: false,
        priorShoulderDystociaOrMacrosomia: false,
        priorNicuOrAnomaly: false
      },
      pregnancies: []
    },
    menstrualHistory: {
      menarcheAge: '',
      isPostmenopausal: false,
      menopauseAge: '',
      hrtUse: false,
      lmpDate: '',
      lmpCertainty: 'reliable',
      pmpDate: '',
      regularity: 'regular',
      cycleIntervalDays: '',
      bleedingDurationDays: '',
      flowVolume: 'normal',
      padsPerDay: '',
      clotPassage: false,
      floodingOrNightChange: false,
      dysmenorrhea: 'none',
      imb: false,
      pcb: false,
      pmsSymptoms: false
    },
    gynScreeningAndRecords: {
      contraception: {
        currentMethod: 'none',
        durationOfUse: '',
        priorMethodsAndSideEffects: ''
      },
      pahx: {
        hasPriorAnesthesia: false,
        anesthesiaTypes: [],
        complications: ''
      },
      priorPathologyAndCurettage: {
        hasPriorDncOrBiopsy: false,
        records: []
      },
      cervicalAndBreastScreening: {
        lastPapSmearDate: '',
        lastPapSmearResult: 'انجام نشده',
        hpvTestStatus: 'انجام نشده',
        priorColposcopyResult: '',
        lastMammographyOrBreastUsDate: '',
        lastMammographyBirads: ''
      }
    },
    antenatalCareChecklist: {
      careRegularity: '',
      firstTrimesterScreening: {
        ntScanDone: false,
        ntDate: '',
        ntMeasurementMm: '',
        nasalBone: '',
        doubleMarkerRisk: ''
      },
      secondTrimesterScreening: {
        quadMarkerRisk: '',
        anomalyScanDone: false,
        anomalyScanDate: '',
        anomalyScanResult: '',
        amniocentesisOrNipt: ''
      },
      routineAntenatalLabsAudit: {
        gdmScreening75gOgtt: '',
        hemoglobinAndAnemia: '',
        plateletCount: '',
        viralMarkers: '',
        tshLevel: '',
        urineCulture: '',
        gbsSwab35to37w: ''
      },
      notableSonographicFindingsInPregnancy: {
        uterineFibroids: '',
        placentaPreviaHistory: '',
        cervicalLengthMm: ''
      },
      supplementsAndVaccines: {
        folicAcid: false,
        ferrousSulfate: false,
        calciumVitaminD: false,
        multivitamin: false,
        vaccines: ''
      }
    },
    pe: {
      vitals: {
        bp: '',
        bpRepeat: '',
        pr: '',
        rr: '',
        temp: '',
        urineDipstick: ''
      },
      obsMeasurements: {
        fhr: '',
        fhrQuadrant: '',
        fundalHeightCm: '',
        dilationCm: '',
        effacementPct: '',
        stationScale: '5',
        stationValue: '',
        cervixConsistency: '',
        cervixPosition: '',
        presentingPart: '',
        membranesStatus: '',
        amnioticFluidChar: ''
      },
      findings: {} // id -> { state: 1 | -1, detail: '' }
    },
    paraclinics: {
      lastObstetricUltrasound: {
        scanDate: '',
        fetalCountAndHeartBeat: '',
        presentation: '',
        placentalLocationAndGrade: '',
        amnioticFluidVolume: '',
        sonographicGa: '',
        efwGramsAndPercentile: '',
        placentaAccretaColorDoppler: '',
        bppScore: '',
        umbilicalAndMcaDoppler: '',
        cervicalLengthMm: ''
      },
      gynecologicUltrasound: {
        scanType: 'TVS',
        scanDate: '',
        uterusDimensionsMm: '',
        myometrialEchoAndMyomas: '',
        endometrialThicknessMm: '',
        rightOvary: '',
        leftOvary: '',
        culDeSacFreeFluid: ''
      },
      fetalMonitoring: {
        testType: 'NST',
        baselineBpm: '',
        variability: '',
        accelerations: '',
        decelerations: {
          status: 'None',
          type: 'None',
          isRecurrent: false,
          variablePathologicalFlags: {
            dropBelow70Bpm: false,
            durationOver60Sec: false,
            moreThan3In20Min: false
          },
          cordCompressionPatternVariant: 'None'
        },
        contractionsIn10Min: '',
        reactivity: '',
        nichdCategory: ''
      },
      keyLabs: {
        bhcg: '',
        wbc: '',
        hb: '',
        plt: '',
        cr: '',
        ast: '',
        alt: '',
        ldh: '',
        urinePrCr: '',
        tsh: '',
        ptInr: '',
        ogtt75: ''
      },
      keyLabsNote: ''
    },
    assessmentAndPlan: {
      ddx: [],
      ddxCustom: '',
      planSummary: '',
      adcaVanDimls: {
        A_admission: '',
        D_diagnosis: '',
        C_condition: '',
        A_allergies: '',
        V_vitals: '',
        A_activity: '',
        N_nursing: '',
        D_diet: '',
        I_iv: '',
        M_medications: '',
        L_labs: '',
        S_special: '',
        physicianName: '',
        dateTime: ''
      }
    },
    soapeHistory: [],
    activeSoapeId: null,
    dischargeSadaf: {
      active: false,
      ccAndInitialDx: '',
      finalDx: '',
      treatmentsAndProcedures: '',
      labSummary: '',
      diseaseCourse: 'improving',
      dischargeCondition: '',
      sadaf: {
        S_stitches: '',
        A_activity: '',
        D_drugsDiet: '',
        F_followUp: ''
      }
    },
    consultNote: {
      active: false,
      targetService: '',
      urgency: 'non_urgent',
      requestingPhysician: '',
      dateTime: '',
      admissionReason: '',
      consultReason: '',
      summary: ''
    }
  };
}

export function normalizeSubMode(mode) {
  if (mode === 'prenatal' || mode === 'obstetrics') return 'obstetrics';
  if (mode === 'soap' || mode === 'soape') return 'soape';
  if (mode === 'gynecology') return 'gynecology';
  return 'obstetrics';
}

function deepMerge(target, source) {
  if (source === null) return null;
  if (typeof target !== 'object' || target === null) return source !== undefined ? source : target;
  if (Array.isArray(target)) return Array.isArray(source) ? source : target;
  const out = { ...target };
  if (typeof source === 'object' && source !== null) {
    Object.keys(source).forEach((k) => {
      if (source[k] === null) out[k] = null;
      else if (k in target) out[k] = deepMerge(target[k], source[k]);
      else out[k] = source[k];
    });
  }
  return out;
}

/**
 * Safely hydrates Phase-1 legacy state.obgyn or partial saved obgynModule into full v3.1 state.
 */
export function normalizeObgynState(saved) {
  const defaults = createDefaultObgynState();
  if (!saved || typeof saved !== 'object') return defaults;

  const merged = deepMerge(defaults, saved);
  merged.subMode = normalizeSubMode(saved.subMode);

  // Migrate Phase-1 flat keys if present on legacy saved.obgyn
  if (saved.g !== undefined && merged.obstetricIndex.G === '') merged.obstetricIndex.G = saved.g;
  if (saved.p !== undefined && merged.obstetricIndex.P === '') merged.obstetricIndex.P = saved.p;
  if (saved.ab !== undefined && merged.obstetricIndex.Ab === '') merged.obstetricIndex.Ab = saved.ab;
  if (saved.l !== undefined && merged.obstetricIndex.L === '') merged.obstetricIndex.L = saved.l;
  if (saved.lmp && !merged.gestationalDating.lmpDate) {
    merged.gestationalDating.lmpDate = saved.lmp;
    merged.menstrualHistory.lmpDate = saved.lmp;
  }
  if (saved.rh && !merged.obstetricIndex.maternalBgRh) {
    merged.obstetricIndex.maternalBgRh = saved.rh;
  }
  if (saved.planNotes && !merged.assessmentAndPlan.planSummary) {
    merged.assessmentAndPlan.planSummary = saved.planNotes;
  }
  if (saved.quickFindings && typeof saved.quickFindings === 'object') {
    const mapPhase1 = {
      ob_contractions: 'obs_labor_contractions',
      ob_rom_leakage: 'obs_rom_leakage',
      ob_vaginal_bleeding: 'obs_vaginal_bleeding',
      ob_fetal_movement: 'obs_decreased_fm',
      ob_preeclampsia: 'obs_ss_headache'
    };
    Object.entries(saved.quickFindings).forEach(([k, val]) => {
      const targetKey = mapPhase1[k] || k;
      if (!merged.ccAndHpi.symptoms[targetKey] && val && (val.state === 1 || val.state === -1)) {
        merged.ccAndHpi.symptoms[targetKey] = {
          state: val.state,
          modifiers: [],
          detail: val.detail || ''
        };
      }
    });
  }

  return merged;
}
