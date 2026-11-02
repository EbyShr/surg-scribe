import { getIconSvg, injectDomIcons, ICONS } from './icons.js';
import {
  storageVault,
  PERMANENT_CASES_KEY,
  PERMANENT_ACTIVE_DRAFT_KEY,
  PERMANENT_ACTIVE_TAB_KEY
} from './storage-vault.js';
import {
  smartClinicalSearch
} from './fuzzy-search.js';
import {
  HPI_QUALIFIERS_AND_SYMPTOMS,
  HPI_ASSOCIATED_SYMPTOMS,
  MASTER_ROS_BANK,
  MASTER_PE_BANK,
  getItemDisplayTitle,
  PE_SUBGROUP_TITLES,
  PE_SYSTEMS_CONFIG,
  SURGICAL_SCHEMA,
  LAB_PANELS,
  SURGICAL_LAB_PANELS,
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
  RADIATION_SITES_V2,
  formatRadiationItem,
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
  MASTER_PSH_SURGERIES_BANK,
  PSH_SURGICAL_PROCEDURES_BANK,
  FH_CANCER_HEREDITARY_DATABASE,
  EXTENDED_LAB_DATABASE,
  MASTER_ALL_LAB_TESTS,
  PE_COMPREHENSIVE_SYSTEMS,
  inferPmhCatId
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
import { GoogleSheetsSyncEngine, deepStripPIIForCloud } from './google-sync.js';
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

// Phase 3 Subsystem Accordions & State Registries
if (typeof window !== 'undefined') {
  window._rosExpandedMap = window._rosExpandedMap || new Set();
  window._peExpandedMap = window._peExpandedMap || new Set();
  window._labExpandedMap = window._labExpandedMap || new Set();
  window._rosShowAllMap = window._rosShowAllMap || new Set();
  window._peShowAllMap = window._peShowAllMap || new Set();
  window._labShowAllMap = window._labShowAllMap || new Set();
  window._activeLabTests = window._activeLabTests || new Set();
  window._rosBreastEnabledForMale = window._rosBreastEnabledForMale || false;
}

function generateCaseId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SURG-${year}${month}${day}-${rand}`;
}

export function createDefaultPainEpisode(id = 1, title = '') {
  const uid = typeof id === 'string' && id.startsWith('pain_') ? id : ('pain_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
  return {
    id,
    uid,
    title: title || (typeof id === 'number' ? `کانون درد #${id}` : 'کانون درد'),
    archetype: 'pain_archetype',
    bodyRegion: '',          // پیش‌فرض خالی باشد تا کاربر خودش انتخاب کند
    bodyRegionGroup: '',     // پیش‌فرض خالی
    spatialPattern: '',      // پیش‌فرض خالی
    selectedRegions: [],     // پیش‌فرض خالی
    initialRegions: [],      // پیش‌فرض خالی
    currentRegions: [],      // پیش‌فرض خالی
    localizationDelay: '',
    onset: '',               // پیش‌فرض خالی
    duration: '',            // پیش‌فرض خالی
    character: '',           // پیش‌فرض خالی
    course: '',              // پیش‌فرض خالی
    timing: '',              // پیش‌فرض خالی
    severity: null,          // بسیار مهم: پیش‌فرض null (ثبت‌نشده) باشد، نه عدد 5!
    radiationList: [],
    noRadiation: false,
    aggravating: [],
    relieving: []
  };
}

export function createDefaultPresentation(archetype = 'pain_archetype', id = 1) {
  const uid = typeof id === 'string' && id.startsWith('pres_') ? id : ('pres_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
  if (archetype === 'mass_lesion_archetype') {
    return {
      id,
      uid,
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
      uid,
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
      uid,
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
      uid,
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

  // default: pain_archetype (all fields 100% unset)
  const basePain = createDefaultPainEpisode(id, `کانون درد #${id}`);
  basePain.archetype = 'pain_archetype';
  basePain.bodyRegion = '';
  basePain.bodyRegionGroup = '';
  return basePain;
}

export function createDefaultAtlsState() {
  return {
    mist: {
      arrivalMode: '',
      mechanisms: [],
      incidentTime: '',
      mechanismDetail: '',
      prehospitalActions: []
    },
    primary: {
      vitals: {
        bp: '',
        pr: '',
        rr: '',
        temp: '',
        spo2: '',
        gcsE: null,
        gcsV: null,
        gcsM: null,
        gcsTotal: null
      },
      airway: [],
      breathing: [],
      circulation: [],
      disability: [],
      disabilityPupils: '',
      exposure: []
    },
    ample: {
      allergies: '',
      medications: '',
      pastHistory: '',
      lastMeal: '',
      eventsTetanus: ''
    },
    secondary: {
      injuries: [],
      burnActive: false,
      burnDegree: '',
      burnTbsa: '',
      burnInhalation: '',
      headToToeCapsules: {},
      headFace: '',
      neck: '',
      chest: '',
      abdomenPelvis: '',
      perineumDre: '',
      extremitiesNeuro: '',
      efastStatus: '',
      efastWindows: [],
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
      gender: '',
      age: '',
      marital: '',
      city: '',
      occupation: '',
      informant: 'خود بیمار',
      ward: '',
      bed: ''
    },
    admission: {
      pathway: 'emergency_acute',
      emergencyPattern: 'subacute_chronic', // 'subacute_chronic' | 'acute'
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
      emergencyPattern: 'subacute_chronic',
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
        primarySurvey: {},
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

function getInitialClinicalState() {
  if (typeof localStorage !== 'undefined') {
    try {
      const rawDraft = localStorage.getItem('SURG_SCRIBE_ACTIVE_DRAFT_STATE');
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && parsed.caseId) {
          return parsed;
        }
      }
      const fallbackRaw = localStorage.getItem(STORAGE_CURRENT_CASE_KEY);
      if (fallbackRaw) {
        const parsedFallback = JSON.parse(fallbackRaw);
        if (parsedFallback && parsedFallback.caseId) {
          return parsedFallback;
        }
      }
    } catch (_) {}
  }
  return createDefaultClinicalState();
}

export let clinicalState = getInitialClinicalState();
if (typeof window !== 'undefined') {
  window.currentAppState = clinicalState;
}

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
      gender: '',
      workingDiagnosis: '',
      procedureDone: '',
      hdNumber: '1',
      podType: 'POD',
      podNumber: '1'
    },
    subjective: {
      overallTrend: '',
      painStatus: '',
      painDetail: '',
      dietTolerance: '',
      flatus: null, // null: not assessed, 1: +, -1: -
      bowelMovement: null, // null: not assessed, 1: +, -1: -
      bowelDetail: '',
      ambulation: '',
      overnightSymptoms: {},
      symptoms: {},
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
        hemodynamics: ''
      },
      io: {
        intake24h: '',
        urineOutput24h: '',
        ngtOutput24h: '',
        urineStatus: ''
      },
      intake24h: '',
      urineOutput24h: '',
      ngtOutput24h: '',
      drains: [],
      generalAndCardioPulm: '',
      abdomenExam: '',
      woundAndDressing: '',
      extremitiesDvt: '',
      examNote: '',
      labs: {},
      previousBaselineLabs: {},
      newParaclinicNote: ''
    },
    assessment: {
      summaryText: '',
      clinicalStatus: ''
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
  const icon = type === 'success' ? '' : type === 'warning' ? '!' : 'i';
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
  const { id, label, detailHint, currentItemData, modifiers, subTypes, onStateChange, onDetailChange } = options;
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

  // Sub-options / Modifiers
  const rawSub = modifiers || subTypes || [];
  const subOptions = Array.isArray(rawSub) ? rawSub : (typeof rawSub === 'string' ? rawSub.split(/[,،]\s*/).filter(Boolean) : []);

  let modifierChipsWrap = null;
  if (subOptions.length > 0) {
    modifierChipsWrap = document.createElement('div');
    modifierChipsWrap.className = 'mini-modifier-chips';
    modifierChipsWrap.style.display = stateVal === 1 ? 'flex' : 'none';

    subOptions.forEach((optText) => {
      const chipBtn = document.createElement('button');
      chipBtn.type = 'button';
      chipBtn.className = 'mini-modifier-chip';
      chipBtn.textContent = optText;
      if (detail && detail.includes(optText)) {
        chipBtn.classList.add('is-selected');
      }

      chipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const curVal = inlineInput.value.trim();
        let newVal = '';
        if (curVal.includes(optText)) {
          const parts = curVal.split(/[,،]\s*/).filter((p) => p !== optText && p.length > 0);
          newVal = parts.join('، ');
          chipBtn.classList.remove('is-selected');
        } else {
          newVal = curVal ? `${curVal}، ${optText}` : optText;
          chipBtn.classList.add('is-selected');
        }
        inlineInput.value = newVal;
        if (onDetailChange) {
          onDetailChange(newVal);
        }
        saveCurrentCase();
        updateLivePreview();
      });

      modifierChipsWrap.appendChild(chipBtn);
    });
  }

  const inlineInput = document.createElement('input');
  inlineInput.type = 'text';
  inlineInput.className = 'inline-detail-input';
  inlineInput.placeholder = detailHint || (getCurrentLanguage() === 'en' ? 'Additional details...' : 'توضیحات تکمیلی...');
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
      if (modifierChipsWrap) modifierChipsWrap.style.display = 'flex';
      setTimeout(() => inlineInput.focus(), 50);
    } else if (newState === -1) {
      chip.classList.add('active-neg');
      wrap.classList.remove('has-inline-open');
      if (modifierChipsWrap) modifierChipsWrap.style.display = 'none';
    } else {
      wrap.classList.remove('has-inline-open');
      if (modifierChipsWrap) modifierChipsWrap.style.display = 'none';
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
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
    if (modifierChipsWrap) {
      const val = e.target.value;
      modifierChipsWrap.querySelectorAll('.mini-modifier-chip').forEach((btn) => {
        btn.classList.toggle('is-selected', val.includes(btn.textContent));
      });
    }
    saveCurrentCase();
    updateLivePreview();
  });

  wrap.appendChild(chip);
  if (modifierChipsWrap) wrap.appendChild(modifierChipsWrap);
  wrap.appendChild(inlineInput);
  return wrap;
}

/* ==========================================================================
   Persistence: LocalStorage Auto-Save & Sync (Immortal Draft & Vault)
   ========================================================================== */
export function persistCurrentStateNow() {
  if (!clinicalState || !clinicalState.caseId) return;
  clinicalState.updatedAt = new Date().toISOString();
  if (typeof window !== 'undefined') {
    window.currentAppState = clinicalState;
  }

  try {
    const serialized = JSON.stringify(clinicalState);

    // 1. ذخیره فوری state در SURG_SCRIBE_ACTIVE_DRAFT_STATE
    localStorage.setItem('SURG_SCRIBE_ACTIVE_DRAFT_STATE', serialized);
    localStorage.setItem(STORAGE_CURRENT_CASE_KEY, serialized);

    // 2. آپدیت فوری همان پرونده (بر اساس state.caseId) در آرایه آرشیو شیفت (SURG_SCRIBE_PERMANENT_CASES_VAULT)
    let vaultCases = [];
    try {
      const rawVault = localStorage.getItem('SURG_SCRIBE_PERMANENT_CASES_VAULT');
      if (rawVault) vaultCases = JSON.parse(rawVault);
    } catch (_) {}
    if (!Array.isArray(vaultCases)) vaultCases = [];

    const vIdx = vaultCases.findIndex((c) => c && c.caseId === clinicalState.caseId);
    if (vIdx >= 0) {
      vaultCases[vIdx] = JSON.parse(serialized);
    } else {
      vaultCases.unshift(JSON.parse(serialized));
    }
    localStorage.setItem('SURG_SCRIBE_PERMANENT_CASES_VAULT', JSON.stringify(vaultCases));

    // Also update legacy shift key
    let shiftList = [];
    try {
      const rawShift = localStorage.getItem(STORAGE_SHIFT_CASES_KEY);
      if (rawShift) shiftList = JSON.parse(rawShift);
    } catch (_) {}
    if (!Array.isArray(shiftList)) shiftList = [];
    const sIdx = shiftList.findIndex((c) => c && c.caseId === clinicalState.caseId);
    if (sIdx >= 0) {
      shiftList[sIdx] = JSON.parse(serialized);
    } else {
      shiftList.unshift(JSON.parse(serialized));
    }
    localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(shiftList.slice(0, 50)));

    // 3. StorageVault sync
    if (typeof storageVault !== 'undefined') {
      storageVault.saveActiveDraft(clinicalState, activeSectionId);
      storageVault.upsertCaseInArchive(clinicalState);
    }
  } catch (e) {
    console.warn('Failed to persist current state:', e);
  }
}

function saveCurrentCase() {
  persistCurrentStateNow();
}

