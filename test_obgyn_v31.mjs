import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ALL_MASTER_DRUGS,
  MASTER_ALL_LAB_TESTS,
  MASTER_PSH_SURGERIES_BANK,
  ALL_MASTER_PMH_ITEMS
} from './js/schema.js';
import { smartClinicalSearch } from './js/fuzzy-search.js';
import {
  jalaliToGregorian,
  gregorianToJalali,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory,
  evaluateObgynSafetyGuardrails,
  createDefaultObgynState,
  normalizeObgynState,
  normalizeSubMode
} from './js/specialties/obgyn/obgyn-state.js';
import { ADCA_VAN_DIMLS_PRESETS } from './js/specialties/obgyn/obgyn-data.js';
import { generateObgynNote } from './js/specialties/obgyn/obgyn-generator.js';
import { deepStripPIIForCloud } from './js/google-sync.js';
import { sanitizeRecordForExport } from './js/generator.js';

const PERSIAN_RE = /[\u0600-\u06FF]/;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

console.log('--- 1. Testing Shared Core Ob/Gyn Delta Merges ---');
assert.ok(smartClinicalSearch('سولفات منیزیم', ALL_MASTER_DRUGS).length > 0, 'MgSO4 Persian drug lookup failed');
assert.ok(smartClinicalSearch('MgSO4', ALL_MASTER_DRUGS).length > 0, 'MgSO4 English lookup failed');
assert.ok(smartClinicalSearch('beta hcg', MASTER_ALL_LAB_TESTS).some((x) => x.id === 'lab_bhcg_quant'), 'Beta-hCG lab delta missing');
assert.ok(smartClinicalSearch('سرکلاژ', MASTER_PSH_SURGERIES_BANK).some((x) => x.id === 'psh_cerclage'), 'Cerclage PSH delta missing');
assert.ok(smartClinicalSearch('PCOS', ALL_MASTER_PMH_ITEMS).some((x) => x.id === 'pmh_pcos'), 'PCOS PMH delta missing');
console.log('PASS: Ob/Gyn Drugs, Labs, PSH, PMH deltas searchable via smartClinicalSearch.');

console.log('--- 2. Testing Exact Jalali/Gregorian & Triple-Anchor GA Calculator ---');
const gNowruz = jalaliToGregorian(1404, 1, 1);
assert.equal(`${gNowruz.gy}-${String(gNowruz.gm).padStart(2, '0')}-${String(gNowruz.gd).padStart(2, '0')}`, '2025-03-21');
const jBack = gregorianToJalali(2025, 3, 21);
assert.equal(`${jBack.jy}/${jBack.jm}/${jBack.jd}`, '1404/1/1');

// Case A: Concordant LMP (1404/05/01) + NT at 12w+2d on 1404/07/23 (elapsed = 2*31 + 22 = 84d vs 86d -> diff 2d <= 7d)
const concordant = calculateTripleGestationalAge({
  lmpDate: '1404/05/01',
  lmpCalendar: 'jalali',
  isReliableLmp: true,
  ntScanDate: '1404/07/23',
  ntGaWeeks: '12',
  ntGaDays: '2',
  assessmentDate: '1404/12/01'
});
assert.equal(concordant.officialSource, 'LMP');
assert.equal(concordant.redatingAlert?.shouldRedate, false);
assert.equal(concordant.redatingAlert?.warningType, 'concordant');

// Case B: 1st-trimester discrepancy (>7d) -> must redate to NT
const redated = calculateTripleGestationalAge({
  lmpDate: '1404/05/01',
  lmpCalendar: 'jalali',
  isReliableLmp: true,
  ntScanDate: '1404/07/23',
  ntGaWeeks: '10',
  ntGaDays: '2',
  assessmentDate: '1404/12/01'
});
assert.equal(redated.officialSource, 'NT');
assert.equal(redated.redatingAlert?.shouldRedate, true);
assert.equal(redated.redatingAlert?.warningType, 'redated_to_us');

