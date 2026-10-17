import { SURGICAL_SCHEMA } from './schema.js';
import { ClinicalTelemetryEngine } from './telemetry.js';
import { generateClinicalNote, normalizePersianClinicalText, synthesizeProblemRepresentation } from './generator.js';
import { CloudSyncManager } from './cloud-sync.js';

/* ==========================================================================
   State & Global Singletons (v0.3-Surg)
   ========================================================================== */
const STORAGE_CURRENT_CASE_KEY = 'surg_current_case_v03';
const STORAGE_SHIFT_CASES_KEY = 'surg_shift_cases_v03';
const STORAGE_THEME_KEY = 'surg_theme_mode';

let telemetry = new ClinicalTelemetryEngine(15000);
let cloudSync = new CloudSyncManager();
let activeSectionId = 'cc_admission';

function generateCaseId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SURG-${year}${month}${day}-${rand}`;
}

function createDefaultClinicalState() {
  return {
    caseId: generateCaseId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    demographics: {
      gender: 'male',
      age: '',
      marital: 'متأهل',
      city: '',
      occupation: '',
      informant: 'خود بیمار'
    },
    cc: {
      pathway: 'emergency_symptom',
      selectedCategoryId: 'abdominal_gi_biliary',
      selectedCategoryLabel: 'درد شکم، شکایات کبدی-صفراوی و گوارشی',
      patientQuote: '',
      establishedDiagnosis: '',
      referringAttending: '',
      plannedProcedure: ''
    },
    hpi: {
      onset: '',
      course: '',
      character: '',
      severity: 5,
      duration: '',
      spatialPattern: 'localized',
      selectedRegions: ['rlq'],
      initialRegions: [],
      currentRegions: [],
      radiation: ['rad_none'],
      secondaryPain: {
        region: '',
        character: '',
        relation: ''
      },
      symptoms: {}, // id -> { state: 1|-1, detail: '' }
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
      note: ''
    },
    pmh: {
      items: {}, // id -> { state: 1|-1, detail: '' } (Tri-state PMH)
      systemGapNote: ''
    },
    psh: {
      note: '',
      systemGapNote: ''
    },
    hh: {
      note: '',
      systemGapNote: ''
    },
    dh: {
      highAlert: [], // array of { id, label, category, lastDose, detail }
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
      items: {}, // id -> { state: 1|-1, detail: '' }
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
      findings: {}, // id -> { state: 1|-1, detail: '' }
      note: '',
      systemGapNote: ''
    },
    paraclinics: {
      labs: {}, // id -> string value
      labNote: '',
      imagingReports: [], // array of { modalityId, modalityLabel, date, tags: [{ id, label, detail }], summary: '' }
      systemGapNote: ''
    },
    reasoning: {
      selectedSQs: [],
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

function cycleTriStateValue(currentVal) {
  if (currentVal === undefined || currentVal === 0) return 1;
  if (currentVal === 1) return -1;
  return 0; // -1 -> 0
}

/**
 * Creates a Tri-State Clinical Chip with an immediate Inline Contextual Detail Input
 */
function renderInlineDetailTriStateChip(options) {
  const { id, label, detailHint, currentItemData, sectionId, onStateChange, onDetailChange } = options;
  const val = currentItemData ? (typeof currentItemData === 'object' ? currentItemData.state : currentItemData) : 0;
  const detail = currentItemData && typeof currentItemData === 'object' ? (currentItemData.detail || '') : '';

  const wrap = document.createElement('div');
  wrap.className = `clinical-chip-wrap ${val === 1 ? 'has-inline-open' : ''}`;
  wrap.dataset.id = id;

  const chip = document.createElement('div');
  chip.className = 'clinical-chip';
  chip.dataset.id = id;
  chip.dataset.state = String(val);

  let iconText = '';
  if (val === 1) iconText = '+';
  else if (val === -1) iconText = '−';

  chip.innerHTML = `
    <span class="chip-icon">${iconText}</span>
    <span class="chip-label">${label}</span>
  `;

  const inlineInput = document.createElement('input');
  inlineInput.type = 'text';
  inlineInput.className = 'inline-detail-input';
  inlineInput.placeholder = detailHint || 'توضیحات تکمیلی...';
  inlineInput.value = detail;

  chip.addEventListener('click', (e) => {
    e.preventDefault();
    const currentVal = parseInt(chip.dataset.state, 10) || 0;
    const nextVal = cycleTriStateValue(currentVal);

    chip.dataset.state = String(nextVal);
    const iconEl = chip.querySelector('.chip-icon');
    if (nextVal === 1) {
      iconEl.textContent = '+';
      wrap.classList.add('has-inline-open');
      setTimeout(() => inlineInput.focus(), 60);
    } else if (nextVal === -1) {
      iconEl.textContent = '−';
      wrap.classList.remove('has-inline-open');
    } else {
      iconEl.textContent = '';
      wrap.classList.remove('has-inline-open');
    }

    onStateChange(nextVal, inlineInput.value);
    telemetry.recordInteraction(sectionId, 'chip_tap');
    updateLivePreview();
  });

  inlineInput.addEventListener('input', (e) => {
    onDetailChange(e.target.value);
    telemetry.recordInteraction(sectionId, 'inline_detail', true);
    updateLivePreview();
  });

  wrap.appendChild(chip);
  wrap.appendChild(inlineInput);
  return wrap;
}

/* ==========================================================================
   Initialization & Dynamic DOM Population
   ========================================================================== */
function initDynamicUI() {
  initGlobalTelemetryDelegation();
  initAdmissionPathwayHandlers();
  initDemographicsHandlers();
  renderCCCategoryChips();

  // Tab 2: HPI & Pain Trajectory
  initOldcartsHandlers();
  renderPainSpatialPatterns();
  renderRadiationSites();
  initSecondaryPainHandlers();
  renderHpiSymptomGroups();

  // Tab 3: PMH / PSH / HH / ObGyn
  renderPmhChips();
  initPmhPshHhHandlers();
  initObGynHandlers();

  // Tab 4: DH / AH / SH / FH
  renderHighAlertDrugs();
  renderAllergyTemplates();
  initShCalculator();
  renderFhChips();

  // Tab 5: ROS (11 Systems)
  renderRosGroups();

  // Tab 6: PE
  initPeVitalsHandlers();
  renderPeFindings();

  // Tab 7: Paraclinics
  renderParaclinicLabs();
  renderImagingModalities();

  // Tab 8: Clinical Reasoning
  renderSemanticQualifiers();
  initReasoningHandlers();

  // System Gap Loggers in all sections
  initSystemGapLoggers();

  // Navigation, Telemetry Ticker & Modals
  initNavigationTabs();
  initShiftManager();
  initCloudSyncUI();
  initThemeToggle();
  initExportAndCopy();
  initMobileBottomSheet();
  startTelemetryTicker();

  // Load and synchronize state
  loadSavedState();
  syncDomFromState();
  updateLivePreview();
}

/* --- System Gap Loggers Setup --- */
function initSystemGapLoggers() {
  const gapMap = [
    { inputId: 'hpiSystemGapInput', section: 'hpi', target: () => clinicalState.hpi },
    { inputId: 'pmhSystemGapInput', section: 'pmh_psh_hh', target: () => clinicalState.pmh },
    { inputId: 'pshSystemGapInput', section: 'pmh_psh_hh', target: () => clinicalState.psh },
    { inputId: 'hhSystemGapInput', section: 'pmh_psh_hh', target: () => clinicalState.hh },
    { inputId: 'dhSystemGapInput', section: 'ah_dh_sh_fh', target: () => clinicalState.dh },
    { inputId: 'ahSystemGapInput', section: 'ah_dh_sh_fh', target: () => clinicalState.ah },
    { inputId: 'shSystemGapInput', section: 'ah_dh_sh_fh', target: () => clinicalState.sh },
    { inputId: 'fhSystemGapInput', section: 'ah_dh_sh_fh', target: () => clinicalState.fh },
    { inputId: 'rosSystemGapInput', section: 'ros', target: () => clinicalState.ros },
    { inputId: 'peSystemGapInput', section: 'pe', target: () => clinicalState.pe },
    { inputId: 'paraclinicSystemGapInput', section: 'paraclinics', target: () => clinicalState.paraclinics }
  ];

  gapMap.forEach(({ inputId, section, target }) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const val = e.target.value;
      target().systemGapNote = val;
      telemetry.logSystemGap(section, val);
      updateLivePreview();
    });
  });
}

/* --- Tab 1: Admission & CC --- */
function initAdmissionPathwayHandlers() {
  const chipEmerg = document.getElementById('chipPathwayEmergency');
  const chipClinic = document.getElementById('chipPathwayClinic');
  const chipPostop = document.getElementById('chipPathwayPostop');
  const cardEmerg = document.getElementById('cardCCEmergency');
  const cardClinic = document.getElementById('cardCCReferral');

  function setPathway(pathway) {
    clinicalState.cc.pathway = pathway;
    chipEmerg?.classList.toggle('active', pathway === 'emergency_symptom');
    chipClinic?.classList.toggle('active', pathway === 'clinic_referral');
    chipPostop?.classList.toggle('active', pathway === 'postop_complication');

    if (pathway === 'clinic_referral') {
      if (cardEmerg) cardEmerg.style.display = 'none';
      if (cardClinic) cardClinic.style.display = 'flex';
    } else {
      if (cardEmerg) cardEmerg.style.display = 'flex';
      if (cardClinic) cardClinic.style.display = 'none';
    }
    telemetry.recordInteraction('cc_admission', 'pathway_switch');
    updateLivePreview();
  }

  chipEmerg?.addEventListener('click', () => setPathway('emergency_symptom'));
  chipClinic?.addEventListener('click', () => setPathway('clinic_referral'));
  chipPostop?.addEventListener('click', () => setPathway('postop_complication'));

  ['ccEstablishedDiagnosis', 'ccReferringAttending', 'ccPlannedProcedure', 'ccReferralPatientQuote'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      telemetry.recordInteraction('cc_admission', 'typing', true);
      if (id === 'ccEstablishedDiagnosis') clinicalState.cc.establishedDiagnosis = e.target.value;
      if (id === 'ccReferringAttending') clinicalState.cc.referringAttending = e.target.value;
      if (id === 'ccPlannedProcedure') clinicalState.cc.plannedProcedure = e.target.value;
      if (id === 'ccReferralPatientQuote') clinicalState.cc.patientQuote = e.target.value;
      updateLivePreview();
    });
  });

  document.getElementById('ccPatientQuote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('cc_admission', 'typing', true);
    clinicalState.cc.patientQuote = e.target.value;
    updateLivePreview();
  });

  document.getElementById('hpiDuration')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('cc_admission', 'typing', true);
    clinicalState.hpi.duration = e.target.value;
    updateLivePreview();
  });
}

function renderCCCategoryChips() {
  const container = document.getElementById('ccCategoryChipsContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.chiefComplaints.forEach((cc) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `toggle-chip ${clinicalState.cc.selectedCategoryId === cc.id ? 'active' : ''}`;
    btn.textContent = cc.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toggle-chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      clinicalState.cc.selectedCategoryId = cc.id;
      clinicalState.cc.selectedCategoryLabel = cc.label;
      telemetry.recordInteraction('cc_admission', 'select_cc');
      renderHpiSymptomGroups();
      updateLivePreview();
    });
    container.appendChild(btn);
  });
}

function initDemographicsHandlers() {
  const map = {
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
      telemetry.recordInteraction('cc_admission', 'typing');
      clinicalState.demographics[prop] = e.target.value;
      if (prop === 'gender') {
        const obgynCard = document.getElementById('cardObGynHistory');
        if (obgynCard) {
          obgynCard.style.display = e.target.value === 'female' ? 'block' : 'none';
        }
      }
      updateLivePreview();
    });
  });
}

/* --- Tab 2: HPI, OLDCARTS & Spatial-Temporal Pain Trajectory Mapper --- */
function initOldcartsHandlers() {
  const onset = document.getElementById('hpiOnset');
  const course = document.getElementById('hpiCourse');
  const character = document.getElementById('hpiCharacter');
  const severity = document.getElementById('hpiSeverity');
  const severityLabel = document.getElementById('hpiSeverityLabel');
  const severityBadge = document.getElementById('hpiSeverityBadge');
  const workup = document.getElementById('hpiPreAdmissionWorkup');
  const narrative = document.getElementById('hpiNarrativeNote');

  onset?.addEventListener('change', (e) => {
    telemetry.recordInteraction('hpi', 'change');
    clinicalState.hpi.onset = e.target.value;
    updateLivePreview();
  });

  course?.addEventListener('change', (e) => {
    telemetry.recordInteraction('hpi', 'change');
    clinicalState.hpi.course = e.target.value;
    updateLivePreview();
  });

  character?.addEventListener('change', (e) => {
    telemetry.recordInteraction('hpi', 'change');
    clinicalState.hpi.character = e.target.value;
    updateLivePreview();
  });

  severity?.addEventListener('input', (e) => {
    telemetry.recordInteraction('hpi', 'slider');
    const val = e.target.value;
    clinicalState.hpi.severity = val;
    if (severityLabel) severityLabel.textContent = `${val} / 10`;
    if (severityBadge) severityBadge.textContent = `${val} / 10`;
    updateLivePreview();
  });

  workup?.addEventListener('input', (e) => {
    telemetry.recordInteraction('hpi', 'typing', true);
    clinicalState.hpi.preAdmissionWorkup = e.target.value;
    updateLivePreview();
  });

  narrative?.addEventListener('input', (e) => {
    telemetry.recordInteraction('hpi', 'typing', true);
    clinicalState.hpi.narrativeNote = e.target.value;
    updateLivePreview();
  });
}

function initSecondaryPainHandlers() {
  const card = document.getElementById('secondaryPainCard');
  const btnToggle = document.getElementById('btnToggleSecondaryPain');
  const header = document.getElementById('secondaryPainHeader');

  function toggleSecPain() {
    if (!card) return;
    const isActive = card.classList.toggle('active');
    if (btnToggle) {
      btnToggle.textContent = isActive ? 'بستن' : 'افزودن';
    }
    telemetry.recordInteraction('hpi', 'toggle_secondary_pain');
  }

  btnToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSecPain();
  });
  header?.addEventListener('click', toggleSecPain);

  ['secPainRegion', 'secPainCharacter', 'secPainRelation'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      telemetry.recordInteraction('hpi', 'typing');
      if (id === 'secPainRegion') clinicalState.hpi.secondaryPain.region = e.target.value;
      if (id === 'secPainCharacter') clinicalState.hpi.secondaryPain.character = e.target.value;
      if (id === 'secPainRelation') clinicalState.hpi.secondaryPain.relation = e.target.value;
      updateLivePreview();
    });
  });
}

function renderPainSpatialPatterns() {
  const container = document.getElementById('painSpatialPatternsContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.painSpatialPatterns.forEach((pattern) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pattern-pill-btn ${clinicalState.hpi.spatialPattern === pattern.id ? 'active' : ''}`;
    btn.textContent = pattern.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pattern-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      clinicalState.hpi.spatialPattern = pattern.id;
      telemetry.recordInteraction('hpi', 'spatial_pattern_select');
      updatePainRegionContainers();
      updateLivePreview();
    });
    container.appendChild(btn);
  });

  renderAbdominalMatrixGrid('abdominalMatrixGrid', clinicalState.hpi.selectedRegions);
  renderAbdominalMatrixGrid('abdominalInitialMatrixGrid', clinicalState.hpi.initialRegions);
  renderAbdominalMatrixGrid('abdominalCurrentMatrixGrid', clinicalState.hpi.currentRegions);

  updatePainRegionContainers();
}