async function loadSavedState() {
  try {
    let loadedState = null;
    let savedTab = null;

    // 1. First priority: Check SURG_SCRIBE_ACTIVE_DRAFT_STATE directly
    if (typeof localStorage !== 'undefined') {
      try {
        const rawDraft = localStorage.getItem('SURG_SCRIBE_ACTIVE_DRAFT_STATE');
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (parsed && parsed.caseId) {
            loadedState = parsed;
            savedTab = localStorage.getItem('SURG_SCRIBE_ACTIVE_UI_TAB');
          }
        }
      } catch (_) {}
    }

    // 2. StorageVault check if not loaded from localStorage
    if (!loadedState && typeof storageVault !== 'undefined') {
      const restored = await storageVault.loadActiveDraft(createDefaultClinicalState);
      if (restored && restored.state && restored.restored) {
        loadedState = restored.state;
        savedTab = restored.activeTab;
      }
    }

    // 3. Fallback to legacy key
    if (!loadedState && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_CURRENT_CASE_KEY);
      if (saved) {
        try {
          loadedState = JSON.parse(saved);
        } catch (_) {}
      }
    }

    if (loadedState && loadedState.caseId) {
      // DO NOT call createNewCase / resetState!
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
      if (Array.isArray(loadedState.hpi?.presentations) && loadedState.hpi.presentations.length > 0) {
        clinicalState.hpi.presentations = loadedState.hpi.presentations;
      } else if (!clinicalState.hpi.presentations || !Array.isArray(clinicalState.hpi.presentations)) {
        clinicalState.hpi.presentations = [];
      }
      if (Array.isArray(loadedState.hpi?.painList) && loadedState.hpi.painList.length > 0) {
        clinicalState.hpi.painList = loadedState.hpi.painList;
      } else if (!clinicalState.hpi.painList || !Array.isArray(clinicalState.hpi.painList)) {
        clinicalState.hpi.painList = [];
      }

      if (typeof window !== 'undefined') {
        window.currentAppState = clinicalState;
      }

      persistCurrentStateNow();

      if (savedTab && document.querySelector(`.tab-btn[data-tab="${savedTab}"]`)) {
        document.querySelector(`.tab-btn[data-tab="${savedTab}"]`).click();
      }
    } else {
      if (!clinicalState || !clinicalState.caseId) {
        clinicalState = createDefaultClinicalState();
      }
      if (typeof window !== 'undefined') {
        window.currentAppState = clinicalState;
      }
      persistCurrentStateNow();
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
  const cardEmerg = document.getElementById('cardCCEmergency');
  const cardClinic = document.getElementById('cardCCReferral');
  const cardTransfer = document.getElementById('cardCCTransfer');
  const btnPatternSubacute = document.getElementById('btnEmergPatternSubacute');
  const btnPatternAcute = document.getElementById('btnEmergPatternAcute');

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

    if (cardEmerg) {
      cardEmerg.style.display = (pathway === 'emergency_acute' || pathway === 'emergency_symptom' || !pathway) ? 'block' : 'none';
    }
    if (cardClinic) {
      cardClinic.style.display = (pathway === 'elective_clinic' || pathway === 'clinic_referral') ? 'block' : 'none';
    }
    if (cardTransfer) {
      cardTransfer.style.display = (pathway === 'inpatient_transfer') ? 'block' : 'none';
    }
    saveCurrentCase();
    updateLivePreview();
  }

  function setEmergencyPattern(pattern) {
    if (!clinicalState.admission) clinicalState.admission = {};
    if (!clinicalState.cc) clinicalState.cc = {};
    clinicalState.admission.emergencyPattern = pattern;
    clinicalState.cc.emergencyPattern = pattern;

    btnPatternSubacute?.classList.toggle('active', pattern === 'subacute_chronic');
    btnPatternAcute?.classList.toggle('active', pattern === 'acute');

    saveCurrentCase();
    updateLivePreview();
  }

  btnPatternSubacute?.addEventListener('click', () => setEmergencyPattern('subacute_chronic'));
  btnPatternAcute?.addEventListener('click', () => setEmergencyPattern('acute'));

  // Sync initial pattern
  const currentPattern = clinicalState.admission?.emergencyPattern || clinicalState.cc?.emergencyPattern || 'subacute_chronic';
  btnPatternSubacute?.classList.toggle('active', currentPattern === 'subacute_chronic');
  btnPatternAcute?.classList.toggle('active', currentPattern === 'acute');

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
      title: 'درد و ناراحتی (Pain & Discomfort)',
      subtitle: 'شکمی، قفسه سینه، سر و گردن، کمر و اندام',
      defaultTitle: 'درد و ناراحتی'
    },
    {
      id: 'mass_lesion_archetype',
      cardClass: 'arch-card-mass',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>',
      title: 'توده، تورم و ضایعه (Mass, Cyst & Lesion)',
      subtitle: 'پستان، تیروئید، فک و صورت، کیست سر، فتق',
      defaultTitle: 'توده / ضایعه'
    },
    {
      id: 'trauma_burn_archetype',
      cardClass: 'arch-card-trauma',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      title: 'تروما، جراحت و سوختگی (Trauma, Stab/GSW & Burn)',
      subtitle: 'چاقو، گلوله، تصادف، سقوط، سوختگی',
      defaultTitle: 'تروما و جراحت'
    },
    {
      id: 'functional_bleeding_archetype',
      cardClass: 'arch-card-functional',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
      title: 'اختلال عملکرد، خونریزی یا زردی (Functional & Bleeding)',
      subtitle: 'تنگی نفس، خونریزی گوارشی، ایکتر، احتباس',
      defaultTitle: 'اختلال عملکرد / خونریزی'
    },
    {
      id: 'elective_asymptomatic_archetype',
      cardClass: 'arch-card-elective',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>',
      title: 'بستری الکتیو / ارجاع بی‌علامت (Elective & Pre-Op)',
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
        <div class="hpi-empty-icon">${getIconSvg("stethoscope", { size: 36 })}</div>
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
    pain_archetype: 'zap',
    mass_lesion_archetype: 'circle-dot',
    trauma_burn_archetype: 'ambulance',
    functional_bleeding_archetype: 'droplet',
    elective_asymptomatic_archetype: 'clipboard'
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
    iconSpan.innerHTML = getIconSvg(iconMap[archType] || 'file-text', { size: 16 });
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
        <span style="font-weight:700; color:var(--primary); font-size:0.88rem;">اقدام الکتیو برنامه‌ریزی‌شده (فاقد شکایت حاد)</span>
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
  charGroup.innerHTML = `<label class="form-label">ماهیت و کیفیت علامت (Character)</label>`;

  const charSelect = document.createElement('select');
  charSelect.className = 'input-select';
  charSelect.innerHTML = `
    <option value="">-- انتخاب ماهیت درد --</option>
    <option value="تیز و خنجری (Sharp)">تیز و خنجری (Sharp)</option>
    <option value="مبهم و فشاری (Dull/Crampy)">مبهم و فشاری (Dull/Crampy)</option>
    <option value="سوزشی (Burning)">سوزشی (Burning)</option>
    <option value="ضربان‌دار (Throbbing)">ضربان‌دار (Throbbing)</option>
    <option value="کولیکی و متناوب (Colicky)">کولیکی و متناوب (Colicky)</option>
    <option value="فشاری و حس سنگینی (Pressure/Crushing)">فشاری و حس سنگینی (Pressure/Crushing)</option>
    <option value="پاره‌کننده (Tearing)">پاره‌کننده (Tearing)</option>
    <option value="برق‌آسا و تیرکشنده (Electric/Shooting)">برق‌آسا و تیرکشنده (Electric/Shooting)</option>
    <option value="پلورتیک با تنفس (Pleuritic)">پلورتیک با تنفس (Pleuritic)</option>
    <option value="مبهم و عمقی (Deep-seated)">مبهم و عمقی (Deep-seated)</option>
  `;
  charSelect.value = pain.character || '';

  // Colloquial search box for character
  const searchWrap = document.createElement('div');
  searchWrap.className = 'pain-character-search-container';
  searchWrap.style.cssText = 'position:relative; margin-top:0.4rem;';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'input-text';
  searchInput.style.cssText = 'width:100%; font-size:0.8rem; padding:0.35rem 0.6rem; border:1px solid var(--border-subtle, #cbd5e1); border-radius:6px;';
  searchInput.placeholder = '🔍 جستجوی توصیف بیمار از درد: مثلاً خنجری، قولنجی، فیل رو سینه‌ام نشسته، تیر کشیدن، سوزشی...';
  searchInput.autocomplete = 'off';

  const resultsDropdown = document.createElement('div');
  resultsDropdown.className = 'pain-character-search-dropdown';
  resultsDropdown.style.cssText = 'display:none; position:absolute; top:100%; left:0; right:0; max-height:220px; overflow-y:auto; background:var(--bg-surface-elevated, #ffffff); border:1.5px solid var(--border-focus, #0284c7); border-radius:6px; box-shadow:0 6px 16px rgba(0,0,0,0.18); z-index:100; margin-top:2px; padding:0.25rem 0;';

  const activeCharBadge = document.createElement('div');
  activeCharBadge.className = 'active-character-badge';
  activeCharBadge.style.cssText = 'margin-top:0.35rem; font-size:0.78rem; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;';

  const renderActiveBadge = () => {
    if (pain.character) {
      activeCharBadge.innerHTML = `
        <span style="color:var(--text-muted); font-size:0.75rem;">ماهیت ثبت‌شده:</span>
        <span style="background:rgba(2,132,199,0.1); color:var(--primary, #0284c7); font-weight:600; padding:0.15rem 0.5rem; border-radius:4px; border:1px solid rgba(2,132,199,0.25); display:inline-flex; align-items:center; gap:0.35rem;">
          ${pain.character}
          <button type="button" class="btn-clear-char" style="background:none; border:none; color:inherit; cursor:pointer; font-weight:bold; font-size:0.85rem; padding:0; line-height:1;">✕</button>
        </span>
      `;
      activeCharBadge.querySelector('.btn-clear-char')?.addEventListener('click', () => {
        pain.character = '';
        charSelect.value = '';
        renderActiveBadge();
        saveCurrentCase();
        updateLivePreview();
      });
    } else {
      activeCharBadge.innerHTML = '';
    }
  };

  renderActiveBadge();

  const normalizeSearchStr = (q) => {
    return (q || '').toLowerCase()
      .replace(/[يی]/g, 'ی')
      .replace(/[كک]/g, 'ک')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();
  };

  const performCharSearch = (query) => {
    const norm = normalizeSearchStr(query);
    if (!norm) {
      resultsDropdown.style.display = 'none';
      resultsDropdown.innerHTML = '';
      return;
    }

    const characterQualifiers = (HPI_QUALIFIERS_AND_SYMPTOMS || []).filter(
      (it) => it.type === 'pain_qualifier' && it.category === 'character'
    );

    const matches = characterQualifiers.filter((it) => {
      const faMatch = normalizeSearchStr(it.fa).includes(norm);
      const enMatch = normalizeSearchStr(it.en).includes(norm);
      const colMatch = normalizeSearchStr(it.colloquial_fa).includes(norm);
      const modMatch = Array.isArray(it.modifiers) && it.modifiers.some((m) => normalizeSearchStr(m).includes(norm));
      return faMatch || enMatch || colMatch || modMatch;
    });

    resultsDropdown.innerHTML = '';

    if (matches.length === 0) {
      const noRes = document.createElement('div');
      noRes.style.cssText = 'padding:0.5rem 0.75rem; font-size:0.78rem; color:var(--text-muted); text-align:center;';
      noRes.textContent = 'موردی با این توصیف عامیانه یافت نشد. می‌توانید از لیست بالا یا تایپ دستی استفاده کنید.';
      resultsDropdown.appendChild(noRes);
      resultsDropdown.style.display = 'block';
      return;
    }

    matches.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'char-search-item';
      itemEl.style.cssText = 'padding:0.4rem 0.75rem; cursor:pointer; border-bottom:1px solid var(--border-subtle, #f1f5f9); font-size:0.8rem; transition:background 0.15s;';
      itemEl.innerHTML = `
        <div style="font-weight:600; color:var(--text-primary, #0f172a); display:flex; justify-content:space-between;">
          <span>${item.fa}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${item.en}</span>
        </div>
        ${item.colloquial_fa ? `<div style="font-size:0.73rem; color:var(--primary, #0284c7); margin-top:2px;">🗣️ تشبیه بیمار: ${item.colloquial_fa}</div>` : ''}
      `;
      itemEl.addEventListener('mouseenter', () => {
        itemEl.style.background = 'rgba(2,132,199,0.06)';
      });
      itemEl.addEventListener('mouseleave', () => {
        itemEl.style.background = 'transparent';
      });
      itemEl.addEventListener('click', () => {
        pain.character = `${item.fa} (${item.en})`;
        let foundOpt = false;
        for (let i = 0; i < charSelect.options.length; i++) {
          if (charSelect.options[i].value === pain.character || charSelect.options[i].text.includes(item.fa)) {
            charSelect.selectedIndex = i;
            foundOpt = true;
            break;
          }
        }
        if (!foundOpt) {
          const opt = document.createElement('option');
          opt.value = pain.character;
          opt.textContent = pain.character;
          opt.selected = true;
          charSelect.appendChild(opt);
        }
        searchInput.value = '';
        resultsDropdown.style.display = 'none';
        renderActiveBadge();
        saveCurrentCase();
        updateLivePreview();
      });
      resultsDropdown.appendChild(itemEl);
    });

    resultsDropdown.style.display = 'block';
  };

  searchInput.addEventListener('input', (e) => {
    performCharSearch(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      performCharSearch(searchInput.value);
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchWrap.contains(e.target)) {
      resultsDropdown.style.display = 'none';
    }
  });

  charSelect.addEventListener('change', (e) => {
    pain.character = e.target.value;
    renderActiveBadge();
    saveCurrentCase();
    updateLivePreview();
  });

  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(resultsDropdown);
  charGroup.appendChild(charSelect);
  charGroup.appendChild(searchWrap);
  charGroup.appendChild(activeCharBadge);
  grid2.appendChild(charGroup);

  // Severity NRS 1-10 Buttons Bar (Default: null / Unset)
  const sevGroup = document.createElement('div');
  sevGroup.className = 'form-group severity-nrs-group';

  const hasSeverity = pain.severity !== null && pain.severity !== undefined && pain.severity !== '';
  const currentSevVal = hasSeverity ? Number(pain.severity) : null;

  const sevHeader = document.createElement('div');
  sevHeader.className = 'form-label';
  sevHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
  sevHeader.innerHTML = `
    <span>شدت درد (NRS 1–10)</span>
    <span class="mono-num sev-val-label font-bold" style="padding:0.15rem 0.5rem; border-radius:4px; font-size:0.85rem; ${
      hasSeverity ? 'background:rgba(239,68,68,0.12); color:#dc2626;' : 'background:var(--bg-surface-elevated); color:var(--text-muted);'
    }">
      ${hasSeverity ? `${currentSevVal} از ۱۰` : 'ثبت نشده (Unset)'}
    </span>
  `;
  sevGroup.appendChild(sevHeader);

  const nrsBar = document.createElement('div');
  nrsBar.className = 'nrs-buttons-bar';
  nrsBar.style.cssText = 'display:flex; gap:0.25rem; flex-wrap:wrap; align-items:center; margin-top:0.35rem;';

  const unsetBtn = document.createElement('button');
  unsetBtn.type = 'button';
  unsetBtn.className = `btn-nrs-item btn-nrs-unset ${!hasSeverity ? 'active' : ''}`;
  unsetBtn.style.cssText = `
    padding: 0.35rem 0.65rem;
    font-size: 0.78rem;
    border-radius: 6px;
    border: 1.5px solid ${!hasSeverity ? 'var(--primary, #0284c7)' : 'var(--border-subtle, #cbd5e1)'};
    background: ${!hasSeverity ? 'var(--primary, #0284c7)' : 'var(--bg-surface, #ffffff)'};
    color: ${!hasSeverity ? '#ffffff' : 'var(--text-secondary, #64748b)'};
    cursor: pointer;
    font-weight: ${!hasSeverity ? '700' : '500'};
    transition: all 0.15s ease;
  `;
  unsetBtn.textContent = 'ثبت نشده';

  const numericBtns = [];

  const updateNrsUI = (newVal) => {
    pain.severity = newVal;
    const isValSet = newVal !== null && newVal !== undefined && newVal !== '';
    const num = isValSet ? Number(newVal) : null;

    const labelSpan = sevHeader.querySelector('.sev-val-label');
    if (labelSpan) {
      labelSpan.textContent = isValSet ? `${num} از ۱۰` : 'ثبت نشده (Unset)';
      labelSpan.style.background = isValSet ? 'rgba(239,68,68,0.12)' : 'var(--bg-surface-elevated)';
      labelSpan.style.color = isValSet ? '#dc2626' : 'var(--text-muted)';
    }

    if (!isValSet) {
      unsetBtn.style.border = '1.5px solid var(--primary, #0284c7)';
      unsetBtn.style.background = 'var(--primary, #0284c7)';
      unsetBtn.style.color = '#ffffff';
      unsetBtn.style.fontWeight = '700';
    } else {
      unsetBtn.style.border = '1.5px solid var(--border-subtle, #cbd5e1)';
      unsetBtn.style.background = 'var(--bg-surface, #ffffff)';
      unsetBtn.style.color = 'var(--text-secondary, #64748b)';
      unsetBtn.style.fontWeight = '500';
    }

    numericBtns.forEach(({ btn, val }) => {
      const isThisActive = isValSet && num === val;
      let activeBg = val <= 3 ? '#16a34a' : (val <= 6 ? '#d97706' : '#dc2626');

      if (isThisActive) {
        btn.style.background = activeBg;
        btn.style.borderColor = activeBg;
        btn.style.color = '#ffffff';
        btn.style.fontWeight = '700';
        btn.style.transform = 'scale(1.08)';
      } else {
        btn.style.background = 'var(--bg-surface, #ffffff)';
        btn.style.borderColor = 'var(--border-subtle, #cbd5e1)';
        btn.style.color = 'var(--text-primary, #1e293b)';
        btn.style.fontWeight = '600';
        btn.style.transform = 'scale(1)';
      }
    });

    saveCurrentCase();
    updateLivePreview();
  };

  unsetBtn.addEventListener('click', () => {
    updateNrsUI(null);
  });
  nrsBar.appendChild(unsetBtn);

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-nrs-item btn-nrs-num ${currentSevVal === i ? 'active' : ''}`;
    const isThisActive = currentSevVal === i;
    let activeBg = i <= 3 ? '#16a34a' : (i <= 6 ? '#d97706' : '#dc2626');

    btn.style.cssText = `
      flex: 1;
      min-width: 28px;
      height: 32px;
      font-size: 0.85rem;
      border-radius: 6px;
      border: 1.5px solid ${isThisActive ? activeBg : 'var(--border-subtle, #cbd5e1)'};
      background: ${isThisActive ? activeBg : 'var(--bg-surface, #ffffff)'};
      color: ${isThisActive ? '#ffffff' : 'var(--text-primary, #1e293b)'};
      cursor: pointer;
      font-weight: ${isThisActive ? '700' : '600'};
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    `;
    btn.textContent = String(i);
    btn.addEventListener('click', () => {
      updateNrsUI(i);
    });
    nrsBar.appendChild(btn);
    numericBtns.push({ btn, val: i });
  }

  sevGroup.appendChild(nrsBar);
  grid2.appendChild(sevGroup);

  card.appendChild(grid2);

  // Body Region Group Selector
  const bodyRegionSelectGroup = document.createElement('div');
  bodyRegionSelectGroup.className = 'form-group';
  bodyRegionSelectGroup.style.marginTop = '0.6rem';
  bodyRegionSelectGroup.innerHTML = `<label class="form-label">منطقه اصلی آناتومیک درد (Body Region)</label>`;

  const groupPillsWrap = document.createElement('div');
  groupPillsWrap.className = 'spatial-patterns-grid';

  const curGroup = pain.bodyRegionGroup || pain.bodyRegion || '';
  PAIN_BODY_REGIONS.forEach((reg) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pattern-pill-btn ${(curGroup === reg.id) ? 'active' : ''}`;
    btn.textContent = reg.labelFa;
    btn.addEventListener('click', () => {
      const isSwitching = (pain.bodyRegionGroup !== reg.id);
      pain.bodyRegion = reg.id;
      pain.bodyRegionGroup = reg.id;

      if (isSwitching) {
        pain.selectedRegions = [];
        pain.site = '';
      }

      groupPillsWrap.querySelectorAll('.pattern-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (reg.id === 'abdomen_pelvis') {
        spatGroup.style.display = 'block';
      } else {
        spatGroup.style.display = 'none';
        pain.spatialPattern = '';
        pain.initialRegions = [];
        pain.currentRegions = [];
        pain.localizationDelay = '';
      }

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
  spatGroup.style.display = (curGroup === 'abdomen_pelvis') ? 'block' : 'none';
  spatGroup.innerHTML = `<label class="form-label">الگوی فضایی-زمانی درد شکم</label>`;
  const spatGrid = document.createElement('div');
  spatGrid.className = 'spatial-patterns-grid';

  SURGICAL_SCHEMA.painSpatialPatterns.forEach((patt) => {
    const pattBtn = document.createElement('button');
    pattBtn.type = 'button';
    pattBtn.className = `pattern-pill-btn ${pain.spatialPattern === patt.id ? 'active' : ''}`;
    pattBtn.textContent = patt.label;
    pattBtn.addEventListener('click', () => {
      if (pain.spatialPattern === patt.id) {
        pain.spatialPattern = '';
        pattBtn.classList.remove('active');
      } else {
        spatGrid.querySelectorAll('.pattern-pill-btn').forEach((b) => b.classList.remove('active'));
        pattBtn.classList.add('active');
        pain.spatialPattern = patt.id;
      }
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

  // Smart 2-Stage Directional Radiation Capsules (11 Clean Anatomical Capsules)
  const radGroup = document.createElement('div');
  radGroup.className = 'form-group radiation-v2-container';
  radGroup.style.marginTop = '0.6rem';

  const radHeader = document.createElement('div');
  radHeader.className = 'form-label';
  radHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
  radHeader.innerHTML = `
    <span>محل انتشار درد (Radiation) - کپسول‌های جهت‌دار</span>
    <span class="rad-summary-badge" style="font-size:0.75rem; color:var(--text-muted);">
      ${pain.radiationList && pain.radiationList.length > 0 ? `${pain.radiationList.length} موضع انتخاب‌شده` : 'بدون انتشار (پیش‌فرض)'}
    </span>
  `;
  radGroup.appendChild(radHeader);

  const radGrid = document.createElement('div');
  radGrid.className = 'radiation-capsules-v2-grid';
  radGrid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:0.4rem; margin-top:0.35rem;';

  if (!Array.isArray(pain.radiationList)) {
    pain.radiationList = [];
  }

  RADIATION_SITES_V2.forEach((site) => {
    const existing = pain.radiationList.find((r) => r.id === site.id);
    const isSelected = !!existing;

    const capsuleCard = document.createElement('div');
    capsuleCard.className = `radiation-card-v2 ${isSelected ? 'active' : ''}`;
    capsuleCard.style.cssText = `
      background: ${isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-surface, #ffffff)'};
      border: 1.5px solid ${isSelected ? 'var(--primary, #0284c7)' : 'var(--border-subtle, #cbd5e1)'};
      border-radius: 8px;
      padding: 0.4rem 0.6rem;
      transition: all 0.2s ease;
    `;

    const headRow = document.createElement('div');
    headRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none;';

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-size:0.8rem; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:0.3rem;';
    titleSpan.innerHTML = `<span>${isSelected ? '📍' : '▫️'}</span> <span>${site.label}</span>`;

    const statusBadge = document.createElement('span');
    statusBadge.style.cssText = 'font-size:0.73rem;';
    if (isSelected) {
      statusBadge.innerHTML = `
        <span style="background:var(--primary, #0284c7); color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-weight:600;">
          ${existing.detail || 'انتخاب‌شده'}
        </span>
        <button type="button" class="btn-remove-rad" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; padding:0 0 0 0.3rem;">✕</button>
      `;
      statusBadge.querySelector('.btn-remove-rad')?.addEventListener('click', (e) => {
        e.stopPropagation();
        pain.radiationList = pain.radiationList.filter((r) => r.id !== site.id);
        renderHpiPresentations();
        saveCurrentCase();
        updateLivePreview();
      });
    } else {
      statusBadge.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">+ جهت</span>`;
    }

    headRow.appendChild(titleSpan);
    headRow.appendChild(statusBadge);
    capsuleCard.appendChild(headRow);

    const modRow = document.createElement('div');
    modRow.className = 'radiation-modifiers-row';
    const isExpanded = isSelected || capsuleCard.classList.contains('expanded');
    modRow.style.cssText = `
      display: ${isExpanded ? 'flex' : 'none'};
      gap: 0.25rem;
      flex-wrap: wrap;
      margin-top: 0.4rem;
      padding-top: 0.35rem;
      border-top: 1px dashed ${isSelected ? 'rgba(2, 132, 199, 0.3)' : 'var(--border-subtle, #e2e8f0)'};
    `;

    site.modifiers.forEach((mod) => {
      const isModActive = isSelected && existing.detail === mod;
      const modBtn = document.createElement('button');
      modBtn.type = 'button';
      modBtn.className = `btn-rad-modifier ${isModActive ? 'active' : ''}`;
      modBtn.style.cssText = `
        padding: 0.2rem 0.45rem;
        font-size: 0.73rem;
        border-radius: 4px;
        border: 1px solid ${isModActive ? 'var(--primary, #0284c7)' : 'var(--border-subtle, #cbd5e1)'};
        background: ${isModActive ? 'var(--primary, #0284c7)' : 'var(--bg-surface-elevated, #f8fafc)'};
        color: ${isModActive ? '#ffffff' : 'var(--text-secondary, #475569)'};
        cursor: pointer;
        font-weight: ${isModActive ? '700' : '500'};
        transition: all 0.15s ease;
      `;
      modBtn.textContent = mod;

      modBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isModActive) {
          pain.radiationList = pain.radiationList.filter((r) => r.id !== site.id);
        } else {
          pain.radiationList = pain.radiationList.filter((r) => r.id !== site.id);
          pain.radiationList.push(formatRadiationItem(site, mod));
        }
        renderHpiPresentations();
        saveCurrentCase();
        updateLivePreview();
      });

      modRow.appendChild(modBtn);
    });

    capsuleCard.appendChild(modRow);

    headRow.addEventListener('click', () => {
      const currentlyHidden = modRow.style.display === 'none';
      modRow.style.display = currentlyHidden ? 'flex' : 'none';
      if (currentlyHidden) {
        capsuleCard.classList.add('expanded');
      } else {
        capsuleCard.classList.remove('expanded');
      }
    });

    radGrid.appendChild(capsuleCard);
  });

  radGroup.appendChild(radGrid);

  const radHint = document.createElement('div');
  radHint.style.cssText = 'margin-top:0.4rem; font-size:0.75rem; color:var(--text-muted); font-style:italic;';
  if (!pain.radiationList || pain.radiationList.length === 0) {
    radHint.innerHTML = 'ℹ️ هیچ محل انتشاری انتخاب نشده است؛ در شرح‌حال نوشته خواهد شد: <strong>«درد به جایی انتشار ندارد.»</strong>';
  } else {
    const listLabels = pain.radiationList.map((r) => r.fullLabel || `${r.label}: ${r.detail}`).join('، ');
    radHint.innerHTML = `✅ انتشار ثبت‌شده: <strong>${listLabels}</strong>`;
  }
  radGroup.appendChild(radHint);

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

  const group = pain.bodyRegionGroup || pain.bodyRegion || '';

  // If no body region selected yet
  if (!group) {
    const promptDiv = document.createElement('div');
    promptDiv.style.cssText = 'padding:0.65rem 0.75rem; border:1.5px dashed var(--border-subtle, #cbd5e1); border-radius:6px; color:var(--text-muted); font-size:0.8rem; text-align:center; background:var(--bg-surface-elevated, #f8fafc);';
    promptDiv.innerHTML = '👈 برای مشخص کردن محل دقیق درد، لطفاً ابتدا یکی از <strong>۴ منطقه اصلی آناتومیک</strong> بالا را انتخاب کنید.';
    container.appendChild(promptDiv);
    return;
  }

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
    row2.innerHTML = `<label class="form-label">ناحیه(های) لوکالیزه‌شده فعلی (Current Localized Region)</label>`;
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
    row1.innerHTML = `<label class="form-label">۱. محل(های) شروع اولیه درد</label>`;
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
    row2.innerHTML = `<label class="form-label">۲. محل(های) فعلی / ثانویه درد</label>`;
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

  const coreList = (HPI_ASSOCIATED_SYMPTOMS || []).filter((x) => x.isCore === true && !x.isPainLocation);
  const activeSymptomIds = Object.keys(clinicalState.hpi?.symptoms || {});
  const extraActiveList = (HPI_ASSOCIATED_SYMPTOMS || []).filter(
    (x) => activeSymptomIds.includes(x.id) && !coreList.some((c) => c.id === x.id)
  );

  const displayList = [...coreList, ...extraActiveList];

  displayList.forEach((sym) => {
    const currentData = clinicalState.hpi.symptoms?.[sym.id];
    const chipWrap = renderInlineDetailTriStateChip({
      id: sym.id,
      label: getItemDisplayTitle(sym) || sym.fa || sym.label || sym.en,
      detailHint: sym.detailHint || (getCurrentLanguage() === 'en' ? 'Details...' : 'توضیحات تکمیلی...'),
      modifiers: sym.modifiers || [],
      currentItemData: currentData,
      onStateChange: (newState, detailText) => {
        if (!clinicalState.hpi) clinicalState.hpi = { symptoms: {} };
        if (!clinicalState.hpi.symptoms) clinicalState.hpi.symptoms = {};
        if (newState === 0) {
          delete clinicalState.hpi.symptoms[sym.id];
        } else {
          clinicalState.hpi.symptoms[sym.id] = { state: newState, detail: detailText, label: sym.fa || sym.label, en: sym.en || '' };
        }
      },
      onDetailChange: (detailText) => {
        if (clinicalState.hpi?.symptoms?.[sym.id]) {
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
      btn.innerHTML = `<span>${mod.buttonLabel}</span><span>${getIconSvg('lock', { size: 13 })}</span>`;
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
        <span class="unlocked-module-title">${getIconSvg('unlock', { size: 14 })} ${mod.title}</span>
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
    btnNeg.textContent = catData.status === 'negated' ? 'نفی شد' : '− نفی کل دسته';

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

    // Split-action chips for items inside this category (core + dynamic from search/database)
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';

    const allCatItemsMap = new Map();
    (cat.items || []).forEach((item) => {
      allCatItemsMap.set(item.id, { ...item });
    });

    if (catData.items) {
      Object.entries(catData.items).forEach(([k, v]) => {
        if (!allCatItemsMap.has(k) && v) {
          allCatItemsMap.set(k, {
            id: k,
            label: v.label || v.fa || k,
            detailHint: v.detailHint || 'توضیحات تکمیلی / سال تشخیص...',
            en: v.en || ''
          });
        }
      });
    }

    if (clinicalState.pmh?.items) {
      Object.entries(clinicalState.pmh.items).forEach(([k, v]) => {
        if (!allCatItemsMap.has(k) && v) {
          const inferred = v.catId || (typeof inferPmhCatId === 'function' ? inferPmhCatId({ id: k, ...v }) : null);
          if (inferred === cat.id) {
            allCatItemsMap.set(k, {
              id: k,
              label: v.label || v.fa || k,
              detailHint: v.detailHint || 'توضیحات تکمیلی / سال تشخیص...',
              en: v.en || ''
            });
          }
        }
      });
    }

    allCatItemsMap.forEach((item) => {
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
            catData.items[item.id] = { state: newState, detail: detailText, label: item.label, catId: cat.id, en: item.en || '' };
            clinicalState.pmh.items[item.id] = catData.items[item.id];
          }
          saveCurrentCase();
          updateLivePreview();
        },
        onDetailChange: (detailText) => {
          if (catData.items[item.id]) catData.items[item.id].detail = detailText;
          if (clinicalState.pmh.items[item.id]) clinicalState.pmh.items[item.id].detail = detailText;
          saveCurrentCase();
          updateLivePreview();
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
        Object.keys(catData.items || {}).forEach((k) => {
          if (clinicalState.pmh.items) delete clinicalState.pmh.items[k];
        });
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
  if (!clinicalState.psh) clinicalState.psh = { surgeries: [], note: '', systemGapNote: '', noSurgeries: false };
  if (!Array.isArray(clinicalState.psh.surgeries)) clinicalState.psh.surgeries = [];
  clinicalState.psh.noSurgeries = false;
  const btnNoSurgeries = document.getElementById('btnPshNoPriorSurgeries');
  if (btnNoSurgeries) {
    btnNoSurgeries.classList.remove('is-confirmed');
    const icon = document.getElementById('pshNoSurgeriesIcon');
    if (icon) icon.textContent = '−';
  }

  const exists = clinicalState.psh.surgeries.some(
    (s) => s.id === procObj.id || (s.label || s.procedure) === (procObj.label || procObj.name)
  );
  if (!exists) {
    clinicalState.psh.surgeries.push({
      id: procObj.id || ('psh_' + Date.now()),
      label: procObj.label || procObj.name || 'جراحی قبلی',
      procedure: procObj.label || procObj.name || 'جراحی قبلی',
      en: procObj.en || '',
      year: procObj.year || '',
      note: procObj.note || ''
    });
  }
  renderPshCapsulesAndSelected();
  saveCurrentCase();
  updateLivePreview();
}

export function renderPshCapsulesAndSelected(filterQuery = '') {
  const capsulesBar = document.getElementById('pshCommonCapsulesBar');
  const selectedContainer = document.getElementById('pshSelectedSurgeriesContainer');
  const searchTray = document.querySelector('#cardPshHistory .search-results-tray');
  if (!clinicalState.psh) clinicalState.psh = { surgeries: [], note: '', systemGapNote: '', noSurgeries: false };
  if (!Array.isArray(clinicalState.psh.surgeries)) clinicalState.psh.surgeries = [];

  if (capsulesBar) {
    capsulesBar.innerHTML = '';
  }

  const q = (filterQuery || '').trim();
  if (searchTray) {
    searchTray.innerHTML = '';
    if (q) {
      const pool = Array.isArray(MASTER_PSH_SURGERIES_BANK) && MASTER_PSH_SURGERIES_BANK.length > 0 ? MASTER_PSH_SURGERIES_BANK : (Array.isArray(PSH_SURGICAL_PROCEDURES_BANK) ? PSH_SURGICAL_PROCEDURES_BANK : []);
      const matches = smartClinicalSearch(q, pool, 15);
      if (matches.length > 0) {
        searchTray.style.display = 'flex';
        searchTray.style.flexWrap = 'wrap';
        searchTray.style.gap = '0.45rem';
        searchTray.style.padding = '0.5rem';
        searchTray.style.background = 'var(--bg-elevated)';
        searchTray.style.border = '1px solid var(--border-subtle)';
        searchTray.style.borderRadius = '8px';

        matches.forEach((proc) => {
          const isSelected = clinicalState.psh.surgeries.some((s) => s.id === proc.id || s.label === proc.label);
          const chip = document.createElement('div');
          chip.className = `search-tray-item ${isSelected ? 'is-positive' : ''}`;
          chip.style.cssText = 'display:inline-flex; align-items:center; gap:0.55rem; padding:0.4rem 0.85rem; min-height:36px; background:var(--bg-surface); border:1.5px solid var(--border-strong); border-radius:9999px; cursor:pointer; font-size:0.86rem; user-select:none; touch-action:manipulation;';
          chip.innerHTML = `
            <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:rgba(16,185,129,0.15); color:#10b981; font-weight:800; font-size:1.05rem; line-height:1;">+</span>
            <span style="font-weight:600; color:var(--text-primary);">${proc.label}</span>
          `;
          chip.addEventListener('click', () => {
            addPshSurgeryItem(proc);
            searchTray.style.display = 'none';
            const searchInput = document.getElementById('pshQuickSearchInput');
            if (searchInput) searchInput.value = '';
          });
          searchTray.appendChild(chip);
        });
      } else {
        searchTray.style.display = 'none';
      }
    } else {
      searchTray.style.display = 'none';
    }
  }

  if (selectedContainer) {
    selectedContainer.innerHTML = '';
    clinicalState.psh.surgeries.forEach((surg, idx) => {
      const row = document.createElement('div');
      row.className = 'psh-selected-surgery-row';
      row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; background:var(--bg-surface); border:1px solid var(--border-strong); border-radius:8px; padding:0.45rem 0.75rem; flex-wrap:wrap; box-shadow:var(--card-shadow);';
      row.innerHTML = `
        <span style="font-weight:700; font-size:0.85rem; color:var(--primary); min-width:130px; flex:0 0 auto;">${surg.label || surg.procedure}</span>
        <input type="text" class="input-text psh-surg-year-inp" style="flex:1; min-width:110px; max-width:160px; padding:0.3rem 0.55rem; font-size:0.82rem;" placeholder="سال عمل (مثلاً ۱۴۰۰)..." value="${surg.year || ''}">
        <input type="text" class="input-text psh-surg-note-inp" style="flex:2; min-width:180px; padding:0.3rem 0.55rem; font-size:0.82rem;" placeholder="توضیحات (بیمارستان، بیهوشی، عوارض...)..." value="${surg.note || surg.yearHospital || ''}">
        <button type="button" class="btn btn-icon-only psh-surg-del-btn" style="color:var(--text-muted); cursor:pointer; padding:0.25rem;" title="حذف این جراحی">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      row.querySelector('.psh-surg-year-inp')?.addEventListener('input', (e) => {
        surg.year = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
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

  const btnNoSurgeries = document.getElementById('btnPshNoPriorSurgeries');
  if (btnNoSurgeries) {
    const updateNoSurgeriesUi = () => {
      const isNo = !!clinicalState.psh?.noSurgeries;
      btnNoSurgeries.classList.toggle('is-confirmed', isNo);
      const icon = document.getElementById('pshNoSurgeriesIcon');
      if (icon) icon.textContent = isNo ? '✓' : '−';
    };
    btnNoSurgeries.onclick = () => {
      if (!clinicalState.psh) clinicalState.psh = { surgeries: [], note: '', systemGapNote: '', noSurgeries: false };
      clinicalState.psh.noSurgeries = !clinicalState.psh.noSurgeries;
      if (clinicalState.psh.noSurgeries) {
        showToast('عدم سابقه عمل جراحی قبلی ثبت شد.', 'info');
      }
      updateNoSurgeriesUi();
      saveCurrentCase();
      updateLivePreview();
    };
    updateNoSurgeriesUi();
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
        const pool = Array.isArray(MASTER_PSH_SURGERIES_BANK) && MASTER_PSH_SURGERIES_BANK.length > 0 ? MASTER_PSH_SURGERIES_BANK : (Array.isArray(PSH_SURGICAL_PROCEDURES_BANK) ? PSH_SURGICAL_PROCEDURES_BANK : []);
        const matches = smartClinicalSearch(q, pool, 5);
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
        <button type="button" class="btn-delete-imaging row-del" title="حذف ردیف"></button>
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
    titleBox.innerHTML = `<span>${getIconSvg('pill', { size: 14 })}</span><strong>${drug.name}</strong>${drug.en ? ` <span style="font-size: 0.8rem; opacity: 0.8;">(${drug.en})</span>` : ''}`;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-card';
    delBtn.innerHTML = `<span>${getIconSvg('trash', { size: 13 })}</span><span>حذف</span>`;
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
    pill.innerHTML = `<span>${getIconSvg('folder', { size: 13 })}</span><span>${cat.title}</span>`;
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
    chip.innerHTML = `${isAdded ? '' : ''}${d.label}`;
    chip.addEventListener('click', () => {
      addActiveDrug(d);
      chip.innerHTML = `${d.label}`;
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
        <span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${cd.name || 'داروی جدید'}</span>
        <button type="button" class="btn-delete-imaging" title="حذف این دارو"></button>
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
    pill.innerHTML = `<span>${isAdded ? '' : '+'}</span> <span>${p.name}</span>`;
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
      <div class="fh-empty-icon">${getIconSvg("dna", { size: 36 })}</div>
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
    iconSpan.innerHTML = getIconSvg('dna', { size: 18 });
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
      relBadge.innerHTML = `<span>${getIconSvg('user', { size: 14 })}</span> <strong>${relObj.relation}</strong>`;
      relRow.appendChild(relBadge);

      // B. Vital Status Toggle ([ در قید حیات ] | [ فوت‌شده ])
      const vitalToggle = document.createElement('div');
      vitalToggle.className = 'fh-vital-status-toggle';

      const btnAlive = document.createElement('button');
      btnAlive.type = 'button';
      btnAlive.className = `fh-vital-btn ${relObj.vitalStatus !== 'deceased' ? 'active-alive' : ''}`;
      btnAlive.innerHTML = `<span class="status-dot alive"></span> <span>در قید حیات</span>`;
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
      btnDeceased.innerHTML = `<span class="status-dot deceased"></span> <span>فوت‌شده</span>`;
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
      delRelBtn.textContent = '';
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
    if (check) check.textContent = clinicalState.ah.nkda ? '' : '◻️';
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

  const patientGender = clinicalState.demographics?.gender || '';
  const showAllGenders = !!clinicalState.ros?.showAllGenders;

  if (genderToggle) {
    const iconEl = document.getElementById('rosGenderFilterIcon');
    const textEl = document.getElementById('rosGenderFilterText');
    if (iconEl) iconEl.innerHTML = showAllGenders ? getIconSvg('unlock', { size: 13 }) : getIconSvg('lock', { size: 13 });
    if (textEl) textEl.textContent = showAllGenders ? 'نمایش همه آیتم‌ها' : 'فیلتر جنسیت فعال';
    genderToggle.onclick = () => {
      clinicalState.ros.showAllGenders = !clinicalState.ros.showAllGenders;
      renderRosGroups();
      saveCurrentCase();
      updateLivePreview();
    };
  }

  // Global Toggle All ROS Accordions
  const btnToggleAll = document.getElementById('btnToggleAllRos');
  const activeGroups = ROS_GROUPS_BILINGUAL.filter(grp => {
    const sysKey = grp.systemKey || grp.id;
    if (!showAllGenders && patientGender === 'male' && sysKey === 'female_reproductive_obgyn') return false;
    if (!showAllGenders && patientGender === 'female' && sysKey === 'male_reproductive') return false;
    return true;
  });
  if (btnToggleAll) {
    const isAllExpanded = activeGroups.length > 0 && activeGroups.every(g => window._rosExpandedMap.has(g.systemKey || g.id));
    const textSpan = document.getElementById('btnToggleAllRosText');
    if (textSpan) textSpan.textContent = isAllExpanded ? 'بستن همه سیستم‌ها' : 'باز کردن همه سیستم‌ها';
    btnToggleAll.onclick = () => {
      if (isAllExpanded) {
        window._rosExpandedMap.clear();
      } else {
        activeGroups.forEach(g => window._rosExpandedMap.add(g.systemKey || g.id));
      }
      renderRosGroups();
    };
  }

  activeGroups.forEach((grp) => {
    const sysKey = grp.systemKey || grp.id;

    // Male Breast Logic: If male and not showing all genders, hide breast by default unless enabled or has findings
    if (!showAllGenders && patientGender === 'male' && sysKey === 'breast') {
      const hasActiveBreast = grp.items.some(it => clinicalState.ros.items?.[it.id]) ||
        Object.values(clinicalState.ros.items || {}).some(it => it && (it.system === 'breast' || it.system === 'ros_breast'));
      if (!window._rosBreastEnabledForMale && !hasActiveBreast) {
        const maleCard = document.createElement('div');
        maleCard.className = 'male-breast-enable-card';
        maleCard.innerHTML = `
          <span>بررسی سیستم پستان برای بیمار آقا (ژنیکوماستی، توده، ترشح نوک پستان)</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btnEnableMaleBreastRos">+ افزودن دستی بررسی پستان (ژنیکوماستی/توده) برای بیمار آقا</button>
        `;
        maleCard.querySelector('#btnEnableMaleBreastRos').addEventListener('click', () => {
          window._rosBreastEnabledForMale = true;
          window._rosExpandedMap.add('breast');
          renderRosGroups();
        });
        container.appendChild(maleCard);
        return;
      }
    }

    const filteredItems = grp.items.filter((item) => {
      if (showAllGenders || item.gender === 'all') return true;
      if (!patientGender) return true;
      if (patientGender === 'female' && item.gender === 'female') return true;
      if (patientGender === 'male' && item.gender === 'male') return true;
      if (patientGender === 'other') return true;
      return false;
    });

    if (filteredItems.length === 0) return;

    // Count findings for this system
    let posCount = 0;
    let negCount = 0;
    let neutralCount = 0;

    filteredItems.forEach((item) => {
      const it = clinicalState.ros.items[item.id];
      const st = it ? (typeof it === 'object' ? it.state : it) : 0;
      if (st === 1 || st === '+1') posCount++;
      else if (st === -1 || st === '-1') negCount++;
      else neutralCount++;
    });

    // Also include custom gap items in this system
    Object.entries(clinicalState.ros.items || {}).forEach(([k, it]) => {
      if (k.startsWith('ros_gap_') && it && it.system === sysKey) {
        if (it.state === 1 || it.state === '+1') posCount++;
        else if (it.state === -1 || it.state === '-1') negCount++;
      }
    });

    const isResetState = neutralCount === 0 && negCount > 0;
    const isExpanded = window._rosExpandedMap.has(sysKey);
    const isShowingAll = window._rosShowAllMap.has(sysKey);

    const grpCard = document.createElement('div');
    grpCard.className = `subsystem-accordion ${isExpanded ? '' : 'is-collapsed'}`;
    grpCard.id = `ros_grp_card_${sysKey}`;
    grpCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'subsystem-header';

    const headerRight = document.createElement('div');
    headerRight.className = 'subsystem-header-right';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'subsystem-title';
    titleSpan.textContent = getCurrentLanguage() === 'en' ? (grp.en || grp.group) : grp.group;
    headerRight.appendChild(titleSpan);

    if (posCount > 0) {
      const bPos = document.createElement('span');
      bPos.className = 'subsystem-badge-counter pos';
      bPos.textContent = getCurrentLanguage() === 'en' ? `${posCount} Pos` : `${posCount} مثبت`;
      headerRight.appendChild(bPos);
    }
    if (negCount > 0) {
      const bNeg = document.createElement('span');
      bNeg.className = 'subsystem-badge-counter neg';
      bNeg.textContent = getCurrentLanguage() === 'en' ? `${negCount} Neg` : `${negCount} منفی`;
      headerRight.appendChild(bNeg);
    }

    const headerLeft = document.createElement('div');
    headerLeft.className = 'subsystem-header-left';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = `btn-toggle-sub-negatives ${isResetState ? 'is-reset' : ''}`;
    toggleBtn.innerHTML = isResetState
      ? `<span>${getCurrentLanguage() === 'en' ? '↺ Reset Negatives' : '↺ بازنشانی منفی‌ها'}</span>`
      : `<span>${getCurrentLanguage() === 'en' ? '− Mark Rest Neg' : '− منفی کردن بقیه'}</span>`;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const makeNeg = !isResetState;
      filteredItems.forEach((item) => {
        const it = clinicalState.ros.items[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (makeNeg) {
          if (st === 0) {
            clinicalState.ros.items[item.id] = { state: -1, detail: '', label: item.fa || item.label, en: item.en || '', system: sysKey };
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

    const chevron = document.createElement('span');
    chevron.className = 'subsystem-chevron';
    chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    headerLeft.appendChild(chevron);

    header.appendChild(headerRight);
    header.appendChild(headerLeft);

    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (window._rosExpandedMap.has(sysKey)) {
        window._rosExpandedMap.delete(sysKey);
        grpCard.classList.add('is-collapsed');
      } else {
        window._rosExpandedMap.add(sysKey);
        grpCard.classList.remove('is-collapsed');
      }
    });

    grpCard.appendChild(header);

    const body = document.createElement('div');
    body.className = 'subsystem-body';

    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';

    // Core-only by default: show item if isShowingAll || isCore !== false || item has active state in ros.items
    const visibleItems = filteredItems.filter((item) => {
      if (isShowingAll) return true;
      if (item.isCore !== false) return true;
      if (clinicalState.ros.items && clinicalState.ros.items[item.id] !== undefined) return true;
      return false;
    });

    visibleItems.forEach((item) => {
      const cur = clinicalState.ros.items[item.id];
      const chipWrap = renderInlineDetailTriStateChip({
        id: item.id,
        label: getItemDisplayTitle(item) || item.label || item.fa || item.en,
        detailHint: item.detailHint || (getCurrentLanguage() === 'en' ? 'Additional details...' : 'توضیحات تکمیلی...'),
        modifiers: item.modifiers || [],
        subTypes: item.subTypes || [],
        currentItemData: cur,
        onStateChange: (newState, detailText) => {
          if (newState === 0) {
            delete clinicalState.ros.items[item.id];
          } else {
            clinicalState.ros.items[item.id] = { state: newState, detail: detailText, label: item.fa || item.label, en: item.en || '', system: sysKey };
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

    // Toggle button for non-core items
    const hiddenCount = filteredItems.length - visibleItems.length;
    if (hiddenCount > 0 && !isShowingAll) {
      const showBtn = document.createElement('button');
      showBtn.type = 'button';
      showBtn.className = 'btn-show-non-core';
      showBtn.innerHTML = `<span>+</span> <span>نمایش تمام آیتم‌های فرعی این سیستم (${hiddenCount} مورد)</span>`;
      showBtn.addEventListener('click', () => {
        window._rosShowAllMap.add(sysKey);
        renderRosGroups();
      });
      body.appendChild(showBtn);
    } else if (isShowingAll && filteredItems.length > visibleItems.length) {
      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.className = 'btn-show-non-core';
      hideBtn.innerHTML = `<span>−</span> <span>بستن آیتم‌های فرعی این سیستم</span>`;
      hideBtn.addEventListener('click', () => {
        window._rosShowAllMap.delete(sysKey);
        renderRosGroups();
      });
      body.appendChild(hideBtn);
    }

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
    const patientGender = clinicalState.demographics.gender || '';
    const showAllGenders = !!clinicalState.ros.showAllGenders;

    ROS_GROUPS_BILINGUAL.forEach((grp) => {
      grp.items.forEach((item) => {
        if (!showAllGenders && item.gender !== 'all' && patientGender) {
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

  const isEn = getCurrentLanguage() === 'en';

  // Global Toggle All PE Accordions
  const btnToggleAll = document.getElementById('btnToggleAllPe');
  if (btnToggleAll) {
    const allPillars = PE_MANDATORY_PILLARS.map(p => p.systemKey || p.id).filter(Boolean);
    const isAllExpanded = allPillars.length > 0 && allPillars.every(k => window._peExpandedMap.has(k));
    const textSpan = document.getElementById('btnToggleAllPeText');
    if (textSpan) textSpan.textContent = isAllExpanded ? (isEn ? 'Collapse All Pillars' : 'بستن همه ستون‌ها') : (isEn ? 'Expand All Pillars' : 'باز کردن همه ستون‌ها');
    btnToggleAll.onclick = () => {
      if (isAllExpanded) {
        window._peExpandedMap.clear();
      } else {
        allPillars.forEach(k => window._peExpandedMap.add(k));
      }
      renderPeMandatoryPillars();
    };
  }

  PE_MANDATORY_PILLARS.forEach((pillar) => {
    const pillarKey = pillar.systemKey || pillar.id;
    let posCount = 0;
    let negCount = 0;
    let neutralCount = 0;

    pillar.items.forEach((item) => {
      const it = clinicalState.pe.findings[item.id];
      const st = it ? (typeof it === 'object' ? it.state : it) : 0;
      if (st === 1 || st === '+1') posCount++;
      else if (st === -1 || st === '-1') negCount++;
      else neutralCount++;
    });

    // Also include custom gap items in this pillar
    Object.entries(clinicalState.pe.findings || {}).forEach(([k, it]) => {
      if (k.startsWith('pe_gap_') && it && it.system === pillarKey) {
        if (it.state === 1 || it.state === '+1') posCount++;
        else if (it.state === -1 || it.state === '-1') negCount++;
      }
    });

    const isResetState = neutralCount === 0 && negCount > 0;
    const isExpanded = window._peExpandedMap.has(pillarKey);
    const isShowingAll = window._peShowAllMap.has(pillarKey);

    // Normal baseline items: normalState === 1 (positive baseline) & normalState === -1 with isCore (negative baseline)
    const normalPositiveItems = pillar.items.filter((it) => it.normalState === 1 || it.isNormalBaseline === true);
    const normalNegativeCoreItems = pillar.items.filter((it) => it.normalState === -1 && it.isCore !== false);

    const isAllNormal = (normalPositiveItems.length > 0 || normalNegativeCoreItems.length > 0) &&
      normalPositiveItems.every((it) => {
        const f = clinicalState.pe.findings[it.id];
        return f && (typeof f === 'object' ? (f.state === 1 || f.state === '+1') : (f === 1 || f === '+1'));
      }) &&
      normalNegativeCoreItems.every((it) => {
        const f = clinicalState.pe.findings[it.id];
        return f && (typeof f === 'object' ? (f.state === -1 || f.state === '-1') : (f === -1 || f === '-1'));
      });

    const pillarCard = document.createElement('div');
    pillarCard.className = `subsystem-accordion ${isExpanded ? '' : 'is-collapsed'}`;
    pillarCard.id = `pe_pillar_card_${pillarKey}`;
    pillarCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'subsystem-header';

    const headerRight = document.createElement('div');
    headerRight.className = 'subsystem-header-right';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'subsystem-title';
    titleSpan.textContent = isEn ? (pillar.en || pillar.title) : pillar.title;
    headerRight.appendChild(titleSpan);

    if (posCount > 0) {
      const bPos = document.createElement('span');
      bPos.className = 'subsystem-badge-counter pos';
      bPos.textContent = isEn ? `${posCount} Pos` : `${posCount} مثبت`;
      headerRight.appendChild(bPos);
    }
    if (negCount > 0) {
      const bNeg = document.createElement('span');
      bNeg.className = 'subsystem-badge-counter neg';
      bNeg.textContent = isEn ? `${negCount} Neg` : `${negCount} منفی`;
      headerRight.appendChild(bNeg);
    }

    const headerLeft = document.createElement('div');
    headerLeft.className = 'subsystem-header-left';

    // Normal baseline quick-confirm button (Requirement 1.3)
    const btnNormal = document.createElement('button');
    btnNormal.type = 'button';
    btnNormal.className = `btn-system-normal-baseline ${isAllNormal ? 'is-all-normal' : ''}`;
    btnNormal.title = isEn ? 'Record normal baseline findings for this system' : 'ثبت خودکار موارد نرمال و بیس‌لاین سالم این سیستم';
    btnNormal.innerHTML = `<span>${isEn ? '✓ Mark System Normal' : '✓ ثبت معاینه نرمال این سیستم'}</span>`;

    btnNormal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isAllNormal) {
        // Toggle off: clear baseline items
        normalPositiveItems.forEach((it) => delete clinicalState.pe.findings[it.id]);
        normalNegativeCoreItems.forEach((it) => delete clinicalState.pe.findings[it.id]);
      } else {
        // Set normal positive to +1
        normalPositiveItems.forEach((it) => {
          clinicalState.pe.findings[it.id] = {
            state: 1,
            label: it.fa || it.label,
            en: it.en || '',
            system: pillarKey,
            detail: ''
          };
        });
        // Set core normal negative to -1
        normalNegativeCoreItems.forEach((it) => {
          clinicalState.pe.findings[it.id] = {
            state: -1,
            label: it.fa || it.label,
            en: it.en || '',
            system: pillarKey,
            detail: ''
          };
        });
      }
      renderPeMandatoryPillars();
      saveCurrentCase();
      updateLivePreview();
    });
    headerLeft.appendChild(btnNormal);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = `btn-toggle-sub-negatives ${isResetState ? 'is-reset' : ''}`;
    toggleBtn.innerHTML = isResetState
      ? `<span>${isEn ? '↺ Reset Negatives' : '↺ بازنشانی منفی‌ها'}</span>`
      : `<span>${isEn ? '− Mark Rest Neg' : '− منفی کردن بقیه'}</span>`;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const makeNeg = !isResetState;
      pillar.items.forEach((item) => {
        const it = clinicalState.pe.findings[item.id];
        const st = it ? (typeof it === 'object' ? it.state : it) : 0;
        if (makeNeg) {
          if (st === 0) {
            clinicalState.pe.findings[item.id] = { state: -1, detail: '', label: item.fa || item.label, en: item.en || '', system: pillarKey };
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
      if (window._peExpandedMap.has(pillarKey)) {
        window._peExpandedMap.delete(pillarKey);
        pillarCard.classList.add('is-collapsed');
      } else {
        window._peExpandedMap.add(pillarKey);
        pillarCard.classList.remove('is-collapsed');
      }
    });

    pillarCard.appendChild(header);

    const body = document.createElement('div');
    body.className = 'subsystem-body';

    // Core-only by default: show item if isShowingAll || isCore !== false || item has active state in pe.findings
    const visibleItems = pillar.items.filter((item) => {
      if (isShowingAll) return true;
      if (item.isCore !== false) return true;
      if (clinicalState.pe.findings && clinicalState.pe.findings[item.id] !== undefined) return true;
      return false;
    });

    // Group visible items by subGroup
    const subGroupsMap = new Map();
    visibleItems.forEach((item) => {
      const sg = item.subGroup || 'general';
      if (!subGroupsMap.has(sg)) subGroupsMap.set(sg, []);
      subGroupsMap.get(sg).push(item);
    });

    const hasMultipleSubGroups = subGroupsMap.size > 1;

    subGroupsMap.forEach((subItems, sgKey) => {
      const subGroupBlock = document.createElement('div');
      subGroupBlock.className = 'pe-subgroup-block';

      if (hasMultipleSubGroups) {
        const sgMeta = PE_SUBGROUP_TITLES[sgKey];
        const sgTitle = sgMeta ? (isEn ? sgMeta.en : sgMeta.fa) : sgKey;
        const sgHeader = document.createElement('div');
        sgHeader.className = 'pe-subgroup-header';
        sgHeader.textContent = sgTitle;
        subGroupBlock.appendChild(sgHeader);
      }

      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'chips-container';

      subItems.forEach((item) => {
        const cur = clinicalState.pe.findings[item.id];
        const chipWrap = renderInlineDetailTriStateChip({
          id: item.id,
          label: getItemDisplayTitle(item) || item.label || item.fa || item.en,
          detailHint: item.detailHint || (isEn ? 'Additional details...' : 'توضیحات تکمیلی...'),
          modifiers: item.modifiers || [],
          subTypes: item.subTypes || [],
          currentItemData: cur,
          onStateChange: (newState, detailText) => {
            if (newState === 0) {
              delete clinicalState.pe.findings[item.id];
            } else {
              clinicalState.pe.findings[item.id] = { state: newState, detail: detailText, label: item.fa || item.label, en: item.en || '', system: pillarKey };
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

      subGroupBlock.appendChild(chipsContainer);
      body.appendChild(subGroupBlock);
    });

    // Toggle button for non-core items
    const hiddenCount = pillar.items.length - visibleItems.length;
    if (hiddenCount > 0 && !isShowingAll) {
      const showBtn = document.createElement('button');
      showBtn.type = 'button';
      showBtn.className = 'btn-show-non-core';
      showBtn.innerHTML = `<span>+</span> <span>نمایش تمام آیتم‌های فرعی این سیستم (${hiddenCount} مورد)</span>`;
      showBtn.addEventListener('click', () => {
        window._peShowAllMap.add(pillarKey);
        renderPeMandatoryPillars();
      });
      body.appendChild(showBtn);
    } else if (isShowingAll && pillar.items.length > visibleItems.length) {
      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.className = 'btn-show-non-core';
      hideBtn.innerHTML = `<span>−</span> <span>بستن آیتم‌های فرعی این سیستم</span>`;
      hideBtn.addEventListener('click', () => {
        window._peShowAllMap.delete(pillarKey);
        renderPeMandatoryPillars();
      });
      body.appendChild(hideBtn);
    }

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
      btn.innerHTML = `<span>${mod.buttonLabel}</span><span>${getIconSvg('lock', { size: 13 })}</span>`;
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
        <span class="unlocked-module-title">${getIconSvg('unlock', { size: 14 })} ${mod.title}</span>
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
    title.innerHTML = `<span>${getIconSvg('circle-dot', { size: 14 })}</span> <span>معاینه موضعی توده / ضایعه #${idx + 1}</span>`;
    header.appendChild(title);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-mass-exam';
    delBtn.innerHTML = `<span>${getIconSvg('trash', { size: 13 })}</span><span>حذف این کارت معاینه</span>`;
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
      ? 'طبیعی (Normal)'
      : (sysData.selectedTags?.length > 0 || sysData.text ? 'یافته ثبت‌شده' : 'ثبت نشده');
    right.appendChild(badge);

    const left = document.createElement('div');
    left.className = 'pe-system-header-left';

    const btnNormal = document.createElement('button');
    btnNormal.type = 'button';
    btnNormal.className = `btn-mark-system-normal ${sysData.isNormal ? 'is-confirmed' : ''}`;
    btnNormal.innerHTML = `<span></span><span>ثبت معاینه نرمال</span>`;
    btnNormal.title = 'ثبت معاینه کامل طبیعی این سیستم';
    btnNormal.addEventListener('click', (e) => {
      e.stopPropagation();
      sysData.isNormal = !sysData.isNormal;
      sysData.examined = true;
      if (sysData.isNormal) {
        card.classList.add('is-normal-confirmed');
        btnNormal.classList.add('is-confirmed');
        badge.className = 'pe-system-badge badge-normal';
        badge.textContent = 'طبیعی (Normal)';
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
        badge.textContent = sysData.isNormal ? 'طبیعی (Normal)' : (sysData.selectedTags.length > 0 || sysData.text ? 'یافته ثبت‌شده' : 'ثبت نشده');
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
      badge.textContent = sysData.isNormal ? 'طبیعی (Normal)' : (sysData.selectedTags?.length > 0 || sysData.text ? 'یافته ثبت‌شده' : 'ثبت نشده');
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
      toggleBtn.innerHTML = `<span>${getIconSvg('alert-triangle', { size: 14 })}</span> <span>باز کردن ماژول تروما، جراحات نافذ و سوختگی (ATLS Exam)</span>`;
    }
    return;
  }

  if (toggleBtn) {
    toggleBtn.innerHTML = `<span></span> <span>بستن ماژول تروما و ATLS</span>`;
  }

  const card = document.createElement('div');
  card.className = 'atls-exam-card';

  // Primary survey header
  const title = document.createElement('div');
  title.className = 'atls-exam-title';
  title.innerHTML = `<span>${getIconSvg('ambulance', { size: 16 })}</span> <span>ارزیابی اولیه ترومای جراحی (ATLS Primary Survey ABCDE)</span>`;
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
    <span class="subsystem-title" style="font-size: 0.95rem;">ثبت زخم‌ها و جراحات تروما (Wound & Injury Registry)</span>
  `;
  const addWoundBtn = document.createElement('button');
  addWoundBtn.type = 'button';
  addWoundBtn.className = 'btn btn-secondary btn-sm';
  addWoundBtn.innerHTML = `<span></span><span>افزودن زخم / جراحت جدید</span>`;
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
      delBtn.innerHTML = '';
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
      ارزیابی سوختگی، درصد TBSA و آسیب استنشاقی (Burns & Inhalation Injury):
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
      if (!clinicalState.hpi) clinicalState.hpi = { symptoms: {} };
      if (!clinicalState.hpi.symptoms) clinicalState.hpi.symptoms = {};
      cur = clinicalState.hpi.symptoms?.[item.id];
    } else if (sectionType === 'pmh') {
      if (!clinicalState.pmh) clinicalState.pmh = { categories: {}, items: {} };
      const targetCatId = item.catId || (typeof inferPmhCatId === 'function' ? inferPmhCatId(item) : null);
      cur = (targetCatId && clinicalState.pmh.categories?.[targetCatId]?.items?.[item.id]) || clinicalState.pmh.items?.[item.id];
    } else if (sectionType === 'ros') {
      if (!clinicalState.ros) clinicalState.ros = { items: {} };
      if (!clinicalState.ros.items) clinicalState.ros.items = {};
      cur = clinicalState.ros.items?.[item.id];
    } else if (sectionType === 'pe') {
      if (!clinicalState.pe) clinicalState.pe = { findings: {} };
      if (!clinicalState.pe.findings) clinicalState.pe.findings = {};
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
    btnPos.title = getCurrentLanguage() === 'en' ? 'Positive / Present (+1)' : 'مثبت / دارد';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'search-tray-label';
    labelSpan.textContent = getItemDisplayTitle(item) || item.label || item.fa || item.en;
    labelSpan.title = item.en || item.fa || '';

    const btnNeg = document.createElement('button');
    btnNeg.type = 'button';
    btnNeg.className = `search-btn-neg ${st === -1 ? 'active' : ''}`;
    btnNeg.textContent = '−';
    btnNeg.title = getCurrentLanguage() === 'en' ? 'Negative / Denies (-1)' : 'منفی / نفی شد';

    chipRow.appendChild(btnPos);
    chipRow.appendChild(labelSpan);
    chipRow.appendChild(btnNeg);
    itemWrap.appendChild(chipRow);

    // Sub-options / Modifiers
    const rawSub = item.modifiers || item.subTypes || [];
    const subOptions = Array.isArray(rawSub) ? rawSub : (typeof rawSub === 'string' ? rawSub.split(/[,،]\s*/).filter(Boolean) : []);

    let modifierChipsWrap = null;
    if (subOptions.length > 0) {
      modifierChipsWrap = document.createElement('div');
      modifierChipsWrap.className = 'mini-modifier-chips';
      modifierChipsWrap.style.display = st === 1 ? 'flex' : 'none';

      subOptions.forEach((optText) => {
        const chipBtn = document.createElement('button');
        chipBtn.type = 'button';
        chipBtn.className = 'mini-modifier-chip';
        chipBtn.textContent = optText;
        if (det && det.includes(optText)) chipBtn.classList.add('is-selected');

        chipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const curVal = detailInp.value.trim();
          let newVal = '';
          if (curVal.includes(optText)) {
            const parts = curVal.split(/[,،]\s*/).filter((p) => p !== optText && p.length > 0);
            newVal = parts.join('، ');
            chipBtn.classList.remove('is-selected');
          } else {
            newVal = curVal ? `${curVal}، ${optText}` : optText;
            chipBtn.classList.add('is-selected');
          }
          detailInp.value = newVal;
          detailInp.dispatchEvent(new Event('input'));
        });
        modifierChipsWrap.appendChild(chipBtn);
      });
      itemWrap.appendChild(modifierChipsWrap);
    }

    // Inline detail input if positive
    const detailInp = document.createElement('input');
    detailInp.type = 'text';
    detailInp.className = 'search-tray-detail-input';
    detailInp.placeholder = item.detailHint || (getCurrentLanguage() === 'en' ? 'Additional details...' : 'توضیحات تکمیلی (مدت، شدت، سیر...)...');
    detailInp.value = det;
    detailInp.style.display = st === 1 ? 'block' : 'none';

    detailInp.addEventListener('input', (e) => {
      const val = e.target.value;
      if (modifierChipsWrap) {
        modifierChipsWrap.querySelectorAll('.mini-modifier-chip').forEach((btn) => {
          btn.classList.toggle('is-selected', val.includes(btn.textContent));
        });
      }

      if (sectionType === 'hpi') {
        if (!clinicalState.hpi) clinicalState.hpi = { symptoms: {}, presentations: [] };
        if (!clinicalState.hpi.symptoms) clinicalState.hpi.symptoms = {};
        if (!clinicalState.hpi.symptoms[item.id]) {
          clinicalState.hpi.symptoms[item.id] = { state: 1, label: item.fa || item.label, en: item.en || '', detail: '' };
        }
        clinicalState.hpi.symptoms[item.id].detail = val;
      } else if (sectionType === 'pmh') {
        if (!clinicalState.pmh) clinicalState.pmh = { categories: {}, items: {} };
        if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
        if (!clinicalState.pmh.categories) clinicalState.pmh.categories = {};
        const targetCatId = item.catId || (typeof inferPmhCatId === 'function' ? inferPmhCatId(item) : 'pmh_cat_cardio');
        if (!clinicalState.pmh.items[item.id]) {
          clinicalState.pmh.items[item.id] = { state: 1, label: item.label || item.fa || item.en, en: item.en || '', detail: '', catId: targetCatId };
        }
        clinicalState.pmh.items[item.id].detail = val;
        if (!clinicalState.pmh.categories[targetCatId]) {
          clinicalState.pmh.categories[targetCatId] = { status: 'has_positive', items: {} };
        }
        if (!clinicalState.pmh.categories[targetCatId].items[item.id]) {
          clinicalState.pmh.categories[targetCatId].items[item.id] = { state: 1, label: item.label || item.fa || item.en, en: item.en || '', detail: '', catId: targetCatId };
        }
        clinicalState.pmh.categories[targetCatId].items[item.id].detail = val;
        renderPmhCategories();
      } else if (sectionType === 'ros') {
        if (!clinicalState.ros) clinicalState.ros = { items: {} };
        if (!clinicalState.ros.items) clinicalState.ros.items = {};
        const sysKey = item.system || item.group || item.groupKey || 'gastrointestinal_hepatobiliary';
        if (!clinicalState.ros.items[item.id]) {
          clinicalState.ros.items[item.id] = { state: 1, label: item.fa || item.label, en: item.en || '', detail: '', system: sysKey };
        }
        clinicalState.ros.items[item.id].detail = val;
        clinicalState.ros.items[item.id].system = sysKey;
        window._rosExpandedMap.add(sysKey);
        renderRosGroups();
      } else if (sectionType === 'pe') {
        if (!clinicalState.pe) clinicalState.pe = { findings: {} };
        if (!clinicalState.pe.findings) clinicalState.pe.findings = {};
        const pillarKey = item.system || item.pillar || item.pillarKey || 'abdomen_4_pillars';
        if (!clinicalState.pe.findings[item.id]) {
          clinicalState.pe.findings[item.id] = { state: 1, label: item.fa || item.label, en: item.en || '', detail: '', system: pillarKey };
        }
        clinicalState.pe.findings[item.id].detail = val;
        clinicalState.pe.findings[item.id].system = pillarKey;
        window._peExpandedMap.add(pillarKey);
        renderPeMandatoryPillars();
      }
      saveCurrentCase();
      updateLivePreview();
    });

    itemWrap.appendChild(detailInp);

    const applyState = (newState) => {
      if (sectionType === 'hpi') {
        if (!clinicalState.hpi) clinicalState.hpi = { symptoms: {}, presentations: [] };
        if (!clinicalState.hpi.symptoms) clinicalState.hpi.symptoms = {};

        if (item.type === 'pain_qualifier') {
          const activePain = clinicalState.hpi.presentations?.find((p) => p.archetype === 'pain_archetype') || (clinicalState.hpi.painList && clinicalState.hpi.painList[0]);
          const itemText = getItemDisplayTitle(item) || item.fa || item.label;
          if (activePain) {
            if (item.category === 'character') {
              activePain.character = newState === 1 ? itemText : (newState === 0 && activePain.character === itemText ? '' : activePain.character);
            } else if (item.category === 'timing') {
              activePain.timing = newState === 1 ? itemText : (newState === 0 && activePain.timing === itemText ? '' : activePain.timing);
            } else if (item.category === 'onset') {
              activePain.onset = newState === 1 ? itemText : (newState === 0 && activePain.onset === itemText ? '' : activePain.onset);
            } else if (item.category === 'severity') {
              if (newState === 1) activePain.severity = item.en || item.fa || itemText;
            } else if (item.category === 'aggravating') {
              if (!Array.isArray(activePain.aggravating)) activePain.aggravating = [];
              if (newState === 1) {
                if (!activePain.aggravating.includes(itemText)) activePain.aggravating.push(itemText);
              } else {
                activePain.aggravating = activePain.aggravating.filter((x) => x !== itemText);
              }
            } else if (item.category === 'relieving') {
              if (!Array.isArray(activePain.relieving)) activePain.relieving = [];
              if (newState === 1) {
                if (!activePain.relieving.includes(itemText)) activePain.relieving.push(itemText);
              } else {
                activePain.relieving = activePain.relieving.filter((x) => x !== itemText);
              }
            }
            renderHpiPresentations();
          }
          if (newState === 0) {
            delete clinicalState.hpi.symptoms[item.id];
          } else {
            clinicalState.hpi.symptoms[item.id] = {
              state: newState,
              label: item.fa || item.label,
              en: item.en || '',
              detail: detailInp.value,
              type: item.type,
              category: item.category
            };
          }
        } else {
          // hpi_symptom
          if (newState === 0) {
            delete clinicalState.hpi.symptoms[item.id];
          } else {
            clinicalState.hpi.symptoms[item.id] = {
              state: newState,
              label: item.fa || item.label,
              en: item.en || '',
              detail: detailInp.value
            };
          }
        }
      } else if (sectionType === 'pmh') {
        if (!clinicalState.pmh) clinicalState.pmh = { categories: {}, items: {} };
        if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
        if (!clinicalState.pmh.categories) clinicalState.pmh.categories = {};

        const targetCatId = item.catId || (typeof inferPmhCatId === 'function' ? inferPmhCatId(item) : 'pmh_cat_cardio');
        const itemObj = {
          state: newState,
          label: item.label || item.fa || item.en,
          en: item.en || '',
          detail: detailInp.value,
          catId: targetCatId
        };

        if (targetCatId) {
          if (!clinicalState.pmh.categories[targetCatId]) {
            clinicalState.pmh.categories[targetCatId] = { status: 'neutral', items: {} };
          }
          if (newState === 0) {
            delete clinicalState.pmh.categories[targetCatId].items[item.id];
          } else {
            clinicalState.pmh.categories[targetCatId].items[item.id] = itemObj;
            if (newState === 1) {
              clinicalState.pmh.categories[targetCatId].status = 'has_positive';
            }
          }
        }

        if (newState === 0) {
          delete clinicalState.pmh.items[item.id];
        } else {
          clinicalState.pmh.items[item.id] = itemObj;
        }

        renderPmhCategories();
      } else if (sectionType === 'ros') {
        if (!clinicalState.ros) clinicalState.ros = { items: {} };
        if (!clinicalState.ros.items) clinicalState.ros.items = {};
        const sysKey = item.system || item.group || item.groupKey || 'gastrointestinal_hepatobiliary';
        if (newState === 0) {
          delete clinicalState.ros.items[item.id];
        } else {
          clinicalState.ros.items[item.id] = {
            state: newState,
            label: item.fa || item.label,
            en: item.en || '',
            detail: detailInp.value,
            system: sysKey
          };
          window._rosExpandedMap.add(sysKey);
          if (sysKey === 'breast' || item.id === 'ros_gynecomastia' || (item.label && item.label.includes('ژنیکوماستی'))) {
            window._rosBreastEnabledForMale = true;
          }
        }
        renderRosGroups();
      } else if (sectionType === 'pe') {
        if (!clinicalState.pe) clinicalState.pe = { findings: {} };
        if (!clinicalState.pe.findings) clinicalState.pe.findings = {};
        const pillarKey = item.system || item.pillar || item.pillarKey || 'abdomen_4_pillars';
        if (newState === 0) {
          delete clinicalState.pe.findings[item.id];
        } else {
          clinicalState.pe.findings[item.id] = {
            state: newState,
            label: item.fa || item.label,
            en: item.en || '',
            detail: detailInp.value,
            system: pillarKey
          };
          window._peExpandedMap.add(pillarKey);
        }
        renderPeMandatoryPillars();
      }

      saveCurrentCase();
      updateLivePreview();
      btnPos.classList.toggle('active', newState === 1);
      btnNeg.classList.toggle('active', newState === -1);
      itemWrap.classList.toggle('is-positive', newState === 1);
      itemWrap.classList.toggle('is-negative', newState === -1);
      if (modifierChipsWrap) {
        modifierChipsWrap.style.display = newState === 1 ? 'flex' : 'none';
      }
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
  addBtn.innerHTML = `افزودن مستقیم «<strong>${query}</strong>» به عنوان آیتم جدید به این بخش`;
  addBtn.addEventListener('click', () => {
    const customId = `custom_${Date.now()}`;
    if (sectionType === 'hpi') {
      if (!clinicalState.hpi) clinicalState.hpi = { symptoms: {} };
      if (!clinicalState.hpi.symptoms) clinicalState.hpi.symptoms = {};
      clinicalState.hpi.symptoms[customId] = { state: 1, label: query, detail: '' };
    } else if (sectionType === 'pmh') {
      if (!clinicalState.pmh) clinicalState.pmh = { categories: {}, items: {} };
      if (!clinicalState.pmh.items) clinicalState.pmh.items = {};
      if (!clinicalState.pmh.categories) clinicalState.pmh.categories = {};
      const targetCatId = (typeof inferPmhCatId === 'function' ? inferPmhCatId({ id: customId, label: query }) : 'pmh_cat_cardio');
      const itemObj = { state: 1, label: query, detail: '', catId: targetCatId };
      clinicalState.pmh.items[customId] = itemObj;
      if (!clinicalState.pmh.categories[targetCatId]) {
        clinicalState.pmh.categories[targetCatId] = { status: 'has_positive', items: {} };
      }
      clinicalState.pmh.categories[targetCatId].items[customId] = itemObj;
      clinicalState.pmh.categories[targetCatId].status = 'has_positive';
      renderPmhCategories();
      saveCurrentCase();
      updateLivePreview();
    } else if (sectionType === 'ros') {
      if (!clinicalState.ros) clinicalState.ros = { items: {} };
      if (!clinicalState.ros.items) clinicalState.ros.items = {};
      clinicalState.ros.items[customId] = { state: 1, label: query, detail: '' };
      renderRosGroups();
    } else if (sectionType === 'pe') {
      if (!clinicalState.pe) clinicalState.pe = { findings: {} };
      if (!clinicalState.pe.findings) clinicalState.pe.findings = {};
      clinicalState.pe.findings[customId] = { state: 1, label: query, detail: '' };
      renderPeMandatoryPillars();
    }
    saveCurrentCase();
    updateLivePreview();
    addBtn.innerHTML = `«${query}» با موفقیت اضافه شد`;
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
        ${drug.highAlert ? '<span class="dh-tray-high-alert">High-Alert</span>' : ''}
      </div>
      ${drug.brands ? `<div class="dh-tray-brands">نام‌های تجاری: ${drug.brands}</div>` : ''}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${drugEntry.active ? 'active' : ''}`;
    actionBtn.innerHTML = drugEntry.active ? 'فعال (حذف)' : '+ افزودن دارو';

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
      actionBtn.innerHTML = drugEntry.active ? 'فعال (حذف)' : '+ افزودن دارو';
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
  addBtn.innerHTML = `افزودن مستقیم «<strong>${query}</strong>» به عنوان داروی جدید`;
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
    addBtn.innerHTML = `داروی «${query}» با موفقیت اضافه شد`;
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
      <div class="dh-tray-drug-name">${item.label}</div>
      ${item.category ? `<div class="dh-tray-brands">گروه: ${item.category}</div>` : ''}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
    actionBtn.innerHTML = isAdded ? 'افزوده شد' : '+ افزودن به سوابق خانوادگی';

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addFhDisease(item);
      actionBtn.classList.add('active');
      actionBtn.innerHTML = 'افزوده شد';
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
  addBtn.innerHTML = `افزودن مستقیم «<strong>${query}</strong>» به عنوان بیماری خانوادگی جدید`;
  addBtn.addEventListener('click', () => {
    addFhDisease({ id: 'fh_' + Date.now(), label: query, name: query, relatives: ['پدر'], status: 'living' });
    addBtn.innerHTML = `بیماری «${query}» با موفقیت اضافه شد`;
    addBtn.style.borderColor = '#10b981';
    addBtn.style.color = '#10b981';
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function renderPshSearchTray(query, tray, input) {
  const pool = (Array.isArray(MASTER_PSH_SURGERIES_BANK) && MASTER_PSH_SURGERIES_BANK.length > 0)
    ? MASTER_PSH_SURGERIES_BANK
    : (Array.isArray(PSH_SURGICAL_PROCEDURES_BANK) ? PSH_SURGICAL_PROCEDURES_BANK : []);
  const matches = filterSchemaItems(query, pool);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>سوابق جراحی و پروسیجرها (PSH): <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>کلیک روی عمل جهت ثبت در سوابق</span>
  `;
  tray.appendChild(header);

  const list = document.createElement('div');
  list.className = 'search-tray-drugs-list';

  matches.forEach((proc) => {
    const isAdded = (clinicalState.psh?.surgeries || []).some(
      (s) => s.id === proc.id || (s.label || s.procedure) === (proc.label || proc.name)
    );
    const card = document.createElement('div');
    card.className = `dh-tray-card ${isAdded ? 'is-active' : ''}`;

    const topRow = document.createElement('div');
    topRow.className = 'dh-tray-top';

    const info = document.createElement('div');
    info.className = 'dh-tray-main-info';
    info.innerHTML = `
      <div class="dh-tray-drug-name">${proc.label || proc.name} ${proc.en ? `<span class="additional-lab-unit">${proc.en}</span>` : ''}</div>
      ${proc.category ? `<div class="dh-tray-brands">تخصص: ${proc.category}</div>` : ''}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
    actionBtn.innerHTML = isAdded ? 'در جدول موجود است' : '+ افزودن عمل';

    const handleAdd = (e) => {
      e?.stopPropagation();
      addPshSurgeryItem(proc);
      tray.classList.remove('is-active');
      input.value = '';
      showToast(`عمل «${proc.label || proc.name}» به سوابق جراحی افزوده شد.`, 'info');
      setTimeout(() => {
        const rows = document.querySelectorAll('.psh-selected-surgery-row');
        if (rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          const yearInp = lastRow.querySelector('.psh-surg-year-inp');
          if (yearInp) {
            yearInp.focus();
            yearInp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }, 70);
    };

    actionBtn.addEventListener('click', handleAdd);
    card.addEventListener('click', handleAdd);

    topRow.appendChild(actionBtn);
    card.appendChild(topRow);
    list.appendChild(card);
  });

  tray.appendChild(list);

  // Fallback box for arbitrary custom surgery
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `افزودن مستقیم عمل «<strong>${query}</strong>» به سوابق جراحی`;
  addBtn.addEventListener('click', () => {
    const customProc = { id: 'psh_cust_' + Date.now(), label: query, name: query, procedure: query, en: '', year: '', note: '' };
    addPshSurgeryItem(customProc);
    tray.classList.remove('is-active');
    input.value = '';
    showToast(`عمل «${query}» به سوابق جراحی افزوده شد.`, 'info');
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function renderLabSearchTray(query, tray, input) {
  const labPool = (typeof MASTER_ALL_LAB_TESTS !== 'undefined' && Array.isArray(MASTER_ALL_LAB_TESTS) && MASTER_ALL_LAB_TESTS.length > 0)
    ? MASTER_ALL_LAB_TESTS
    : EXTENDED_LAB_DATABASE;
  const matches = filterSchemaItems(query, labPool);

  const header = document.createElement('div');
  header.className = 'search-tray-header';
  header.innerHTML = `
    <span>نتایج جستجوی جامع آزمایشگاه: <span class="search-tray-count">${matches.length} مورد</span></span>
    <span>روی آزمایش کلیک کنید تا در پنل تخصصی‌اش قرار گیرد</span>
  `;
  tray.appendChild(header);

  const list = document.createElement('div');
  list.className = 'search-tray-drugs-list';

  matches.forEach((test) => {
    const curVal = clinicalState.paraclinics?.labs?.[test.id];
    const isAdded = curVal !== undefined && curVal !== null && String(curVal).trim() !== '';
    const card = document.createElement('div');
    card.className = `dh-tray-card ${isAdded ? 'is-active' : ''}`;

    const topRow = document.createElement('div');
    topRow.className = 'dh-tray-top';

    const info = document.createElement('div');
    info.className = 'dh-tray-main-info';
    const rangeText = test.normalRange ? `[نرمال: ${test.normalRange}]` : ((test.min !== undefined && test.max !== undefined) ? `[نرمال: ${test.min}-${test.max}]` : '');
    info.innerHTML = `
      <div class="dh-tray-drug-name">${test.label} ${test.unit ? `<span class="additional-lab-unit">${test.unit}</span>` : ''}</div>
      ${test.category ? `<div class="dh-tray-brands">پنل: ${test.category} ${rangeText}</div>` : (rangeText ? `<div class="dh-tray-brands">${rangeText}</div>` : '')}
    `;
    topRow.appendChild(info);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
    actionBtn.innerHTML = isAdded ? 'در جدول موجود است' : '+ افزودن به پنل مربوطه';

    const handleAdd = (e) => {
      e?.stopPropagation();
      const pId = test.panel || (SURGICAL_LAB_PANELS.find(p => p.allTests && p.allTests.some(t => t.id === test.id))?.id) || 'biochem_renal';
      window._labExpandedMap.add(pId);
      window._activeLabTests = window._activeLabTests || new Set();
      window._activeLabTests.add(test.id);

      const pObj = SURGICAL_LAB_PANELS.find(p => p.id === pId);
      if (pObj && pObj.allTests && !pObj.allTests.some(t => t.id === test.id)) {
        pObj.allTests.push(test);
      }

      renderParaclinicLabs();

      setTimeout(() => {
        const inp = document.getElementById('lab_inp_' + test.id);
        if (inp) {
          inp.focus();
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inp.classList.remove('input-focus-pulse');
          void inp.offsetWidth;
          inp.classList.add('input-focus-pulse');
        }
      }, 70);

      tray.classList.remove('is-active');
      input.value = '';
      showToast(`آزمایش «${test.label}» در پنل تخصصی خود قرار گرفت.`, 'info');
    };

    actionBtn.addEventListener('click', handleAdd);
    card.addEventListener('click', handleAdd);

    topRow.appendChild(actionBtn);
    card.appendChild(topRow);
    list.appendChild(card);
  });

  tray.appendChild(list);

  // Fallback box for arbitrary custom lab test
  const fallbackBox = document.createElement('div');
  fallbackBox.className = 'search-tray-fallback-box';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'search-tray-add-btn';
  addBtn.innerHTML = `افزودن مستقیم «<strong>${query}</strong>» به پنل آزمایش‌ها`;
  addBtn.addEventListener('click', () => {
    const customId = 'lab_cust_' + Date.now();
    const customTest = { id: customId, label: query, name: query, unit: '', min: 0, max: 9999, panel: 'biochem_renal' };
    EXTENDED_LAB_DATABASE.push(customTest);
    const p = SURGICAL_LAB_PANELS.find(x => x.id === 'biochem_renal');
    if (p) p.allTests.push(customTest);
    window._labExpandedMap.add('biochem_renal');
    window._activeLabTests = window._activeLabTests || new Set();
    window._activeLabTests.add(customId);
    renderParaclinicLabs();
    setTimeout(() => {
      const inp = document.getElementById('lab_inp_' + customId);
      if (inp) {
        inp.focus();
        inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inp.classList.remove('input-focus-pulse');
        void inp.offsetWidth;
        inp.classList.add('input-focus-pulse');
      }
    }, 70);
    tray.classList.remove('is-active');
    input.value = '';
    showToast(`آزمایش «${query}» به پنل آزمایش‌ها افزوده شد.`, 'info');
  });
  fallbackBox.appendChild(addBtn);
  tray.appendChild(fallbackBox);
}

function initSchemaOmnisearch() {
  const searchInputs = document.querySelectorAll('.tag-quick-search-input');

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
      } else if (input.id === 'pshQuickSearchInput' || targetSection === '#tab-psh' || targetSection === '#cardPshHistory') {
        renderPshSearchTray(query, tray, input);
      } else if (targetSection === '#tab-dh') {
        renderDrugSearchTray(query, tray, input);
      } else if (targetSection === '#tab-fh' || input.id === 'fhQuickSearchInput') {
        renderFhSearchTray(query, tray, input);
      } else if (targetSection === '#tab-pmh') {
        renderTriStateSearchTray(query, tray, input, ALL_MASTER_PMH_ITEMS, 'pmh');
      } else if (targetSection === '#tab-ros') {
        renderTriStateSearchTray(query, tray, input, MASTER_ROS_BANK, 'ros');
      } else if (targetSection === '#tab-pe') {
        renderTriStateSearchTray(query, tray, input, MASTER_PE_BANK, 'pe');
      } else {
        renderTriStateSearchTray(query, tray, input, HPI_ASSOCIATED_SYMPTOMS, 'hpi');
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

  const isEn = getCurrentLanguage() === 'en';
  const panels = Array.isArray(SURGICAL_LAB_PANELS) && SURGICAL_LAB_PANELS.length > 0 ? SURGICAL_LAB_PANELS : CORE_ROUTINE_LAB_GROUPS;

  const btnToggleAll = document.getElementById('btnToggleAllLabs');
  if (btnToggleAll) {
    const isAllExpanded = panels.length > 0 && panels.every((p) => window._labExpandedMap.has(p.id));
    const textSpan = document.getElementById('btnToggleAllLabsText');
    if (textSpan) textSpan.textContent = isAllExpanded ? (isEn ? 'Collapse All Panels' : 'بستن همه پنل‌ها') : (isEn ? 'Expand All Panels' : 'باز کردن همه پنل‌ها');
    btnToggleAll.onclick = () => {
      if (isAllExpanded) {
        window._labExpandedMap.clear();
      } else {
        panels.forEach((p) => window._labExpandedMap.add(p.id));
      }
      renderParaclinicLabs();
    };
  }

  panels.forEach((panel) => {
    const pId = panel.id;
    const isExpanded = window._labExpandedMap.has(pId);
    const isShowingAll = window._labShowAllMap.has(pId);
    const defTests = panel.allTests || panel.tests || [];
    const coreIds = panel.coreTestIds || defTests.filter((t) => t.isCore !== false).map((t) => t.id);

    // Active count in this panel
    let activeCount = 0;
    defTests.forEach((t) => {
      const v = clinicalState.paraclinics?.labs?.[t.id];
      if (v !== undefined && v !== null && String(v).trim() !== '') activeCount++;
    });
    Object.entries(clinicalState.paraclinics?.additionalLabs || {}).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && v.panel === pId) {
        if (v.value !== undefined && String(v.value).trim() !== '') activeCount++;
      }
    });

    const panelCard = document.createElement('div');
    panelCard.className = `subsystem-accordion ${isExpanded ? '' : 'is-collapsed'}`;
    panelCard.id = `lab_panel_card_${pId}`;
    panelCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'subsystem-header';

    const headerRight = document.createElement('div');
    headerRight.className = 'subsystem-header-right';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'subsystem-title';
    titleSpan.textContent = isEn ? (panel.en || panel.title) : panel.title;
    headerRight.appendChild(titleSpan);

    if (activeCount > 0) {
      const bCount = document.createElement('span');
      bCount.className = 'subsystem-badge-counter lab-count';
      bCount.textContent = isEn ? `${activeCount} Tests` : `${activeCount} آزمایش ثبت‌شده`;
      headerRight.appendChild(bCount);
    }

    const headerLeft = document.createElement('div');
    headerLeft.className = 'subsystem-header-left';

    const chevron = document.createElement('span');
    chevron.className = 'subsystem-chevron';
    chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    headerLeft.appendChild(chevron);

    header.appendChild(headerRight);
    header.appendChild(headerLeft);

    header.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      if (window._labExpandedMap.has(pId)) {
        window._labExpandedMap.delete(pId);
        panelCard.classList.add('is-collapsed');
      } else {
        window._labExpandedMap.add(pId);
        panelCard.classList.remove('is-collapsed');
      }
    });

    panelCard.appendChild(header);

    const body = document.createElement('div');
    body.className = 'subsystem-body';

    const grid = document.createElement('div');
    grid.className = 'lab-tests-grid';

    // Filter tests: core tests + tests with values + tests in _activeLabTests + (all if isShowingAll)
    const visibleTests = defTests.filter((t) => {
      if (isShowingAll) return true;
      if (coreIds.includes(t.id)) return true;
      const v = clinicalState.paraclinics?.labs?.[t.id];
      if (v !== undefined && v !== null && String(v).trim() !== '') return true;
      if (window._activeLabTests && window._activeLabTests.has(t.id)) return true;
      return false;
    });

    visibleTests.forEach((t) => {
      const val = clinicalState.paraclinics?.labs?.[t.id] !== undefined
        ? clinicalState.paraclinics.labs[t.id]
        : (clinicalState.paraclinics?.additionalLabs?.[t.id]?.value || '');
      const mini = document.createElement('div');
      mini.className = 'lab-mini-card';
      mini.dataset.id = t.id;

      const rangePlaceholder = (t.min !== undefined && t.max !== undefined) ? `${t.min}-${t.max}` : (t.normalRange || '');
      mini.innerHTML = `
        <div class="lab-mini-header">
          <span class="lab-mini-label">${isEn ? (t.en || t.label) : t.label}</span>
          <span class="lab-mini-unit">${t.unit || ''}</span>
        </div>
        <div class="lab-mini-input-row">
          <input type="text" class="lab-mini-input" id="lab_inp_${t.id}" placeholder="${rangePlaceholder}" value="${val}">
        </div>
      `;

      const input = mini.querySelector('.lab-mini-input');

      function updateFlag(valStr) {
        mini.classList.remove('flag-high', 'flag-low');
        const oldBadge = mini.querySelector('.lab-flag-badge');
        if (oldBadge) oldBadge.remove();
        const num = parseFloat(valStr);
        if (!isNaN(num) && valStr.trim() !== '' && t.min !== undefined && t.max !== undefined) {
          const hdr = mini.querySelector('.lab-mini-header');
          if (num > t.max) {
            mini.classList.add('flag-high');
            if (hdr) {
              const b = document.createElement('span');
              b.className = 'lab-flag-badge flag-h';
              b.textContent = 'H';
              hdr.appendChild(b);
            }
          } else if (num < t.min) {
            mini.classList.add('flag-low');
            if (hdr) {
              const b = document.createElement('span');
              b.className = 'lab-flag-badge flag-l';
              b.textContent = 'L';
              hdr.appendChild(b);
            }
          }
        }
      }
      updateFlag(val);

      input.addEventListener('input', (e) => {
        const newVal = e.target.value;
        if (!clinicalState.paraclinics.labs) clinicalState.paraclinics.labs = {};
        clinicalState.paraclinics.labs[t.id] = newVal;
        updateFlag(newVal);
        saveCurrentCase();
        updateLivePreview();
      });

      grid.appendChild(mini);
    });

    body.appendChild(grid);

    // Toggle button for non-core tests
    const hiddenCount = defTests.length - visibleTests.length;
    if (hiddenCount > 0 && !isShowingAll) {
      const showBtn = document.createElement('button');
      showBtn.type = 'button';
      showBtn.className = 'btn-show-non-core';
      showBtn.innerHTML = `<span>+</span> <span>${isEn ? `Show all secondary tests in this panel (${hiddenCount} more)` : `نمایش تمام آزمایش‌های فرعی این پنل (${hiddenCount} مورد)`}</span>`;
      showBtn.addEventListener('click', () => {
        window._labShowAllMap.add(pId);
        renderParaclinicLabs();
      });
      body.appendChild(showBtn);
    } else if (isShowingAll && defTests.length > coreIds.length) {
      const hideBtn = document.createElement('button');
      hideBtn.type = 'button';
      hideBtn.className = 'btn-show-non-core';
      hideBtn.innerHTML = `<span>−</span> <span>${isEn ? 'Collapse secondary tests in this panel' : 'بستن آزمایش‌های فرعی این پنل'}</span>`;
      hideBtn.addEventListener('click', () => {
        window._labShowAllMap.delete(pId);
        renderParaclinicLabs();
      });
      body.appendChild(hideBtn);
    }

    panelCard.appendChild(body);
    container.appendChild(panelCard);
  });

  // Quick Panels Wiring
  const btnVbg = document.getElementById('btnAddVbgPanel');
  if (btnVbg && !btnVbg.dataset.bound) {
    btnVbg.dataset.bound = 'true';
    btnVbg.addEventListener('click', () => {
      window._labExpandedMap.add('vbg_abg');
      renderParaclinicLabs();
      const el = document.getElementById('lab_panel_card_vbg_abg');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('پنل گازهای خونی (VBG / ABG) باز شد.', 'info');
    });
  }

  const btnUa = document.getElementById('btnAddUaPanel');
  if (btnUa && !btnUa.dataset.bound) {
    btnUa.dataset.bound = 'true';
    btnUa.addEventListener('click', () => {
      window._labExpandedMap.add('ua_uc');
      renderParaclinicLabs();
      const el = document.getElementById('lab_panel_card_ua_uc');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('پنل آنالیز و کشت ادرار (U/A & U/C) باز شد.', 'info');
    });
  }

  document.getElementById('paraclinicLabNote')?.addEventListener('input', (e) => {
    clinicalState.paraclinics.labNote = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
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
    delBtn.innerHTML = '';
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
    btn.innerHTML = `<span></span><span>${mod.label}</span>`;
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
        <span>${getIconSvg('camera', { size: 14 })}</span>
        <span>${rep.modalityLabel}</span>
      </div>
      <button type="button" class="btn-delete-imaging" title="حذف این نوبت">حذف</button>
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

export function renderRosGapChips() {
  const container = document.getElementById('rosCustomGapChips');
  if (!container) return;
  container.innerHTML = '';
  const entries = Object.entries(clinicalState.ros?.items || {}).filter(([k, v]) => k.startsWith('ros_gap_'));
  entries.forEach(([id, item]) => {
    const isPos = item.state === 1 || item.state === '+1';
    const chip = document.createElement('div');
    chip.className = `gap-custom-chip ${isPos ? 'is-pos' : 'is-neg'}`;
    chip.innerHTML = `
      <span>${isPos ? '+' : '−'}</span>
      <span>${item.label || id}</span>
      <button type="button" class="gap-custom-chip-del" title="حذف">×</button>
    `;
    chip.querySelector('.gap-custom-chip-del').addEventListener('click', () => {
      delete clinicalState.ros.items[id];
      renderRosGapChips();
      renderRosGroups();
      saveCurrentCase();
      updateLivePreview();
    });
    container.appendChild(chip);
  });
}

export function renderPeGapChips() {
  const container = document.getElementById('peCustomGapChips');
  if (!container) return;
  container.innerHTML = '';
  const entries = Object.entries(clinicalState.pe?.findings || {}).filter(([k, v]) => k.startsWith('pe_gap_'));
  entries.forEach(([id, item]) => {
    const isPos = item.state === 1 || item.state === '+1';
    const chip = document.createElement('div');
    chip.className = `gap-custom-chip ${isPos ? 'is-pos' : 'is-neg'}`;
    chip.innerHTML = `
      <span>${isPos ? '+' : '−'}</span>
      <span>${item.label || id}</span>
      <button type="button" class="gap-custom-chip-del" title="حذف">×</button>
    `;
    chip.querySelector('.gap-custom-chip-del').addEventListener('click', () => {
      delete clinicalState.pe.findings[id];
      renderPeGapChips();
      renderPeMandatoryPillars();
      saveCurrentCase();
      updateLivePreview();
    });
    container.appendChild(chip);
  });
}

/* ==========================================================================
   System Gap Loggers & Clean Unified Note Inputs
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
      const tgt = target();
      if (tgt) {
        tgt.systemGapNote = e.target.value;
      }
      saveCurrentCase();
      updateLivePreview();
    });
  });

  // ROS Gap Logger with system dropdown and +/- buttons
  const rosInp = document.getElementById('rosSystemGapInput');
  const rosSel = document.getElementById('rosSystemGapSelect');
  const btnRosPos = document.getElementById('btnRosGapAddPos');
  const btnRosNeg = document.getElementById('btnRosGapAddNeg');

  const addRosGap = (stateVal) => {
    const text = (rosInp?.value || '').trim();
    const selSys = rosSel?.value || 'gastrointestinal_hepatobiliary';
    if (!text) return;
    const id = 'ros_gap_' + Date.now();
    if (!clinicalState.ros) clinicalState.ros = { items: {} };
    if (!clinicalState.ros.items) clinicalState.ros.items = {};
    clinicalState.ros.items[id] = {
      state: stateVal,
      label: text,
      en: text,
      system: selSys,
      detail: ''
    };
    window._rosExpandedMap.add(selSys);
    if (rosInp) rosInp.value = '';
    renderRosGapChips();
    renderRosGroups();
    saveCurrentCase();
    updateLivePreview();
    showToast(`علامت «${text}» به سیستم مربوطه ثبت شد.`, 'info');
  };

  btnRosPos?.addEventListener('click', () => addRosGap(1));
  btnRosNeg?.addEventListener('click', () => addRosGap(-1));
  rosInp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRosGap(1);
    }
  });

  // PE Gap Logger with system dropdown and +/- buttons
  const peInp = document.getElementById('peSystemGapInput');
  const peSel = document.getElementById('peSystemGapSelect');
  const btnPePos = document.getElementById('btnPeGapAddPos');
  const btnPeNeg = document.getElementById('btnPeGapAddNeg');

  const addPeGap = (stateVal) => {
    const text = (peInp?.value || '').trim();
    const selSys = peSel?.value || 'abdomen_4_pillars';
    if (!text) return;
    const id = 'pe_gap_' + Date.now();
    if (!clinicalState.pe) clinicalState.pe = { findings: {} };
    if (!clinicalState.pe.findings) clinicalState.pe.findings = {};
    clinicalState.pe.findings[id] = {
      state: stateVal,
      label: text,
      en: text,
      system: selSys,
      detail: ''
    };
    window._peExpandedMap.add(selSys);
    if (peInp) peInp.value = '';
    renderPeGapChips();
    renderPeMandatoryPillars();
    saveCurrentCase();
    updateLivePreview();
    showToast(`یافته «${text}» به ستون مربوطه ثبت شد.`, 'info');
  };

  btnPePos?.addEventListener('click', () => addPeGap(1));
  btnPeNeg?.addEventListener('click', () => addPeGap(-1));
  peInp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPeGap(1);
    }
  });

  renderRosGapChips();
  renderPeGapChips();

  // Single clean note fields (Tab 3 PSH & Tab 4 DH, AH, SH, FH)
  const singleNoteMap = [
    { inputId: 'pshNote', target: () => clinicalState.psh },
    { inputId: 'dhNote', target: () => clinicalState.dh },
    { inputId: 'ahNote', target: () => clinicalState.ah },
    { inputId: 'shNote', target: () => clinicalState.sh },
    { inputId: 'fhNote', target: () => clinicalState.fh }
  ];

  singleNoteMap.forEach(({ inputId, target }) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const tgt = target();
      if (tgt) {
        tgt.note = e.target.value;
      }
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

  // Sync demographics table on live medical chart paper (bilingual support)
  const isEn = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() === 'en' : false;

  const chartPtName = document.getElementById('chartPtName');
  if (chartPtName) chartPtName.textContent = clinicalState.demographics?.fullName || '—';

  const chartPtAgeGender = document.getElementById('chartPtAgeGender');
  if (chartPtAgeGender) {
    const ageStr = clinicalState.demographics?.age
      ? (isEn ? `${clinicalState.demographics.age} y/o` : `${clinicalState.demographics.age} ساله`)
      : '—';
    const genStr = clinicalState.demographics?.gender === 'female'
      ? (isEn ? 'Female' : 'خانم')
      : clinicalState.demographics?.gender === 'male'
      ? (isEn ? 'Male' : 'آقا')
      : '—';
    chartPtAgeGender.textContent = `${ageStr} / ${genStr}`;
  }

  const chartPtWardBed = document.getElementById('chartPtWardBed');
  if (chartPtWardBed) {
    const wardStr = clinicalState.demographics?.ward || (isEn ? 'Surgery' : 'جراحی');
    const bedStr = clinicalState.demographics?.bed || '—';
    chartPtWardBed.textContent = isEn ? `${wardStr} • Bed ${bedStr}` : `${wardStr} • تخت ${bedStr}`;
  }

  const chartPtCaseId = document.getElementById('chartPtCaseId');
  if (chartPtCaseId) chartPtCaseId.textContent = clinicalState.caseId || '—';

  const chartPtDate = document.getElementById('chartPtDate');
  if (chartPtDate) {
    chartPtDate.textContent = clinicalState.demographics?.admissionDate || (isEn ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('fa-IR'));
  }

  updateSectionCounters();

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
  if (document.getElementById('demoGender')) document.getElementById('demoGender').value = d.gender || '';
  if (document.getElementById('demoAge')) document.getElementById('demoAge').value = d.age || '';
  if (document.getElementById('demoMarital')) document.getElementById('demoMarital').value = d.marital || '';
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
    if (icon) icon.textContent = isTraumaUnresponsive ? '' : '';
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
  document.getElementById('btnPshNoPriorSurgeries')?.classList.toggle('is-confirmed', !!clinicalState.psh?.noSurgeries);
  if (document.getElementById('pshNoSurgeriesIcon')) document.getElementById('pshNoSurgeriesIcon').textContent = clinicalState.psh?.noSurgeries ? '✓' : '−';
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
  renderRosGapChips();
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
  renderPeGapChips();
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
    const curName = clinicalState.demographics?.fullName || 'بیمار جاری';
    if (confirm(`آیا مایل به ثبت پرونده جدید هستید؟ پرونده «${curName}» در شیفت ذخیره می‌شود.`)) {
      saveCaseToShiftVault(clinicalState);
      clinicalState = createDefaultClinicalState();
      saveCurrentCase();
      syncDomFromState();
      updateLivePreview();
      updateShiftCasesCount();
      populateHeaderCaseSwitcher();
      showToast('پرونده جدید با موفقیت ایجاد شد.', 'info');
    }
  });
}

export function extractCaseChiefComplaint(c, isEn = false) {
  if (!c) return isEn ? 'Unspecified complaint' : 'شکایت ثبت‌نشده';
  if (c.cc?.patientQuote && c.cc.patientQuote.trim()) {
    return c.cc.patientQuote.trim();
  }
  if (c.cc?.ccPhrase && c.cc.ccPhrase.trim()) {
    return c.cc.ccPhrase.trim();
  }
  if (c.cc?.establishedDiagnosis && c.cc.establishedDiagnosis.trim()) {
    return c.cc.establishedDiagnosis.trim();
  }
  if (Array.isArray(c.hpi?.presentations) && c.hpi.presentations.length > 0) {
    const p0 = c.hpi.presentations[0];
    const pTitle = p0.title && !p0.title.startsWith('مواجهه') && !p0.title.startsWith('Focus') ? p0.title : '';
    const pSite = p0.site || '';
    if (pTitle && pSite) return `${pTitle} (${pSite})`;
    if (pSite) return isEn ? `Pain at ${pSite}` : `درد در ناحیه ${pSite}`;
    if (pTitle) return pTitle;
  }
  if (Array.isArray(c.hpi?.painList) && c.hpi.painList.length > 0) {
    const p0 = c.hpi.painList[0];
    if (p0.site) return isEn ? `Pain at ${p0.site}` : `درد در ناحیه ${p0.site}`;
    if (p0.title) return p0.title;
  }
  return isEn ? 'Unspecified complaint' : 'شکایت ثبت‌نشده';
}

export function extractCaseAgeGender(c, isEn = false) {
  if (!c || !c.demographics) return isEn ? 'Age/Gender Unset' : 'سن و جنسیت ثبت‌نشده';
  const age = (c.demographics.age || '').toString().trim();
  const gender = c.demographics.gender;
  let gLabel = '';
  if (gender === 'male') gLabel = isEn ? 'Male' : 'مرد';
  else if (gender === 'female') gLabel = isEn ? 'Female' : 'زن';

  if (age && gLabel) {
    return isEn ? `${age} y/o (${gLabel})` : `${age} ساله (${gLabel})`;
  } else if (age) {
    return isEn ? `${age} y/o` : `${age} ساله`;
  } else if (gLabel) {
    return gLabel;
  }
  return isEn ? 'Age/Gender Unset' : 'سن و جنسیت ثبت‌نشده';
}

export function getDeduplicatedShiftCases() {
  const casesMap = new Map();

  // 1. Permanent Vault
  if (typeof storageVault !== 'undefined') {
    try {
      const permCases = storageVault.getAllArchivedCasesSync();
      if (Array.isArray(permCases)) {
        permCases.forEach(c => {
          if (c && c.caseId) casesMap.set(c.caseId, c);
        });
      }
    } catch (_) {}
  }

  // 2. LocalStorage shift key
  try {
    const raw = localStorage.getItem(STORAGE_SHIFT_CASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          if (c && c.caseId && !casesMap.has(c.caseId)) {
            casesMap.set(c.caseId, c);
          }
        });
      }
    }
  } catch (_) {}

  // 3. Current active state always present and up-to-date
  if (clinicalState && clinicalState.caseId) {
    casesMap.set(clinicalState.caseId, clinicalState);
  }

  return Array.from(casesMap.values());
}

function saveCaseToShiftVault(stateToSave) {
  if (!stateToSave || !stateToSave.caseId) return;
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    const copy = JSON.parse(JSON.stringify(stateToSave));
    const idx = list.findIndex(c => c && c.caseId === stateToSave.caseId);
    if (idx >= 0) {
      list[idx] = copy;
    } else {
      list.unshift(copy);
    }
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
    const cases = getDeduplicatedShiftCases();
    select.innerHTML = '';

    const curName = clinicalState.demographics?.fullName || 'بیمار بدون نام';
    const curAgeGender = extractCaseAgeGender(clinicalState);
    const curCc = extractCaseChiefComplaint(clinicalState);
    const currentOpt = document.createElement('option');
    currentOpt.value = clinicalState.caseId;
    currentOpt.textContent = `🟢 پرونده فعال: ${curName} (${curAgeGender}) - ${curCc} [${clinicalState.caseId}]`;
    currentOpt.selected = true;
    select.appendChild(currentOpt);

    cases.forEach(c => {
      if (!c || !c.caseId || c.caseId === clinicalState.caseId) return;
      const opt = document.createElement('option');
      opt.value = c.caseId;
      const patName = c.demographics?.fullName || 'بیمار بدون نام';
      const patAgeGender = extractCaseAgeGender(c);
      const patCc = extractCaseChiefComplaint(c);
      opt.textContent = `${patName} (${patAgeGender}) - ${patCc} [${c.caseId}]`;
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
      const allCases = getDeduplicatedShiftCases();
      const targetCase = allCases.find(c => c && c.caseId === selectedId);

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
          reasoning: { ...defaults.reasoning, ...(targetCase.reasoning || {}) },
          atls: { ...defaults.atls, ...(targetCase.atls || {}) }
        };

        if (Array.isArray(targetCase.hpi?.presentations) && targetCase.hpi.presentations.length > 0) {
          clinicalState.hpi.presentations = targetCase.hpi.presentations;
        }
        if (Array.isArray(targetCase.hpi?.painList) && targetCase.hpi.painList.length > 0) {
          clinicalState.hpi.painList = targetCase.hpi.painList;
        }

        saveCurrentCase();
        syncDomFromState();
        updateLivePreview();
        updateShiftCasesCount();
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
    const allCases = getDeduplicatedShiftCases();
    const countEl = document.getElementById('shiftCasesCount');
    if (countEl) countEl.textContent = allCases.length;
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
          parsed.forEach((item) => {
            if (item && item.caseId) {
              const idx = list.findIndex(c => c && c.caseId === item.caseId);
              if (idx >= 0) list[idx] = item;
              else list.unshift(item);
            }
          });
        } else if (parsed && typeof parsed === 'object' && parsed.caseId) {
          const idx = list.findIndex(c => c && c.caseId === parsed.caseId);
          if (idx >= 0) list[idx] = parsed;
          else list.unshift(parsed);
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
      localStorage.removeItem('SURG_SCRIBE_PERMANENT_CASES_VAULT');
      // Keep only current active case
      saveCaseToShiftVault(clinicalState);
      updateShiftCasesCount();
      renderShiftCasesList();
      showToast(getCurrentLanguage() === 'en' ? 'Shift history cleared.' : 'تاریخچه شیفت با موفقیت پاکسازی شد.', 'info');
    }
  });

  function createShiftCaseItemDom(c, isActive, isEn) {
    const patientName = c.demographics?.fullName?.trim() || (isEn ? 'Unnamed Patient' : 'بیمار بدون نام');
    const ageGenderStr = extractCaseAgeGender(c, isEn);
    const chiefComplaintStr = extractCaseChiefComplaint(c, isEn);

    let wardBed = '';
    if (c.demographics?.ward && c.demographics?.bed) {
      wardBed = isEn ? `Ward: ${c.demographics.ward} | Bed: ${c.demographics.bed}` : `بخش: ${c.demographics.ward} | تخت: ${c.demographics.bed}`;
    } else if (c.demographics?.ward) {
      wardBed = isEn ? `Ward: ${c.demographics.ward}` : `بخش: ${c.demographics.ward}`;
    } else if (c.demographics?.bed) {
      wardBed = isEn ? `Bed: ${c.demographics.bed}` : `تخت: ${c.demographics.bed}`;
    }

    const timeFormatted = c.updatedAt
      ? new Date(c.updatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      : (c.createdAt ? new Date(c.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—');

    const item = document.createElement('div');
    item.className = `shift-vault-item ${isActive ? 'is-active-case' : ''}`;
    item.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      background: var(--bg-surface, #ffffff);
      border: 1.5px solid ${isActive ? 'var(--primary, #0284c7)' : 'var(--border-subtle, #e2e8f0)'};
      box-shadow: ${isActive ? '0 2px 8px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)'};
      transition: all 0.2s ease;
    `;

    item.innerHTML = `
      <div class="shift-vault-info" style="flex: 1; padding-inline-end: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
          ${isActive ? `<span class="shift-active-tag" style="background:var(--primary, #0284c7); color:#fff; padding:0.15rem 0.5rem; border-radius:4px; font-size:0.72rem; font-weight:700;">🟢 پرونده جاری فعال</span>` : ''}
          <strong class="shift-vault-case-id" style="font-size:0.85rem; color:var(--primary, #0284c7); font-family:var(--font-mono, monospace);">${c.caseId}</strong>
          <span style="font-weight:700; font-size:0.95rem; color:var(--text-primary); margin-inline-start:0.25rem;">👤 ${patientName}</span>
          <span style="background:rgba(2,132,199,0.1); color:var(--primary, #0284c7); padding:0.12rem 0.45rem; border-radius:4px; font-size:0.75rem; font-weight:600;">🎂 ${ageGenderStr}</span>
          ${wardBed ? `<span style="font-size:0.75rem; color:var(--text-muted); background:var(--bg-surface-elevated, #f1f5f9); padding:0.1rem 0.45rem; border-radius:4px;">🏥 ${wardBed}</span>` : ''}
        </div>
        <div class="shift-vault-cc" style="font-size:0.84rem; color:var(--text-secondary); margin-top:0.25rem; display:flex; align-items:flex-start; gap:0.4rem;">
          <span style="font-weight:700; color:var(--text-primary); min-width:fit-content;">🩺 شکایت اصلی:</span>
          <span style="color:var(--text-primary); font-weight:500;">${chiefComplaintStr}</span>
        </div>
        <div class="shift-vault-time" style="font-size:0.72rem; color:var(--text-muted); margin-top:0.3rem;">
          🕒 آخرین تغییر: ${timeFormatted}
        </div>
      </div>
      <div class="shift-vault-actions" style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
        ${isActive
          ? `<span style="font-size:0.75rem; color:var(--primary, #0284c7); font-weight:700; padding:0.3rem 0.6rem; background:rgba(2,132,199,0.1); border-radius:6px;">در حال تکمیل</span>`
          : `<button type="button" class="btn btn-primary btn-sm btn-load-case" style="font-weight:600; padding:0.35rem 0.75rem; font-size:0.8rem; cursor:pointer;">📥 ${isEn ? 'Load Case' : 'بارگذاری پرونده'}</button>`
        }
        <button type="button" class="btn btn-secondary btn-sm ${isActive ? 'btn-delete-active-case' : 'btn-delete-case'}" style="color:#ef4444; border-color:rgba(239,68,68,0.3); padding:0.35rem 0.55rem; cursor:pointer;" title="${isEn ? 'Permanently Delete' : 'حذف قطعی پرونده'}">🗑️</button>
      </div>
    `;

    if (isActive) {
      item.querySelector('.btn-delete-active-case')?.addEventListener('click', async () => {
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
    } else {
      item.querySelector('.btn-load-case')?.addEventListener('click', () => {
        const confirmLoad = isEn
          ? `Load case ${c.caseId}? (Current case will be saved to shift vault)`
          : `آیا مایل به بارگذاری پرونده «${patientName} (${c.caseId})» هستید؟ (پرونده فعلی در شیفت ذخیره می‌شود)`;
        if (confirm(confirmLoad)) {
          saveCaseToShiftVault(clinicalState);
          const defaults = createDefaultClinicalState();
          clinicalState = {
            ...defaults,
            ...c,
            admission: { ...defaults.admission, ...(c.admission || {}) },
            demographics: { ...defaults.demographics, ...(c.demographics || {}) },
            cc: { ...defaults.cc, ...(c.cc || {}) },
            hpi: { ...defaults.hpi, ...(c.hpi || {}) },
            obgyn: { ...defaults.obgyn, ...(c.obgyn || {}) },
            pmh: { ...defaults.pmh, ...(c.pmh || {}) },
            psh: { ...defaults.psh, ...(c.psh || {}) },
            dh: { ...defaults.dh, ...(c.dh || {}) },
            ah: { ...defaults.ah, ...(c.ah || {}) },
            sh: { ...defaults.sh, ...(c.sh || {}) },
            fh: { ...defaults.fh, ...(c.fh || {}) },
            ros: { ...defaults.ros, ...(c.ros || {}) },
            pe: { ...defaults.pe, ...(c.pe || {}) },
            paraclinics: { ...defaults.paraclinics, ...(c.paraclinics || {}) },
            reasoning: { ...defaults.reasoning, ...(c.reasoning || {}) },
            atls: { ...defaults.atls, ...(c.atls || {}) }
          };

          if (Array.isArray(c.hpi?.presentations) && c.hpi.presentations.length > 0) {
            clinicalState.hpi.presentations = c.hpi.presentations;
          }
          if (Array.isArray(c.hpi?.painList) && c.hpi.painList.length > 0) {
            clinicalState.hpi.painList = c.hpi.painList;
          }

          saveCurrentCase();
          syncDomFromState();
          updateLivePreview();
          updateShiftCasesCount();
          populateHeaderCaseSwitcher();
          closeModal();
          showToast(isEn ? `Case ${c.caseId} loaded.` : `پرونده «${patientName}» (${c.caseId}) با موفقیت بارگذاری شد.`, 'success');
        }
      });

      item.querySelector('.btn-delete-case')?.addEventListener('click', async () => {
        const confirmDel = isEn
          ? `Permanently delete case ${c.caseId}? This action cannot be undone.`
          : `آیا از حذف دائمی و قطعی پرونده ${c.caseId} از تمام حافظه‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است.`;
        if (confirm(confirmDel)) {
          await storageVault.permanentlyDeleteCase(c.caseId, createDefaultClinicalState);
          const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
          const filtered = list.filter(item => item && item.caseId !== c.caseId);
          localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(filtered));
          updateShiftCasesCount();
          renderShiftCasesList();
          populateHeaderCaseSwitcher();
          showToast(isEn ? `Case ${c.caseId} permanently deleted.` : `پرونده ${c.caseId} به طور قطعی حذف گردید.`, 'info');
        }
      });
    }

    return item;
  }

  function renderShiftCasesList() {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const lang = getCurrentLanguage();
    const isEn = lang === 'en';

    const allCases = getDeduplicatedShiftCases();
    const activeCase = (clinicalState && clinicalState.caseId) ? clinicalState : allCases[0];
    const otherCases = allCases.filter(c => c && c.caseId && c.caseId !== activeCase?.caseId);

    // 1. Render Current Active Case at Top
    if (activeCase) {
      const activeItem = createShiftCaseItemDom(activeCase, true, isEn);
      listContainer.appendChild(activeItem);
    }

    // 2. Render Other Cases or Empty Note
    if (otherCases.length === 0) {
      const emptyNote = document.createElement('div');
      emptyNote.style.cssText = 'color:var(--text-muted); font-size:0.82rem; padding:1.2rem; text-align:center; background:var(--bg-surface-elevated, #f8fafc); border-radius:6px; margin-top:0.5rem;';
      emptyNote.textContent = isEn ? 'No other archived cases in this shift.' : 'پرونده بایگانی‌شده دیگری در این شیفت وجود ندارد (تنها پرونده فعال جاری ثبت است).';
      listContainer.appendChild(emptyNote);
      return;
    }

    otherCases.forEach((c) => {
      const item = createShiftCaseItemDom(c, false, isEn);
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

// Native PWA Install Prompt State & Global Event Listeners
let deferredPwaInstallPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaInstallPrompt = e;
    const btn = document.getElementById('btnInstallPwa');
    if (btn) btn.style.display = 'flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredPwaInstallPrompt = null;
    const btn = document.getElementById('btnInstallPwa');
    const notice = document.getElementById('pwaInstalledNotice');
    if (btn) btn.style.display = 'none';
    if (notice) notice.style.display = 'block';
    showToast(typeof getCurrentLanguage === 'function' && getCurrentLanguage() === 'en' ? 'SurgHistory installed successfully on your device.' : 'اپلیکیشن با موفقیت روی دستگاه شما نصب شد.', 'success');
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

    // Check PWA standalone / install state
    const isStandalone = (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true));
    const btnInstall = document.getElementById('btnInstallPwa');
    const notice = document.getElementById('pwaInstalledNotice');
    if (isStandalone) {
      if (btnInstall) btnInstall.style.display = 'none';
      if (notice) notice.style.display = 'block';
    } else {
      if (notice) notice.style.display = 'none';
      if (btnInstall) btnInstall.style.display = 'flex';
    }

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

  // Direct PWA App Installation Button
  document.getElementById('btnInstallPwa')?.addEventListener('click', async () => {
    if (deferredPwaInstallPrompt) {
      deferredPwaInstallPrompt.prompt();
      const choice = await deferredPwaInstallPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        showToast(getCurrentLanguage() === 'en' ? 'Installing SurgHistory app...' : 'در حال نصب اپلیکیشن روی دستگاه...', 'info');
        deferredPwaInstallPrompt = null;
        const btn = document.getElementById('btnInstallPwa');
        if (btn) btn.style.display = 'none';
      }
    } else {
      const isStandalone = (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true));
      if (isStandalone) {
        showToast(getCurrentLanguage() === 'en' ? 'SurgHistory is already running in native standalone mode.' : 'اپلیکیشن هم‌اکنون به صورت نصبی روی این دستگاه اجرا شده است.', 'info');
      } else {
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const msg = isIos
          ? (getCurrentLanguage() === 'en' ? 'To install on iOS: tap the Share button (square with arrow) and select "Add to Home Screen".' : 'جهت نصب در آیفون/آیپد: روی دکمه Share (مربع با فلش بالا) ضربه زده و گزینه Add to Home Screen (افزودن به صفحه اصلی) را انتخاب فرمایید.')
          : (getCurrentLanguage() === 'en' ? 'To install: open your browser menu (⋮) and tap "Install app" or "Add to Home screen".' : 'جهت نصب: منوی مرورگر (سه نقطه ⋮ در بالا یا پایین) را باز کرده و گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» (Install app / Add to Home screen) را انتخاب فرمایید.');
        alert(msg);
      }
    }
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

export function isSoapDayMeaningfulClient(dayEntry) {
  if (!dayEntry) return false;
  const sObj = dayEntry.soapState || dayEntry;
  const subj = sObj.subjective || {};
  const obj = sObj.objective || {};
  const ass = sObj.assessment || {};
  const plan = sObj.plan || {};

  const hasS = Boolean(
    (subj.overallTrend && subj.overallTrend.trim()) ||
    (subj.painStatus && subj.painStatus.trim()) ||
    (subj.painDetail && subj.painDetail.trim()) ||
    (subj.dietTolerance && subj.dietTolerance.trim()) ||
    subj.flatus === 1 || subj.flatus === -1 ||
    subj.bowelMovement === 1 || subj.bowelMovement === -1 ||
    (subj.ambulation && subj.ambulation.trim()) ||
    (subj.narrativeNote && subj.narrativeNote.trim()) ||
    (Array.isArray(subj.customSymptoms) && subj.customSymptoms.length > 0) ||
    (subj.symptoms && Object.values(subj.symptoms).some((v) => v === 1))
  );

  const vit = obj.vitals || {};
  const io = obj.io || {};
  const hasO = Boolean(
    vit.bp || vit.pr || vit.rr || vit.temp || vit.tmax || vit.spo2 || vit.hemodynamics ||
    io.intake24h || io.urineOutput24h || io.ngtOutput24h || io.urineStatus ||
    obj.intake24h || obj.urineOutput24h || obj.ngtOutput24h ||
    (Array.isArray(obj.drains) && obj.drains.length > 0) ||
    (obj.generalAndCardioPulm && obj.generalAndCardioPulm.trim()) ||
    (obj.abdomenExam && obj.abdomenExam.trim()) ||
    (obj.woundAndDressing && obj.woundAndDressing.trim()) ||
    (obj.extremitiesDvt && obj.extremitiesDvt.trim()) ||
    (obj.examNote && obj.examNote.trim()) ||
    (obj.newParaclinicNote && obj.newParaclinicNote.trim()) ||
    (obj.labs && Object.values(obj.labs).some((v) => v !== '' && v !== null && v !== undefined))
  );

  const hasA = Boolean((ass.clinicalStatus && ass.clinicalStatus.trim()) || (ass.summaryText && ass.summaryText.trim()));
  const hasP = Boolean((Array.isArray(plan.selectedTags) && plan.selectedTags.length > 0) || (plan.customPlanText && plan.customPlanText.trim()));

  return hasS || hasO || hasA || hasP;
}

export function buildCloudSyncPayload(state) {
  const cState = state || clinicalState;
  const sState = soapState;
  const isSoap = currentAppMode === 'soap';

  if (isSoap && sState && sState.dayId && isSoapDayMeaningfulClient(sState)) {
    syncActiveSoapDayToHistory();
  }

  const sanitized = typeof sanitizeRecordForExport === 'function'
    ? sanitizeRecordForExport(cState)
    : JSON.parse(JSON.stringify(cState));

  const ptAge = (isSoap ? sState.context?.age : sanitized.demographics?.age) || cState.demographics?.age || sState.context?.age || '';
  const ptGender = (isSoap ? sState.context?.gender : sanitized.demographics?.gender) || cState.demographics?.gender || sState.context?.gender || '';
  const ptWard = (isSoap ? sState.context?.ward : sanitized.demographics?.ward) || cState.demographics?.ward || sState.context?.ward || '';
  const caseId = cState.caseId || sanitized.caseId || sState.linkedCaseId || `SURG-${Date.now()}`;
  const admissionDate = cState.demographics?.admissionDate || sState.dateStr || new Date().toISOString().split('T')[0];
  const collectorName = (gsheetSync && gsheetSync.config && gsheetSync.config.collectorName) || 'دانشجوی جراحی';

  // Filter out empty/default SOAP days and deduplicate by HD# + POD#
  const validSoapMap = new Map();
  const rawSoapList = Array.isArray(cState.soapHistory) ? cState.soapHistory : [];
  rawSoapList.forEach((dayEntry, idx) => {
    if (!isSoapDayMeaningfulClient(dayEntry)) return;
    const daySoapState = dayEntry.soapState || dayEntry;
    const hdNum = String(dayEntry.hdNumber || daySoapState.context?.hdNumber || (idx + 1)).trim();
    const podNum = String(dayEntry.podNumber || daySoapState.context?.podNumber || '').trim();
    const key = `HD${hdNum}_POD${podNum}`;
    if (!validSoapMap.has(key) || JSON.stringify(dayEntry).length >= JSON.stringify(validSoapMap.get(key)).length) {
      validSoapMap.set(key, dayEntry);
    }
  });

  if (isSoap && validSoapMap.size === 0 && isSoapDayMeaningfulClient(sState)) {
    const hdNum = String(sState.context?.hdNumber || '1').trim();
    const podNum = String(sState.context?.podNumber || '1').trim();
    validSoapMap.set(`HD${hdNum}_POD${podNum}`, {
      dayId: sState.dayId || `soap_day_${Date.now()}`,
      dateStr: sState.dateStr || new Date().toLocaleDateString('fa-IR'),
      hdNumber: hdNum,
      podNumber: podNum,
      soapState: JSON.parse(JSON.stringify(sState))
    });
  }

  const renderedSoapHistory = Array.from(validSoapMap.values()).map((dayEntry, idx) => {
    const daySoapState = dayEntry.soapState || dayEntry;
    const rendered = generateSOAPProgressNote(daySoapState, cState);
    const hdNum = dayEntry.hdNumber || daySoapState.context?.hdNumber || (idx + 1);
    const podNum = dayEntry.podNumber || daySoapState.context?.podNumber || '';

    return {
      dayId: dayEntry.dayId || dayEntry.id || `soap_day_${idx + 1}`,
      dateStr: dayEntry.dateStr || daySoapState.dateStr || '',
      hdNumber: String(hdNum),
      podNumber: String(podNum),
      renderedText: rendered,
      soapState: JSON.parse(JSON.stringify(daySoapState))
    };
  });

  const soapAllDaysText = renderedSoapHistory.map((d, i) => {
    const dayHeader = `=== روز بستری HD #${d.hdNumber || i + 1} (${d.dateStr || ''}) ===\n`;
    return dayHeader + (d.renderedText || '');
  }).join('\n\n----------------------------------------\n\n');

  const hpText = generateClinicalNote(cState);
  const atlsText = generateATLSNote(cState.atls || {}, cState);
  const ccText = cState.cc?.patientQuote || cState.cc?.ccPhrase || cState.cc?.establishedDiagnosis || sState.context?.workingDiagnosis || '';

  const rawPayload = {
    caseId,
    age: ptAge,
    gender: ptGender,
    ward: ptWard,
    admissionDate,
    collectorName,
    mode: currentAppMode || 'admission',
    chiefComplaint: ccText,
    demographics: {
      age: ptAge,
      gender: ptGender,
      marital: cState.demographics?.marital || '',
      occupation: cState.demographics?.occupation || '',
      city: cState.demographics?.city || '',
      informant: cState.demographics?.informant || '',
      ward: ptWard
    },
    fullClinicalNote: isSoap ? (soapAllDaysText || hpText) : (currentAppMode === 'atls' ? atlsText : hpText),
    hp: {
      admission: cState.admission || {},
      cc: cState.cc || {},
      hpi: cState.hpi || {},
      pmh: cState.pmh || {},
      psh: cState.psh || {},
      obgyn: cState.obgyn || {},
      dh: cState.dh || {},
      ah: cState.ah || {},
      sh: cState.sh || {},
      fh: cState.fh || {},
      ros: cState.ros || {},
      pe: cState.pe || {},
      paraclinic: cState.paraclinics || {},
      reasoning: cState.reasoning || {}
    },
    soapHistory: renderedSoapHistory,
    atls: cState.atls || {},
    generatedTexts: {
      hp: hpText,
      atls: atlsText,
      soapAllDays: soapAllDaysText
    },
    timestamp: new Date().toISOString()
  };

  return deepStripPIIForCloud(rawPayload, cState);
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
    if (!gsheetSync.config.collectorName && collectorInput?.value) {
      gsheetSync.saveConfig({ collectorName: collectorInput.value });
    }
    btnSync.disabled = true;
    const origHtml = btnSync.innerHTML;
    btnSync.innerHTML = '<span>⏳</span><span>در حال ثبت در Google Sheets...</span>';

    try {
      const payload = buildCloudSyncPayload(clinicalState);
      const res = await gsheetSync.sendPayload(payload, clinicalState);
      if (res.success) {
        showToast(res.message || 'پرونده با فرمت استاندارد در Google Sheets ثبت شد.', 'success');
      } else if (res.queued) {
        showToast(res.message, 'warning');
      } else {
        showToast(res.message || 'خطا در ثبت اطلاعات.', 'warning');
      }
    } catch (err) {
      console.error('[CloudSync] Error:', err);
      showToast('خطا در همگامسازی ابری.', 'warning');
    } finally {
      btnSync.disabled = false;
      btnSync.innerHTML = origHtml;
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

  // Adaptive Rail Navigation Scroll Handlers (ATLS & SOAP)
  document.querySelectorAll('.rail-atls-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rail-atls-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-scroll-to');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('.rail-soap-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rail-soap-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-scroll-to');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

export function switchAppMode(mode) {
  currentAppMode = mode;
  const isAdmission = mode === 'admission' || mode === 'hp';
  const isAtls = mode === 'atls';
  const isSoap = mode === 'soap';

  const btnAdmission = document.getElementById('btnModeAdmission');
  const btnAtls = document.getElementById('btnModeAtls');
  const btnSoap = document.getElementById('btnModeSoap');
  const tabsNav = document.querySelector('.tabs-navigation-wrapper');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const hpContainer = document.getElementById('view-mode-hp');
  const atlsContainer = document.getElementById('view-mode-atls') || document.getElementById('atlsModeContainer');
  const soapContainer = document.getElementById('view-mode-soap') || document.getElementById('soapModeContainer');
  const btnGoToSoap = document.getElementById('btnGoToPatientSoap');

  const railNavAdmission = document.getElementById('railNavAdmission');
  const railNavAtls = document.getElementById('railNavAtls');
  const railNavSoap = document.getElementById('railNavSoap');

  const hpMobileTabs = document.getElementById('hp-mobile-tabs');
  const atlsMobileTabs = document.getElementById('atls-mobile-tabs');
  const soapMobileTabs = document.getElementById('soap-mobile-tabs');

  btnAdmission?.classList.toggle('active', isAdmission);
  btnAtls?.classList.toggle('active', isAtls);
  btnSoap?.classList.toggle('active', isSoap);

  if (railNavAdmission) railNavAdmission.style.display = isAdmission ? '' : 'none';
  if (railNavAtls) railNavAtls.style.display = isAtls ? '' : 'none';
  if (railNavSoap) railNavSoap.style.display = isSoap ? '' : 'none';

  if (hpMobileTabs) hpMobileTabs.hidden = !isAdmission;
  if (atlsMobileTabs) atlsMobileTabs.hidden = !isAtls;
  if (soapMobileTabs) soapMobileTabs.hidden = !isSoap;

  if (isSoap) {
    if (tabsNav) tabsNav.style.display = 'none';
    tabPanes.forEach((pane) => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    if (hpContainer) hpContainer.style.setProperty('display', 'none', 'important');
    if (atlsContainer) atlsContainer.style.setProperty('display', 'none', 'important');
    if (soapContainer) soapContainer.style.setProperty('display', 'flex', 'important');
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
  } else if (isAtls) {
    if (tabsNav) tabsNav.style.display = 'none';
    tabPanes.forEach((pane) => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    if (hpContainer) hpContainer.style.setProperty('display', 'none', 'important');
    if (soapContainer) soapContainer.style.setProperty('display', 'none', 'important');
    if (atlsContainer) atlsContainer.style.setProperty('display', 'flex', 'important');
    if (btnGoToSoap) btnGoToSoap.style.display = '';
    syncAtlsDomFromState();
  } else {
    // Mode Admission / H&P
    if (tabsNav) tabsNav.style.display = '';
    if (atlsContainer) atlsContainer.style.setProperty('display', 'none', 'important');
    if (soapContainer) soapContainer.style.setProperty('display', 'none', 'important');
    if (hpContainer) hpContainer.style.setProperty('display', 'block', 'important');

    const activeTab = document.querySelector('.segmented-tabs-bar .tab-btn.active');
    const activeTabId = activeTab ? activeTab.getAttribute('data-tab') : 'tab-cc';
    tabPanes.forEach((pane) => {
      pane.style.display = '';
      pane.classList.toggle('active', pane.id === activeTabId);
    });
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
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); padding:0.35rem 0;">هنوز ضایعه یا بریدگی موضعی ثبت نشده است. با دکمه «+ ثبت جراحت / زخم جدید» اضافه کنید.</div>`;
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
      <button type="button" class="btn-delete-imaging atls-inj-del" title="حذف ضایعه" style="cursor:pointer; display:flex; align-items:center; justify-content:center; color:#DC2626; font-size:16px; font-weight:bold; width:28px; height:28px; border:none; background:rgba(220,38,38,0.08); border-radius:4px;">&times;</button>
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
    group.querySelectorAll('.soap-chip, .atls-chip, button').forEach((chip) => {
      chip.classList.toggle('active', chip.getAttribute('data-val') === curVal);
    });
  });

  // Multi-select chip groups
  document.querySelectorAll('[data-atls-multi]').forEach((group) => {
    const path = group.getAttribute('data-atls-multi');
    const arr = getNestedAtlsProp(path) || [];
    group.querySelectorAll('.soap-chip, .atls-chip, .soap-plan-pill, button').forEach((chip) => {
      const val = chip.getAttribute('data-val');
      const isAct = Array.isArray(arr)
        ? arr.includes(val)
        : (typeof arr === 'string' && arr ? arr.includes(val) : false);
      chip.classList.toggle('active', isAct);
    });
  });

  // Secondary Survey Interactive Head-to-Toe Regional Capsules
  const caps = sec.headToToeCapsules || {};
  document.querySelectorAll('[data-atls-sec-region]').forEach((group) => {
    const reg = group.getAttribute('data-atls-sec-region');
    const regArr = Array.isArray(caps[reg]) ? caps[reg] : [];
    group.querySelectorAll('.soap-chip, .atls-chip, button').forEach((chip) => {
      const val = chip.getAttribute('data-val');
      chip.classList.toggle('active', regArr.includes(val));
    });
  });

  // Text & Number Inputs
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v !== undefined && v !== null ? v : '';
  };

  const demo = clinicalState.demographics || {};
  setVal('atlsPtName', demo.fullName);
  setVal('atlsPtAge', demo.age);
  setVal('atlsPtGender', demo.gender);

  setVal('atlsMistTime', mist.incidentTime);
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
    const tot = String(vit.gcsTotal || ((Number(vit.gcsE) || 4) + (Number(vit.gcsV) || 5) + (Number(vit.gcsM) || 6)));
    if ('value' in gcsTotalEl) gcsTotalEl.value = tot;
    gcsTotalEl.textContent = tot;
  }

  setVal('atlsAmpleA', ample.allergies);
  setVal('atlsAmpleAllergies', ample.allergies);
  setVal('atlsAmpleM', ample.medications);
  setVal('atlsAmpleMedications', ample.medications);
  setVal('atlsAmpleP', ample.pastHistory);
  setVal('atlsAmplePastHistory', ample.pastHistory);
  setVal('atlsAmpleL', ample.lastMeal);
  setVal('atlsAmpleLastMeal', ample.lastMeal);
  setVal('atlsAmpleE', ample.eventsTetanus);
  setVal('atlsAmpleEventsTetanus', ample.eventsTetanus);

  const burnChk = document.getElementById('atlsBurnToggleCheckbox');
  const burnFields = document.getElementById('atlsBurnModuleFields');
  if (burnChk) burnChk.checked = !!sec.burnActive;
  if (burnFields) burnFields.style.display = sec.burnActive ? 'block' : 'none';
  setVal('atlsBurnDegree', sec.burnDegree || 'درجه ۲ سطحی / عمقی (Partial Thickness - II)');
  setVal('atlsBurnTbsa', sec.burnTbsa);
  setVal('atlsBurnInhalation', sec.burnInhalation);

  setVal('atlsSecHead', sec.headFace);
  setVal('atlsExamHeadFace', sec.headFace);
  setVal('atlsSecNeck', sec.neck);
  setVal('atlsExamNeck', sec.neck);
  setVal('atlsSecChest', sec.chest);
  setVal('atlsExamChest', sec.chest);
  setVal('atlsSecAbdomen', sec.abdomenPelvis);
  setVal('atlsExamAbdomenPelvis', sec.abdomenPelvis);
  setVal('atlsSecPerineum', sec.perineumDre);
  setVal('atlsExamPerineumDre', sec.perineumDre);
  setVal('atlsSecExtremities', sec.extremitiesNeuro);
  setVal('atlsExamExtremitiesNeuro', sec.extremitiesNeuro);

  setVal('atlsParaclinicEfastDetail', sec.efastDetail);
  setVal('atlsEfastDetail', sec.efastDetail);
  setVal('atlsParaclinicImaging', sec.imagingNote);
  setVal('atlsImagingNote', sec.imagingNote);
  setVal('atlsParaclinicLabs', sec.statLabsNote);
  setVal('atlsStatLabsNote', sec.statLabsNote);
  setVal('atlsPlanCustomNote', sec.planCustomNote);

  renderAtlsInjuriesList();
}

function initAtlsModeEngine() {
  if (!clinicalState.atls) clinicalState.atls = createDefaultAtlsState();

  // ATLS Patient Demographics
  document.getElementById('atlsPtName')?.addEventListener('input', (e) => {
    clinicalState.demographics.fullName = e.target.value;
    updateHeaderActivePatientBadge();
    saveCurrentCase();
    updateLivePreview();
  });
  document.getElementById('atlsPtAge')?.addEventListener('input', (e) => {
    clinicalState.demographics.age = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  document.getElementById('atlsPtGender')?.addEventListener('change', (e) => {
    clinicalState.demographics.gender = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // Single-select chip groups
  document.querySelectorAll('[data-atls-single]').forEach((group) => {
    const path = group.getAttribute('data-atls-single');
    group.querySelectorAll('.soap-chip, .atls-chip, button').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.soap-chip, .atls-chip, button').forEach((c) => c.classList.remove('active'));
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
    group.querySelectorAll('.soap-chip, .atls-chip, .soap-plan-pill, button').forEach((chip) => {
      chip.addEventListener('click', () => {
        let arr = getNestedAtlsProp(path);
        if (!Array.isArray(arr)) {
          arr = typeof arr === 'string' && arr ? [arr] : [];
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

  // Secondary Survey Interactive Head-to-Toe Regional Capsules
  document.querySelectorAll('[data-atls-sec-region]').forEach((group) => {
    const reg = group.getAttribute('data-atls-sec-region');
    group.querySelectorAll('.soap-chip, .atls-chip, button').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (!clinicalState.atls.secondary.headToToeCapsules) {
          clinicalState.atls.secondary.headToToeCapsules = {};
        }
        let arr = clinicalState.atls.secondary.headToToeCapsules[reg];
        if (!Array.isArray(arr)) {
          arr = [];
          clinicalState.atls.secondary.headToToeCapsules[reg] = arr;
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

  bindAtlsInput('atlsMistTime', 'mist.incidentTime');
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
    if (badge) {
      if ('value' in badge) badge.value = String(tot);
      badge.textContent = String(tot);
    }
    saveCurrentCase();
    updateLivePreview();
  };
  ['atlsGcsE', 'atlsGcsV', 'atlsGcsM'].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', updateGcsTotal);
    el?.addEventListener('change', updateGcsTotal);
  });

  // 1. Preset Primary Survey Stable
  document.getElementById('btnAtlsPrimaryStablePreset')?.addEventListener('click', () => {
    clinicalState.atls.primary.airway = [
      'راه هوایی باز و بیمار قادر به تکلم (Patent & Intact)',
      'کلار گردنی سخت (Hard Collar) فیکس شده'
    ];
    clinicalState.atls.primary.breathing = [
      'حرکات قفسه سینه قرینه و سمع دوطرفه شفاف (Clear & Symmetric)'
    ];
    clinicalState.atls.primary.circulation = [
      'همودینامیک پایدار (Hemodynamically Stable)',
      'نبض‌های مرکزی و محیطی پر و قرینه',
      'لگن در معاینه پایدار (Pelvic Ring Stable)'
    ];
    clinicalState.atls.primary.disability = [
      'مردمک‌ها قرینه و راکتیو به نور (PERRLA)',
      'بدون نقص عصبی فوکال (No Focal Deficit)'
    ];
    clinicalState.atls.primary.disabilityPupils = 'مردمک‌ها قرینه و راکتیو به نور (PERRLA)';
    clinicalState.atls.primary.exposure = [
      'برهنه‌سازی کامل و بررسی پشت (Log-roll) انجام شد',
      'جلوگیری از هیپوترمی (پتو گرم و مایعات گرم)'
    ];
    clinicalState.atls.primary.vitals.gcsE = 4;
    clinicalState.atls.primary.vitals.gcsV = 5;
    clinicalState.atls.primary.vitals.gcsM = 6;
    clinicalState.atls.primary.vitals.gcsTotal = 15;
    syncAtlsDomFromState();
    saveCurrentCase();
    updateLivePreview();
    showToast('ارزیابی اولیه (ABCDE) به صورت پایدار و GCS=15 تنظیم شد.', 'info');
  });

  // 2. Preset AMPLE Negative
  document.getElementById('btnAtlsAmpleNegativePreset')?.addEventListener('click', () => {
    clinicalState.atls.ample.allergies = 'NKDA (عدم سابقه حساسیت دارویی یا غذایی)';
    clinicalState.atls.ample.medications = 'عدم سابقه مصرف داروی خاص یا داروی ضدانعقاد / بتابلاکر';
    clinicalState.atls.ample.pastHistory = 'بدون سابقه بیماری زمینه‌ای مزمن، بستری یا جراحی قبلی، عدم بارداری';
    clinicalState.atls.ample.lastMeal = 'بیش از ۶ ساعت قبل (NPO از بدو مراجعه)';
    clinicalState.atls.ample.eventsTetanus = 'مکانیسم تروما بدون آلودگی شدید زخم؛ وضعیت واکسیناسیون کزاز نیاز به بررسی/تزریق دارد';
    syncAtlsDomFromState();
    saveCurrentCase();
    updateLivePreview();
    showToast('شرح‌حال AMPLE منفی روتین با موفقیت ثبت شد.', 'info');
  });

  // 3. Preset Secondary Survey Normal
  document.getElementById('btnAtlsSecondaryNormalPreset')?.addEventListener('click', () => {
    clinicalState.atls.secondary.headToToeCapsules = {
      headFace: [
        'نرموسفال، بدون دفرمیتی یا شکستگی استخوانی',
        'بدون اتوره، رینوره یا Battle/Raccoon Sign'
      ],
      neck: [
        'تراشه در خط وسط، بدون JVD یا هماتوم در حال گسترش',
        'بدون تندرنس خط وسط گردن (تحت کلار گردنی)'
      ],
      chest: [
        'سمع دوطرفه شفاف، بدون تندرنس یا کرپیتاسیون دنده‌ای',
        'صداهای قلبی واضح و طبیعی (بدون مافل بودن)'
      ],
      abdomenPelvis: [
        'شکم نرم، غیرمتسع و بدون گاردینگ یا تندرنس Rebound',
        'لگن در لمس کاملاً استیبل و فاقد لقی یا درد'
      ],
      perineumBack: [
        'پرینه و ژنیتالیا طبیعی، بدون اکیموز پرینه‌ای یا خون در مئاتوس',
        'معاینه رکتال (DRE): تون اسفنکتر نرمال، بدون خونریزی'
      ],
      extremities: [
        'حرکت و حس هر ۴ اندام سالم، بدون دفرمیتی واضح',
        'نبض‌های دیستال (رادیال، DP/PT) دوطرفه پر و قرینه'
      ]
    };
    clinicalState.atls.secondary.headFace = '';
    clinicalState.atls.secondary.neck = '';
    clinicalState.atls.secondary.chest = '';
    clinicalState.atls.secondary.abdomenPelvis = '';
    clinicalState.atls.secondary.perineumDre = '';
    clinicalState.atls.secondary.extremitiesNeuro = '';
    clinicalState.atls.secondary.efastStatus = 'eFAST منفی (فاقد مایع آزاد در پریکارد، موریسون، اسپلنورنال و لگن)';
    clinicalState.atls.secondary.efastWindows = [];
    syncAtlsDomFromState();
    saveCurrentCase();
    updateLivePreview();
    showToast('معاینه ثانویه سر تا پا و eFAST منفی با موفقیت تنظیم شد.', 'info');
  });

  // AMPLE inputs (bind both short and long IDs)
  bindAtlsInput('atlsAmpleA', 'ample.allergies');
  bindAtlsInput('atlsAmpleAllergies', 'ample.allergies');
  bindAtlsInput('atlsAmpleM', 'ample.medications');
  bindAtlsInput('atlsAmpleMedications', 'ample.medications');
  bindAtlsInput('atlsAmpleP', 'ample.pastHistory');
  bindAtlsInput('atlsAmplePastHistory', 'ample.pastHistory');
  bindAtlsInput('atlsAmpleL', 'ample.lastMeal');
  bindAtlsInput('atlsAmpleLastMeal', 'ample.lastMeal');
  bindAtlsInput('atlsAmpleE', 'ample.eventsTetanus');
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

  // Secondary Survey inputs (bind both short and long IDs)
  bindAtlsInput('atlsSecHead', 'secondary.headFace');
  bindAtlsInput('atlsExamHeadFace', 'secondary.headFace');
  bindAtlsInput('atlsSecNeck', 'secondary.neck');
  bindAtlsInput('atlsExamNeck', 'secondary.neck');
  bindAtlsInput('atlsSecChest', 'secondary.chest');
  bindAtlsInput('atlsExamChest', 'secondary.chest');
  bindAtlsInput('atlsSecAbdomen', 'secondary.abdomenPelvis');
  bindAtlsInput('atlsExamAbdomenPelvis', 'secondary.abdomenPelvis');
  bindAtlsInput('atlsSecPerineum', 'secondary.perineumDre');
  bindAtlsInput('atlsExamPerineumDre', 'secondary.perineumDre');
  bindAtlsInput('atlsSecExtremities', 'secondary.extremitiesNeuro');
  bindAtlsInput('atlsExamExtremitiesNeuro', 'secondary.extremitiesNeuro');

  // Paraclinic inputs
  bindAtlsInput('atlsParaclinicEfastDetail', 'secondary.efastDetail');
  bindAtlsInput('atlsEfastDetail', 'secondary.efastDetail');
  bindAtlsInput('atlsParaclinicImaging', 'secondary.imagingNote');
  bindAtlsInput('atlsImagingNote', 'secondary.imagingNote');
  bindAtlsInput('atlsParaclinicLabs', 'secondary.statLabsNote');
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

  document.getElementById('atlsBtnGoToSoap')?.addEventListener('click', () => {
    switchAppMode('soap');
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

  const lang = getCurrentLanguage();
  const isEn = lang === 'en';

  // Update counter badges
  const countBadge = document.getElementById('soapHistoryCountBadge');
  if (countBadge) {
    const count = historyList.length || 1;
    countBadge.textContent = isEn ? `Documented Days: ${count}` : `تعداد نوت‌های ثبت‌شده: ${count}`;
  }

  const badge = document.getElementById('patientSoapNotesCountBadge');
  if (badge) badge.textContent = String(historyList.length);

  // If no history exists yet, render single active day in dropdown format
  if (historyList.length === 0) {
    const bar = document.createElement('div');
    bar.className = 'soap-history-dropdown-bar';

    const group = document.createElement('div');
    group.className = 'soap-history-select-group';

    const label = document.createElement('label');
    label.className = 'soap-history-select-label';
    label.htmlFor = 'soapHistorySelect';
    label.innerHTML = `${getIconSvg('calendar', { size: 15 })} <span>${isEn ? 'Daily Notes History:' : 'تاریخچه یادداشت‌های روزانه:'}</span>`;

    const select = document.createElement('select');
    select.id = 'soapHistorySelect';
    select.className = 'input-select soap-history-select';

    const opt = document.createElement('option');
    opt.value = soapState.dayId || 'day_active';
    const hd = soapState.context?.hdNumber || '1';
    const pod = soapState.context?.podNumber || '';
    const podType = soapState.context?.podType || 'POD';
    const dStr = soapState.dateStr || (isEn ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('fa-IR'));
    opt.textContent = `🗓 ${dStr} — HD#${hd}${pod ? ` / ${podType}#${pod}` : ''} ★ [${isEn ? 'Active Day Note' : 'نوت فعال امروز'}]`;
    opt.selected = true;
    select.appendChild(opt);

    group.appendChild(label);
    group.appendChild(select);
    bar.appendChild(group);

    const meta = document.createElement('div');
    meta.className = 'soap-history-active-meta';
    meta.innerHTML = `<span class="soap-history-current-pill">${getIconSvg('check-circle', { size: 13 })} HD#${hd}${pod ? ` / ${podType}#${pod}` : ''}</span>`;
    bar.appendChild(meta);

    container.appendChild(bar);
    return;
  }

  // Sort historyList chronologically descending: from latest/newest note down to oldest
  const sortedHistory = [...historyList].sort((a, b) => {
    const getTimestamp = (item) => {
      if (item.createdAt) {
        const t = new Date(item.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      const dayId = item.dayId || item.id || '';
      const match = dayId.match(/\d{10,}/);
      if (match) return parseInt(match[0], 10);
      return 0;
    };
    const tA = getTimestamp(a);
    const tB = getTimestamp(b);
    if (tB !== tA && tB > 0 && tA > 0) return tB - tA;

    const hdA = Number(a.hdNumber || a.soapState?.context?.hdNumber || 0);
    const hdB = Number(b.hdNumber || b.soapState?.context?.hdNumber || 0);
    if (hdB !== hdA) return hdB - hdA;

    return 0;
  });

  const bar = document.createElement('div');
  bar.className = 'soap-history-dropdown-bar';

  const group = document.createElement('div');
  group.className = 'soap-history-select-group';

  const label = document.createElement('label');
  label.className = 'soap-history-select-label';
  label.htmlFor = 'soapHistorySelect';
  label.innerHTML = `${getIconSvg('calendar', { size: 15 })} <span>${isEn ? 'Daily Notes History:' : 'تاریخچه یادداشت‌های روزانه:'}</span>`;

  const select = document.createElement('select');
  select.id = 'soapHistorySelect';
  select.className = 'input-select soap-history-select';

  let currentActiveEntry = null;

  sortedHistory.forEach((entry, idx) => {
    const entryId = entry.dayId || entry.id || `day_${idx}`;
    const isActive = soapState.dayId === entryId;
    if (isActive) currentActiveEntry = entry;

    const hd = entry.hdNumber || entry.soapState?.context?.hdNumber || (historyList.length - idx);
    const pod = entry.podNumber || entry.soapState?.context?.podNumber || '';
    const podType = entry.soapState?.context?.podType || 'POD';
    const dStr = entry.dateStr || entry.soapState?.dateStr || '';

    let timeStr = '';
    if (entry.createdAt) {
      try {
        const dObj = new Date(entry.createdAt);
        timeStr = dObj.toLocaleTimeString(isEn ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        timeStr = '';
      }
    }

    const opt = document.createElement('option');
    opt.value = entryId;
    opt.textContent = `🗓 ${dStr} — HD#${hd}${pod ? ` / ${podType}#${pod}` : ''}${timeStr ? ` (${timeStr})` : ''}${isActive ? ` ★ [${isEn ? 'Active' : 'نوت فعال'}]` : ''}`;
    if (isActive) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const chosenDayId = e.target.value;
    const entry = historyList.find((h) => (h.dayId || h.id) === chosenDayId);
    if (entry && entry.soapState) {
      soapState = JSON.parse(JSON.stringify(entry.soapState));
      soapState.dayId = chosenDayId;
      syncSoapInputsFromState();
      renderSoapDayTracker();
      updateLivePreview();
    }
  });

  group.appendChild(label);
  group.appendChild(select);
  bar.appendChild(group);

  const activeHd = currentActiveEntry?.hdNumber || soapState.context?.hdNumber || '1';
  const activePod = currentActiveEntry?.podNumber || soapState.context?.podNumber || '';
  const activePodType = currentActiveEntry?.soapState?.context?.podType || soapState.context?.podType || 'POD';

  const meta = document.createElement('div');
  meta.className = 'soap-history-active-meta';
  meta.innerHTML = `
    <span class="soap-history-current-pill" title="${isEn ? 'Currently viewing this note' : 'در حال ویرایش این نوت'}">
      ${getIconSvg('check-circle', { size: 13 })} HD#${activeHd}${activePod ? ` / ${activePodType}#${activePod}` : ''}
    </span>
  `;
  bar.appendChild(meta);

  container.appendChild(bar);
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
    gender: demo.gender || '',
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

export function updateSoapActivePatientStatusPill(selectedCase) {
  const pill = document.getElementById('soapActivePatientStatusPill');
  if (!pill) return;
  const isEn = getCurrentLanguage() === 'en';

  if (!selectedCase) {
    pill.classList.remove('has-active');
    pill.innerHTML = `
      <span class="soap-pulse-dot"></span>
      <span class="soap-pill-text">${isEn ? 'Not Connected' : 'انتخاب نشده'}</span>
    `;
    return;
  }

  pill.classList.add('has-active');
  const demo = selectedCase.demographics || selectedCase.admission || selectedCase.context || {};
  let labelText = '';
  if (demo.fullName && String(demo.fullName).trim()) {
    const loc = [demo.ward, demo.bed ? (isEn ? `Bed ${demo.bed}` : `تخت ${demo.bed}`) : ''].filter(Boolean).join(' - ');
    labelText = loc ? `${String(demo.fullName).trim()} (${loc})` : String(demo.fullName).trim();
  } else if (selectedCase.caseId) {
    labelText = isEn ? `Case #${selectedCase.caseId}` : `پرونده #${selectedCase.caseId}`;
  } else {
    labelText = isEn ? 'Active Case' : 'پرونده متصل';
  }

  pill.innerHTML = `
    <span class="soap-pulse-dot"></span>
    <span class="soap-pill-text">${labelText}</span>
  `;
}

function populateSoapPatientDropdown() {
  const select = document.getElementById('soapLinkedPatientSelect');
  if (!select) return;

  const cases = getAllAvailableCases();
  const lang = getCurrentLanguage();
  const isEn = lang === 'en';
  select.innerHTML = `<option value="">${isEn ? '-- Select from Shift Cases --' : '-- انتخاب از پرونده‌های شیفت --'}</option>`;

  let activeCaseFound = null;

  cases.forEach((c) => {
    const demo = c.demographics || c.admission || c.context || {};
    const cc = c.cc || {};
    const ageStr = demo.age ? (isEn ? `${demo.age} yo` : `${demo.age} ساله`) : '';
    const wardStr = demo.ward ? (isEn ? `Ward: ${demo.ward}` : `بخش ${demo.ward}`) : '';
    const bedStr = demo.bed ? (isEn ? `Bed ${demo.bed}` : `تخت ${demo.bed}`) : '';
    const details = [ageStr, wardStr, bedStr].filter(Boolean).join(' | ');

    const diag = cc.establishedDiagnosis || cc.patientQuote || cc.ccPhrase || (c.recordType === 'SOAP_PROGRESS' ? (c.context?.workingDiagnosis || (isEn ? 'Progress Note' : 'پراگرس روزانه')) : (isEn ? 'Admission' : 'جراحی'));

    let displayText = '';
    // Priority: If the patient has a name, strictly display the patient's name first. Fallback to case title/ID only if no name.
    if (demo.fullName && String(demo.fullName).trim()) {
      displayText = `👤 ${String(demo.fullName).trim()}${details ? ` (${details})` : ''} — ${diag}`;
    } else {
      const caseTitle = c.title || (isEn ? `Case #${c.caseId}` : `پرونده #${c.caseId}`);
      displayText = `📁 ${caseTitle}${details ? ` (${details})` : ''} — ${diag}`;
    }

    const opt = document.createElement('option');
    opt.value = c.caseId;
    opt.textContent = displayText;
    select.appendChild(opt);

    if (soapState.linkedCaseId && c.caseId === soapState.linkedCaseId) {
      activeCaseFound = c;
    }
  });

  if (activeCaseFound) {
    select.value = soapState.linkedCaseId;
  }
  updateSoapActivePatientStatusPill(activeCaseFound);
}

function handleSoapPatientSelect(caseId) {
  if (!caseId) {
    updateSoapActivePatientStatusPill(null);
    return;
  }
  soapState.linkedCaseId = caseId;
  soapState.mode = 'linked';

  const cases = getAllAvailableCases();
  const selected = cases.find((c) => c.caseId === caseId);
  updateSoapActivePatientStatusPill(selected || null);
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
    const displayTitle = getItemDisplayTitle(cs) || cs.label;
    const lexItem = HPI_QUALIFIERS_AND_SYMPTOMS.find((it) => it.id === cs.id);
    const rawSub = lexItem?.modifiers || [];

    item.innerHTML = `
      <div class="soap-symptom-top-row" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
        <span class="sym-label">${displayTitle}</span>
        <div class="bipolar-btn-group">
          <button type="button" class="bipolar-btn sym-custom-pos ${isPos ? 'active-pos' : ''}">+ بله</button>
          <button type="button" class="bipolar-btn sym-custom-neg ${!isPos ? 'active-neg' : ''}">− خیر</button>
          <button type="button" class="btn-delete-imaging sym-custom-del" title="حذف علامت"></button>
        </div>
      </div>
    `;

    const detailInput = document.createElement('input');
    detailInput.type = 'text';
    detailInput.className = 'input-text inline-detail-input sym-custom-det';
    detailInput.placeholder = `توضیحات تکمیلی «${displayTitle}»...`;
    detailInput.value = cs.detail || '';
    detailInput.style.cssText = `display:${isPos ? 'block' : 'none'}; font-size:0.8rem; padding:0.3rem 0.55rem;`;

    let modifierChipsWrap = null;
    if (rawSub.length > 0) {
      modifierChipsWrap = document.createElement('div');
      modifierChipsWrap.className = 'mini-modifier-chips';
      modifierChipsWrap.style.display = isPos ? 'flex' : 'none';

      rawSub.forEach((optText) => {
        const chipBtn = document.createElement('button');
        chipBtn.type = 'button';
        chipBtn.className = 'mini-modifier-chip';
        chipBtn.textContent = optText;
        if (cs.detail && cs.detail.includes(optText)) chipBtn.classList.add('is-selected');

        chipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const curVal = detailInput.value.trim();
          let newVal = '';
          if (curVal.includes(optText)) {
            const parts = curVal.split(/[,،]\s*/).filter((p) => p !== optText && p.length > 0);
            newVal = parts.join('، ');
            chipBtn.classList.remove('is-selected');
          } else {
            newVal = curVal ? `${curVal}، ${optText}` : optText;
            chipBtn.classList.add('is-selected');
          }
          detailInput.value = newVal;
          cs.detail = newVal;
          updateLivePreview();
        });
        modifierChipsWrap.appendChild(chipBtn);
      });
    }

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
    detailInput.addEventListener('input', (e) => {
      cs.detail = e.target.value;
      if (modifierChipsWrap) {
        modifierChipsWrap.querySelectorAll('.mini-modifier-chip').forEach((btn) => {
          btn.classList.toggle('is-selected', cs.detail.includes(btn.textContent));
        });
      }
      updateLivePreview();
    });
    item.querySelector('.sym-custom-del')?.addEventListener('click', () => {
      soapState.subjective.customSymptoms.splice(idx, 1);
      renderSoapCustomSymptoms();
      updateLivePreview();
    });

    if (modifierChipsWrap) item.appendChild(modifierChipsWrap);
    item.appendChild(detailInput);
    container.appendChild(item);
  });
}

export function addSoapLabCard(labId, labTitle = null, value = '') {
  if (typeof document === 'undefined') return null;
  const grid = document.getElementById('soapLabsGridContainer');
  if (!grid) return null;

  let existingCard = grid.querySelector(`.soap-lab-card[data-lab="${labId}"]`);
  if (existingCard) {
    const input = existingCard.querySelector('.soap-lab-input');
    if (input) {
      if (value !== null && value !== undefined && value !== '') {
        input.value = value;
        if (!soapState.objective.labs) soapState.objective.labs = {};
        soapState.objective.labs[labId] = value;
      }
      input.focus();
      input.classList.remove('input-focus-pulse');
      void input.offsetWidth;
      input.classList.add('input-focus-pulse');
    }
    return existingCard;
  }

  // Not in DOM yet: create new card
  const found = (typeof MASTER_ALL_LAB_TESTS !== 'undefined' ? MASTER_ALL_LAB_TESTS : []).find((t) => t.id === labId);
  const displayTitle = labTitle || (found ? found.label : labId.toUpperCase());
  const placeholder = found?.unit || '';

  const card = document.createElement('div');
  card.className = 'soap-lab-card';
  card.setAttribute('data-lab', labId);
  card.innerHTML = `
    <div class="soap-lab-header" style="display:flex; justify-content:space-between; align-items:center;">
      <span class="soap-lab-name" style="font-weight:700;">${displayTitle}</span>
      <div style="display:flex; align-items:center; gap:0.25rem;">
        <span class="soap-lab-trend"></span>
        <button type="button" class="btn-remove-soap-lab" title="حذف این تست" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; line-height:1; padding:0 3px;">×</button>
      </div>
    </div>
    <input type="text" class="input-text soap-lab-input dir-ltr" placeholder="${placeholder}" data-lab="${labId}" value="${value || ''}" />
  `;

  const input = card.querySelector('.soap-lab-input');
  input.addEventListener('input', (e) => {
    if (!soapState.objective.labs) soapState.objective.labs = {};
    soapState.objective.labs[labId] = e.target.value;
    updateSoapLabTrends();
    updateLivePreview();
  });

  const removeBtn = card.querySelector('.btn-remove-soap-lab');
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (soapState.objective.labs) {
      delete soapState.objective.labs[labId];
    }
    card.remove();
    updateSoapLabTrends();
    updateLivePreview();
  });

  grid.appendChild(card);

  if (value) {
    if (!soapState.objective.labs) soapState.objective.labs = {};
    soapState.objective.labs[labId] = value;
  }

  input.focus();
  input.classList.remove('input-focus-pulse');
  void input.offsetWidth;
  input.classList.add('input-focus-pulse');

  return card;
}

function syncSoapInputsFromState() {
  const ctx = soapState.context || {};
  const s = soapState.subjective || {};
  const o = soapState.objective || {};
  const a = soapState.assessment || {};
  const p = soapState.plan || {};

  if (!s.symptoms) {
    s.symptoms = {};
  }
  if (!s.symptomDetails) s.symptomDetails = {};
  if (!s.customSymptoms) s.customSymptoms = [];
  if (!o.io) {
    o.io = {
      intake24h: o.intake24h || '',
      urineOutput24h: o.urineOutput24h || '',
      ngtOutput24h: o.ngtOutput24h || '',
      urineStatus: ''
    };
  }

  // Context fields
  const ptName = document.getElementById('soapPtName');
  if (ptName) ptName.value = ctx.fullName || '';
  const ptAge = document.getElementById('soapPtAge');
  if (ptAge) ptAge.value = ctx.age || '';
  const ptGender = document.getElementById('soapPtGender');
  if (ptGender) ptGender.value = ctx.gender || '';
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
  if (document.getElementById('soapVitalHemodynamics')) document.getElementById('soapVitalHemodynamics').value = v.hemodynamics || '';

  // Urine output quick pills
  const curUoStatus = o.io?.urineStatus || '';
  document.querySelectorAll('#soapUrineOutputStatusBar .soap-uo-pill').forEach((pill) => {
    pill.classList.toggle('active', !!curUoStatus && pill.getAttribute('data-uo-status') === curUoStatus);
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

  // Labs: restore any dynamic lab not in default 7
  const objLabs = o.labs || {};
  Object.keys(objLabs).forEach((labId) => {
    const val = objLabs[labId];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      addSoapLabCard(labId, null, val);
    }
  });

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
      <button type="button" class="btn-remove-drain" title="حذف این درن" data-idx="${idx}"></button>
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
  const genderWord = ctx.gender === 'female' ? 'خانم' : ctx.gender === 'male' ? 'آقای' : '';
  const ageStr = ctx.age ? `${ctx.age} ساله` : '';
  const ptIntro = ['بیمار', genderWord, ageStr].filter(Boolean).join(' ');
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

  const sentence = `${ptIntro} در ${timeline || 'سیر بستری بخش جراحی'} با تشخیص ${diagStr}${procStr}؛ در حال حاضر از نظر علائم حیاتی ${hemoStr} و ${feverStr} می‌باشد. ${giStr}، وضعیت ادراری به صورت «${uoStr}» است، ${drainSummary ? `${drainSummary} و ` : ''}در معاینه موضع عمل ${woundStr}.${labSentence} در مجموع بیمار در «${a.clinicalStatus || 'سیر بهبودی مناسب و پایدار'}» ارزیابی می‌گردد.`;

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
      updateSoapActivePatientStatusPill(null);
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
  document.querySelectorAll('.soap-mode-container .soap-chip[data-val], #view-mode-soap .soap-chip[data-val], #soapModeContainer .soap-chip[data-val]').forEach((chip) => {
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
      const matches = smartClinicalSearch(q, HPI_QUALIFIERS_AND_SYMPTOMS, 15);
      symSearchTray.innerHTML = '';
      if (matches.length === 0) {
        const customBtn = document.createElement('button');
        customBtn.type = 'button';
        customBtn.className = 'toggle-chip';
        customBtn.innerHTML = `<span></span> <span>افزودن علامت «${q}»</span>`;
        customBtn.addEventListener('click', () => {
          if (!soapState.subjective.customSymptoms) soapState.subjective.customSymptoms = [];
          soapState.subjective.customSymptoms.push({ id: 'cs_' + Date.now(), label: q, en: '', status: 1, detail: '' });
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
          const title = getItemDisplayTitle(m) || m.label || m.fa || m.en;
          btn.innerHTML = `<span></span> <span>${title}</span>`;
          btn.addEventListener('click', () => {
            if (!soapState.subjective.customSymptoms) soapState.subjective.customSymptoms = [];
            const exists = soapState.subjective.customSymptoms.some((c) => c.id === m.id || c.label === (m.fa || m.label));
            if (!exists) {
              soapState.subjective.customSymptoms.push({ id: m.id, label: m.fa || m.label, en: m.en || '', status: 1, detail: '' });
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
      if (!soapState.objective.labs) soapState.objective.labs = {};
      soapState.objective.labs[labId] = e.target.value;
      updateSoapLabTrends();
      updateLivePreview();
    });
  });

  // Labs Quick Search & Tray
  const soapLabSearchInput = document.getElementById('soapLabQuickSearchInput');
  const soapLabSearchTray = document.getElementById('soapLabQuickSearchTray');

  if (soapLabSearchInput && soapLabSearchTray) {
    const renderSoapLabTray = (query) => {
      soapLabSearchTray.innerHTML = '';
      const q = (query || '').trim();
      if (!q) {
        soapLabSearchTray.classList.remove('is-active');
        return;
      }

      const labPool = (typeof MASTER_ALL_LAB_TESTS !== 'undefined' && Array.isArray(MASTER_ALL_LAB_TESTS) && MASTER_ALL_LAB_TESTS.length > 0)
        ? MASTER_ALL_LAB_TESTS
        : EXTENDED_LAB_DATABASE;
      const matches = filterSchemaItems(q, labPool).slice(0, 30);

      if (matches.length === 0) {
        soapLabSearchTray.innerHTML = '<div style="padding:0.75rem; color:var(--text-muted); text-align:center; font-size:0.82rem;">آزمایشی مطابق با جستجو یافت نشد.</div>';
        soapLabSearchTray.classList.add('is-active');
        return;
      }

      const header = document.createElement('div');
      header.className = 'search-tray-header';
      header.innerHTML = `
        <span>نتایج آزمایشگاه: <span class="search-tray-count">${matches.length} مورد</span></span>
        <span>روی آزمایش کلیک کنید تا به کارت‌های امروز اضافه شود</span>
      `;
      soapLabSearchTray.appendChild(header);

      const list = document.createElement('div');
      list.className = 'search-tray-drugs-list';

      matches.forEach((test) => {
        const curVal = soapState.objective?.labs?.[test.id];
        const isAdded = curVal !== undefined && curVal !== null && String(curVal).trim() !== '';

        const card = document.createElement('div');
        card.className = `dh-tray-card ${isAdded ? 'is-active' : ''}`;

        const topRow = document.createElement('div');
        topRow.className = 'dh-tray-top';

        const info = document.createElement('div');
        info.className = 'dh-tray-main-info';
        const rangeText = test.normalRange ? `[نرمال: ${test.normalRange}]` : ((test.min !== undefined && test.max !== undefined) ? `[نرمال: ${test.min}-${test.max}]` : '');
        info.innerHTML = `
          <div class="dh-tray-drug-name">${test.label} ${test.unit ? `<span class="additional-lab-unit">${test.unit}</span>` : ''}</div>
          ${rangeText ? `<div class="dh-tray-brands">${rangeText}</div>` : ''}
        `;
        topRow.appendChild(info);

        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = `dh-tray-action-btn ${isAdded ? 'active' : ''}`;
        actionBtn.innerHTML = isAdded ? 'موجود در فرم' : '+ افزودن به امروز';

        const handleSelect = (e) => {
          e.stopPropagation();
          addSoapLabCard(test.id, test.label, curVal || '');
          soapLabSearchTray.classList.remove('is-active');
          soapLabSearchInput.value = '';
          updateSoapLabTrends();
          updateLivePreview();
        };

        actionBtn.addEventListener('click', handleSelect);
        card.addEventListener('click', handleSelect);

        topRow.appendChild(actionBtn);
        card.appendChild(topRow);
        list.appendChild(card);
      });

      soapLabSearchTray.appendChild(list);
      soapLabSearchTray.classList.add('is-active');
    };

    soapLabSearchInput.addEventListener('input', (e) => {
      renderSoapLabTray(e.target.value);
    });

    soapLabSearchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim()) {
        renderSoapLabTray(e.target.value);
      }
    });

    document.addEventListener('click', (e) => {
      if (!soapLabSearchInput.contains(e.target) && !soapLabSearchTray.contains(e.target)) {
        soapLabSearchTray.classList.remove('is-active');
      }
    });
  }

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
  document.querySelectorAll('.soap-mode-container .soap-plan-pill, #view-mode-soap .soap-plan-pill, #soapModeContainer .soap-plan-pill').forEach((pill) => {
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

    try {
      const payload = buildCloudSyncPayload(clinicalState);
      const res = await gsheetSync.sendPayload(payload, clinicalState);
      if (res.success) {
        showToast(res.message || 'پرونده با فرمت استاندارد در Google Sheets ثبت شد.', 'success');
      } else if (res.queued) {
        showToast(res.message || 'پرونده در صف همگام‌سازی محلی ذخیره شد.', 'warning');
      } else {
        showToast(res.message || 'خطا در ثبت اطلاعات.', 'warning');
      }
    } catch (err) {
      console.error('[CloudSync SOAP] Error:', err);
      showToast('خطا در ارسال به Google Sheets.', 'warning');
    } finally {
      btnSync.disabled = false;
      btnSync.innerHTML = `<span>${getIconSvg('bar-chart', { size: 14 })}</span><span>ثبت SOAP در Google Sheets</span>`;
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


/* ==========================================================================
   Section Completion Badges & Real-Time Counters
   ========================================================================== */
export function updateSectionCounters() {
  // CC
  const ccBadge = document.getElementById('badgeCountCC');
  if (ccBadge) {
    const isDone = Boolean(clinicalState.cc?.primaryComplaint || clinicalState.cc?.admissionType);
    ccBadge.innerHTML = isDone ? getIconSvg('check', { size: 10 }) : '';
    ccBadge.classList.toggle('has-count', isDone);
  }

  // HPI
  const hpiBadge = document.getElementById('badgeCountHPI');
  if (hpiBadge) {
    const count = (clinicalState.hpi?.presentations?.length || 0);
    hpiBadge.textContent = count > 0 ? String(count) : '';
    hpiBadge.classList.toggle('has-count', count > 0);
  }

  // PMH
  const pmhBadge = document.getElementById('badgeCountPMH');
  if (pmhBadge) {
    let pmhCount = 0;
    if (clinicalState.pmh) {
      Object.values(clinicalState.pmh).forEach(cat => {
        if (cat && typeof cat === 'object') {
          if (cat.status === 'negated') pmhCount++;
          if (cat.items && typeof cat.items === 'object') {
            Object.values(cat.items).forEach(st => {
              const v = typeof st === 'object' ? st.state : st;
              if (v === 1 || v === -1) pmhCount++;
            });
          }
        }
      });
    }
    if (Array.isArray(clinicalState.psh?.surgeries)) {
      pmhCount += clinicalState.psh.surgeries.length;
    }
    pmhBadge.textContent = pmhCount > 0 ? String(pmhCount) : '';
    pmhBadge.classList.toggle('has-count', pmhCount > 0);
  }

  // DH
  const dhBadge = document.getElementById('badgeCountDH');
  if (dhBadge) {
    const dhCount = (clinicalState.dh?.activeDrugs?.length || 0) + (clinicalState.dh?.customDrugs?.length || 0);
    dhBadge.textContent = dhCount > 0 ? String(dhCount) : '';
    dhBadge.classList.toggle('has-count', dhCount > 0);
  }

  // ROS
  const rosBadge = document.getElementById('badgeCountROS');
  if (rosBadge) {
    let rosCount = 0;
    if (clinicalState.ros && clinicalState.ros.systems) {
      Object.values(clinicalState.ros.systems).forEach(sys => {
        if (sys && typeof sys === 'object') {
          Object.values(sys).forEach(st => {
            const v = typeof st === 'object' ? st.state : st;
            if (v === 1 || v === -1) rosCount++;
          });
        }
      });
    }
    rosBadge.textContent = rosCount > 0 ? String(rosCount) : '';
    rosBadge.classList.toggle('has-count', rosCount > 0);
  }

  // PE
  const peBadge = document.getElementById('badgeCountPE');
  if (peBadge) {
    let peCount = 0;
    if (clinicalState.pe) {
      if (clinicalState.pe.vitals && Object.values(clinicalState.pe.vitals).some(v => v !== '')) peCount++;
      if (clinicalState.pe.comprehensiveSystems) {
        Object.values(clinicalState.pe.comprehensiveSystems).forEach(s => {
          if (s.isNormal || (s.selectedTags && s.selectedTags.length > 0) || s.text) peCount++;
        });
      }
    }
    peBadge.textContent = peCount > 0 ? String(peCount) : '';
    peBadge.classList.toggle('has-count', peCount > 0);
  }

  // Labs
  const labsBadge = document.getElementById('badgeCountLabs');
  if (labsBadge) {
    let labsCount = 0;
    if (clinicalState.paraclinics?.labs) {
      labsCount += Object.values(clinicalState.paraclinics.labs).filter(v => v !== '' && v != null).length;
    }
    if (clinicalState.paraclinics?.additionalLabs) {
      labsCount += Object.keys(clinicalState.paraclinics.additionalLabs).length;
    }
    labsBadge.textContent = labsCount > 0 ? String(labsCount) : '';
    labsBadge.classList.toggle('has-count', labsCount > 0);
  }

  // DDx
  const ddxBadge = document.getElementById('badgeCountDDx');
  if (ddxBadge) {
    let ddxCount = 0;
    if (clinicalState.reasoning?.workingDiagnosis) ddxCount++;
    if (Array.isArray(clinicalState.reasoning?.differentials)) ddxCount += clinicalState.reasoning.differentials.length;
    ddxBadge.textContent = ddxCount > 0 ? String(ddxCount) : '';
    ddxBadge.classList.toggle('has-count', ddxCount > 0);
  }
}

/* ==========================================================================
   Global Command Bar & Palette Modal (Ctrl+K)
   ========================================================================== */
function initCommandPalette() {
  const trigger = document.getElementById('globalCommandBarTrigger');
  const modal = document.getElementById('commandPaletteModal');
  const input = document.getElementById('commandPaletteInput');
  const results = document.getElementById('commandPaletteResults');
  const btnClose = document.getElementById('btnCloseCommandPalette');

  if (!modal || !input) return;

  let selectedIndex = 0;
  let currentItems = [];

  function openPalette() {
    modal.style.display = 'flex';
    modal.classList.add('open');
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }

  if (trigger) trigger.addEventListener('click', openPalette);
  if (btnClose) btnClose.addEventListener('click', closePalette);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePalette();
  });

  function renderResults(query) {
    results.innerHTML = '';
    currentItems = [];
    const q = query.trim().toLowerCase();

    // 1. Navigation items
    const navSections = [
      { type: 'nav', id: 'tab-cc', label: '۱. پذیرش و شکایت اصلی (CC)', shortcut: 'Alt+1' },
      { type: 'nav', id: 'tab-hpi', label: '۲. شرح بیماری فعلی (HPI)', shortcut: 'Alt+2' },
      { type: 'nav', id: 'tab-pmh', label: '۳. سوابق پزشکی و جراحی (PMH/PSH)', shortcut: 'Alt+3' },
      { type: 'nav', id: 'tab-dh', label: '۴. داروها و عادات (DH/SH/FH)', shortcut: 'Alt+4' },
      { type: 'nav', id: 'tab-ros', label: '۵. بررسی سیستم‌ها (ROS)', shortcut: 'Alt+5' },
      { type: 'nav', id: 'tab-pe', label: '۶. معاینه فیزیکی جامع (PE)', shortcut: 'Alt+6' },
      { type: 'nav', id: 'tab-paraclinics', label: '۷. پاراکلینیک و آزمایشگاه (Labs)', shortcut: 'Alt+7' },
      { type: 'nav', id: 'tab-reasoning', label: '۸. استدلال و نقشه درمان (DDx)', shortcut: 'Alt+8' },
      { type: 'mode', id: 'atls', label: 'مود ترومای حاد اورژانس (Emergency ATLS)', shortcut: 'Mode ATLS' },
      { type: 'mode', id: 'soap', label: 'مود سیر روزانه و ویزیت (SOAP Tracker)', shortcut: 'Mode SOAP' }
    ];

    const matchedNav = q ? navSections.filter(n => n.label.toLowerCase().includes(q)) : navSections;
    if (matchedNav.length > 0) {
      const cat = document.createElement('div');
      cat.className = 'cmd-category-title';
      cat.textContent = 'بخش‌ها و مودهای سیستم (Navigation)';
      results.appendChild(cat);

      matchedNav.forEach(n => {
        const row = document.createElement('div');
        row.className = 'cmd-item';
        row.innerHTML = `<span>${n.label}</span><kbd class="cmd-item-badge">${n.shortcut}</kbd>`;
        row.addEventListener('click', () => {
          closePalette();
          if (n.type === 'mode') {
            switchAppMode(n.id);
          } else {
            if (currentAppMode !== 'admission') switchAppMode('admission');
            const btn = document.querySelector(`.tab-btn[data-tab="${n.id}"]`);
            if (btn) btn.click();
          }
        });
        results.appendChild(row);
        currentItems.push(row);
      });
    }

    // 2. Symptoms Bank
    if (q.length >= 2) {
      const matchedSymptoms = filterSchemaItems(q, MASTER_SYMPTOMS_BANK).slice(0, 6);
      if (matchedSymptoms.length > 0) {
        const cat = document.createElement('div');
        cat.className = 'cmd-category-title';
        cat.textContent = 'علائم بالینی (Symptoms Bank)';
        results.appendChild(cat);

        matchedSymptoms.forEach(sym => {
          const row = document.createElement('div');
          row.className = 'cmd-item';
          row.innerHTML = `<span>${sym.label}</span><span class="cmd-item-badge">علامت بالینی</span>`;
          row.addEventListener('click', () => {
            closePalette();
            if (currentAppMode !== 'admission') switchAppMode('admission');
            const btn = document.querySelector('.tab-btn[data-tab="tab-hpi"]');
            if (btn) btn.click();
            showToast(`علامت «${sym.label}» یافت شد.`, 'info');
          });
          results.appendChild(row);
          currentItems.push(row);
        });
      }

      // 3. Drugs Bank
      const matchedDrugs = filterSchemaItems(q, ALL_MASTER_DRUGS).slice(0, 6);
      if (matchedDrugs.length > 0) {
        const cat = document.createElement('div');
        cat.className = 'cmd-category-title';
        cat.textContent = 'داروهای مصرفی (Medications Bank)';
        results.appendChild(cat);

        matchedDrugs.forEach(drug => {
          const row = document.createElement('div');
          row.className = 'cmd-item';
          row.innerHTML = `<span>${drug.label} ${drug.brands ? `<small>(${drug.brands})</small>` : ''}</span><span class="cmd-item-badge">+ افزودن به داروها</span>`;
          row.addEventListener('click', () => {
            closePalette();
            addActiveDrug(drug.id, drug.label, drug.category);
            if (currentAppMode !== 'admission') switchAppMode('admission');
            const btn = document.querySelector('.tab-btn[data-tab="tab-dh"]');
            if (btn) btn.click();
            showToast(`داروی «${drug.label}» به لیست داروهای فعال اضافه شد.`, 'success');
          });
          results.appendChild(row);
          currentItems.push(row);
        });
      }
    }

    selectedIndex = 0;
    updateHighlight();
  }

  function updateHighlight() {
    currentItems.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
    });
  }

  input.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItems[selectedIndex]) {
        currentItems[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (modal.style.display === 'flex') closePalette();
      else openPalette();
    }
  });
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key >= '1' && e.key <= '8') {
      e.preventDefault();
      const tabIndex = parseInt(e.key, 10) - 1;
      const tabIds = [
        'tab-cc', 'tab-hpi', 'tab-pmh', 'tab-dh',
        'tab-ros', 'tab-pe', 'tab-paraclinics', 'tab-reasoning'
      ];
      const targetId = tabIds[tabIndex];
      if (targetId) {
        if (currentAppMode !== 'admission') {
          switchAppMode('admission');
        }
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
        if (targetBtn) targetBtn.click();
      }
    }
  });
}

function initMobileDock() {
  const btnPrev = document.getElementById('btnMobilePrevTab');
  const btnNext = document.getElementById('btnMobileNextTab');
  const btnCopy = document.getElementById('btnMobileQuickCopy');

  const tabIds = [
    'tab-cc', 'tab-hpi', 'tab-pmh', 'tab-dh',
    'tab-ros', 'tab-pe', 'tab-paraclinics', 'tab-reasoning'
  ];

  function getCurrentTabIndex() {
    const activeBtn = document.querySelector('.tab-btn.active');
    const activeTabId = activeBtn?.dataset?.tab;
    return tabIds.indexOf(activeTabId);
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      const idx = getCurrentTabIndex();
      if (idx > 0) {
        const prevId = tabIds[idx - 1];
        const btn = document.querySelector(`.tab-btn[data-tab="${prevId}"]`);
        if (btn) btn.click();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const idx = getCurrentTabIndex();
      if (idx !== -1 && idx < tabIds.length - 1) {
        const nextId = tabIds[idx + 1];
        const btn = document.querySelector(`.tab-btn[data-tab="${nextId}"]`);
        if (btn) btn.click();
      }
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const btnCopyNote = document.getElementById('btnCopyNote');
      if (btnCopyNote) btnCopyNote.click();
    });
  }
}

function initDirectPrint() {
  const btnPrint = document.getElementById('btnPrintNote');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      updateLivePreview();
      window.print();
    });
  }
}