// Case C: 3rd-trimester discrepancy (>21d between official LMP GA & last sono) -> FGR/IUGR warning
const growthLag = calculateTripleGestationalAge({
  lmpDate: '2026-01-01',
  lmpCalendar: 'gregorian',
  isReliableLmp: true,
  lastSonoDate: '2026-09-01', // ~34w6d elapsed from LMP
  lastSonoGaWeeks: '30',
  lastSonoGaDays: '0',
  assessmentDate: '2026-09-01'
});
assert.equal(growthLag.redatingAlert?.shouldRedate, false);
assert.equal(growthLag.redatingAlert?.warningType, 'growth_discrepancy');
console.log('PASS: Triple-Anchor GA calendar & ACOG redating verified.');

console.log('--- 3. Testing Bishop Score & NICHD 3-Tier Evaluator ---');
const favBishop = calculateBishopScore({
  dilationCm: '5',
  effacementPct: '80',
  stationScale: '5',
  stationValue: '+1',
  cervixConsistency: 'soft',
  cervixPosition: 'anterior'
});
assert.equal(favBishop.score, 13);
assert.equal(favBishop.status, 'favorable');

const unfavBishop = calculateBishopScore({
  dilationCm: '1',
  effacementPct: '30',
  stationScale: '3',
  stationValue: '-3',
  cervixConsistency: 'firm',
  cervixPosition: 'posterior'
});
assert.equal(unfavBishop.score, 1);
assert.equal(unfavBishop.status, 'unfavorable');

assert.equal(
  evaluateNichdCategory({ baselineBpm: '142', variability: 'Moderate', decelerations: { type: 'None' } }).category,
  'Category I'
);
const varPath = evaluateNichdCategory({
  baselineBpm: '145',
  variability: 'Moderate',
  decelerations: { type: 'Variable', variablePathologicalFlags: { dropBelow70Bpm: true } }
});
assert.equal(varPath.category, 'Category II');
assert.equal(varPath.hasPathologicalVariable, true);
assert.equal(
  evaluateNichdCategory({ baselineBpm: '130', variability: 'Absent', decelerations: { type: 'Late', isRecurrent: true } }).category,
  'Category III'
);
assert.equal(
  evaluateNichdCategory({ baselineBpm: '135', variability: 'Minimal', decelerations: { cordCompressionPatternVariant: 'Sinusoidal' } }).category,
  'Category III'
);
console.log('PASS: Bishop Score and NICHD Categories I/II/III verified.');

console.log('--- 4. Testing All 5 Safety Guardrails & Backward Compatibility ---');
assert.equal(normalizeSubMode('prenatal'), 'obstetrics');
assert.equal(normalizeSubMode('soap'), 'soape');

const gObs = evaluateObgynSafetyGuardrails({
  subMode: 'obstetrics',
  obstetricIndex: { isVirgin: true, P: '2', ND: '1', CS: '1', priorCsIndications: '' },
  ccAndHpi: { selectedArchetype: 'OB-3', symptoms: { obs_vaginal_bleeding: { state: 1 } } }
});
assert.equal(gObs.virginLock, true);
assert.equal(gObs.previaTvContraindicated, true);
assert.equal(gObs.accretaDopplerMandatory, true);
assert.equal(gObs.priorCsIndicationMissing, true);
assert.equal(gObs.ndCsMismatch, false);

const gMismatch = evaluateObgynSafetyGuardrails({
  subMode: 'gynecology',
  obstetricIndex: { P: '3', ND: '1', CS: '1', reproductiveStatus: 'reproductive' },
  ccAndHpi: { selectedArchetype: 'GYN-1', symptoms: {} }
});
assert.equal(gMismatch.ndCsMismatch, true);
assert.equal(gMismatch.bhcgMandatory, true);
console.log('PASS: All 5 clinical guardrails verified.');