function updatePainRegionContainers() {
  const pattern = clinicalState.hpi.spatialPattern;
  const standardContainer = document.getElementById('containerStandardRegions');
  const trajectoryContainer = document.getElementById('containerTrajectorySteps');
  const labelStandard = document.getElementById('labelStandardRegions');

  if (pattern === 'generalized_pure') {
    if (standardContainer) standardContainer.style.display = 'none';
    if (trajectoryContainer) trajectoryContainer.style.display = 'none';
  } else if (pattern === 'localized_to_generalized' || pattern === 'migratory_shifting') {
    if (standardContainer) standardContainer.style.display = 'none';
    if (trajectoryContainer) trajectoryContainer.style.display = 'flex';
  } else {
    // localized or generalized_predominant
    if (standardContainer) standardContainer.style.display = 'block';
    if (trajectoryContainer) trajectoryContainer.style.display = 'none';
    if (labelStandard) {
      labelStandard.textContent = pattern === 'generalized_predominant'
        ? 'انتخاب ناحیه/نواحی دارای حداکثر شدت و ارجحیت درد'
        : 'انتخاب نواحی آناتومیک درگیر درد (چند انتخابی)';
    }
  }
}

function renderAbdominalMatrixGrid(containerId, selectedArray) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';

  SURGICAL_SCHEMA.abdominalRegions.forEach((reg) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `matrix-cell-btn ${selectedArray.includes(reg.id) ? 'active' : ''}`;
    btn.textContent = reg.label;
    btn.addEventListener('click', () => {
      const idx = selectedArray.indexOf(reg.id);
      if (idx >= 0) {
        selectedArray.splice(idx, 1);
        btn.classList.remove('active');
      } else {
        selectedArray.push(reg.id);
        btn.classList.add('active');
      }
      telemetry.recordInteraction('hpi', 'matrix_tap');
      updateLivePreview();
    });
    grid.appendChild(btn);
  });
}

function renderRadiationSites() {
  const container = document.getElementById('radiationSitesContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.radiationSites.forEach((site) => {
    const isSelected = (clinicalState.hpi.radiation || []).includes(site.id);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `toggle-chip ${isSelected ? 'active' : ''}`;
    chip.textContent = site.label;

    chip.addEventListener('click', () => {
      let list = clinicalState.hpi.radiation || [];
      if (site.id === 'rad_none') {
        list = ['rad_none'];
      } else {
        // remove rad_none if selecting another
        list = list.filter((id) => id !== 'rad_none');
        const idx = list.indexOf(site.id);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(site.id);
        if (list.length === 0) list = ['rad_none'];
      }
      clinicalState.hpi.radiation = list;
      renderRadiationSites();
      telemetry.recordInteraction('hpi', 'radiation_tap');
      updateLivePreview();
    });

    container.appendChild(chip);
  });
}

function renderHpiSymptomGroups() {
  const container = document.getElementById('hpiSymptomGroupsContainer');
  if (!container) return;
  container.innerHTML = '';

  const activeCc = SURGICAL_SCHEMA.chiefComplaints.find(
    (c) => c.id === clinicalState.cc.selectedCategoryId
  ) || SURGICAL_SCHEMA.chiefComplaints[0];

  (activeCc.symptomGroups || []).forEach((grp) => {
    const grpCard = document.createElement('div');
    grpCard.style.marginTop = '0.85rem';

    const header = document.createElement('div');
    header.className = 'chip-group-header';
    header.innerHTML = `<span class="chip-group-title">${grp.groupTitle}</span>`;
    grpCard.appendChild(header);

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'chips-container';

    grp.chips.forEach((chipDef) => {
      const currentItem = clinicalState.hpi.symptoms[chipDef.id];
      const chipEl = renderInlineDetailTriStateChip({
        id: chipDef.id,
        label: chipDef.label,
        detailHint: chipDef.detailHint,
        currentItemData: currentItem,
        sectionId: 'hpi',
        onStateChange: (newVal, currentDetail) => {
          if (newVal === 0) {
            delete clinicalState.hpi.symptoms[chipDef.id];
          } else {
            clinicalState.hpi.symptoms[chipDef.id] = { state: newVal, detail: currentDetail || '' };
          }
        },
        onDetailChange: (newDetail) => {
          if (!clinicalState.hpi.symptoms[chipDef.id]) {
            clinicalState.hpi.symptoms[chipDef.id] = { state: 1, detail: newDetail };
          } else {
            clinicalState.hpi.symptoms[chipDef.id].detail = newDetail;
          }
        }
      });
      chipsWrap.appendChild(chipEl);
    });

    grpCard.appendChild(chipsWrap);
    container.appendChild(grpCard);
  });
}

