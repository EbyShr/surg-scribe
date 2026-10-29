import {
  storageVault
} from './storage-vault.js';
import {
  smartClinicalSearch
} from './fuzzy-search.js';
import {
  SURGICAL_SCHEMA,
  LAB_PANELS,
  ROS_GROUPS_BILINGUAL,
  PMH_CATEGORIES,
  DH_CATEGORIES,
  MASTER_SYMPTOMS_BANK,
  MASTER_PMH_CATEGORIES,
  MASTER_DRUG_CATEGORIES,
  ALL_MASTER_SYMPTOMS,
  ALL_MASTER_PMH_ITEMS,
  ALL_MASTER_DRUGS,
  DH_SIG_OPTIONS,
  PAIN_TIMING_OPTIONS,
  PAIN_AGGRAVATING_FACTORS,
  PAIN_RELIEVING_FACTORS,
  HPI_BASIC_SYMPTOMS,
  HPI_UNLOCKABLE_MODULES,
  PE_MANDATORY_PILLARS,
  PE_UNLOCKABLE_MODULES,
  CLINICAL_PRESENTATION_ARCHETYPES,
  PAIN_BODY_REGIONS,
  MASS_GROWTH_PATTERNS,
  MASS_PAIN_STATUSES,
  MASS_ASSOCIATED_SIGNS,
  TRAUMA_MOI_OPTIONS,
  TRAUMA_TRANSPORT_OPTIONS,
  TRAUMA_INJURED_ZONES,
  TRAUMA_CHECKLIST,
  FUNCTIONAL_SYMPTOM_OPTIONS,
  FUNCTIONAL_ONSET_OPTIONS,
  ELECTIVE_DISCOVERY_OPTIONS,
  MASS_EXAM_SCHEMA,
  ATLS_EXAM_SCHEMA,
  PE_NORMAL_BASELINES,
  HIDDEN_EXTENDED_PMH_DATABASE,
  PSH_SURGICAL_PROCEDURES_BANK,
  FH_CANCER_HEREDITARY_DATABASE,
  EXTENDED_LAB_DATABASE,
  PE_COMPREHENSIVE_SYSTEMS
} from './schema.js';
import { ClinicalCaseAnalytics, ClinicalTelemetryEngine } from './telemetry.js';
import {
  generateClinicalNote,
  generateSOAPProgressNote,
  generateATLSNote,
  normalizePersianClinicalText,
  synthesizeProblemRepresentation,
  sanitizeRecordForExport
} from './generator.js';
import { GoogleSheetsSyncEngine } from './google-sync.js';
import {
  getCurrentLanguage,
  setLanguage,
  getCurrentFont,
  setFont,
  getCurrentTheme,
  setTheme,
  t,
  getLocalizedItemLabel,
  applyI18nToDOM
} from './i18n.js';

/* ==========================================================================
   State & Global Singletons (v0.5-Surg)
   ========================================================================== */
const STORAGE_CURRENT_CASE_KEY = 'surg_current_case_v05';
const STORAGE_SHIFT_CASES_KEY = 'surg_shift_cases_v05';
const STORAGE_THEME_KEY = 'surg_theme_mode';

let telemetry = new ClinicalTelemetryEngine();
let gsheetSync = new GoogleSheetsSyncEngine();
let activeSectionId = 'cc_admission';

function generateCaseId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SURG-${year}${month}${day}-${rand}`;
}

export function createDefaultPainEpisode(id = 1, title = 'کانون درد اول / شکایت محوری') {
  return {
    id,
    title,
    duration: '۱۲ ساعت',
    onset: 'شروع ناگهانی (Sudden)',
    spatialPattern: 'localized',
    selectedRegions: ['rlq'],
    initialRegions: [],
    currentRegions: [],
    localizationDelay: '',
    character: 'تیز و خنجری (Sharp)',
    course: 'پیشرونده و رو به تشدید (Progressive)',
    severity: 6,
    timing: 'دائمی و پیوسته (Continuous)',
    radiationList: [], // array of { id, label, detail }
    noRadiation: true,
    aggravating: ['حرکت، سرفه و دم عمیق'],
    relieving: ['استراحت و بی‌حرکتی']
  };
}

export function createDefaultPresentation(archetype = 'pain_archetype', id = 1) {
  const uid = typeof id === 'string' && id.startsWith('pres_') ? id : ('pres_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
  if (archetype === 'mass_lesion_archetype') {
    return {
      id,
      archetype: 'mass_lesion_archetype',
      title: `توده / ضایعه #${id}`,
      location: '',
      discoveryTime: '',
      growthPattern: 'ثابت و بدون تغییر سایز (Stable)',
      painStatus: 'کاملاً بدون درد (Painless)',
      findings: {}, // signId -> { state: 1|-1, detail: '' }
      posFindings: [],
      negFindings: []
    };
  }

  if (archetype === 'trauma_burn_archetype') {
    return {
      id,
      archetype: 'trauma_burn_archetype',
      title: `تروما و آسیب #${id}`,
      mechanism: 'ترومای بلانت - تصادف خودرو/موتورسیکلت/عابر (MVA / MCA / Pedestrian)',
      timeSinceInjury: '',
      transportMode: 'آمبولانس اورژانس (EMS 115)',
      injuredZones: [],
      checklist: {}, // itemId -> { state: 1|-1, detail: '' }
      posFindings: [],
      negFindings: []
    };
  }

  if (archetype === 'functional_bleeding_archetype') {
    return {
      id,
      archetype: 'functional_bleeding_archetype',
      title: `شکایت عملکردی #${id}`,
      symptomTitle: 'تنگی نفس حاد یا پیشرونده (Dyspnea)',
      duration: '',
      onset: 'تدریجی (Gradual)',
      severityOrFrequency: '',
      aggravating: [],
      relieving: [],
      visualTraits: ''
    };
  }

  if (archetype === 'elective_asymptomatic_archetype') {
    return {
      id,
      archetype: 'elective_asymptomatic_archetype',
      title: `بستری الکتیو #${id}`,
      isProcedureOnly: false,
      procedureName: '',
      insertionReasonAndTime: '',
      lastChemoOrInterventionDate: '',
      siteExamStatus: '',
      discoveryMethod: 'چکاپ روتین و غربالگری سلامت (Routine Check-up / Screening)',
      workupSummary: '',
      currentStatus: 'کاملاً بدون علامت حاد بالینی'
    };
  }

  // default: pain_archetype
  const basePain = createDefaultPainEpisode(id, `کانون درد #${id}`);
  basePain.archetype = 'pain_archetype';
  basePain.bodyRegionGroup = 'abdomen_pelvis';
  return basePain;
}

export function createDefaultAtlsState() {
  return {
    mist: {
      arrivalMode: 'آمبولانس اورژانس ۱۱۵ (EMS)',
      mechanisms: [],
      incidentTime: '',
      mechanismDetail: '',
      prehospitalCare: []
    },
    primary: {
      vitals: {
        bp: '',
        pr: '',
        rr: '',
        temp: '',
        spo2: '',
        gcsE: 4,
        gcsV: 5,
        gcsM: 6,
        gcsTotal: 15
      },
      airway: 'راه هوایی باز و ایمن — بیمار بیدار و سخنگو (Patent & Intact)',
      breathing: 'سمع دوطرفه ریه شفاف و متقارن (Bilateral Clear Breath Sounds)',
      circulation: 'همودینامیک پایدار، نبض‌های محیطی قرینه و پر (Class I)',
      disabilityPupils: 'مردمک‌ها قرینه و واکنش‌دار به نور (PERRLA 3mm)',
      exposure: 'لباس‌ها خارج شد، بررسی کامل سطح بدن و پیشگیری از هیپوترمی انجام شد'
    },
    ample: {
      allergies: 'NKDA (عدم سابقه حساسیت دارویی)',
      medications: '',
      pastHistory: '',
      lastMeal: '',
      eventsTetanus: ''
    },
    secondary: {
      injuries: [],
      burnActive: false,
      burnDegree: 'درجه ۲ سطحی/عمقی (Partial Thickness)',
      burnTbsa: '',
      burnInhalation: 'بدون شواهد سوختگی استنشاقی (No Inhalation Injury)',
      headFace: '',
      neck: '',
      chest: '',
      abdomenPelvis: '',
      perineumDre: '',
      extremitiesNeuro: '',
      efastStatus: 'منفی (Negative eFAST — بدون مایع آزاد در ۴ ناحیه و پریکارد)',
      efastDetail: '',
      imagingNote: '',
      statLabsNote: '',
      actionsAndPlan: [],
      planCustomNote: ''
    }
  };
}

export function createDefaultClinicalState() {
  const defaultPres = createDefaultPresentation('pain_archetype', 1);
  return {
    caseId: generateCaseId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    demographics: {
      fullName: '',
      fatherName: '',
      birthDate: '',
      gender: 'female',
      age: '',
      marital: 'متأهل',
      city: '',
      occupation: '',
      informant: 'خود بیمار',
      ward: '',
      bed: ''
    },
    admission: {
      pathway: 'emergency_acute',
      unresponsiveTrauma: false,
      traumaMoi: '',
      isProcedureOnly: false,
      clinicAttending: '',
      clinicDiagnosis: '',
      clinicPlannedProcedure: '',
      originWard: '',
      originPrimaryReason: '',
      transferReason: ''
    },
    cc: {
      pathway: 'emergency_acute', // 'emergency_acute' | 'elective_clinic' | 'inpatient_transfer'
      patientQuote: '',
      establishedDiagnosis: '',
      referringAttending: '',
      plannedProcedure: '',
      originWardHospital: '',
      primaryAdmissionReason: '',
      transferConsultReason: ''
    },
    hpi: {
      duration: '',
      presentations: [], // Empty state by default in v0.7-Master-Formulary!
      painList: [],
      unlockedModules: [],
      symptoms: {},
      preAdmissionWorkup: '',
      narrativeNote: '',
      systemGapNote: ''
    },
    obgyn: {
      g: '',
      p: '',
      ab: '',
      l: '',
      deliveryType: '',
      lmp: '',
      dysmenorrhea: '',
      pregnancies: [], // array of { id, outcome, deliveryMethod, year, complications }
      note: '',
      systemGapNote: ''
    },
    pmh: {
      masterRoutineNegative: false,
      categories: {}, // catId -> { status: 'neutral'|'negated'|'has_positive', items: {}, otherNote: '' }
      items: {}, // fallback / direct lookup
      systemGapNote: ''
    },
    psh: {
      surgeries: [], // array of { id, label, en, note }
      note: '',
      systemGapNote: ''
    },
    dh: {
      noRoutineMeds: false,
      activeDrugs: [], // array of { id, name, en, dose, sig, note }
      categories: {},
      customDrugs: [],
      note: '',
      systemGapNote: ''
    },
    ah: {
      nkda: false,
      selected: [], // array of { id, label, detail }
      note: '',
      systemGapNote: ''
    },
    sh: {
      negSmoking: false,
      negOpium: false,
      negAlcohol: false,
      cigsPerDay: '',
      yearsSmoked: '',
      opium: '',
      note: '',
      systemGapNote: ''
    },
    fh: {
      negFamilyHistory: false,
      masterNeg: false,
      diseases: [], // array of { id, name, en, relatives: [], status: 'living'|'deceased', ageNote: '' }
      selected: [],
      note: '',
      systemGapNote: ''
    },
    ros: {
      items: {}, // itemId -> { state: 1|-1, detail: '' }
      showAllGenders: false,
      systemGapNote: '',
      unobtainable: false,
      unobtainableReason: ''
    },
    pe: {
      vitals: {
        bp: '',
        pr: '',
        rr: '',
        temp: '',
        spo2: '',
        npo: ''
      },
      findings: {}, // itemId -> { state: 1|-1, detail: '' }
      unlockedModules: [], // array of module IDs (e.g. 'exam_dre')
      massExams: [], // array of local mass/lesion exam objects
      massExamList: [], // alias for backward compatibility
      atlsExam: {
        active: false,
        enabled: false,
        primarySurvey: { airway: '', breathing: '', circulation: '', disability: '', exposure: '' },
        wounds: [],
        burn: { degree: '', tbsa: '', regions: '', inhalationSigns: [] }
      },
      comprehensiveSystems: {}, // sysId -> { examined: false, isNormal: false, text: '', selectedTags: [] }
      note: '',
      systemGapNote: ''
    },
    paraclinics: {
      labs: {}, // labId -> string value
      additionalLabs: {}, // labId -> { value: '', unit: '', name: '', normalRange: '' }
      labNote: '',
      imagingReports: [], // array of { id, modalityId, modalityLabel, date, tags: [{ id, label, detail }], summary: '' }
      systemGapNote: ''
    },
    reasoning: {
      problemRepresentation: '',
      ddx: ''
    },
    atls: createDefaultAtlsState(),
    soapHistory: []
  };
}

export let clinicalState = createDefaultClinicalState();

/* ==========================================================================
   v1.1-ATLS-MultiSOAP: Global State & Helper Singletons
   ========================================================================== */
export let currentAppMode = 'admission'; // 'admission' | 'atls' | 'soap'

export function createDefaultSoapState() {
  return {
    recordType: 'SOAP_PROGRESS',
    dayId: `soap_day_${Date.now()}`,
    mode: 'linked', // 'linked' | 'standalone'
    linkedCaseId: null,
    dateStr: new Date().toLocaleDateString('fa-IR'),
    context: {
      fullName: '',
      age: '',
      gender: 'male',
      workingDiagnosis: '',
      procedureDone: '',
      hdNumber: '1',
      podType: 'POD',
      podNumber: '1'
    },
    subjective: {
      overallTrend: 'بهبود کلی علائم نسبت به دیروز',
      painStatus: 'درد خفیف و کنترل‌شده با مسکن در محل عمل',
      painDetail: '',
      dietTolerance: 'تحمل خوب مایعات صاف (Clear Liquids Tolerated)',
      flatus: 1, // 1: +, -1: -
      bowelMovement: -1, // 1: +, -1: -
      bowelDetail: '',
      ambulation: 'خارج شدن از تخت و راه رفتن در بخش (Out of Bed / Ambulating)',
      overnightSymptoms: {
        nausea_vomiting: { state: -1, label: 'تهوع و استفراغ' },
        fever_chills: { state: -1, label: 'تب و لرز' },
        cold_sweats: { state: -1, label: 'عرق سرد (Cold Sweats)' },
        dyspnea_cp: { state: -1, label: 'تنگی نفس / درد قفسه سینه' },
        dysuria_voiding: { state: -1, label: 'سوزش یا احتباس ادراری' }
      },
      symptoms: {
        nausea_vomiting: -1,
        fever_chills: -1,
        cold_sweats: -1,
        dyspnea_cp: -1,
        dysuria_voiding: -1
      },
      symptomDetails: {},
      customSymptoms: [],
      narrativeNote: ''
    },
    objective: {
      vitals: {
        bp: '',
        pr: '',
        rr: '',
        temp: '',
        tmax: '',
        spo2: '',
        hemodynamics: 'همودینامیک پایدار (Stable)'
      },
      io: {
        intake24h: '',
        urineOutput24h: '',
        ngtOutput24h: '',
        urineStatus: 'دفع ادرار طبیعی و کافی (بدون فولی)'
      },
      intake24h: '',
      urineOutput24h: '',
      ngtOutput24h: '',
      drains: [],
      generalAndCardioPulm: 'بیمار هوشیار (GCS=15)، سمع ریه‌ها دوطرفه شفاف، سمع قلب نرمال بدون سوفل.',
      abdomenExam: 'شکم نرم و بدون دیستانسیون، تندرنس خفیف محدود به برش جراحی، صداهای روده‌ای نرمال برقرار (BS+).',
      woundAndDressing: 'پانسمان تمیز و خشک (CDI)، بدون ترشح یا اریتم جدار.',
      extremitiesDvt: 'اندام‌ها گرم، نبض‌ها قرینه، بدون ادم یا تندرنس ساق (DVT منفی).',
      examNote: '',
      labs: {},
      previousBaselineLabs: {},
      newParaclinicNote: ''
    },
    assessment: {
      summaryText: '',
      clinicalStatus: 'سیر بهبودی مناسب و پایدار (Improving / Uneventful Recovery)'
    },
    plan: {
      selectedTags: [],
      customPlanText: ''
    }
  };
}

export let soapState = createDefaultSoapState();

export function getLinkedOrCurrentCase() {
  if (soapState.mode === 'linked' && soapState.linkedCaseId) {
    if (soapState.linkedCaseId === clinicalState.caseId) {
      return clinicalState;
    }
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
      const found = list.find(c => c.caseId === soapState.linkedCaseId);
      if (found) return found;
    } catch (e) {}
  }
  return clinicalState;
}

export function getAllAvailableCases() {
  const cases = [];
  if (clinicalState && clinicalState.caseId) {
    cases.push(clinicalState);
  }
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    list.forEach(c => {
      if (!cases.some(existing => existing.caseId === c.caseId)) {
        cases.push(c);
      }
    });
  } catch (e) {}
  return cases;
}


/* ==========================================================================
   UI Helpers & Notification Toasts
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/**
 * Creates a Direct Split-Action Tri-State Clinical Chip: [ + ] [ Label ] [ − ]
 * Instant 1-touch positive or negative without cycle fatigue.
 */
function renderInlineDetailTriStateChip(options) {
  const { id, label, detailHint, currentItemData, onStateChange, onDetailChange } = options;
  const stateVal = currentItemData ? (typeof currentItemData === 'object' ? currentItemData.state : currentItemData) : 0;
  const detail = currentItemData && typeof currentItemData === 'object' ? (currentItemData.detail || '') : '';

  const wrap = document.createElement('div');
  wrap.className = `split-chip-wrap ${stateVal === 1 ? 'has-inline-open' : ''}`;
  wrap.dataset.id = id;

  const chip = document.createElement('div');
  chip.className = `split-chip ${stateVal === 1 ? 'active-pos' : stateVal === -1 ? 'active-neg' : ''}`;
  chip.dataset.id = id;
  chip.dataset.state = String(stateVal);

  const btnPos = document.createElement('button');
  btnPos.type = 'button';
  btnPos.className = 'chip-btn-pos';
  btnPos.title = getCurrentLanguage() === 'en' ? 'Record Positive (+1)' : 'ثبت مثبت (+1)';
  btnPos.textContent = '+';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'chip-title';
  titleSpan.textContent = label;

  const btnNeg = document.createElement('button');
  btnNeg.type = 'button';
  btnNeg.className = 'chip-btn-neg';
  btnNeg.title = getCurrentLanguage() === 'en' ? 'Record Negative (-1)' : 'ثبت منفی (-1)';
  btnNeg.textContent = '−';

  chip.appendChild(btnPos);
  chip.appendChild(titleSpan);
  chip.appendChild(btnNeg);

  const inlineInput = document.createElement('input');
  inlineInput.type = 'text';
  inlineInput.className = 'inline-detail-input';
  inlineInput.placeholder = detailHint || 'توضیحات تکمیلی...';
  inlineInput.value = detail;

  const updateState = (targetState) => {
    const currentState = parseInt(chip.dataset.state || '0', 10);
    let newState = 0;
    if (targetState === 1) {
      newState = currentState === 1 ? 0 : 1;
    } else if (targetState === -1) {
      newState = currentState === -1 ? 0 : -1;
    }

    chip.dataset.state = String(newState);
    chip.classList.remove('active-pos', 'active-neg');
    if (newState === 1) {
      chip.classList.add('active-pos');
      wrap.classList.add('has-inline-open');
      setTimeout(() => inlineInput.focus(), 50);
    } else if (newState === -1) {
      chip.classList.add('active-neg');
      wrap.classList.remove('has-inline-open');
    } else {
      wrap.classList.remove('has-inline-open');
    }

    if (onStateChange) {
      onStateChange(newState, inlineInput.value);
    }
    saveCurrentCase();
    updateLivePreview();
  };

  btnPos.addEventListener('click', (e) => {
    e.stopPropagation();
    updateState(1);
  });

  titleSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    updateState(1);
  });

  btnNeg.addEventListener('click', (e) => {
    e.stopPropagation();
    updateState(-1);
  });

  inlineInput.addEventListener('input', (e) => {
    if (onDetailChange) {
      onDetailChange(e.target.value);
    }
    saveCurrentCase();
    updateLivePreview();
  });

  wrap.appendChild(chip);
  wrap.appendChild(inlineInput);
  return wrap;
}

/* ==========================================================================
   Persistence: LocalStorage Auto-Save & Sync
   ========================================================================== */