function initManualThemeToggle() {
  const btnTheme = document.getElementById('btnThemeToggleManual');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
      showToast(isDark ? 'تم شبانه (Dark Mode) فعال شد.' : 'تم روشن بالینی (Light Mode) فعال شد.', 'info');
    });
  }
}

/* ==========================================================================
   Secret Admin Vault Dashboard: Google Sheets Live Cloud Monitor (#admin-vault)
   Direct 100% cloud telemetry, live sheet explorer, and central monitoring.
   Integrates with Google Apps Script v2.5 (Raw_JSON_Vault & multi-sheet cloud).
   ========================================================================== */
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWKN6I80lNriVfPFr7XzZZm9wGdJckmms9led7xn7ieQJnbXz6oumHtWQ85uUHV0Q8/exec';

let adminVaultUnlocked = false;
let adminVaultCasesList = [];
let adminSelectedCase = null;
let adminActiveInspectTab = 'hp';
let cloudActiveTab = 'cases'; // 'cases' | 'hp' | 'soap' | 'atls'
let cloudSelectedCollector = 'all';
let cloudSearchQuery = '';
let cloudIsFetching = false;

export function checkSecretAdminRoute() {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const isAdminRoute = hash === '#admin-vault' || hash.includes('admin-vault') || search.includes('admin=1');

  const backdrop = document.getElementById('adminVaultModalBackdrop');
  if (!backdrop) return;

  if (isAdminRoute) {
    backdrop.style.display = 'flex';
    const scriptInp = document.getElementById('adminScriptUrlInput');
    if (scriptInp && !scriptInp.value) {
      scriptInp.value = (gsheetSync && gsheetSync.config && gsheetSync.config.scriptUrl) ? gsheetSync.config.scriptUrl : DEFAULT_SCRIPT_URL;
    }
    const pwdInput = document.getElementById('adminPasswordInput');
    if (pwdInput && !pwdInput.value) {
      pwdInput.value = 'SURG2026';
    }

    loadAdminVaultCases();
  } else {
    backdrop.style.display = 'none';
  }
}