/* --- Tab 3: PMH / PSH / HH (Tri-state PMH) --- */
function renderPmhChips() {
  const container = document.getElementById('pmhChipsContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.pmhItems.forEach((pmhDef) => {
    const currentItem = clinicalState.pmh.items[pmhDef.id];
    const chipEl = renderInlineDetailTriStateChip({
      id: pmhDef.id,
      label: pmhDef.label,
      detailHint: pmhDef.detailHint,
      currentItemData: currentItem,
      sectionId: 'pmh_psh_hh',
      onStateChange: (newVal, currentDetail) => {
        if (newVal === 0) {
          delete clinicalState.pmh.items[pmhDef.id];
        } else {
          clinicalState.pmh.items[pmhDef.id] = { state: newVal, detail: currentDetail || '' };
        }
      },
      onDetailChange: (newDetail) => {
        if (!clinicalState.pmh.items[pmhDef.id]) {
          clinicalState.pmh.items[pmhDef.id] = { state: 1, detail: newDetail };
        } else {
          clinicalState.pmh.items[pmhDef.id].detail = newDetail;
        }
      }
    });
    container.appendChild(chipEl);
  });
}

function initPmhPshHhHandlers() {
  document.getElementById('pshNote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('pmh_psh_hh', 'typing', true);
    clinicalState.psh.note = e.target.value;
    updateLivePreview();
  });

  document.getElementById('hhNote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('pmh_psh_hh', 'typing', true);
    clinicalState.hh.note = e.target.value;
    updateLivePreview();
  });
}

function initObGynHandlers() {
  const fields = [
    { id: 'obgynG', key: 'g' },
    { id: 'obgynP', key: 'p' },
    { id: 'obgynAb', key: 'ab' },
    { id: 'obgynL', key: 'l' },
    { id: 'obgynDeliveryType', key: 'deliveryType' },
    { id: 'obgynLmp', key: 'lmp' },
    { id: 'obgynDysmenorrhea', key: 'dysmenorrhea' }
  ];

  fields.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, (e) => {
      telemetry.recordInteraction('pmh_psh_hh', 'obgyn_input');
      clinicalState.obgyn[key] = e.target.value;
      updateLivePreview();
    });
  });
}

/* --- Tab 4: DH / AH / SH / FH --- */
function renderHighAlertDrugs() {
  const container = document.getElementById('dhHighAlertContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.highAlertSurgicalDrugs.forEach((drug) => {
    const existing = (clinicalState.dh.highAlert || []).find((d) => d.id === drug.id);
    const wrap = document.createElement('div');
    wrap.className = 'clinical-chip-wrap';

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `toggle-chip ${existing ? 'active' : ''}`;
    chip.innerHTML = `<span>💊</span> <span>${drug.label}</span>`;

    const lastDoseInput = document.createElement('input');
    lastDoseInput.type = 'text';
    lastDoseInput.className = 'inline-detail-input';
    lastDoseInput.placeholder = drug.detailHint || 'ساعت/تاریخ دوز آخر...';
    lastDoseInput.style.display = existing ? 'inline-block' : 'none';
    lastDoseInput.value = existing?.lastDose || '';

    lastDoseInput.addEventListener('input', (e) => {
      telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
      const found = (clinicalState.dh.highAlert || []).find((d) => d.id === drug.id);
      if (found) found.lastDose = e.target.value;
      updateLivePreview();
    });

    chip.addEventListener('click', () => {
      const list = clinicalState.dh.highAlert || [];
      const idx = list.findIndex((d) => d.id === drug.id);
      if (idx >= 0) {
        list.splice(idx, 1);
        chip.classList.remove('active');
        lastDoseInput.style.display = 'none';
        lastDoseInput.value = '';
      } else {
        list.push({ id: drug.id, label: drug.label, category: drug.category, lastDose: '' });
        chip.classList.add('active');
        lastDoseInput.style.display = 'inline-block';
        lastDoseInput.focus();
      }
      clinicalState.dh.highAlert = list;
      telemetry.recordInteraction('ah_dh_sh_fh', 'chip_tap');
      updateLivePreview();
    });

    wrap.appendChild(chip);
    wrap.appendChild(lastDoseInput);
    container.appendChild(wrap);
  });

  document.getElementById('dhNote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing', true);
    clinicalState.dh.note = e.target.value;
    updateLivePreview();
  });
}

function renderAllergyTemplates() {
  const container = document.getElementById('ahTemplatesContainer');
  const btnNkda = document.getElementById('btnToggleNKDA');
  const nkdaIcon = document.getElementById('nkdaCheckIcon');
  const allergyDetails = document.getElementById('allergyDetailsContainer');
  const ahNote = document.getElementById('ahNote');

  function updateNkdaUI() {
    if (clinicalState.ah.nkda) {
      if (nkdaIcon) nkdaIcon.textContent = '☑️';
      if (btnNkda) btnNkda.classList.add('btn-primary');
      if (allergyDetails) {
        allergyDetails.style.opacity = '0.4';
        allergyDetails.style.pointerEvents = 'none';
      }
    } else {
      if (nkdaIcon) nkdaIcon.textContent = '◻️';
      if (btnNkda) btnNkda.classList.remove('btn-primary');
      if (allergyDetails) {
        allergyDetails.style.opacity = '1';
        allergyDetails.style.pointerEvents = 'auto';
      }
    }
  }

  btnNkda?.addEventListener('click', () => {
    clinicalState.ah.nkda = !clinicalState.ah.nkda;
    if (clinicalState.ah.nkda) {
      clinicalState.ah.selected = [];
    }
    updateNkdaUI();
    renderAllergyTemplatesChips();
    telemetry.recordInteraction('ah_dh_sh_fh', 'toggle_nkda');
    updateLivePreview();
  });

  function renderAllergyTemplatesChips() {
    if (!container) return;
    container.innerHTML = '';
    SURGICAL_SCHEMA.allergyTemplates.forEach((template) => {
      const existing = (clinicalState.ah.selected || []).find((s) => (s.id || s) === template.id);
      const wrap = document.createElement('div');
      wrap.className = 'clinical-chip-wrap';

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `toggle-chip ${existing ? 'active' : ''}`;
      chip.textContent = template.label;

      const detailInput = document.createElement('input');
      detailInput.type = 'text';
      detailInput.className = 'inline-detail-input';
      detailInput.placeholder = template.detailHint || 'نوع واکنش آلرژیک...';
      detailInput.style.display = existing ? 'inline-block' : 'none';
      detailInput.value = existing?.detail || '';

      detailInput.addEventListener('input', (e) => {
        telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
        const found = (clinicalState.ah.selected || []).find((s) => s.id === template.id);
        if (found) found.detail = e.target.value;
        updateLivePreview();
      });

      chip.addEventListener('click', () => {
        if (clinicalState.ah.nkda) return;
        const list = clinicalState.ah.selected || [];
        const idx = list.findIndex((s) => (s.id || s) === template.id);
        if (idx >= 0) {
          list.splice(idx, 1);
          chip.classList.remove('active');
          detailInput.style.display = 'none';
        } else {
          list.push({ id: template.id, label: template.label, detail: '' });
          chip.classList.add('active');
          detailInput.style.display = 'inline-block';
          detailInput.focus();
        }
        clinicalState.ah.selected = list;
        telemetry.recordInteraction('ah_dh_sh_fh', 'chip_tap');
        updateLivePreview();
      });

      wrap.appendChild(chip);
      wrap.appendChild(detailInput);
      container.appendChild(wrap);
    });
  }

  renderAllergyTemplatesChips();
  updateNkdaUI();

  ahNote?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing', true);
    clinicalState.ah.note = e.target.value;
    updateLivePreview();
  });
}

function initShCalculator() {
  const cigs = document.getElementById('shCigsPerDay');
  const years = document.getElementById('shYearsSmoked');
  const badge = document.getElementById('packYearBadge');
  const opium = document.getElementById('shOpium');
  const shNote = document.getElementById('shNote');

  function calculatePackYear() {
    const c = parseFloat(clinicalState.sh.cigsPerDay) || 0;
    const y = parseFloat(clinicalState.sh.yearsSmoked) || 0;
    const packYear = (c / 20) * y;
    if (badge) badge.textContent = `${packYear.toFixed(1)} Pack-Year`;
  }

  cigs?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
    clinicalState.sh.cigsPerDay = e.target.value;
    calculatePackYear();
    updateLivePreview();
  });

  years?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
    clinicalState.sh.yearsSmoked = e.target.value;
    calculatePackYear();
    updateLivePreview();
  });

  opium?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
    clinicalState.sh.opium = e.target.value;
    updateLivePreview();
  });

  shNote?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing', true);
    clinicalState.sh.note = e.target.value;
    updateLivePreview();
  });
}

