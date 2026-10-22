import {
  SURGICAL_SCHEMA,
  LAB_PANELS,
  ROS_GROUPS_BILINGUAL,
  PMH_CATEGORIES,
  DH_CATEGORIES,
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
  PE_NORMAL_BASELINES
} from './schema.js';
import { ClinicalCaseAnalytics, ClinicalTelemetryEngine } from './telemetry.js';
import {
  generateClinicalNote,
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
      informant: 'خود بیمار'
    },
    cc: {
      pathway: 'emergency_symptom', // 'emergency_symptom' | 'clinic_referral' | 'postop_complication'
      patientQuote: '',
      establishedDiagnosis: '',
      referringAttending: '',
      plannedProcedure: ''
    },
    hpi: {
      duration: '',
      presentations: [defaultPres],
      painList: [defaultPres], // maintained for seamless backward compatibility
      unlockedModules: [], // array of module IDs (e.g. 'mod_cholestasis')
      symptoms: {}, // chipId -> { state: 1|-1, detail: '' }
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
      note: '',
      systemGapNote: ''
    },
    dh: {
      categories: {}, // catId -> { drugs: { [drugId]: { active: false, dose: '', sig: 'Daily (روزانه)', note: '' } } }
      customDrugs: [], // array of { id, name, dose, sig, note }
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
      cigsPerDay: '',
      yearsSmoked: '',
      opium: '',
      note: '',
      systemGapNote: ''
    },
    fh: {
      selected: [], // array of { id, label, detail }
      note: '',
      systemGapNote: ''
    },
    ros: {
      items: {}, // itemId -> { state: 1|-1, detail: '' }
      showAllGenders: false,
      systemGapNote: ''
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
      note: '',
      systemGapNote: ''
    },
    paraclinics: {
      labs: {}, // labId -> string value
      labNote: '',
      imagingReports: [], // array of { id, modalityId, modalityLabel, date, tags: [{ id, label, detail }], summary: '' }
      systemGapNote: ''
    },
    reasoning: {
      problemRepresentation: '',
      ddx: ''
    }
  };
}

let clinicalState = createDefaultClinicalState();

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
    localStorage.setItem(STORAGE_CURRENT_CASE_KEY, JSON.stringify(clinicalState));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_CASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const defaults = createDefaultClinicalState();
      clinicalState = {
        ...defaults,
        ...parsed,
        demographics: { ...defaults.demographics, ...(parsed.demographics || {}) },
        cc: { ...defaults.cc, ...(parsed.cc || {}) },
        hpi: { ...defaults.hpi, ...(parsed.hpi || {}) },
        obgyn: { ...defaults.obgyn, ...(parsed.obgyn || {}) },
        pmh: { ...defaults.pmh, ...(parsed.pmh || {}) },
        psh: { ...defaults.psh, ...(parsed.psh || {}) },
        dh: { ...defaults.dh, ...(parsed.dh || {}) },
        ah: { ...defaults.ah, ...(parsed.ah || {}) },
        sh: { ...defaults.sh, ...(parsed.sh || {}) },
        fh: { ...defaults.fh, ...(parsed.fh || {}) },
        ros: { ...defaults.ros, ...(parsed.ros || {}) },
        pe: { ...defaults.pe, ...(parsed.pe || {}) },
        paraclinics: { ...defaults.paraclinics, ...(parsed.paraclinics || {}) },
        reasoning: { ...defaults.reasoning, ...(parsed.reasoning || {}) }
      };

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
      if (!clinicalState.hpi.presentations || !Array.isArray(clinicalState.hpi.presentations) || clinicalState.hpi.presentations.length === 0) {
        if (clinicalState.hpi.painList && Array.isArray(clinicalState.hpi.painList) && clinicalState.hpi.painList.length > 0) {
          clinicalState.hpi.presentations = clinicalState.hpi.painList.map((p) => ({ ...p, archetype: 'pain_archetype' }));
        } else {
          clinicalState.hpi.presentations = [createDefaultPresentation('pain_archetype', 1)];
        }
      }
      if (!clinicalState.hpi.painList || !Array.isArray(clinicalState.hpi.painList) || clinicalState.hpi.painList.length === 0) {
        clinicalState.hpi.painList = [createDefaultPainEpisode(1, 'کانون درد اول / شکایت محوری')];
      }
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage, resetting to fresh case:', e);
    clinicalState = createDefaultClinicalState();
  }
}