/**
 * Renders the live collector stats bar above the table, displaying:
 * 1) Total cases badge
 * 2) Collector breakdown chips with case and SOAP day counts
 * 3) Prominent green button: "📊 باز کردن مستقیم Google Sheet مرکزی"
 */
export function renderAdminCollectorStatsBar(collectorStats = {}, totalCases = 0, sheetUrl = '') {
  const container = document.getElementById('adminCollectorsChipsContainer');
  if (!container) return;
  container.innerHTML = '';

  // 1. Total Cases Badge
  const totalBadge = document.createElement('div');
  totalBadge.className = 'badge';
  totalBadge.style.cssText = 'background: var(--primary); color: #fff; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem;';
  totalBadge.textContent = `مجموع پرونده‌های سرور: ${Number(totalCases || 0).toLocaleString('fa-IR')}`;
  container.appendChild(totalBadge);

  // 2. Collector Filter Chips
  if (collectorStats && typeof collectorStats === 'object') {
    // "All" filter chip
    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.className = `badge ${cloudSelectedCollector === 'all' ? 'active' : ''}`;
    btnAll.style.cssText = `cursor: pointer; padding: 0.35rem 0.65rem; border-radius: 6px; border: 1px solid var(--border-medium); font-size: 0.8rem; background: ${cloudSelectedCollector === 'all' ? 'var(--primary)' : 'var(--bg-elevated)'}; color: ${cloudSelectedCollector === 'all' ? '#fff' : 'var(--text-base)'};`;
    btnAll.textContent = 'همه ثبت‌کنندگان';
    btnAll.onclick = () => {
      cloudSelectedCollector = 'all';
      renderAdminCollectorStatsBar(collectorStats, totalCases, sheetUrl);
      renderAdminVaultTable();
    };
    container.appendChild(btnAll);

    Object.entries(collectorStats).forEach(([collectorName, stats]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isSelected = cloudSelectedCollector.toLowerCase() === collectorName.toLowerCase();
      chip.className = `badge ${isSelected ? 'active' : ''}`;
      chip.style.cssText = `cursor: pointer; padding: 0.35rem 0.65rem; border-radius: 6px; border: 1px solid var(--border-medium); font-size: 0.8rem; background: ${isSelected ? 'var(--primary)' : 'var(--bg-elevated)'}; color: ${isSelected ? '#fff' : 'var(--text-base)'};`;

      let detailText = '';
      if (typeof stats === 'object' && stats !== null) {
        const cCount = stats.totalCases || stats.cases || 0;
        const sDays = stats.soapDays || 0;
        detailText = `${collectorName}: ${cCount.toLocaleString('fa-IR')} پرونده${sDays ? ` | ${sDays.toLocaleString('fa-IR')} روز SOAP` : ''}`;
      } else {
        detailText = `${collectorName}: ${Number(stats).toLocaleString('fa-IR')} پرونده`;
      }
      chip.textContent = detailText;
      chip.onclick = () => {
        cloudSelectedCollector = isSelected ? 'all' : collectorName;
        renderAdminCollectorStatsBar(collectorStats, totalCases, sheetUrl);
        renderAdminVaultTable();
      };
      container.appendChild(chip);
    });
  }

  // 3. Green Button: "📊 باز کردن مستقیم Google Sheet مرکزی"
  const activeSheetUrl = sheetUrl || gsheetSync.config.lastSheetUrl || '';
  if (activeSheetUrl) {
    const btnOpenSheet = document.createElement('a');
    btnOpenSheet.href = activeSheetUrl;
    btnOpenSheet.target = '_blank';
    btnOpenSheet.rel = 'noopener noreferrer';
    btnOpenSheet.className = 'btn btn-secondary';
    btnOpenSheet.id = 'btnAdminLiveSheetUrl';
    btnOpenSheet.style.cssText = 'background: #059669; color: #fff; border: 1px solid #047857; font-weight: 700; font-size: 0.82rem; padding: 0.35rem 0.85rem; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; margin-right: auto;';
    btnOpenSheet.innerHTML = '<span>📊</span> <span>باز کردن مستقیم Google Sheet مرکزی</span>';
    container.appendChild(btnOpenSheet);
  }
}