function renderFhChips() {
  const container = document.getElementById('fhChipsContainer');
  const fhNote = document.getElementById('fhNote');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.fhItems.forEach((fhItem) => {
    const existing = (clinicalState.fh.selected || []).find((s) => (s.id || s) === fhItem.id);
    const wrap = document.createElement('div');
    wrap.className = 'clinical-chip-wrap';

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `toggle-chip ${existing ? 'active' : ''}`;
    chip.textContent = fhItem.label;

    const detailInput = document.createElement('input');
    detailInput.type = 'text';
    detailInput.className = 'inline-detail-input';
    detailInput.placeholder = fhItem.detailHint || 'نسبت فامیلی و سن...';
    detailInput.style.display = existing ? 'inline-block' : 'none';
    detailInput.value = existing?.detail || '';

    detailInput.addEventListener('input', (e) => {
      telemetry.recordInteraction('ah_dh_sh_fh', 'typing');
      const found = (clinicalState.fh.selected || []).find((s) => s.id === fhItem.id);
      if (found) found.detail = e.target.value;
      updateLivePreview();
    });

    const relationBar = document.createElement('span');
    relationBar.className = 'fh-relation-bar';
    relationBar.style.display = existing ? 'inline-flex' : 'none';

    (SURGICAL_SCHEMA.familyRelations || ['مادر', 'پدر', 'برادر', 'خواهر', 'درجه ۲']).forEach((rel) => {
      const relBtn = document.createElement('button');
      relBtn.type = 'button';
      relBtn.className = 'fh-relation-btn';
      relBtn.textContent = rel;
      relBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = detailInput.value.trim();
        detailInput.value = current ? `${current}، ${rel}` : rel;
        const found = (clinicalState.fh.selected || []).find((s) => s.id === fhItem.id);
        if (found) found.detail = detailInput.value;
        telemetry.recordInteraction('ah_dh_sh_fh', 'quick_relation_tap');
        updateLivePreview();
      });
      relationBar.appendChild(relBtn);
    });

    chip.addEventListener('click', () => {
      const list = clinicalState.fh.selected || [];
      const idx = list.findIndex((s) => (s.id || s) === fhItem.id);
      if (idx >= 0) {
        list.splice(idx, 1);
        chip.classList.remove('active');
        detailInput.style.display = 'none';
        relationBar.style.display = 'none';
      } else {
        list.push({ id: fhItem.id, label: fhItem.label, detail: '' });
        chip.classList.add('active');
        detailInput.style.display = 'inline-block';
        relationBar.style.display = 'inline-flex';
        detailInput.focus();
      }
      clinicalState.fh.selected = list;
      telemetry.recordInteraction('ah_dh_sh_fh', 'chip_tap');
      updateLivePreview();
    });

    wrap.appendChild(chip);
    wrap.appendChild(detailInput);
    wrap.appendChild(relationBar);
    container.appendChild(wrap);
  });

  fhNote?.addEventListener('input', (e) => {
    telemetry.recordInteraction('ah_dh_sh_fh', 'typing', true);
    clinicalState.fh.note = e.target.value;
    updateLivePreview();
  });
}

/* --- Tab 5: ROS (11 Systems with Inline Details) --- */
function renderRosGroups() {
  const container = document.getElementById('rosGroupsAccordion');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.rosGroups.forEach((group) => {
    const groupCard = document.createElement('div');
    groupCard.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'chip-group-header';
    header.innerHTML = `<span class="chip-group-title">${group.group}</span>`;
    groupCard.appendChild(header);

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'chips-container';

    group.items.forEach((item) => {
      const currentItem = clinicalState.ros.items[item.id];
      const chipEl = renderInlineDetailTriStateChip({
        id: item.id,
        label: item.label,
        detailHint: item.detailHint,
        currentItemData: currentItem,
        sectionId: 'ros',
        onStateChange: (newVal, currentDetail) => {
          if (newVal === 0) {
            delete clinicalState.ros.items[item.id];
          } else {
            clinicalState.ros.items[item.id] = { state: newVal, detail: currentDetail || '' };
          }
        },
        onDetailChange: (newDetail) => {
          if (!clinicalState.ros.items[item.id]) {
            clinicalState.ros.items[item.id] = { state: 1, detail: newDetail };
          } else {
            clinicalState.ros.items[item.id].detail = newDetail;
          }
        }
      });
      chipsWrap.appendChild(chipEl);
    });

    groupCard.appendChild(chipsWrap);
    container.appendChild(groupCard);
  });

  document.getElementById('btnRosMarkRemainingNeg')?.addEventListener('click', () => {
    SURGICAL_SCHEMA.rosGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (!clinicalState.ros.items[item.id]) {
          clinicalState.ros.items[item.id] = { state: -1, detail: '' };
        }
      });
    });
    renderRosGroups();
    telemetry.recordInteraction('ros', 'bulk_negative');
    showToast('کلیه موارد باقیمانده ROS به عنوان نکات منفی کلیدی ثبت شدند.', 'success');
    updateLivePreview();
  });
}

/* --- Tab 6: PE (Physical Examination with Inline Details) --- */
function initPeVitalsHandlers() {
  const v = clinicalState.pe.vitals;
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
      telemetry.recordInteraction('pe', 'typing');
      v[prop] = e.target.value;
      updateLivePreview();
    });
  });

  document.getElementById('peNote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('pe', 'typing', true);
    clinicalState.pe.note = e.target.value;
    updateLivePreview();
  });
}

function renderPeFindings() {
  const map = {
    peGeneralChipsContainer: SURGICAL_SCHEMA.peFindings.generalAndHeadNeck,
    peCardioChipsContainer: SURGICAL_SCHEMA.peFindings.cardiopulmonaryAndBreast,
    peAbdInspectChipsContainer: SURGICAL_SCHEMA.peFindings.abdomenInspectionAuscultation,
    peAbdPalpChipsContainer: SURGICAL_SCHEMA.peFindings.abdomenPalpationAndSigns,
    peDreChipsContainer: SURGICAL_SCHEMA.peFindings.dreAndExtremities
  };

  Object.entries(map).forEach(([containerId, items]) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    items.forEach((item) => {
      const currentItem = clinicalState.pe.findings[item.id];
      const chipEl = renderInlineDetailTriStateChip({
        id: item.id,
        label: item.label,
        detailHint: item.detailHint,
        currentItemData: currentItem,
        sectionId: 'pe',
        onStateChange: (newVal, currentDetail) => {
          if (newVal === 0) {
            delete clinicalState.pe.findings[item.id];
          } else {
            clinicalState.pe.findings[item.id] = { state: newVal, detail: currentDetail || '' };
          }
        },
        onDetailChange: (newDetail) => {
          if (!clinicalState.pe.findings[item.id]) {
            clinicalState.pe.findings[item.id] = { state: 1, detail: newDetail };
          } else {
            clinicalState.pe.findings[item.id].detail = newDetail;
          }
        }
      });
      container.appendChild(chipEl);
    });
  });

  document.getElementById('btnPeMarkNormalAbdomen')?.addEventListener('click', () => {
    clinicalState.pe.findings['pe_abd_flat_symmetrical'] = { state: 1, detail: '' };
    clinicalState.pe.findings['pe_normoactive_bs'] = { state: 1, detail: '' };
    clinicalState.pe.findings['pe_soft_nontender'] = { state: 1, detail: '' };

    clinicalState.pe.findings['pe_rebound_tenderness'] = { state: -1, detail: '' };
    clinicalState.pe.findings['pe_guarding_rigidity'] = { state: -1, detail: '' };
    clinicalState.pe.findings['pe_murphy_sign'] = { state: -1, detail: '' };
    clinicalState.pe.findings['pe_mcburney_rovsing'] = { state: -1, detail: '' };
    clinicalState.pe.findings['pe_psoas_obturator'] = { state: -1, detail: '' };
    clinicalState.pe.findings['pe_cva_tenderness'] = { state: -1, detail: '' };

    renderPeFindings();
    telemetry.recordInteraction('pe', 'bulk_normal_abdomen');
    showToast('معاینه شکم با یافته‌های روتین نرمال و رد علائم پریتونیت به‌روز شد.', 'success');
    updateLivePreview();
  });
}

/* --- Tab 7: Paraclinics --- */
function renderParaclinicLabs() {
  const grid = document.getElementById('paraclinicLabGrid');
  if (!grid) return;
  grid.innerHTML = '';

  SURGICAL_SCHEMA.paraclinicLabDefinitions.forEach((def) => {
    const card = document.createElement('div');
    card.className = 'lab-input-card';
    card.id = `labCard_${def.id}`;

    const currentVal = clinicalState.paraclinics.labs[def.id] || '';

    card.innerHTML = `
      <div class="lab-card-top">
        <span class="lab-label">${def.label}</span>
        <span class="lab-ref dir-ltr">${def.min}-${def.max}</span>
        <span class="lab-flag-pill" id="labFlag_${def.id}"></span>
      </div>
      <div class="lab-input-wrapper">
        <input type="number" step="any" class="lab-num-input dir-ltr" id="labInput_${def.id}" value="${currentVal}" placeholder="${def.min}">
        <span class="lab-unit">${def.unit}</span>
      </div>
    `;

    const input = card.querySelector(`#labInput_${def.id}`);
    const flagPill = card.querySelector(`#labFlag_${def.id}`);

    function updateCardFlags(val) {
      card.classList.remove('flag-high', 'flag-low', 'flag-normal');
      flagPill.textContent = '';
      if (val === '' || val === undefined) return;
      const num = parseFloat(val);
      if (isNaN(num)) return;

      if (num > def.max) {
        card.classList.add('flag-high');
        flagPill.textContent = '↑ High';
      } else if (num < def.min) {
        card.classList.add('flag-low');
        flagPill.textContent = '↓ Low';
      } else {
        card.classList.add('flag-normal');
        flagPill.textContent = 'Normal';
      }
    }

    updateCardFlags(currentVal);

    input.addEventListener('input', (e) => {
      telemetry.recordInteraction('paraclinics', 'lab_input');
      const val = e.target.value;
      clinicalState.paraclinics.labs[def.id] = val;
      updateCardFlags(val);
      updateLivePreview();
    });

    grid.appendChild(card);
  });

  document.getElementById('paraclinicLabNote')?.addEventListener('input', (e) => {
    telemetry.recordInteraction('paraclinics', 'typing', true);
    clinicalState.paraclinics.labNote = e.target.value;
    updateLivePreview();
  });
}