console.log('--- 5. Testing Generator Invariants (Zero False Negatives & Pure English) ---');
const emptyCase = {
  demographics: { fullName: 'مریم کریمی', age: '29', bed: '12' },
  obgynModule: createDefaultObgynState()
};
const emptyFa = generateObgynNote(emptyCase, 'fa');
const emptyEn = generateObgynNote(emptyCase, 'en');
assert.ok(!emptyFa.includes('بیمار وجود') && !emptyFa.includes('ذکر نمی‌کند'), 'Untouched symptoms leaked as denied negatives in FA');
assert.ok(!emptyEn.includes('explicitly denies'), 'Untouched symptoms leaked as denied negatives in EN');
assert.equal(PERSIAN_RE.test(emptyEn), false, 'English empty note leaked Persian characters');

// Obstetrics Severe Preeclampsia case (bilingual check)
const obsState = normalizeObgynState({
  subMode: 'obstetrics',
  obstetricIndex: { G: '2', P: '1', L: '1', D: '0', Ab: '0', ND: '0', CS: '1', priorCsIndications: 'عدم پیشرفت زایمان (CPD)', maternalBgRh: 'O-' },
  gestationalDating: { lmpDate: '1404/05/10', lmpCalendar: 'jalali', ntScanDate: '1404/08/02', ntGaWeeks: '12', ntGaDays: '3', assessmentDate: '1405/01/15' },
  ccAndHpi: {
    ccText: 'فشار خون بالا و سردرد مقاوم به مسکن',
    duration: 'شب گذشته',
    selectedArchetype: 'OB-4',
    archetypeFields: { maxRecordedBp: '165/110 mmHg', visualSymptoms: 'blurred' },
    symptoms: {
      obs_ss_headache: { state: 1, modifiers: ['فرونتال', 'مقاوم به مسکن'], detail: 'شدت ۸ از ۱۰' },
      obs_ss_blurred_vision: { state: 1, modifiers: ['تاری دید'], detail: 'متناوب' },
      obs_ss_epigastric_pain: { state: -1, modifiers: [], detail: '' }
    }
  },
  gynScreeningAndRecords: {
    pahx: { hasPriorAnesthesia: true, anesthesiaTypes: ['Spinal Anesthesia'], complications: '' }
  },
  pe: {
    vitals: { bp: '165/110', bpRepeat: '160/105', pr: '92', rr: '18', temp: '36.9', urineDipstick: '+3' },
    obsMeasurements: { fhr: '144', fhrQuadrant: 'LLQ', fundalHeightCm: '34', dilationCm: '1', effacementPct: '30', stationScale: '5', stationValue: '-3' },
    findings: { pe_obs_dtr_clonus: { state: 1, detail: 'DTR +3 و کلونوس یک ضربه' } }
  },
  paraclinics: {
    lastObstetricUltrasound: { presentation: 'سفالیک (Cephalic)', placentalLocationAndGrade: 'قدامی گرید ۲', placentaAccretaColorDoppler: 'بدون شواهد آکرتا (No Accreta)' },
    fetalMonitoring: { testType: 'NST', baselineBpm: '144', variability: 'Moderate', accelerations: 'Reactive', decelerations: { type: 'None' } },
    keyLabs: { plt: '112000', ast: '55', alt: '48', urinePrCr: '0.8' }
  },
  assessmentAndPlan: {
    ddx: ['پره‌اکلامپسی همراه با تظاهرات شدید (Preeclampsia with Severe Features)'],
    adcaVanDimls: { ...ADCA_VAN_DIMLS_PRESETS.preeclampsia_severe.en }
  }
});
const obsFullCase = { demographics: { fullName: 'فاطمه رضایی', age: '32', ward: 'زنان', bed: '402' }, obgynModule: obsState };
const obsFa = generateObgynNote(obsFullCase, 'fa');
const obsEn = generateObgynNote(obsFullCase, 'en');
assert.ok(obsFa.includes('**G2P1L1D0Ab0**'), 'Obs FA formula missing');
assert.ok(obsFa.includes('Magnesium Sulfate'), 'Obs FA MgSO4 missing');
assert.equal(PERSIAN_RE.test(obsEn), false, `Obs EN leaked Persian text:\n${obsEn}`);
assert.equal(EMOJI_RE.test(obsFa) || EMOJI_RE.test(obsEn), false, 'Emoji leaked into Obstetrics output');