/**
 * Loads cloud cases from Google Sheets via fetchCloudDatabase() and merges with local shift cases
 */
export async function loadAdminVaultCases() {
  if (cloudIsFetching) return;
  cloudIsFetching = true;

  const statusBadge = document.getElementById('adminCloudStatusBadge');
  const btnFetch = document.getElementById('btnAdminFetchCloud');
  const emptyPrompt = document.getElementById('adminTableEmptyPrompt');
  const table = document.getElementById('adminCloudDataTable') || document.getElementById('adminCasesTable');

  if (statusBadge) {
    statusBadge.textContent = '⏳ در حال واکشی اطلاعات زنده از Google Sheets (v2.5)...';
    statusBadge.style.color = '#38bdf8';
    statusBadge.style.background = 'rgba(56, 189, 248, 0.15)';
    statusBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  }
  if (btnFetch) {
    btnFetch.disabled = true;
    btnFetch.classList.add('loading');
  }

  const casesMap = new Map();
  let cloudRes = null;

  try {
    // 1. Fetch live cloud database from Google Sheets v2.5 (?action=getAllCases)
    cloudRes = await gsheetSync.fetchCloudDatabase();

    if (cloudRes && cloudRes.success) {
      if (Array.isArray(cloudRes.cases)) {
        cloudRes.cases.forEach((c) => {
          if (c && (c.caseId || c.metadata?.caseId)) {
            const cid = c.caseId || c.metadata?.caseId;
            casesMap.set(cid, { ...c, _source: 'cloud' });
          }
        });
      }

      renderAdminCollectorStatsBar(cloudRes.collectorStats, cloudRes.totalCases, cloudRes.sheetUrl);

      // Update KPI cards
      const kpiTotal = document.getElementById('kpiTotalCases');
      const kpiHp = document.getElementById('kpiHpCount');
      const kpiSoap = document.getElementById('kpiSoapCount');
      const kpiAtls = document.getElementById('kpiAtlsCount');

      const allList = Array.from(casesMap.values());
      const hpCount = allList.filter((c) => (c.mode === 'admission' || c.mode === 'hp' || (c.recordType || '').includes('HP'))).length;
      const soapCount = allList.reduce((sum, c) => sum + (Array.isArray(c.soapHistory) ? c.soapHistory.length : (c.mode === 'soap' ? 1 : 0)), 0);
      const atlsCount = allList.filter((c) => (c.mode === 'atls' || (c.recordType || '').includes('ATLS') || c.atls?.isTrauma)).length;

      if (kpiTotal) kpiTotal.textContent = Number(cloudRes.totalCases || casesMap.size).toLocaleString('fa-IR');
      if (kpiHp) kpiHp.textContent = Number(hpCount).toLocaleString('fa-IR');
      if (kpiSoap) kpiSoap.textContent = Number(soapCount).toLocaleString('fa-IR');
      if (kpiAtls) kpiAtls.textContent = Number(atlsCount).toLocaleString('fa-IR');

      if (statusBadge) {
        statusBadge.textContent = `✅ متصل به ابر مرکزی (واکشی در ساعت ${new Date().toLocaleTimeString('fa-IR')})`;
        statusBadge.style.color = '#34d399';
        statusBadge.style.background = 'rgba(52, 211, 153, 0.15)';
        statusBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
      }
    } else {
      if (statusBadge) {
        statusBadge.textContent = `⚠️ ${cloudRes?.message || 'خطا در واکشی ابری'}`;
        statusBadge.style.color = '#fbbf24';
      }
    }
  } catch (err) {
    console.error('[AdminVault] Cloud fetch error:', err);
    if (statusBadge) {
      statusBadge.textContent = `❌ خطا در واکشی: ${err.message || 'عدم دسترسی'}`;
      statusBadge.style.color = '#f87171';
    }
  }

  // 2. Merge local shift cases
  try {
    const shiftCases = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    if (Array.isArray(shiftCases)) {
      shiftCases.forEach((c) => {
        if (c && (c.caseId || c.metadata?.caseId)) {
          const cid = c.caseId || c.metadata?.caseId;
          if (!casesMap.has(cid)) {
            casesMap.set(cid, { ...c, _source: 'local_shift' });
          }
        }
      });
    }
  } catch (e) {}

  // 3. Current active draft case
  if (clinicalState && (clinicalState.caseId || clinicalState.demographics?.fullName || clinicalState.demographics?.name)) {
    const cid = clinicalState.caseId || 'CURRENT_ACTIVE';
    if (!casesMap.has(cid)) {
      casesMap.set(cid, { ...clinicalState, _source: 'active_draft' });
    }
  }

  adminVaultCasesList = Array.from(casesMap.values());
  renderAdminVaultTable();

  cloudIsFetching = false;
  if (btnFetch) {
    btnFetch.disabled = false;
    btnFetch.classList.remove('loading');
  }
}