function renderImagingModalities() {
  const container = document.getElementById('imagingModalitiesContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.paraclinicModalities.forEach((mod) => {
    const existing = (clinicalState.paraclinics.imagingReports || []).find((r) => r.modalityId === mod.id) || {
      modalityId: mod.id,
      modalityLabel: mod.label,
      date: '',
      tags: [], // array of { id, label, detail }
      summary: ''
    };

    const modCard = document.createElement('div');
    modCard.className = 'clinical-card';
    modCard.style.marginTop = '0.75rem';

    modCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">
          <span class="icon-holder">📷</span>
          <span>${mod.label}</span>
        </div>
        <input type="text" class="input-text dir-ltr" style="width:130px; font-size:0.75rem;" placeholder="تاریخ/ساعت انجام" value="${existing.date}">
      </div>
      <div class="form-group">
        <label class="form-label">یافته‌های شاخص تشخیصی با ورودی درجا</label>
        <div class="chips-container" id="modTags_${mod.id}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">گزارش تکمیلی / ابعاد ضایعه و نتیجه‌گیری متخصص رادیولوژی</label>
        <textarea class="input-textarea" style="min-height:60px;" placeholder="شرح گزارش رسمی، سایز توده، کلکسیون یا درجه انسداد...">${existing.summary}</textarea>
      </div>
    `;

    const dateInput = modCard.querySelector('input');
    const summaryInput = modCard.querySelector('textarea');
    const tagsContainer = modCard.querySelector(`#modTags_${mod.id}`);

    function syncReport() {
      let reports = clinicalState.paraclinics.imagingReports || [];
      const idx = reports.findIndex((r) => r.modalityId === mod.id);
      if (existing.tags.length > 0 || existing.summary.trim() !== '' || existing.date.trim() !== '') {
        if (idx >= 0) reports[idx] = existing;
        else reports.push(existing);
      } else if (idx >= 0) {
        reports.splice(idx, 1);
      }
      clinicalState.paraclinics.imagingReports = reports;
      updateLivePreview();
    }

    dateInput.addEventListener('input', (e) => {
      telemetry.recordInteraction('paraclinics', 'typing');
      existing.date = e.target.value;
      syncReport();
    });

    summaryInput.addEventListener('input', (e) => {
      telemetry.recordInteraction('paraclinics', 'typing', true);
      existing.summary = e.target.value;
      syncReport();
    });

    mod.quickTags.forEach((tagDef) => {
      const tagObj = existing.tags.find((t) => (t.id || t) === tagDef.id);
      const isTagged = !!tagObj;

      const wrap = document.createElement('div');
      wrap.className = 'clinical-chip-wrap';

      const tagChip = document.createElement('button');
      tagChip.type = 'button';
      tagChip.className = `toggle-chip ${isTagged ? 'active' : ''}`;
      tagChip.textContent = tagDef.label;

      const inlineInput = document.createElement('input');
      inlineInput.type = 'text';
      inlineInput.className = 'inline-detail-input';
      inlineInput.placeholder = tagDef.detailHint || 'سایز / جزئیات...';
      inlineInput.style.display = isTagged ? 'inline-block' : 'none';
      inlineInput.value = tagObj?.detail || '';

      inlineInput.addEventListener('input', (e) => {
        telemetry.recordInteraction('paraclinics', 'typing');
        const found = existing.tags.find((t) => t.id === tagDef.id);
        if (found) found.detail = e.target.value;
        syncReport();
      });

      tagChip.addEventListener('click', () => {
        const tIdx = existing.tags.findIndex((t) => (t.id || t) === tagDef.id);
        if (tIdx >= 0) {
          existing.tags.splice(tIdx, 1);
          tagChip.classList.remove('active');
          inlineInput.style.display = 'none';
        } else {
          existing.tags.push({ id: tagDef.id, label: tagDef.label, detail: '' });
          tagChip.classList.add('active');
          inlineInput.style.display = 'inline-block';
          inlineInput.focus();
        }
        telemetry.recordInteraction('paraclinics', 'tag_tap');
        syncReport();
      });

      wrap.appendChild(tagChip);
      wrap.appendChild(inlineInput);
      tagsContainer.appendChild(wrap);
    });

    container.appendChild(modCard);
  });
}

/* --- Tab 8: Clinical Reasoning (SQ & Problem Representation) --- */
function renderSemanticQualifiers() {
  const container = document.getElementById('sqPairsContainer');
  if (!container) return;
  container.innerHTML = '';

  SURGICAL_SCHEMA.semanticQualifiers.forEach((sqDef) => {
    const wrap = document.createElement('div');
    wrap.style.marginTop = '0.75rem';

    const header = document.createElement('div');
    header.className = 'chip-group-header';
    header.innerHTML = `<span class="chip-group-title">دوقطبی معنایی: ${sqDef.pair}</span>`;
    wrap.appendChild(header);

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'chips-container';

    sqDef.options.forEach((opt) => {
      const isSelected = (clinicalState.reasoning.selectedSQs || []).includes(opt);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `toggle-chip ${isSelected ? 'active' : ''}`;
      chip.textContent = opt;
      chip.addEventListener('click', () => {
        const list = clinicalState.reasoning.selectedSQs || [];
        const idx = list.indexOf(opt);
        if (idx >= 0) {
          list.splice(idx, 1);
          chip.classList.remove('active');
        } else {
          list.push(opt);
          chip.classList.add('active');
        }
        clinicalState.reasoning.selectedSQs = list;
        telemetry.recordInteraction('reasoning_sq', 'sq_tap');
        updateLivePreview();
      });
      chipsWrap.appendChild(chip);
    });

    wrap.appendChild(chipsWrap);
    container.appendChild(wrap);
  });
}

function initReasoningHandlers() {
  const prInput = document.getElementById('reasoningProblemRep');
  const ddxInput = document.getElementById('reasoningDdx');
  const btnAutoPR = document.getElementById('btnAutoGeneratePR');

  prInput?.addEventListener('input', (e) => {
    telemetry.recordInteraction('reasoning_sq', 'typing', true);
    clinicalState.reasoning.problemRepresentation = e.target.value;
    updateLivePreview();
  });

  ddxInput?.addEventListener('input', (e) => {
    telemetry.recordInteraction('reasoning_sq', 'typing', true);
    clinicalState.reasoning.ddx = e.target.value;
    updateLivePreview();
  });

  btnAutoPR?.addEventListener('click', () => {
    telemetry.recordInteraction('reasoning_sq', 'auto_pr_click');
    const autoSummary = synthesizeProblemRepresentation(clinicalState);
    clinicalState.reasoning.problemRepresentation = autoSummary;
    if (prInput) prInput.value = autoSummary;
    showToast('بازنمایی مسئله بالینی به صورت خودکار با تمام آزمایش‌های مثبت تولید شد.', 'success');
    updateLivePreview();
  });
}

/* ==========================================================================
   Navigation Tabs
   ========================================================================== */
function initNavigationTabs() {
  const tabs = document.querySelectorAll('.segmented-tabs-bar .tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTabId = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove('active'));
      panes.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add('active');
        activeSectionId = targetPane.dataset.sectionId || 'cc_admission';
        telemetry.switchSection(activeSectionId);
      }
    });
  });
}

/* ==========================================================================
   Live Note Rendering & Synchronization
   ========================================================================== */
function updateLivePreview() {
  clinicalState.updatedAt = new Date().toISOString();

  const noteMarkdown = generateClinicalNote(clinicalState);

  const desktopPreview = document.getElementById('liveNotePreview');
  const mobilePreview = document.getElementById('mobileLiveNotePreview');

  const formattedHtml = formatNoteForDisplay(noteMarkdown);
  if (desktopPreview) desktopPreview.innerHTML = formattedHtml;
  if (mobilePreview) mobilePreview.innerHTML = formattedHtml;

  // Update Counters
  let posCount = 0;
  let negCount = 0;
  const countTri = (obj) => {
    if (!obj) return;
    Object.values(obj).forEach((v) => {
      const stateVal = typeof v === 'object' ? v.state : v;
      if (stateVal === 1) posCount++;
      if (stateVal === -1) negCount++;
    });
  };
  countTri(clinicalState.hpi.symptoms);
  countTri(clinicalState.pmh.items);
  countTri(clinicalState.ros.items);
  countTri(clinicalState.pe.findings);

  const sqCount = (clinicalState.reasoning.selectedSQs || []).length;

  document.getElementById('badgePosCount').textContent = posCount;
  document.getElementById('badgeNegCount').textContent = negCount;
  document.getElementById('badgeSqCount').textContent = sqCount;

  const mPos = document.getElementById('mobilePosCount');
  const mNeg = document.getElementById('mobileNegCount');
  if (mPos) mPos.textContent = posCount;
  if (mNeg) mNeg.textContent = negCount;

  saveCurrentCase();
}

