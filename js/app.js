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
  PE_UNLOCKABLE_MODULES
} from './schema.js';
import { ClinicalCaseAnalytics, ClinicalTelemetryEngine } from './telemetry.js';
import {
  generateClinicalNote,
  normalizePersianClinicalText,
  synthesizeProblemRepresentation,
  sanitizeRecordForExport
} from './generator.js';
import { GoogleSheetsSyncEngine } from './google-sync.js';

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

export function createDefaultClinicalState() {
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
      painList: [createDefaultPainEpisode(1, 'کانون درد اول / شکایت محوری')],
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
  btnPos.title = 'ثبت مثبت (+1)';
  btnPos.textContent = '+';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'chip-title';
  titleSpan.textContent = label;

  const btnNeg = document.createElement('button');
  btnNeg.type = 'button';
  btnNeg.className = 'chip-btn-neg';
  btnNeg.title = 'ثبت منفی (-1)';
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
      // Merge into clinicalState safely
      clinicalState = Object.assign(createDefaultClinicalState(), parsed);
      if (!clinicalState.hpi.painList || !Array.isArray(clinicalState.hpi.painList) || clinicalState.hpi.painList.length === 0) {
        clinicalState.hpi.painList = [createDefaultPainEpisode(1, 'کانون درد اول / شکایت محوری')];
      }
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
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
   Tab 2: HPI & Multi-Focal Dynamic Pain Cards
   ========================================================================== */
function renderPainEpisodes() {
  const container = document.getElementById('painEpisodesContainer');
  if (!container) return;
  container.innerHTML = '';

  const pains = clinicalState.hpi.painList || [];

  pains.forEach((pain, index) => {
    const card = document.createElement('div');
    card.className = 'pain-episode-card';
    card.dataset.id = String(pain.id);

    // Card Header
    const header = document.createElement('div');
    header.className = 'pain-card-header';

    const titleArea = document.createElement('div');
    titleArea.className = 'pain-card-title';
    titleArea.innerHTML = `<span>📍</span>`;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'pain-title-input';
    titleInput.value = pain.title || `کانون درد #${index + 1}`;
    titleInput.placeholder = 'عنوان کانون درد...';
    titleInput.addEventListener('input', (e) => {
      pain.title = e.target.value;
      saveCurrentCase();
      updateLivePreview();
    });
    titleArea.appendChild(titleInput);
    header.appendChild(titleArea);

    if (pains.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-pain-card';
      delBtn.innerHTML = `<span>🗑️</span><span>حذف این کانون</span>`;
      delBtn.addEventListener('click', () => {
        clinicalState.hpi.painList.splice(index, 1);
        renderPainEpisodes();
        saveCurrentCase();
        updateLivePreview();
      });
      header.appendChild(delBtn);
    }

    card.appendChild(header);

    // OLDCARTS Form Grid: Duration, Onset, Course, Character
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

    // Spatial Pattern Selector (4 clean patterns)
    const spatGroup = document.createElement('div');
    spatGroup.className = 'form-group';
    spatGroup.style.marginTop = '0.6rem';
    spatGroup.innerHTML = `<label class="form-label">الگوی فضایی-زمانی درد</label>`;
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

    // Abdominal Region Matrix Container
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
        inlineInput.value = existing ? (existing.detail || '') : '';
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
        renderPainEpisodes();
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

    container.appendChild(card);
  });
}

function renderPainRegionsForEpisode(cardElement, pain) {
  const container = cardElement.querySelector('.episode-region-container');
  if (!container) return;
  container.innerHTML = '';

  const pattern = pain.spatialPattern || 'localized';

  if (pattern === 'localized_to_generalized' || pattern === 'migratory_shifting') {
    // Two-step Trajectory Grid
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
    // Single Multi-select Grid
    const row = document.createElement('div');
    row.className = 'form-group';
    row.innerHTML = `<label class="form-label">${pattern === 'generalized_predominant' ? 'نواحی دارای حداکثر شدت و ارجحیت درد' : 'نواحی آناتومیک درگیر درد'}</label>`;
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

function initAddPainEpisodeHandler() {
  document.getElementById('btnAddPainEpisode')?.addEventListener('click', () => {
    if (!clinicalState.hpi.painList) clinicalState.hpi.painList = [];
    const newId = clinicalState.hpi.painList.length + 1;
    clinicalState.hpi.painList.push(createDefaultPainEpisode(newId, `کانون درد #${newId}`));
    renderPainEpisodes();
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
  if (!md) return '<div class="preview-empty">در حال تکمیل پرونده...</div>';

  let html = md
    .replace(/^> \*\*مشخصات هویتی بیمار:\*\* (.*)$/gm, '<div class="preview-identity-box"><strong>مشخصات بیمار:</strong> $1</div>')
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
  renderPainEpisodes();
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

  btnOpen?.addEventListener('click', () => {
    if (modal) modal.style.display = 'flex';
    renderShiftCasesList();
  });

  btnClose?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  function renderShiftCasesList() {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const list = JSON.parse(localStorage.getItem(STORAGE_SHIFT_CASES_KEY) || '[]');
    if (list.length === 0) {
      listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:1rem; text-align:center;">پرونده بایگانی‌شده‌ای در شیفت فعلی وجود ندارد.</div>';
      return;
    }

    list.forEach((c, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;';
      item.innerHTML = `
        <div>
          <strong>${c.caseId}</strong> - <span style="font-size:0.8rem; color:var(--text-secondary);">${c.cc?.patientQuote || 'شکایت جراحی'}</span>
          <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(c.createdAt).toLocaleTimeString('fa-IR')}</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm btn-load-case">بارگذاری</button>
      `;

      item.querySelector('.btn-load-case').addEventListener('click', () => {
        if (confirm(`بارگذاری پرونده ${c.caseId}؟`)) {
          clinicalState = Object.assign(createDefaultClinicalState(), c);
          saveCurrentCase();
          syncDomFromState();
          updateLivePreview();
          if (modal) modal.style.display = 'none';
          showToast(`پرونده ${c.caseId} بارگذاری گردید.`, 'info');
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
    showToast('دیتاست تجمیعی شیفت (فاقد مشخصات هویتی حساس) دانلود شد.', 'success');
  });
}

function initCloudSyncUI() {
  const btnSync = document.getElementById('btnCloudSync');
  const btnSettings = document.getElementById('btnCloudSettings');
  const settingsModal = document.getElementById('cloudSettingsModalBackdrop');
  const btnCloseSettings = document.getElementById('btnCloseCloudSettings');
  const btnCancelSettings = document.getElementById('btnCancelCloudSettings');
  const btnSaveSettings = document.getElementById('btnSaveCloudSettings');
  const collectorInput = document.getElementById('collectorIdInput');
  const settingCollector = document.getElementById('settingCollectorName');
  const settingUrl = document.getElementById('settingEndpointUrl');

  if (collectorInput) {
    collectorInput.value = gsheetSync.config.collectorName || '';
    collectorInput.addEventListener('input', (e) => {
      gsheetSync.saveConfig({ scriptUrl: gsheetSync.config.scriptUrl, collectorName: e.target.value });
    });
  }

  btnSettings?.addEventListener('click', () => {
    if (settingCollector) settingCollector.value = gsheetSync.config.collectorName || '';
    if (settingUrl) settingUrl.value = gsheetSync.config.scriptUrl || '';
    if (settingsModal) settingsModal.style.display = 'flex';
  });

  const closeSettings = () => { if (settingsModal) settingsModal.style.display = 'none'; };
  btnCloseSettings?.addEventListener('click', closeSettings);
  btnCancelSettings?.addEventListener('click', closeSettings);

  btnSaveSettings?.addEventListener('click', () => {
    gsheetSync.saveConfig({
      scriptUrl: settingUrl?.value || '',
      collectorName: settingCollector?.value || ''
    });
    if (collectorInput) collectorInput.value = settingCollector?.value || '';
    closeSettings();
    showToast('تنظیمات اتصال Google Sheets ذخیره شد.', 'success');
  });

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
  initReasoningHandlers();
  initSystemGapLoggers();
  initNavigationTabs();
  initExportAndCopy();
  initShiftManager();
  initCloudSyncUI();
  initThemeToggle();
  initMobileBottomSheet();

  loadSavedState();
  syncDomFromState();
  updateLivePreview();
  updateShiftCasesCount();
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
}