/**
 * Renders the Admin Vault Cases table with full search, collector filter, and tri-state mode badges
 */
export function renderAdminVaultTable() {
  const table = document.getElementById('adminCloudDataTable') || document.getElementById('adminCasesTable');
  const thead = document.getElementById('adminCloudTableHead') || document.querySelector('#adminCasesTable thead');
  const tbody = document.getElementById('adminCloudTableBody') || document.getElementById('adminCasesTableBody');
  const emptyPrompt = document.getElementById('adminTableEmptyPrompt');
  const countBadge = document.getElementById('adminActiveRowsCount') || document.getElementById('adminCaseCountBadge');

  if (!table || !tbody) return;

  const q = (cloudSearchQuery || document.getElementById('adminFilterSearch')?.value || '').trim().toLowerCase();
  const targetCol = cloudSelectedCollector === 'all' ? null : cloudSelectedCollector.toLowerCase();

  const filtered = adminVaultCasesList.filter((c) => {
    // Collector filter
    if (targetCol) {
      const cCol = (c.collector || c.collectorName || c.metadata?.collectorId || '').toLowerCase();
      if (!cCol.includes(targetCol)) return false;
    }

    // Search query filter
    if (q) {
      const cid = (c.caseId || c.metadata?.caseId || '').toLowerCase();
      const col = (c.collector || c.collectorName || c.metadata?.collectorId || '').toLowerCase();
      const pt = (c.demographics?.fullName || c.demographics?.name || c.context?.fullName || c.patientName || c.patient || '').toLowerCase();
      const cc = (typeof c.cc === 'string' ? c.cc : (c.cc?.patientQuote || c.cc?.freeText || c.cc?.selectedComplaint || c.chiefComplaint || c.context?.workingDiagnosis || '')).toLowerCase();
      const note = (c.fullClinicalNote || c.clinical_note || c.note || '').toLowerCase();
      if (!cid.includes(q) && !col.includes(q) && !pt.includes(q) && !cc.includes(q) && !note.includes(q)) {
        return false;
      }
    }

    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length.toLocaleString('fa-IR')} پرونده`;
  }

  if (emptyPrompt) emptyPrompt.style.display = filtered.length > 0 ? 'none' : 'flex';
  table.style.display = 'table';

  if (thead) {
    thead.innerHTML = `
      <tr style="background: var(--bg-elevated); position: sticky; top: 0; z-index: 2;">
        <th style="width: 40px; text-align: center;">ردیف</th>
        <th style="width: 130px; direction: ltr; text-align: left;">کد پرونده (Case ID)</th>
        <th style="width: 100px; text-align: center;">نوع رکورد</th>
        <th style="width: 130px;">ثبت‌کننده</th>
        <th style="width: 120px; direction: ltr; text-align: left;">تاریخ و زمان</th>
        <th style="min-width: 220px;">خلاصه بیمار و شکایت</th>
        <th style="width: 230px; text-align: center;">عملیات زنده</th>
      </tr>
    `;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">هیچ پرونده‌ای با فیلترهای انتخابی یافت نشد.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((c, idx) => {
    const cid = c.caseId || c.metadata?.caseId || `CASE-${idx + 1}`;
    const recType = (c.recordType || c.record_type || c.mode || 'ADMISSION_HP').toUpperCase();
    const collector = c.collectorName || c.collector || c.metadata?.collectorId || 'نامشخص';
    const timeRaw = c.timestamp || c.metadata?.createdAt || c.admissionDate || c.demographics?.admissionDate || c.dateStr || '—';
    const timeStr = String(timeRaw).includes('T') ? String(timeRaw).replace('T', ' ').substring(0, 16) : String(timeRaw);

    const ptName = c.demographics?.fullName || c.demographics?.name || c.context?.fullName || c.patientName || c.patient || 'بیمار';
    const age = c.demographics?.age || c.context?.age || c.age || '';
    const gender = c.demographics?.gender || c.context?.gender || c.gender || '';
    const ageGender = [age ? `${age} ساله` : '', gender === 'female' ? 'خانم' : (gender === 'male' ? 'آقا' : gender)].filter(Boolean).join(' ');
    const cc = typeof c.cc === 'string' ? c.cc : (c.cc?.patientQuote || c.cc?.freeText || c.cc?.selectedComplaint || c.chiefComplaint || c.context?.workingDiagnosis || 'بدون شکایت');

    let typeBadge = '<span class="badge" style="background:#059669; color:#fff; font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px;">H&amp;P</span>';
    if (recType.includes('SOAP') || (Array.isArray(c.soapHistory) && c.soapHistory.length > 0)) {
      typeBadge = '<span class="badge" style="background:#2563eb; color:#fff; font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px;">SOAP</span>';
    } else if (recType.includes('ATLS') || c.atls?.isTrauma) {
      typeBadge = '<span class="badge" style="background:#dc2626; color:#fff; font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px;">ATLS</span>';
    }

    const isSelected = adminSelectedCase && ((adminSelectedCase.caseId && adminSelectedCase.caseId === cid) || (adminSelectedCase.metadata?.caseId && adminSelectedCase.metadata.caseId === cid));

    return `
      <tr class="cloud-case-row ${isSelected ? 'selected' : ''}" data-case-index="${idx}" style="cursor: pointer; border-bottom: 1px solid var(--border-subtle); ${isSelected ? 'background: rgba(37,99,235,0.12); font-weight: 700;' : ''}">
        <td style="text-align: center; color: var(--text-muted); font-size: 0.78rem;">${idx + 1}</td>
        <td style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--primary); direction: ltr; text-align: left;">${cid}</td>
        <td style="text-align: center;">${typeBadge}</td>
        <td style="font-size: 0.82rem; font-weight: 600;">${collector}</td>
        <td style="font-size: 0.76rem; color: var(--text-muted); direction: ltr; text-align: left;">${timeStr}</td>
        <td>
          <div style="font-size: 0.84rem; font-weight: 600;">${ptName} ${ageGender ? `(${ageGender})` : ''}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 280px;">${cc}</div>
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
            <button type="button" class="btn btn-secondary btn-cloud-view" data-case-index="${idx}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; background: var(--bg-elevated); border: 1px solid var(--border-medium);" title="مشاهده متن کامل">
              <span>👁️</span> <span>متن</span>
            </button>
            <button type="button" class="btn btn-primary btn-cloud-import" data-case-index="${idx}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; font-weight: 700;" title="بارگذاری در ادیتور">
              <span>📥</span> <span>ادیتور</span>
            </button>
            <button type="button" class="btn btn-secondary btn-cloud-json" data-case-index="${idx}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border-medium);" title="دانلود JSON">
              <span>📄</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach row action listeners
  tbody.querySelectorAll('.btn-cloud-view').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-case-index'), 10);
      const target = filtered[idx];
      if (target) inspectAdminCase(target);
    });
  });

  tbody.querySelectorAll('.btn-cloud-import').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-case-index'), 10);
      const target = filtered[idx];
      if (target) importCloudCaseToEditor(target);
    });
  });

  tbody.querySelectorAll('.btn-cloud-json').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-case-index'), 10);
      const target = filtered[idx];
      if (target) downloadSingleCaseJson(target);
    });
  });

  tbody.querySelectorAll('.cloud-case-row').forEach((row) => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.getAttribute('data-case-index'), 10);
      const target = filtered[idx];
      if (target) inspectAdminCase(target);
    });
  });
}