function formatNoteForDisplay(markdown) {
  if (!markdown) return '<em>در انتظار ثبت اطلاعات بالینی...</em>';
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

/* ==========================================================================
   Telemetry Status Ticker Loop
   ========================================================================== */
function startTelemetryTicker() {
  const statusPill = document.getElementById('telemetryStatusPill');
  const statusText = document.getElementById('telemetryStatusText');
  const timeText = document.getElementById('telemetryTimeText');
  const mobilePill = document.getElementById('mobileTelemetryPill');
  const mobileTime = document.getElementById('mobileTelemetryTime');

  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  setInterval(() => {
    if (telemetry.isSectionTimingActive && telemetry.lastInteractionTime !== null) {
      const now = performance.now();
      const delta = now - telemetry.lastInteractionTime;
      const totalMs = telemetry.metrics.totalActiveDurationMs + delta;

      if (statusPill) statusPill.className = 'telemetry-status-pill active';
      if (statusText) statusText.textContent = 'در حال ثبت فعال';
      if (timeText) timeText.textContent = formatDuration(totalMs);

      if (mobilePill) mobilePill.className = 'telemetry-status-pill active';
      if (mobileTime) mobileTime.textContent = formatDuration(totalMs);
    } else {
      if (statusPill) statusPill.className = 'telemetry-status-pill idle';
      if (statusText) statusText.textContent = 'در انتظار تعامل';
      if (timeText) timeText.textContent = formatDuration(telemetry.metrics.totalActiveDurationMs);

      if (mobilePill) mobilePill.className = 'telemetry-status-pill idle';
      if (mobileTime) mobileTime.textContent = formatDuration(telemetry.metrics.totalActiveDurationMs);
    }
  }, 500);
}

/* ==========================================================================
   Shift Manager & Offline Storage (100% Offline-First)
   ========================================================================== */
function saveCurrentCase() {
  try {
    localStorage.setItem(STORAGE_CURRENT_CASE_KEY, JSON.stringify(clinicalState));
    updateShiftVaultWithCase(clinicalState);
  } catch (err) {
    console.warn('Failed to save state to localStorage:', err);
  }
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_CASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.caseId) {
        clinicalState = parsed;
        const idBadge = document.getElementById('headerCaseId');
        if (idBadge) idBadge.textContent = clinicalState.caseId;
      }
    }
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
  }
}

function getShiftCases() {
  try {
    const raw = localStorage.getItem(STORAGE_SHIFT_CASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveShiftCases(cases) {
  try {
    localStorage.setItem(STORAGE_SHIFT_CASES_KEY, JSON.stringify(cases));
    const countBadge = document.getElementById('shiftCasesCount');
    if (countBadge) countBadge.textContent = cases.length;
  } catch (err) {
    console.warn('Failed to save shift vault:', err);
  }
}

function updateShiftVaultWithCase(caseObj) {
  const cases = getShiftCases();
  const idx = cases.findIndex((c) => c.caseId === caseObj.caseId);
  const summary = {
    caseId: caseObj.caseId,
    createdAt: caseObj.createdAt,
    updatedAt: caseObj.updatedAt,
    patientDesc: `${caseObj.demographics.gender === 'female' ? 'خانم' : 'آقای'} ${caseObj.demographics.age || '?'} ساله - ${caseObj.cc.patientQuote || caseObj.cc.selectedCategoryLabel}`,
    fullState: caseObj
  };

  if (idx >= 0) cases[idx] = summary;
  else cases.push(summary);
  saveShiftCases(cases);
}

function initShiftManager() {
  const btnOpen = document.getElementById('btnOpenShiftManager');
  const btnClose = document.getElementById('btnCloseShiftModal');
  const backdrop = document.getElementById('shiftModalBackdrop');
  const btnNewCase = document.getElementById('btnNewCase');
  const btnExportAll = document.getElementById('btnExportAllShiftCases');
  const btnImport = document.getElementById('btnImportShiftJson');
  const fileInput = document.getElementById('shiftFileInput');

  function openModal() {
    renderShiftList();
    backdrop?.classList.add('open');
  }

  function closeModal() {
    backdrop?.classList.remove('open');
  }

  btnOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  btnNewCase?.addEventListener('click', () => {
    if (confirm('آیا مایل به ثبت پرونده جدید هستید؟ پرونده فعلی در شیفت ذخیره می‌شود.')) {
      saveCurrentCase();
      clinicalState = createDefaultClinicalState();
      telemetry = new ClinicalTelemetryEngine(15000);
      document.getElementById('headerCaseId').textContent = clinicalState.caseId;
      syncDomFromState();
      updateLivePreview();
      showToast('پرونده جدید آغاز شد.', 'success');
    }
  });

  btnExportAll?.addEventListener('click', () => {
    const cases = getShiftCases();
    const exportBundle = {
      exportVersion: 'v0.2-Surg',
      exportedAt: new Date().toISOString(),
      shiftSummary: {
        totalCases: cases.length,
        casesList: cases.map((c) => ({ caseId: c.caseId, desc: c.patientDesc }))
      },
      cases: cases.map((c) => ({
        ...c.fullState,
        telemetrySnapshot: telemetry.exportTelemetrySnapshot(c.fullState)
      }))
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surg_Shift_v02_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل JSON تجمیعی شیفت با موفقیت دانلود شد.', 'success');
  });

  btnImport?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.cases && Array.isArray(data.cases)) {
          const currentCases = getShiftCases();
          data.cases.forEach((c) => {
            currentCases.push({
              caseId: c.caseId || generateCaseId(),
              createdAt: c.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              patientDesc: `${c.demographics?.gender === 'female' ? 'خانم' : 'آقای'} ${c.demographics?.age || '?'} ساله - ${c.cc?.patientQuote || c.cc?.selectedCategoryLabel || 'پرونده وارد شده'}`,
              fullState: c
            });
          });
          saveShiftCases(currentCases);
          renderShiftList();
          showToast(`${data.cases.length} پرونده به شیفت افزوده شدند.`, 'success');
        } else if (data.caseId) {
          clinicalState = data;
          document.getElementById('headerCaseId').textContent = clinicalState.caseId;
          syncDomFromState();
          updateLivePreview();
          closeModal();
          showToast('پرونده با موفقیت بارگذاری شد.', 'success');
        } else {
          showToast('ساختار فایل JSON معتبر نیست.', 'warning');
        }
      } catch {
        showToast('خطا در خواندن فایل JSON', 'warning');
      }
    };
    reader.readAsText(file);
  });
}

function renderShiftList() {
  const container = document.getElementById('shiftCasesList');
  if (!container) return;
  const cases = getShiftCases();
  container.innerHTML = '';

  if (cases.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">هنوز پرونده‌ای در این شیفت ذخیره نشده است.</div>';
    return;
  }

  cases.forEach((c, idx) => {
    const item = document.createElement('div');
    item.className = 'shift-case-item';
    const isCurrent = c.caseId === clinicalState.caseId;

    item.innerHTML = `
      <div class="shift-case-meta">
        <span class="shift-case-id">${c.caseId} ${isCurrent ? '(پرونده جاری)' : ''}</span>
        <span class="shift-case-desc">${c.patientDesc}</span>
        <span class="shift-case-time">${new Date(c.updatedAt).toLocaleTimeString('fa-IR')}</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <button class="btn btn-secondary btn-sm" id="btnLoadCase_${idx}">باز کردن</button>
        <button class="btn btn-ghost btn-sm" id="btnDeleteCase_${idx}" style="color:#EF4444;">حذف</button>
      </div>
    `;

    item.querySelector(`#btnLoadCase_${idx}`).addEventListener('click', () => {
      clinicalState = c.fullState;
      document.getElementById('headerCaseId').textContent = clinicalState.caseId;
      syncDomFromState();
      updateLivePreview();
      document.getElementById('shiftModalBackdrop')?.classList.remove('open');
      showToast(`پرونده ${c.caseId} بارگذاری شد.`, 'success');
    });

    item.querySelector(`#btnDeleteCase_${idx}`).addEventListener('click', () => {
      if (confirm(`آیا مطمئن هستید که می‌خواهید پرونده ${c.caseId} را حذف کنید؟`)) {
        cases.splice(idx, 1);
        saveShiftCases(cases);
        renderShiftList();
      }
    });

    container.appendChild(item);
  });
}

/* ==========================================================================
   Export & Clipboard Copy
   ========================================================================== */
function initExportAndCopy() {
  document.getElementById('btnCopyNote')?.addEventListener('click', () => copyNoteToClipboard());
  document.getElementById('btnCopyNoteMobile')?.addEventListener('click', () => copyNoteToClipboard());

  function exportSingleCaseJson() {
    telemetry.recordInteraction(activeSectionId, 'export_json');
    const snapshot = telemetry.exportTelemetrySnapshot(clinicalState);
    const fullPayload = {
      ...clinicalState,
      telemetry: snapshot
    };

    const blob = new Blob([JSON.stringify(fullPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicalState.caseId}_FullRecord_v02.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل JSON پرونده (به همراه لاگ کمبودهای سیستم) دانلود شد.', 'success');
  }

  document.getElementById('btnExportJson')?.addEventListener('click', exportSingleCaseJson);
  document.getElementById('btnExportJsonMobile')?.addEventListener('click', exportSingleCaseJson);
}

function copyNoteToClipboard() {
  const noteMarkdown = generateClinicalNote(clinicalState);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(noteMarkdown).then(() => {
      showToast('متن کامل شرح‌حال در کلیپ‌بورد کپی شد.', 'success');
    }).catch(() => fallbackCopy(noteMarkdown));
  } else {
    fallbackCopy(noteMarkdown);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('متن شرح‌حال با موفقیت کپی شد.', 'success');
}

/* ==========================================================================
   Mobile Bottom-Sheet Controls
   ========================================================================== */
function initMobileBottomSheet() {
  const sheet = document.getElementById('mobileBottomSheet');
  const backdrop = document.getElementById('mobileSheetBackdrop');
  const btnOpen = document.getElementById('btnOpenMobileSheet');
  const btnClose = document.getElementById('btnCloseMobileSheet');

  function openSheet() {
    sheet?.classList.add('open');
    backdrop?.classList.add('open');
  }

  function closeSheet() {
    sheet?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  btnOpen?.addEventListener('click', openSheet);
  btnClose?.addEventListener('click', closeSheet);
  backdrop?.addEventListener('click', closeSheet);
}

/* ==========================================================================
   Theme Switcher (Dark / Light Mode)
   ========================================================================== */
function initThemeToggle() {
  const btn = document.getElementById('btnToggleTheme');
  const iconSun = document.getElementById('themeIconSun');
  const iconMoon = document.getElementById('themeIconMoon');

  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }

  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  applyTheme(savedTheme !== 'light');

  btn?.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    applyTheme(!isCurrentlyDark);
  });
}