/* ==========================================================================
   Tab 1: Admission Pathway & Patient Demographics (with PII Sanitizer)
   ========================================================================== */
function initAdmissionPathwayHandlers() {
  const chipEmerg = document.getElementById('chipPathwayEmergency');
  const chipClinic = document.getElementById('chipPathwayClinic');
  const chipPostop = document.getElementById('chipPathwayPostop');
  const cardClinic = document.getElementById('cardCCReferral');

  function setPathway(pathway) {
    clinicalState.cc.pathway = pathway;
    chipEmerg?.classList.toggle('active', pathway === 'emergency_symptom');
    chipClinic?.classList.toggle('active', pathway === 'clinic_referral');
    chipPostop?.classList.toggle('active', pathway === 'postop_complication');

    if (cardClinic) {
      cardClinic.style.display = pathway === 'clinic_referral' ? 'block' : 'none';
    }
    saveCurrentCase();
    updateLivePreview();
  }

  chipEmerg?.addEventListener('click', () => setPathway('emergency_symptom'));
  chipClinic?.addEventListener('click', () => setPathway('clinic_referral'));
  chipPostop?.addEventListener('click', () => setPathway('postop_complication'));

  ['ccEstablishedDiagnosis', 'ccReferringAttending', 'ccPlannedProcedure'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      clinicalState.cc[id.replace('cc', '').charAt(0).toLowerCase() + id.replace('cc', '').slice(1)] = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  });

  document.getElementById('ccPatientQuote')?.addEventListener('input', (e) => {
    clinicalState.cc.patientQuote = e.target.value;
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
    demoInformant: 'informant'
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
      saveCurrentCase();
      updateLivePreview();
    });
  });
}

/* ==========================================================================
   Tab 2: HPI & 5 Clinical Presentation Archetypes Engine
   ========================================================================== */