/**
 * Inspects a single case in the inspector drawer
 */
export function inspectAdminCase(c) {
  adminSelectedCase = c;
  const drawer = document.getElementById('adminCloudInspectorDrawer');
  const titleEl = document.getElementById('cloudInspectorCaseTitle') || document.getElementById('inspectorCaseTitle');
  const metaEl = document.getElementById('cloudInspectorCaseMeta') || document.getElementById('inspectorCaseMeta');

  const cid = c.caseId || c.metadata?.caseId || 'بدون شناسه';
  const ptName = c.demographics?.fullName || c.demographics?.name || c.context?.fullName || c.patientName || c.patient || 'بیمار';
  const age = c.demographics?.age || c.context?.age || c.age || '';
  const gender = c.demographics?.gender || c.context?.gender || c.gender || '';
  const ageGender = [age ? `${age} ساله` : '', gender === 'female' ? 'خانم' : (gender === 'male' ? 'آقا' : gender)].filter(Boolean).join(' ');
  const collector = c.collectorName || c.collector || c.metadata?.collectorId || 'نامشخص';
  const timeRaw = c.timestamp || c.metadata?.createdAt || c.admissionDate || c.demographics?.admissionDate || c.dateStr || '—';
  const recType = (c.recordType || c.record_type || c.mode || 'ADMISSION_HP').toUpperCase();

  if (titleEl) titleEl.textContent = `${cid} — ${ptName} ${ageGender ? `(${ageGender})` : ''}`;
  if (metaEl) metaEl.textContent = `ثبت‌کننده: ${collector} | نوع: ${recType} | تاریخ: ${timeRaw}`;

  updateAdminInspectorView();

  if (drawer) drawer.style.display = 'flex';
}