/* ==========================================================================
/* ==========================================================================
   Global Event Delegation for Telemetry (v0.3-Surg)
   ========================================================================== */
function initGlobalTelemetryDelegation() {
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.tri-chip, .quick-chip, .toggle-chip, .chip, .fh-relation-btn, .btn, .pattern-pill-btn');
    if (chip) {
      telemetry.recordInteraction(activeSectionId, 'click_chip');
    }
  }, { passive: true });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.tagName === 'SELECT') {
      telemetry.recordInteraction(activeSectionId, 'change_select');
    } else if (el.type === 'radio' || el.type === 'checkbox') {
      telemetry.recordInteraction(activeSectionId, 'toggle_input');
    }
  }, { passive: true });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type === 'range') {
      telemetry.recordInteraction(activeSectionId, 'slider_input');
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      telemetry.recordInteraction(activeSectionId, 'type_input');
    }
  }, { passive: true });
}

/* ==========================================================================
   Cloud Sync & Admin Staging UI Integration (v0.3-Surg)
   ========================================================================== */
function initCloudSyncUI() {
  const collectorInput = document.getElementById('collectorIdInput');
  const btnCloudSync = document.getElementById('btnCloudSync');
  const queueBadge = document.getElementById('offlineQueueBadge');
  const queueCount = document.getElementById('offlineQueueCount');
  const btnSettings = document.getElementById('btnCloudSettings');
  const settingsModal = document.getElementById('cloudSettingsModalBackdrop');
  const btnCloseSettings = document.getElementById('btnCloseCloudSettings');
  const btnCancelSettings = document.getElementById('btnCancelCloudSettings');
  const btnSaveSettings = document.getElementById('btnSaveCloudSettings');

  const settingCollectorName = document.getElementById('settingCollectorName');
  const settingSyncMode = document.getElementById('settingSyncMode');
  const settingEndpointUrl = document.getElementById('settingEndpointUrl');
  const settingApiKey = document.getElementById('settingApiKey');
  const groupApiKey = document.getElementById('groupSettingApiKey');

  // Admin Staging Elements
  const btnAdminStaging = document.getElementById('btnAdminStaging');
  const stagingModal = document.getElementById('adminStagingModalBackdrop');
  const btnCloseAdminStaging = document.getElementById('btnCloseAdminStaging');
  const btnImportStagingFiles = document.getElementById('btnImportStagingFiles');
  const stagingFileInput = document.getElementById('stagingFileInput');
  const btnApproveAllStaging = document.getElementById('btnApproveAllStaging');
  const btnClearStaging = document.getElementById('btnClearStaging');
  const btnExportMasterDataset = document.getElementById('btnExportMasterDataset');
  const stagingTableBody = document.getElementById('stagingTableBody');
  const stagingCountPill = document.getElementById('stagingCountPill');

  function updateQueueBadge() {
    const count = cloudSync.getPendingCount();
    if (queueBadge && queueCount) {
      queueCount.textContent = count;
      queueBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  // Set initial collector name
  if (collectorInput) {
    collectorInput.value = cloudSync.config.collectorName || '';
    collectorInput.addEventListener('change', (e) => {
      cloudSync.saveConfig({
        ...cloudSync.config,
        collectorName: e.target.value
      });
      showToast(`نام ثبت‌کننده به «${e.target.value}» تنظیم شد.`, 'success');
    });
  }

  updateQueueBadge();
  window.addEventListener('online', () => {
    updateQueueBadge();
    showToast('اتصال اینترنت برقرار شد؛ صف آفلاین بررسی شد.', 'info');
  });

  queueBadge?.addEventListener('click', async () => {
    showToast('در حال تلاش برای ارسال صف آفلاین...', 'info');
    await cloudSync.flushOfflineQueue();
    updateQueueBadge();
  });

  // Submit Current Case to Cloud
  btnCloudSync?.addEventListener('click', async () => {
    telemetry.recordInteraction(activeSectionId, 'cloud_sync_submit');
    const snapshot = telemetry.exportTelemetrySnapshot(clinicalState);
    const fullCaseRecord = {
      ...clinicalState,
      telemetry: snapshot
    };

    showToast('در حال ارسال پرونده به مخزن ابری...', 'info');
    try {
      const result = await cloudSync.submitCaseToCloud(fullCaseRecord);
      if (result.status === 'synced') {
        showToast(result.message, 'success');
      } else if (result.status === 'queued_offline') {
        showToast(result.message, 'warning');
      } else {
        showToast(result.message, 'info');
      }
      updateQueueBadge();
    } catch (err) {
      showToast(err.message, 'warning');
      updateQueueBadge();
    }
  });

  // Cloud Settings Modal
  function openCloudSettings() {
    if (settingCollectorName) settingCollectorName.value = cloudSync.config.collectorName || '';
    if (settingSyncMode) {
      settingSyncMode.value = cloudSync.config.mode || 'webhook';
      if (groupApiKey) groupApiKey.style.display = settingSyncMode.value === 'supabase' ? 'block' : 'none';
    }
    if (settingEndpointUrl) settingEndpointUrl.value = cloudSync.config.endpointUrl || '';
    if (settingApiKey) settingApiKey.value = cloudSync.config.apiKey || '';
    if (settingsModal) settingsModal.classList.add('active');
  }

  function closeCloudSettings() {
    if (settingsModal) settingsModal.classList.remove('active');
  }

  btnSettings?.addEventListener('click', openCloudSettings);
  btnCloseSettings?.addEventListener('click', closeCloudSettings);
  btnCancelSettings?.addEventListener('click', closeCloudSettings);

  settingSyncMode?.addEventListener('change', (e) => {
    if (groupApiKey) groupApiKey.style.display = e.target.value === 'supabase' ? 'block' : 'none';
  });

  btnSaveSettings?.addEventListener('click', () => {
    cloudSync.saveConfig({
      collectorName: settingCollectorName.value,
      mode: settingSyncMode.value,
      endpointUrl: settingEndpointUrl.value,
      apiKey: settingApiKey?.value || ''
    });
    if (collectorInput) collectorInput.value = settingCollectorName.value;
    closeCloudSettings();
    showToast('تنظیمات مخزن ابری ذخیره گردید.', 'success');
  });

  // Admin Staging Modal
  function renderStagingTable() {
    const staged = cloudSync.getStagedRecords();
    if (stagingCountPill) stagingCountPill.textContent = `تعداد: ${staged.length} پرونده`;

    if (!stagingTableBody) return;
    if (staged.length === 0) {
      stagingTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">
            هنوز پرونده‌ای در استیجینگ بارگذاری نشده است.
          </td>
        </tr>
      `;
      return;
    }

    stagingTableBody.innerHTML = '';
    staged.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const ccText = item.record_json?.cc?.patientQuote || item.record_json?.cc?.selectedCategoryLabel || 'درد شکم';
      const statusLabel = item.review_status === 'approved' ? 'تاییدشده' : item.review_status === 'rejected' ? 'ردشده' : 'در انتظار';
      const statusClass = item.review_status || 'pending_review';

      tr.innerHTML = `
        <td class="mono-num">${idx + 1}</td>
        <td class="mono-num" style="font-weight:700;">${item.case_id}</td>
        <td>${item.collector_name || 'ناشناس'}</td>
        <td class="mono-num" style="font-size:0.75rem;">${new Date(item.submitted_at).toLocaleDateString('fa-IR')}</td>
        <td>${ccText}</td>
        <td><span class="staging-status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div style="display:flex; gap:0.25rem;">
            <button class="btn btn-secondary btn-sm btn-approve" data-id="${item.case_id}" title="تایید پرونده">✓</button>
            <button class="btn btn-secondary btn-sm btn-reject" data-id="${item.case_id}" title="رد پرونده" style="color:#EF4444;">✕</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-approve')?.addEventListener('click', () => {
        cloudSync.updateRecordStatus(item.case_id, 'approved');
        renderStagingTable();
      });

      tr.querySelector('.btn-reject')?.addEventListener('click', () => {
        cloudSync.updateRecordStatus(item.case_id, 'rejected');
        renderStagingTable();
      });

      stagingTableBody.appendChild(tr);
    });
  }

  btnAdminStaging?.addEventListener('click', () => {
    renderStagingTable();
    if (stagingModal) stagingModal.classList.add('active');
  });

  btnCloseAdminStaging?.addEventListener('click', () => {
    if (stagingModal) stagingModal.classList.remove('active');
  });

  btnApproveAllStaging?.addEventListener('click', () => {
    const staged = cloudSync.getStagedRecords();
    staged.forEach((item) => {
      cloudSync.updateRecordStatus(item.case_id, 'approved');
    });
    renderStagingTable();
    showToast('تمام پرونده‌های استیجینگ تایید شدند.', 'success');
  });

  btnClearStaging?.addEventListener('click', () => {
    if (confirm('آیا از پاکسازی تمام پرونده‌های استیجینگ مطمئن هستید؟')) {
      cloudSync.stagedRecords = [];
      cloudSync.saveStagedRecords();
      renderStagingTable();
      showToast('استیجینگ پاکسازی شد.', 'info');
    }
  });

  btnImportStagingFiles?.addEventListener('click', () => {
    stagingFileInput?.click();
  });

  stagingFileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              cloudSync.addCaseToStaging({
                case_id: p.caseId || p.case_id || generateCaseId(),
                collector_name: p.collector_name || 'external_import',
                review_status: 'pending_review',
                submitted_at: p.submitted_at || new Date().toISOString(),
                record_json: p.record_json || p
              });
            });
          } else if (parsed.cases && Array.isArray(parsed.cases)) {
            parsed.cases.forEach((c) => {
              cloudSync.addCaseToStaging({
                case_id: c.original_case_id || c.case_id || generateCaseId(),
                collector_name: c.collector_name || 'external_import',
                review_status: c.review_status || 'approved',
                submitted_at: c.submitted_at || new Date().toISOString(),
                record_json: c.record || c.record_json || c
              });
            });
          } else {
            cloudSync.addCaseToStaging({
              case_id: parsed.caseId || parsed.case_id || generateCaseId(),
              collector_name: parsed.collector_name || 'external_import',
              review_status: 'pending_review',
              submitted_at: parsed.submitted_at || new Date().toISOString(),
              record_json: parsed.record_json || parsed
            });
          }
          renderStagingTable();
          showToast(`پرونده(ها) با موفقیت به استیجینگ افزوده شد.`, 'success');
        } catch (err) {
          showToast(`خطا در خواندن فایل ${file.name}: ${err.message}`, 'warning');
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  });

  btnExportMasterDataset?.addEventListener('click', () => {
    try {
      cloudSync.exportMasterDataset(false);
      showToast('دیتاست مرجع استاندارد با موفقیت دانلود شد.', 'success');
    } catch (err) {
      showToast(err.message, 'warning');
    }
  });
}