// Gynecology AUB + Virgin case
const gynState = normalizeObgynState({
  subMode: 'gynecology',
  obstetricIndex: { G: '0', P: '0', L: '0', D: '0', Ab: '0', ND: '0', CS: '0', isVirgin: true, maritalStatus: 'single', reproductiveStatus: 'reproductive' },
  menstrualHistory: { regularity: 'irregular', cycleIntervalDays: '21', bleedingDurationDays: '10', flowVolume: 'heavy', padsPerDay: '6', lmpDate: '1405/01/02' },
  ccAndHpi: {
    ccText: 'خونریزی شدید قاعدگی همراه با سرگیجه',
    selectedArchetype: 'GYN-1',
    symptoms: { gyn_vaginal_bleeding: { state: 1, modifiers: ['شدید همراه با دفع لخته'], detail: '۳ روز' } }
  },
  assessmentAndPlan: {
    ddx: ['خونریزی غیرطبیعی رحمی ناشی از لیومیوم (AUB-L)'],
    adcaVanDimls: { ...ADCA_VAN_DIMLS_PRESETS.aub_standard.en }
  }
});
const gynCase = { demographics: { fullName: 'فاطمه رضایی', age: '26', bed: '402' }, obgynModule: gynState };
const gynFa = generateObgynNote(gynCase, 'fa');
const gynEn = generateObgynNote(gynCase, 'en');
assert.ok(gynFa.includes('**G0P0L0Ab0**'), 'Gyn compact formula mismatch');
assert.ok(gynFa.includes('Virgin'), 'Gyn Virgin deferral missing');
assert.equal(PERSIAN_RE.test(gynEn), false, `Gyn EN leaked Persian text:\n${gynEn}`);
assert.equal(EMOJI_RE.test(gynFa) || EMOJI_RE.test(gynEn), false, 'Emoji leaked into Gynecology output');

// SOAPE + SADAF + Consult case
const soapeState = normalizeObgynState({
  subMode: 'soape',
  soapeHistory: [{
    id: 'd1',
    dayNumber: 1,
    noteType: 'سیر روزانه',
    dateTime: '1405/01/16',
    S: 'کاهش سردرد و دید طبیعی',
    O: 'BP 130/80 mmHg، رفلکس +2، برون‌ده ادراری 70 mL/h',
    A: 'بهبود بالینی پره‌اکلامپسی تحت سولفات',
    P_modifications: 'ادامه سولفات منیزیم تا ۲۴ ساعت پس از زایمان',
    P_reason: 'پیشگیری از اکلامپسی پس از زایمان',
    P_newOrders: 'کنترل CBC و AST صبح',
    E: 'توضیح علائم هشدار به بیمار داده شد'
  }],
  dischargeSadaf: {
    active: true,
    ccAndInitialDx: 'پره‌اکلامپسی شدید',
    finalDx: 'پره‌اکلامپسی کنترل‌شده پس از سزارین',
    treatmentsAndProcedures: 'سزارین و سولفات منیزیم ۲۴ ساعت',
    labSummary: 'Plt 158000',
    diseaseCourse: 'improving',
    dischargeCondition: 'پایدار',
    sadaf: { S_stitches: 'پانسمان تمیز، کشیدن نخ روز ۷', A_activity: 'استراحت نسبی', D_drugsDiet: 'آهن + مسکن', F_followUp: 'ویزیت یک هفته بعد' }
  },
  consultNote: {
    active: true,
    targetService: 'داخلی',
    urgency: 'urgent',
    requestingPhysician: 'دکتر احمدی',
    dateTime: '1405/01/16',
    admissionReason: 'پره‌اکلامپسی',
    consultReason: 'تنظیم داروی فشار خون',
    summary: 'BP 150/95 با لابتالول'
  }
});
const soapeCase = { demographics: { fullName: 'فاطمه رضایی', age: '32', bed: '402' }, obgynModule: soapeState };
const soapeFa = generateObgynNote(soapeCase, 'fa');
const soapeEn = generateObgynNote(soapeCase, 'en');
assert.ok(soapeFa.includes('SADAF') && soapeFa.includes('مشاوره'), 'SOAPE FA missing SADAF or Consult');
assert.equal(PERSIAN_RE.test(soapeEn), false, `SOAPE EN leaked Persian text:\n${soapeEn}`);
assert.equal(EMOJI_RE.test(soapeFa) || EMOJI_RE.test(soapeEn), false, 'Emoji leaked into SOAPE output');
console.log('PASS: Narrative generation (Obs/Gyn/SOAPE/SADAF/Consult FA+EN) verified.');