/**
 * Updates the text displayed inside the inspector view
 */
export function updateAdminInspectorView() {
  const pre = document.getElementById('cloudInspectorNotePre') || document.getElementById('inspectorNoteText');
  if (!pre) return;

  if (!adminSelectedCase) {
    pre.textContent = 'هیچ پرونده‌ای انتخاب نشده است.';
    return;
  }

  const c = adminSelectedCase;
  let noteText = '';
  if (c.fullClinicalNote) {
    noteText = c.fullClinicalNote;
  } else if (c.clinical_note) {
    noteText = c.clinical_note;
  } else if (c.note) {
    noteText = c.note;
  } else if (c.generatedTexts?.hp || c.generatedTexts?.soapAllDays || c.generatedTexts?.atls) {
    noteText = c.generatedTexts.hp || c.generatedTexts.soapAllDays || c.generatedTexts.atls;
  } else if (c.clinicalState && typeof c.clinicalState === 'object') {
    noteText = generateClinicalNote(c.clinicalState);
  } else if (c.rawStateJSON) {
    try {
      const parsed = JSON.parse(c.rawStateJSON);
      noteText = generateClinicalNote(parsed);
    } catch (_) {
      noteText = c.rawStateJSON;
    }
  } else if (c.hp) {
    noteText = generateClinicalNote(c);
  } else {
    noteText = JSON.stringify(c, null, 2);
  }

  pre.textContent = noteText;
}

/**
 * Loads a case into the editor
 */
function importCloudCaseToEditor(caseItem) {
  if (!caseItem) return;
  try {
    let sourceState = null;
    if (caseItem.clinicalState && typeof caseItem.clinicalState === 'object') {
      sourceState = caseItem.clinicalState;
    } else if (caseItem.record_json && typeof caseItem.record_json === 'object') {
      sourceState = caseItem.record_json;
    } else if (caseItem.record && typeof caseItem.record === 'object') {
      sourceState = caseItem.record;
    } else if (caseItem.rawJsonString) {
      try { sourceState = JSON.parse(caseItem.rawJsonString); } catch (_) {}
    } else if (caseItem.rawStateJSON) {
      try { sourceState = JSON.parse(caseItem.rawStateJSON); } catch (_) {}
    }

    const defaults = createDefaultClinicalState();
    if (!sourceState) {
      sourceState = {
        ...defaults,
        caseId: caseItem.caseId || caseItem.metadata?.caseId || `IMPORT-${Date.now()}`,
        demographics: {
          ...defaults.demographics,
          fullName: caseItem.demographics?.fullName || caseItem.patientName || caseItem.patient || '',
          age: caseItem.demographics?.age || caseItem.age || '',
          gender: caseItem.demographics?.gender || caseItem.gender || 'male'
        },
        cc: {
          ...defaults.cc,
          patientQuote: caseItem.chiefComplaint || (typeof caseItem.cc === 'string' ? caseItem.cc : caseItem.cc?.patientQuote) || ''
        }
      };
    }

    clinicalState = {
      ...defaults,
      ...sourceState,
      demographics: { ...defaults.demographics, ...(sourceState.demographics || {}) },
      admission: { ...defaults.admission, ...(sourceState.admission || {}) },
      cc: sourceState.cc || defaults.cc,
      hpi: { ...defaults.hpi, ...(sourceState.hpi || {}) },
      pmh: { ...defaults.pmh, ...(sourceState.pmh || {}) },
      psh: sourceState.psh || defaults.psh,
      dh: sourceState.dh || defaults.dh,
      allergies: sourceState.allergies || defaults.allergies,
      fh: { ...defaults.fh, ...(sourceState.fh || {}) },
      sh: { ...defaults.sh, ...(sourceState.sh || {}) },
      ros: { ...defaults.ros, ...(sourceState.ros || {}) },
      pe: { ...defaults.pe, ...(sourceState.pe || {}) },
      paraclinics: { ...defaults.paraclinics || sourceState.paraclinic || {} },
      assessment: { ...defaults.assessment, ...(sourceState.assessment || {}) },
      plan: { ...defaults.plan, ...(sourceState.plan || {}) },
      reasoning: { ...defaults.reasoning, ...(sourceState.reasoning || {}) },
      atls: { ...defaults.atls, ...(sourceState.atls || {}) }
    };

    if (Array.isArray(sourceState.hpi?.presentations) && sourceState.hpi.presentations.length > 0) {
      clinicalState.hpi.presentations = sourceState.hpi.presentations;
    }
    if (Array.isArray(sourceState.hpi?.painList) && sourceState.hpi.painList.length > 0) {
      clinicalState.hpi.painList = sourceState.hpi.painList;
    }

    if (Array.isArray(sourceState.soapHistory) && sourceState.soapHistory.length > 0) {
      const activeDay = sourceState.soapHistory[0];
      soapState = JSON.parse(JSON.stringify(activeDay.soapState || activeDay));
      syncSoapInputsFromState();
      renderSoapDayTracker();
    }

    saveCurrentCase();
    syncDomFromState();
    updateLivePreview();
    updateShiftCasesCount();
    populateHeaderCaseSwitcher();

    // Close admin drawer and modal
    const drawer = document.getElementById('adminCloudInspectorDrawer');
    if (drawer) drawer.style.display = 'none';
    const backdrop = document.getElementById('adminVaultModalBackdrop');
    if (backdrop) backdrop.style.display = 'none';

    if (typeof window !== 'undefined' && window.history) {
      const cleanUrl = window.location.pathname + window.location.search.replace(/[\?&]admin=1/, '');
      window.history.pushState('', document.title, cleanUrl || '/');
    }

    const cId = clinicalState.caseId || caseItem.caseId || 'پرونده';
    showToast(`پرونده «${cId}» با موفقیت در محیط ویرایشگر برنامه بارگذاری شد.`, 'success');
  } catch (err) {
    console.error('[AdminVault] Error importing case:', err);
    showToast('خطا در بارگذاری پرونده در ادیتور.', 'warning');
  }
}

function downloadSingleCaseJson(c) {
  if (!c) return;
  const jsonStr = JSON.stringify(c, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cid = c.caseId || c.metadata?.caseId || 'Case';
  a.download = `SurgCase_${cid}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`فایل JSON پرونده ${cid} دانلود شد.`, 'info');
}

/**
 * Standard CSV Export with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
 */
export function exportAdminDatabaseCsv() {
  if (!adminVaultCasesList || adminVaultCasesList.length === 0) {
    showToast('هیچ پرونده‌ای برای خروجی یافت نشد.', 'warning');
    return;
  }

  const headers = ['CaseID', 'PatientName', 'Age', 'Gender', 'Ward', 'Bed', 'Date', 'Collector', 'ChiefComplaint', 'Source', 'H&P_Note_Length', 'SOAP_Days_Count', 'IsTrauma'];
  const rows = adminVaultCasesList.map((c) => {
    const cid = c.caseId || c.metadata?.caseId || '';
    const pName = c.demographics?.fullName || c.demographics?.name || c.context?.fullName || c.patientName || c.patient || '';
    const age = c.demographics?.age || c.context?.age || c.age || '';
    const gender = c.demographics?.gender || c.context?.gender || c.gender || '';
    const ward = c.demographics?.ward || c.context?.ward || c.ward || '';
    const bed = c.demographics?.bed || c.context?.bed || c.bed || '';
    const cDate = c.timestamp || c.metadata?.createdAt || c.admissionDate || c.demographics?.admissionDate || c.dateStr || '';
    const collector = c.collectorName || c.collector || c.metadata?.collectorId || '';
    const cc = typeof c.cc === 'string' ? c.cc : (c.cc?.patientQuote || c.cc?.freeText || c.cc?.selectedComplaint || c.chiefComplaint || c.context?.workingDiagnosis || '');
    const source = c._source || 'cloud';
    const hpLen = (c.fullClinicalNote || generateClinicalNote(c) || '').length;
    const soapCount = Array.isArray(c.soapHistory) ? c.soapHistory.length : (c.mode === 'soap' ? 1 : 0);
    const isTrauma = (c.atls?.isTrauma || c.atls?.moi || c.mode === 'atls') ? 'Yes' : 'No';

    return [cid, pName, age, gender, ward, bed, cDate, collector, cc, source, hpLen, soapCount, isTrauma].map((val) => {
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Prefix with \uFEFF UTF-8 BOM so Persian characters display perfectly in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SurgMasterSheet_AllCases_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('خروجی اکسل CSV پرونده‌ها با استاندارد UTF-8 BOM دانلود شد.', 'success');
}

function exportAdminDatabaseJson() {
  if (!adminVaultCasesList || adminVaultCasesList.length === 0) {
    showToast('دیتابیس خالی است و پرونده‌ای برای خروجی وجود ندارد.', 'warning');
    return;
  }

  const jsonStr = JSON.stringify(adminVaultCasesList, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SurgCloud_Master_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('کل پایگاه داده به صورت JSON با موفقیت دانلود شد.', 'success');
}

export function initSecretAdminVault() {
  const btnFetch = document.getElementById('btnAdminFetchCloud');
  const btnRefresh = document.getElementById('btnAdminRefresh');
  const btnOpenSheet = document.getElementById('btnAdminOpenGoogleSheet');
  const btnExit = document.getElementById('btnAdminExitVault');
  const btnExportCsv = document.getElementById('btnAdminExportCsv');
  const btnExportJson = document.getElementById('btnAdminExportJson');
  const btnExportDb = document.getElementById('btnAdminExportDatabase');
  const searchInp = document.getElementById('adminCloudSearchInput') || document.getElementById('adminFilterSearch');

  // Connection triggers
  btnFetch?.addEventListener('click', () => loadAdminVaultCases());
  btnRefresh?.addEventListener('click', () => loadAdminVaultCases());

  document.getElementById('adminPasswordInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadAdminVaultCases();
    }
  });

  btnOpenSheet?.addEventListener('click', () => {
    const sheetUrl = gsheetSync.config.lastSheetUrl;
    if (sheetUrl && sheetUrl.startsWith('http')) {
      window.open(sheetUrl, '_blank');
    } else {
      showToast('آدرس مستقیم شیت هنوز از سرور دریافت نشده است. لطفاً دکمه واکشی را بزنید.', 'info');
    }
  });

  btnExit?.addEventListener('click', () => {
    const backdrop = document.getElementById('adminVaultModalBackdrop');
    if (backdrop) backdrop.style.display = 'none';
    if (typeof window !== 'undefined' && window.history) {
      const cleanUrl = window.location.pathname + window.location.search.replace(/[\?&]admin=1/, '');
      window.history.pushState('', document.title, cleanUrl || '/');
    }
    showToast('از پنل مدیریت مرکزی خارج شدید.', 'info');
  });

  // Central Exports (with \uFEFF UTF-8 BOM)
  btnExportCsv?.addEventListener('click', exportAdminDatabaseCsv);
  btnExportDb?.addEventListener('click', exportAdminDatabaseCsv);
  btnExportJson?.addEventListener('click', exportAdminDatabaseJson);

  // Live Search
  searchInp?.addEventListener('input', (e) => {
    cloudSearchQuery = e.target.value;
    renderAdminVaultTable();
  });

  // Filters
  document.getElementById('adminFilterType')?.addEventListener('change', renderAdminVaultTable);
  document.getElementById('adminFilterCollector')?.addEventListener('input', (e) => {
    cloudSelectedCollector = e.target.value || 'all';
    renderAdminVaultTable();
  });
  document.getElementById('adminFilterDate')?.addEventListener('change', renderAdminVaultTable);

  // Sheet Tabs Navigation
  const tabBtns = [
    { id: 'tabBtnCloudCases', key: 'cases' },
    { id: 'tabBtnSheetHp', key: 'hp' },
    { id: 'tabBtnSheetSoap', key: 'soap' },
    { id: 'tabBtnSheetAtls', key: 'atls' }
  ];

  tabBtns.forEach(({ id, key }) => {
    const btn = document.getElementById(id);
    btn?.addEventListener('click', () => {
      cloudActiveTab = key;
      tabBtns.forEach((b) => {
        document.getElementById(b.id)?.classList.toggle('active', b.key === key);
      });
      renderAdminVaultTable();
    });
  });

  // Inspector Drawer Actions
  document.getElementById('btnAdminCloseInspector')?.addEventListener('click', () => {
    const drawer = document.getElementById('adminCloudInspectorDrawer');
    if (drawer) drawer.style.display = 'none';
  });

  document.getElementById('btnAdminCopyInspectorNote')?.addEventListener('click', () => {
    const pre = document.getElementById('cloudInspectorNotePre') || document.getElementById('inspectorNoteText');
    if (pre && pre.textContent) {
      navigator.clipboard.writeText(pre.textContent).then(() => {
        showToast('متن شرح‌حال با موفقیت در کلیپ‌بورد کپی شد.', 'success');
      }).catch(() => {
        showToast('خطا در دسترسی به کلیپ‌بورد.', 'warning');
      });
    }
  });

  document.getElementById('btnAdminImportCaseToEditor')?.addEventListener('click', () => {
    if (adminSelectedCase) {
      importCloudCaseToEditor(adminSelectedCase);
    }
  });

  document.getElementById('btnAdminLoadCaseToEditor')?.addEventListener('click', () => {
    if (adminSelectedCase) {
      importCloudCaseToEditor(adminSelectedCase);
    }
  });

  document.getElementById('btnAdminDownloadCaseJson')?.addEventListener('click', () => {
    if (adminSelectedCase) {
      downloadSingleCaseJson(adminSelectedCase);
    }
  });
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
    initCommandPalette();
    initKeyboardShortcuts();
    initMobileDock();
    initDirectPrint();
    initManualThemeToggle();
    initSecretAdminVault();
    checkSecretAdminRoute();

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
  window.addEventListener('hashchange', checkSecretAdminRoute);

  window.addEventListener('beforeunload', () => {
    if (window.currentAppState) {
      localStorage.setItem('SURG_SCRIBE_ACTIVE_DRAFT_STATE', JSON.stringify(window.currentAppState));
    }
  });

  // Central continuous persistence on every input, change, and click across the entire app
  document.addEventListener('input', () => {
    persistCurrentStateNow();
  }, { passive: true });

  document.addEventListener('change', () => {
    persistCurrentStateNow();
  }, { passive: true });

  document.addEventListener('click', () => {
    setTimeout(() => {
      persistCurrentStateNow();
    }, 0);
  }, { passive: true });

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