/* ==========================================================================
   DOM Synchronization from State
   ========================================================================== */
function syncDomFromState() {
  const idBadge = document.getElementById('headerCaseId');
  if (idBadge) idBadge.textContent = clinicalState.caseId;

  // Demographics
  const d = clinicalState.demographics;
  if (document.getElementById('demoGender')) document.getElementById('demoGender').value = d.gender || 'male';
  if (document.getElementById('demoAge')) document.getElementById('demoAge').value = d.age || '';
  if (document.getElementById('demoMarital')) document.getElementById('demoMarital').value = d.marital || 'متأهل';
  if (document.getElementById('demoCity')) document.getElementById('demoCity').value = d.city || '';
  if (document.getElementById('demoOccupation')) document.getElementById('demoOccupation').value = d.occupation || '';
  if (document.getElementById('demoInformant')) document.getElementById('demoInformant').value = d.informant || 'خود بیمار';

  const obgynCard = document.getElementById('cardObGynHistory');
  if (obgynCard) {
    obgynCard.style.display = d.gender === 'female' ? 'block' : 'none';
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
  if (document.getElementById('hpiDuration')) document.getElementById('hpiDuration').value = clinicalState.hpi.duration || '';
  if (document.getElementById('ccEstablishedDiagnosis')) document.getElementById('ccEstablishedDiagnosis').value = cc.establishedDiagnosis || '';
  if (document.getElementById('ccReferringAttending')) document.getElementById('ccReferringAttending').value = cc.referringAttending || '';
  if (document.getElementById('ccPlannedProcedure')) document.getElementById('ccPlannedProcedure').value = cc.plannedProcedure || '';

  renderCCCategoryChips();

  // HPI
  const hpi = clinicalState.hpi;
  if (document.getElementById('hpiOnset')) document.getElementById('hpiOnset').value = hpi.onset || '';
  if (document.getElementById('hpiCourse')) document.getElementById('hpiCourse').value = hpi.course || '';
  if (document.getElementById('hpiCharacter')) document.getElementById('hpiCharacter').value = hpi.character || '';
  if (document.getElementById('hpiSeverity')) {
    document.getElementById('hpiSeverity').value = hpi.severity || 5;
    document.getElementById('hpiSeverityLabel').textContent = `${hpi.severity || 5} / 10`;
    document.getElementById('hpiSeverityBadge').textContent = `${hpi.severity || 5} / 10`;
  }
  if (document.getElementById('hpiPreAdmissionWorkup')) document.getElementById('hpiPreAdmissionWorkup').value = hpi.preAdmissionWorkup || '';
  if (document.getElementById('hpiNarrativeNote')) document.getElementById('hpiNarrativeNote').value = hpi.narrativeNote || '';
  if (document.getElementById('hpiSystemGapInput')) document.getElementById('hpiSystemGapInput').value = hpi.systemGapNote || '';

  const sec = hpi.secondaryPain || {};
  if (document.getElementById('secPainRegion')) document.getElementById('secPainRegion').value = sec.region || '';
  if (document.getElementById('secPainCharacter')) document.getElementById('secPainCharacter').value = sec.character || '';
  if (document.getElementById('secPainRelation')) document.getElementById('secPainRelation').value = sec.relation || '';
  const secCard = document.getElementById('secondaryPainCard');
  if (secCard && (sec.region || sec.character || sec.relation)) {
    secCard.classList.add('active');
    const btnToggle = document.getElementById('btnToggleSecondaryPain');
    if (btnToggle) btnToggle.textContent = 'بستن';
  }

  renderPainSpatialPatterns();
  renderRadiationSites();
  renderHpiSymptomGroups();

  // Ob/Gyn
  const ob = clinicalState.obgyn || {};
  if (document.getElementById('obgynG')) document.getElementById('obgynG').value = ob.g || '';
  if (document.getElementById('obgynP')) document.getElementById('obgynP').value = ob.p || '';
  if (document.getElementById('obgynAb')) document.getElementById('obgynAb').value = ob.ab || '';
  if (document.getElementById('obgynL')) document.getElementById('obgynL').value = ob.l || '';
  if (document.getElementById('obgynDeliveryType')) document.getElementById('obgynDeliveryType').value = ob.deliveryType || '';
  if (document.getElementById('obgynLmp')) document.getElementById('obgynLmp').value = ob.lmp || '';
  if (document.getElementById('obgynDysmenorrhea')) document.getElementById('obgynDysmenorrhea').value = ob.dysmenorrhea || '';

  // PMH
  renderPmhChips();
  if (document.getElementById('pmhSystemGapInput')) document.getElementById('pmhSystemGapInput').value = clinicalState.pmh.systemGapNote || '';
  if (document.getElementById('pshNote')) document.getElementById('pshNote').value = clinicalState.psh.note || '';
  if (document.getElementById('pshSystemGapInput')) document.getElementById('pshSystemGapInput').value = clinicalState.psh.systemGapNote || '';
  if (document.getElementById('hhNote')) document.getElementById('hhNote').value = clinicalState.hh.note || '';
  if (document.getElementById('hhSystemGapInput')) document.getElementById('hhSystemGapInput').value = clinicalState.hh.systemGapNote || '';

  // DH / AH / SH / FH
  renderHighAlertDrugs();
  if (document.getElementById('dhNote')) document.getElementById('dhNote').value = clinicalState.dh.note || '';
  if (document.getElementById('dhSystemGapInput')) document.getElementById('dhSystemGapInput').value = clinicalState.dh.systemGapNote || '';
  renderAllergyTemplates();
  if (document.getElementById('ahNote')) document.getElementById('ahNote').value = clinicalState.ah.note || '';
  if (document.getElementById('ahSystemGapInput')) document.getElementById('ahSystemGapInput').value = clinicalState.ah.systemGapNote || '';
  if (document.getElementById('shCigsPerDay')) document.getElementById('shCigsPerDay').value = clinicalState.sh.cigsPerDay || '';
  if (document.getElementById('shYearsSmoked')) document.getElementById('shYearsSmoked').value = clinicalState.sh.yearsSmoked || '';
  if (document.getElementById('shOpium')) document.getElementById('shOpium').value = clinicalState.sh.opium || '';
  if (document.getElementById('shNote')) document.getElementById('shNote').value = clinicalState.sh.note || '';
  if (document.getElementById('shSystemGapInput')) document.getElementById('shSystemGapInput').value = clinicalState.sh.systemGapNote || '';
  renderFhChips();
  if (document.getElementById('fhNote')) document.getElementById('fhNote').value = clinicalState.fh.note || '';
  if (document.getElementById('fhSystemGapInput')) document.getElementById('fhSystemGapInput').value = clinicalState.fh.systemGapNote || '';

  // ROS
  renderRosGroups();
  if (document.getElementById('rosSystemGapInput')) document.getElementById('rosSystemGapInput').value = clinicalState.ros.systemGapNote || '';

  // PE
  const vitals = clinicalState.pe.vitals;
  if (document.getElementById('peVitalsBp')) document.getElementById('peVitalsBp').value = vitals.bp || '';
  if (document.getElementById('peVitalsPr')) document.getElementById('peVitalsPr').value = vitals.pr || '';
  if (document.getElementById('peVitalsRr')) document.getElementById('peVitalsRr').value = vitals.rr || '';
  if (document.getElementById('peVitalsTemp')) document.getElementById('peVitalsTemp').value = vitals.temp || '';
  if (document.getElementById('peVitalsSpo2')) document.getElementById('peVitalsSpo2').value = vitals.spo2 || '';
  if (document.getElementById('peVitalsNpo')) document.getElementById('peVitalsNpo').value = vitals.npo || '';
  if (document.getElementById('peNote')) document.getElementById('peNote').value = clinicalState.pe.note || '';
  if (document.getElementById('peSystemGapInput')) document.getElementById('peSystemGapInput').value = clinicalState.pe.systemGapNote || '';
  renderPeFindings();

  // Paraclinics
  renderParaclinicLabs();
  renderImagingModalities();
  if (document.getElementById('paraclinicLabNote')) document.getElementById('paraclinicLabNote').value = clinicalState.paraclinics.labNote || '';
  if (document.getElementById('paraclinicSystemGapInput')) document.getElementById('paraclinicSystemGapInput').value = clinicalState.paraclinics.systemGapNote || '';

  // Reasoning
  renderSemanticQualifiers();
  if (document.getElementById('reasoningProblemRep')) document.getElementById('reasoningProblemRep').value = clinicalState.reasoning.problemRepresentation || '';
  if (document.getElementById('reasoningDdx')) document.getElementById('reasoningDdx').value = clinicalState.reasoning.ddx || '';
}

window.addEventListener('DOMContentLoaded', initDynamicUI);