console.log('--- 6. Testing PII Privacy Shielding & Service Worker Assets ---');
const cloudPayload = deepStripPIIForCloud({
  caseId: 'CASE-OB-1',
  fullClinicalNote: obsFa,
  generatedTexts: { hp: '', obgyn: obsFa, atls: '', soapAllDays: '' },
  hp: { obgynModule: obsState }
}, obsFullCase);
assert.equal(cloudPayload.generatedTexts.obgyn.includes('فاطمه رضایی'), false, 'Cloud PII scrub failed to remove patient name from generatedTexts.obgyn');

const researchExport = sanitizeRecordForExport({
  demographics: { fullName: 'فاطمه رضایی', age: '32', bed: '402' },
  obgynModule: {
    ...soapeState,
    ccAndHpi: { ...soapeState.ccAndHpi, ccText: 'بیمار فاطمه رضایی تخت 402 با درد لگن' }
  }
});
const serializedExport = JSON.stringify(researchExport);
assert.equal(serializedExport.includes('فاطمه رضایی'), false, 'JSON export failed to redact patient name from obgynModule');

// Check every STATIC_ASSET in sw.js exists on disk & scan Ob/Gyn modules for emojis
const swContent = fs.readFileSync('./sw.js', 'utf8');
const matchAssets = swContent.match(/STATIC_ASSETS\s*=\s*\[([\s\S]*?)\]/);
assert.ok(matchAssets, 'Could not parse STATIC_ASSETS in sw.js');
const assetPaths = [...matchAssets[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.ok(assetPaths.includes('./js/specialties/obgyn/obgyn-data.js'), 'sw.js missing obgyn-data.js');
assert.ok(assetPaths.includes('./js/specialties/obgyn/obgyn-ui.js'), 'sw.js missing obgyn-ui.js');
for (const ap of assetPaths) {
  const diskPath = ap === './' ? './index.html' : ap;
  assert.ok(fs.existsSync(diskPath), `Missing SW static asset on disk: ${diskPath}`);
}

const filesToScanEmoji = [
  './js/specialties/obgyn/obgyn-data.js',
  './js/specialties/obgyn/obgyn-state.js',
  './js/specialties/obgyn/obgyn-ui.js',
  './js/specialties/obgyn/obgyn-generator.js',
  './js/specialties/obgyn/obgyn-shell.js',
  './js/specialty-hub.js',
  './css/medhistorism-v3.css'
];
for (const f of filesToScanEmoji) {
  const txt = fs.readFileSync(f, 'utf8');
  assert.equal(EMOJI_RE.test(txt), false, `Unicode emoji found in ${f}`);
}
console.log('PASS: PII shielding, SW asset existence (31 assets), and zero-emoji scan verified.');
console.log('ALL OB/GYN v3.1 TESTS PASSED!');