function renderArchetypeSelectorBar() {
  const bar = document.getElementById('archetypeSelectorBar');
  if (!bar) return;
  bar.innerHTML = '';

  CLINICAL_PRESENTATION_ARCHETYPES.forEach((arch) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `archetype-pill-btn archetype-btn-${arch.id}`;
    btn.innerHTML = `
      <span class="arch-icon">${arch.icon}</span>
      <div class="arch-info">
        <span class="arch-title">${arch.labelFa}</span>
        <span class="arch-badge">${arch.badge}</span>
      </div>
    `;
    btn.addEventListener('click', () => {
      if (!clinicalState.hpi.presentations) clinicalState.hpi.presentations = [];
      const newId = clinicalState.hpi.presentations.length + 1;
      const newPres = createDefaultPresentation(arch.id, newId);
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
    bar.appendChild(btn);
  });
}

function renderHpiPresentations() {
  const container = document.getElementById('hpiPresentationsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!clinicalState.hpi.presentations || clinicalState.hpi.presentations.length === 0) {
    if (clinicalState.hpi.painList && clinicalState.hpi.painList.length > 0) {
      clinicalState.hpi.presentations = clinicalState.hpi.painList.map((p) => {
        const item = { ...p };
        item.archetype = 'pain_archetype';
        return item;
      });
    } else {
      clinicalState.hpi.presentations = [createDefaultPresentation('pain_archetype', 1)];
    }
  }

  // Backward compatibility: keep painList in sync with pain archetypes
  clinicalState.hpi.painList = clinicalState.hpi.presentations.filter(
    (p) => (p.archetype || p.type) === 'pain_archetype'
  );

  clinicalState.hpi.presentations.forEach((pres, index) => {
    const archType = pres.archetype || pres.type || 'pain_archetype';
    const card = document.createElement('div');
    card.className = `archetype-card card-archetype-${archType}`;
    card.dataset.id = String(pres.id);

    // Header
    const header = document.createElement('div');
    header.className = 'archetype-card-header';

    const titleArea = document.createElement('div');
    titleArea.className = 'archetype-card-title';

    const iconMap = {
      pain_archetype: '⚡',
      mass_lesion_archetype: '🔘',
      trauma_burn_archetype: '🚨',
      functional_bleeding_archetype: '🩸',
      elective_asymptomatic_archetype: '📋'
    };
    const badgeMap = {
      pain_archetype: 'درد (Pain)',
      mass_lesion_archetype: 'توده و ضایعه (Mass)',
      trauma_burn_archetype: 'تروما و سوختگی (ATLS)',
      functional_bleeding_archetype: 'عملکردی / خونریزی (Functional)',
      elective_asymptomatic_archetype: 'الکتیو بی‌علامت (Elective)'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'arch-icon';
    iconSpan.textContent = iconMap[archType] || '📍';
    titleArea.appendChild(iconSpan);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'archetype-title-input';
    titleInput.value = pres.title || `مواجهه بالینی #${index + 1}`;
    titleInput.placeholder = 'عنوان شکایت...';
    titleInput.addEventListener('input', (e) => {
      pres.title = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    titleArea.appendChild(titleInput);

    const badge = document.createElement('span');
    badge.className = 'archetype-badge';
    badge.textContent = badgeMap[archType] || archType;
    titleArea.appendChild(badge);

    header.appendChild(titleArea);

    if (clinicalState.hpi.presentations.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-archetype-card';
      delBtn.innerHTML = `<span>🗑️</span><span>حذف این مواجهه</span>`;
      delBtn.addEventListener('click', () => {
        clinicalState.hpi.presentations.splice(index, 1);
        renderHpiPresentations();
        saveCurrentCase();
        updateLivePreview();
      });
      header.appendChild(delBtn);
    }

    card.appendChild(header);

    // Body based on archetype
    if (archType === 'mass_lesion_archetype') {
      renderMassLesionArchetypeBody(card, pres);
    } else if (archType === 'trauma_burn_archetype') {
      renderTraumaBurnArchetypeBody(card, pres);
    } else if (archType === 'functional_bleeding_archetype') {
      renderFunctionalBleedingArchetypeBody(card, pres);
    } else if (archType === 'elective_asymptomatic_archetype') {
      renderElectiveArchetypeBody(card, pres);
    } else {
      renderPainArchetypeBody(card, pres, index);
    }

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

  if (pattern === 'localized_to_generalized' || pattern === 'migratory_shifting') {
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

function initPshHandlers() {
  const pshEl = document.getElementById('pshNote');
  if (pshEl) {
    pshEl.addEventListener('input', (e) => {
      clinicalState.psh.note = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
  }
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
function renderDhCategories() {
  const container = document.getElementById('dhCategoriesContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!clinicalState.dh.categories) clinicalState.dh.categories = {};

  DH_CATEGORIES.forEach((cat) => {
    if (!clinicalState.dh.categories[cat.id]) {
      clinicalState.dh.categories[cat.id] = { drugs: {} };
    }
    const catData = clinicalState.dh.categories[cat.id];

    const group = document.createElement('div');
    group.className = 'dh-category-group';

    const header = document.createElement('div');
    header.className = 'dh-category-header';
    header.textContent = cat.title;
    group.appendChild(header);

    cat.drugs.forEach((drug) => {
      if (!catData.drugs[drug.id]) {
        catData.drugs[drug.id] = { active: false, dose: drug.defaultDose, sig: 'Daily (روزانه)', note: '' };
      }
      const entry = catData.drugs[drug.id];

      const row = document.createElement('div');
      row.className = `dh-drug-row ${entry.active ? 'active' : ''}`;

      const topBar = document.createElement('div');
      topBar.className = 'dh-drug-top-bar';

      const label = document.createElement('span');
      label.className = 'dh-drug-label';
      label.innerHTML = `<span>${entry.active ? '☑️' : '◻️'}</span> <span>${drug.label}</span>`;
      topBar.appendChild(label);
      row.appendChild(topBar);

      const box3 = document.createElement('div');
      box3.className = 'dh-3box-container';
      box3.style.display = entry.active ? 'flex' : 'none';

      const doseInp = document.createElement('input');
      doseInp.type = 'text';
      doseInp.className = 'dh-dose-input';
      doseInp.value = entry.dose || drug.defaultDose;
      doseInp.placeholder = 'دوز...';

      const sigSel = document.createElement('select');
      sigSel.className = 'dh-sig-select';
      DH_SIG_OPTIONS.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (entry.sig === opt) option.selected = true;
        sigSel.appendChild(option);
      });

      const noteInp = document.createElement('input');
      noteInp.type = 'text';
      noteInp.className = 'dh-note-input';
      noteInp.value = entry.note || '';
      noteInp.placeholder = 'توضیح / آخرین دوز (مثلاً ۳ روز قبل قطع شده)...';

      doseInp.addEventListener('input', (e) => {
        entry.dose = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      sigSel.addEventListener('change', (e) => {
        entry.sig = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });
      noteInp.addEventListener('input', (e) => {
        entry.note = e.target.value;
        saveCurrentCase();
        updateLivePreview();
      });

      box3.appendChild(doseInp);
      box3.appendChild(sigSel);
      box3.appendChild(noteInp);
      row.appendChild(box3);

      label.addEventListener('click', () => {
        entry.active = !entry.active;
        row.classList.toggle('active', entry.active);
        box3.style.display = entry.active ? 'flex' : 'none';
        label.innerHTML = `<span>${entry.active ? '☑️' : '◻️'}</span> <span>${drug.label}</span>`;
        saveCurrentCase();
        updateLivePreview();
      });

      group.appendChild(row);
    });

    container.appendChild(group);
  });
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

  // SH
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
    saveCurrentCase();
    updateLivePreview();
  }
  cigs?.addEventListener('input', updatePackYear);
  years?.addEventListener('input', updatePackYear);

  document.getElementById('shOpium')?.addEventListener('input', (e) => {
    clinicalState.sh.opium = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });
  document.getElementById('shNote')?.addEventListener('input', (e) => {
    clinicalState.sh.note = e.target.value;
    saveCurrentCase();
    updateLivePreview();
  });

  // FH
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
   Live Quick Search & Tag Filter
   ========================================================================== */
function initTagQuickSearch() {
  const searchInputs = document.querySelectorAll('.tag-quick-search-input');
  searchInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      const query = (e.target.value || '').trim().toLowerCase();
      const targetSelector = input.dataset.searchTarget;
      const targetContainer = targetSelector
        ? document.querySelector(targetSelector)
        : input.closest('.clinical-card, .tab-pane');
      if (!targetContainer) return;

      const items = targetContainer.querySelectorAll(
        '.split-chip-wrap, .tristate-chip-wrapper, .tree-leaf-item, .dh-drug-card, .ros-item-row, .factor-chip, .pattern-pill-btn'
      );

      if (!query) {
        items.forEach((item) => {
          item.classList.remove('search-hidden');
          item.style.display = '';
        });
        return;
      }

      items.forEach((item) => {
        const text = (item.textContent || '').toLowerCase();
        if (text.includes(query)) {
          item.classList.remove('search-hidden');
          item.style.display = '';
          let parent = item.parentElement;
          while (parent && parent !== targetContainer) {
            if (parent.classList.contains('subsystem-accordion') || parent.classList.contains('pmh-tree-card')) {
              parent.classList.remove('is-collapsed');
            }
            if (parent.classList.contains('tree-leaves-container')) {
              parent.style.display = 'block';
            }
            parent = parent.parentElement;
          }
        } else {
          item.classList.add('search-hidden');
          item.style.display = 'none';
        }
      });
    });
  });
}

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
function renderParaclinicLabs() {
  const container = document.getElementById('paraclinicLabPanelsContainer');
  if (!container) return;
  container.innerHTML = '';

  LAB_PANELS.forEach((panel) => {
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

function updateLivePreview() {
  const noteMarkdown = generateClinicalNote(clinicalState);

  const desktopPreview = document.getElementById('liveNotePreview');
  const mobilePreview = document.getElementById('mobileLiveNotePreview');

  // Format markdown to HTML simply for live preview
  const formattedHtml = formatMarkdownForDisplay(noteMarkdown);

  if (desktopPreview) desktopPreview.innerHTML = formattedHtml;
  if (mobilePreview) mobilePreview.innerHTML = formattedHtml;

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
    .replace(/^> \*\*Patient Demographics:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>Patient Demographics:</strong> $1</div>')
    .replace(/^### (.*$)/gm, '<h3 class="preview-h3">$1</h3>')
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

  const obgynCard = document.getElementById('cardObGynHistory');
  if (obgynCard) {
    obgynCard.style.display = d.gender === 'male' ? 'none' : 'block';
  }

  // CC
  const cc = clinicalState.cc;
  if (cc.pathway === 'clinic_referral') {
    document.getElementById('chipPathwayClinic')?.click();
  } else if (cc.pathway === 'postop_complication') {
    document.getElementById('chipPathwayPostop')?.click();
  } else {
    document.getElementById('chipPathwayEmergency')?.click();
  }

  if (document.getElementById('ccPatientQuote')) document.getElementById('ccPatientQuote').value = cc.patientQuote || '';
  if (document.getElementById('ccEstablishedDiagnosis')) document.getElementById('ccEstablishedDiagnosis').value = cc.establishedDiagnosis || '';
  if (document.getElementById('ccReferringAttending')) document.getElementById('ccReferringAttending').value = cc.referringAttending || '';
  if (document.getElementById('ccPlannedProcedure')) document.getElementById('ccPlannedProcedure').value = cc.plannedProcedure || '';

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

  // DH / AH / SH / FH
  renderDhCategories();
  renderCustomDrugs();
  if (document.getElementById('dhNote')) document.getElementById('dhNote').value = clinicalState.dh.note || '';
  if (document.getElementById('dhSystemGapInput')) document.getElementById('dhSystemGapInput').value = clinicalState.dh.systemGapNote || '';

  if (document.getElementById('ahNote')) document.getElementById('ahNote').value = clinicalState.ah.note || '';
  if (document.getElementById('ahSystemGapInput')) document.getElementById('ahSystemGapInput').value = clinicalState.ah.systemGapNote || '';
  if (document.getElementById('shCigsPerDay')) document.getElementById('shCigsPerDay').value = clinicalState.sh.cigsPerDay || '';
  if (document.getElementById('shYearsSmoked')) document.getElementById('shYearsSmoked').value = clinicalState.sh.yearsSmoked || '';
  if (document.getElementById('shOpium')) document.getElementById('shOpium').value = clinicalState.sh.opium || '';
  if (document.getElementById('shNote')) document.getElementById('shNote').value = clinicalState.sh.note || '';
  if (document.getElementById('shSystemGapInput')) document.getElementById('shSystemGapInput').value = clinicalState.sh.systemGapNote || '';
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
}

/* ==========================================================================
   Export, Copy, PII Privacy & Modals
   ========================================================================== */
function initExportAndCopy() {
  function copyText() {
    const text = generateClinicalNote(clinicalState);
    navigator.clipboard.writeText(text).then(() => {
      showToast('متن کامل شرح‌حال در حافظه کپی شد.', 'success');
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
    updateShiftCasesCount();
  } catch (e) {
    console.warn('Failed to save to shift vault:', e);
  }
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
      </div>
    `;
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
          <button type="button" class="btn btn-secondary btn-sm btn-delete-case" style="color:#EF4444;" title="${isEn ? 'Delete' : 'حذف پرونده'}">✕</button>
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

      item.querySelector('.btn-delete-case').addEventListener('click', () => {
        const confirmDel = isEn ? `Delete case ${c.caseId} from shift vault?` : `حذف پرونده ${c.caseId} از حافظه شیفت؟`;
        if (confirm(confirmDel)) {
          list.splice(idx, 1);
          localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(list));
          updateShiftCasesCount();
          renderShiftCasesList();
          showToast(isEn ? `Case ${c.caseId} removed.` : `پرونده ${c.caseId} حذف شد.`, 'info');
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

    const note = generateClinicalNote(clinicalState);
    const meta = ClinicalCaseAnalytics.buildMetadataSnapshot(clinicalState, gsheetSync.config.collectorName);

    try {
      const res = await gsheetSync.sendCase(clinicalState, note, meta);
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
export function initApp() {
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
    initTagQuickSearch();
    initReasoningHandlers();
    initSystemGapLoggers();
    initNavigationTabs();
    initExportAndCopy();
    initAppSettings();
    initShiftManager();
    initCloudSyncUI();
    initThemeToggle();
    initMobileBottomSheet();

    loadSavedState();
    syncDomFromState();
    updateLivePreview();
    updateShiftCasesCount();
    console.log('[Surg-Scribe v0.6] Application initialized successfully.');
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