function saveCurrentCase() {
  try {
    clinicalState.updatedAt = new Date().toISOString();
    // 1. LocalStorage fallback
    localStorage.setItem(STORAGE_CURRENT_CASE_KEY, JSON.stringify(clinicalState));
    // 2. Immortal Vault (IndexedDB + Active Draft)
    if (typeof storageVault !== 'undefined') {
      storageVault.saveActiveDraft(clinicalState, activeSectionId);
    }
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

async function loadSavedState() {
  try {
    let loadedState = null;
    let savedTab = null;

    if (typeof storageVault !== 'undefined') {
      const restored = await storageVault.loadActiveDraft(createDefaultClinicalState);
      if (restored && restored.state) {
        loadedState = restored.state;
        savedTab = restored.activeTab;
      }
    }

    if (!loadedState) {
      const saved = localStorage.getItem(STORAGE_CURRENT_CASE_KEY);
      if (saved) {
        loadedState = JSON.parse(saved);
      }
    }

    if (loadedState) {
      const defaults = createDefaultClinicalState();
      clinicalState = {
        ...defaults,
        ...loadedState,
        admission: { ...defaults.admission, ...(loadedState.admission || {}) },
        demographics: { ...defaults.demographics, ...(loadedState.demographics || {}) },
        cc: { ...defaults.cc, ...(loadedState.cc || {}) },
        hpi: { ...defaults.hpi, ...(loadedState.hpi || {}) },
        obgyn: { ...defaults.obgyn, ...(loadedState.obgyn || {}) },
        pmh: { ...defaults.pmh, ...(loadedState.pmh || {}) },
        psh: { ...defaults.psh, ...(loadedState.psh || {}) },
        dh: { ...defaults.dh, ...(loadedState.dh || {}) },
        ah: { ...defaults.ah, ...(loadedState.ah || {}) },
        sh: { ...defaults.sh, ...(loadedState.sh || {}) },
        fh: { ...defaults.fh, ...(loadedState.fh || {}) },
        ros: { ...defaults.ros, ...(loadedState.ros || {}) },
        pe: { ...defaults.pe, ...(loadedState.pe || {}) },
        paraclinics: { ...defaults.paraclinics, ...(loadedState.paraclinics || {}) },
        reasoning: { ...defaults.reasoning, ...(loadedState.reasoning || {}) },
        atls: { ...defaults.atls, ...(loadedState.atls || {}) },
        soapHistory: Array.isArray(loadedState.soapHistory) ? loadedState.soapHistory : (Array.isArray(loadedState.progressNotes) ? loadedState.progressNotes : [])
      };

      if (!Array.isArray(clinicalState.psh.surgeries)) {
        clinicalState.psh.surgeries = [];
      }

      if (!clinicalState.pe.vitals) {
        clinicalState.pe.vitals = defaults.pe.vitals;
      }
      if (!clinicalState.pe.findings) {
        clinicalState.pe.findings = {};
      }
      if (!clinicalState.pe.massExams) {
        clinicalState.pe.massExams = clinicalState.pe.massExamList || [];
      }
      if (!clinicalState.pe.atlsExam) {
        clinicalState.pe.atlsExam = defaults.pe.atlsExam;
      }
      if (!clinicalState.hpi.presentations || !Array.isArray(clinicalState.hpi.presentations)) {
        clinicalState.hpi.presentations = [];
      }
      if (!clinicalState.hpi.painList || !Array.isArray(clinicalState.hpi.painList)) {
        clinicalState.hpi.painList = [];
      }

      if (savedTab && document.querySelector(`.tab-btn[data-tab="${savedTab}"]`)) {
        document.querySelector(`.tab-btn[data-tab="${savedTab}"]`).click();
      }
    }
  } catch (e) {
    console.warn('Failed to load saved state:', e);
  }
}

/* ==========================================================================
   Tab 1: Admission Pathway & Patient Demographics (with PII Sanitizer)
   ========================================================================== */
function initAdmissionPathwayHandlers() {
  const chipEmerg = document.getElementById('chipPathwayEmergency');
  const chipClinic = document.getElementById('chipPathwayClinic');
  const chipTransfer = document.getElementById('chipPathwayTransfer');
  const chipPostop = document.getElementById('chipPathwayPostop');
  const cardClinic = document.getElementById('cardCCReferral');
  const cardTransfer = document.getElementById('cardCCTransfer');

  function setPathway(pathway) {
    clinicalState.cc.pathway = pathway;
    chipEmerg?.classList.toggle('active', pathway === 'emergency_acute' || pathway === 'emergency_symptom');
    chipClinic?.classList.toggle('active', pathway === 'elective_clinic' || pathway === 'clinic_referral');
    chipTransfer?.classList.toggle('active', pathway === 'inpatient_transfer');
    chipPostop?.classList.toggle('active', pathway === 'postop_complication');

    const rEmerg = chipEmerg?.querySelector('input[type="radio"]');
    if (rEmerg) rEmerg.checked = (pathway === 'emergency_acute' || pathway === 'emergency_symptom');
    const rClinic = chipClinic?.querySelector('input[type="radio"]');
    if (rClinic) rClinic.checked = (pathway === 'elective_clinic' || pathway === 'clinic_referral');
    const rTransfer = chipTransfer?.querySelector('input[type="radio"]');
    if (rTransfer) rTransfer.checked = (pathway === 'inpatient_transfer');

    if (cardClinic) {
      cardClinic.style.display = (pathway === 'elective_clinic' || pathway === 'clinic_referral') ? 'block' : 'none';
    }
    if (cardTransfer) {
      cardTransfer.style.display = (pathway === 'inpatient_transfer') ? 'block' : 'none';
    }
    saveCurrentCase();
    updateLivePreview();
  }

  chipEmerg?.addEventListener('click', (e) => {
    e.preventDefault();
    setPathway('emergency_acute');
  });
  chipClinic?.addEventListener('click', (e) => {
    e.preventDefault();
    setPathway('elective_clinic');
  });
  chipTransfer?.addEventListener('click', (e) => {
    e.preventDefault();
    setPathway('inpatient_transfer');
  });
  chipPostop?.addEventListener('click', (e) => {
    e.preventDefault();
    setPathway('postop_complication');
  });

  // Wire Trauma Unresponsive Banner Toggle
  const btnTraumaToggle = document.getElementById('btnTraumaUnresponsiveToggle');
  btnTraumaToggle?.addEventListener('click', () => {
    if (!clinicalState.admission) clinicalState.admission = {};
    const newState = !clinicalState.admission.unresponsiveTrauma;
    clinicalState.admission.unresponsiveTrauma = newState;

    if (newState) {
      clinicalState.demographics.informant = 'اورژانس ۱۱۵ (EMS)';
      if (document.getElementById('demoInformant')) document.getElementById('demoInformant').value = 'اورژانس ۱۱۵ (EMS)';

      if (!clinicalState.hpi.presentations) clinicalState.hpi.presentations = [];
      const hasTrauma = clinicalState.hpi.presentations.some(p => p.archetype === 'trauma_burn_archetype');
      if (!hasTrauma) {
        const traumaPres = createDefaultPresentation('trauma_burn_archetype', clinicalState.hpi.presentations.length + 1);
        traumaPres.title = 'ترومای حاد (انتقال با اورژانس ۱۱۵)';
        clinicalState.hpi.presentations.unshift(traumaPres);
        renderHpiPresentations();
      }

      if (!clinicalState.ros) clinicalState.ros = {};
      clinicalState.ros.unobtainable = true;
      clinicalState.ros.unobtainableReason = 'به علت شرایط حاد بالینی، کاهش سطح هوشیاری و اینتوباسیون بیمار، اخذ مرور سیستم‌های معمول امکان‌پذیر نبوده و ارزیابی بر پایه شواهد عینی، معاینه فیزیکی و پروتکل ترومای ATLS متمرکز می‌باشد.';

      showToast('حالت ترومای حاد / ۱۱۵ فعال شد (MIST فعال و ROS سلب مسئولیت شد).', 'warning');
    } else {
      clinicalState.demographics.informant = 'خود بیمار';
      if (document.getElementById('demoInformant')) document.getElementById('demoInformant').value = 'خود بیمار';
      if (clinicalState.ros) clinicalState.ros.unobtainable = false;
      showToast('حالت ترومای بدحال غیرفعال شد.', 'info');
    }

    syncDomFromState();
    saveCurrentCase();
    updateLivePreview();
  });

  // Wire Elective Procedure Mode Switcher & Quick Chips
  const btnElecSymptom = document.getElementById('btnElectiveSymptomatic');
  const btnElecProc = document.getElementById('btnElectiveProcedureOnly');
  const wrapProc = document.getElementById('wrapperElectiveProcedures');

  btnElecSymptom?.addEventListener('click', () => {
    if (!clinicalState.admission) clinicalState.admission = {};
    clinicalState.admission.isProcedureOnly = false;
    btnElecSymptom.classList.add('active');
    btnElecProc?.classList.remove('active');
    if (wrapProc) wrapProc.style.display = 'none';
    saveCurrentCase();
    updateLivePreview();
  });

  btnElecProc?.addEventListener('click', () => {
    if (!clinicalState.admission) clinicalState.admission = {};
    clinicalState.admission.isProcedureOnly = true;
    btnElecProc.classList.add('active');
    btnElecSymptom?.classList.remove('active');
    if (wrapProc) wrapProc.style.display = 'block';
    saveCurrentCase();
    updateLivePreview();
  });

  document.querySelectorAll('.btn-quick-procedure').forEach(btn => {
    btn.addEventListener('click', () => {
      const procName = btn.dataset.proc || btn.textContent.trim();
      const ccPhrase = btn.dataset.cc || procName;

      if (!clinicalState.admission) clinicalState.admission = {};
      clinicalState.admission.isProcedureOnly = true;
      clinicalState.admission.clinicPlannedProcedure = procName;
      clinicalState.cc.plannedProcedure = procName;
      clinicalState.cc.ccPhrase = ccPhrase;
      clinicalState.cc.patientQuote = ccPhrase;
      if (document.getElementById('ccPlannedProcedure')) document.getElementById('ccPlannedProcedure').value = procName;
      if (document.getElementById('ccPatientQuote')) document.getElementById('ccPatientQuote').value = ccPhrase;

      if (!clinicalState.hpi.presentations) clinicalState.hpi.presentations = [];
      let procPres = clinicalState.hpi.presentations.find(p => p.archetype === 'elective_asymptomatic_archetype');
      if (!procPres) {
        procPres = createDefaultPresentation('elective_asymptomatic_archetype', clinicalState.hpi.presentations.length + 1);
        clinicalState.hpi.presentations.push(procPres);
      }
      procPres.isProcedureOnly = true;
      procPres.procedureName = procName;
      procPres.title = `اقدام الکتیو: ${procName}`;
      if (procName.includes('پورت')) {
        procPres.siteExamStatus = 'موضع پورت فاقد تورم، تندرنس، ترشح یا علائم عفونت';
      } else if (procName.includes('استومی')) {
        procPres.siteExamStatus = 'استومی دارای کارکرد مناسب، موضع بدون اریتم یا فتق پارااستومال';
      }

      renderHpiPresentations();
      saveCurrentCase();
      syncDomFromState();
      updateLivePreview();
      showToast(`اقدام الکتیو «${procName}» تنظیم گردید.`, 'success');
    });
  });

  // Initial sync
  setPathway(clinicalState.cc?.pathway || 'emergency_acute');

  [
    'ccEstablishedDiagnosis',
    'ccReferringAttending',
    'ccPlannedProcedure',
    'ccOriginWardHospital',
    'ccPrimaryAdmissionReason',
    'ccTransferConsultReason'
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const prop = id.replace('cc', '').charAt(0).toLowerCase() + id.replace('cc', '').slice(1);
      clinicalState.cc[prop] = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });

  document.getElementById('ccPatientQuote')?.addEventListener('input', (e) => {
    clinicalState.cc.patientQuote = e.target.value;
    clinicalState.cc.ccPhrase = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
}

function initDemographicsHandlers() {
  const map = {
    demoFullName: 'fullName',
    demoFatherName: 'fatherName',
    demoBirthDate: 'birthDate',
    demoGender: 'gender',
    demoAge: 'age',
    demoMarital: 'marital',
    demoCity: 'city',
    demoOccupation: 'occupation',
    demoInformant: 'informant',
    demoWard: 'ward',
    demoBed: 'bed'
  };

  Object.entries(map).forEach(([elId, prop]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      clinicalState.demographics[prop] = e.target.value;
      if (prop === 'gender') {
        const obgynCard = document.getElementById('cardObGynHistory');
        if (obgynCard) {
          obgynCard.style.display = e.target.value === 'male' ? 'none' : 'block';
        }
        renderRosGroups();
      }
      if (prop === 'fullName' || prop === 'ward' || prop === 'bed') {
        updateHeaderActivePatientBadge();
      }
      saveCurrentCase();
      updateLivePreview();
    });
  });

  document.getElementById('headerActivePatientBadge')?.addEventListener('click', () => {
    document.getElementById('btnOpenShiftManager')?.click();
  });
}

export function updateHeaderActivePatientBadge() {
  const badgeTextEl = document.getElementById('headerActivePatientText');
  if (!badgeTextEl) return;
  const lang = getCurrentLanguage();
  const isEn = lang === 'en';
  const d = clinicalState.demographics || {};
  const bed = d.bed ? String(d.bed).trim() : '';
  const name = d.fullName ? String(d.fullName).trim() : '';
  const ward = d.ward ? String(d.ward).trim() : '';

  let text = '';
  if (bed && name) {
    text = isEn ? `Bed ${bed} - ${name}` : `تخت ${bed} - ${name}`;
  } else if (bed) {
    text = isEn ? `Bed ${bed}` : `تخت ${bed}`;
  } else if (name) {
    text = name;
  } else if (ward) {
    text = isEn ? `Ward ${ward}` : `بخش ${ward}`;
  } else {
    text = isEn ? 'Active Case' : 'پرونده فعال';
  }

  if (text.length > 14) {
    text = text.substring(0, 13) + '…';
  }
  badgeTextEl.textContent = text;
}

/* ==========================================================================
   Tab 2: HPI & 5 Clinical Presentation Archetypes Engine
   ========================================================================== */
export function renderArchetypeSelectorGrid() {
  const container = document.getElementById('archetypeSelectorGrid') || document.getElementById('archetypeSelectorBar');
  if (!container) return;
  container.innerHTML = '';

  const archetypes = [
    {
      id: 'pain_archetype',
      cardClass: 'arch-card-pain',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
      title: '🔥 درد و ناراحتی (Pain & Discomfort)',
      subtitle: 'شکمی، قفسه سینه، سر و گردن، کمر و اندام',
      defaultTitle: 'درد و ناراحتی'
    },
    {
      id: 'mass_lesion_archetype',
      cardClass: 'arch-card-mass',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>',
      title: '🟣 توده، تورم و ضایعه (Mass, Cyst & Lesion)',
      subtitle: 'پستان، تیروئید، فک و صورت، کیست سر، فتق',
      defaultTitle: 'توده / ضایعه'
    },
    {
      id: 'trauma_burn_archetype',
      cardClass: 'arch-card-trauma',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      title: '🚑 تروما، جراحت و سوختگی (Trauma, Stab/GSW & Burn)',
      subtitle: 'چاقو، گلوله، تصادف، سقوط، سوختگی',
      defaultTitle: 'تروما و جراحت'
    },
    {
      id: 'functional_bleeding_archetype',
      cardClass: 'arch-card-functional',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
      title: '🌊 اختلال عملکرد، خونریزی یا زردی (Functional & Bleeding)',
      subtitle: 'تنگی نفس، خونریزی گوارشی، ایکتر، احتباس',
      defaultTitle: 'اختلال عملکرد / خونریزی'
    },
    {
      id: 'elective_asymptomatic_archetype',
      cardClass: 'arch-card-elective',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>',
      title: '📋 بستری الکتیو / ارجاع بی‌علامت (Elective & Pre-Op)',
      subtitle: 'نامه استاد، کانسر/سنگ تشخیصدادهشده، چکاپ',
      defaultTitle: 'بستری الکتیو / ارجاع'
    }
  ];

  archetypes.forEach((arch) => {
    const card = document.createElement('div');
    card.className = `archetype-grid-card ${arch.cardClass}`;
    card.innerHTML = `
      <div class="arch-card-header">
        <div class="arch-card-icon">${arch.iconSvg}</div>
        <div class="arch-card-title">${arch.title}</div>
      </div>
      <div class="arch-card-subtitle">${arch.subtitle}</div>
    `;

    card.addEventListener('click', () => {
      if (!clinicalState.hpi.presentations) clinicalState.hpi.presentations = [];
      const newUid = 'pres_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const count = clinicalState.hpi.presentations.length + 1;
      const newPres = createDefaultPresentation(arch.id, newUid);
      newPres.title = `${arch.defaultTitle} #${count}`;
      clinicalState.hpi.presentations.push(newPres);

      if (arch.id === 'trauma_burn_archetype') {
        if (!clinicalState.pe.atlsExam) {
          clinicalState.pe.atlsExam = { active: true, primarySurvey: {}, wounds: [], burn: { inhalationSigns: [] } };
        } else {
          clinicalState.pe.atlsExam.active = true;
        }
        renderAtlsExamModule();
      }

      renderHpiPresentations();
      saveCurrentCase();
      updateLivePreview();
    });

    container.appendChild(card);
  });
}

export const renderArchetypeSelectorBar = renderArchetypeSelectorGrid;

export function renderHpiPresentations() {
  const container = document.getElementById('hpiPresentationsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!clinicalState.hpi.presentations || clinicalState.hpi.presentations.length === 0) {
    container.innerHTML = `
      <div class="hpi-empty-state">
        <div class="hpi-empty-icon">🩺</div>
        <div class="hpi-empty-title">هنوز مواجهه‌ای ثبت نشده است</div>
        <div class="hpi-empty-desc">
          برای شروع، نوع شکایت بیمار را از یکی از ۵ الگوی بالا انتخاب کنید (امکان افزودن چندین الگوی همزمان وجود دارد).
        </div>
      </div>
    `;
    return;
  }

  // Backward compatibility: keep painList in sync with pain archetypes
  clinicalState.hpi.painList = clinicalState.hpi.presentations.filter(
    (p) => (p.archetype || p.type) === 'pain_archetype'
  );

  const badgeMap = {
    pain_archetype: 'درد و ناراحتی (Pain)',
    mass_lesion_archetype: 'توده و ضایعه (Mass)',
    trauma_burn_archetype: 'تروما و سوختگی (ATLS)',
    functional_bleeding_archetype: 'عملکردی / خونریزی (Functional)',
    elective_asymptomatic_archetype: 'الکتیو بی‌علامت (Elective)'
  };

  const iconMap = {
    pain_archetype: '🔥',
    mass_lesion_archetype: '🟣',
    trauma_burn_archetype: '🚑',
    functional_bleeding_archetype: '🌊',
    elective_asymptomatic_archetype: '📋'
  };

  clinicalState.hpi.presentations.forEach((pres, index) => {
    const archType = pres.archetype || pres.type || 'pain_archetype';
    const card = document.createElement('div');
    card.className = `archetype-card card-archetype-${archType}`;
    card.dataset.id = String(pres.id || pres.uid);

    // Header
    const header = document.createElement('div');
    header.className = 'archetype-card-header';

    const titleArea = document.createElement('div');
    titleArea.className = 'archetype-card-title-area';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'archetype-card-icon-pill';
    iconSpan.textContent = iconMap[archType] || '📍';
    titleArea.appendChild(iconSpan);

    const badge = document.createElement('span');
    badge.className = 'archetype-num-badge';
    badge.textContent = `مواجهه #${index + 1}`;
    titleArea.appendChild(badge);

    let cleanTitle = (pres.title || '').replace(/^مواجهه\s*#\d+\s*:\s*/, '').trim();
    if (!cleanTitle) cleanTitle = badgeMap[archType] || 'شکایت بیمار';
    pres.title = cleanTitle;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'archetype-title-input';
    titleInput.value = cleanTitle;
    titleInput.placeholder = 'عنوان یا توضیح شکایت...';
    titleInput.addEventListener('input', (e) => {
      pres.title = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    titleArea.appendChild(titleInput);

    header.appendChild(titleArea);

    // Action buttons: Collapse and Delete
    const actions = document.createElement('div');
    actions.className = 'archetype-card-actions';

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'btn-archetype-collapse';
    collapseBtn.title = pres._collapsed ? 'باز کردن' : 'جمع کردن';
    collapseBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: ${pres._collapsed ? 'rotate(180deg)' : 'none'}; transition: transform 0.2s ease;">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      <span>${pres._collapsed ? 'باز کردن' : 'جمع کردن'}</span>
    `;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-archetype-card';
    delBtn.title = 'حذف این مواجهه';
    delBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      <span>حذف مواجهه</span>
    `;
    delBtn.addEventListener('click', () => {
      clinicalState.hpi.presentations.splice(index, 1);
      renderHpiPresentations();
      saveCurrentCase();
      updateLivePreview();
    });

    actions.appendChild(collapseBtn);
    actions.appendChild(delBtn);
    header.appendChild(actions);

    card.appendChild(header);

    // Body wrapper
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'archetype-card-body-wrapper';
    if (pres._collapsed) {
      bodyContainer.style.display = 'none';
    }

    collapseBtn.addEventListener('click', () => {
      pres._collapsed = !pres._collapsed;
      bodyContainer.style.display = pres._collapsed ? 'none' : 'block';
      collapseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: ${pres._collapsed ? 'rotate(180deg)' : 'none'}; transition: transform 0.2s ease;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <span>${pres._collapsed ? 'باز کردن' : 'جمع کردن'}</span>
      `;
    });

    if (archType === 'mass_lesion_archetype') {
      renderMassLesionArchetypeBody(bodyContainer, pres);
    } else if (archType === 'trauma_burn_archetype') {
      renderTraumaBurnArchetypeBody(bodyContainer, pres);
    } else if (archType === 'functional_bleeding_archetype') {
      renderFunctionalBleedingArchetypeBody(bodyContainer, pres);
    } else if (archType === 'elective_asymptomatic_archetype') {
      renderElectiveArchetypeBody(bodyContainer, pres);
    } else {
      renderPainArchetypeBody(bodyContainer, pres);
    }

    card.appendChild(bodyContainer);
    container.appendChild(card);
  });
}


function renderMassLesionArchetypeBody(card, pres) {
  const grid = document.createElement('div');
  grid.className = 'form-grid-2';

  // Location
  const locGroup = document.createElement('div');
  locGroup.className = 'form-group';
  locGroup.innerHTML = `<label class="form-label">محل دقیق آناتومیک ضایعه/توده</label>`;
  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.className = 'input-text';
  locInput.value = pres.location || '';
  locInput.placeholder = 'مثلاً پوست سر اکسیپیتال، زاویه مندیبل راست، پستان چپ، اینگوئینال...';
  locInput.addEventListener('input', (e) => {
    pres.location = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  locGroup.appendChild(locInput);
  grid.appendChild(locGroup);

  // Discovery time
  const timeGroup = document.createElement('div');
  timeGroup.className = 'form-group';
  timeGroup.innerHTML = `<label class="form-label">زمان اولین مشاهده / سابقه وجود</label>`;
  const timeInput = document.createElement('input');
  timeInput.type = 'text';
  timeInput.className = 'input-text';
  timeInput.value = pres.discoveryTime || '';
  timeInput.placeholder = 'مثلاً ۶ ماه قبل یا ۲ سال قبل';
  timeInput.addEventListener('input', (e) => {
    pres.discoveryTime = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  timeGroup.appendChild(timeInput);
  grid.appendChild(timeGroup);

  // Growth pattern
  const growthGroup = document.createElement('div');
  growthGroup.className = 'form-group';
  growthGroup.innerHTML = `<label class="form-label">الگوی تغییر سایز و رشد (Growth Pattern)</label>`;
  const growthSelect = document.createElement('select');
  growthSelect.className = 'input-select';
  MASS_GROWTH_PATTERNS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.growthPattern === opt) opEl.selected = true;
    growthSelect.appendChild(opEl);
  });
  growthSelect.addEventListener('change', (e) => {
    pres.growthPattern = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  growthGroup.appendChild(growthSelect);
  grid.appendChild(growthGroup);

  // Pain status
  const painGroup = document.createElement('div');
  painGroup.className = 'form-group';
  painGroup.innerHTML = `<label class="form-label">وضعیت درد و تندرنس توده</label>`;
  const painSelect = document.createElement('select');
  painSelect.className = 'input-select';
  MASS_PAIN_STATUSES.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.painStatus === opt) opEl.selected = true;
    painSelect.appendChild(opEl);
  });
  painSelect.addEventListener('change', (e) => {
    pres.painStatus = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  painGroup.appendChild(painSelect);
  grid.appendChild(painGroup);

  card.appendChild(grid);

  // 5 Local Signs
  const signsSection = document.createElement('div');
  signsSection.className = 'form-group';
  signsSection.style.marginTop = '0.75rem';
  signsSection.innerHTML = `<label class="form-label">۵ نشانه بالینی موضعی توده (تپ: خنثی / + مثبت / − منفی)</label>`;

  const chipsGrid = document.createElement('div');
  chipsGrid.className = 'chips-container';

  if (!pres.findings) pres.findings = {};

  MASS_ASSOCIATED_SIGNS.forEach((sign) => {
    const currentData = pres.findings[sign.id];
    const chipWrap = renderInlineDetailTriStateChip({
      id: sign.id,
      label: sign.label,
      detailHint: 'جزئیات نشانه موضعی...',
      currentItemData: currentData,
      onStateChange: (newState, detailText) => {
        if (newState === 0) {
          delete pres.findings[sign.id];
        } else {
          pres.findings[sign.id] = { state: newState, detail: detailText, label: sign.label };
        }
        updateMassFindingsArrays(pres);
        saveCurrentCase();
        updateLivePreview();
      },
      onDetailChange: (detailText) => {
        if (pres.findings[sign.id]) {
          pres.findings[sign.id].detail = detailText;
          updateMassFindingsArrays(pres);
          saveCurrentCase();
          updateLivePreview();
        }
      }
    });
    chipsGrid.appendChild(chipWrap);
  });

  signsSection.appendChild(chipsGrid);
  card.appendChild(signsSection);
}

function updateMassFindingsArrays(pres) {
  if (!pres.findings) {
    pres.posFindings = [];
    pres.negFindings = [];
    return;
  }
  pres.posFindings = Object.values(pres.findings)
    .filter((f) => f.state === 1)
    .map((f) => (f.detail ? `${f.label} (${f.detail})` : f.label));
  pres.negFindings = Object.values(pres.findings)
    .filter((f) => f.state === -1)
    .map((f) => f.label);
}

function renderTraumaBurnArchetypeBody(card, pres) {
  const grid = document.createElement('div');
  grid.className = 'form-grid-3';

  // MOI
  const moiGroup = document.createElement('div');
  moiGroup.className = 'form-group';
  moiGroup.innerHTML = `<label class="form-label">مکانیسم تروما / آسیب (MOI)</label>`;
  const moiSelect = document.createElement('select');
  moiSelect.className = 'input-select';
  TRAUMA_MOI_OPTIONS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.mechanism === opt) opEl.selected = true;
    moiSelect.appendChild(opEl);
  });
  moiSelect.addEventListener('change', (e) => {
    pres.mechanism = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  moiGroup.appendChild(moiSelect);
  grid.appendChild(moiGroup);

  // Time since injury
  const timeGroup = document.createElement('div');
  timeGroup.className = 'form-group';
  timeGroup.innerHTML = `<label class="form-label">زمان دقیق وقوع حادثه</label>`;
  const timeInput = document.createElement('input');
  timeInput.type = 'text';
  timeInput.className = 'input-text';
  timeInput.value = pres.timeSinceInjury || '';
  timeInput.placeholder = 'مثلاً ۱ ساعت قبل، ساعت ۱۴ امروز';
  timeInput.addEventListener('input', (e) => {
    pres.timeSinceInjury = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  timeGroup.appendChild(timeInput);
  grid.appendChild(timeGroup);

  // Transport mode
  const transGroup = document.createElement('div');
  transGroup.className = 'form-group';
  transGroup.innerHTML = `<label class="form-label">نحوه انتقال به بیمارستان</label>`;
  const transSelect = document.createElement('select');
  transSelect.className = 'input-select';
  TRAUMA_TRANSPORT_OPTIONS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.transportMode === opt) opEl.selected = true;
    transSelect.appendChild(opEl);
  });
  transSelect.addEventListener('change', (e) => {
    pres.transportMode = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  transGroup.appendChild(transSelect);
  grid.appendChild(transGroup);

  card.appendChild(grid);

  // Injured Zones (Multi-select Chips)
  const zoneGroup = document.createElement('div');
  zoneGroup.className = 'form-group';
  zoneGroup.style.marginTop = '0.75rem';
  zoneGroup.innerHTML = `<label class="form-label">نواحی آناتومیک دارای آسیب یا اصابت</label>`;
  const zoneGrid = document.createElement('div');
  zoneGrid.className = 'tag-selector-grid';

  if (!pres.injuredZones) pres.injuredZones = [];

  TRAUMA_INJURED_ZONES.forEach((zone) => {
    const isAct = pres.injuredZones.includes(zone);
    const chip = document.createElement('span');
    chip.className = `factor-chip ${isAct ? 'active' : ''}`;
    chip.textContent = zone;
    chip.addEventListener('click', () => {
      if (pres.injuredZones.includes(zone)) {
        pres.injuredZones = pres.injuredZones.filter((z) => z !== zone);
        chip.classList.remove('active');
      } else {
        pres.injuredZones.push(zone);
        chip.classList.add('active');
      }
      saveCurrentCase();
      updateLivePreview();
    });
    zoneGrid.appendChild(chip);
  });
  zoneGroup.appendChild(zoneGrid);
  card.appendChild(zoneGroup);

  // Trauma Checklist 7-item
  const chkGroup = document.createElement('div');
  chkGroup.className = 'form-group';
  chkGroup.style.marginTop = '0.75rem';
  chkGroup.innerHTML = `<label class="form-label">چک‌لیست فوری تروما و شرح‌حال حادثه (تپ: خنثی / + مثبت / − منفی)</label>`;
  const chkGrid = document.createElement('div');
  chkGrid.className = 'chips-container';

  if (!pres.checklist) pres.checklist = {};

  TRAUMA_CHECKLIST.forEach((item) => {
    const currentData = pres.checklist[item.id];
    const chipWrap = renderInlineDetailTriStateChip({
      id: item.id,
      label: item.label,
      detailHint: 'جزئیات تروما...',
      currentItemData: currentData,
      onStateChange: (newState, detailText) => {
        if (newState === 0) {
          delete pres.checklist[item.id];
        } else {
          pres.checklist[item.id] = { state: newState, detail: detailText, label: item.label };
        }
        updateTraumaChecklistArrays(pres);
        saveCurrentCase();
        updateLivePreview();
      },
      onDetailChange: (detailText) => {
        if (pres.checklist[item.id]) {
          pres.checklist[item.id].detail = detailText;
          updateTraumaChecklistArrays(pres);
          saveCurrentCase();
          updateLivePreview();
        }
      }
    });
    chkGrid.appendChild(chipWrap);
  });
  chkGroup.appendChild(chkGrid);
  card.appendChild(chkGroup);
}

function updateTraumaChecklistArrays(pres) {
  if (!pres.checklist) {
    pres.posFindings = [];
    pres.negFindings = [];
    return;
  }
  pres.posFindings = Object.values(pres.checklist)
    .filter((f) => f.state === 1)
    .map((f) => (f.detail ? `${f.label} (${f.detail})` : f.label));
  pres.negFindings = Object.values(pres.checklist)
    .filter((f) => f.state === -1)
    .map((f) => f.label);
}

function renderFunctionalBleedingArchetypeBody(card, pres) {
  const grid = document.createElement('div');
  grid.className = 'form-grid-3';

  // Symptom Title
  const symGroup = document.createElement('div');
  symGroup.className = 'form-group';
  symGroup.innerHTML = `<label class="form-label">شکایت عملکردی اصلی</label>`;
  const symSelect = document.createElement('select');
  symSelect.className = 'input-select';
  FUNCTIONAL_SYMPTOM_OPTIONS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.symptomTitle === opt) opEl.selected = true;
    symSelect.appendChild(opEl);
  });
  symSelect.addEventListener('change', (e) => {
    pres.symptomTitle = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  symGroup.appendChild(symSelect);
  grid.appendChild(symGroup);

  // Duration
  const durGroup = document.createElement('div');
  durGroup.className = 'form-group';
  durGroup.innerHTML = `<label class="form-label">مدت زمان شروع</label>`;
  const durInput = document.createElement('input');
  durInput.type = 'text';
  durInput.className = 'input-text';
  durInput.value = pres.duration || '';
  durInput.placeholder = 'مثلاً ۳ روز یا ۱ هفته';
  durInput.addEventListener('input', (e) => {
    pres.duration = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  durGroup.appendChild(durInput);
  grid.appendChild(durGroup);

  // Onset
  const onsetGroup = document.createElement('div');
  onsetGroup.className = 'form-group';
  onsetGroup.innerHTML = `<label class="form-label">نحوه شروع (Onset)</label>`;
  const onsetSelect = document.createElement('select');
  onsetSelect.className = 'input-select';
  FUNCTIONAL_ONSET_OPTIONS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.onset === opt) opEl.selected = true;
    onsetSelect.appendChild(opEl);
  });
  onsetSelect.addEventListener('change', (e) => {
    pres.onset = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  onsetGroup.appendChild(onsetSelect);
  grid.appendChild(onsetGroup);

  card.appendChild(grid);

  // Severity / Stage & Visual Traits
  const grid2 = document.createElement('div');
  grid2.className = 'form-grid-2';
  grid2.style.marginTop = '0.5rem';

  const sevGroup = document.createElement('div');
  sevGroup.className = 'form-group';
  sevGroup.innerHTML = `<label class="form-label">شدت / تکرار / درجه‌بندی (مثلاً NYHA یا تعداد دفعات)</label>`;
  const sevInput = document.createElement('input');
  sevInput.type = 'text';
  sevInput.className = 'input-text';
  sevInput.value = pres.severityOrFrequency || '';
  sevInput.placeholder = 'مثلاً NYHA Class III یا ۳ نوبت مدفوع قیرگون در روز';
  sevInput.addEventListener('input', (e) => {
    pres.severityOrFrequency = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  sevGroup.appendChild(sevInput);
  grid2.appendChild(sevGroup);

  const visGroup = document.createElement('div');
  visGroup.className = 'form-group';
  visGroup.innerHTML = `<label class="form-label">مشخصات ظاهری / ترشحات / رنگ (Visual Traits)</label>`;
  const visInput = document.createElement('input');
  visInput.type = 'text';
  visInput.className = 'input-text';
  visInput.value = pres.visualTraits || '';
  visInput.placeholder = 'مثلاً مدفوع قیرگون بدبو، ادرار پررنگ شبیه چای، استفراغ قهوه‌ای...';
  visInput.addEventListener('input', (e) => {
    pres.visualTraits = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  visGroup.appendChild(visInput);
  grid2.appendChild(visGroup);

  card.appendChild(grid2);

  // Aggravating & Relieving
  const grid3 = document.createElement('div');
  grid3.className = 'form-grid-2';
  grid3.style.marginTop = '0.5rem';

  const aggGroup = document.createElement('div');
  aggGroup.className = 'form-group';
  aggGroup.innerHTML = `<label class="form-label">عوامل تشدیدکننده</label>`;
  const aggInput = document.createElement('input');
  aggInput.type = 'text';
  aggInput.className = 'input-text';
  aggInput.value = (pres.aggravating || []).join('، ');
  aggInput.placeholder = 'مثلاً فعالیت، دراز کشیدن، غذا خوردن...';
  aggInput.addEventListener('input', (e) => {
    pres.aggravating = e.target.value
      .split(/،|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    saveCurrentCase();
    updateLivePreview();
  });
  aggGroup.appendChild(aggInput);
  grid3.appendChild(aggGroup);

  const relGroup = document.createElement('div');
  relGroup.className = 'form-group';
  relGroup.innerHTML = `<label class="form-label">عوامل تسکین‌دهنده</label>`;
  const relInput = document.createElement('input');
  relInput.type = 'text';
  relInput.className = 'input-text';
  relInput.value = (pres.relieving || []).join('، ');
  relInput.placeholder = 'مثلاً استراحت، پوزیشن نشسته، دارو...';
  relInput.addEventListener('input', (e) => {
    pres.relieving = e.target.value
      .split(/،|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    saveCurrentCase();
    updateLivePreview();
  });
  relGroup.appendChild(relInput);
  grid3.appendChild(relGroup);

  card.appendChild(grid3);
}

function renderElectiveArchetypeBody(card, pres) {
  if (pres.isProcedureOnly) {
    const procCard = document.createElement('div');
    procCard.className = 'procedure-archetype-card';

    procCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-medium);">
        <span style="font-weight:700; color:var(--primary); font-size:0.88rem;">⚡ اقدام الکتیو برنامه‌ریزی‌شده (فاقد شکایت حاد)</span>
        <button type="button" class="btn btn-secondary btn-sm btn-switch-to-asymptomatic" style="font-size:0.75rem;">تغییر به مود بررسی علامت/توده</button>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">عنوان اقدام یا پروسیجر جراحی</label>
          <input type="text" class="input-text proc-name-input" value="${pres.procedureName || ''}" placeholder="مثلاً خروج پورت شیمی‌درمانی">
        </div>
        <div class="form-group">
          <label class="form-label">علت و زمان اقدام یا تعبیه قبلی</label>
          <input type="text" class="input-text proc-reason-input" value="${pres.insertionReasonAndTime || ''}" placeholder="مثلاً تعبیه پورت ۱ سال قبل جهت شیمی‌درمانی آدجوانت">
        </div>
      </div>
      <div class="form-grid-2" style="margin-top:0.5rem;">
        <div class="form-group">
          <label class="form-label">تاریخ آخرین نوبت مداخله / شیمی‌درمانی</label>
          <input type="text" class="input-text proc-chemo-input" value="${pres.lastChemoOrInterventionDate || ''}" placeholder="مثلاً اتمام دوره‌ها ۶ ماه قبل">
        </div>
        <div class="form-group">
          <label class="form-label">وضعیت موضعی محل پروسیجر در معاینه</label>
          <input type="text" class="input-text proc-exam-input" value="${pres.siteExamStatus || ''}" placeholder="مثلاً موضع فاقد اریتم، ترشح یا سلولیت">
        </div>
      </div>
    `;

    procCard.querySelector('.proc-name-input').addEventListener('input', (e) => {
      pres.procedureName = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    procCard.querySelector('.proc-reason-input').addEventListener('input', (e) => {
      pres.insertionReasonAndTime = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    procCard.querySelector('.proc-chemo-input').addEventListener('input', (e) => {
      pres.lastChemoOrInterventionDate = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    procCard.querySelector('.proc-exam-input').addEventListener('input', (e) => {
      pres.siteExamStatus = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    procCard.querySelector('.btn-switch-to-asymptomatic').addEventListener('click', () => {
      pres.isProcedureOnly = false;
      renderHpiPresentations();
      saveCurrentCase();
      updateLivePreview();
    });

    card.appendChild(procCard);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'form-grid-2';

  const discGroup = document.createElement('div');
  discGroup.className = 'form-group';
  discGroup.innerHTML = `<label class="form-label">روش کشف و نحوه مراجعه</label>`;
  const discSelect = document.createElement('select');
  discSelect.className = 'input-select';
  ELECTIVE_DISCOVERY_OPTIONS.forEach((opt) => {
    const opEl = document.createElement('option');
    opEl.value = opt;
    opEl.textContent = opt;
    if (pres.discoveryMethod === opt) opEl.selected = true;
    discSelect.appendChild(opEl);
  });
  discSelect.addEventListener('change', (e) => {
    pres.discoveryMethod = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  discGroup.appendChild(discSelect);
  grid.appendChild(discGroup);

  const statusGroup = document.createElement('div');
  statusGroup.className = 'form-group';
  statusGroup.innerHTML = `<label class="form-label">وضعیت علائم بالینی فعلی</label>`;
  const statusInput = document.createElement('input');
  statusInput.type = 'text';
  statusInput.className = 'input-text';
  statusInput.value = pres.currentStatus || 'کاملاً بدون علامت حاد بالینی';
  statusInput.placeholder = 'مثلاً کاملاً بدون درد و علامت';
  statusInput.addEventListener('input', (e) => {
    pres.currentStatus = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  statusGroup.appendChild(statusInput);
  grid.appendChild(statusGroup);

  card.appendChild(grid);

  const workupGroup = document.createElement('div');
  workupGroup.className = 'form-group';
  workupGroup.style.marginTop = '0.5rem';
  workupGroup.innerHTML = `<label class="form-label">خلاصه بررسی‌های پاراکلینیک و تصویربرداری قبلی</label>`;
  const workupInput = document.createElement('input');
  workupInput.type = 'text';
  workupInput.className = 'input-text';
  workupInput.value = pres.workupSummary || '';
  workupInput.placeholder = 'مثلاً سونوگرافی ۲ ماه قبل نشان‌دهنده پولیپ کیسه صفرا ۱۰ میلی‌متر...';
  workupInput.addEventListener('input', (e) => {
    pres.workupSummary = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  workupGroup.appendChild(workupInput);
  card.appendChild(workupGroup);
}

function renderPainArchetypeBody(card, pain, index) {
  // OLDCARTS Form Grid: Duration, Onset, Course
  const grid1 = document.createElement('div');
  grid1.className = 'form-grid-3';

  // Duration
  const durGroup = document.createElement('div');
  durGroup.className = 'form-group';
  durGroup.innerHTML = `<label class="form-label">مدت زمان شروع</label>`;
  const durInput = document.createElement('input');
  durInput.type = 'text';
  durInput.className = 'input-text';
  durInput.value = pain.duration || '';
  durInput.placeholder = 'مثلاً ۱۲ ساعت یا ۳ روز';
  durInput.addEventListener('input', (e) => {
    pain.duration = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  durGroup.appendChild(durInput);
  grid1.appendChild(durGroup);

  // Onset
  const onsetGroup = document.createElement('div');
  onsetGroup.className = 'form-group';
  onsetGroup.innerHTML = `<label class="form-label">نحوه شروع (Onset)</label>`;
  const onsetSelect = document.createElement('select');
  onsetSelect.className = 'input-select';
  onsetSelect.innerHTML = `
    <option value="">-- نحوه شروع --</option>
    <option value="شروع ناگهانی (Sudden)">شروع ناگهانی (Sudden)</option>
    <option value="شروع تدریجی (Gradual)">شروع تدریجی (Gradual)</option>
    <option value="به دنبال تروما/وعده غذایی">به دنبال تروما/وعده غذایی</option>
  `;
  onsetSelect.value = pain.onset || '';
  onsetSelect.addEventListener('change', (e) => {
    pain.onset = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  onsetGroup.appendChild(onsetSelect);
  grid1.appendChild(onsetGroup);

  // Course
  const courseGroup = document.createElement('div');
  courseGroup.className = 'form-group';
  courseGroup.innerHTML = `<label class="form-label">الگوی سیر (Course)</label>`;
  const courseSelect = document.createElement('select');
  courseSelect.className = 'input-select';
  courseSelect.innerHTML = `
    <option value="">-- الگوی سیر --</option>
    <option value="پیشرونده و رو به تشدید (Progressive)">پیشرونده و رو به تشدید (Progressive)</option>
    <option value="کولیکی و متناوب (Colicky)">کولیکی و متناوب (Colicky)</option>
    <option value="ثابت و مداوم (Constant)">ثابت و مداوم (Constant)</option>
  `;
  courseSelect.value = pain.course || '';
  courseSelect.addEventListener('change', (e) => {
    pain.course = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  courseGroup.appendChild(courseSelect);
  grid1.appendChild(courseGroup);

  card.appendChild(grid1);

  // Character & Severity
  const grid2 = document.createElement('div');
  grid2.className = 'form-grid-2';
  grid2.style.marginTop = '0.5rem';

  // Character
  const charGroup = document.createElement('div');
  charGroup.className = 'form-group';
  charGroup.innerHTML = `<label class="form-label">ماهیت علامت (Character)</label>`;
  const charSelect = document.createElement('select');
  charSelect.className = 'input-select';
  charSelect.innerHTML = `
    <option value="">-- انتخاب ماهیت --</option>
    <option value="تیز و خنجری (Sharp)">تیز و خنجری (Sharp)</option>
    <option value="مبهم و فشاری (Dull/Crampy)">مبهم و فشاری (Dull/Crampy)</option>
    <option value="سوزشی (Burning)">سوزشی (Burning)</option>
    <option value="ضربان‌دار (Throbbing)">ضربان‌دار (Throbbing)</option>
  `;
  charSelect.value = pain.character || '';
  charSelect.addEventListener('change', (e) => {
    pain.character = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  charGroup.appendChild(charSelect);
  grid2.appendChild(charGroup);

  // Severity Slider (0-10)
  const sevGroup = document.createElement('div');
  sevGroup.className = 'form-group';
  sevGroup.innerHTML = `
    <div class="form-label">
      <span>شدت درد (NRS 0-10)</span>
      <span class="mono-num sev-val-label">${pain.severity || 5} / 10</span>
    </div>
  `;
  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'severity-slider-container';
  sliderWrap.innerHTML = `
    <span class="mono-num">0</span>
    <input type="range" class="severity-slider" min="0" max="10" value="${pain.severity || 5}">
    <span class="mono-num">10</span>
    <div class="severity-value-badge dir-ltr">${pain.severity || 5} / 10</div>
  `;
  const rangeInput = sliderWrap.querySelector('input[type="range"]');
  const badgeEl = sliderWrap.querySelector('.severity-value-badge');
  const labelEl = sevGroup.querySelector('.sev-val-label');
  rangeInput.addEventListener('input', (e) => {
    const val = e.target.value;
    pain.severity = val;
    badgeEl.textContent = `${val} / 10`;
    labelEl.textContent = `${val} / 10`;
    saveCurrentCase();
    updateLivePreview();
  });
  sevGroup.appendChild(sliderWrap);
  grid2.appendChild(sevGroup);

  card.appendChild(grid2);

  // Body Region Group Selector
  const bodyRegionSelectGroup = document.createElement('div');
  bodyRegionSelectGroup.className = 'form-group';
  bodyRegionSelectGroup.style.marginTop = '0.6rem';
  bodyRegionSelectGroup.innerHTML = `<label class="form-label">منطقه اصلی آناتومیک درد (Body Region)</label>`;

  const groupPillsWrap = document.createElement('div');
  groupPillsWrap.className = 'spatial-patterns-grid';

  const curGroup = pain.bodyRegionGroup || 'abdomen_pelvis';
  PAIN_BODY_REGIONS.forEach((reg) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pattern-pill-btn ${curGroup === reg.id ? 'active' : ''}`;
    btn.textContent = reg.labelFa;
    btn.addEventListener('click', () => {
      pain.bodyRegionGroup = reg.id;
      groupPillsWrap.querySelectorAll('.pattern-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPainRegionsForEpisode(card, pain);
      saveCurrentCase();
      updateLivePreview();
    });
    groupPillsWrap.appendChild(btn);
  });
  bodyRegionSelectGroup.appendChild(groupPillsWrap);
  card.appendChild(bodyRegionSelectGroup);

  // Spatial Pattern Selector (Only for Abdomen & Pelvis)
  const spatGroup = document.createElement('div');
  spatGroup.className = 'form-group spatial-pattern-box';
  spatGroup.style.marginTop = '0.6rem';
  spatGroup.style.display = curGroup === 'abdomen_pelvis' ? 'block' : 'none';
  spatGroup.innerHTML = `<label class="form-label">الگوی فضایی-زمانی درد شکم</label>`;
  const spatGrid = document.createElement('div');
  spatGrid.className = 'spatial-patterns-grid';

  SURGICAL_SCHEMA.painSpatialPatterns.forEach((patt) => {
    const pattBtn = document.createElement('button');
    pattBtn.type = 'button';
    pattBtn.className = `pattern-pill-btn ${pain.spatialPattern === patt.id ? 'active' : ''}`;
    pattBtn.textContent = patt.label;
    pattBtn.addEventListener('click', () => {
      spatGrid.querySelectorAll('.pattern-pill-btn').forEach((b) => b.classList.remove('active'));
      pattBtn.classList.add('active');
      pain.spatialPattern = patt.id;
      renderPainRegionsForEpisode(card, pain);
      saveCurrentCase();
      updateLivePreview();
    });
    spatGrid.appendChild(pattBtn);
  });
  spatGroup.appendChild(spatGrid);
  card.appendChild(spatGroup);

  // Region Matrix / Subregions Container
  const regionContainer = document.createElement('div');
  regionContainer.className = 'episode-region-container';
  regionContainer.style.marginTop = '0.5rem';
  card.appendChild(regionContainer);
  renderPainRegionsForEpisode(card, pain);

  // Timing (Pills)
  const timingGroup = document.createElement('div');
  timingGroup.className = 'form-group';
  timingGroup.style.marginTop = '0.6rem';
  timingGroup.innerHTML = `<label class="form-label">تایمینگ درد (Timing)</label>`;
  const timingGrid = document.createElement('div');
  timingGrid.className = 'tag-selector-grid';

  PAIN_TIMING_OPTIONS.forEach((t) => {
    const chip = document.createElement('span');
    chip.className = `factor-chip ${pain.timing === t.label ? 'active' : ''}`;
    chip.textContent = t.label;
    chip.addEventListener('click', () => {
      if (pain.timing === t.label) {
        pain.timing = '';
        chip.classList.remove('active');
      } else {
        pain.timing = t.label;
        timingGrid.querySelectorAll('.factor-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      }
      saveCurrentCase();
      updateLivePreview();
    });
    timingGrid.appendChild(chip);
  });
  timingGroup.appendChild(timingGrid);
  card.appendChild(timingGroup);

  // Radiation Sites with Inline Input
  const radGroup = document.createElement('div');
  radGroup.className = 'form-group';
  radGroup.style.marginTop = '0.6rem';
  radGroup.innerHTML = `<label class="form-label">محل انتشار درد (Radiation)</label>`;
  const radList = document.createElement('div');
  radList.className = 'radiation-capsules-list';

  SURGICAL_SCHEMA.radiationSites.forEach((site) => {
    const isNone = site.id === 'rad_none';
    const existing = (pain.radiationList || []).find((r) => r.id === site.id);
    const isSelected = isNone ? pain.noRadiation : !!existing;

    const radItem = document.createElement('div');
    radItem.className = `radiation-capsule-item ${isSelected ? 'active' : ''}`;

    const radLabel = document.createElement('span');
    radLabel.className = 'radiation-capsule-label';
    radLabel.innerHTML = `<span>${isSelected ? '🔘' : '⚪'}</span> <span>${site.label}</span>`;

    radItem.appendChild(radLabel);

    let inlineInput = null;
    if (!isNone) {
      inlineInput = document.createElement('input');
      inlineInput.type = 'text';
      inlineInput.className = 'radiation-inline-input';
      inlineInput.placeholder = site.detailHint || 'جزئیات (راست/چپ)...';
      inlineInput.value = existing ? existing.detail || '' : '';
      inlineInput.style.display = isSelected ? 'inline-block' : 'none';

      inlineInput.addEventListener('input', (e) => {
        if (existing) {
          existing.detail = e.target.value;
          saveCurrentCase();
          updateLivePreview();
        }
      });
      radItem.appendChild(inlineInput);
    }

    radLabel.addEventListener('click', () => {
      if (isNone) {
        pain.noRadiation = !pain.noRadiation;
        if (pain.noRadiation) {
          pain.radiationList = [];
        }
      } else {
        pain.noRadiation = false;
        if (!pain.radiationList) pain.radiationList = [];
        const idx = pain.radiationList.findIndex((r) => r.id === site.id);
        if (idx >= 0) {
          pain.radiationList.splice(idx, 1);
        } else {
          pain.radiationList.push({ id: site.id, label: site.label, detail: inlineInput ? inlineInput.value : '' });
        }
      }
      renderHpiPresentations();
      saveCurrentCase();
      updateLivePreview();
    });

    radList.appendChild(radItem);
  });
  radGroup.appendChild(radList);
  card.appendChild(radGroup);

  // Aggravating Factors (Multi-select)
  const aggGroup = document.createElement('div');
  aggGroup.className = 'form-group';
  aggGroup.style.marginTop = '0.6rem';
  aggGroup.innerHTML = `<label class="form-label">عوامل تشدیدکننده (Aggravating Factors)</label>`;
  const aggGrid = document.createElement('div');
  aggGrid.className = 'tag-selector-grid';

  PAIN_AGGRAVATING_FACTORS.forEach((factor) => {
    if (!pain.aggravating) pain.aggravating = [];
    const isAct = pain.aggravating.includes(factor);
    const chip = document.createElement('span');
    chip.className = `factor-chip ${isAct ? 'active' : ''}`;
    chip.textContent = factor;
    chip.addEventListener('click', () => {
      if (pain.aggravating.includes(factor)) {
        pain.aggravating = pain.aggravating.filter((f) => f !== factor);
        chip.classList.remove('active');
      } else {
        pain.aggravating.push(factor);
        chip.classList.add('active');
      }
      saveCurrentCase();
      updateLivePreview();
    });
    aggGrid.appendChild(chip);
  });
  aggGroup.appendChild(aggGrid);
  card.appendChild(aggGroup);

  // Relieving Factors (Multi-select)
  const relGroup = document.createElement('div');
  relGroup.className = 'form-group';
  relGroup.style.marginTop = '0.6rem';
  relGroup.innerHTML = `<label class="form-label">عوامل تسکین‌دهنده (Relieving Factors)</label>`;
  const relGrid = document.createElement('div');
  relGrid.className = 'tag-selector-grid';

  PAIN_RELIEVING_FACTORS.forEach((factor) => {
    if (!pain.relieving) pain.relieving = [];
    const isAct = pain.relieving.includes(factor);
    const chip = document.createElement('span');
    chip.className = `factor-chip ${isAct ? 'active' : ''}`;
    chip.textContent = factor;
    chip.addEventListener('click', () => {
      if (pain.relieving.includes(factor)) {
        pain.relieving = pain.relieving.filter((f) => f !== factor);
        chip.classList.remove('active');
      } else {
        pain.relieving.push(factor);
        chip.classList.add('active');
      }
      saveCurrentCase();
      updateLivePreview();
    });
    relGrid.appendChild(chip);
  });
  relGroup.appendChild(relGrid);
  card.appendChild(relGroup);
}

function renderPainRegionsForEpisode(cardElement, pain) {
  const container = cardElement.querySelector('.episode-region-container');
  if (!container) return;
  container.innerHTML = '';

  const group = pain.bodyRegionGroup || 'abdomen_pelvis';

  // If non-abdominal, render that region's subregions
  if (group !== 'abdomen_pelvis') {
    const regDef = PAIN_BODY_REGIONS.find((g) => g.id === group);
    if (!regDef) return;

    const row = document.createElement('div');
    row.className = 'form-group';
    row.innerHTML = `<label class="form-label">نواحی درگیر درد (${regDef.labelFa})</label>`;
    const subGrid = document.createElement('div');
    subGrid.className = 'spatial-patterns-grid';

    if (!pain.selectedRegions) pain.selectedRegions = [];

    regDef.subregions.forEach((sub) => {
      const isAct = pain.selectedRegions.includes(sub.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pattern-pill-btn ${isAct ? 'active' : ''}`;
      btn.textContent = sub.label;
      btn.addEventListener('click', () => {
        if (pain.selectedRegions.includes(sub.id)) {
          pain.selectedRegions = pain.selectedRegions.filter((x) => x !== sub.id);
          btn.classList.remove('active');
        } else {
          pain.selectedRegions.push(sub.id);
          btn.classList.add('active');
        }
        pain.site = pain.selectedRegions
          .map((sid) => {
            const found = regDef.subregions.find((x) => x.id === sid);
            return found ? found.fa || found.label : sid;
          })
          .join(' و ');
        saveCurrentCase();
        updateLivePreview();
      });
      subGrid.appendChild(btn);
    });
    row.appendChild(subGrid);
    container.appendChild(row);
    return;
  }

  // Abdomen & Pelvis
  const pattern = pain.spatialPattern || 'localized';

  if (pattern === 'generalized_to_localized') {
    const delayRow = document.createElement('div');
    delayRow.className = 'form-group';
    delayRow.innerHTML = `
      <label class="form-label">⏱️ فاصله زمانی تا لوکالیزه شدن درد در موضع خاص</label>
      <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
        <input type="text" class="input-text" style="flex:1; min-width:200px;" value="${pain.localizationDelay || ''}" placeholder="مثلاً: پس از حدود ۶ ساعت / از صبح امروز" id="delayInput_${pain.id}">
        <div class="quick-chips" style="display:flex; gap:0.35rem; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm delay-chip" data-val="پس از حدود ۴ تا ۶ ساعت">پس از ۴ تا ۶ ساعت</button>
          <button type="button" class="btn btn-secondary btn-sm delay-chip" data-val="پس از ۸ تا ۱۲ ساعت">پس از ۸ تا ۱۲ ساعت</button>
          <button type="button" class="btn btn-secondary btn-sm delay-chip" data-val="از صبح امروز">از صبح امروز</button>
        </div>
      </div>
    `;
    const input = delayRow.querySelector(`#delayInput_${pain.id}`);
    input?.addEventListener('input', (e) => {
      pain.localizationDelay = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    delayRow.querySelectorAll('.delay-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        pain.localizationDelay = btn.dataset.val;
        if (input) input.value = btn.dataset.val;
        saveCurrentCase();
        updateLivePreview();
      });
    });
    container.appendChild(delayRow);

    const row2 = document.createElement('div');
    row2.className = 'form-group';
    row2.innerHTML = `<label class="form-label">🎯 ناحیه(های) لوکالیزه‌شده فعلی (Current Localized Region)</label>`;
    const grid2 = document.createElement('div');
    grid2.className = 'abdominal-matrix-grid';
    renderRegionButtonsIntoGrid(grid2, pain.currentRegions || [], (newArr) => {
      pain.currentRegions = newArr;
      saveCurrentCase();
      updateLivePreview();
    });
    row2.appendChild(grid2);
    container.appendChild(row2);
  } else if (pattern === 'localized_to_generalized' || pattern === 'migratory_shifting') {
    const row1 = document.createElement('div');
    row1.className = 'form-group';
    row1.innerHTML = `<label class="form-label">📍 ۱. محل(های) شروع اولیه درد</label>`;
    const grid1 = document.createElement('div');
    grid1.className = 'abdominal-matrix-grid';
    renderRegionButtonsIntoGrid(grid1, pain.initialRegions || [], (newArr) => {
      pain.initialRegions = newArr;
      saveCurrentCase();
      updateLivePreview();
    });
    row1.appendChild(grid1);
    container.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'form-group';
    row2.innerHTML = `<label class="form-label">🎯 ۲. محل(های) فعلی / ثانویه درد</label>`;
    const grid2 = document.createElement('div');
    grid2.className = 'abdominal-matrix-grid';
    renderRegionButtonsIntoGrid(grid2, pain.currentRegions || [], (newArr) => {
      pain.currentRegions = newArr;
      saveCurrentCase();
      updateLivePreview();
    });
    row2.appendChild(grid2);
    container.appendChild(row2);
  } else {
    const row = document.createElement('div');
    row.className = 'form-group';
    row.innerHTML = `<label class="form-label">${
      pattern === 'generalized_predominant' ? 'نواحی دارای حداکثر شدت و ارجحیت درد' : 'نواحی آناتومیک درگیر درد'
    }</label>`;
    const grid = document.createElement('div');
    grid.className = 'abdominal-matrix-grid';
    renderRegionButtonsIntoGrid(grid, pain.selectedRegions || [], (newArr) => {
      pain.selectedRegions = newArr;
      const regLabels = newArr.map((id) => {
        const r = SURGICAL_SCHEMA.abdominalRegions.find((x) => x.id === id);
        return r ? r.label : id;
      });
      pain.site = regLabels.join(' و ');
      saveCurrentCase();
      updateLivePreview();
    });
    row.appendChild(grid);
    container.appendChild(row);
  }
}

function renderRegionButtonsIntoGrid(gridElement, selectedArray, onChange) {
  gridElement.innerHTML = '';
  SURGICAL_SCHEMA.abdominalRegions.forEach((reg) => {
    const isAct = selectedArray.includes(reg.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `matrix-cell-btn region-cell-btn ${isAct ? 'active' : ''}`;
    btn.setAttribute('data-region-id', reg.id);
    btn.title = reg.label;
    btn.innerHTML = `
      <span class="cell-code">${reg.code || reg.id.toUpperCase()}</span>
      <span class="cell-fa">${reg.fa || reg.label}</span>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      let updated = [];
      if (selectedArray.includes(reg.id)) {
        updated = selectedArray.filter((x) => x !== reg.id);
      } else {
        updated = [...selectedArray, reg.id];
      }
      onChange(updated);
      renderRegionButtonsIntoGrid(gridElement, updated, onChange);
    });
    gridElement.appendChild(btn);
  });
}

function renderPainEpisodes() {
  renderHpiPresentations();
}

function initAddPainEpisodeHandler() {
  document.getElementById('btnAddPainEpisode')?.addEventListener('click', () => {
    if (!clinicalState.hpi.presentations) clinicalState.hpi.presentations = [];
    const newId = clinicalState.hpi.presentations.length + 1;
    clinicalState.hpi.presentations.push(createDefaultPresentation('pain_archetype', newId));
    renderHpiPresentations();
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   HPI Basic Symptoms & Unlockable Modules
   ========================================================================== */
function renderHpiBasicSymptoms() {
  const container = document.getElementById('hpiBasicSymptomsContainer');
  if (!container) return;
  container.innerHTML = '';

  HPI_BASIC_SYMPTOMS.forEach((sym) => {
    const currentData = clinicalState.hpi.symptoms?.[sym.id];
    const chipWrap = renderInlineDetailTriStateChip({
      id: sym.id,
      label: sym.label,
      detailHint: sym.detailHint,
      currentItemData: currentData,
      onStateChange: (newState, detailText) => {
        if (newState === 0) {
          delete clinicalState.hpi.symptoms[sym.id];
        } else {
          clinicalState.hpi.symptoms[sym.id] = { state: newState, detail: detailText, label: sym.label };
        }
      },
      onDetailChange: (detailText) => {
        if (clinicalState.hpi.symptoms[sym.id]) {
          clinicalState.hpi.symptoms[sym.id].detail = detailText;
        }
      }
    });
    container.appendChild(chipWrap);
  });
}

function renderHpiUnlockableModules() {
  const bar = document.getElementById('hpiUnlockableModulesBar');
  const unlockedContainer = document.getElementById('hpiUnlockedModulesContainer');
  if (!bar || !unlockedContainer) return;

  bar.innerHTML = '';
  unlockedContainer.innerHTML = '';

  const unlocked = clinicalState.hpi.unlockedModules || [];

  HPI_UNLOCKABLE_MODULES.forEach((mod) => {
    if (!unlocked.includes(mod.id)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-unlock-module';
      btn.innerHTML = `<span>${mod.buttonLabel}</span><span>🔒</span>`;
      btn.addEventListener('click', () => {
        clinicalState.hpi.unlockedModules.push(mod.id);
        renderHpiUnlockableModules();
        saveCurrentCase();
        updateLivePreview();
      });
      bar.appendChild(btn);
    } else {
      // Module is unlocked - render card
      const card = document.createElement('div');
      card.className = 'unlocked-module-card';

      const header = document.createElement('div');
      header.className = 'unlocked-module-header';
      header.innerHTML = `
        <span class="unlocked-module-title">🔓 ${mod.title}</span>
        <button type="button" class="btn btn-secondary btn-sm btn-close-module" style="color:#EF4444;">بستن و حذف</button>
      `;

      header.querySelector('.btn-close-module').addEventListener('click', () => {
        clinicalState.hpi.unlockedModules = clinicalState.hpi.unlockedModules.filter((id) => id !== mod.id);
        // Clear symptoms of this module
        mod.chips.forEach((c) => delete clinicalState.hpi.symptoms[c.id]);
        renderHpiUnlockableModules();
        saveCurrentCase();
        updateLivePreview();
      });
      card.appendChild(header);

      const chipsGrid = document.createElement('div');
      chipsGrid.className = 'chips-container';

      mod.chips.forEach((c) => {
        const cur = clinicalState.hpi.symptoms?.[c.id];
        const chipWrap = renderInlineDetailTriStateChip({
          id: c.id,
          label: c.label,
          detailHint: c.detailHint,
          currentItemData: cur,
          onStateChange: (newState, detailText) => {
            if (newState === 0) {
              delete clinicalState.hpi.symptoms[c.id];
            } else {
              clinicalState.hpi.symptoms[c.id] = { state: newState, detail: detailText, label: c.label };
            }
          },
          onDetailChange: (detailText) => {
            if (clinicalState.hpi.symptoms[c.id]) {
              clinicalState.hpi.symptoms[c.id].detail = detailText;
            }
          }
        });
        chipsGrid.appendChild(chipWrap);
      });
      card.appendChild(chipsGrid);
      unlockedContainer.appendChild(card);
    }
  });
}

/* ==========================================================================
   Tab 3: PMH Categorized Gatekeepers, Simplified PSH & Ob/Gyn
   ========================================================================== */
function renderPmhCategories() {
  const container = document.getElementById('pmhCategoriesContainer');
  const masterRoutineBtn = document.getElementById('btnPmhMasterRoutineNegative');
  if (!container) return;
  container.innerHTML = '';

  if (masterRoutineBtn) {
    masterRoutineBtn.classList.toggle('active', !!clinicalState.pmh.masterRoutineNegative);
    masterRoutineBtn.onclick = () => {
      clinicalState.pmh.masterRoutineNegative = !clinicalState.pmh.masterRoutineNegative;
      masterRoutineBtn.classList.toggle('active', clinicalState.pmh.masterRoutineNegative);
      saveCurrentCase();
      updateLivePreview();
    };
  }

  PMH_CATEGORIES.forEach((cat) => {
    if (!clinicalState.pmh.categories[cat.id]) {
      clinicalState.pmh.categories[cat.id] = { status: 'neutral', items: {}, otherNote: '' };
    }
    const catData = clinicalState.pmh.categories[cat.id];

    const card = document.createElement('div');
    card.className = 'pmh-category-card';

    const header = document.createElement('div');
    header.className = 'pmh-category-header';

    const titleArea = document.createElement('div');
    titleArea.className = 'pmh-category-title';
    titleArea.textContent = cat.title;
    header.appendChild(titleArea);

    const actions = document.createElement('div');
    actions.className = 'pmh-category-actions';

    const btnNeg = document.createElement('button');
    btnNeg.type = 'button';
    btnNeg.className = `btn-category-neg ${catData.status === 'negated' ? 'active' : ''}`;
    btnNeg.textContent = catData.status === 'negated' ? '✓ نفی شد' : '− نفی کل دسته';

    const btnPos = document.createElement('button');
    btnPos.type = 'button';
    btnPos.className = `btn-category-pos ${catData.status === 'has_positive' ? 'active' : ''}`;
    btnPos.textContent = '+ دارد (انتخاب)';

    actions.appendChild(btnNeg);
    actions.appendChild(btnPos);
    header.appendChild(actions);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pmh-category-body';
    body.style.display = catData.status === 'has_positive' ? 'flex' : 'none';

    // Split-action chips for items inside this category
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';

    cat.items.forEach((item) => {
      const cur = catData.items?.[item.id] || clinicalState.pmh.items?.[item.id];
      const chipWrap = renderInlineDetailTriStateChip({
        id: item.id,
        label: item.label,
        detailHint: item.detailHint,
        currentItemData: cur,
        onStateChange: (newState, detailText) => {
          if (newState === 0) {
            delete catData.items[item.id];
            delete clinicalState.pmh.items[item.id];
          } else {
            catData.items[item.id] = { state: newState, detail: detailText, label: item.label };
            clinicalState.pmh.items[item.id] = catData.items[item.id];
          }
        },
        onDetailChange: (detailText) => {
          if (catData.items[item.id]) catData.items[item.id].detail = detailText;
          if (clinicalState.pmh.items[item.id]) clinicalState.pmh.items[item.id].detail = detailText;
        }
      });
      chipsContainer.appendChild(chipWrap);
    });
    body.appendChild(chipsContainer);

    // Other diseases input
    const otherGroup = document.createElement('div');
    otherGroup.className = 'form-group';
    otherGroup.style.marginTop = '0.5rem';
    otherGroup.innerHTML = `<label class="form-label">سایر بیماری‌های این دسته</label>`;
    const otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.className = 'input-text';
    otherInput.placeholder = 'سایر موارد...';
    otherInput.value = catData.otherNote || '';
    otherInput.addEventListener('input', (e) => {
      catData.otherNote = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    otherGroup.appendChild(otherInput);
    body.appendChild(otherGroup);

    card.appendChild(body);

    btnNeg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (catData.status === 'negated') {
        catData.status = 'neutral';
      } else {
        catData.status = 'negated';
        catData.items = {};
      }
      renderPmhCategories();
      saveCurrentCase();
      updateLivePreview();
    });

    btnPos.addEventListener('click', (e) => {
      e.stopPropagation();
      catData.status = catData.status === 'has_positive' ? 'neutral' : 'has_positive';
      renderPmhCategories();
      saveCurrentCase();
      updateLivePreview();
    });

    container.appendChild(card);
  });
}

export function addPshSurgeryItem(procObj) {
  if (!clinicalState.psh) clinicalState.psh = { surgeries: [], note: '', systemGapNote: '' };
  if (!Array.isArray(clinicalState.psh.surgeries)) clinicalState.psh.surgeries = [];

  const exists = clinicalState.psh.surgeries.some(
    (s) => s.id === procObj.id || (s.label || s.procedure) === (procObj.label || procObj.name)
  );
  if (!exists) {
    clinicalState.psh.surgeries.push({
      id: procObj.id || ('psh_' + Date.now()),
      label: procObj.label || procObj.name || 'جراحی قبلی',
      procedure: procObj.label || procObj.name || 'جراحی قبلی',
      en: procObj.en || '',
      note: ''
    });
  }
  renderPshCapsulesAndSelected();
  saveCurrentCase();
  updateLivePreview();
}

export function renderPshCapsulesAndSelected(filterQuery = '') {
  const capsulesBar = document.getElementById('pshCommonCapsulesBar');
  const selectedContainer = document.getElementById('pshSelectedSurgeriesContainer');
  if (!clinicalState.psh) clinicalState.psh = { surgeries: [], note: '', systemGapNote: '' };
  if (!Array.isArray(clinicalState.psh.surgeries)) clinicalState.psh.surgeries = [];

  if (capsulesBar) {
    capsulesBar.innerHTML = '';
    const q = (filterQuery || '').trim();
    const pool = Array.isArray(PSH_SURGICAL_PROCEDURES_BANK) ? PSH_SURGICAL_PROCEDURES_BANK : [];
    const itemsToShow = q
      ? smartClinicalSearch(q, pool, ['label', 'en', 'keywords'], 15)
      : pool.slice(0, 12);

    itemsToShow.forEach((proc) => {
      const isAdded = clinicalState.psh.surgeries.some((s) => s.id === proc.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toggle-chip ${isAdded ? 'active' : ''}`;
      btn.innerHTML = `<span>${isAdded ? '✓' : '➕'}</span> <span>${proc.label}</span>`;
      btn.addEventListener('click', () => {
        if (isAdded) {
          clinicalState.psh.surgeries = clinicalState.psh.surgeries.filter((s) => s.id !== proc.id);
          renderPshCapsulesAndSelected(filterQuery);
          saveCurrentCase();
          updateLivePreview();
        } else {
          addPshSurgeryItem(proc);
        }
      });
      capsulesBar.appendChild(btn);
    });
  }

  if (selectedContainer) {
    selectedContainer.innerHTML = '';
    clinicalState.psh.surgeries.forEach((surg, idx) => {
      const row = document.createElement('div');
      row.className = 'psh-selected-surgery-row';
      row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:8px; padding:0.4rem 0.65rem;';
      row.innerHTML = `
        <span style="font-weight:700; font-size:0.84rem; color:var(--primary); white-space:nowrap;">🔪 ${surg.label || surg.procedure}</span>
        <input type="text" class="input-text psh-surg-note-inp" style="flex:1; min-width:160px; padding:0.28rem 0.55rem; font-size:0.82rem;" placeholder="سال عمل / سمت (چپ یا راست) / علت یا عارضه..." value="${surg.note || surg.yearHospital || ''}">
        <button type="button" class="btn-delete-imaging psh-surg-del-btn" title="حذف این جراحی">✕</button>
      `;
      row.querySelector('.psh-surg-note-inp')?.addEventListener('input', (e) => {
        surg.note = e.target.value;
        surg.yearHospital = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      row.querySelector('.psh-surg-del-btn')?.addEventListener('click', () => {
        clinicalState.psh.surgeries.splice(idx, 1);
        renderPshCapsulesAndSelected();
        saveCurrentCase();
        updateLivePreview();
      });
      selectedContainer.appendChild(row);
    });
  }
}

function initPshHandlers() {
  const pshEl = document.getElementById('pshNote');
  if (pshEl) {
    pshEl.addEventListener('input', (e) => {
      clinicalState.psh.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  }

  const pshSearchInp = document.getElementById('pshQuickSearchInput');
  if (pshSearchInp) {
    pshSearchInp.addEventListener('input', (e) => {
      renderPshCapsulesAndSelected(e.target.value);
    });
    pshSearchInp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = pshSearchInp.value.trim();
        if (!q) return;
        const pool = Array.isArray(PSH_SURGICAL_PROCEDURES_BANK) ? PSH_SURGICAL_PROCEDURES_BANK : [];
        const matches = smartClinicalSearch(q, pool, ['label', 'en', 'keywords'], 5);
        if (matches.length > 0) {
          addPshSurgeryItem(matches[0]);
        } else {
          addPshSurgeryItem({ id: 'psh_custom_' + Date.now(), label: q, en: '' });
        }
        pshSearchInp.value = '';
        renderPshCapsulesAndSelected('');
      }
    });
  }

  renderPshCapsulesAndSelected();
}

function initObGynHandlers() {
  ['obgynG', 'obgynP', 'obgynAb', 'obgynL'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prop = id.replace('obgyn', '').toLowerCase();
    el.addEventListener('input', (e) => {
      clinicalState.obgyn[prop] = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });

  ['obgynDeliveryType', 'obgynLmp', 'obgynDysmenorrhea'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prop = id.replace('obgyn', '').charAt(0).toLowerCase() + id.replace('obgyn', '').slice(1);
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      clinicalState.obgyn[prop] = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });

  document.getElementById('btnAddPregnancyRow')?.addEventListener('click', () => {
    if (!clinicalState.obgyn.pregnancies) clinicalState.obgyn.pregnancies = [];
    clinicalState.obgyn.pregnancies.push({
      id: Date.now(),
      outcome: 'تولد زنده موفق',
      deliveryMethod: 'سزارین (C-Section)',
      year: '',
      complications: ''
    });
    renderPregnancyHistoryRows();
    saveCurrentCase();
    updateLivePreview();
  });
}

function renderPregnancyHistoryRows() {
  const tbody = document.getElementById('pregnancyHistoryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const pregs = clinicalState.obgyn.pregnancies || [];
  pregs.forEach((preg, i) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <select class="pregnancy-row-input row-outcome">
          <option value="تولد زنده موفق" ${preg.outcome === 'تولد زنده موفق' ? 'selected' : ''}>تولد زنده موفق</option>
          <option value="سقط" ${preg.outcome === 'سقط' ? 'selected' : ''}>سقط</option>
          <option value="حاملگی خارج رحمی (EP)" ${preg.outcome === 'حاملگی خارج رحمی (EP)' ? 'selected' : ''}>حاملگی خارج رحمی (EP)</option>
          <option value="مرده‌زایی" ${preg.outcome === 'مرده‌زایی' ? 'selected' : ''}>مرده‌زایی</option>
        </select>
      </td>
      <td>
        <select class="pregnancy-row-input row-method">
          <option value="سزارین (C-Section)" ${preg.deliveryMethod === 'سزارین (C-Section)' ? 'selected' : ''}>سزارین (C-Section)</option>
          <option value="زایمان طبیعی (NVD)" ${preg.deliveryMethod === 'زایمان طبیعی (NVD)' ? 'selected' : ''}>زایمان طبیعی (NVD)</option>
          <option value="کورتاژ" ${preg.deliveryMethod === 'کورتاژ' ? 'selected' : ''}>کورتاژ</option>
        </select>
      </td>
      <td>
        <input type="text" class="pregnancy-row-input row-year" placeholder="مثلاً ۱۳۸۵" value="${preg.year || ''}">
      </td>
      <td>
        <input type="text" class="pregnancy-row-input row-comp" placeholder="مثلاً سزارین تکراری" value="${preg.complications || ''}">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-delete-imaging row-del" title="حذف ردیف">✕</button>
      </td>
    `;

    tr.querySelector('.row-outcome').addEventListener('change', (e) => {
      preg.outcome = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    tr.querySelector('.row-method').addEventListener('change', (e) => {
      preg.deliveryMethod = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    tr.querySelector('.row-year').addEventListener('input', (e) => {
      preg.year = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    tr.querySelector('.row-comp').addEventListener('input', (e) => {
      preg.complications = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    tr.querySelector('.row-del').addEventListener('click', () => {
      clinicalState.obgyn.pregnancies.splice(i, 1);
      renderPregnancyHistoryRows();
      saveCurrentCase();
      updateLivePreview();
    });

    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   Tab 4: Categorized Drug History (DH) & 3-Box Inline Inputs
   ========================================================================== */
export function addActiveDrug(drugObj) {
  if (!clinicalState.dh.activeDrugs) clinicalState.dh.activeDrugs = [];
  clinicalState.dh.noRoutineMeds = false;
  const noMedsBtn = document.getElementById('btnNoRoutineMedications');
  if (noMedsBtn) noMedsBtn.classList.remove('is-confirmed');

  const existing = clinicalState.dh.activeDrugs.find(
    (d) => d.id === drugObj.id || (drugObj.name && d.name === drugObj.name)
  );
  if (!existing) {
    clinicalState.dh.activeDrugs.push({
      id: drugObj.id || ('drg_' + Date.now()),
      name: drugObj.label || drugObj.name || 'دارو',
      en: drugObj.en || '',
      dose: drugObj.defaultDose || drugObj.dose || '',
      sig: drugObj.sig || 'Daily (روزانه)',
      note: drugObj.note || ''
    });
  }
  renderActiveDrugs();
  saveCurrentCase();
  updateLivePreview();
}

export function renderActiveDrugs() {
  const container = document.getElementById('dhActiveDrugsContainer');
  if (!container) return;
  container.innerHTML = '';

  const drugs = clinicalState.dh.activeDrugs || [];
  if (drugs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state-card';
    empty.style.cssText = 'padding: 0.8rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-medium); border-radius: 8px; margin-bottom: 0.5rem;';
    empty.textContent = 'هنوز دارویی به لیست مصرفی بیمار اضافه نشده است. با جستجو در کادر بالا یا انتخاب از دسته‌های زیر، دارو را اضافه کنید.';
    container.appendChild(empty);
    return;
  }

  drugs.forEach((drug, idx) => {
    const card = document.createElement('div');
    card.className = 'dh-active-card';

    const header = document.createElement('div');
    header.className = 'dh-active-header';

    const titleBox = document.createElement('div');
    titleBox.className = 'dh-active-title';
    titleBox.innerHTML = `<span>💊</span><strong>${drug.name}</strong>${drug.en ? ` <span style="font-size: 0.8rem; opacity: 0.8;">(${drug.en})</span>` : ''}`;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-card';
    delBtn.innerHTML = `<span>🗑️</span><span>حذف</span>`;
    delBtn.title = 'حذف این دارو از لیست مصرفی';
    delBtn.addEventListener('click', () => {
      clinicalState.dh.activeDrugs.splice(idx, 1);
      renderActiveDrugs();
      saveCurrentCase();
      updateLivePreview();
    });

    header.appendChild(titleBox);
    header.appendChild(delBtn);
    card.appendChild(header);

    const row3 = document.createElement('div');
    row3.className = 'dh-active-3box';

    const doseInp = document.createElement('input');
    doseInp.type = 'text';
    doseInp.className = 'input-text dh-active-dose-input';
    doseInp.placeholder = 'دوز مصرفی (مثلاً 80 mg)...';
    doseInp.value = drug.dose || '';
    doseInp.addEventListener('input', (e) => {
      drug.dose = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });

    const sigSel = document.createElement('select');
    sigSel.className = 'input-select dh-active-sig-select';
    DH_SIG_OPTIONS.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (drug.sig === opt) option.selected = true;
      sigSel.appendChild(option);
    });
    sigSel.addEventListener('change', (e) => {
      drug.sig = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });

    const noteInp = document.createElement('input');
    noteInp.type = 'text';
    noteInp.className = 'input-text dh-active-note-input';
    noteInp.placeholder = 'ملاحظات / زمان قطع...';
    noteInp.value = drug.note || '';
    noteInp.addEventListener('input', (e) => {
      drug.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });

    row3.appendChild(doseInp);
    row3.appendChild(sigSel);
    row3.appendChild(noteInp);
    card.appendChild(row3);

    container.appendChild(card);
  });
}

let activeDhDrawerCatId = null;
export function renderDhCategoryPills() {
  const bar = document.getElementById('dhCategoryPillsBar');
  if (!bar) return;
  bar.innerHTML = '';

  DH_CATEGORIES.forEach((cat) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `dh-category-pill ${activeDhDrawerCatId === cat.id ? 'is-active' : ''}`;
    pill.innerHTML = `<span>📂</span><span>${cat.title}</span>`;
    pill.addEventListener('click', () => {
      if (activeDhDrawerCatId === cat.id) {
        activeDhDrawerCatId = null;
      } else {
        activeDhDrawerCatId = cat.id;
      }
      renderDhCategoryPills();
      renderDhCategoryDrawer();
    });
    bar.appendChild(pill);
  });
}

function renderDhCategoryDrawer() {
  const drawer = document.getElementById('dhCategoryDrawerContainer');
  if (!drawer) return;
  drawer.innerHTML = '';
  if (!activeDhDrawerCatId) {
    drawer.style.display = 'none';
    return;
  }
  drawer.style.display = 'block';

  const cat = DH_CATEGORIES.find((c) => c.id === activeDhDrawerCatId);
  if (!cat) return;

  const title = document.createElement('div');
  title.className = 'dh-drawer-title';
  title.style.cssText = 'font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--primary);';
  title.textContent = `داروهای دسته ${cat.title} (کلیک برای افزودن به لیست مصرفی بیمار):`;
  drawer.appendChild(title);

  const chipsGrid = document.createElement('div');
  chipsGrid.className = 'dh-drawer-chips-grid';
  chipsGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.4rem;';

  cat.drugs.forEach((d) => {
    const isAdded = (clinicalState.dh.activeDrugs || []).some((ad) => ad.id === d.id);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `dh-drawer-drug-chip ${isAdded ? 'is-added' : ''}`;
    chip.style.cssText = `padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--border-medium); background: ${isAdded ? 'var(--emerald-50, #ecfdf5)' : 'var(--bg-card)'}; color: ${isAdded ? 'var(--emerald-700, #047857)' : 'var(--text-primary)'};`;
    chip.innerHTML = `${isAdded ? '✓ ' : '➕ '}${d.label}`;
    chip.addEventListener('click', () => {
      addActiveDrug(d);
      chip.innerHTML = `✓ ${d.label}`;
      chip.style.background = 'var(--emerald-50, #ecfdf5)';
      chip.style.color = 'var(--emerald-700, #047857)';
    });
    chipsGrid.appendChild(chip);
  });
  drawer.appendChild(chipsGrid);
}

// Backward compatibility stub for renderDhCategories
function renderDhCategories() {
  renderActiveDrugs();
  renderDhCategoryPills();
}

function renderCustomDrugs() {
  const container = document.getElementById('dhCustomDrugsContainer');
  if (!container) return;
  container.innerHTML = '';

  const drugs = clinicalState.dh.customDrugs || [];
  drugs.forEach((cd, i) => {
    const row = document.createElement('div');
    row.className = 'dh-drug-row active';
    row.style.marginBottom = '0.35rem';
    row.style.borderRadius = 'var(--radius-sm)';
    row.style.border = '1px solid var(--border-medium)';

    row.innerHTML = `
      <div class="dh-drug-top-bar">
        <span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">💊 ${cd.name || 'داروی جدید'}</span>
        <button type="button" class="btn-delete-imaging" title="حذف این دارو">✕</button>
      </div>
      <div class="dh-3box-container" style="display:flex;">
        <input type="text" class="dh-dose-input cd-dose" placeholder="دوز" value="${cd.dose || ''}">
        <select class="dh-sig-select cd-sig">
          ${DH_SIG_OPTIONS.map((opt) => `<option value="${opt}" ${cd.sig === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
        <input type="text" class="dh-note-input cd-note" placeholder="ملاحظات / آخرین دوز..." value="${cd.note || ''}">
      </div>
    `;

    row.querySelector('.cd-dose').addEventListener('input', (e) => {
      cd.dose = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.cd-sig').addEventListener('change', (e) => {
      cd.sig = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.cd-note').addEventListener('input', (e) => {
      cd.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.btn-delete-imaging').addEventListener('click', () => {
      clinicalState.dh.customDrugs.splice(i, 1);
      renderCustomDrugs();
      saveCurrentCase();
      updateLivePreview();
    });

    container.appendChild(row);
  });
}

function initAddCustomDrugHandler() {
  document.getElementById('btnAddCustomDrug')?.addEventListener('click', () => {
    const name = prompt('نام داروی جدید:');
    if (name && name.trim()) {
      if (!clinicalState.dh.customDrugs) clinicalState.dh.customDrugs = [];
      clinicalState.dh.customDrugs.push({
        id: Date.now(),
        name: name.trim(),
        dose: '',
        sig: 'Daily (روزانه)',
        note: ''
      });
      renderCustomDrugs();
      saveCurrentCase();
      updateLivePreview();
    }
  });

  document.getElementById('dhNote')?.addEventListener('input', (e) => {
    clinicalState.dh.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
}

const FH_QUICK_PILLS = [
  { id: 'fh_cad', name: 'بیماری ایسکمیک قلبی و MI زودرس', en: 'CAD / Premature MI' },
  { id: 'fh_htn_dm', name: 'پرفشاری خون و دیابت نوع ۲', en: 'HTN & Diabetes' },
  { id: 'fh_ca_gi', name: 'سرطان‌های گوارشی (کولون، رکتوم، معده)', en: 'Colorectal / Gastric Cancer' },
  { id: 'fh_ca_breast_ovary', name: 'سرطان پستان و تخمدان (BRCA)', en: 'Breast / Ovarian Cancer' },
  { id: 'fh_ca_thyroid', name: 'سرطان تیروئید و MEN', en: 'Thyroid Cancer / MEN' },
  { id: 'fh_stroke', name: 'سکته مغزی زودرس (CVA / Stroke)', en: 'Premature Stroke' }
];

export function renderFhQuickPills() {
  const bar = document.getElementById('fhQuickPillsBar');
  if (!bar) return;
  bar.innerHTML = '';

  FH_QUICK_PILLS.forEach((p) => {
    const isAdded = (clinicalState.fh.diseases || []).some((d) => d.id === p.id);
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `toggle-chip ${isAdded ? 'active' : ''}`;
    pill.innerHTML = `<span>${isAdded ? '✓' : '➕'}</span> <span>${p.name}</span>`;
    pill.addEventListener('click', () => {
      addFhDisease(p);
    });
    bar.appendChild(pill);
  });
}

function normalizeFhRelativesList(dis) {
  if (!dis) return [];
  const defaultStatus = (dis.status === 'deceased' || dis.isAlive === false) ? 'deceased' : 'alive';
  const defaultAgeNote = dis.ageNote || dis.ageNotes || '';

  if (!Array.isArray(dis.relatives) || dis.relatives.length === 0) {
    dis.relatives = [
      {
        id: 'rel_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        relation: 'پدر',
        vitalStatus: defaultStatus,
        ageOrNote: defaultAgeNote
      }
    ];
    return dis.relatives;
  }

  dis.relatives = dis.relatives.map((r, i) => {
    if (typeof r === 'object' && r !== null) {
      return {
        id: r.id || ('rel_' + Date.now() + '_' + i),
        relation: r.relation || 'پدر',
        vitalStatus: r.vitalStatus || defaultStatus,
        ageOrNote: r.ageOrNote !== undefined ? r.ageOrNote : defaultAgeNote
      };
    }
    return {
      id: 'rel_' + Date.now() + '_' + i,
      relation: String(r),
      vitalStatus: defaultStatus,
      ageOrNote: i === 0 ? defaultAgeNote : ''
    };
  });
  return dis.relatives;
}

export function addFhDisease(item) {
  if (!clinicalState.fh.diseases) clinicalState.fh.diseases = [];
  clinicalState.fh.negFamilyHistory = false;
  clinicalState.fh.masterNeg = false;
  const btnNegFh = typeof document !== 'undefined' ? document.getElementById('btnNegFamilyHistory') : null;
  if (btnNegFh) btnNegFh.classList.remove('is-confirmed');

  const itemTitle = item.diseaseLabel || item.name || item.label || 'بیماری خانوادگی';
  const existing = clinicalState.fh.diseases.find(
    (d) => d.id === item.id || (d.diseaseLabel || d.name || d.label) === itemTitle
  );
  if (!existing) {
    const newDis = {
      id: item.id || ('fh_' + Date.now()),
      diseaseId: item.id || ('fh_' + Date.now()),
      diseaseLabel: itemTitle,
      name: itemTitle,
      en: item.en || '',
      relatives: Array.isArray(item.relatives) && item.relatives.length > 0
        ? item.relatives
        : [
            {
              id: 'rel_' + Date.now() + '_init',
              relation: 'پدر',
              vitalStatus: item.status === 'deceased' ? 'deceased' : 'alive',
              ageOrNote: item.ageNote || item.ageNotes || ''
            }
          ]
    };
    normalizeFhRelativesList(newDis);
    clinicalState.fh.diseases.push(newDis);
  }
  if (typeof document !== 'undefined') {
    renderFhActiveDiseases();
    renderFhQuickPills();
    saveCurrentCase();
    updateLivePreview();
  }
}

export function renderFhActiveDiseases() {
  const container = document.getElementById('fhActiveDiseasesContainer');
  if (!container) return;
  container.innerHTML = '';

  const list = clinicalState.fh.diseases || [];
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'fh-empty-state-card';
    empty.innerHTML = `
      <div class="fh-empty-icon">🧬</div>
      <div class="fh-empty-title">هیچ سابقه بیماری خانوادگی ثبت نشده است</div>
      <div class="fh-empty-desc">از ۶ دکمه آماده بالا یا کادر جستجو، بیماری را به پرونده اضافه کنید و سپس برای هر عضو مبتلا در خانواده (پدر، مادر، برادر، خواهر...) ردیف مستقل ایجاد نمایید.</div>
    `;
    container.appendChild(empty);
    return;
  }

  const relativeOptions = ['پدر', 'مادر', 'برادر', 'خواهر', 'فرزند', 'بستگان درجه ۲'];

  list.forEach((dis, idx) => {
    normalizeFhRelativesList(dis);

    const card = document.createElement('div');
    card.className = 'fh-disease-card';

    // 1. Header: Icon + Name + English Badge + Delete Card Button
    const header = document.createElement('div');
    header.className = 'fh-disease-card-header';

    const titleArea = document.createElement('div');
    titleArea.className = 'fh-disease-title-area';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'fh-disease-icon-pill';
    iconSpan.textContent = '🧬';
    titleArea.appendChild(iconSpan);

    const titleText = document.createElement('span');
    titleText.className = 'fh-disease-name';
    titleText.textContent = dis.diseaseLabel || dis.name || dis.label || 'بیماری خانوادگی';
    titleArea.appendChild(titleText);

    if (dis.en) {
      const enBadge = document.createElement('span');
      enBadge.className = 'fh-disease-en-badge';
      enBadge.textContent = dis.en;
      titleArea.appendChild(enBadge);
    }
    header.appendChild(titleArea);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-fh-card';
    delBtn.title = 'حذف کامل این بیماری خانوادگی';
    delBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      <span>حذف بیماری</span>
    `;
    delBtn.addEventListener('click', () => {
      clinicalState.fh.diseases.splice(idx, 1);
      renderFhActiveDiseases();
      renderFhQuickPills();
      saveCurrentCase();
      updateLivePreview();
    });
    header.appendChild(delBtn);
    card.appendChild(header);

    // 2. Quick Add Relative Buttons Row ([ + پدر ] [ + مادر ] [ + برادر ] ...)
    const relsRow = document.createElement('div');
    relsRow.className = 'fh-relatives-chips-bar';

    const relLabel = document.createElement('span');
    relLabel.className = 'fh-relatives-label';
    relLabel.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> <span>افزودن عضو مبتلا به این بیماری:</span>`;
    relsRow.appendChild(relLabel);

    const chipsWrapper = document.createElement('div');
    chipsWrapper.className = 'fh-chips-wrapper';

    relativeOptions.forEach((rel) => {
      const hasRel = (dis.relatives || []).some((r) => r.relation === rel);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `fh-relative-chip ${hasRel ? 'active' : ''}`;
      chip.textContent = `+ ${rel}`;
      chip.title = `افزودن ردیف مستقل برای «${rel}»`;
      chip.addEventListener('click', () => {
        if (!Array.isArray(dis.relatives)) dis.relatives = [];
        dis.relatives.push({
          id: 'rel_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          relation: rel,
          vitalStatus: 'alive',
          ageOrNote: ''
        });
        renderFhActiveDiseases();
        saveCurrentCase();
        updateLivePreview();
      });
      chipsWrapper.appendChild(chip);
    });
    relsRow.appendChild(chipsWrapper);
    card.appendChild(relsRow);

    // 3. Dedicated Per-Relative Rows Container
    const relRowsList = document.createElement('div');
    relRowsList.className = 'fh-relatives-rows-container';

    dis.relatives.forEach((relObj, rIdx) => {
      const relRow = document.createElement('div');
      relRow.className = 'fh-relative-detail-row';

      // A. Relation Badge
      const relBadge = document.createElement('span');
      relBadge.className = 'fh-rel-row-badge';
      relBadge.innerHTML = `👤 <strong>${relObj.relation}</strong>`;
      relRow.appendChild(relBadge);

      // B. Vital Status Toggle ([ در قید حیات ] | [ فوت‌شده ])
      const vitalToggle = document.createElement('div');
      vitalToggle.className = 'fh-vital-status-toggle';

      const btnAlive = document.createElement('button');
      btnAlive.type = 'button';
      btnAlive.className = `fh-vital-btn ${relObj.vitalStatus !== 'deceased' ? 'active-alive' : ''}`;
      btnAlive.innerHTML = `<span>🟢</span> <span>در قید حیات</span>`;
      btnAlive.addEventListener('click', () => {
        relObj.vitalStatus = 'alive';
        btnAlive.className = 'fh-vital-btn active-alive';
        btnDeceased.className = 'fh-vital-btn';
        saveCurrentCase();
        updateLivePreview();
      });

      const btnDeceased = document.createElement('button');
      btnDeceased.type = 'button';
      btnDeceased.className = `fh-vital-btn ${relObj.vitalStatus === 'deceased' ? 'active-deceased' : ''}`;
      btnDeceased.innerHTML = `<span>⚫</span> <span>فوت‌شده</span>`;
      btnDeceased.addEventListener('click', () => {
        relObj.vitalStatus = 'deceased';
        btnDeceased.className = 'fh-vital-btn active-deceased';
        btnAlive.className = 'fh-vital-btn';
        saveCurrentCase();
        updateLivePreview();
      });

      vitalToggle.appendChild(btnAlive);
      vitalToggle.appendChild(btnDeceased);
      relRow.appendChild(vitalToggle);

      // C. Individual Age/Onset/Cause Note Input
      const ageInp = document.createElement('input');
      ageInp.type = 'text';
      ageInp.className = 'fh-age-notes-input';
      ageInp.placeholder = `سن بروز / سن فوت و توضیحات «${relObj.relation}» (مثلاً: سکته در سن ۴۰ سالگی)...`;
      ageInp.value = relObj.ageOrNote || '';
      ageInp.addEventListener('input', (e) => {
        relObj.ageOrNote = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      relRow.appendChild(ageInp);

      // D. Delete This Relative Row Button
      const delRelBtn = document.createElement('button');
      delRelBtn.type = 'button';
      delRelBtn.className = 'btn-delete-fh-rel-row';
      delRelBtn.title = `حذف ردیف ${relObj.relation}`;
      delRelBtn.textContent = '✕';
      delRelBtn.addEventListener('click', () => {
        dis.relatives.splice(rIdx, 1);
        if (dis.relatives.length === 0) {
          clinicalState.fh.diseases.splice(idx, 1);
        }
        renderFhActiveDiseases();
        renderFhQuickPills();
        saveCurrentCase();
        updateLivePreview();
      });
      relRow.appendChild(delRelBtn);

      relRowsList.appendChild(relRow);
    });

    card.appendChild(relRowsList);
    container.appendChild(card);
  });
}

function initAhShFhHandlers() {
  // AH NKDA
  const nkdaBtn = document.getElementById('btnToggleNKDA');
  const details = document.getElementById('allergyDetailsContainer');
  nkdaBtn?.addEventListener('click', () => {
    clinicalState.ah.nkda = !clinicalState.ah.nkda;
    const check = document.getElementById('nkdaCheckIcon');
    if (check) check.textContent = clinicalState.ah.nkda ? '☑️' : '◻️';
    if (details) details.style.opacity = clinicalState.ah.nkda ? '0.4' : '1';
    saveCurrentCase();
    updateLivePreview();
  });

  // AH Templates
  const ahContainer = document.getElementById('ahTemplatesContainer');
  if (ahContainer) {
    ahContainer.innerHTML = '';
    SURGICAL_SCHEMA.allergyTemplates.forEach((t) => {
      const isSel = (clinicalState.ah.selected || []).find((x) => x.id === t.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `toggle-chip ${isSel ? 'active' : ''}`;
      chip.textContent = t.label;
      chip.addEventListener('click', () => {
        if (!clinicalState.ah.selected) clinicalState.ah.selected = [];
        const idx = clinicalState.ah.selected.findIndex((x) => x.id === t.id);
        if (idx >= 0) {
          clinicalState.ah.selected.splice(idx, 1);
          chip.classList.remove('active');
        } else {
          clinicalState.ah.selected.push({ id: t.id, label: t.label, detail: '' });
          chip.classList.add('active');
        }
        saveCurrentCase();
        updateLivePreview();
      });
      ahContainer.appendChild(chip);
    });
  }

  document.getElementById('ahNote')?.addEventListener('input', (e) => {
    clinicalState.ah.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // SH Visual Negative Buttons & Inputs
  const btnNegSmoke = document.getElementById('btnNegSmoking');
  const btnNegOpium = document.getElementById('btnNegOpium');
  const btnNegAlcohol = document.getElementById('btnNegAlcohol');

  function syncShVisualButtons() {
    btnNegSmoke?.classList.toggle('is-confirmed', !!clinicalState.sh.negSmoking);
    btnNegOpium?.classList.toggle('is-confirmed', !!clinicalState.sh.negOpium);
    btnNegAlcohol?.classList.toggle('is-confirmed', !!clinicalState.sh.negAlcohol);
  }

  btnNegSmoke?.addEventListener('click', () => {
    clinicalState.sh.negSmoking = !clinicalState.sh.negSmoking;
    if (clinicalState.sh.negSmoking) {
      clinicalState.sh.cigsPerDay = '';
      clinicalState.sh.yearsSmoked = '';
      if (cigs) cigs.value = '';
      if (years) years.value = '';
      if (packYearBadge) packYearBadge.textContent = '0.0 Pack-Year';
    }
    syncShVisualButtons();
    saveCurrentCase();
    updateLivePreview();
  });

  btnNegOpium?.addEventListener('click', () => {
    clinicalState.sh.negOpium = !clinicalState.sh.negOpium;
    if (clinicalState.sh.negOpium) {
      clinicalState.sh.opium = '';
      const opInp = document.getElementById('shOpium');
      if (opInp) opInp.value = '';
    }
    syncShVisualButtons();
    saveCurrentCase();
    updateLivePreview();
  });

  btnNegAlcohol?.addEventListener('click', () => {
    clinicalState.sh.negAlcohol = !clinicalState.sh.negAlcohol;
    syncShVisualButtons();
    saveCurrentCase();
    updateLivePreview();
  });

  const cigs = document.getElementById('shCigsPerDay');
  const years = document.getElementById('shYearsSmoked');
  const packYearBadge = document.getElementById('packYearBadge');
  function updatePackYear() {
    const c = Number(cigs?.value || 0);
    const y = Number(years?.value || 0);
    const py = c > 0 && y > 0 ? ((c / 20) * y).toFixed(1) : '0.0';
    if (packYearBadge) packYearBadge.textContent = `${py} Pack-Year`;
    clinicalState.sh.cigsPerDay = cigs?.value || '';
    clinicalState.sh.yearsSmoked = years?.value || '';
    if (c > 0 || y > 0) {
      clinicalState.sh.negSmoking = false;
      syncShVisualButtons();
    }
    saveCurrentCase();
    updateLivePreview();
  }
  cigs?.addEventListener('input', updatePackYear);
  years?.addEventListener('input', updatePackYear);

  document.getElementById('shOpium')?.addEventListener('input', (e) => {
    clinicalState.sh.opium = e.target.value;
    if (e.target.value.trim().length > 0) {
      clinicalState.sh.negOpium = false;
      syncShVisualButtons();
    }
    saveCurrentCase();
    updateLivePreview();
  });
  document.getElementById('shNote')?.addEventListener('input', (e) => {
    clinicalState.sh.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // FH Master Negative & Quick Pills & Active Diseases
  const btnNegFh = document.getElementById('btnNegFamilyHistory');
  function syncFhNegButton() {
    btnNegFh?.classList.toggle('is-confirmed', !!clinicalState.fh.negFamilyHistory || !!clinicalState.fh.masterNeg);
  }

  btnNegFh?.addEventListener('click', () => {
    const isNeg = !(clinicalState.fh.negFamilyHistory || clinicalState.fh.masterNeg);
    clinicalState.fh.negFamilyHistory = isNeg;
    clinicalState.fh.masterNeg = isNeg;
    if (isNeg) {
      clinicalState.fh.diseases = [];
      renderFhActiveDiseases();
      renderFhQuickPills();
    }
    syncFhNegButton();
    saveCurrentCase();
    updateLivePreview();
  });

  renderFhQuickPills();
  renderFhActiveDiseases();

  // Legacy FH Chips fallback
  const fhContainer = document.getElementById('fhChipsContainer');
  if (fhContainer) {
    fhContainer.innerHTML = '';
    SURGICAL_SCHEMA.fhItems.forEach((f) => {
      const isSel = (clinicalState.fh.selected || []).find((x) => x.id === f.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `toggle-chip ${isSel ? 'active' : ''}`;
      chip.textContent = f.label;
      chip.addEventListener('click', () => {
        if (!clinicalState.fh.selected) clinicalState.fh.selected = [];
        const idx = clinicalState.fh.selected.findIndex((x) => x.id === f.id);
        if (idx >= 0) {
          clinicalState.fh.selected.splice(idx, 1);
          chip.classList.remove('active');
        } else {
          clinicalState.fh.selected.push({ id: f.id, label: f.label, detail: '' });
          chip.classList.add('active');
        }
        saveCurrentCase();
        updateLivePreview();
      });
      fhContainer.appendChild(chip);
    });
  }

  document.getElementById('fhNote')?.addEventListener('input', (e) => {
    clinicalState.fh.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // Initial sync
  syncShVisualButtons();
  syncFhNegButton();

  // DH No Routine Meds button wiring
  const btnNoRoutineMeds = document.getElementById('btnNoRoutineMedications');
  btnNoRoutineMeds?.addEventListener('click', () => {
    clinicalState.dh.noRoutineMeds = !clinicalState.dh.noRoutineMeds;
    btnNoRoutineMeds.classList.toggle('is-confirmed', clinicalState.dh.noRoutineMeds);
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   Tab 5: Review of Systems (ROS) - Bilingual & Intelligent Gender Filter
   ========================================================================== */
function renderRosGroups() {
  const container = document.getElementById('rosGroupsAccordion');
  const genderToggle = document.getElementById('btnToggleRosGenderFilter');
  if (!container) return;
  container.innerHTML = '';

  const patientGender = clinicalState.demographics.gender || 'female';
  const showAllGenders = !!clinicalState.ros.showAllGenders;

  if (genderToggle) {
    document.getElementById('rosGenderFilterIcon').textContent = showAllGenders ? '🔓' : '🔒';
    document.getElementById('rosGenderFilterText').textContent = showAllGenders ? 'نمایش همه آیتم‌ها' : 'فیلتر جنسیت فعال';
    genderToggle.onclick = () => {
      clinicalState.ros.showAllGenders = !clinicalState.ros.showAllGenders;
      renderRosGroups();
      saveCurrentCase();
      updateLivePreview();
    };
  }

  ROS_GROUPS_BILINGUAL.forEach((grp) => {
    const filteredItems = grp.items.filter((item) => {
      if (showAllGenders || item.gender === 'all') return true;
      if (patientGender === 'female' && item.gender === 'female') return true;
      if (patientGender === 'male' && item.gender === 'male') return true;
      if (patientGender === 'other') return true;
      return false;
    });

    if (filteredItems.length === 0) return;

    let posCount = 0;
    let negCount = 0;
    let neutralCount = 0;

    filteredItems.forEach((item) => {
      const it = clinicalState.ros.items[item.id];
      const st = it ? (typeof it === 'object' ? it.state : it) : 0;
      if (st === 1) posCount++;
      else if (st === -1) negCount++;
      else neutralCount++;
    });

    const isResetState = neutralCount === 0 && negCount > 0;

    const grpCard = document.createElement('div');
    grpCard.className = 'subsystem-accordion';
    grpCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'subsystem-header';

    const headerRight = document.createElement('div');
    headerRight.className = 'subsystem-header-right';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'subsystem-title';
    titleSpan.textContent = grp.group;
    headerRight.appendChild(titleSpan);

    if (posCount > 0) {
      const bPos = document.createElement('span');
      bPos.className = 'subsystem-badge-counter pos';
      bPos.textContent = `${posCount} مثبت`;
      headerRight.appendChild(bPos);
    }
    if (negCount > 0) {
      const bNeg = document.createElement('span');
      bNeg.className = 'subsystem-badge-counter neg';
      bNeg.textContent = `${negCount} منفی`;
      headerRight.appendChild(bNeg);
    }

    const headerLeft = document.createElement('div');
    headerLeft.className = 'subsystem-header-left';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = `btn-toggle-sub-negatives ${isResetState ? 'is-reset' : ''}`;
    toggleBtn.innerHTML = isResetState
      ? `<span>↺ بازنشانی منفی‌ها</span>`
      : `<span>− منفی کردن بقیه</span>`;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const makeNeg = !isResetState;
      filteredItems.forEach((item) => {
        const it = clinicalState.ros.items[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (makeNeg) {
          if (st === 0) {
            clinicalState.ros.items[item.id] = { state: -1, detail: '', label: item.label };
          }
        } else {
          if (st === -1) {
            delete clinicalState.ros.items[item.id];
          }
        }
      });
      renderRosGroups();
      saveCurrentCase();
      updateLivePreview();
    });
    headerLeft.appendChild(toggleBtn);

    const normalBtn = document.createElement('button');
    normalBtn.type = 'button';
    normalBtn.className = 'btn-set-section-normal';
    normalBtn.innerHTML = `<span>✓</span><span>معاینه کاملاً طبیعی</span>`;
    normalBtn.title = 'ثبت معاینه کاملاً طبیعی این بخش بر اساس استانداردهای بالینی';
    normalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const baseline = PE_NORMAL_BASELINES[pillar.id];
      if (baseline) {
        pillar.items.forEach((item) => {
          delete clinicalState.pe.findings[item.id];
        });
        (baseline.pos || []).forEach((posId) => {
          const it = pillar.items.find((x) => x.id === posId);
          clinicalState.pe.findings[posId] = { state: 1, detail: '', label: it ? it.label : posId };
        });
        (baseline.neg || []).forEach((negId) => {
          const it = pillar.items.find((x) => x.id === negId);
          clinicalState.pe.findings[negId] = { state: -1, detail: '', label: it ? it.label : negId };
        });
        renderPeMandatoryPillars();
        saveCurrentCase();
        updateLivePreview();
      }
    });
    headerLeft.appendChild(normalBtn);

    const chevron = document.createElement('span');
    chevron.className = 'subsystem-chevron';
    chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    headerLeft.appendChild(chevron);

    header.appendChild(headerRight);
    header.appendChild(headerLeft);

    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      grpCard.classList.toggle('is-collapsed');
    });

    grpCard.appendChild(header);

    const body = document.createElement('div');
    body.className = 'subsystem-body';

    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';

    filteredItems.forEach((item) => {
      const cur = clinicalState.ros.items[item.id];
      const chipWrap = renderInlineDetailTriStateChip({
        id: item.id,
        label: item.label,
        detailHint: item.detailHint || 'توضیحات...',
        currentItemData: cur,
        onStateChange: (newState, detailText) => {
          if (newState === 0) {
            delete clinicalState.ros.items[item.id];
          } else {
            clinicalState.ros.items[item.id] = { state: newState, detail: detailText, label: item.label };
          }
        },
        onDetailChange: (detailText) => {
          if (clinicalState.ros.items[item.id]) {
            clinicalState.ros.items[item.id].detail = detailText;
          }
        }
      });
      chipsContainer.appendChild(chipWrap);
    });

    body.appendChild(chipsContainer);
    grpCard.appendChild(body);
    container.appendChild(grpCard);
  });
}

function initRosMasterNegativeHandler() {
  const toggleRosUnobtainable = () => {
    if (!clinicalState.ros) clinicalState.ros = {};
    clinicalState.ros.unobtainable = !clinicalState.ros.unobtainable;
    if (clinicalState.ros.unobtainable && !clinicalState.ros.unobtainableReason) {
      clinicalState.ros.unobtainableReason = 'به علت شرایط حاد بالینی، کاهش سطح هوشیاری و اینتوباسیون بیمار، اخذ مرور سیستم‌های معمول امکان‌پذیر نبوده و ارزیابی بر پایه شواهد عینی، معاینه فیزیکی و پروتکل ترومای ATLS متمرکز می‌باشد.';
    }
    syncDomFromState();
    saveCurrentCase();
    updateLivePreview();
  };

  document.getElementById('btnRosUnobtainableToggle')?.addEventListener('click', toggleRosUnobtainable);
  document.getElementById('btnRosUnobtainableManual')?.addEventListener('click', toggleRosUnobtainable);

  const masterBtn = document.getElementById('btnRosMasterNegative');
  if (!masterBtn) return;

  masterBtn.addEventListener('click', () => {
    const patientGender = clinicalState.demographics.gender || 'female';
    const showAllGenders = !!clinicalState.ros.showAllGenders;

    ROS_GROUPS_BILINGUAL.forEach((grp) => {
      grp.items.forEach((item) => {
        if (!showAllGenders && item.gender !== 'all') {
          if (patientGender === 'female' && item.gender !== 'female') return;
          if (patientGender === 'male' && item.gender !== 'male') return;
        }
        const it = clinicalState.ros.items[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (st === 0) {
          clinicalState.ros.items[item.id] = { state: -1, detail: '', label: item.label };
        }
      });
    });
    renderRosGroups();
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   Tab 6: Physical Examination (PE) - Vitals Persistence & 4 Abdominal Pillars
   ========================================================================== */
function initPeVitalsHandlers() {
  const vitalsMap = {
    peVitalsBp: 'bp',
    peVitalsPr: 'pr',
    peVitalsRr: 'rr',
    peVitalsTemp: 'temp',
    peVitalsSpo2: 'spo2',
    peVitalsNpo: 'npo'
  };

  Object.entries(vitalsMap).forEach(([id, prop]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      clinicalState.pe.vitals[prop] = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });

  document.getElementById('peNote')?.addEventListener('input', (e) => {
    clinicalState.pe.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
}

function renderPeMandatoryPillars() {
  const container = document.getElementById('peMandatoryPillarsContainer');
  if (!container) return;
  container.innerHTML = '';

  PE_MANDATORY_PILLARS.forEach((pillar) => {
    let posCount = 0;
    let negCount = 0;
    let neutralCount = 0;

    pillar.items.forEach((item) => {
      const it = clinicalState.pe.findings[item.id];
      const st = it ? (typeof it === 'object' ? it.state : it) : 0;
      if (st === 1) posCount++;
      else if (st === -1) negCount++;
      else neutralCount++;
    });

    const isResetState = neutralCount === 0 && negCount > 0;

    const pillarCard = document.createElement('div');
    pillarCard.className = 'subsystem-accordion';
    pillarCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'subsystem-header';

    const headerRight = document.createElement('div');
    headerRight.className = 'subsystem-header-right';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'subsystem-title';
    titleSpan.textContent = pillar.title;
    headerRight.appendChild(titleSpan);

    if (posCount > 0) {
      const bPos = document.createElement('span');
      bPos.className = 'subsystem-badge-counter pos';
      bPos.textContent = `${posCount} مثبت`;
      headerRight.appendChild(bPos);
    }
    if (negCount > 0) {
      const bNeg = document.createElement('span');
      bNeg.className = 'subsystem-badge-counter neg';
      bNeg.textContent = `${negCount} منفی`;
      headerRight.appendChild(bNeg);
    }

    const headerLeft = document.createElement('div');
    headerLeft.className = 'subsystem-header-left';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = `btn-toggle-sub-negatives ${isResetState ? 'is-reset' : ''}`;
    toggleBtn.innerHTML = isResetState
      ? `<span>↺ بازنشانی منفی‌ها</span>`
      : `<span>− منفی کردن بقیه</span>`;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const makeNeg = !isResetState;
      pillar.items.forEach((item) => {
        const it = clinicalState.pe.findings[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (makeNeg) {
          if (st === 0) {
            clinicalState.pe.findings[item.id] = { state: -1, detail: '', label: item.label };
          }
        } else {
          if (st === -1) {
            delete clinicalState.pe.findings[item.id];
          }
        }
      });
      renderPeMandatoryPillars();
      saveCurrentCase();
      updateLivePreview();
    });
    headerLeft.appendChild(toggleBtn);

    const chevron = document.createElement('span');
    chevron.className = 'subsystem-chevron';
    chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    headerLeft.appendChild(chevron);

    header.appendChild(headerRight);
    header.appendChild(headerLeft);

    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      pillarCard.classList.toggle('is-collapsed');
    });

    pillarCard.appendChild(header);

    const body = document.createElement('div');
    body.className = 'subsystem-body';

    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';

    pillar.items.forEach((item) => {
      const cur = clinicalState.pe.findings[item.id];
      const chipWrap = renderInlineDetailTriStateChip({
        id: item.id,
        label: item.label,
        detailHint: item.detailHint || 'توضیحات...',
        currentItemData: cur,
        onStateChange: (newState, detailText) => {
          if (newState === 0) {
            delete clinicalState.pe.findings[item.id];
          } else {
            clinicalState.pe.findings[item.id] = { state: newState, detail: detailText, label: item.label };
          }
        },
        onDetailChange: (detailText) => {
          if (clinicalState.pe.findings[item.id]) {
            clinicalState.pe.findings[item.id].detail = detailText;
          }
        }
      });
      chipsContainer.appendChild(chipWrap);
    });

    body.appendChild(chipsContainer);
    pillarCard.appendChild(body);
    container.appendChild(pillarCard);
  });
}

function renderPeUnlockableModules() {
  const bar = document.getElementById('peUnlockableModulesBar');
  const unlockedContainer = document.getElementById('peUnlockedModulesContainer');
  if (!bar || !unlockedContainer) return;

  bar.innerHTML = '';
  unlockedContainer.innerHTML = '';

  const unlocked = clinicalState.pe.unlockedModules || [];

  PE_UNLOCKABLE_MODULES.forEach((mod) => {
    if (!unlocked.includes(mod.id)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-unlock-module';
      btn.innerHTML = `<span>${mod.buttonLabel}</span><span>🔒</span>`;
      btn.addEventListener('click', () => {
        clinicalState.pe.unlockedModules.push(mod.id);
        renderPeUnlockableModules();
        saveCurrentCase();
        updateLivePreview();
      });
      bar.appendChild(btn);
    } else {
      // Render unlocked module
      const card = document.createElement('div');
      card.className = 'unlocked-module-card';

      const header = document.createElement('div');
      header.className = 'unlocked-module-header';
      header.innerHTML = `
        <span class="unlocked-module-title">🔓 ${mod.title}</span>
        <button type="button" class="btn btn-secondary btn-sm btn-close-exam-mod" style="color:#EF4444;">بستن و حذف</button>
      `;

      header.querySelector('.btn-close-exam-mod').addEventListener('click', () => {
        clinicalState.pe.unlockedModules = clinicalState.pe.unlockedModules.filter((id) => id !== mod.id);
        mod.items.forEach((item) => delete clinicalState.pe.findings[item.id]);
        renderPeUnlockableModules();
        saveCurrentCase();
        updateLivePreview();
      });
      card.appendChild(header);

      const chipsGrid = document.createElement('div');
      chipsGrid.className = 'chips-container';

      mod.items.forEach((item) => {
        const cur = clinicalState.pe.findings?.[item.id];
        const chipWrap = renderInlineDetailTriStateChip({
          id: item.id,
          label: item.label,
          detailHint: item.detailHint || 'توضیحات...',
          currentItemData: cur,
          onStateChange: (newState, detailText) => {
            if (newState === 0) {
              delete clinicalState.pe.findings[item.id];
            } else {
              clinicalState.pe.findings[item.id] = { state: newState, detail: detailText, label: item.label };
            }
          },
          onDetailChange: (detailText) => {
            if (clinicalState.pe.findings[item.id]) {
              clinicalState.pe.findings[item.id].detail = detailText;
            }
          }
        });
        chipsGrid.appendChild(chipWrap);
      });
      card.appendChild(chipsGrid);
      unlockedContainer.appendChild(card);
    }
  });
}

/* ==========================================================================
   Tab 6: Local Mass & Lesion Examination Module
   ========================================================================== */
function renderMassExamModule() {
  const container = document.getElementById('peMassExamContainer');
  if (!container) return;
  container.innerHTML = '';

  const list = clinicalState.pe.massExams || [];
  list.forEach((exam, idx) => {
    const card = document.createElement('div');
    card.className = 'mass-exam-card';

    const header = document.createElement('div');
    header.className = 'mass-exam-header';

    const title = document.createElement('span');
    title.className = 'mass-exam-title';
    title.innerHTML = `<span>🔘</span> <span>معاینه موضعی توده / ضایعه #${idx + 1}</span>`;
    header.appendChild(title);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-mass-exam';
    delBtn.innerHTML = `<span>🗑️</span><span>حذف این کارت معاینه</span>`;
    delBtn.addEventListener('click', () => {
      list.splice(idx, 1);
      renderMassExamModule();
      saveCurrentCase();
      updateLivePreview();
    });
    header.appendChild(delBtn);
    card.appendChild(header);

    const grid1 = document.createElement('div');
    grid1.className = 'form-grid-2';

    // Location
    const locGroup = document.createElement('div');
    locGroup.className = 'form-group';
    locGroup.innerHTML = `<label class="form-label">محل آناتومیک توده</label>`;
    const locInput = document.createElement('input');
    locInput.type = 'text';
    locInput.className = 'input-text';
    locInput.value = exam.location || '';
    locInput.placeholder = 'مثلاً پوست سر ناحیه اکسیپیتال، ربع فوقانی خارجی پستان راست...';
    locInput.addEventListener('input', (e) => {
      exam.location = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    locGroup.appendChild(locInput);
    grid1.appendChild(locGroup);

    // Dimensions
    const dimGroup = document.createElement('div');
    dimGroup.className = 'form-group';
    dimGroup.innerHTML = `<label class="form-label">ابعاد تقریبی (طول × عرض)</label>`;
    const dimInput = document.createElement('input');
    dimInput.type = 'text';
    dimInput.className = 'input-text';
    dimInput.value = exam.dimensions || '';
    dimInput.placeholder = 'مثلاً 3x2 cm یا قطب ۲ سانتی‌متری';
    dimInput.addEventListener('input', (e) => {
      exam.dimensions = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    dimGroup.appendChild(dimInput);
    grid1.appendChild(dimGroup);

    card.appendChild(grid1);

    const grid2 = document.createElement('div');
    grid2.className = 'form-grid-3';
    grid2.style.marginTop = '0.5rem';

    // Consistency
    const conGroup = document.createElement('div');
    conGroup.className = 'form-group';
    conGroup.innerHTML = `<label class="form-label">قوام توده (Consistency)</label>`;
    const conSelect = document.createElement('select');
    conSelect.className = 'input-select';
    MASS_EXAM_SCHEMA.consistencies.forEach((c) => {
      const op = document.createElement('option');
      op.value = c;
      op.textContent = c;
      if (exam.consistency === c) op.selected = true;
      conSelect.appendChild(op);
    });
    conSelect.addEventListener('change', (e) => {
      exam.consistency = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    conGroup.appendChild(conSelect);
    grid2.appendChild(conGroup);

    // Margins
    const marGroup = document.createElement('div');
    marGroup.className = 'form-group';
    marGroup.innerHTML = `<label class="form-label">حدود و مارجین (Margins)</label>`;
    const marSelect = document.createElement('select');
    marSelect.className = 'input-select';
    MASS_EXAM_SCHEMA.margins.forEach((m) => {
      const op = document.createElement('option');
      op.value = m;
      op.textContent = m;
      if (exam.margin === m) op.selected = true;
      marSelect.appendChild(op);
    });
    marSelect.addEventListener('change', (e) => {
      exam.margin = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    marGroup.appendChild(marSelect);
    grid2.appendChild(marGroup);

    // Mobility
    const mobGroup = document.createElement('div');
    mobGroup.className = 'form-group';
    mobGroup.innerHTML = `<label class="form-label">تحرک‌پذیری (Mobility)</label>`;
    const mobSelect = document.createElement('select');
    mobSelect.className = 'input-select';
    MASS_EXAM_SCHEMA.mobilities.forEach((mb) => {
      const op = document.createElement('option');
      op.value = mb;
      op.textContent = mb;
      if (exam.mobility === mb) op.selected = true;
      mobSelect.appendChild(op);
    });
    mobSelect.addEventListener('change', (e) => {
      exam.mobility = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    mobGroup.appendChild(mobSelect);
    grid2.appendChild(mobGroup);

    card.appendChild(grid2);

    const grid3 = document.createElement('div');
    grid3.className = 'form-grid-2';
    grid3.style.marginTop = '0.5rem';

    // Skin findings
    const skinGroup = document.createElement('div');
    skinGroup.className = 'form-group';
    skinGroup.innerHTML = `<label class="form-label">یافته‌های پوست رویی و تندرنس</label>`;
    const skinSelect = document.createElement('select');
    skinSelect.className = 'input-select';
    MASS_EXAM_SCHEMA.skinFindings.forEach((sf) => {
      const op = document.createElement('option');
      op.value = sf;
      op.textContent = sf;
      if (exam.skinSign === sf) op.selected = true;
      skinSelect.appendChild(op);
    });
    skinSelect.addEventListener('change', (e) => {
      exam.skinSign = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    skinGroup.appendChild(skinSelect);
    grid3.appendChild(skinGroup);

    // Note
    const noteGroup = document.createElement('div');
    noteGroup.className = 'form-group';
    noteGroup.innerHTML = `<label class="form-label">توضیحات تکمیلی معاینه توده</label>`;
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'input-text';
    noteInput.value = exam.note || '';
    noteInput.placeholder = 'مثلاً عدم ترانس‌ایلومیناسیون، بدون ضربان...';
    noteInput.addEventListener('input', (e) => {
      exam.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    noteGroup.appendChild(noteInput);
    grid3.appendChild(noteGroup);

    card.appendChild(grid3);
    container.appendChild(card);
  });
}

export function renderPeComprehensiveSystems() {
  const container = document.getElementById('peComprehensiveSystemsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!clinicalState.pe.comprehensiveSystems) clinicalState.pe.comprehensiveSystems = {};

  const systemsToRender = PE_COMPREHENSIVE_SYSTEMS.filter((s) => !s.isPrioritySurgical);

  systemsToRender.forEach((sys) => {
    if (!clinicalState.pe.comprehensiveSystems[sys.id]) {
      clinicalState.pe.comprehensiveSystems[sys.id] = {
        examined: false,
        isNormal: false,
        text: '',
        selectedTags: []
      };
    }
    const sysData = clinicalState.pe.comprehensiveSystems[sys.id];

    const card = document.createElement('div');
    card.className = `pe-system-accordion is-collapsed ${sysData.isNormal ? 'is-normal-confirmed' : ''}`;

    const header = document.createElement('div');
    header.className = 'pe-system-header';

    const right = document.createElement('div');
    right.className = 'pe-system-header-right';
    right.innerHTML = `<strong>${sys.title}</strong>`;

    const badge = document.createElement('span');
    badge.className = `pe-system-badge ${sysData.isNormal ? 'badge-normal' : sysData.selectedTags?.length > 0 || sysData.text ? 'badge-finding' : 'badge-idle'}`;
    badge.textContent = sysData.isNormal
      ? '✓ طبیعی (Normal)'
      : (sysData.selectedTags?.length > 0 || sysData.text ? '⚠️ یافته ثبت‌شده' : 'ثبت نشده');
    right.appendChild(badge);

    const left = document.createElement('div');
    left.className = 'pe-system-header-left';

    const btnNormal = document.createElement('button');
    btnNormal.type = 'button';
    btnNormal.className = `btn-mark-system-normal ${sysData.isNormal ? 'is-confirmed' : ''}`;
    btnNormal.innerHTML = `<span>✓</span><span>ثبت معاینه نرمال</span>`;
    btnNormal.title = 'ثبت معاینه کامل طبیعی این سیستم';
    btnNormal.addEventListener('click', (e) => {
      e.stopPropagation();
      sysData.isNormal = !sysData.isNormal;
      sysData.examined = true;
      if (sysData.isNormal) {
        card.classList.add('is-normal-confirmed');
        btnNormal.classList.add('is-confirmed');
        badge.className = 'pe-system-badge badge-normal';
        badge.textContent = '✓ طبیعی (Normal)';
      } else {
        card.classList.remove('is-normal-confirmed');
        btnNormal.classList.remove('is-confirmed');
        badge.className = 'pe-system-badge badge-idle';
        badge.textContent = 'ثبت نشده';
      }
      saveCurrentCase();
      updateLivePreview();
    });
    left.appendChild(btnNormal);

    const chevron = document.createElement('span');
    chevron.className = 'pe-system-chevron';
    chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    left.appendChild(chevron);

    header.appendChild(right);
    header.appendChild(left);

    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      card.classList.toggle('is-collapsed');
    });

    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pe-system-body';

    // Baseline guide
    if (sys.normalBaseline) {
      const guide = document.createElement('div');
      guide.className = 'pe-baseline-guide';
      guide.style.cssText = 'font-size: 0.8rem; color: var(--text-muted); background: var(--bg-canvas); padding: 0.4rem 0.6rem; border-radius: 6px; margin-bottom: 0.5rem;';
      guide.innerHTML = `<strong>نرمال پایه:</strong> ${sys.normalBaseline}`;
      body.appendChild(guide);
    }

    // Standard finding chips
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'chips-container';
    (sys.items || []).forEach((item) => {
      const isSel = (sysData.selectedTags || []).includes(item.label);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `toggle-chip ${isSel ? 'active' : ''}`;
      chip.textContent = item.label;
      chip.addEventListener('click', () => {
        if (!sysData.selectedTags) sysData.selectedTags = [];
        const idx = sysData.selectedTags.indexOf(item.label);
        if (idx >= 0) {
          sysData.selectedTags.splice(idx, 1);
          chip.classList.remove('active');
        } else {
          sysData.selectedTags.push(item.label);
          chip.classList.add('active');
          sysData.examined = true;
        }
        badge.className = `pe-system-badge ${sysData.isNormal ? 'badge-normal' : sysData.selectedTags.length > 0 || sysData.text ? 'badge-finding' : 'badge-idle'}`;
        badge.textContent = sysData.isNormal ? '✓ طبیعی (Normal)' : (sysData.selectedTags.length > 0 || sysData.text ? '⚠️ یافته ثبت‌شده' : 'ثبت نشده');
        saveCurrentCase();
        updateLivePreview();
      });
      chipsWrap.appendChild(chip);
    });
    body.appendChild(chipsWrap);

    // Detail text
    const textInp = document.createElement('input');
    textInp.type = 'text';
    textInp.className = 'input-text';
    textInp.style.cssText = 'margin-top: 0.5rem; font-size: 0.85rem;';
    textInp.placeholder = 'یافته‌های اختصاصی معاینه این سیستم (مثلاً: لنفادنوپاتی ۲ سانتی خلف عضله SCM)...';
    textInp.value = sysData.text || '';
    textInp.addEventListener('input', (e) => {
      sysData.text = e.target.value;
      if (e.target.value.trim().length > 0) sysData.examined = true;
      badge.className = `pe-system-badge ${sysData.isNormal ? 'badge-normal' : sysData.selectedTags?.length > 0 || sysData.text ? 'badge-finding' : 'badge-idle'}`;
      badge.textContent = sysData.isNormal ? '✓ طبیعی (Normal)' : (sysData.selectedTags?.length > 0 || sysData.text ? '⚠️ یافته ثبت‌شده' : 'ثبت نشده');
      saveCurrentCase();
      updateLivePreview();
    });
    body.appendChild(textInp);

    card.appendChild(body);
    container.appendChild(card);
  });
}

function initMassExamHandlers() {
  document.getElementById('btnAddMassExam')?.addEventListener('click', () => {
    if (!clinicalState.pe.massExams) clinicalState.pe.massExams = [];
    clinicalState.pe.massExams.push({
      id: Date.now(),
      location: '',
      dimensions: '',
      consistency: 'نرم و خمیری (Soft / Doughy)',
      margin: 'منظم و کاملاً مشخص (Well-defined / Circumscribed)',
      mobility: 'کاملاً متحرک در هر دو جهت (Freely Mobile)',
      skinSign: 'پوست نرمال و بدون تندرنس (Non-tender / Normal skin)',
      note: ''
    });
    renderMassExamModule();
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   Tab 6: ATLS Primary & Secondary Survey Trauma & Burn Module
   ========================================================================== */
function renderAtlsExamModule() {
  const container = document.getElementById('peAtlsExamContainer');
  const toggleBtn = document.getElementById('btnToggleAtlsExam');
  if (!container) return;
  container.innerHTML = '';

  const atls = clinicalState.pe.atlsExam;
  if (!atls || !atls.active) {
    if (toggleBtn) {
      toggleBtn.innerHTML = `<span>🚨</span> <span>باز کردن ماژول تروما، جراحات نافذ و سوختگی (ATLS Exam)</span>`;
    }
    return;
  }

  if (toggleBtn) {
    toggleBtn.innerHTML = `<span>✕</span> <span>بستن ماژول تروما و ATLS</span>`;
  }

  const card = document.createElement('div');
  card.className = 'atls-exam-card';

  // Primary survey header
  const title = document.createElement('div');
  title.className = 'atls-exam-title';
  title.innerHTML = `<span>🚨</span> <span>ارزیابی اولیه ترومای جراحی (ATLS Primary Survey ABCDE)</span>`;
  card.appendChild(title);

  // Survey Form
  const psGrid = document.createElement('div');
  psGrid.className = 'form-grid-2';

  // Airway (A)
  const aGroup = document.createElement('div');
  aGroup.className = 'form-group';
  aGroup.innerHTML = `<label class="form-label">A - راه هوایی و ستون فقرات گردنی (Airway & C-Spine)</label>`;
  const aSelect = document.createElement('select');
  aSelect.className = 'input-select';
  aSelect.innerHTML = `<option value="">-- وضعیت راه هوایی --</option>`;
  ATLS_EXAM_SCHEMA.primarySurvey.airway.forEach((item) => {
    const op = document.createElement('option');
    op.value = item.label;
    op.textContent = item.label;
    if (atls.primarySurvey?.airway === item.label) op.selected = true;
    aSelect.appendChild(op);
  });
  aSelect.addEventListener('change', (e) => {
    atls.primarySurvey.airway = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  aGroup.appendChild(aSelect);
  psGrid.appendChild(aGroup);

  // Breathing (B)
  const bGroup = document.createElement('div');
  bGroup.className = 'form-group';
  bGroup.innerHTML = `<label class="form-label">B - تنفس و تهویه ریوی (Breathing & Ventilation)</label>`;
  const bSelect = document.createElement('select');
  bSelect.className = 'input-select';
  bSelect.innerHTML = `<option value="">-- وضعیت تنفس --</option>`;
  ATLS_EXAM_SCHEMA.primarySurvey.breathing.forEach((item) => {
    const op = document.createElement('option');
    op.value = item.label;
    op.textContent = item.label;
    if (atls.primarySurvey?.breathing === item.label) op.selected = true;
    bSelect.appendChild(op);
  });
  bSelect.addEventListener('change', (e) => {
    atls.primarySurvey.breathing = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  bGroup.appendChild(bSelect);
  psGrid.appendChild(bGroup);

  // Circulation (C)
  const cGroup = document.createElement('div');
  cGroup.className = 'form-group';
  cGroup.innerHTML = `<label class="form-label">C - گردش خون و کنترل خونریزی (Circulation & Hemorrhage)</label>`;
  const cSelect = document.createElement('select');
  cSelect.className = 'input-select';
  cSelect.innerHTML = `<option value="">-- وضعیت همودینامیک و خونریزی --</option>`;
  ATLS_EXAM_SCHEMA.primarySurvey.circulation.forEach((item) => {
    const op = document.createElement('option');
    op.value = item.label;
    op.textContent = item.label;
    if (atls.primarySurvey?.circulation === item.label) op.selected = true;
    cSelect.appendChild(op);
  });
  cSelect.addEventListener('change', (e) => {
    atls.primarySurvey.circulation = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  cGroup.appendChild(cSelect);
  psGrid.appendChild(cGroup);

  // Disability (D)
  const dGroup = document.createElement('div');
  dGroup.className = 'form-group';
  dGroup.innerHTML = `<label class="form-label">D - وضعیت هوشیاری و مردمک‌ها (Disability & GCS)</label>`;
  const dSelect = document.createElement('select');
  dSelect.className = 'input-select';
  dSelect.innerHTML = `<option value="">-- وضعیت مردمک‌ها و علائم فوکال --</option>`;
  ATLS_EXAM_SCHEMA.primarySurvey.disability.forEach((item) => {
    const op = document.createElement('option');
    op.value = item.label;
    op.textContent = item.label;
    if (atls.primarySurvey?.disability === item.label) op.selected = true;
    dSelect.appendChild(op);
  });
  dSelect.addEventListener('change', (e) => {
    atls.primarySurvey.disability = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  dGroup.appendChild(dSelect);
  psGrid.appendChild(dGroup);

  card.appendChild(psGrid);

  // Secondary Survey: Wound Registry Table
  const woundHeader = document.createElement('div');
  woundHeader.className = 'subsystem-header';
  woundHeader.style.marginTop = '1rem';
  woundHeader.innerHTML = `
    <span class="subsystem-title" style="font-size: 0.95rem;">🔪 ثبت زخم‌ها و جراحات تروما (Wound & Injury Registry)</span>
  `;
  const addWoundBtn = document.createElement('button');
  addWoundBtn.type = 'button';
  addWoundBtn.className = 'btn btn-secondary btn-sm';
  addWoundBtn.innerHTML = `<span>➕</span><span>افزودن زخم / جراحت جدید</span>`;
  addWoundBtn.addEventListener('click', () => {
    if (!atls.wounds) atls.wounds = [];
    atls.wounds.push({
      id: Date.now(),
      type: 'ورودی چاقو / جسم تیز (Stab Wound)',
      location: '',
      dimensions: '',
      bleedingStatus: 'بدون خونریزی فعال (No Active Bleeding / Clotted)',
      distalNv: 'نبض دیستال لمس، حس و حرکت کاملاً سالم (Intact Distal Neurovascular)'
    });
    renderAtlsExamModule();
    saveCurrentCase();
    updateLivePreview();
  });
  woundHeader.appendChild(addWoundBtn);
  card.appendChild(woundHeader);

  if (atls.wounds && atls.wounds.length > 0) {
    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'atls-wounds-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>نوع آسیب / زخم</th>
          <th>محل دقیق آناتومیک</th>
          <th>ابعاد (cm)</th>
          <th>وضعیت خونریزی</th>
          <th>وضعیت عصب و نبض دیستال</th>
          <th style="width: 40px;">عملیات</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    atls.wounds.forEach((w, wIdx) => {
      const tr = document.createElement('tr');

      // Type
      const tdType = document.createElement('td');
      const selType = document.createElement('select');
      selType.className = 'input-select';
      selType.style.padding = '0.3rem';
      ATLS_EXAM_SCHEMA.woundTypes.forEach((wt) => {
        const op = document.createElement('option');
        op.value = wt;
        op.textContent = wt;
        if (w.type === wt) op.selected = true;
        selType.appendChild(op);
      });
      selType.addEventListener('change', (e) => {
        w.type = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      tdType.appendChild(selType);
      tr.appendChild(tdType);

      // Location
      const tdLoc = document.createElement('td');
      const inLoc = document.createElement('input');
      inLoc.type = 'text';
      inLoc.className = 'input-text';
      inLoc.style.padding = '0.3rem';
      inLoc.value = w.location || '';
      inLoc.placeholder = 'مثلاً LUQ یا ساعد چپ';
      inLoc.addEventListener('input', (e) => {
        w.location = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      tdLoc.appendChild(inLoc);
      tr.appendChild(tdLoc);

      // Dimensions
      const tdDim = document.createElement('td');
      const inDim = document.createElement('input');
      inDim.type = 'text';
      inDim.className = 'input-text';
      inDim.style.padding = '0.3rem';
      inDim.value = w.dimensions || '';
      inDim.placeholder = 'مثلاً 4x1 cm';
      inDim.addEventListener('input', (e) => {
        w.dimensions = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      tdDim.appendChild(inDim);
      tr.appendChild(tdDim);

      // Bleeding
      const tdBleed = document.createElement('td');
      const selBleed = document.createElement('select');
      selBleed.className = 'input-select';
      selBleed.style.padding = '0.3rem';
      ATLS_EXAM_SCHEMA.bleedingStatuses.forEach((bs) => {
        const op = document.createElement('option');
        op.value = bs;
        op.textContent = bs;
        if (w.bleedingStatus === bs) op.selected = true;
        selBleed.appendChild(op);
      });
      selBleed.addEventListener('change', (e) => {
        w.bleedingStatus = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      tdBleed.appendChild(selBleed);
      tr.appendChild(tdBleed);

      // Distal NV
      const tdNv = document.createElement('td');
      const selNv = document.createElement('select');
      selNv.className = 'input-select';
      selNv.style.padding = '0.3rem';
      ATLS_EXAM_SCHEMA.distalNeurovascularStatuses.forEach((nv) => {
        const op = document.createElement('option');
        op.value = nv;
        op.textContent = nv;
        if (w.distalNv === nv) op.selected = true;
        selNv.appendChild(op);
      });
      selNv.addEventListener('change', (e) => {
        w.distalNv = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      tdNv.appendChild(selNv);
      tr.appendChild(tdNv);

      // Delete
      const tdDel = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-wound-row';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'حذف این ردیف زخم';
      delBtn.addEventListener('click', () => {
        atls.wounds.splice(wIdx, 1);
        renderAtlsExamModule();
        saveCurrentCase();
        updateLivePreview();
      });
      tdDel.appendChild(delBtn);
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
    });

    tableWrap.appendChild(table);
    card.appendChild(tableWrap);
  }

  // Burn Assessment Section
  const burnHeader = document.createElement('div');
  burnHeader.style.marginTop = '1rem';
  burnHeader.innerHTML = `
    <label class="form-label" style="font-weight: 700; color: var(--text-primary);">
      🔥 ارزیابی سوختگی، درصد TBSA و آسیب استنشاقی (Burns & Inhalation Injury):
    </label>
  `;
  card.appendChild(burnHeader);

  if (!atls.burn) atls.burn = { tbsa: '', degree: '', inhalationSigns: [] };

  const burnGrid = document.createElement('div');
  burnGrid.className = 'form-grid-2';

  const tbsaGroup = document.createElement('div');
  tbsaGroup.className = 'form-group';
  tbsaGroup.innerHTML = `<label class="form-label">درصد سوختگی بر اساس قانون ۹ها (% TBSA)</label>`;
  const tbsaInput = document.createElement('input');
  tbsaInput.type = 'text';
  tbsaInput.className = 'input-text dir-ltr';
  tbsaInput.value = atls.burn.tbsa || '';
  tbsaInput.placeholder = 'مثلاً 18%';
  tbsaInput.addEventListener('input', (e) => {
    atls.burn.tbsa = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  tbsaGroup.appendChild(tbsaInput);
  burnGrid.appendChild(tbsaGroup);

  const degGroup = document.createElement('div');
  degGroup.className = 'form-group';
  degGroup.innerHTML = `<label class="form-label">حداکثر عمق و درجه سوختگی</label>`;
  const degSelect = document.createElement('select');
  degSelect.className = 'input-select';
  degSelect.innerHTML = `<option value="">-- درجه سوختگی --</option>`;
  ATLS_EXAM_SCHEMA.burnDegrees.forEach((deg) => {
    const op = document.createElement('option');
    op.value = deg;
    op.textContent = deg;
    if (atls.burn.degree === deg) op.selected = true;
    degSelect.appendChild(op);
  });
  degSelect.addEventListener('change', (e) => {
    atls.burn.degree = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  degGroup.appendChild(degSelect);
  burnGrid.appendChild(degGroup);

  card.appendChild(burnGrid);

  // Inhalation signs
  const inhGroup = document.createElement('div');
  inhGroup.className = 'form-group';
  inhGroup.style.marginTop = '0.5rem';
  inhGroup.innerHTML = `<label class="form-label">علائم هشدار آسیب استنشاقی (Inhalation Injury Signs)</label>`;
  const inhChips = document.createElement('div');
  inhChips.className = 'tag-selector-grid';

  if (!atls.burn.inhalationSigns) atls.burn.inhalationSigns = [];

  ATLS_EXAM_SCHEMA.burnInhalationSigns.forEach((sign) => {
    const isAct = atls.burn.inhalationSigns.includes(sign.label);
    const chip = document.createElement('span');
    chip.className = `factor-chip ${isAct ? 'active' : ''}`;
    chip.textContent = sign.label;
    chip.addEventListener('click', () => {
      if (atls.burn.inhalationSigns.includes(sign.label)) {
        atls.burn.inhalationSigns = atls.burn.inhalationSigns.filter((s) => s !== sign.label);
        chip.classList.remove('active');
      } else {
        atls.burn.inhalationSigns.push(sign.label);
        chip.classList.add('active');
      }
      saveCurrentCase();
      updateLivePreview();
    });
    inhChips.appendChild(chip);
  });
  inhGroup.appendChild(inhChips);
  card.appendChild(inhGroup);

  container.appendChild(card);
}

function initAtlsExamHandlers() {
  document.getElementById('btnToggleAtlsExam')?.addEventListener('click', () => {
    if (!clinicalState.pe.atlsExam) {
      clinicalState.pe.atlsExam = {
        active: true,
        primarySurvey: {},
        wounds: [],
        burn: { inhalationSigns: [] }
      };
    } else {
      clinicalState.pe.atlsExam.active = !clinicalState.pe.atlsExam.active;
    }
    renderAtlsExamModule();
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   v0.7-Master-Formulary: Direct Schema Omnisearch & Instant Capsule Tray
   ========================================================================== */

/**
 * Direct Schema Search Engine: searches directly in master clinical banks
 * without relying on DOM elements or open accordions.
 */
export function filterSchemaItems(query, itemsArray) {
  return smartClinicalSearch(query, itemsArray);
}

function renderTriStateSearchTray(query, tray, input, itemsPool, sectionType) {
  const matches = filterSchemaItems(query, itemsPool);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>نتایج جستجو: <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>تپ روی + یا −</span>
  `;
  tray.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'search-tray-grid';

  matches.forEach((item) => {
    let cur = null;
    if (sectionType === 'hpi') {
      cur = clinicalState.hpi.symptoms?.[item.id];
    } else if (sectionType === 'pmh') {
      cur = (item.catId && clinicalState.pmh.categories?.[item.catId]?.items?.[item.id]) || clinicalState.pmh.items?.[item.id];
    } else if (sectionType === 'ros') {
      cur = clinicalState.ros.findings?.[item.id];
    } else if (sectionType === 'pe') {
      cur = clinicalState.pe.findings?.[item.id];
    }

    const st = cur ? (typeof cur === 'object' ? (cur.state !== undefined ? cur.state : 0) : cur) : 0;
    const det = cur && typeof cur === 'object' ? (cur.detail || cur.note || '') : '';

    const itemWrap = document.createElement('div');
    itemWrap.className = `search-tray-item ${st === 1 ? 'is-positive' : st === -1 ? 'is-negative' : ''}`;

    const chipRow = document.createElement('div');
    chipRow.className = 'search-tray-chip-row';

    const btnPos = document.createElement('button');
    btnPos.type = 'button';
    btnPos.className = `search-btn-pos ${st === 1 ? 'active' : ''}`;
    btnPos.textContent = '+';
    btnPos.title = 'مثبت / دارد';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'search-tray-label';
    labelSpan.textContent = item.label;

    if (item.category) {
      const catBadge = document.createElement('span');
      catBadge.className = 'search-tray-category-badge';
      catBadge.textContent = item.category;
      chipRow.appendChild(catBadge);
    }

    const btnNeg = document.createElement('button');
    btnNeg.type = 'button';
    btnNeg.className = `search-btn-neg ${st === -1 ? 'active' : ''}`;
    btnNeg.textContent = '−';
    btnNeg.title = 'منفی / نفی شد';

    chipRow.appendChild(btnPos);
    chipRow.appendChild(labelSpan);
    chipRow.appendChild(btnNeg);
    itemWrap.appendChild(chipRow);

    // Inline detail input if positive
    const detailInp = document.createElement('input');
    detailInp.type = 'text';
    detailInp.className = 'search-tray-detail-input';
    detailInp.placeholder = 'توضیحات تکمیلی (مدت، شدت، سیر...)...';
    detailInp.value = det;
    detailInp.style.display = st === 1 ? 'block' : 'none';

    detailInp.addEventListener('input', (e) => {
      const val = e.target.value;
      if (sectionType === 'hpi') {
        if (!clinicalState.hpi.symptoms[item.id]) clinicalState.hpi.symptoms[item.id] = { state: 1, label: item.label, detail: '' };
        clinicalState.hpi.symptoms[item.id].detail = val;
      } else if (sectionType === 'pmh') {
        if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
        if (!clinicalState.pmh.items[item.id]) clinicalState.pmh.items[item.id] = { state: 1, label: item.label, detail: '' };
        clinicalState.pmh.items[item.id].detail = val;
      } else if (sectionType === 'ros') {
        if (!clinicalState.ros.findings[item.id]) clinicalState.ros.findings[item.id] = { state: 1, label: item.label, detail: '' };
        clinicalState.ros.findings[item.id].detail = val;
      } else if (sectionType === 'pe') {
        if (!clinicalState.pe.findings[item.id]) clinicalState.pe.findings[item.id] = { state: 1, label: item.label, detail: '' };
        clinicalState.pe.findings[item.id].detail = val;
      }
      saveCurrentCase();
      updateLivePreview();
    });

    itemWrap.appendChild(detailInp);

    const applyState = (newState) => {
      if (sectionType === 'hpi') {
        if (newState === 0) delete clinicalState.hpi.symptoms[item.id];
        else clinicalState.hpi.symptoms[item.id] = { state: newState, label: item.label, detail: detailInp.value };
      } else if (sectionType === 'pmh') {
        if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
        if (item.catId) {
          if (!clinicalState.pmh.categories[item.catId]) clinicalState.pmh.categories[item.catId] = { status: 'neutral', items: {} };
          if (newState === 0) delete clinicalState.pmh.categories[item.catId].items[item.id];
          else clinicalState.pmh.categories[item.catId].items[item.id] = { state: newState, label: item.label, detail: detailInp.value };
          if (newState === 1) clinicalState.pmh.categories[item.catId].status = 'has_positive';
        }
        if (newState === 0) delete clinicalState.pmh.items[item.id];
        else clinicalState.pmh.items[item.id] = { state: newState, label: item.label, detail: detailInp.value };
        renderPmhCategories();
      } else if (sectionType === 'ros') {
        if (newState === 0) delete clinicalState.ros.findings[item.id];
        else clinicalState.ros.findings[item.id] = { state: newState, label: item.label, detail: detailInp.value };
      } else if (sectionType === 'pe') {
        if (newState === 0) delete clinicalState.pe.findings[item.id];
        else clinicalState.pe.findings[item.id] = { state: newState, label: item.label, detail: detailInp.value };
      }

      saveCurrentCase();
      updateLivePreview();
      btnPos.classList.toggle('active', newState === 1);
      btnNeg.classList.toggle('active', newState === -1);
      itemWrap.classList.toggle('is-positive', newState === 1);
      itemWrap.classList.toggle('is-negative', newState === -1);
      detailInp.style.display = newState === 1 ? 'block' : 'none';
      if (newState === 1) detailInp.focus();
    };

    btnPos.addEventListener('click', (e) => {
      e.stopPropagation();
      const curSt = btnPos.classList.contains('active') ? 1 : (btnNeg.classList.contains('active') ? -1 : 0);
      applyState(curSt === 1 ? 0 : 1);
    });

    btnNeg.addEventListener('click', (e) => {
      e.stopPropagation();
      const curSt = btnPos.classList.contains('active') ? 1 : (btnNeg.classList.contains('active') ? -1 : 0);
      applyState(curSt === -1 ? 0 : -1);
    });

    grid.appendChild(itemWrap);
  });

  tray.appendChild(grid);

  // Fallback direct add button
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `➕ افزودن مستقیم «<strong>${query}</strong>» به عنوان آیتم جدید به این بخش`;
  addBtn.addEventListener('click', () => {
    const customId = `custom_${Date.now()}`;
    if (sectionType === 'hpi') {
      clinicalState.hpi.symptoms[customId] = { state: 1, label: query, detail: '' };
    } else if (sectionType === 'pmh') {
      if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
      clinicalState.pmh.items[customId] = { state: 1, label: query, detail: '' };
      renderPmhCategories();
    } else if (sectionType === 'ros') {
      clinicalState.ros.findings[customId] = { state: 1, label: query, detail: '' };
    } else if (sectionType === 'pe') {
      clinicalState.pe.findings[customId] = { state: 1, label: query, detail: '' };
    }
    saveCurrentCase();
    updateLivePreview();
    addBtn.innerHTML = `✓ «${query}» با موفقیت اضافه شد`;
    addBtn.style.borderColor = '#10b981';
    addBtn.style.color = '#10b981';
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function renderDrugSearchTray(query, tray, input) {
  const matches = filterSchemaItems(query, ALL_MASTER_DRUGS);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>داروهای یافت‌شده: <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>کلیک روی + افزودن دارو</span>
  `;
  tray.appendChild(header);

  const list = document.createElement('div');
  list.className = 'search-tray-drugs-list';

  matches.forEach((drug) => {
    const catId = drug.catId || 'dh_other';
    if (!clinicalState.dh.categories[catId]) {
      clinicalState.dh.categories[catId] = { drugs: {} };
    }
    const catData = clinicalState.dh.categories[catId];
    if (!catData.drugs[drug.id]) {
      catData.drugs[drug.id] = { active: false, dose: drug.defaultDose || '', sig: 'Daily (روزانه)', note: '' };
    }
    const drugEntry = catData.drugs[drug.id];

    const card = document.createElement('div');
    card.className = `dh-tray-card ${drugEntry.active ? 'is-active' : ''}`;

    const topRow = document.createElement('div');
    topRow.className = 'dh-tray-top';

    const info = document.createElement('div');
    info.className = 'dh-tray-main-info';
    info.innerHTML = `
      <div class="dh-tray-drug-name">
        ${drug.label}
        ${drug.highAlert ? '<span class="dh-tray-high-alert">⚠️ High-Alert</span>' : ''}
      </div>
      ${drug.brands ? `<div class="dh-tray-brands">نام‌های تجاری: ${drug.brands}</div>` : ''}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${drugEntry.active ? 'active' : ''}`;
    actionBtn.innerHTML = drugEntry.active ? '✓ فعال (حذف)' : '+ افزودن دارو';

    topRow.appendChild(actionBtn);
    card.appendChild(topRow);

    const box3 = document.createElement('div');
    box3.className = 'dh-tray-3box';
    box3.style.display = drugEntry.active ? 'flex' : 'none';

    const doseInp = document.createElement('input');
    doseInp.type = 'text';
    doseInp.className = 'dh-tray-dose-inp';
    doseInp.placeholder = 'دوز...';
    doseInp.value = drugEntry.dose || drug.defaultDose || '';
    doseInp.addEventListener('input', (e) => {
      drugEntry.dose = e.target.value;
      saveCurrentCase();
      updateLivePreview();
      renderDhCategories();
    });

    const sigSel = document.createElement('select');
    sigSel.className = 'dh-tray-sig-sel';
    DH_SIG_OPTIONS.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (drugEntry.sig === opt) option.selected = true;
      sigSel.appendChild(option);
    });
    sigSel.addEventListener('change', (e) => {
      drugEntry.sig = e.target.value;
      saveCurrentCase();
      updateLivePreview();
      renderDhCategories();
    });

    const noteInp = document.createElement('input');
    noteInp.type = 'text';
    noteInp.className = 'dh-tray-note-inp';
    noteInp.placeholder = 'دستور یا توضیح خاص...';
    noteInp.value = drugEntry.note || '';
    noteInp.addEventListener('input', (e) => {
      drugEntry.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
      renderDhCategories();
    });

    box3.appendChild(doseInp);
    box3.appendChild(sigSel);
    box3.appendChild(noteInp);
    card.appendChild(box3);

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drugEntry.active = !drugEntry.active;
      actionBtn.classList.toggle('active', drugEntry.active);
      actionBtn.innerHTML = drugEntry.active ? '✓ فعال (حذف)' : '+ افزودن دارو';
      card.classList.toggle('is-active', drugEntry.active);
      box3.style.display = drugEntry.active ? 'flex' : 'none';
      if (drugEntry.active && !drugEntry.dose) {
        drugEntry.dose = drug.defaultDose || '';
        doseInp.value = drugEntry.dose;
      }
      saveCurrentCase();
      updateLivePreview();
      renderDhCategories();
    });

    list.appendChild(card);
  });

  tray.appendChild(list);

  // Fallback button for adding custom drug
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `➕ افزودن مستقیم «<strong>${query}</strong>» به عنوان داروی جدید`;
  addBtn.addEventListener('click', () => {
    if (!clinicalState.dh.customDrugs) clinicalState.dh.customDrugs = [];
    clinicalState.dh.customDrugs.push({
      id: Date.now(),
      name: query,
      dose: '',
      sig: 'Daily (روزانه)',
      note: ''
    });
    renderCustomDrugs();
    saveCurrentCase();
    updateLivePreview();
    addBtn.innerHTML = `✓ داروی «${query}» با موفقیت اضافه شد`;
    addBtn.style.borderColor = '#10b981';
    addBtn.style.color = '#10b981';
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

export function renderFhSearchTray(query, tray, input) {
  const pool = [...FH_CANCER_HEREDITARY_DATABASE, ...HIDDEN_EXTENDED_PMH_DATABASE];
  const matches = filterSchemaItems(query, pool);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>نتایج بیماری‌های خانوادگی: <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>کلیک جهت افزودن</span>
  `;
  tray.appendChild(header);

  const list = document.createElement('div');
  list.className = 'search-tray-drugs-list';

  matches.forEach((item) => {
    const isAdded = (clinicalState.fh.diseases || []).some((d) => d.id === item.id || d.name === item.label);
    const card = document.createElement('div');
    card.className = `dh-tray-card ${isAdded ? 'is-active' : ''}`;

    const topRow = document.createElement('div');
    topRow.className = 'dh-tray-top';

    const info = document.createElement('div');
    info.className = 'dh-tray-main-info';
    info.innerHTML = `
      <div class="dh-tray-drug-name">🧬 ${item.label}</div>
      ${item.category ? `<div class="dh-tray-brands">گروه: ${item.category}</div>` : ''}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
    actionBtn.innerHTML = isAdded ? '✓ افزوده شد' : '+ افزودن به سوابق خانوادگی';

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addFhDisease(item);
      actionBtn.classList.add('active');
      actionBtn.innerHTML = '✓ افزوده شد';
      card.classList.add('is-active');
    });

    topRow.appendChild(actionBtn);
    card.appendChild(topRow);
    list.appendChild(card);
  });

  tray.appendChild(list);

  // Fallback box
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `➕ افزودن مستقیم «<strong>${query}</strong>» به عنوان بیماری خانوادگی جدید`;
  addBtn.addEventListener('click', () => {
    addFhDisease({ id: 'fh_' + Date.now(), label: query, name: query, relatives: ['پدر'], status: 'living' });
    addBtn.innerHTML = `✓ بیماری «${query}» با موفقیت اضافه شد`;
    addBtn.style.borderColor = '#10b981';
    addBtn.style.color = '#10b981';
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function renderLabSearchTray(query, tray, input) {
  const matches = filterSchemaItems(query, EXTENDED_LAB_DATABASE);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>نتایج آزمایش‌های تکمیلی و تخصصی: <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>روی + کلیک کنید تا به جدول آزمایش‌ها اضافه شود</span>
  `;
  tray.appendChild(header);

  const list = document.createElement('div');
  list.className = 'search-tray-drugs-list';

  matches.forEach((test) => {
    const isAdded = !!(clinicalState.paraclinics.additionalLabs && clinicalState.paraclinics.additionalLabs[test.id]);
    const card = document.createElement('div');
    card.className = `dh-tray-card ${isAdded ? 'is-active' : ''}`;

    const topRow = document.createElement('div');
    topRow.className = 'dh-tray-top';

    const info = document.createElement('div');
    info.className = 'dh-tray-main-info';
    const rangeText = test.normalRange ? `[نرمال: ${test.normalRange}]` : ((test.min !== undefined && test.max !== undefined) ? `[نرمال: ${test.min}-${test.max}]` : '');
    info.innerHTML = `
      <div class="dh-tray-drug-name">🧪 ${test.label} ${test.unit ? `<span class="additional-lab-unit">${test.unit}</span>` : ''}</div>
      ${test.category ? `<div class="dh-tray-brands">پنل: ${test.category} ${rangeText}</div>` : (rangeText ? `<div class="dh-tray-brands">${rangeText}</div>` : '')}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
    actionBtn.innerHTML = isAdded ? '✓ در جدول موجود است' : '+ افزودن به جدول آزمایش‌ها';

    const handleAdd = (e) => {
      e?.stopPropagation();
      addAdditionalLab(test);
      actionBtn.classList.add('active');
      actionBtn.innerHTML = '✓ اضافه شد';
      card.classList.add('is-active');
      // Highlight in table
      const el = document.getElementById('additionalLabsSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    actionBtn.addEventListener('click', handleAdd);
    card.addEventListener('click', handleAdd);

    topRow.appendChild(actionBtn);
    card.appendChild(topRow);
    list.appendChild(card);
  });

  tray.appendChild(list);

  // Fallback box for arbitrary lab tests
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `➕ افزودن مستقیم «<strong>${query}</strong>» به عنوان آزمایش تشخیصی جدید`;
  addBtn.addEventListener('click', () => {
    addAdditionalLab({ id: 'ext_lab_' + Date.now(), label: query, name: query, unit: '', normalRange: '' });
    addBtn.innerHTML = `✓ آزمایش «${query}» به جدول اضافه شد`;
    addBtn.style.borderColor = '#10b981';
    addBtn.style.color = '#10b981';
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function initSchemaOmnisearch() {
  const searchInputs = document.querySelectorAll('.tag-quick-search-input');

  const rosItems = ROS_GROUPS_BILINGUAL.flatMap((grp) =>
    (grp.items || []).map((it) => ({
      ...it,
      category: grp.group || 'بررسی سیستم‌ها (ROS)',
      keywords: it.keywords || ''
    }))
  );

  const peItems = [
    ...PE_MANDATORY_PILLARS.flatMap((p) =>
      (p.items || []).map((it) => ({
        ...it,
        category: p.title || 'معاینه عمومی و اجباری',
        keywords: it.keywords || ''
      }))
    ),
    ...PE_UNLOCKABLE_MODULES.flatMap((m) =>
      (m.items || []).map((it) => ({
        ...it,
        category: m.title || 'معاینه تخصصی',
        keywords: it.keywords || ''
      }))
    ),
    ...PE_COMPREHENSIVE_SYSTEMS.flatMap((s) =>
      (s.items || []).map((it) => ({
        ...it,
        category: s.title || 'سیستم‌های معاینه فیزیکی',
        keywords: it.keywords || ''
      }))
    )
  ];

  searchInputs.forEach((input) => {
    const parentBox = input.closest('.tag-quick-search-box');
    let tray = parentBox?.querySelector('.search-results-tray');
    if (!tray) {
      tray = document.createElement('div');
      tray.className = 'search-results-tray';
      if (parentBox) parentBox.appendChild(tray);
      else input.insertAdjacentElement('afterend', tray);
    }

    const targetSection = input.dataset.searchTarget || '';

    const handleSearch = () => {
      const query = (input.value || '').trim();
      if (!query) {
        tray.classList.remove('is-active');
        tray.innerHTML = '';
        return;
      }

      tray.classList.add('is-active');
      tray.innerHTML = '';

      if (input.id === 'labQuickSearchInput' || targetSection === '#tab-lab' || targetSection === '#tab-paraclinic' || targetSection === '#tab-paraclinics') {
        renderLabSearchTray(query, tray, input);
      } else if (targetSection === '#tab-dh') {
        renderDrugSearchTray(query, tray, input);
      } else if (targetSection === '#tab-fh' || input.id === 'fhQuickSearchInput') {
        renderFhSearchTray(query, tray, input);
      } else if (targetSection === '#tab-pmh') {
        renderTriStateSearchTray(query, tray, input, ALL_MASTER_PMH_ITEMS, 'pmh');
      } else if (targetSection === '#tab-ros') {
        renderTriStateSearchTray(query, tray, input, [...MASTER_SYMPTOMS_BANK, ...rosItems], 'ros');
      } else if (targetSection === '#tab-pe') {
        renderTriStateSearchTray(query, tray, input, peItems, 'pe');
      } else {
        renderTriStateSearchTray(query, tray, input, MASTER_SYMPTOMS_BANK, 'hpi');
      }
    };

    input.addEventListener('input', handleSearch);
    input.addEventListener('focus', () => {
      if (input.value.trim().length > 0) {
        handleSearch();
      }
    });
  });

  // Close tray when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tag-quick-search-box')) {
      document.querySelectorAll('.search-results-tray').forEach((t) => {
        t.classList.remove('is-active');
      });
    }
  });
}

// Backward compatibility alias
export const initTagQuickSearch = initSchemaOmnisearch;


function initPeMasterNegativeHandler() {
  document.getElementById('btnPeMasterNegative')?.addEventListener('click', () => {
    PE_MANDATORY_PILLARS.forEach((pillar) => {
      pillar.items.forEach((item) => {
        const it = clinicalState.pe.findings[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (st === 0) {
          clinicalState.pe.findings[item.id] = { state: -1, detail: '', label: item.label };
        }
      });
    });
    renderPeMandatoryPillars();
    saveCurrentCase();
    updateLivePreview();
  });
}

/* ==========================================================================
   Tab 7: Paraclinics - 6 Lab Panels & Compact Modality Launcher
   ========================================================================== */
const CORE_ROUTINE_LAB_GROUPS = [
  {
    title: '۱. هماتولوژی اصلی (Core CBC)',
    badge: 'الزامی روتین',
    tests: [
      { id: 'wbc', label: 'WBC', unit: '×10³/µL', min: 4.0, max: 10.0 },
      { id: 'rbc', label: 'RBC', unit: '×10⁶/µL', min: 4.2, max: 5.9 },
      { id: 'hb', label: 'Hb', unit: 'g/dL', min: 12.0, max: 16.0 },
      { id: 'plt', label: 'Plt', unit: '×10³/µL', min: 150, max: 450 }
    ]
  },
  {
    title: '۲. بیوشیمی و کلیه اصلی (Biochemistry & Renal)',
    badge: 'الزامی روتین',
    tests: [
      { id: 'bs', label: 'BS (قند خون)', unit: 'mg/dL', min: 70, max: 140 },
      { id: 'bun', label: 'BUN', unit: 'mg/dL', min: 7, max: 20 },
      { id: 'cr', label: 'Cr (کراتینین)', unit: 'mg/dL', min: 0.6, max: 1.2 },
      { id: 'na', label: 'Na (سدیم)', unit: 'mEq/L', min: 135, max: 145 },
      { id: 'k', label: 'K (پتاسیم)', unit: 'mEq/L', min: 3.5, max: 5.0 }
    ]
  },
  {
    title: '۳. کبد، صفرا و پانکراس اصلی (Hepato-Biliary & Pancreatic)',
    badge: 'جراحی عمومی',
    tests: [
      { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', min: 10, max: 40 },
      { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', min: 7, max: 56 },
      { id: 'alp', label: 'ALP (آلکالن فسفاتاز)', unit: 'U/L', min: 44, max: 147 },
      { id: 'bili_t', label: 'Bili Total', unit: 'mg/dL', min: 0.2, max: 1.2 },
      { id: 'bili_d', label: 'Bili Direct', unit: 'mg/dL', min: 0.0, max: 0.3 },
      { id: 'amylase', label: 'Amylase', unit: 'U/L', min: 28, max: 100 },
      { id: 'lipase', label: 'Lipase', unit: 'U/L', min: 10, max: 60 }
    ]
  },
  {
    title: '۴. انعقادی و التهابی اصلی (Coagulation & Inflammatory)',
    badge: 'پری‌اوپ و عفونی',
    tests: [
      { id: 'pt', label: 'PT', unit: 'sec', min: 11.0, max: 13.5 },
      { id: 'ptt', label: 'PTT', unit: 'sec', min: 25.0, max: 35.0 },
      { id: 'inr', label: 'INR', unit: '', min: 0.9, max: 1.15 },
      { id: 'esr', label: 'ESR', unit: 'mm/hr', min: 0, max: 20 },
      { id: 'crp', label: 'CRP', unit: 'mg/L', min: 0, max: 6 }
    ]
  }
];

export function renderParaclinicLabs() {
  const container = document.getElementById('paraclinicLabPanelsContainer');
  if (!container) return;
  container.innerHTML = '';

  CORE_ROUTINE_LAB_GROUPS.forEach((panel) => {
    const card = document.createElement('div');
    card.className = 'lab-panel-card';

    const header = document.createElement('div');
    header.className = 'lab-panel-header';
    header.innerHTML = `
      <div class="lab-panel-title">
        <span>🧪</span>
        <span>${panel.title}</span>
      </div>
      <span class="lab-panel-badge">${panel.badge}</span>
    `;
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'lab-tests-grid';

    panel.tests.forEach((t) => {
      const val = clinicalState.paraclinics.labs[t.id] || '';
      const mini = document.createElement('div');
      mini.className = 'lab-mini-card';
      mini.dataset.id = t.id;

      mini.innerHTML = `
        <div class="lab-mini-header">
          <span class="lab-mini-label">${t.label}</span>
          <span class="lab-mini-unit">${t.unit}</span>
        </div>
        <div class="lab-mini-input-row">
          <input type="text" class="lab-mini-input" placeholder="${t.min}-${t.max}" value="${val}">
        </div>
      `;

      const input = mini.querySelector('.lab-mini-input');

      function updateFlag(valStr) {
        mini.classList.remove('flag-high', 'flag-low');
        const num = parseFloat(valStr);
        if (!isNaN(num) && valStr.trim() !== '') {
          if (num > t.max) mini.classList.add('flag-high');
          else if (num < t.min) mini.classList.add('flag-low');
        }
      }
      updateFlag(val);

      input.addEventListener('input', (e) => {
        const newVal = e.target.value;
        clinicalState.paraclinics.labs[t.id] = newVal;
        updateFlag(newVal);
        saveCurrentCase();
        updateLivePreview();
      });

      grid.appendChild(mini);
    });

    card.appendChild(grid);
    container.appendChild(card);
  });

  document.getElementById('paraclinicLabNote')?.addEventListener('input', (e) => {
    clinicalState.paraclinics.labNote = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // Quick Panels Wiring (guarded against duplicate event listener registration)
  const btnVbg = document.getElementById('btnAddVbgPanel');
  if (btnVbg && !btnVbg.dataset.bound) {
    btnVbg.dataset.bound = 'true';
    btnVbg.addEventListener('click', () => {
      const vbgTests = [
        { id: 'lab_ph', name: 'pH (VBG / ABG)', label: 'pH (VBG / ABG)', unit: '', normalRange: '7.35 - 7.45' },
        { id: 'lab_pco2', name: 'PCO2 (VBG)', label: 'PCO2 (VBG)', unit: 'mmHg', normalRange: '35 - 45' },
        { id: 'lab_po2', name: 'PO2 (VBG)', label: 'PO2 (VBG)', unit: 'mmHg', normalRange: '30 - 50' },
        { id: 'lab_hco3', name: 'HCO3', label: 'HCO3', unit: 'mEq/L', normalRange: '22 - 26' },
        { id: 'lab_be', name: 'Base Excess (BE)', label: 'Base Excess (BE)', unit: 'mEq/L', normalRange: '-2 - +2' },
        { id: 'lab_o2_sat_vbg', name: 'O2 Sat (VBG)', label: 'O2 Sat (VBG)', unit: '%', normalRange: '70 - 80' }
      ];
      vbgTests.forEach((t) => addAdditionalLab(t));
      showToast('پنل گازهای خونی (VBG / ABG) به جدول اضافه شد.', 'info');
    });
  }

  const btnUa = document.getElementById('btnAddUaPanel');
  if (btnUa && !btnUa.dataset.bound) {
    btnUa.dataset.bound = 'true';
    btnUa.addEventListener('click', () => {
      const uaTests = [
        { id: 'lab_ua_wbc', name: 'U/A WBC', label: 'U/A WBC (گلبول سفید ادرار)', unit: '/HPF', normalRange: '0 - 4' },
        { id: 'lab_ua_rbc', name: 'U/A RBC', label: 'U/A RBC (گلبول قرمز ادرار)', unit: '/HPF', normalRange: '0 - 3' },
        { id: 'lab_ua_bacteria_nitrite', name: 'U/A Bacteria & Nitrite', label: 'U/A Bacteria & Nitrite', unit: '', normalRange: 'Negative' },
        { id: 'lab_uc', name: 'Urine Culture (U/C)', label: 'Urine Culture (کشت ادرار U/C)', unit: '', normalRange: 'No growth' }
      ];
      uaTests.forEach((t) => addAdditionalLab(t));
      showToast('پنل آنالیز و کشت ادرار (U/A & U/C) به جدول اضافه شد.', 'info');
    });
  }

  renderAdditionalLabs();
}

export function addAdditionalLab(testObj, initialVal = '') {
  if (!clinicalState.paraclinics.additionalLabs) clinicalState.paraclinics.additionalLabs = {};
  const testId = testObj.id || ('ext_lab_' + Date.now());
  clinicalState.paraclinics.additionalLabs[testId] = {
    name: testObj.label || testObj.name,
    value: initialVal || '',
    unit: testObj.unit || '',
    normalRange: (testObj.min !== undefined && testObj.max !== undefined) ? `${testObj.min}-${testObj.max}` : (testObj.normalRange || '')
  };
  renderAdditionalLabs();
  saveCurrentCase();
  updateLivePreview();
}

export function renderAdditionalLabs() {
  const sec = document.getElementById('additionalLabsSection');
  const container = document.getElementById('additionalLabsContainer');
  if (!container) return;
  container.innerHTML = '';

  const entries = Object.entries(clinicalState.paraclinics.additionalLabs || {});
  if (sec) {
    sec.style.display = entries.length > 0 ? 'block' : 'none';
  }
  if (entries.length === 0) return;

  entries.forEach(([labId, labData]) => {
    const card = document.createElement('div');
    card.className = 'additional-lab-card';

    const header = document.createElement('div');
    header.className = 'additional-lab-header';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'additional-lab-label';
    labelSpan.textContent = labData.name || labId;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-remove-additional-lab';
    delBtn.title = 'حذف این آزمایش';
    delBtn.innerHTML = '✕';
    delBtn.addEventListener('click', () => {
      delete clinicalState.paraclinics.additionalLabs[labId];
      renderAdditionalLabs();
      saveCurrentCase();
      updateLivePreview();
    });

    header.appendChild(labelSpan);
    header.appendChild(delBtn);
    card.appendChild(header);

    const inputRow = document.createElement('div');
    inputRow.className = 'additional-lab-input-row';

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'additional-lab-input';
    inp.placeholder = labData.normalRange ? `نرمال: ${labData.normalRange}` : 'مقدار...';
    const curVal = typeof labData === 'object' ? (labData.value || '') : labData;
    inp.value = curVal;

    function checkRange(valStr) {
      inp.classList.remove('is-high', 'is-low');
      if (!valStr || !labData.normalRange) return;
      const num = parseFloat(valStr);
      if (isNaN(num)) return;
      const rng = String(labData.normalRange);
      if (rng.includes('-')) {
        const parts = rng.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        if (parts.length === 2) {
          if (num > parts[1]) inp.classList.add('is-high');
          else if (num < parts[0]) inp.classList.add('is-low');
        }
      } else if (rng.startsWith('<')) {
        const limit = parseFloat(rng.replace('<', '').trim());
        if (!isNaN(limit) && num > limit) inp.classList.add('is-high');
      } else if (rng.startsWith('>')) {
        const limit = parseFloat(rng.replace('>', '').trim());
        if (!isNaN(limit) && num < limit) inp.classList.add('is-low');
      }
    }
    checkRange(curVal);

    inp.addEventListener('input', (e) => {
      const v = e.target.value;
      if (typeof clinicalState.paraclinics.additionalLabs[labId] === 'object') {
        clinicalState.paraclinics.additionalLabs[labId].value = v;
      } else {
        clinicalState.paraclinics.additionalLabs[labId] = {
          name: labData.name || labId,
          value: v,
          unit: labData.unit || '',
          normalRange: labData.normalRange || ''
        };
      }
      checkRange(v);
      saveCurrentCase();
      updateLivePreview();
    });

    inputRow.appendChild(inp);
    if (labData.unit) {
      const unitSpan = document.createElement('span');
      unitSpan.className = 'additional-lab-unit';
      unitSpan.style.cssText = 'font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; margin-right: 4px;';
      unitSpan.textContent = labData.unit;
      inputRow.appendChild(unitSpan);
    }
    card.appendChild(inputRow);

    if (labData.normalRange) {
      const rangeDiv = document.createElement('div');
      rangeDiv.className = 'additional-lab-range';
      rangeDiv.textContent = `نرمال: ${labData.normalRange}`;
      card.appendChild(rangeDiv);
    }

    container.appendChild(card);
  });
}

function initModalityLauncherBar() {
  const bar = document.getElementById('modalityLauncherBar');
  if (!bar) return;
  bar.innerHTML = '';

  SURGICAL_SCHEMA.paraclinicModalities.forEach((mod) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-modality-launch';
    btn.innerHTML = `<span>➕</span><span>${mod.label}</span>`;
    btn.addEventListener('click', () => {
      if (!clinicalState.paraclinics.imagingReports) clinicalState.paraclinics.imagingReports = [];
      const count = clinicalState.paraclinics.imagingReports.filter((r) => r.modalityId === mod.id).length + 1;
      clinicalState.paraclinics.imagingReports.push({
        id: Date.now(),
        modalityId: mod.id,
        modalityLabel: `${mod.label} (نوبت ${count})`,
        date: new Date().toLocaleDateString('fa-IR'),
        tags: [],
        summary: ''
      });
      renderImagingReportsList();
      saveCurrentCase();
      updateLivePreview();
    });
    bar.appendChild(btn);
  });
}

function renderImagingReportsList() {
  const container = document.getElementById('imagingReportsListContainer');
  if (!container) return;
  container.innerHTML = '';

  const reports = clinicalState.paraclinics.imagingReports || [];
  reports.forEach((rep, index) => {
    const modDef = SURGICAL_SCHEMA.paraclinicModalities.find((m) => m.id === rep.modalityId);

    const card = document.createElement('div');
    card.className = 'imaging-instance-card';

    // Header
    const header = document.createElement('div');
    header.className = 'imaging-card-header';
    header.innerHTML = `
      <div class="imaging-card-title">
        <span>📸</span>
        <span>${rep.modalityLabel}</span>
      </div>
      <button type="button" class="btn-delete-imaging" title="حذف این نوبت">🗑️ حذف</button>
    `;

    header.querySelector('.btn-delete-imaging').addEventListener('click', () => {
      clinicalState.paraclinics.imagingReports.splice(index, 1);
      renderImagingReportsList();
      saveCurrentCase();
      updateLivePreview();
    });
    card.appendChild(header);

    // Date input
    const dateRow = document.createElement('div');
    dateRow.className = 'form-group';
    dateRow.innerHTML = `<label class="form-label">تاریخ انجام</label>`;
    const dateInp = document.createElement('input');
    dateInp.type = 'text';
    dateInp.className = 'input-text dir-ltr';
    dateInp.value = rep.date || '';
    dateInp.placeholder = '1405/07/28';
    dateInp.addEventListener('input', (e) => {
      rep.date = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    dateRow.appendChild(dateInp);
    card.appendChild(dateRow);

    // Quick tags for this modality
    if (modDef && modDef.quickTags && modDef.quickTags.length > 0) {
      const tagGroup = document.createElement('div');
      tagGroup.className = 'form-group';
      tagGroup.innerHTML = `<label class="form-label">یافته‌های سریع و شایع</label>`;
      const tagGrid = document.createElement('div');
      tagGrid.className = 'tag-selector-grid';

      modDef.quickTags.forEach((qt) => {
        if (!rep.tags) rep.tags = [];
        const isSel = rep.tags.find((t) => (typeof t === 'object' ? t.id : t) === qt.id);

        const chip = document.createElement('span');
        chip.className = `factor-chip ${isSel ? 'active' : ''}`;
        chip.textContent = qt.label;
        chip.addEventListener('click', () => {
          const idx = rep.tags.findIndex((t) => (typeof t === 'object' ? t.id : t) === qt.id);
          if (idx >= 0) {
            rep.tags.splice(idx, 1);
            chip.classList.remove('active');
          } else {
            let detail = '';
            if (qt.detailHint) {
              const userInp = prompt(`توضیح برای «${qt.label}» (${qt.detailHint}):`);
              if (userInp) detail = userInp.trim();
            }
            rep.tags.push({ id: qt.id, label: qt.label, detail });
            chip.classList.add('active');
          }
          saveCurrentCase();
          updateLivePreview();
        });
        tagGrid.appendChild(chip);
      });
      tagGroup.appendChild(tagGrid);
      card.appendChild(tagGroup);
    }

    // Summary Textarea
    const sumGroup = document.createElement('div');
    sumGroup.className = 'form-group';
    sumGroup.style.marginTop = '0.5rem';
    sumGroup.innerHTML = `<label class="form-label">متن کامل یا خلاصه گزارش تصویربرداری</label>`;
    const sumTa = document.createElement('textarea');
    sumTa.className = 'input-textarea';
    sumTa.placeholder = 'متن ریپورت رادیولوژیست یا جراح...';
    sumTa.value = rep.summary || '';
    sumTa.addEventListener('input', (e) => {
      rep.summary = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    sumGroup.appendChild(sumTa);
    card.appendChild(sumGroup);

    container.appendChild(card);
  });
}

/* ==========================================================================
   Tab 8: Clinical Reasoning (Problem Representation & DDx) - SQs Removed
   ========================================================================== */
function initReasoningHandlers() {
  const prInput = document.getElementById('reasoningProblemRep');
  const ddxInput = document.getElementById('reasoningDdx');
  const btnAutoPR = document.getElementById('btnAutoGeneratePR');

  prInput?.addEventListener('input', (e) => {
    clinicalState.reasoning.problemRepresentation = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  ddxInput?.addEventListener('input', (e) => {
    clinicalState.reasoning.ddx = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  btnAutoPR?.addEventListener('click', () => {
    const generated = synthesizeProblemRepresentation(clinicalState);
    clinicalState.reasoning.problemRepresentation = generated;
    if (prInput) prInput.value = generated;
    saveCurrentCase();
    updateLivePreview();
    showToast('بازنمایی مسئله هوشمند با موفقیت تولید شد.', 'success');
  });
}

/* ==========================================================================
   System Gap Loggers
   ========================================================================== */
function initSystemGapLoggers() {
  const gapMap = [
    { inputId: 'hpiSystemGapInput', target: () => clinicalState.hpi },
    { inputId: 'pmhSystemGapInput', target: () => clinicalState.pmh },
    { inputId: 'pshSystemGapInput', target: () => clinicalState.psh },
    { inputId: 'dhSystemGapInput', target: () => clinicalState.dh },
    { inputId: 'ahSystemGapInput', target: () => clinicalState.ah },
    { inputId: 'shSystemGapInput', target: () => clinicalState.sh },
    { inputId: 'fhSystemGapInput', target: () => clinicalState.fh },
    { inputId: 'rosSystemGapInput', target: () => clinicalState.ros },
    { inputId: 'peSystemGapInput', target: () => clinicalState.pe },
    { inputId: 'paraclinicSystemGapInput', target: () => clinicalState.paraclinics }
  ];

  gapMap.forEach(({ inputId, target }) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', (e) => {
      target().systemGapNote = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });
}

/* ==========================================================================
   Navigation Tabs & Sticky Live Note Preview
   ========================================================================== */
function initNavigationTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove('active'));
      panes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        activeSectionId = targetPane.dataset.sectionId || 'cc_admission';
      }
    });
  });
}

export function updateLivePreview() {
  let noteMarkdown = '';
  if (currentAppMode === 'soap') {
    const linkedCase = getLinkedOrCurrentCase();
    noteMarkdown = generateSOAPProgressNote(soapState, linkedCase);
    syncActiveSoapDayToHistory();
    scheduleDebouncedSoapAutoSave();
  } else if (currentAppMode === 'atls') {
    if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();
    noteMarkdown = generateATLSNote(clinicalState.atls, clinicalState);
  } else {
    noteMarkdown = generateClinicalNote(clinicalState);
  }

  const desktopPreview = document.getElementById('liveNotePreview');
  const mobilePreview = document.getElementById('mobileLiveNotePreview');

  // Format markdown to HTML simply for live preview
  const formattedHtml = formatMarkdownForDisplay(noteMarkdown);

  if (desktopPreview) desktopPreview.innerHTML = formattedHtml;
  if (mobilePreview) mobilePreview.innerHTML = formattedHtml;

  // Update SOAP notes counter badge on H&P preview toolbar
  const soapCountBadge = document.getElementById('patientSoapNotesCountBadge');
  if (soapCountBadge) {
    const historyArr = Array.isArray(clinicalState.soapHistory) && clinicalState.soapHistory.length > 0
      ? clinicalState.soapHistory
      : (Array.isArray(clinicalState.progressNotes) ? clinicalState.progressNotes : []);
    soapCountBadge.textContent = String(historyArr.length);
  }

  // Update counters
  const analytics = ClinicalCaseAnalytics.analyzeState(clinicalState);
  const posBadge = document.getElementById('badgePosCount');
  const negBadge = document.getElementById('badgeNegCount');
  const mobilePos = document.getElementById('mobilePosCount');
  const mobileNeg = document.getElementById('mobileNegCount');

  if (posBadge) posBadge.textContent = analytics.positiveCount;
  if (negBadge) negBadge.textContent = analytics.negativeCount;
  if (mobilePos) mobilePos.textContent = analytics.positiveCount;
  if (mobileNeg) mobileNeg.textContent = analytics.negativeCount;
}

function formatMarkdownForDisplay(md) {
  const lang = getCurrentLanguage();
  if (!md) return `<div class="preview-empty">${lang === 'en' ? 'Documenting clinical encounter...' : 'در حال تکمیل پرونده...'}</div>`;

  let html = md
    .replace(/^> \*\*مشخصات هویتی بیمار:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>مشخصات بیمار:</strong> $1</div>')
    .replace(/^> \*\*بیمار:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>بیمار:</strong> $1</div>')
    .replace(/^> \*\*مصدوم \/ بیمار:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>مصدوم / بیمار:</strong> $1</div>')
    .replace(/^> \*\*Patient Demographics:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>Patient Demographics:</strong> $1</div>')
    .replace(/^### (.*$)/gm, '<h3 class="preview-h3">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="preview-h4" style="margin:0.65rem 0 0.3rem; color:var(--primary); font-size:0.92rem;">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<div class="preview-bullet">• $1</div>')
    .replace(/^  \* (.*$)/gm, '<div class="preview-sub-bullet" style="margin-right:1rem;">▫ $1</div>')
    .replace(/^    - (.*$)/gm, '<div class="preview-sub-bullet" style="margin-right:2rem;">- $1</div>')
    .replace(/\n\n/g, '<br/>');

  return html;
}

/* ==========================================================================
   Sync DOM From State (Restores All Inputs & Vitals Perfectly)
   ========================================================================== */
function syncDomFromState() {
  const idBadge = document.getElementById('headerCaseId');
  if (idBadge) idBadge.textContent = clinicalState.caseId;

  // Demographics
  const d = clinicalState.demographics;
  if (document.getElementById('demoFullName')) document.getElementById('demoFullName').value = d.fullName || '';
  if (document.getElementById('demoFatherName')) document.getElementById('demoFatherName').value = d.fatherName || '';
  if (document.getElementById('demoBirthDate')) document.getElementById('demoBirthDate').value = d.birthDate || '';
  if (document.getElementById('demoGender')) document.getElementById('demoGender').value = d.gender || 'female';
  if (document.getElementById('demoAge')) document.getElementById('demoAge').value = d.age || '';
  if (document.getElementById('demoMarital')) document.getElementById('demoMarital').value = d.marital || 'متأهل';
  if (document.getElementById('demoCity')) document.getElementById('demoCity').value = d.city || '';
  if (document.getElementById('demoOccupation')) document.getElementById('demoOccupation').value = d.occupation || '';
  if (document.getElementById('demoInformant')) document.getElementById('demoInformant').value = d.informant || 'خود بیمار';
  if (document.getElementById('demoWard')) document.getElementById('demoWard').value = d.ward || '';
  if (document.getElementById('demoBed')) document.getElementById('demoBed').value = d.bed || '';
  updateHeaderActivePatientBadge();

  const obgynCard = document.getElementById('cardObGynHistory');
  if (obgynCard) {
    obgynCard.style.display = d.gender === 'male' ? 'none' : 'block';
  }

  // Trauma Unresponsive Banner Sync
  const isTraumaUnresponsive = !!clinicalState.admission?.unresponsiveTrauma;
  const btnTraumaToggle = document.getElementById('btnTraumaUnresponsiveToggle');
  const bannerTrauma = document.getElementById('bannerTraumaUnresponsive');
  if (btnTraumaToggle) {
    btnTraumaToggle.classList.toggle('active', isTraumaUnresponsive);
    btnTraumaToggle.setAttribute('aria-pressed', isTraumaUnresponsive ? 'true' : 'false');
    const icon = btnTraumaToggle.querySelector('.btn-check-icon');
    if (icon) icon.textContent = isTraumaUnresponsive ? '🟢' : '⚪';
    const txt = btnTraumaToggle.querySelector('span:last-child');
    if (txt) txt.textContent = isTraumaUnresponsive ? 'حالت ترومای بدحال فعال است (کلیک جهت لغو)' : 'فعال‌سازی حالت ترومای بدحال / ۱۱۵';
  }
  if (bannerTrauma) {
    bannerTrauma.classList.toggle('active', isTraumaUnresponsive);
  }

  // Elective Procedure-Only Sync
  const isProcOnly = !!clinicalState.admission?.isProcedureOnly;
  const btnElecSymptom = document.getElementById('btnElectiveSymptomatic');
  const btnElecProc = document.getElementById('btnElectiveProcedureOnly');
  const wrapProc = document.getElementById('wrapperElectiveProcedures');
  if (btnElecSymptom && btnElecProc) {
    btnElecSymptom.classList.toggle('active', !isProcOnly);
    btnElecProc.classList.toggle('active', isProcOnly);
  }
  if (wrapProc) {
    wrapProc.style.display = isProcOnly ? 'block' : 'none';
  }

  // ROS Unobtainable Banner Sync
  const isRosUnobtainable = !!clinicalState.ros?.unobtainable;
  const bannerRos = document.getElementById('bannerRosUnobtainable');
  const btnRosManual = document.getElementById('btnRosUnobtainableManual');
  if (bannerRos) bannerRos.style.display = isRosUnobtainable ? 'flex' : 'none';
  if (btnRosManual) {
    btnRosManual.classList.toggle('btn-danger', isRosUnobtainable);
    btnRosManual.classList.toggle('btn-secondary', !isRosUnobtainable);
  }

  // Header Case Switcher Sync
  populateHeaderCaseSwitcher();

  // CC (3 Pure Pathways in v0.8)
  const cc = clinicalState.cc;
  if (cc.pathway === 'inpatient_transfer') {
    document.getElementById('chipPathwayTransfer')?.click();
  } else if (cc.pathway === 'elective_clinic' || cc.pathway === 'clinic_referral') {
    document.getElementById('chipPathwayClinic')?.click();
  } else if (cc.pathway === 'postop_complication') {
    document.getElementById('chipPathwayPostop')?.click();
  } else {
    document.getElementById('chipPathwayEmergency')?.click();
  }

  if (document.getElementById('ccPatientQuote')) document.getElementById('ccPatientQuote').value = cc.patientQuote || cc.ccPhrase || '';
  if (document.getElementById('ccEstablishedDiagnosis')) document.getElementById('ccEstablishedDiagnosis').value = cc.establishedDiagnosis || '';
  if (document.getElementById('ccReferringAttending')) document.getElementById('ccReferringAttending').value = cc.referringAttending || '';
  if (document.getElementById('ccPlannedProcedure')) document.getElementById('ccPlannedProcedure').value = cc.plannedProcedure || '';
  if (document.getElementById('ccOriginWardHospital')) document.getElementById('ccOriginWardHospital').value = cc.originWardHospital || '';
  if (document.getElementById('ccPrimaryAdmissionReason')) document.getElementById('ccPrimaryAdmissionReason').value = cc.primaryAdmissionReason || '';
  if (document.getElementById('ccTransferConsultReason')) document.getElementById('ccTransferConsultReason').value = cc.transferConsultReason || '';

  // HPI
  renderArchetypeSelectorBar();
  renderHpiPresentations();
  renderHpiBasicSymptoms();
  renderHpiUnlockableModules();

  if (document.getElementById('hpiPreAdmissionWorkup')) document.getElementById('hpiPreAdmissionWorkup').value = clinicalState.hpi.preAdmissionWorkup || '';
  if (document.getElementById('hpiNarrativeNote')) document.getElementById('hpiNarrativeNote').value = clinicalState.hpi.narrativeNote || '';
  if (document.getElementById('hpiSystemGapInput')) document.getElementById('hpiSystemGapInput').value = clinicalState.hpi.systemGapNote || '';

  // PMH / PSH / ObGyn
  renderPmhCategories();
  renderPshCapsulesAndSelected();
  if (document.getElementById('pshNote')) document.getElementById('pshNote').value = clinicalState.psh.note || '';
  if (document.getElementById('pshSystemGapInput')) document.getElementById('pshSystemGapInput').value = clinicalState.psh.systemGapNote || '';
  if (document.getElementById('pmhSystemGapInput')) document.getElementById('pmhSystemGapInput').value = clinicalState.pmh.systemGapNote || '';

  const ob = clinicalState.obgyn;
  if (document.getElementById('obgynG')) document.getElementById('obgynG').value = ob.g || '';
  if (document.getElementById('obgynP')) document.getElementById('obgynP').value = ob.p || '';
  if (document.getElementById('obgynAb')) document.getElementById('obgynAb').value = ob.ab || '';
  if (document.getElementById('obgynL')) document.getElementById('obgynL').value = ob.l || '';
  if (document.getElementById('obgynDeliveryType')) document.getElementById('obgynDeliveryType').value = ob.deliveryType || '';
  if (document.getElementById('obgynLmp')) document.getElementById('obgynLmp').value = ob.lmp || '';
  if (document.getElementById('obgynDysmenorrhea')) document.getElementById('obgynDysmenorrhea').value = ob.dysmenorrhea || '';
  renderPregnancyHistoryRows();

  // DH / AH / SH / FH (v0.8-Omnisearch)
  const btnNoRoutineMeds = document.getElementById('btnNoRoutineMedications');
  if (btnNoRoutineMeds) btnNoRoutineMeds.classList.toggle('is-confirmed', !!clinicalState.dh?.noRoutineMeds);
  renderActiveDrugs();
  renderDhCategoryPills();
  renderCustomDrugs();
  if (document.getElementById('dhNote')) document.getElementById('dhNote').value = clinicalState.dh.note || '';
  if (document.getElementById('dhSystemGapInput')) document.getElementById('dhSystemGapInput').value = clinicalState.dh.systemGapNote || '';

  if (document.getElementById('ahNote')) document.getElementById('ahNote').value = clinicalState.ah.note || '';
  if (document.getElementById('ahSystemGapInput')) document.getElementById('ahSystemGapInput').value = clinicalState.ah.systemGapNote || '';

  // SH sync
  document.getElementById('btnNegSmoking')?.classList.toggle('is-confirmed', !!clinicalState.sh?.negSmoking);
  document.getElementById('btnNegOpium')?.classList.toggle('is-confirmed', !!clinicalState.sh?.negOpium);
  document.getElementById('btnNegAlcohol')?.classList.toggle('is-confirmed', !!clinicalState.sh?.negAlcohol);

  if (document.getElementById('shCigsPerDay')) document.getElementById('shCigsPerDay').value = clinicalState.sh.cigsPerDay || '';
  if (document.getElementById('shYearsSmoked')) document.getElementById('shYearsSmoked').value = clinicalState.sh.yearsSmoked || '';
  const packYearBadge = document.getElementById('packYearBadge');
  if (packYearBadge && clinicalState.sh.cigsPerDay && clinicalState.sh.yearsSmoked) {
    const py = ((Number(clinicalState.sh.cigsPerDay) / 20) * Number(clinicalState.sh.yearsSmoked)).toFixed(1);
    packYearBadge.textContent = `${py} Pack-Year`;
  }
  if (document.getElementById('shOpium')) document.getElementById('shOpium').value = clinicalState.sh.opium || '';
  if (document.getElementById('shNote')) document.getElementById('shNote').value = clinicalState.sh.note || '';
  if (document.getElementById('shSystemGapInput')) document.getElementById('shSystemGapInput').value = clinicalState.sh.systemGapNote || '';

  // FH sync
  document.getElementById('btnNegFamilyHistory')?.classList.toggle('is-confirmed', !!clinicalState.fh?.negFamilyHistory || !!clinicalState.fh?.masterNeg);
  renderFhQuickPills();
  renderFhActiveDiseases();
  if (document.getElementById('fhNote')) document.getElementById('fhNote').value = clinicalState.fh.note || '';
  if (document.getElementById('fhSystemGapInput')) document.getElementById('fhSystemGapInput').value = clinicalState.fh.systemGapNote || '';

  // ROS
  renderRosGroups();
  if (document.getElementById('rosSystemGapInput')) document.getElementById('rosSystemGapInput').value = clinicalState.ros.systemGapNote || '';

  // PE & VITALS PERSISTENCE RESTORATION
  const v = clinicalState.pe.vitals;
  if (document.getElementById('peVitalsBp')) document.getElementById('peVitalsBp').value = v.bp || '';
  if (document.getElementById('peVitalsPr')) document.getElementById('peVitalsPr').value = v.pr || '';
  if (document.getElementById('peVitalsRr')) document.getElementById('peVitalsRr').value = v.rr || '';
  if (document.getElementById('peVitalsTemp')) document.getElementById('peVitalsTemp').value = v.temp || '';
  if (document.getElementById('peVitalsSpo2')) document.getElementById('peVitalsSpo2').value = v.spo2 || '';
  if (document.getElementById('peVitalsNpo')) document.getElementById('peVitalsNpo').value = v.npo || '';

  renderPeMandatoryPillars();
  renderMassExamModule();
  renderAtlsExamModule();
  renderPeUnlockableModules();
  renderPeComprehensiveSystems();
  if (document.getElementById('peNote')) document.getElementById('peNote').value = clinicalState.pe.note || '';
  if (document.getElementById('peSystemGapInput')) document.getElementById('peSystemGapInput').value = clinicalState.pe.systemGapNote || '';

  // Paraclinics
  renderParaclinicLabs();
  initModalityLauncherBar();
  renderImagingReportsList();
  if (document.getElementById('paraclinicLabNote')) document.getElementById('paraclinicLabNote').value = clinicalState.paraclinics.labNote || '';
  if (document.getElementById('paraclinicSystemGapInput')) document.getElementById('paraclinicSystemGapInput').value = clinicalState.paraclinics.systemGapNote || '';

  // Reasoning
  if (document.getElementById('reasoningProblemRep')) document.getElementById('reasoningProblemRep').value = clinicalState.reasoning.problemRepresentation || '';
  if (document.getElementById('reasoningDdx')) document.getElementById('reasoningDdx').value = clinicalState.reasoning.ddx || '';

  // ATLS Dedicated Mode Sync
  if (typeof syncAtlsDomFromState === 'function') {
    syncAtlsDomFromState();
  }
}

/* ==========================================================================
   Export, Copy, PII Privacy & Modals
   ========================================================================== */
function initExportAndCopy() {
  function copyText() {
    let text = '';
    let msg = 'متن کامل شرح‌حال در حافظه کپی شد.';
    if (currentAppMode === 'soap') {
      text = generateSOAPProgressNote(soapState, getLinkedOrCurrentCase());
      msg = 'متن یادداشت SOAP در حافظه کپی شد.';
    } else if (currentAppMode === 'atls') {
      text = generateATLSNote(clinicalState.atls, clinicalState);
      msg = 'متن پرونده ترومای اورژانس (ATLS) در حافظه کپی شد.';
    } else {
      text = generateClinicalNote(clinicalState);
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(msg, 'success');
    }).catch(() => {
      showToast('خطا در کپی متن.', 'warning');
    });
  }

  document.getElementById('btnCopyNote')?.addEventListener('click', copyText);
  document.getElementById('btnCopyNoteMobile')?.addEventListener('click', copyText);

  function exportJson() {
    // Strictly sanitize PII before export
    const sanitized = sanitizeRecordForExport(clinicalState);
    const meta = ClinicalCaseAnalytics.buildMetadataSnapshot(sanitized);
    const bundle = {
      record: sanitized,
      metadata: meta,
      generatedNote: generateClinicalNote(sanitized)
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicalState.caseId}-sanitized.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل JSON استاندارد پژوهشی (فاقد مشخصات هویتی حساس) دانلود شد.', 'success');
  }

  document.getElementById('btnExportJson')?.addEventListener('click', exportJson);
  document.getElementById('btnExportJsonMobile')?.addEventListener('click', exportJson);

  document.getElementById('btnNewCase')?.addEventListener('click', () => {
    if (confirm('آیا مایل به ثبت پرونده جدید هستید؟ پرونده فعلی در شیفت ذخیره می‌شود.')) {
      saveCaseToShiftVault(clinicalState);
      clinicalState = createDefaultClinicalState();
      saveCurrentCase();
      syncDomFromState();
      updateLivePreview();
      showToast('پرونده جدید با موفقیت ایجاد شد.', 'info');
    }
  });
}

function saveCaseToShiftVault(stateToSave) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    list.unshift(JSON.parse(JSON.stringify(stateToSave)));
    localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list.slice(0, 50)));
    if (typeof storageVault !== 'undefined') {
      storageVault.upsertCaseToArchive(stateToSave);
    }
    updateShiftCasesCount();
    populateHeaderCaseSwitcher();
  } catch (e) {
    console.warn('Failed to save to shift vault:', e);
  }
}

async function populateHeaderCaseSwitcher() {
  const select = document.getElementById('headerCaseSwitcher');
  if (!select) return;

  try {
    const cases = typeof storageVault !== 'undefined'
      ? await storageVault.getAllPermanentCases()
      : JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');

    select.innerHTML = '';

    const currentOpt = document.createElement('option');
    currentOpt.value = clinicalState.caseId;
    const curName = clinicalState.demographics?.fullName || 'بیمار بدون نام';
    currentOpt.textContent = `📌 پرونده فعال: ${curName} (${clinicalState.caseId})`;
    currentOpt.selected = true;
    select.appendChild(currentOpt);

    cases.forEach(c => {
      if (c.caseId === clinicalState.caseId) return;
      const opt = document.createElement('option');
      opt.value = c.caseId;
      const patName = c.demographics?.fullName || 'بیمار بدون نام';
      const timeStr = c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '';
      opt.textContent = `📁 ${patName} (${c.caseId}) - ${timeStr}`;
      select.appendChild(opt);
    });
  } catch (e) {
    console.warn('Failed to populate header case switcher:', e);
  }
}

function initHeaderCaseSwitcher() {
  const select = document.getElementById('headerCaseSwitcher');
  if (!select) return;

  select.addEventListener('change', async (e) => {
    const selectedId = e.target.value;
    if (!selectedId || selectedId === clinicalState.caseId) return;

    if (confirm('آیا مایل به جابجایی به این پرونده ذخیره‌شده هستید؟ پرونده فعلی در حافظه دائمی حفظ می‌شود.')) {
      saveCaseToShiftVault(clinicalState);
      let targetCase = null;
      if (typeof storageVault !== 'undefined') {
        targetCase = await storageVault.getPermanentCaseById(selectedId);
      }
      if (!targetCase) {
        const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
        targetCase = list.find(c => c.caseId === selectedId);
      }

      if (targetCase) {
        const defaults = createDefaultClinicalState();
        clinicalState = {
          ...defaults,
          ...targetCase,
          admission: { ...defaults.admission, ...(targetCase.admission || {}) },
          demographics: { ...defaults.demographics, ...(targetCase.demographics || {}) },
          cc: { ...defaults.cc, ...(targetCase.cc || {}) },
          hpi: { ...defaults.hpi, ...(targetCase.hpi || {}) },
          obgyn: { ...defaults.obgyn, ...(targetCase.obgyn || {}) },
          pmh: { ...defaults.pmh, ...(targetCase.pmh || {}) },
          psh: { ...defaults.psh, ...(targetCase.psh || {}) },
          dh: { ...defaults.dh, ...(targetCase.dh || {}) },
          ah: { ...defaults.ah, ...(targetCase.ah || {}) },
          sh: { ...defaults.sh, ...(targetCase.sh || {}) },
          fh: { ...defaults.fh, ...(targetCase.fh || {}) },
          ros: { ...defaults.ros, ...(targetCase.ros || {}) },
          pe: { ...defaults.pe, ...(targetCase.pe || {}) },
          paraclinics: { ...defaults.paraclinics, ...(targetCase.paraclinics || {}) },
          reasoning: { ...defaults.reasoning, ...(targetCase.reasoning || {}) }
        };
        saveCurrentCase();
        syncDomFromState();
        updateLivePreview();
        populateHeaderCaseSwitcher();
        showToast('پرونده با موفقیت فراخوانی شد.', 'success');
      }
    } else {
      select.value = clinicalState.caseId;
    }
  });
}

function updateShiftCasesCount() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    const countEl = document.getElementById('shiftCasesCount');
    if (countEl) countEl.textContent = list.length + 1;
  } catch (e) {}
}

function initShiftManager() {
  const modal = document.getElementById('shiftModalBackdrop');
  const btnOpen = document.getElementById('btnOpenShiftManager');
  const btnClose = document.getElementById('btnCloseShiftModal');
  const listContainer = document.getElementById('shiftCasesList');
  const btnSaveCurrent = document.getElementById('btnSaveCurrentToShift');
  const btnImport = document.getElementById('btnImportShiftJson');
  const fileInput = document.getElementById('shiftFileInput');
  const btnClear = document.getElementById('btnClearShiftVault');

  const openModal = () => {
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
      renderShiftCasesList();
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
  };

  btnOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Save current active case snapshot manually to shift vault
  btnSaveCurrent?.addEventListener('click', () => {
    saveCaseToShiftVault(clinicalState);
    renderShiftCasesList();
    showToast(getCurrentLanguage() === 'en' ? 'Current case saved to shift vault.' : 'نسخه فعلی پرونده با موفقیت در صندوق شیفت ذخیره شد.', 'success');
  });

  // Import JSON into Shift Vault
  btnImport?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => list.unshift(item));
        } else if (parsed && typeof parsed === 'object') {
          list.unshift(parsed);
        }
        localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list.slice(0, 100)));
        updateShiftCasesCount();
        renderShiftCasesList();
        showToast(getCurrentLanguage() === 'en' ? 'Cases successfully imported to shift vault.' : 'پرونده(ها) با موفقیت به صندوق شیفت اضافه شدند.', 'success');
      } catch (err) {
        showToast((getCurrentLanguage() === 'en' ? 'JSON import error: ' : 'خطا در خواندن فایل JSON: ') + err.message, 'warning');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // Clear Shift History
  btnClear?.addEventListener('click', () => {
    const confirmMsg = getCurrentLanguage() === 'en' ? 'Are you sure you want to clear all shift history?' : 'آیا از پاکسازی تمام تاریخچه شیفت اطمینان دارید؟';
    if (confirm(confirmMsg)) {
      localStorage.removeItem(STORAGE_SHIFT_CASES_KEY);
      updateShiftCasesCount();
      renderShiftCasesList();
      showToast(getCurrentLanguage() === 'en' ? 'Shift history cleared.' : 'تاریخچه شیفت با موفقیت پاکسازی شد.', 'info');
    }
  });

  function renderShiftCasesList() {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const lang = getCurrentLanguage();
    const isEn = lang === 'en';
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');

    // 1. Render Current Active Case at Top
    const activeItem = document.createElement('div');
    activeItem.className = 'shift-vault-item';
    activeItem.style.border = '1.5px solid var(--primary)';
    activeItem.innerHTML = `
      <div class="shift-vault-info">
        <div>
          <span class="shift-active-tag">${isEn ? 'Active Case' : 'پرونده جاری'}</span>
          <strong class="shift-vault-case-id">${clinicalState.caseId}</strong>
        </div>
        <div class="shift-vault-cc">${clinicalState.demographics?.fullName || (isEn ? 'Unnamed Patient' : 'بیمار بدون نام')} - ${clinicalState.cc?.patientQuote || (isEn ? 'Active Surgical Complaint' : 'شکایت جراحی فعلی')}</div>
        <div class="shift-vault-time">${new Date(clinicalState.createdAt || Date.now()).toLocaleTimeString()}</div>
      </div>
      <div class="shift-vault-actions">
        <span style="font-size:0.75rem; color:var(--primary); font-weight:700;">${isEn ? 'Editing' : 'در حال ثبت'}</span>
        <button type="button" class="btn btn-secondary btn-sm btn-delete-active-case" style="color:#EF4444;" title="${isEn ? 'Permanently Delete Case' : 'حذف قطعی پرونده'}">✕</button>
      </div>
    `;

    activeItem.querySelector('.btn-delete-active-case')?.addEventListener('click', async () => {
      const confirmDel = isEn
        ? `Permanently delete active case ${clinicalState.caseId}? This action cannot be undone.`
        : `آیا از حذف دائمی و قطعی پرونده جاری (${clinicalState.caseId}) اطمینان دارید؟ این عمل غیرقابل بازگشت است.`;
      if (confirm(confirmDel)) {
        const nextState = await storageVault.permanentlyDeleteCase(clinicalState.caseId, createDefaultClinicalState);
        clinicalState = nextState || createDefaultClinicalState();
        saveCurrentCase();
        syncDomFromState();
        updateLivePreview();
        updateShiftCasesCount();
        renderShiftCasesList();
        showToast(isEn ? 'Active case permanently deleted.' : 'پرونده جاری به طور قطعی حذف شد.', 'info');
      }
    });

    listContainer.appendChild(activeItem);

    if (list.length === 0) {
      const emptyNote = document.createElement('div');
      emptyNote.style.cssText = 'color:var(--text-muted); font-size:0.82rem; padding:1rem; text-align:center;';
      emptyNote.textContent = isEn ? 'No other archived cases in this shift.' : 'پرونده بایگانی‌شده دیگری در این شیفت وجود ندارد.';
      listContainer.appendChild(emptyNote);
      return;
    }

    list.forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'shift-vault-item';
      item.innerHTML = `
        <div class="shift-vault-info">
          <div>
            <strong class="shift-vault-case-id">${c.caseId}</strong>
            <span style="font-size:0.8rem; color:var(--text-primary); margin-inline-start:0.4rem;">${c.demographics?.fullName || ''}</span>
          </div>
          <div class="shift-vault-cc">${c.cc?.patientQuote || (isEn ? 'Surgical Complaint' : 'شکایت جراحی')}</div>
          <div class="shift-vault-time">${new Date(c.createdAt || Date.now()).toLocaleTimeString()}</div>
        </div>
        <div class="shift-vault-actions">
          <button type="button" class="btn btn-secondary btn-sm btn-load-case">${isEn ? 'Load' : 'بارگذاری'}</button>
          <button type="button" class="btn btn-secondary btn-sm btn-delete-case" style="color:#EF4444;" title="${isEn ? 'Permanently Delete' : 'حذف قطعی پرونده'}">✕</button>
        </div>
      `;

      item.querySelector('.btn-load-case').addEventListener('click', () => {
        const confirmLoad = isEn
          ? `Load case ${c.caseId}? (Active unsaved work will be saved to shift vault)`
          : `آیا مایل به بارگذاری پرونده ${c.caseId} هستید؟ (اطلاعات فعلی قبل از جابجایی در شیفت ثبت می‌شوند)`;
        if (confirm(confirmLoad)) {
          saveCaseToShiftVault(clinicalState);
          clinicalState = Object.assign(createDefaultClinicalState(), c);
          saveCurrentCase();
          syncDomFromState();
          updateLivePreview();
          closeModal();
          showToast(isEn ? `Case ${c.caseId} loaded.` : `پرونده ${c.caseId} بارگذاری گردید.`, 'info');
        }
      });

      item.querySelector('.btn-delete-case').addEventListener('click', async () => {
        const confirmDel = isEn
          ? `Permanently delete case ${c.caseId}? This action cannot be undone.`
          : `آیا از حذف دائمی و قطعی پرونده ${c.caseId} از تمام حافظه‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است.`;
        if (confirm(confirmDel)) {
          await storageVault.permanentlyDeleteCase(c.caseId, createDefaultClinicalState);
          list.splice(idx, 1);
          localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list));
          updateShiftCasesCount();
          renderShiftCasesList();
          showToast(isEn ? `Case ${c.caseId} permanently deleted.` : `پرونده ${c.caseId} به طور قطعی حذف گردید.`, 'info');
        }
      });

      listContainer.appendChild(item);
    });
  }

  // Export all shift cases
  document.getElementById('btnExportAllShiftCases')?.addEventListener('click', () => {
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    const sanitizedList = [clinicalState, ...list].map(sanitizeRecordForExport);
    const blob = new Blob([JSON.stringify(sanitizedList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shift-Dataset-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(getCurrentLanguage() === 'en' ? 'Shift dataset downloaded.' : 'دیتاست تجمیعی شیفت (فاقد مشخصات هویتی حساس) دانلود شد.', 'success');
  });
}

function initAppSettings() {
  const modal = document.getElementById('appSettingsModalBackdrop');
  const btnOpen = document.getElementById('btnAppSettings');
  const btnClose = document.getElementById('btnCloseAppSettings');
  const btnCancel = document.getElementById('btnCancelAppSettings');
  const btnSave = document.getElementById('btnSaveAppSettings');

  const settingCollector = document.getElementById('settingCollectorName');
  const settingUrl = document.getElementById('settingEndpointUrl');
  const collectorInput = document.getElementById('collectorIdInput');

  const openModal = () => {
    if (!modal) return;
    if (settingCollector) settingCollector.value = gsheetSync.config.collectorName || '';
    if (settingUrl) settingUrl.value = gsheetSync.config.scriptUrl || '';

    // Highlight active language
    const currentLang = getCurrentLanguage();
    document.getElementById('btnLangFa')?.classList.toggle('active', currentLang === 'fa');
    document.getElementById('btnLangEn')?.classList.toggle('active', currentLang === 'en');

    // Highlight active theme
    const currentTheme = getCurrentTheme();
    document.getElementById('btnThemeDark')?.classList.toggle('active', currentTheme === 'dark');
    document.getElementById('btnThemeLight')?.classList.toggle('active', currentTheme === 'light');

    // Highlight active font
    const currentFont = getCurrentFont();
    document.querySelectorAll('.settings-font-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.font === currentFont);
    });

    modal.classList.add('open');
    modal.style.display = 'flex';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.style.display = 'none';
  };

  btnOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Language buttons
  document.getElementById('btnLangFa')?.addEventListener('click', () => {
    setLanguage('fa');
    document.getElementById('btnLangFa')?.classList.add('active');
    document.getElementById('btnLangEn')?.classList.remove('active');
  });

  document.getElementById('btnLangEn')?.addEventListener('click', () => {
    setLanguage('en');
    document.getElementById('btnLangEn')?.classList.add('active');
    document.getElementById('btnLangFa')?.classList.remove('active');
  });

  // Theme buttons
  document.getElementById('btnThemeDark')?.addEventListener('click', () => {
    setTheme('dark');
    document.getElementById('btnThemeDark')?.classList.add('active');
    document.getElementById('btnThemeLight')?.classList.remove('active');
  });

  document.getElementById('btnThemeLight')?.addEventListener('click', () => {
    setTheme('light');
    document.getElementById('btnThemeLight')?.classList.add('active');
    document.getElementById('btnThemeDark')?.classList.remove('active');
  });

  // Font pills (5 styles)
  document.querySelectorAll('.settings-font-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.settings-font-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      setFont(pill.dataset.font);
    });
  });

  // Save Settings
  btnSave?.addEventListener('click', () => {
    gsheetSync.saveConfig({
      scriptUrl: settingUrl?.value || '',
      collectorName: settingCollector?.value || ''
    });
    if (collectorInput) collectorInput.value = settingCollector?.value || '';
    closeModal();
    showToast(getCurrentLanguage() === 'en' ? 'Settings saved successfully.' : 'تنظیمات سامانه با موفقیت ذخیره شد.', 'success');
  });
}

function initCloudSyncUI() {
  const btnSync = document.getElementById('btnCloudSync');
  const collectorInput = document.getElementById('collectorIdInput');

  if (collectorInput) {
    collectorInput.value = gsheetSync.config.collectorName || '';
    collectorInput.addEventListener('input', (e) => {
      gsheetSync.saveConfig({ scriptUrl: gsheetSync.config.scriptUrl, collectorName: e.target.value });
    });
  }

  btnSync?.addEventListener('click', async () => {
    btnSync.disabled = true;
    btnSync.innerHTML = '<span>⏳</span><span>در حال ارسال...</span>';

    const isSoap = currentAppMode === 'soap';
    const stateToSend = isSoap ? soapState : clinicalState;
    const note = isSoap
      ? generateSOAPProgressNote(soapState, getLinkedOrCurrentCase())
      : generateClinicalNote(clinicalState);
    const meta = isSoap
      ? {
          caseId: soapState.context?.caseId || `SOAP-${Date.now()}`,
          schemaVersion: 'v0.9-SOAP-Engine',
          metrics: { positiveFindingsCount: 0, negativeFindingsCount: 0, labsRecordedCount: Object.keys(soapState.objective?.labs || {}).length }
        }
      : ClinicalCaseAnalytics.buildMetadataSnapshot(clinicalState, gsheetSync.config.collectorName);

    try {
      const res = await gsheetSync.sendCase(stateToSend, note, meta);
      if (res.success) {
        showToast(res.message, 'success');
      } else if (res.queued) {
        showToast(res.message, 'warning');
      } else {
        showToast(res.message, 'warning');
      }
    } catch (err) {
      showToast('خطا در همگام‌سازی ابری.', 'warning');
    } finally {
      btnSync.disabled = false;
      btnSync.innerHTML = '<span>📊</span><span>ثبت در Google Sheets</span>';
    }
  });
}

function initThemeToggle() {
  const btn = document.getElementById('btnToggleTheme');
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');

  const currentTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'dark';
  document.body.classList.toggle('dark-mode', currentTheme === 'dark');
  if (sun && moon) {
    sun.style.display = currentTheme === 'dark' ? 'block' : 'none';
    moon.style.display = currentTheme === 'dark' ? 'none' : 'block';
  }

  btn?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
    if (sun && moon) {
      sun.style.display = isDark ? 'block' : 'none';
      moon.style.display = isDark ? 'none' : 'block';
    }
  });
}

function initMobileBottomSheet() {
  const btnOpen = document.getElementById('btnOpenMobileSheet');
  const btnClose = document.getElementById('btnCloseMobileSheet');
  const sheet = document.getElementById('mobileBottomSheet');
  const backdrop = document.getElementById('mobileSheetBackdrop');

  btnOpen?.addEventListener('click', () => {
    sheet?.classList.add('open');
    if (backdrop) backdrop.style.display = 'block';
    updateLivePreview();
  });

  const close = () => {
    sheet?.classList.remove('open');
    if (backdrop) backdrop.style.display = 'none';
  };

  btnClose?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
}

/* ==========================================================================
   Master Dynamic UI Bootstrapper
   ========================================================================== */

/* ==========================================================================
   v1.1-ATLS-MultiSOAP: 3-Mode Switcher, ATLS Engine & Multi-Day SOAP Tracker
   ========================================================================== */

function initAppModeSwitcher() {
  const btnAdmission = document.getElementById('btnModeAdmission');
  const btnAtls = document.getElementById('btnModeAtls');
  const btnSoap = document.getElementById('btnModeSoap');
  const btnGoToPatientSoap = document.getElementById('btnGoToPatientSoap');
  const btnBackToPatientHp = document.getElementById('btnBackToPatientHp');
  const atlsBtnGoToSoap = document.getElementById('atlsBtnGoToSoap');

  btnAdmission?.addEventListener('click', () => switchAppMode('admission'));
  btnAtls?.addEventListener('click', () => switchAppMode('atls'));
  btnSoap?.addEventListener('click', () => switchAppMode('soap'));

  btnGoToPatientSoap?.addEventListener('click', () => {
    if (clinicalState && clinicalState.caseId) {
      soapState.linkedCaseId = clinicalState.caseId;
      soapState.mode = 'linked';
    }
    switchAppMode('soap');
  });

  atlsBtnGoToSoap?.addEventListener('click', () => {
    if (clinicalState && clinicalState.caseId) {
      soapState.linkedCaseId = clinicalState.caseId;
      soapState.mode = 'linked';
    }
    switchAppMode('soap');
  });

  btnBackToPatientHp?.addEventListener('click', () => {
    switchAppMode('admission');
  });
}

export function switchAppMode(mode) {
  currentAppMode = mode;
  const btnAdmission = document.getElementById('btnModeAdmission');
  const btnAtls = document.getElementById('btnModeAtls');
  const btnSoap = document.getElementById('btnModeSoap');
  const tabsNav = document.querySelector('.tabs-navigation-wrapper');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const atlsContainer = document.getElementById('atlsModeContainer');
  const soapContainer = document.getElementById('soapModeContainer');
  const btnGoToSoap = document.getElementById('btnGoToPatientSoap');

  btnAdmission?.classList.toggle('active', mode === 'admission');
  btnAtls?.classList.toggle('active', mode === 'atls');
  btnSoap?.classList.toggle('active', mode === 'soap');

  if (mode === 'soap') {
    if (tabsNav) tabsNav.style.display = 'none';
    tabPanes.forEach((pane) => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    if (atlsContainer) atlsContainer.style.display = 'none';
    if (soapContainer) soapContainer.style.display = 'flex';
    if (btnGoToSoap) btnGoToSoap.style.display = 'none';

    if (!soapState.linkedCaseId && clinicalState?.caseId) {
      soapState.linkedCaseId = clinicalState.caseId;
      soapState.mode = 'linked';
    }

    populateSoapPatientDropdown();

    const targetCase = getActiveTargetCaseForSoap() || clinicalState;
    const historyList = Array.isArray(targetCase?.soapHistory) && targetCase.soapHistory.length > 0
      ? targetCase.soapHistory
      : (Array.isArray(targetCase?.progressNotes) ? targetCase.progressNotes : []);

    if (historyList.length === 0) {
      initFreshDayOneSoapNote();
      saveSoapProgressNote(true);
      syncSoapInputsFromState();
      renderSoapDayTracker();
    } else {
      const activeDay = historyList.find((h) => (h.dayId || h.id) === soapState.dayId) || historyList[0];
      if (activeDay && activeDay.soapState) {
        soapState = JSON.parse(JSON.stringify(activeDay.soapState));
        soapState.linkedCaseId = targetCase.caseId;
        soapState.mode = 'linked';
        soapState.dayId = activeDay.dayId || activeDay.id || soapState.dayId;
      }
      syncSoapInputsFromState();
      renderSoapDayTracker();
    }
  } else if (mode === 'atls') {
    if (tabsNav) tabsNav.style.display = 'none';
    tabPanes.forEach((pane) => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    if (soapContainer) soapContainer.style.display = 'none';
    if (atlsContainer) atlsContainer.style.display = 'flex';
    if (btnGoToSoap) btnGoToSoap.style.display = '';
    syncAtlsDomFromState();
  } else {
    if (tabsNav) tabsNav.style.display = '';
    const activeTab = document.querySelector('.segmented-tabs-bar .tab-btn.active');
    const activeTabId = activeTab ? activeTab.getAttribute('data-tab') : 'tab-cc';
    tabPanes.forEach((pane) => {
      pane.style.display = '';
      pane.classList.toggle('active', pane.id === activeTabId);
    });
    if (atlsContainer) atlsContainer.style.display = 'none';
    if (soapContainer) soapContainer.style.display = 'none';
    if (btnGoToSoap) btnGoToSoap.style.display = '';
  }

  updateLivePreview();
}

/* ==========================================================================
   Dedicated Mode 2: Emergency ATLS Trauma Note Engine
   ========================================================================== */
function setNestedAtlsProp(path, val) {
  if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();
  const parts = path.split('.');
  let cur = clinicalState.atls;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function getNestedAtlsProp(path) {
  if (!clinicalState.atls) return undefined;
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), clinicalState.atls);
}

export function renderAtlsInjuriesList() {
  const container = document.getElementById('atlsInjuriesListContainer');
  if (!container) return;
  if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();
  const injuries = clinicalState.atls.secondary.injuries || [];

  if (injuries.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); padding:0.35rem 0;">هنوز ضایعه یا بریدگی موضعی ثبت نشده است. با دکمه «➕ افزودن ضایعه / آسیب جدید» اضافه کنید.</div>`;
    return;
  }

  container.innerHTML = '';
  const injuryTypes = [
    'بریدگی / پارگی (Laceration)',
    'زخم نافذ چاقو (Stab Wound)',
    'مدخل/مخرج گلوله (GSW)',
    'دفورمیتی / شکستگی باز (Open Fracture)',
    'له‌شدگی بافتی (Crush / Degloving)',
    'هماتوم / اکیموز وسیع (Hematoma / Contusion)',
    'آمپوتاسیون تروماتیک (Traumatic Amputation)'
  ];
  const bleedingStatuses = [
    'بدون خونریزی فعال (Controlled / Oozing)',
    'خونریزی وریدی فعال — کنترل با پانسمان فشاری',
    'خونریزی شریانی جهنده (Pulsatile Arterial Bleeding)',
    'هماتوم پیشرونده و ضربان‌دار (Expanding Hematoma)'
  ];

  injuries.forEach((inj, idx) => {
    const row = document.createElement('div');
    row.className = 'atls-injury-row';
    row.innerHTML = `
      <select class="input-select atls-inj-type">
        ${injuryTypes.map((t) => `<option value="${t}" ${inj.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="text" class="input-text atls-inj-site" placeholder="محل دقیق آناتومیک (مثلاً ساعد چپ، همی‌توراکس راست)..." value="${inj.site || ''}">
      <input type="text" class="input-text atls-inj-dim" placeholder="ابعاد و عمق (مثلاً 4×2 cm تا فاسیا)..." value="${inj.dimensions || ''}">
      <select class="input-select atls-inj-bleed">
        ${bleedingStatuses.map((b) => `<option value="${b}" ${inj.bleeding === b ? 'selected' : ''}>${b}</option>`).join('')}
      </select>
      <input type="text" class="input-text atls-inj-nv" placeholder="معاینه نوروواسکولار دیستال (نبض، حس، حرکت تاندون)..." value="${inj.neurovascular || ''}">
      <button type="button" class="btn-delete-imaging atls-inj-del" title="حذف ضایعه">✕</button>
    `;

    row.querySelector('.atls-inj-type')?.addEventListener('change', (e) => {
      inj.type = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.atls-inj-site')?.addEventListener('input', (e) => {
      inj.site = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.atls-inj-dim')?.addEventListener('input', (e) => {
      inj.dimensions = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.atls-inj-bleed')?.addEventListener('change', (e) => {
      inj.bleeding = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.atls-inj-nv')?.addEventListener('input', (e) => {
      inj.neurovascular = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    row.querySelector('.atls-inj-del')?.addEventListener('click', () => {
      clinicalState.atls.secondary.injuries.splice(idx, 1);
      renderAtlsInjuriesList();
      saveCurrentCase();
      updateLivePreview();
    });

    container.appendChild(row);
  });
}

export function syncAtlsDomFromState() {
  if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();
  const atls = clinicalState.atls;
  const mist = atls.mist || {};
  const pri = atls.primary || {};
  const vit = pri.vitals || {};
  const ample = atls.ample || {};
  const sec = atls.secondary || {};

  // Single-select chip groups
  document.querySelectorAll('[data-atls-single]').forEach((group) => {
    const path = group.getAttribute('data-atls-single');
    const curVal = getNestedAtlsProp(path);
    group.querySelectorAll('.soap-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.getAttribute('data-val') === curVal);
    });
  });

  // Multi-select chip groups
  document.querySelectorAll('[data-atls-multi]').forEach((group) => {
    const path = group.getAttribute('data-atls-multi');
    const arr = getNestedAtlsProp(path) || [];
    group.querySelectorAll('.soap-chip, .soap-plan-pill').forEach((chip) => {
      chip.classList.toggle('active', Array.isArray(arr) && arr.includes(chip.getAttribute('data-val')));
    });
  });

  // Text & Number Inputs
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v !== undefined && v !== null ? v : '';
  };

  setVal('atlsIncidentTime', mist.incidentTime);
  setVal('atlsMechanismDetail', mist.mechanismDetail);

  setVal('atlsVitalBp', vit.bp);
  setVal('atlsVitalPr', vit.pr);
  setVal('atlsVitalRr', vit.rr);
  setVal('atlsVitalSpo2', vit.spo2);
  setVal('atlsVitalTemp', vit.temp);
  setVal('atlsGcsE', vit.gcsE || 4);
  setVal('atlsGcsV', vit.gcsV || 5);
  setVal('atlsGcsM', vit.gcsM || 6);
  const gcsTotalEl = document.getElementById('atlsGcsTotal');
  if (gcsTotalEl) {
    gcsTotalEl.textContent = String(vit.gcsTotal || ((Number(vit.gcsE) || 4) + (Number(vit.gcsV) || 5) + (Number(vit.gcsM) || 6)));
  }

  setVal('atlsAmpleAllergies', ample.allergies);
  setVal('atlsAmpleMedications', ample.medications);
  setVal('atlsAmplePastHistory', ample.pastHistory);
  setVal('atlsAmpleLastMeal', ample.lastMeal);
  setVal('atlsAmpleEventsTetanus', ample.eventsTetanus);

  const burnChk = document.getElementById('atlsBurnToggleCheckbox');
  const burnFields = document.getElementById('atlsBurnModuleFields');
  if (burnChk) burnChk.checked = !!sec.burnActive;
  if (burnFields) burnFields.style.display = sec.burnActive ? 'block' : 'none';
  setVal('atlsBurnDegree', sec.burnDegree || 'درجه ۲ سطحی/عمقی (Partial Thickness)');
  setVal('atlsBurnTbsa', sec.burnTbsa);
  setVal('atlsBurnInhalation', sec.burnInhalation);

  setVal('atlsExamHeadFace', sec.headFace);
  setVal('atlsExamNeck', sec.neck);
  setVal('atlsExamChest', sec.chest);
  setVal('atlsExamAbdomenPelvis', sec.abdomenPelvis);
  setVal('atlsExamPerineumDre', sec.perineumDre);
  setVal('atlsExamExtremitiesNeuro', sec.extremitiesNeuro);
  setVal('atlsEfastDetail', sec.efastDetail);
  setVal('atlsImagingNote', sec.imagingNote);
  setVal('atlsStatLabsNote', sec.statLabsNote);
  setVal('atlsPlanCustomNote', sec.planCustomNote);

  renderAtlsInjuriesList();
}

function initAtlsModeEngine() {
  if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();

  // Single-select chip groups
  document.querySelectorAll('[data-atls-single]').forEach((group) => {
    const path = group.getAttribute('data-atls-single');
    group.querySelectorAll('.soap-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.soap-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        setNestedAtlsProp(path, chip.getAttribute('data-val'));
        saveCurrentCase();
        updateLivePreview();
      });
    });
  });

  // Multi-select chip groups
  document.querySelectorAll('[data-atls-multi]').forEach((group) => {
    const path = group.getAttribute('data-atls-multi');
    group.querySelectorAll('.soap-chip, .soap-plan-pill').forEach((chip) => {
      chip.addEventListener('click', () => {
        let arr = getNestedAtlsProp(path);
        if (!Array.isArray(arr)) {
          arr = [];
          setNestedAtlsProp(path, arr);
        }
        const val = chip.getAttribute('data-val');
        const idx = arr.indexOf(val);
        if (idx >= 0) {
          arr.splice(idx, 1);
          chip.classList.remove('active');
        } else {
          arr.push(val);
          chip.classList.add('active');
        }
        saveCurrentCase();
        updateLivePreview();
      });
    });
  });

  // Bind text inputs
  const bindAtlsInput = (id, path) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      setNestedAtlsProp(path, e.target.value);
      saveCurrentCase();
      updateLivePreview();
    });
  };

  bindAtlsInput('atlsIncidentTime', 'mist.incidentTime');
  bindAtlsInput('atlsMechanismDetail', 'mist.mechanismDetail');
  bindAtlsInput('atlsVitalBp', 'primary.vitals.bp');
  bindAtlsInput('atlsVitalPr', 'primary.vitals.pr');
  bindAtlsInput('atlsVitalRr', 'primary.vitals.rr');
  bindAtlsInput('atlsVitalSpo2', 'primary.vitals.spo2');
  bindAtlsInput('atlsVitalTemp', 'primary.vitals.temp');

  // GCS E + V + M auto-calculator
  const updateGcsTotal = () => {
    const eVal = Number(document.getElementById('atlsGcsE')?.value) || 4;
    const vVal = Number(document.getElementById('atlsGcsV')?.value) || 5;
    const mVal = Number(document.getElementById('atlsGcsM')?.value) || 6;
    const tot = eVal + vVal + mVal;
    clinicalState.atls.primary.vitals.gcsE = eVal;
    clinicalState.atls.primary.vitals.gcsV = vVal;
    clinicalState.atls.primary.vitals.gcsM = mVal;
    clinicalState.atls.primary.vitals.gcsTotal = tot;
    const badge = document.getElementById('atlsGcsTotal');
    if (badge) badge.textContent = String(tot);
    saveCurrentCase();
    updateLivePreview();
  };
  ['atlsGcsE', 'atlsGcsV', 'atlsGcsM'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', updateGcsTotal);
  });

  // Preset Primary Survey Stable
  document.getElementById('btnAtlsPrimaryStablePreset')?.addEventListener('click', () => {
    clinicalState.atls.primary.airway = 'راه هوایی باز و ایمن — بیمار بیدار و سخنگو (Patent & Intact)';
    clinicalState.atls.primary.breathing = 'سمع دوطرفه ریه شفاف و متقارن (Bilateral Clear Breath Sounds)';
    clinicalState.atls.primary.circulation = 'همودینامیک پایدار، نبض‌های محیطی قرینه و پر (Class I)';
    clinicalState.atls.primary.disabilityPupils = 'مردمک‌ها قرینه و واکنش‌دار به نور (PERRLA 3mm)';
    clinicalState.atls.primary.exposure = 'لباس‌ها خارج شد، بررسی کامل سطح بدن و پیشگیری از هیپوترمی انجام شد';
    clinicalState.atls.primary.vitals.gcsE = 4;
    clinicalState.atls.primary.vitals.gcsV = 5;
    clinicalState.atls.primary.vitals.gcsM = 6;
    clinicalState.atls.primary.vitals.gcsTotal = 15;
    syncAtlsDomFromState();
    saveCurrentCase();
    updateLivePreview();
    showToast('ارزیابی اولیه (ABCDE) به صورت پایدار و نرمال تنظیم شد.', 'info');
  });

  bindAtlsInput('atlsAmpleAllergies', 'ample.allergies');
  bindAtlsInput('atlsAmpleMedications', 'ample.medications');
  bindAtlsInput('atlsAmplePastHistory', 'ample.pastHistory');
  bindAtlsInput('atlsAmpleLastMeal', 'ample.lastMeal');
  bindAtlsInput('atlsAmpleEventsTetanus', 'ample.eventsTetanus');

  // Dynamic Injury Add Button
  document.getElementById('btnAtlsAddInjury')?.addEventListener('click', () => {
    if (!Array.isArray(clinicalState.atls.secondary.injuries)) {
      clinicalState.atls.secondary.injuries = [];
    }
    clinicalState.atls.secondary.injuries.push({
      id: 'inj_' + Date.now(),
      type: 'بریدگی / پارگی (Laceration)',
      site: '',
      dimensions: '',
      bleeding: 'بدون خونریزی فعال (Controlled / Oozing)',
      neurovascular: 'نبض دیستال برقرار، حس و حرکت تاندون‌ها سالم (Intact NV)'
    });
    renderAtlsInjuriesList();
    saveCurrentCase();
    updateLivePreview();
  });

  // Burn Module Toggle
  const burnChk = document.getElementById('atlsBurnToggleCheckbox');
  const burnFields = document.getElementById('atlsBurnModuleFields');
  burnChk?.addEventListener('change', () => {
    clinicalState.atls.secondary.burnActive = burnChk.checked;
    if (burnFields) burnFields.style.display = burnChk.checked ? 'block' : 'none';
    saveCurrentCase();
    updateLivePreview();
  });

  bindAtlsInput('atlsBurnDegree', 'secondary.burnDegree');
  bindAtlsInput('atlsBurnTbsa', 'secondary.burnTbsa');
  bindAtlsInput('atlsBurnInhalation', 'secondary.burnInhalation');

  bindAtlsInput('atlsExamHeadFace', 'secondary.headFace');
  bindAtlsInput('atlsExamNeck', 'secondary.neck');
  bindAtlsInput('atlsExamChest', 'secondary.chest');
  bindAtlsInput('atlsExamAbdomenPelvis', 'secondary.abdomenPelvis');
  bindAtlsInput('atlsExamPerineumDre', 'secondary.perineumDre');
  bindAtlsInput('atlsExamExtremitiesNeuro', 'secondary.extremitiesNeuro');
  bindAtlsInput('atlsEfastDetail', 'secondary.efastDetail');
  bindAtlsInput('atlsImagingNote', 'secondary.imagingNote');
  bindAtlsInput('atlsStatLabsNote', 'secondary.statLabsNote');
  bindAtlsInput('atlsPlanCustomNote', 'secondary.planCustomNote');

  // ATLS Bottom Action Buttons
  document.getElementById('atlsBtnSaveToCase')?.addEventListener('click', () => {
    saveCurrentCase();
    saveCaseToShiftVault(clinicalState);
    showToast('پرونده ترومای اورژانس (ATLS) با موفقیت در شیفت ذخیره شد.', 'success');
  });

  document.getElementById('atlsBtnCopyNote')?.addEventListener('click', () => {
    const text = generateATLSNote(clinicalState.atls, clinicalState);
    navigator.clipboard.writeText(text).then(() => {
      showToast('متن کامل پرونده ترومای اورژانس (ATLS) کپی شد.', 'success');
    }).catch(() => {
      showToast('خطا در کپی متن.', 'warning');
    });
  });

  syncAtlsDomFromState();
}

/* ==========================================================================
   Mode 3: Multi-Day SOAP Progress Note Tracker & Upgraded SOAP Engine
   ========================================================================== */
function getActiveTargetCaseForSoap() {
  if (soapState.mode === 'linked' && soapState.linkedCaseId) {
    if (clinicalState && clinicalState.caseId === soapState.linkedCaseId) {
      return clinicalState;
    }
    const cases = getAllAvailableCases();
    const found = cases.find((c) => c.caseId === soapState.linkedCaseId);
    if (found) return found;
  }
  return clinicalState;
}

export function renderSoapDayTracker() {
  const container = document.getElementById('soapHistoryTabsContainer');
  if (!container) return;
  container.innerHTML = '';

  const targetCase = getActiveTargetCaseForSoap();
  const historyList = Array.isArray(targetCase?.soapHistory) && targetCase.soapHistory.length > 0
    ? targetCase.soapHistory
    : (Array.isArray(targetCase?.progressNotes) ? targetCase.progressNotes : []);

  // Update counter badges
  const countBadge = document.getElementById('soapHistoryCountBadge');
  if (countBadge) {
    const count = historyList.length || 1;
    countBadge.textContent = getCurrentLanguage() === 'en' ? `Documented Days: ${count}` : `تعداد نوت‌های ثبت‌شده: ${count}`;
  }

  const badge = document.getElementById('patientSoapNotesCountBadge');
  if (badge) badge.textContent = String(historyList.length);

  if (historyList.length === 0) {
    const currentChip = document.createElement('span');
    currentChip.className = 'soap-history-tab active';
    currentChip.textContent = `📄 ${getCurrentLanguage() === 'en' ? 'Active Day Note' : 'نوت فعال امروز'} (${soapState.dateStr || new Date().toLocaleDateString()} - HD#${soapState.context.hdNumber || 1})`;
    container.appendChild(currentChip);
    return;
  }

  historyList.forEach((entry, idx) => {
    const entryId = entry.dayId || entry.id || `day_${idx}`;
    const isActive = soapState.dayId === entryId;
    const hd = entry.hdNumber || entry.soapState?.context?.hdNumber || (idx + 1);
    const pod = entry.podNumber || entry.soapState?.context?.podNumber || '';
    const podType = entry.soapState?.context?.podType || 'POD';
    const dStr = entry.dateStr || entry.soapState?.dateStr || '';

    const tabWrap = document.createElement('div');
    tabWrap.className = 'soap-tab-pill-wrap';
    tabWrap.style.cssText = 'display:inline-flex; align-items:center; gap:2px; margin-inline-end:6px;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `soap-history-tab ${isActive ? 'active' : ''}`;
    btn.textContent = `📄 ${dStr} — HD#${hd}${pod ? ` / ${podType}#${pod}` : ''}`;
    btn.addEventListener('click', () => {
      if (entry.soapState) {
        soapState = JSON.parse(JSON.stringify(entry.soapState));
        soapState.dayId = entryId;
        syncSoapInputsFromState();
        renderSoapDayTracker();
        updateLivePreview();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'soap-tab-del-btn';
    delBtn.style.cssText = 'background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:2px 4px; border-radius:3px;';
    delBtn.title = getCurrentLanguage() === 'en' ? 'Delete this daily note' : 'حذف این نوت روزانه';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSoapDay(entryId);
    });

    tabWrap.appendChild(btn);
    tabWrap.appendChild(delBtn);
    container.appendChild(tabWrap);
  });
}

export function initFreshDayOneSoapNote() {
  const targetCase = getActiveTargetCaseForSoap() || clinicalState;
  const demo = targetCase.demographics || targetCase.admission || targetCase.context || {};
  const cc = targetCase.cc || {};

  soapState = createDefaultSoapState();
  soapState.dayId = `soap_day_${Date.now()}`;
  soapState.linkedCaseId = targetCase.caseId;
  soapState.mode = 'linked';
  soapState.dateStr = getCurrentLanguage() === 'en' ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('fa-IR');
  soapState.context = {
    fullName: demo.fullName || '',
    age: demo.age || '',
    gender: demo.gender || 'male',
    ward: demo.ward || '',
    bed: demo.bed || '',
    workingDiagnosis: cc.establishedDiagnosis || cc.patientQuote || cc.preliminaryDiagnosis || '',
    procedureDone: cc.plannedProcedure || '',
    hdNumber: '1',
    podNumber: '1',
    podType: 'POD'
  };
  soapState.objective.previousBaselineLabs = { ...(targetCase.paraclinics?.labs || {}) };
}

export function deleteSoapDay(dayId) {
  const lang = getCurrentLanguage();
  const isEn = lang === 'en';
  const confirmMsg = isEn
    ? 'Are you sure you want to delete this daily SOAP note? This action cannot be undone.'
    : 'آیا از حذف یادداشت پیگیری این روز اطمینان دارید؟ این عمل غیرقابل بازگشت است.';
  if (!confirm(confirmMsg)) return;

  const targetCase = getActiveTargetCaseForSoap();
  if (targetCase) {
    if (Array.isArray(targetCase.soapHistory)) {
      targetCase.soapHistory = targetCase.soapHistory.filter((item) => (item.dayId || item.id) !== dayId);
    }
    if (Array.isArray(targetCase.progressNotes)) {
      targetCase.progressNotes = targetCase.progressNotes.filter((item) => (item.dayId || item.id) !== dayId);
    }
  }

  if (Array.isArray(clinicalState.soapHistory)) {
    clinicalState.soapHistory = clinicalState.soapHistory.filter((item) => (item.dayId || item.id) !== dayId);
  }
  if (Array.isArray(clinicalState.progressNotes)) {
    clinicalState.progressNotes = clinicalState.progressNotes.filter((item) => (item.dayId || item.id) !== dayId);
  }

  const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
  const cInList = list.find((c) => c.caseId === (targetCase?.caseId || clinicalState.caseId));
  if (cInList) {
    if (Array.isArray(cInList.soapHistory)) {
      cInList.soapHistory = cInList.soapHistory.filter((item) => (item.dayId || item.id) !== dayId);
    }
    if (Array.isArray(cInList.progressNotes)) {
      cInList.progressNotes = cInList.progressNotes.filter((item) => (item.dayId || item.id) !== dayId);
    }
    localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list));
  }

  saveCurrentCase();

  const remaining = targetCase?.soapHistory || clinicalState.soapHistory || [];
  if (remaining.length > 0 && remaining[0].soapState) {
    soapState = JSON.parse(JSON.stringify(remaining[0].soapState));
    soapState.dayId = remaining[0].dayId || remaining[0].id || soapState.dayId;
  } else {
    initFreshDayOneSoapNote();
    saveSoapProgressNote(true);
  }

  syncSoapInputsFromState();
  renderSoapDayTracker();
  updateLivePreview();
  showToast(isEn ? 'Daily SOAP note deleted.' : 'یادداشت این روز با موفقیت حذف شد.', 'info');
}

function populateSoapPatientDropdown() {
  const select = document.getElementById('soapLinkedPatientSelect');
  if (!select) return;

  const cases = getAllAvailableCases();
  const lang = getCurrentLanguage();
  select.innerHTML = `<option value="">${lang === 'en' ? '-- Select from Shift Cases --' : '-- انتخاب از پرونده‌های شیفت --'}</option>`;

  cases.forEach((c) => {
    const demo = c.demographics || c.admission || c.context || {};
    const cc = c.cc || {};
    const name = demo.fullName ? `${demo.fullName} (${demo.age || '—'} ${lang === 'en' ? 'yo' : 'ساله'})` : (c.caseId || (lang === 'en' ? 'Unnamed Patient' : 'پرونده بدون شناسه'));
    const diag = cc.establishedDiagnosis || cc.patientQuote || cc.ccPhrase || (c.recordType === 'SOAP_PROGRESS' ? (c.context?.workingDiagnosis || (lang === 'en' ? 'Progress Note' : 'پراگرس روزانه')) : (lang === 'en' ? 'Admission' : 'جراحی'));

    const opt = document.createElement('option');
    opt.value = c.caseId;
    opt.textContent = `${name} — ${diag} [${c.caseId}]`;
    select.appendChild(opt);
  });

  if (soapState.linkedCaseId && cases.some((c) => c.caseId === soapState.linkedCaseId)) {
    select.value = soapState.linkedCaseId;
  }
}

function handleSoapPatientSelect(caseId) {
  if (!caseId) return;
  soapState.linkedCaseId = caseId;
  soapState.mode = 'linked';

  const cases = getAllAvailableCases();
  const selected = cases.find((c) => c.caseId === caseId);
  if (!selected) return;

  // If patient already has saved SOAP history, load the latest note or initialize from H&P
  const historyList = Array.isArray(selected.soapHistory) && selected.soapHistory.length > 0
    ? selected.soapHistory
    : (Array.isArray(selected.progressNotes) ? selected.progressNotes : []);

  if (historyList.length > 0 && historyList[0].soapState) {
    soapState = JSON.parse(JSON.stringify(historyList[0].soapState));
    soapState.linkedCaseId = caseId;
    soapState.mode = 'linked';
    soapState.dayId = historyList[0].dayId || historyList[0].id || soapState.dayId;
  } else {
    initFreshDayOneSoapNote();
    soapState.linkedCaseId = caseId;
    soapState.mode = 'linked';
  }

  syncSoapInputsFromState();
  renderSoapDayTracker();
  updateLivePreview();
}

function renderSoapCustomSymptoms() {
  const container = document.getElementById('soapCustomSymptomsList');
  if (!container) return;
  container.innerHTML = '';

  const list = soapState.subjective.customSymptoms || [];
  list.forEach((cs, idx) => {
    const item = document.createElement('div');
    item.className = 'soap-symptom-item';
    item.style.cssText = 'display:flex; flex-direction:column; gap:0.35rem;';
    const isPos = cs.status === 1;
    item.innerHTML = `
      <div class="soap-symptom-top-row" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
        <span class="sym-label">${cs.label}</span>
        <div class="bipolar-btn-group">
          <button type="button" class="bipolar-btn sym-custom-pos ${isPos ? 'active-pos' : ''}">+ بله</button>
          <button type="button" class="bipolar-btn sym-custom-neg ${!isPos ? 'active-neg' : ''}">− خیر</button>
          <button type="button" class="btn-delete-imaging sym-custom-del" title="حذف علامت">✕</button>
        </div>
      </div>
      <input type="text" class="input-text inline-detail-input sym-custom-det" placeholder="توضیحات تکمیلی «${cs.label}»..." value="${cs.detail || ''}" style="display:${isPos ? 'block' : 'none'}; font-size:0.8rem; padding:0.3rem 0.55rem;">
    `;

    item.querySelector('.sym-custom-pos')?.addEventListener('click', () => {
      cs.status = 1;
      renderSoapCustomSymptoms();
      updateLivePreview();
    });
    item.querySelector('.sym-custom-neg')?.addEventListener('click', () => {
      cs.status = -1;
      renderSoapCustomSymptoms();
      updateLivePreview();
    });
    item.querySelector('.sym-custom-det')?.addEventListener('input', (e) => {
      cs.detail = e.target.value;
      updateLivePreview();
    });
    item.querySelector('.sym-custom-del')?.addEventListener('click', () => {
      soapState.subjective.customSymptoms.splice(idx, 1);
      renderSoapCustomSymptoms();
      updateLivePreview();
    });

    container.appendChild(item);
  });
}

function syncSoapInputsFromState() {
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};
  const p = soapState.plan || {};

  if (!s.symptoms) {
    s.symptoms = {
      nausea_vomiting: -1,
      fever_chills: -1,
      cold_sweats: -1,
      dyspnea_cp: -1,
      dysuria_voiding: -1
    };
  }
  if (!s.symptomDetails) s.symptomDetails = {};
  if (!s.customSymptoms) s.customSymptoms = [];
  if (!o.io) {
    o.io = {
      intake24h: o.intake24h || '',
      urineOutput24h: o.urineOutput24h || '',
      ngtOutput24h: o.ngtOutput24h || '',
      urineStatus: 'دفع ادرار طبیعی و کافی (بدون فولی)'
    };
  }

  // Context fields
  const ptName = document.getElementById('soapPtName');
  if (ptName) ptName.value = ctx.fullName || '';
  const ptAge = document.getElementById('soapPtAge');
  if (ptAge) ptAge.value = ctx.age || '';
  const ptGender = document.getElementById('soapPtGender');
  if (ptGender) ptGender.value = ctx.gender || 'male';
  const ptWard = document.getElementById('soapPtWard');
  if (ptWard) ptWard.value = ctx.ward || '';
  const ptBed = document.getElementById('soapPtBed');
  if (ptBed) ptBed.value = ctx.bed || '';
  const ptDiag = document.getElementById('soapPtDiagnosis');
  if (ptDiag) ptDiag.value = ctx.workingDiagnosis || '';
  const ptProc = document.getElementById('soapPtProcedure');
  if (ptProc) ptProc.value = ctx.procedureDone || '';
  const ptHd = document.getElementById('soapPtHd');
  if (ptHd) ptHd.value = ctx.hdNumber || '1';
  const ptPodType = document.getElementById('soapPtPodType');
  if (ptPodType) ptPodType.value = ctx.podType || 'POD';
  const ptPod = document.getElementById('soapPtPod');
  if (ptPod) ptPod.value = ctx.podNumber || '1';

  // S — Subjective
  syncSoapChips('subjective.overallTrend', s.overallTrend);
  syncSoapChips('subjective.painStatus', s.painStatus);
  const painDetail = document.getElementById('soapPainDetail');
  if (painDetail) painDetail.value = s.painDetail || '';

  syncSoapChips('subjective.dietTolerance', s.dietTolerance);

  // Flatus / Bowel Movement bipolar
  const flatusPos = document.getElementById('soapFlatusPos');
  const flatusNeg = document.getElementById('soapFlatusNeg');
  if (flatusPos && flatusNeg) {
    flatusPos.classList.toggle('active-pos', s.flatus === 1);
    flatusNeg.classList.toggle('active-neg', s.flatus === -1);
  }
  const bmPos = document.getElementById('soapBmPos');
  const bmNeg = document.getElementById('soapBmNeg');
  if (bmPos && bmNeg) {
    bmPos.classList.toggle('active-pos', s.bowelMovement === 1);
    bmNeg.classList.toggle('active-neg', s.bowelMovement === -1);
  }
  const bowelDetail = document.getElementById('soapBowelDetail');
  if (bowelDetail) bowelDetail.value = s.bowelDetail || '';

  syncSoapChips('subjective.ambulation', s.ambulation);

  // Overnight symptoms + inline detail inputs
  document.querySelectorAll('.soap-symptom-item[data-sym-key]').forEach((item) => {
    const key = item.getAttribute('data-sym-key');
    const symObj = s.overnightSymptoms?.[key];
    const stateVal = s.symptoms?.[key] !== undefined
      ? s.symptoms[key]
      : (typeof symObj === 'object' ? symObj.state : (symObj !== undefined ? symObj : -1));
    const btnPos = item.querySelector('[data-sym-val="1"]');
    const btnNeg = item.querySelector('[data-sym-val="-1"]');
    const detInput = item.querySelector(`.inline-detail-input[data-sym-detail="${key}"]`);
    if (btnPos && btnNeg) {
      btnPos.classList.toggle('active-pos', stateVal === 1);
      btnNeg.classList.toggle('active-neg', stateVal === -1);
    }
    if (detInput) {
      detInput.value = s.symptomDetails?.[key] || (typeof symObj === 'object' ? (symObj.detail || '') : '');
      detInput.style.display = stateVal === 1 ? 'block' : 'none';
    }
  });

  renderSoapCustomSymptoms();

  const narrative = document.getElementById('soapNarrativeNote');
  if (narrative) narrative.value = s.narrativeNote || '';

  // O — Objective
  const v = o.vitals || {};
  if (document.getElementById('soapVitalBp')) document.getElementById('soapVitalBp').value = v.bp || '';
  if (document.getElementById('soapVitalPr')) document.getElementById('soapVitalPr').value = v.pr || '';
  if (document.getElementById('soapVitalRr')) document.getElementById('soapVitalRr').value = v.rr || '';
  if (document.getElementById('soapVitalTemp')) document.getElementById('soapVitalTemp').value = v.temp || '';
  if (document.getElementById('soapVitalTmax')) document.getElementById('soapVitalTmax').value = v.tmax || '';
  if (document.getElementById('soapVitalSpo2')) document.getElementById('soapVitalSpo2').value = v.spo2 || '';
  if (document.getElementById('soapVitalHemodynamics')) document.getElementById('soapVitalHemodynamics').value = v.hemodynamics || 'همودینامیک پایدار (Stable)';

  // Urine output quick pills
  const curUoStatus = o.io?.urineStatus || 'دفع ادرار طبیعی و کافی (بدون فولی)';
  document.querySelectorAll('#soapUrineOutputStatusBar .soap-uo-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.getAttribute('data-uo-status') === curUoStatus);
  });

  if (document.getElementById('soapIntake24h')) document.getElementById('soapIntake24h').value = o.io?.intake24h || o.intake24h || '';
  if (document.getElementById('soapUrineOutput24h')) document.getElementById('soapUrineOutput24h').value = o.io?.urineOutput24h || o.urineOutput24h || '';
  if (document.getElementById('soapNgtOutput24h')) document.getElementById('soapNgtOutput24h').value = o.io?.ngtOutput24h || o.ngtOutput24h || '';

  renderSoapDrains();

  if (document.getElementById('soapExamGeneralCardio')) document.getElementById('soapExamGeneralCardio').value = o.generalAndCardioPulm || '';
  if (document.getElementById('soapExamAbdomen')) document.getElementById('soapExamAbdomen').value = o.abdomenExam || '';
  if (document.getElementById('soapExamWound')) document.getElementById('soapExamWound').value = o.woundAndDressing || '';
  if (document.getElementById('soapExamExtremities')) document.getElementById('soapExamExtremities').value = o.extremitiesDvt || '';
  if (document.getElementById('soapExamNote')) document.getElementById('soapExamNote').value = o.examNote || '';

  // Labs
  document.querySelectorAll('.soap-lab-input').forEach((input) => {
    const labId = input.getAttribute('data-lab');
    input.value = o.labs?.[labId] || '';
  });
  updateSoapLabTrends();

  if (document.getElementById('soapNewParaclinicNote')) document.getElementById('soapNewParaclinicNote').value = o.newParaclinicNote || '';

  // A — Assessment
  syncSoapChips('assessment.clinicalStatus', a.clinicalStatus);
  const aSummary = document.getElementById('soapAssessmentSummary');
  if (aSummary) aSummary.value = a.summaryText || '';

  // P — Plan
  document.querySelectorAll('.soap-plan-pill').forEach((pill) => {
    const tag = pill.getAttribute('data-plan');
    pill.classList.toggle('active', (p.selectedTags || []).includes(tag));
  });
  const customPlan = document.getElementById('soapCustomPlanText');
  if (customPlan) customPlan.value = p.customPlanText || '';
}

function syncSoapChips(targetAttr, currentValue) {
  document.querySelectorAll(`[data-soap-target="${targetAttr}"] .soap-chip`).forEach((chip) => {
    const val = chip.getAttribute('data-val');
    chip.classList.toggle('active', val === currentValue);
  });
}

function renderSoapDrains() {
  const container = document.getElementById('soapDrainsList');
  if (!container) return;

  const drains = soapState.objective.drains || [];
  if (drains.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 0.25rem 0;">هیچ درن یا لوله‌ای اضافه نشده است.</div>';
    return;
  }

  container.innerHTML = drains.map((d, idx) => `
    <div class="drain-item-row" data-drain-id="${d.id}">
      <input type="text" class="input-text drain-type-site" placeholder="نوع و محل درن (مثلاً جکسون-پرات بستر کبد)" value="${d.typeAndSite || ''}" data-idx="${idx}" />
      <input type="number" class="input-text drain-vol dir-ltr" placeholder="حجم cc (مثلاً 50)" value="${d.volumeCc || ''}" data-idx="${idx}" />
      <select class="input-select drain-char" data-idx="${idx}">
        <option value="سروزی Serous" ${d.character === 'سروزی Serous' ? 'selected' : ''}>سروزی (Serous)</option>
        <option value="سروزانگوئینوس Serosanguinous" ${d.character === 'سروزانگوئینوس Serosanguinous' ? 'selected' : ''}>سروزانگوئینوس</option>
        <option value="هموراژیک/خونی Bloody" ${d.character === 'هموراژیک/خونی Bloody' ? 'selected' : ''}>هموراژیک/خونی</option>
        <option value="چرکی Purulent" ${d.character === 'چرکی Purulent' ? 'selected' : ''}>چرکی (Purulent)</option>
        <option value="صفراوی Bilious" ${d.character === 'صفراوی Bilious' ? 'selected' : ''}>صفراوی (Bilious)</option>
        <option value="شفاف بدون نشت هوا No Air Leak" ${d.character === 'شفاف بدون نشت هوا No Air Leak' ? 'selected' : ''}>چست‌تیوب - بدون نشت هوا</option>
        <option value="دارای نشت هوا Air Leak+" ${d.character === 'دارای نشت هوا Air Leak+' ? 'selected' : ''}>چست‌تیوب - نشت هوا (+)</option>
      </select>
      <button type="button" class="btn-remove-drain" title="حذف این درن" data-idx="${idx}">✕</button>
    </div>
  `).join('');

  container.querySelectorAll('.drain-type-site').forEach((el) => {
    el.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      if (soapState.objective.drains[idx]) {
        soapState.objective.drains[idx].typeAndSite = e.target.value;
        updateLivePreview();
      }
    });
  });

  container.querySelectorAll('.drain-vol').forEach((el) => {
    el.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      if (soapState.objective.drains[idx]) {
        soapState.objective.drains[idx].volumeCc = e.target.value;
        updateLivePreview();
      }
    });
  });

  container.querySelectorAll('.drain-char').forEach((el) => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      if (soapState.objective.drains[idx]) {
        soapState.objective.drains[idx].character = e.target.value;
        updateLivePreview();
      }
    });
  });

  container.querySelectorAll('.btn-remove-drain').forEach((el) => {
    el.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
      soapState.objective.drains.splice(idx, 1);
      renderSoapDrains();
      updateLivePreview();
    });
  });
}

function updateSoapLabTrends() {
  const prevLabs = soapState.objective.previousBaselineLabs || {};
  document.querySelectorAll('.soap-lab-card').forEach((card) => {
    const labId = card.getAttribute('data-lab');
    const trendSpan = card.querySelector('.soap-lab-trend');
    const input = card.querySelector('.soap-lab-input');
    if (!trendSpan || !input) return;

    const val = input.value.trim();
    const prevVal = prevLabs[labId];

    if (val && prevVal !== undefined && prevVal !== '' && String(prevVal) !== String(val)) {
      const nNow = parseFloat(val);
      const nPrev = parseFloat(prevVal);
      const isUp = !isNaN(nNow) && !isNaN(nPrev) && nNow > nPrev;
      const isDown = !isNaN(nNow) && !isNaN(nPrev) && nNow < nPrev;
      const arrow = isUp ? '↑' : isDown ? '↓' : '';

      trendSpan.textContent = `قبلی: ${prevVal} ${arrow}`;
      trendSpan.className = `soap-lab-trend trend-visible ${isUp ? 'up' : isDown ? 'down' : ''}`;
    } else {
      trendSpan.textContent = '';
      trendSpan.className = 'soap-lab-trend';
    }
  });
}

function autoGenerateAssessmentSentence() {
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};

  // 1. Patient Intro, HD#, POD#, Diagnosis & Procedure
  const genderWord = ctx.gender === 'female' ? 'خانم' : ctx.gender === 'male' ? 'آقای' : 'بیمار';
  const ageStr = ctx.age ? `${ctx.age} ساله` : '';
  const diagStr = normalizePersianClinicalText(ctx.workingDiagnosis || 'بستری در بخش جراحی');
  const procStr = ctx.procedureDone ? `، به دنبال عمل جراحی ${normalizePersianClinicalText(ctx.procedureDone)}` : '';
  const hdStr = ctx.hdNumber ? `روز ${ctx.hdNumber} بستری (HD #${ctx.hdNumber})` : '';
  const podStr = ctx.podNumber ? `روز ${ctx.podNumber} ${ctx.podType || 'POD'} (${ctx.podType || 'POD'} #${ctx.podNumber})` : '';
  const timeline = [hdStr, podStr].filter(Boolean).join(' و ');

  // 2. Hemodynamics & Fever status (Afebrile vs Tmax)
  const v = o.vitals || {};
  const hemoStr = v.hemodynamics || 'همودینامیک پایدار (Stable)';
  const tmaxNum = parseFloat(v.tmax || v.temp || '');
  const feverStr = !isNaN(tmaxNum)
    ? (tmaxNum >= 38.0 ? `تب‌دار (Tmax: ${v.tmax || v.temp}°C)` : `بدون تب (Afebrile, T: ${v.tmax || v.temp}°C)`)
    : 'بدون تب (Afebrile)';

  // 3. GI function (Diet tolerance, Flatus/BM), Urine Output, Drains & Wound
  const dietText = s.dietTolerance ? `از نظر گوارشی ${s.dietTolerance}` : 'رژیم غذایی را تحمل کرده';
  const giTokens = [];
  if (s.flatus === 1) giTokens.push('دفع گاز برقرار است (+)');
  else if (s.flatus === -1) giTokens.push('دفع گاز هنوز برقرار نشده (−)');
  if (s.bowelMovement === 1) giTokens.push('دفع مدفوع داشته است (+)');
  const giStr = `${dietText}${giTokens.length ? ` و ${giTokens.join('، ')}` : ''}`;

  const uoStr = o.io?.urineStatus || (o.urineOutput24h ? `برون‌ده ادراری ${o.urineOutput24h} cc` : 'دفع ادراری کافی');
  const drainSummary = Array.isArray(o.drains) && o.drains.length > 0
    ? `درن جراحی دارای ${o.drains.map((d) => `${d.volumeCc || '—'}cc ترشح ${d.character || 'سروزی'}`).join(' و ')} بوده`
    : '';
  const woundStr = o.woundAndDressing ? normalizePersianClinicalText(o.woundAndDressing) : 'پانسمان تمیز و خشک (CDI) است';

  // 4. Key Lab Trends Today & Overall Trajectory
  const prevLabs = o.previousBaselineLabs || {};
  const labAlerts = [];
  Object.entries(o.labs || {}).forEach(([k, val]) => {
    if (val !== undefined && val !== '') {
      const prev = prevLabs[k];
      if (prev !== undefined && prev !== '' && String(prev) !== String(val)) {
        const nNow = parseFloat(val);
        const nPrev = parseFloat(prev);
        const dir = !isNaN(nNow) && !isNaN(nPrev) ? (nNow > nPrev ? 'افزایش' : 'کاهش') : 'تغییر';
        labAlerts.push(`${k.toUpperCase()}: ${val} (${dir} نسبت به ${prev})`);
      } else {
        labAlerts.push(`${k.toUpperCase()}: ${val}`);
      }
    }
  });
  const labSentence = labAlerts.length > 0 ? ` در بررسی آزمایشگاهی امروز ${labAlerts.join(' ، ')} مشاهده می‌شود.` : '';

  const sentence = `بیمار ${genderWord} ${ageStr} در ${timeline || 'سیر بستری بخش جراحی'} با تشخیص ${diagStr}${procStr}؛ در حال حاضر از نظر علائم حیاتی ${hemoStr} و ${feverStr} می‌باشد. ${giStr}، وضعیت ادراری به صورت «${uoStr}» است، ${drainSummary ? `${drainSummary} و ` : ''}در معاینه موضع عمل ${woundStr}.${labSentence} در مجموع بیمار در «${a.clinicalStatus || 'سیر بهبودی مناسب و پایدار'}» ارزیابی می‌گردد.`;

  soapState.assessment.summaryText = sentence;
  const area = document.getElementById('soapAssessmentSummary');
  if (area) area.value = sentence;
  updateLivePreview();
  showToast('سنتز جامع بالینی (Assessment) با موفقیت تولید شد.', 'success');
}

function initSoapEngine() {
  // 0. Multi-Day Tracker: Create New Day Progress Note Button
  document.getElementById('btnNewSoapDay')?.addEventListener('click', () => {
    // Save current note into patient's soapHistory first
    saveSoapProgressNote(true);

    const prevContext = { ...soapState.context };
    const nextHd = String((parseInt(prevContext.hdNumber, 10) || 1) + 1);
    const nextPod = String((parseInt(prevContext.podNumber, 10) || 1) + 1);
    const yesterdayLabs = { ...(soapState.objective.previousBaselineLabs || {}), ...(soapState.objective.labs || {}) };
    const prevDrains = (soapState.objective.drains || []).map((d) => ({ ...d, volumeCc: '' }));
    const prevLinkedId = soapState.linkedCaseId;
    const prevMode = soapState.mode;

    soapState = createDefaultSoapState();
    soapState.dayId = `soap_day_${Date.now()}`;
    soapState.linkedCaseId = prevLinkedId;
    soapState.mode = prevMode;
    soapState.dateStr = getCurrentLanguage() === 'en' ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('fa-IR');
    soapState.context = {
      ...prevContext,
      hdNumber: nextHd,
      podNumber: nextPod
    };
    soapState.objective.previousBaselineLabs = yesterdayLabs;
    soapState.objective.drains = prevDrains;

    saveSoapProgressNote(true);
    syncSoapInputsFromState();
    renderSoapDayTracker();
    updateLivePreview();
    const isEn = getCurrentLanguage() === 'en';
    showToast(
      isEn
        ? `New Day note created (HD #${nextHd} / ${prevContext.podType || 'POD'} #${nextPod}). Previous labs transferred to baseline.`
        : `پراگرس نوت روز جدید (HD #${nextHd} / ${prevContext.podType || 'POD'} #${nextPod}) ایجاد شد و آزمایش‌های قبلی به عنوان پایه مقایسه ثبت گردید.`,
      'success'
    );
  });

  // 0.1 Delete Current Day Progress Note
  document.getElementById('soapBtnDeleteCurrentDay')?.addEventListener('click', () => {
    if (soapState.dayId) {
      deleteSoapDay(soapState.dayId);
    }
  });

  // 1. Patient Mode Switcher (Linked vs Standalone)
  const linkedRadio = document.getElementById('soapModeLinkedRadio');
  const standaloneRadio = document.getElementById('soapModeStandaloneRadio');
  const linkedWrapper = document.getElementById('soapLinkedSelectWrapper');
  const patientSelect = document.getElementById('soapLinkedPatientSelect');

  linkedRadio?.addEventListener('change', () => {
    if (linkedRadio.checked) {
      soapState.mode = 'linked';
      if (linkedWrapper) linkedWrapper.style.display = 'flex';
      if (patientSelect && patientSelect.value) {
        handleSoapPatientSelect(patientSelect.value);
      }
    }
  });

  standaloneRadio?.addEventListener('change', () => {
    if (standaloneRadio.checked) {
      soapState.mode = 'standalone';
      soapState.linkedCaseId = null;
      if (linkedWrapper) linkedWrapper.style.display = 'none';
      renderSoapDayTracker();
      updateLivePreview();
    }
  });

  patientSelect?.addEventListener('change', (e) => {
    handleSoapPatientSelect(e.target.value);
  });

  // Context Fields Listeners
  const bindContextInput = (id, field) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', (e) => {
      soapState.context[field] = e.target.value;
      renderSoapDayTracker();
      updateLivePreview();
    });
  };
  bindContextInput('soapPtName', 'fullName');
  bindContextInput('soapPtAge', 'age');
  bindContextInput('soapPtWard', 'ward');
  bindContextInput('soapPtBed', 'bed');
  bindContextInput('soapPtDiagnosis', 'workingDiagnosis');
  bindContextInput('soapPtProcedure', 'procedureDone');
  bindContextInput('soapPtHd', 'hdNumber');
  bindContextInput('soapPtPod', 'podNumber');

  document.getElementById('soapPtGender')?.addEventListener('change', (e) => {
    soapState.context.gender = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapPtPodType')?.addEventListener('change', (e) => {
    soapState.context.podType = e.target.value;
    renderSoapDayTracker();
    updateLivePreview();
  });

  // 2. Subjective Listeners
  document.querySelectorAll('#soapModeContainer .soap-chip[data-val]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const parentGroup = chip.closest('.soap-chip-group');
      if (!parentGroup) return;
      const target = parentGroup.getAttribute('data-soap-target');
      if (!target) return;

      parentGroup.querySelectorAll('.soap-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const val = chip.getAttribute('data-val');
      if (target === 'subjective.overallTrend') soapState.subjective.overallTrend = val;
      if (target === 'subjective.painStatus') soapState.subjective.painStatus = val;
      if (target === 'subjective.dietTolerance') soapState.subjective.dietTolerance = val;
      if (target === 'subjective.ambulation') soapState.subjective.ambulation = val;
      if (target === 'assessment.clinicalStatus') soapState.assessment.clinicalStatus = val;

      updateLivePreview();
    });
  });

  document.getElementById('soapPainDetail')?.addEventListener('input', (e) => {
    soapState.subjective.painDetail = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapBowelDetail')?.addEventListener('input', (e) => {
    soapState.subjective.bowelDetail = e.target.value;
    updateLivePreview();
  });

  // Flatus and BM bipolar
  document.getElementById('soapFlatusPos')?.addEventListener('click', () => {
    soapState.subjective.flatus = 1;
    document.getElementById('soapFlatusPos')?.classList.add('active-pos');
    document.getElementById('soapFlatusNeg')?.classList.remove('active-neg');
    updateLivePreview();
  });
  document.getElementById('soapFlatusNeg')?.addEventListener('click', () => {
    soapState.subjective.flatus = -1;
    document.getElementById('soapFlatusPos')?.classList.remove('active-pos');
    document.getElementById('soapFlatusNeg')?.classList.add('active-neg');
    updateLivePreview();
  });

  document.getElementById('soapBmPos')?.addEventListener('click', () => {
    soapState.subjective.bowelMovement = 1;
    document.getElementById('soapBmPos')?.classList.add('active-pos');
    document.getElementById('soapBmNeg')?.classList.remove('active-neg');
    updateLivePreview();
  });
  document.getElementById('soapBmNeg')?.addEventListener('click', () => {
    soapState.subjective.bowelMovement = -1;
    document.getElementById('soapBmPos')?.classList.remove('active-pos');
    document.getElementById('soapBmNeg')?.classList.add('active-neg');
    updateLivePreview();
  });

  // Overnight symptoms bipolar + inline detail input
  document.querySelectorAll('.soap-symptom-item[data-sym-key]').forEach((item) => {
    const key = item.getAttribute('data-sym-key');
    const lbl = item.getAttribute('data-label') || key;
    const btnPos = item.querySelector('[data-sym-val="1"]');
    const btnNeg = item.querySelector('[data-sym-val="-1"]');
    const detInput = item.querySelector(`.inline-detail-input[data-sym-detail="${key}"]`);

    btnPos?.addEventListener('click', () => {
      if (!soapState.subjective.symptoms) soapState.subjective.symptoms = {};
      if (!soapState.subjective.symptomDetails) soapState.subjective.symptomDetails = {};
      soapState.subjective.symptoms[key] = 1;
      soapState.subjective.overnightSymptoms[key] = {
        state: 1,
        label: lbl,
        detail: soapState.subjective.symptomDetails[key] || ''
      };
      btnPos.classList.add('active-pos');
      btnNeg?.classList.remove('active-neg');
      if (detInput) {
        detInput.style.display = 'block';
        detInput.focus();
      }
      updateLivePreview();
    });

    btnNeg?.addEventListener('click', () => {
      if (!soapState.subjective.symptoms) soapState.subjective.symptoms = {};
      soapState.subjective.symptoms[key] = -1;
      soapState.subjective.overnightSymptoms[key] = { state: -1, label: lbl, detail: '' };
      btnNeg.classList.add('active-neg');
      btnPos?.classList.remove('active-pos');
      if (detInput) detInput.style.display = 'none';
      updateLivePreview();
    });

    detInput?.addEventListener('input', (e) => {
      if (!soapState.subjective.symptomDetails) soapState.subjective.symptomDetails = {};
      soapState.subjective.symptomDetails[key] = e.target.value;
      if (soapState.subjective.overnightSymptoms[key]) {
        soapState.subjective.overnightSymptoms[key].detail = e.target.value;
      }
      updateLivePreview();
    });
  });

  // Subjective Fuzzy Symptom Search Box
  const symSearchInput = document.getElementById('soapSymptomSearchInput');
  const symSearchTray = document.getElementById('soapSymptomSearchTray');
  if (symSearchInput && symSearchTray) {
    symSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (!q) {
        symSearchTray.style.display = 'none';
        symSearchTray.innerHTML = '';
        return;
      }
      const matches = smartClinicalSearch(q, ALL_MASTER_SYMPTOMS, ['label', 'en', 'keywords'], 10);
      symSearchTray.innerHTML = '';
      if (matches.length === 0) {
        const customBtn = document.createElement('button');
        customBtn.type = 'button';
        customBtn.className = 'toggle-chip';
        customBtn.innerHTML = `<span>➕</span> <span>افزودن علامت «${q}»</span>`;
        customBtn.addEventListener('click', () => {
          if (!soapState.subjective.customSymptoms) soapState.subjective.customSymptoms = [];
          soapState.subjective.customSymptoms.push({ id: 'cs_' + Date.now(), label: q, status: 1, detail: '' });
          symSearchInput.value = '';
          symSearchTray.style.display = 'none';
          renderSoapCustomSymptoms();
          updateLivePreview();
        });
        symSearchTray.appendChild(customBtn);
      } else {
        matches.forEach((m) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'toggle-chip';
          btn.innerHTML = `<span>➕</span> <span>${m.label}</span>`;
          btn.addEventListener('click', () => {
            if (!soapState.subjective.customSymptoms) soapState.subjective.customSymptoms = [];
            const exists = soapState.subjective.customSymptoms.some((c) => c.id === m.id || c.label === m.label);
            if (!exists) {
              soapState.subjective.customSymptoms.push({ id: m.id, label: m.label, status: 1, detail: '' });
            }
            symSearchInput.value = '';
            symSearchTray.style.display = 'none';
            renderSoapCustomSymptoms();
            updateLivePreview();
          });
          symSearchTray.appendChild(btn);
        });
      }
      symSearchTray.style.display = 'flex';
    });
  }

  document.getElementById('soapNarrativeNote')?.addEventListener('input', (e) => {
    soapState.subjective.narrativeNote = e.target.value;
    updateLivePreview();
  });

  // 3. Objective Listeners
  const bindVital = (id, prop) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      soapState.objective.vitals[prop] = e.target.value;
      updateLivePreview();
    });
  };
  bindVital('soapVitalBp', 'bp');
  bindVital('soapVitalPr', 'pr');
  bindVital('soapVitalRr', 'rr');
  bindVital('soapVitalTemp', 'temp');
  bindVital('soapVitalTmax', 'tmax');
  bindVital('soapVitalSpo2', 'spo2');

  document.getElementById('soapVitalHemodynamics')?.addEventListener('change', (e) => {
    soapState.objective.vitals.hemodynamics = e.target.value;
    updateLivePreview();
  });

  // Urine Output Quick Status Pills
  document.querySelectorAll('#soapUrineOutputStatusBar .soap-uo-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#soapUrineOutputStatusBar .soap-uo-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      if (!soapState.objective.io) soapState.objective.io = {};
      soapState.objective.io.urineStatus = pill.getAttribute('data-uo-status');
      updateLivePreview();
    });
  });

  document.getElementById('soapIntake24h')?.addEventListener('input', (e) => {
    soapState.objective.intake24h = e.target.value;
    if (!soapState.objective.io) soapState.objective.io = {};
    soapState.objective.io.intake24h = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapUrineOutput24h')?.addEventListener('input', (e) => {
    soapState.objective.urineOutput24h = e.target.value;
    if (!soapState.objective.io) soapState.objective.io = {};
    soapState.objective.io.urineOutput24h = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapNgtOutput24h')?.addEventListener('input', (e) => {
    soapState.objective.ngtOutput24h = e.target.value;
    if (!soapState.objective.io) soapState.objective.io = {};
    soapState.objective.io.ngtOutput24h = e.target.value;
    updateLivePreview();
  });

  // Drains
  document.getElementById('soapBtnAddDrain')?.addEventListener('click', () => {
    soapState.objective.drains.push({
      id: `drain_${Date.now()}`,
      typeAndSite: 'جکسون-پرات بستر عمل (JP)',
      volumeCc: '50',
      character: 'سروزی Serous'
    });
    renderSoapDrains();
    updateLivePreview();
  });

  // Focused Exam Preset
  document.getElementById('soapBtnPresetNormalExam')?.addEventListener('click', () => {
    soapState.objective.generalAndCardioPulm = 'بیمار هوشیار (GCS=15)، سمع ریه‌ها دوطرفه شفاف، سمع قلب نرمال بدون سوفل.';
    soapState.objective.abdomenExam = 'شکم نرم و بدون دیستانسیون، تندرنس خفیف محدود به برش جراحی، صداهای روده‌ای نرمال برقرار (BS+).';
    soapState.objective.woundAndDressing = 'پانسمان تمیز و خشک (CDI)، بدون ترشح یا اریتم جدار.';
    soapState.objective.extremitiesDvt = 'اندام‌ها گرم، نبض‌ها قرینه، بدون ادم یا تندرنس ساق (DVT منفی).';

    if (document.getElementById('soapExamGeneralCardio')) document.getElementById('soapExamGeneralCardio').value = soapState.objective.generalAndCardioPulm;
    if (document.getElementById('soapExamAbdomen')) document.getElementById('soapExamAbdomen').value = soapState.objective.abdomenExam;
    if (document.getElementById('soapExamWound')) document.getElementById('soapExamWound').value = soapState.objective.woundAndDressing;
    if (document.getElementById('soapExamExtremities')) document.getElementById('soapExamExtremities').value = soapState.objective.extremitiesDvt;

    updateLivePreview();
    showToast('معاینه عمومی، قلب، ریه و شکم به صورت نرمال پایدار تنظیم شد.', 'info');
  });

  // Wound presets
  document.querySelectorAll('.soap-mini-preset').forEach((preset) => {
    preset.addEventListener('click', () => {
      document.querySelectorAll('.soap-mini-preset').forEach((p) => p.classList.remove('active'));
      preset.classList.add('active');
      const text = preset.getAttribute('data-text');
      soapState.objective.woundAndDressing = text;
      const woundInput = document.getElementById('soapExamWound');
      if (woundInput) woundInput.value = text;
      updateLivePreview();
    });
  });

  document.getElementById('soapExamGeneralCardio')?.addEventListener('input', (e) => {
    soapState.objective.generalAndCardioPulm = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapExamAbdomen')?.addEventListener('input', (e) => {
    soapState.objective.abdomenExam = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapExamWound')?.addEventListener('input', (e) => {
    soapState.objective.woundAndDressing = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapExamExtremities')?.addEventListener('input', (e) => {
    soapState.objective.extremitiesDvt = e.target.value;
    updateLivePreview();
  });
  document.getElementById('soapExamNote')?.addEventListener('input', (e) => {
    soapState.objective.examNote = e.target.value;
    updateLivePreview();
  });

  // Labs Inputs
  document.querySelectorAll('.soap-lab-input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const labId = e.target.getAttribute('data-lab');
      soapState.objective.labs[labId] = e.target.value;
      updateSoapLabTrends();
      updateLivePreview();
    });
  });

  document.getElementById('soapNewParaclinicNote')?.addEventListener('input', (e) => {
    soapState.objective.newParaclinicNote = e.target.value;
    updateLivePreview();
  });

  // 4. Assessment Listeners
  document.getElementById('soapBtnAutoAssessment')?.addEventListener('click', autoGenerateAssessmentSentence);
  document.getElementById('soapAssessmentSummary')?.addEventListener('input', (e) => {
    soapState.assessment.summaryText = e.target.value;
    updateLivePreview();
  });

  // 5. Plan Checklist Pills
  document.querySelectorAll('#soapModeContainer .soap-plan-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const planTag = pill.getAttribute('data-plan');
      pill.classList.toggle('active');
      if (pill.classList.contains('active')) {
        if (!soapState.plan.selectedTags.includes(planTag)) {
          soapState.plan.selectedTags.push(planTag);
        }
      } else {
        soapState.plan.selectedTags = soapState.plan.selectedTags.filter((t) => t !== planTag);
      }
      updateLivePreview();
    });
  });

  document.getElementById('soapAbxDetailInput')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      const tagText = `آنتی‌بیوتیک: ${val}`;
      const existingIdx = soapState.plan.selectedTags.findIndex((t) => t.startsWith('آنتی‌بیوتیک:'));
      if (existingIdx !== -1) {
        soapState.plan.selectedTags[existingIdx] = tagText;
      } else {
        soapState.plan.selectedTags.push(tagText);
      }
    }
    updateLivePreview();
  });

  document.getElementById('soapCustomPlanText')?.addEventListener('input', (e) => {
    soapState.plan.customPlanText = e.target.value;
    updateLivePreview();
  });

  // 6. Action Toolbar Listeners
  document.getElementById('soapBtnSaveCase')?.addEventListener('click', () => {
    saveSoapProgressNote(false);
  });

  document.getElementById('soapBtnCopy')?.addEventListener('click', () => {
    const text = generateSOAPProgressNote(soapState, getLinkedOrCurrentCase());
    navigator.clipboard.writeText(text).then(() => {
      showToast('متن یادداشت SOAP با موفقیت کپی شد.', 'success');
    }).catch(() => {
      showToast('خطا در کپی متن.', 'warning');
    });
  });

  document.getElementById('soapBtnCloudSync')?.addEventListener('click', async () => {
    const btnSync = document.getElementById('soapBtnCloudSync');
    if (!btnSync) return;
    btnSync.disabled = true;
    btnSync.innerHTML = '<span>⏳</span><span>در حال ارسال...</span>';

    const note = generateSOAPProgressNote(soapState, getLinkedOrCurrentCase());
    const meta = {
      caseId: soapState.context?.caseId || `SOAP-${Date.now()}`,
      schemaVersion: 'v1.1-ATLS-MultiSOAP',
      metrics: {
        positiveFindingsCount: 0,
        negativeFindingsCount: 0,
        labsRecordedCount: Object.keys(soapState.objective?.labs || {}).length
      }
    };

    try {
      const res = await gsheetSync.sendCase(soapState, note, meta);
      if (res.success) {
        showToast(res.message, 'success');
      } else if (res.queued) {
        showToast(res.message, 'warning');
      } else {
        showToast(res.message, 'warning');
      }
    } catch (err) {
      showToast('خطا در ارسال به Google Sheets.', 'warning');
    } finally {
      btnSync.disabled = false;
      btnSync.innerHTML = '<span>📊</span><span>ثبت SOAP در Google Sheets</span>';
    }
  });

  document.getElementById('soapBtnReset')?.addEventListener('click', () => {
    if (confirm('آیا از بازنشانی و پاکسازی فرم پراگرس نوت اطمینان دارید؟')) {
      const prevLinkedId = soapState.linkedCaseId;
      const prevMode = soapState.mode;
      soapState = createDefaultSoapState();
      soapState.linkedCaseId = prevLinkedId;
      soapState.mode = prevMode;
      if (prevMode === 'linked' && prevLinkedId) {
        handleSoapPatientSelect(prevLinkedId);
      } else {
        syncSoapInputsFromState();
        renderSoapDayTracker();
        updateLivePreview();
      }
      showToast('فرم پراگرس نوت بازنشانی شد.', 'info');
    }
  });
}

let isSavingSoap = false;
let soapAutoSaveTimer = null;

export function scheduleDebouncedSoapAutoSave() {
  if (soapAutoSaveTimer) {
    clearTimeout(soapAutoSaveTimer);
  }
  soapAutoSaveTimer = setTimeout(() => {
    saveSoapProgressNote(true);
  }, 400);
}

export function syncActiveSoapDayToHistory() {
  const curDayId = soapState.dayId;
  if (!curDayId) return;
  const targetCase = getActiveTargetCaseForSoap() || clinicalState;
  const noteMarkdown = generateSOAPProgressNote(soapState, targetCase);

  const updateArr = (arr) => {
    if (!Array.isArray(arr)) return;
    const idx = arr.findIndex((item) => (item.dayId || item.id) === curDayId);
    if (idx >= 0) {
      arr[idx].soapState = JSON.parse(JSON.stringify(soapState));
      arr[idx].noteMarkdown = noteMarkdown;
      arr[idx].hdNumber = soapState.context?.hdNumber || '1';
      arr[idx].podNumber = soapState.context?.podNumber || '1';
      arr[idx].dateStr = soapState.dateStr || arr[idx].dateStr;
    }
  };

  if (targetCase) {
    updateArr(targetCase.soapHistory);
    updateArr(targetCase.progressNotes);
  }
  if (clinicalState && clinicalState !== targetCase) {
    updateArr(clinicalState.soapHistory);
    updateArr(clinicalState.progressNotes);
  }
}

export function saveSoapProgressNote(silent = false) {
  if (isSavingSoap) return;
  isSavingSoap = true;

  try {
    const linkedCase = getLinkedOrCurrentCase();
    const noteMarkdown = generateSOAPProgressNote(soapState, linkedCase);
    const nowIso = new Date().toISOString();
    const curDayId = soapState.dayId || `soap_day_${Date.now()}`;
    soapState.dayId = curDayId;

    const progressRecord = {
      id: curDayId,
      dayId: curDayId,
      createdAt: nowIso,
      dateStr: soapState.dateStr || (getCurrentLanguage() === 'en' ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('fa-IR')),
      hdNumber: soapState.context?.hdNumber || '1',
      podNumber: soapState.context?.podNumber || '1',
      noteMarkdown: noteMarkdown,
      soapState: JSON.parse(JSON.stringify(soapState))
    };

    const upsertIntoHistoryArray = (arr) => {
      const existingIdx = arr.findIndex((item) => (item.dayId || item.id) === curDayId);
      if (existingIdx >= 0) {
        arr[existingIdx] = progressRecord;
      } else {
        arr.unshift(progressRecord);
      }
      // Deduplicate history array by dayId/id to heal any bloat
      const seenDays = new Set();
      const deduped = [];
      arr.forEach((h) => {
        const key = h.dayId || h.id;
        if (key && !seenDays.has(key)) {
          seenDays.add(key);
          deduped.push(h);
        }
      });
      arr.length = 0;
      deduped.forEach((h) => arr.push(h));
    };

    const rawList = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    const list = [];
    const seenCases = new Set();
    if (Array.isArray(rawList)) {
      rawList.forEach((c) => {
        if (c && c.caseId && !seenCases.has(c.caseId)) {
          seenCases.add(c.caseId);
          list.push(c);
        }
      });
    }

    if (soapState.mode === 'linked' && soapState.linkedCaseId) {
      const targetCase = list.find((c) => c.caseId === soapState.linkedCaseId);
      if (clinicalState.caseId === soapState.linkedCaseId) {
        clinicalState.soapHistory = Array.isArray(clinicalState.soapHistory) ? clinicalState.soapHistory : [];
        clinicalState.progressNotes = Array.isArray(clinicalState.progressNotes) ? clinicalState.progressNotes : [];
        upsertIntoHistoryArray(clinicalState.soapHistory);
        upsertIntoHistoryArray(clinicalState.progressNotes);
        saveCurrentCase();
      }
      if (targetCase) {
        targetCase.soapHistory = Array.isArray(targetCase.soapHistory) ? targetCase.soapHistory : [];
        targetCase.progressNotes = Array.isArray(targetCase.progressNotes) ? targetCase.progressNotes : [];
        upsertIntoHistoryArray(targetCase.soapHistory);
        upsertIntoHistoryArray(targetCase.progressNotes);
      } else if (clinicalState.caseId === soapState.linkedCaseId) {
        list.unshift(JSON.parse(JSON.stringify(clinicalState)));
      }
      localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list.slice(0, 50)));
      if (!silent) {
        showToast(getCurrentLanguage() === 'en' ? 'SOAP note saved to patient timeline.' : 'یادداشت SOAP با موفقیت در تایم‌لاین چندروزه پرونده بیمار ذخیره شد.', 'success');
      }
    } else {
      const newCaseId = `SURG-SOAP-${Date.now().toString(36).toUpperCase()}`;
      const standaloneCase = {
        caseId: newCaseId,
        createdAt: nowIso,
        timestamp: nowIso,
        recordType: 'SOAP_PROGRESS',
        demographics: {
          fullName: soapState.context?.fullName,
          age: soapState.context?.age,
          gender: soapState.context?.gender,
          ward: soapState.context?.ward,
          bed: soapState.context?.bed
        },
        cc: {
          establishedDiagnosis: soapState.context?.workingDiagnosis,
          procedureDone: soapState.context?.procedureDone
        },
        paraclinics: {
          labs: { ...(soapState.objective?.labs || {}) }
        },
        context: { ...soapState.context },
        soapHistory: [progressRecord],
        progressNotes: [progressRecord]
      };
      list.unshift(standaloneCase);
      localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list.slice(0, 50)));
      soapState.linkedCaseId = newCaseId;
      soapState.mode = 'linked';
      if (!silent) {
        showToast(getCurrentLanguage() === 'en' ? 'New standalone patient SOAP note saved.' : 'پرونده و یادداشت SOAP بیمار جدید با موفقیت در سیستم ذخیره شد.', 'success');
      }
      populateSoapPatientDropdown();
    }

    updateShiftCasesCount();
    renderSoapDayTracker();
  } catch (err) {
    console.error('Failed to save SOAP note:', err);
    if (!silent) {
      showToast(getCurrentLanguage() === 'en' ? 'Error saving SOAP note.' : 'خطا در ذخیره یادداشت SOAP در حافظه محلی.', 'warning');
    }
  } finally {
    isSavingSoap = false;
  }
}

export async function initApp() {
  try {
    initAdmissionPathwayHandlers();
    initDemographicsHandlers();
    initAddPainEpisodeHandler();
    initPshHandlers();
    initObGynHandlers();
    initAddCustomDrugHandler();
    initAhShFhHandlers();
    initRosMasterNegativeHandler();
    initPeVitalsHandlers();
    initPeMasterNegativeHandler();
    initMassExamHandlers();
    initAtlsExamHandlers();
    initSchemaOmnisearch();
    initReasoningHandlers();
    initSystemGapLoggers();
    initNavigationTabs();
    initExportAndCopy();
    initAppSettings();
    initShiftManager();
    initHeaderCaseSwitcher();
    initCloudSyncUI();
    initThemeToggle();
    initMobileBottomSheet();
    initAppModeSwitcher();
    initAtlsModeEngine();
    initSoapEngine();

    await loadSavedState();
    syncDomFromState();
    updateLivePreview();
    updateShiftCasesCount();
    console.log('[Surg-Scribe v1.1-ATLS-MultiSOAP] Application initialized successfully.');
  } catch (err) {
    console.error('[Surg-Scribe] Error during initApp:', err ? (err.message + '\n' + err.stack) : 'unknown error');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('surg:language-changed', (e) => {
    const lang = e.detail?.lang || getCurrentLanguage();
    renderArchetypeSelectorBar();
    renderHpiPresentations();
    renderHpiBasicSymptoms();
    renderHpiUnlockableModules();
    renderPmhCategories();
    renderDhCategories();
    renderRosGroups();
    renderPeMandatoryPillars();
    renderMassExamModule();
    renderAtlsExamModule();
    renderParaclinicModalityCards();
    renderPainEpisodes();
    renderSoapDayTracker();
    updateHeaderActivePatientBadge();
    updateLivePreview();
    applyI18nToDOM(lang);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => {
        m.classList.remove('open');
        m.style.display = 'none';
      });
    }
  });

  // Reliable bootstrapper: if document is already parsed, run immediately; otherwise wait for event
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      initApp();
    });
  } else {
    initApp();
  }
}


