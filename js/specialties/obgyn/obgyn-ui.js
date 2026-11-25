/**
 * MedHistorism v3.2 — Ob/Gyn Complete Interactive Clinical UI Module
 * Classic 8-Tab Architecture:
 *   1. Admission & CC -> 2. HPI -> 3. PMH & PSH -> 4. DH / AH / SH / FH
 *   5. ROS (Full Head-to-Toe) -> 6. PE (Specialized + General Head-to-Toe)
 *   7. Paraclinics (Labs + On-Demand Studies) -> 8. Assessment & Plan (ADCA VAN DIMLS)
 * Zero Emojis, Zero Regressions, Full RTL/LTR & Light/Dark Support.
 */

import {
  OBGYN_OBSTETRIC_ARCHETYPES,
  OBGYN_GYN_ARCHETYPES,
  OBGYN_SS_FIVE_IDS,
  OBGYN_SYMPTOM_BANK,
  OBGYN_CONTRACEPTION_OPTIONS,
  OBGYN_DDX_PRESETS,
  OBGYN_PMH_DELTA,
  OBGYN_PSH_DELTA,
  OBGYN_MEDICATIONS_DELTA,
  OBGYN_SOAPE_CAPSULES,
  ADCA_VAN_DIMLS_PRESETS,
  OBGYN_CONCEPTION_METHODS,
  OBGYN_BLEED_VOLUME_OPTIONS,
  OBGYN_CLOT_OPTIONS,
  OBGYN_ANEMIA_SYMPTOMS,
  OBGYN_QUICK_ALLERGENS,
  OBGYN_ALLERGY_REACTIONS,
  OBGYN_QUICK_LAB_IDS,
  OBGYN_PARACLINIC_STUDY_TYPES,
  OBGYN_PE_OPTIONS,
  OBGYN_PE_NORMAL_PRESETS,
  OBGYN_GENERAL_PE_SYSTEM_KEYS
} from './obgyn-data.js';
import {
  createDefaultObgynState,
  normalizeSubMode,
  normalizeObgynState,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory,
  evaluateObgynSafetyGuardrails
} from './obgyn-state.js';
import {
  ALL_MASTER_PMH_ITEMS,
  MASTER_PSH_SURGERIES_BANK,
  ALL_MASTER_DRUGS,
  DH_SIG_OPTIONS,
  ROS_GROUPS_BILINGUAL,
  PE_MANDATORY_PILLARS,
  MASTER_ALL_LAB_TESTS
} from '../../schema.js';
import { getCurrentLanguage, tLabel } from '../../i18n.js';
import { getIconSvg } from '../../icons.js';
import { smartClinicalSearch } from '../../fuzzy-search.js';

let hostBridge = {
  getState: () => null,
  onStateChange: () => {},
  openSharedCoreTab: () => {},
  switchToSoapMode: () => {}
};

let activeSubMode = 'obstetrics'; // 'obstetrics' | 'gynecology' | 'soape'
let activeTab = 'admission'; // 'admission' | 'hpi' | 'pmh_psh' | 'dh_ah_sh_fh' | 'ros' | 'pe' | 'paraclinics' | 'plan'
let activeSoapeSection = 'soape_daily';
let symptomSearchQuery = '';
let showAllSymptoms = false;
let rosSearchQuery = '';
let generalPeSearchQuery = '';
let labSearchQuery = '';
let obsMenstrualExpanded = false;
let gynPohExpanded = false;
let adcaExpanded = false;
const sharedSearchQueries = { pmh: '', psh: '', dh: '' };
const expandedRosSystems = new Set();
const expandedGenPeSystems = new Set();

const OBGYN_TABS = [
  { id: 'admission', icon: 'file-text', fa: '۱. پذیرش، شاخص و CC', en: '1. Admission & CC' },
  { id: 'hpi', icon: 'activity', fa: '۲. شرح بیماری فعلی (HPI)', en: '2. HPI' },
  { id: 'pmh_psh', icon: 'layers', fa: '۳. سوابق بیماری و جراحی', en: '3. PMH & PSH' },
  { id: 'dh_ah_sh_fh', icon: 'pill', fa: '۴. دارو، حساسیت، عادات و فامیل', en: '4. DH / AH / SH / FH' },
  { id: 'ros', icon: 'list-checks', fa: '۵. مرور سیستم‌ها (ROS)', en: '5. ROS' },
  { id: 'pe', icon: 'stethoscope', fa: '۶. معاینه فیزیکی کامل (PE)', en: '6. Physical Exam' },
  { id: 'paraclinics', icon: 'ultrasound', fa: '۷. پاراکلینیک و تصویربرداری', en: '7. Paraclinics' },
  { id: 'plan', icon: 'clipboard', fa: '۸. تشخیص، پلن و دستورات ADCA', en: '8. Assessment & Plan' }
];

const SOAPE_RAIL_TABS = [
  { id: 'soape_daily', icon: 'trend-up', fa: '۱. سیر روزانه بخش (SOAPE)', en: '1. Daily Progress (SOAPE)' },
  { id: 'discharge_sadaf', icon: 'save', fa: '۲. خلاصه ترخیص و SADAF', en: '2. Discharge & SADAF' },
  { id: 'consult', icon: 'coreLink', fa: '۳. برگه درخواست مشاوره', en: '3. Consultation Request' }
];

function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tx(isEn, fa, en) {
  return isEn ? en : fa;
}

function localizeBankText(raw, explicitEn, isEn) {
  if (!isEn) return raw || explicitEn || '';
  return tLabel(raw || '', explicitEn || '') || explicitEn || raw || '';
}

function hasVal(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function stripTitleNoise(str) {
  return String(str || '').replace(/^[۰-۹0-9]+[-.\s]+/, '').trim();
}

export function ensureObgynStateOnHost(state) {
  if (!state || typeof state !== 'object') return createDefaultObgynState();
  if (!state.obgynModule || typeof state.obgynModule !== 'object' || !state.obgynModule.obstetricIndex) {
    state.obgynModule = normalizeObgynState(state.obgynModule || state.obgyn);
  }
  return state.obgynModule;
}

export function initObgynUi(bridge = {}) {
  hostBridge = { ...hostBridge, ...bridge };
  if (typeof document !== 'undefined') {
    const switcher = document.getElementById('obgynModeSwitcher');
    if (switcher && switcher.dataset.obgynBound !== '1') {
      switcher.dataset.obgynBound = '1';
      switcher.querySelectorAll('.mode-switch-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const modeAttr = btn.getAttribute('data-obgyn-mode') || 'obstetrics';
          setObgynUiSubMode(modeAttr);
        });
      });
    }
  }
}

export function getObgynActiveSubMode() {
  return activeSubMode;
}

export function setObgynUiSubMode(subMode) {
  activeSubMode = normalizeSubMode(subMode);
  const state = hostBridge.getState();
  if (state) {
    const ob = ensureObgynStateOnHost(state);
    ob.subMode = activeSubMode;
    if (!state.demographics) state.demographics = {};
    state.demographics.gender = 'female';
  }
  syncModeSwitcherDom();
  renderObgynWorkspace(activeSubMode);
  hostBridge.onStateChange();
}

export function setObgynActiveTab(tabId) {
  const alias = { history: 'pmh_psh', shared: 'dh_ah_sh_fh', workup: 'paraclinics' }[tabId] || tabId;
  if (OBGYN_TABS.some((t) => t.id === alias)) {
    activeTab = alias;
    const state = hostBridge.getState();
    if (state) {
      const ob = ensureObgynStateOnHost(state);
      ob.activeTab = alias;
    }
  } else if (SOAPE_RAIL_TABS.some((t) => t.id === alias)) {
    activeSoapeSection = alias;
    const state = hostBridge.getState();
    if (state) {
      const ob = ensureObgynStateOnHost(state);
      if (alias === 'discharge_sadaf') ob.dischargeSadaf.active = true;
      if (alias === 'consult') ob.consultNote.active = true;
    }
  }
  exitObgynSharedCoreBanner();
}

function syncModeSwitcherDom() {
  if (typeof document === 'undefined') return;
  const switcher = document.getElementById('obgynModeSwitcher');
  if (!switcher) return;
  switcher.querySelectorAll('.mode-switch-btn').forEach((btn) => {
    const raw = btn.getAttribute('data-obgyn-mode') || 'obstetrics';
    const norm = normalizeSubMode(raw);
    btn.classList.toggle('active', norm === activeSubMode);
    btn.setAttribute('aria-pressed', String(norm === activeSubMode));
  });
}

function collectSelectedPmhItems(state) {
  const list = [];
  const cats = state?.pmh?.categories || {};
  Object.entries(cats).forEach(([catId, cat]) => {
    Object.entries(cat?.items || {}).forEach(([id, entry]) => {
      if (!entry || (entry.state !== 1 && entry.state !== -1)) return;
      list.push({ id, catId, ...entry });
    });
  });
  return list;
}

function countSharedCoreStats(state) {
  const c = state || {};
  const pmhCount = collectSelectedPmhItems(c).length;
  const pshCount = Array.isArray(c.psh?.surgeries) ? c.psh.surgeries.length : 0;
  const dhCount = (Array.isArray(c.dh?.activeDrugs) ? c.dh.activeDrugs.length : 0)
    + (Array.isArray(c.dh?.customDrugs) ? c.dh.customDrugs.length : 0);
  const ahCount = Array.isArray(c.ah?.selected) ? c.ah.selected.length : 0;
  const shFhCount = (c.sh?.negSmoking ? 1 : 0) + (c.sh?.negOpium ? 1 : 0) + (c.sh?.negAlcohol ? 1 : 0) + (hasVal(c.sh?.note) ? 1 : 0) + (c.fh?.negFamilyHistory ? 1 : 0) + (hasVal(c.fh?.note) ? 1 : 0);
  const rosItems = c.ros?.items || {};
  const rosCount = Object.values(rosItems).filter((v) => {
    const st = v && typeof v === 'object' ? v.state : v;
    return st === 1 || st === -1;
  }).length;
  const genPeCount = Object.values(c.pe?.findings || {}).filter((v) => {
    const st = v && typeof v === 'object' ? v.state : v;
    return st === 1 || st === -1;
  }).length;
  return { pmhCount, pshCount, dhCount, ahCount, shFhCount, rosCount, genPeCount };
}

function countNonEmptyValues(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj).filter((v) => hasVal(v)).length;
}

function getTabBadgeCount(tabId, state, ob) {
  if (!ob) return '';
  const sc = countSharedCoreStats(state);
  if (tabId === 'admission') {
    const idx = ob.obstetricIndex || {};
    const hasBasic = hasVal(idx.G) || hasVal(ob.ccAndHpi?.ccText) || hasVal(ob.gestationalDating?.lmpDate) || hasVal(ob.gestationalDating?.ntScanDate);
    return hasBasic ? '1+' : '';
  }
  if (tabId === 'hpi') {
    const presCnt = Array.isArray(ob.ccAndHpi?.presentations) ? ob.ccAndHpi.presentations.length : 0;
    const symCnt = Object.values(ob.ccAndHpi?.symptoms || {}).filter((s) => s?.state === 1 || s?.state === -1).length;
    const anCnt = Object.values(ob.ccAndHpi?.anemiaSymptoms || {}).filter((s) => s?.state === 1 || s?.state === -1).length;
    return presCnt + symCnt + anCnt > 0 ? String(presCnt + symCnt + anCnt) : '';
  }
  if (tabId === 'pmh_psh') {
    const pregCnt = ob.pastObstetricHistory?.pregnancies?.length || 0;
    const tot = sc.pmhCount + sc.pshCount + pregCnt;
    return tot > 0 ? String(tot) : '';
  }
  if (tabId === 'dh_ah_sh_fh') {
    const tot = sc.dhCount + sc.ahCount + sc.shFhCount + (state?.ah?.nkda ? 1 : 0);
    return tot > 0 ? String(tot) : '';
  }
  if (tabId === 'ros') {
    return sc.rosCount > 0 ? String(sc.rosCount) : '';
  }
  if (tabId === 'pe') {
    const vtCnt = countNonEmptyValues(ob.pe?.vitals);
    const obsCnt = countNonEmptyValues(ob.pe?.obsMeasurements);
    const gynSections = ob.pe?.gynExam || {};
    const gynCnt = Object.values(gynSections).reduce((acc, sec) => acc + countNonEmptyValues(sec), 0);
    const tot = vtCnt + (activeSubMode === 'gynecology' ? gynCnt : obsCnt) + sc.genPeCount;
    return tot > 0 ? String(tot) : '';
  }
  if (tabId === 'paraclinics') {
    const klCnt = countNonEmptyValues(ob.paraclinics?.keyLabs);
    const exCnt = (Array.isArray(ob.paraclinics?.extraLabs) ? ob.paraclinics.extraLabs.filter((x) => hasVal(x?.value)).length : 0);
    const stCnt = Array.isArray(ob.paraclinics?.studies) ? ob.paraclinics.studies.length : 0;
    return klCnt + exCnt + stCnt > 0 ? String(klCnt + exCnt + stCnt) : '';
  }
  if (tabId === 'plan') {
    const ddxCnt = ob.assessmentAndPlan?.ddx?.length || 0;
    const ordCnt = Object.entries(ob.assessmentAndPlan?.adcaVanDimls || {})
      .filter(([k, v]) => !['physicianName', 'dateTime'].includes(k) && hasVal(v)).length;
    return ddxCnt + ordCnt > 0 ? String(ddxCnt + ordCnt) : '';
  }
  if (tabId === 'soape_daily') return ob.soapeHistory?.length ? String(ob.soapeHistory.length) : '';
  if (tabId === 'discharge_sadaf') return ob.dischargeSadaf?.active ? 'ON' : '';
  if (tabId === 'consult') return ob.consultNote?.active ? 'ON' : '';
  return '';
}

function renderObgynNavigationRail(state, ob, isEn) {
  if (typeof document === 'undefined') return;
  const railEl = document.getElementById('railNavObgyn');
  const mobileEl = document.getElementById('obgyn-mobile-tabs');
  const items = activeSubMode === 'soape' ? SOAPE_RAIL_TABS : OBGYN_TABS;
  const currentId = activeSubMode === 'soape' ? activeSoapeSection : activeTab;

  if (railEl) {
    const heading = activeSubMode === 'soape'
      ? tx(isEn, 'سیر روزانه و ترخیص زنان', 'OB/GYN WARD SOAPE & DISCHARGE')
      : activeSubMode === 'gynecology'
      ? tx(isEn, 'بخش‌های پرونده ژنیکولوژی', 'GYNECOLOGY CHARTING ORDER')
      : tx(isEn, 'بخش‌های پرونده مامایی', 'OBSTETRICS CHARTING ORDER');

    railEl.innerHTML = `
      <div class="rail-sections-label">${escapeHtml(heading)}</div>
      <nav class="rail-nav-list obgyn-rail-list" role="tablist">
        ${items.map((tab) => {
          const isActive = tab.id === currentId;
          const badge = getTabBadgeCount(tab.id, state, ob);
          return `
            <button type="button" class="obgyn-rail-btn ${isActive ? 'active' : ''}" data-obgyn-tab="${tab.id}" role="tab" aria-selected="${isActive}">
              <span class="tab-icon-wrap">${getIconSvg(tab.icon, { size: 15 })}</span>
              <span class="tab-title-text">${escapeHtml(isEn ? tab.en : tab.fa)}</span>
              ${badge ? `<span class="obgyn-rail-badge">${escapeHtml(badge)}</span>` : ''}
            </button>
          `;
        }).join('')}
      </nav>
    `;
    railEl.querySelectorAll('.obgyn-rail-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-obgyn-tab');
        if (tid) setObgynActiveTab(tid);
      });
    });
  }

  if (mobileEl) {
    mobileEl.innerHTML = items.map((tab) => {
      const isActive = tab.id === currentId;
      return `
        <button type="button" class="mobile-tab-pill obgyn-mobile-tab-btn ${isActive ? 'active' : ''}" data-obgyn-tab="${tab.id}" role="tab" aria-selected="${isActive}">
          <span>${escapeHtml(isEn ? tab.en : tab.fa)}</span>
        </button>
      `;
    }).join('');
    mobileEl.querySelectorAll('.obgyn-mobile-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-obgyn-tab');
        if (tid) setObgynActiveTab(tid);
      });
    });
  }
}

function buildExecSummaryHtml(state, ob, isEn) {
  const idx = ob.obstetricIndex || {};
  const ga = calculateTripleGestationalAge(ob.gestationalDating);
  const bishop = calculateBishopScore(ob.pe?.obsMeasurements);
  const d = state?.demographics || {};

  const g = hasVal(idx.G) ? idx.G : '_';
  const p = hasVal(idx.P) ? idx.P : '_';
  const l = hasVal(idx.L) ? idx.L : '_';
  const dVal = hasVal(idx.D) ? idx.D : '_';
  const ab = hasVal(idx.Ab) ? idx.Ab : '_';
  const nd = hasVal(idx.ND) ? idx.ND : '_';
  const cs = hasVal(idx.CS) ? idx.CS : '_';

  const formulaCode = activeSubMode === 'gynecology' && !idx.expandZeroIndexFields
    ? `G${g} P${p} L${l} Ab${ab} (ND${nd}, CS${cs})`
    : `G${g} P${p} L${l} D${dVal} Ab${ab} (ND${nd}, CS${cs})`;

  const ptLabel = hasVal(d.fullName)
    ? `${escapeHtml(d.fullName)}${hasVal(d.age) ? ` (${escapeHtml(d.age)}y)` : ''}`
    : tx(isEn, 'پرونده جدید زنان و زایمان', 'New Ob/Gyn Case');

  const concObj = OBGYN_CONCEPTION_METHODS.find((c) => c.val === idx.conceptionMethod);
  const concPill = concObj && concObj.val !== 'spontaneous'
    ? `<span class="obgyn-mono-pill is-art">${escapeHtml(isEn ? concObj.en : concObj.faShort)}</span>`
    : '';

  let pills = [];
  if (activeSubMode === 'gynecology') {
    const lmpStr = ob.menstrualHistory?.lmpDate || ob.gestationalDating?.lmpDate || '';
    const patternStr = ob.menstrualHistory?.regularity === 'irregular'
      ? tx(isEn, 'نامنظم', 'Irregular')
      : ob.menstrualHistory?.regularity === 'regular'
      ? tx(isEn, 'منظم', 'Regular')
      : '';
    const cObj = OBGYN_CONTRACEPTION_OPTIONS.find((o) => o.val === ob.gynScreeningAndRecords?.contraception?.currentMethod);
    pills = [
      `<span class="obgyn-mono-pill">${escapeHtml(formulaCode)}</span>`,
      concPill,
      lmpStr ? `<span class="obgyn-mono-pill">LMP: ${escapeHtml(lmpStr)}</span>` : '',
      patternStr ? `<span class="obgyn-mono-pill">${escapeHtml(patternStr)}</span>` : '',
      cObj ? `<span class="obgyn-mono-pill">${escapeHtml(isEn ? cObj.en : cObj.fa)}</span>` : '',
      idx.isVirgin ? `<span class="obgyn-mono-pill is-lock">${getIconSvg('lock', { size: 12 })} Virgin Lock</span>` : ''
    ].filter(Boolean);
  } else {
    const gaNt = ga.gaByNt ? `GA(NT) ${ga.gaByNt.code}` : '';
    const gaLmp = ga.gaByLmp ? `GA(LMP) ${ga.gaByLmp.code}` : '';
    const bishopPill = bishop.assessedCount > 0 ? `<span class="obgyn-mono-pill">Bishop: ${bishop.score}/13</span>` : '';
    const redatePill = ga.redatingAlert?.shouldRedate ? `<span class="obgyn-mono-pill is-alert">Redated -> NT</span>` : '';
    pills = [
      `<span class="obgyn-mono-pill">${escapeHtml(formulaCode)}</span>`,
      concPill,
      gaNt ? `<span class="obgyn-mono-pill">${escapeHtml(gaNt)}</span>` : '',
      gaLmp ? `<span class="obgyn-mono-pill">${escapeHtml(gaLmp)}</span>` : '',
      hasVal(idx.maternalBgRh) ? `<span class="obgyn-mono-pill">${escapeHtml(idx.maternalBgRh)}</span>` : '',
      bishopPill,
      redatePill,
      idx.isVirgin ? `<span class="obgyn-mono-pill is-lock">${getIconSvg('lock', { size: 12 })} Virgin Lock</span>` : ''
    ].filter(Boolean);
  }

  return `
    <div class="obgyn-exec-top">
      <div class="obgyn-exec-title">
        ${getIconSvg('lensObgyn', { size: 16 })}
        <span>${ptLabel}</span>
        <span class="obgyn-submode-tag">${escapeHtml(
          activeSubMode === 'obstetrics'
            ? tx(isEn, 'مامایی / پره‌ناتال', 'Obstetrics')
            : activeSubMode === 'gynecology'
            ? tx(isEn, 'بیماری‌های زنان', 'Gynecology')
            : tx(isEn, 'سیر روزانه و ترخیص', 'Ward SOAPE')
        )}</span>
      </div>
      <div class="obgyn-exec-badges">${pills.join('')}</div>
    </div>
  `;
}

function renderGuardrailBannersHtml(guardrails, isEn, contextTab = '') {
  const alerts = [];
  if (guardrails.virginLock && (contextTab === 'admission' || contextTab === 'pe' || !contextTab)) {
    alerts.push({ tone: 'lock', icon: 'lock', text: isEn ? guardrails.messages.virginEn : guardrails.messages.virginFa });
  }
  if (guardrails.previaTvContraindicated && (contextTab === 'hpi' || contextTab === 'pe' || contextTab === 'paraclinics')) {
    alerts.push({ tone: 'danger', icon: 'siren', text: isEn ? guardrails.messages.previaEn : guardrails.messages.previaFa });
  }
  if ((guardrails.accretaDopplerMandatory || guardrails.priorCsIndicationMissing) && (contextTab === 'admission' || contextTab === 'paraclinics')) {
    alerts.push({ tone: 'warning', icon: 'alert-triangle', text: isEn ? guardrails.messages.accretaEn : guardrails.messages.accretaFa });
  }
  if (guardrails.ndCsMismatch && contextTab === 'admission') {
    alerts.push({ tone: 'warning', icon: 'alert-triangle', text: isEn ? guardrails.messages.ndCsEn : guardrails.messages.ndCsFa });
  }
  if (guardrails.bhcgMandatory && (contextTab === 'hpi' || contextTab === 'paraclinics')) {
    alerts.push({ tone: 'danger', icon: 'alert-triangle', text: isEn ? guardrails.messages.bhcgEn : guardrails.messages.bhcgFa });
  }
  if (alerts.length === 0) return '';
  return `
    <div class="obgyn-guardrail-stack">
      ${alerts.map((a) => `
        <div class="obgyn-guardrail-banner is-${a.tone}" role="alert">
          <span class="obgyn-guardrail-icon">${getIconSvg(a.icon, { size: 16 })}</span>
          <span>${escapeHtml(a.text)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderGaSummaryInner(gd, ga, isEn) {
  const rows = [
    { label: 'GA (LMP)', val: ga.gaByLmp ? `${ga.gaByLmp.code} — EDD: ${ga.eddByLmp || '—'}` : (gd.isReliableLmp === false ? tx(isEn, 'LMP نامطمئن', 'Unreliable LMP') : '—') },
    { label: 'GA (NT / 1st Tri)', val: ga.gaByNt ? `${ga.gaByNt.code} — EDD: ${ga.eddByNt || '—'}` : '—' },
    { label: 'GA (Last Sono)', val: ga.gaByLastSono ? `${ga.gaByLastSono.code}${ga.lastSonoAtScan ? ` (${tx(isEn, 'در زمان اسکن', 'at scan')}: ${ga.lastSonoAtScan.code})` : ''}` : '—' },
    { label: tx(isEn, 'معیار رسمی بخش', 'Official Dating'), val: ga.officialGa ? `${ga.officialSource}: ${ga.officialGa.code}${ga.officialEdd ? ` | EDD: ${ga.officialEdd}` : ''}` : '—', strong: true }
  ];

  const alertHtml = ga.redatingAlert
    ? `<div class="obgyn-redating-alert ${ga.redatingAlert.shouldRedate ? 'is-redated' : ga.redatingAlert.warningType === 'growth_discrepancy' ? 'is-discrepancy' : 'is-concordant'}">
        ${getIconSvg(ga.redatingAlert.warningType === 'concordant' ? 'check-circle' : 'alert-triangle', { size: 15 })}
        <span>${escapeHtml(isEn ? ga.redatingAlert.messageEn : ga.redatingAlert.messageFa)}</span>
      </div>`
    : '';

  return `
    <div class="obgyn-ga-result-grid">
      ${rows.map((r) => `
        <div class="obgyn-ga-result-cell ${r.strong ? 'is-official' : ''}">
          <span class="obgyn-ga-cell-label">${escapeHtml(r.label)}</span>
          <strong class="obgyn-ga-cell-val dir-ltr">${escapeHtml(r.val)}</strong>
        </div>
      `).join('')}
    </div>
    ${alertHtml}
  `;
}

/* =========================== TAB 1: ADMISSION & CC =========================== */

function renderTabAdmission(state, ob, guardrails, isEn) {
  const d = state?.demographics || {};
  const idx = ob.obstetricIndex || {};
  const gd = ob.gestationalDating || {};
  const hpi = ob.ccAndHpi || {};
  const ga = calculateTripleGestationalAge(gd);
  const isObs = activeSubMode !== 'gynecology';
  const csCount = parseInt(idx.CS ?? '0', 10) || 0;
  const isRhNeg = /[-−]/.test(idx.maternalBgRh || '');

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'admission')}

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('user', { size: 16 })}
          <span>${tx(isEn, 'مشخصات دموگرافیک، بکارت و وضعیت باروری (جنسیت: خانم)', 'Demographics, Virgin Lock & Reproductive Status (Female)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${idx.isVirgin ? 'active is-lock' : ''}" id="btnObgynToggleVirgin" aria-pressed="${Boolean(idx.isVirgin)}">
          ${getIconSvg(idx.isVirgin ? 'lock' : 'unlock', { size: 14 })}
          <span>${tx(isEn, idx.isVirgin ? 'Virgin (معاینه داخلی قفل)' : 'غیر Virgin / معاینه آزاد', idx.isVirgin ? 'Virgin (Internal Exam Locked)' : 'Non-Virgin')}</span>
        </button>
      </div>

      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obDemoName">${tx(isEn, 'نام و نام خانوادگی بیمار', 'Patient Full Name')}</label>
          <input type="text" class="input-text" id="obDemoName" value="${escapeHtml(d.fullName || '')}" placeholder="${tx(isEn, 'نام بیمار (محرمانه در همگام‌سازی)', 'Patient name (PII-shielded)')}">
        </div>
        <div class="obgyn-field">
          <label for="obDemoAge">${tx(isEn, 'سن (سال)', 'Age (Years)')}</label>
          <input type="number" class="input-text dir-ltr" id="obDemoAge" min="10" max="95" value="${escapeHtml(d.age || '')}" placeholder="28">
        </div>
        <div class="obgyn-field">
          <label for="obDemoWard">${tx(isEn, 'بخش بستری', 'Ward / Unit')}</label>
          <input type="text" class="input-text" id="obDemoWard" value="${escapeHtml(d.ward || '')}" placeholder="${tx(isEn, 'بخش زنان / لیبر', 'Ob/Gyn / Labor Ward')}">
        </div>
        <div class="obgyn-field">
          <label for="obDemoBed">${tx(isEn, 'شماره تخت / پرونده', 'Bed / Chart')}</label>
          <input type="text" class="input-text dir-ltr" id="obDemoBed" value="${escapeHtml(d.bed || '')}" placeholder="04">
        </div>
      </div>

      <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-sm">
        <div class="obgyn-field">
          <label for="obIdxMarital">${tx(isEn, 'وضعیت تاهل', 'Marital Status')}</label>
          <select class="input-select" id="obIdxMarital">
            <option value="" ${!idx.maritalStatus ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
            <option value="married" ${idx.maritalStatus === 'married' ? 'selected' : ''}>${tx(isEn, 'متاهل', 'Married')}</option>
            <option value="single" ${idx.maritalStatus === 'single' ? 'selected' : ''}>${tx(isEn, 'مجرد', 'Single')}</option>
            <option value="divorced" ${idx.maritalStatus === 'divorced' ? 'selected' : ''}>${tx(isEn, 'مطلقه', 'Divorced')}</option>
            <option value="widowed" ${idx.maritalStatus === 'widowed' ? 'selected' : ''}>${tx(isEn, 'همسر فوت‌شده', 'Widowed')}</option>
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obIdxConception">${tx(isEn, 'شیوه بارداری فعلی (Conception)', 'Conception Method')}</label>
          <select class="input-select" id="obIdxConception">
            <option value="" ${!idx.conceptionMethod ? 'selected' : ''}>${tx(isEn, 'نامشخص / ثبت‌نشده', 'Not specified')}</option>
            ${OBGYN_CONCEPTION_METHODS.map((o) => `
              <option value="${o.val}" ${idx.conceptionMethod === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
            `).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obIdxReproStatus">${tx(isEn, 'وضعیت باروری / هورمونی', 'Reproductive Status')}</label>
          <select class="input-select" id="obIdxReproStatus">
            <option value="" ${!idx.reproductiveStatus ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
            <option value="pregnant" ${idx.reproductiveStatus === 'pregnant' ? 'selected' : ''}>${tx(isEn, 'باردار', 'Pregnant')}</option>
            <option value="reproductive" ${idx.reproductiveStatus === 'reproductive' ? 'selected' : ''}>${tx(isEn, 'در سنین باروری', 'Reproductive Age')}</option>
            <option value="perimenopausal" ${idx.reproductiveStatus === 'perimenopausal' ? 'selected' : ''}>${tx(isEn, 'پری‌منوپوز', 'Perimenopausal')}</option>
            <option value="postmenopausal" ${idx.reproductiveStatus === 'postmenopausal' ? 'selected' : ''}>${tx(isEn, 'یائسه (Postmenopausal)', 'Postmenopausal')}</option>
            <option value="postpartum" ${idx.reproductiveStatus === 'postpartum' ? 'selected' : ''}>${tx(isEn, 'پس از زایمان (Postpartum)', 'Postpartum')}</option>
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obIdxBgRh">${tx(isEn, 'گروه خونی بیمار (BG & Rh)', 'Blood Group & Rh')}</label>
          <select class="input-select dir-ltr" id="obIdxBgRh">
            <option value="">${tx(isEn, '-- انتخاب نشده --', '-- Select BG/Rh --')}</option>
            ${['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => `
              <option value="${bg}" ${idx.maternalBgRh === bg ? 'selected' : ''}>${bg}</option>
            `).join('')}
          </select>
        </div>
      </div>

      ${idx.reproductiveStatus === 'postmenopausal' ? `
      <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-sm">
        <div class="obgyn-field">
          <label for="obIdxMenopauseAge">${tx(isEn, 'سن یائسگی (سال)', 'Menopause Age')}</label>
          <input type="number" class="input-text dir-ltr" id="obIdxMenopauseAge" min="30" max="70" value="${escapeHtml(idx.menopauseAge || '')}" placeholder="51">
        </div>
      </div>` : ''}

      <div class="obgyn-form-grid obgyn-cols-3 obgyn-mt-sm">
        <div class="obgyn-field is-span-2">
          <label for="obAdmCc">${tx(isEn, 'شکایت اصلی بیمار (Chief Complaint - CC)', 'Chief Complaint (CC)')}</label>
          <input type="text" class="input-text" id="obAdmCc" value="${escapeHtml(hpi.ccText || state?.cc?.patientQuote || '')}" placeholder="${isObs ? tx(isEn, 'مثلاً درد زایمانی، آبریزش یا فشار خون بالا...', 'e.g. Labor contractions, ROM leakage, or high BP...') : tx(isEn, 'مثلاً خونریزی شدید واژینال یا درد زیر دل...', 'e.g. Heavy vaginal bleeding or pelvic pain...')}">
        </div>
        <div class="obgyn-field">
          <label for="obAdmDur">${tx(isEn, 'مدت شروع شکایت', 'Duration')}</label>
          <input type="text" class="input-text" id="obAdmDur" value="${escapeHtml(hpi.duration || '')}" placeholder="${tx(isEn, 'مثلاً ۶ ساعت / ۲ هفته', 'e.g. 6 hours / 2 weeks')}">
        </div>
      </div>

      ${isObs && isRhNeg ? `
      <div class="obgyn-rh-box obgyn-mt-sm">
        <div class="obgyn-rh-title">${getIconSvg('alert-triangle', { size: 15 })} ${tx(isEn, 'پروتکل مادر Rh منفی (RhoGAM / Coombs)', 'Rh-Negative Maternal Protocol')}</div>
        <div class="obgyn-form-grid obgyn-cols-2">
          <div class="obgyn-field">
            <label for="obIdxPatBgRh">${tx(isEn, 'گروه خونی همسر (Paternal BG & Rh)', 'Paternal BG & Rh')}</label>
            <input type="text" class="input-text dir-ltr" id="obIdxPatBgRh" value="${escapeHtml(idx.paternalBgRh || '')}" placeholder="e.g. A+">
          </div>
          <div class="obgyn-field">
            <label for="obIdxRhogam">${tx(isEn, 'تست کومبس غیرمستقیم و تزریق روگام', 'Indirect Coombs & RhoGAM Status')}</label>
            <input type="text" class="input-text" id="obIdxRhogam" value="${escapeHtml(idx.indirectCoombsRhogam || '')}" placeholder="${tx(isEn, 'مثلاً کومبس منفی، روگام در هفته ۲۸ تزریق شد', 'e.g. Indirect Coombs neg, RhoGAM given at 28w')}">
          </div>
        </div>
      </div>` : ''}
    </section>

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('layers', { size: 16 })}
          <span>${tx(isEn, 'شاخص کامل مامایی (G P L D Ab | ND CS)', 'Obstetric Index (G P L D Ab | ND CS)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${idx.expandZeroIndexFields ? 'active' : ''}" id="btnObgynExpandZeroIndex">
          <span>${tx(isEn, idx.expandZeroIndexFields ? 'بستن IUFD/EP/Mole' : 'نمایش IUFD / EP / Mole', idx.expandZeroIndexFields ? 'Compact Index' : 'Expand IUFD / EP / Mole')}</span>
        </button>
      </div>

      <div class="obgyn-gpal-row">
        ${['G', 'P', 'L', 'D', 'Ab'].map((k) => `
          <div class="obgyn-index-pill">
            <label for="obIdx_${k}">${k}</label>
            <input type="number" min="0" class="input-text dir-ltr obgyn-idx-num" id="obIdx_${k}" data-idx-key="${k}" value="${idx[k] !== null && idx[k] !== undefined ? escapeHtml(idx[k]) : ''}" placeholder="—">
          </div>
        `).join('')}
        ${idx.expandZeroIndexFields || Number(idx.IUFD) > 0 || Number(idx.EP) > 0 || Number(idx.Mole) > 0 ? ['IUFD', 'EP', 'Mole'].map((k) => `
          <div class="obgyn-index-pill is-extended">
            <label for="obIdx_${k}">${k}</label>
            <input type="number" min="0" class="input-text dir-ltr obgyn-idx-num" id="obIdx_${k}" data-idx-key="${k}" value="${idx[k] !== null && idx[k] !== undefined ? escapeHtml(idx[k]) : ''}" placeholder="—">
          </div>
        `).join('') : ''}
        <div class="obgyn-index-pill is-mode">
          <label for="obIdx_ND">ND</label>
          <input type="number" min="0" class="input-text dir-ltr obgyn-idx-num" id="obIdx_ND" data-idx-key="ND" value="${idx.ND !== null && idx.ND !== undefined ? escapeHtml(idx.ND) : ''}" placeholder="—">
        </div>
        <div class="obgyn-index-pill is-mode">
          <label for="obIdx_CS">CS</label>
          <input type="number" min="0" class="input-text dir-ltr obgyn-idx-num" id="obIdx_CS" data-idx-key="CS" value="${idx.CS !== null && idx.CS !== undefined ? escapeHtml(idx.CS) : ''}" placeholder="—">
        </div>
      </div>

      ${(csCount > 0 || isObs) ? `
      <div class="obgyn-form-grid obgyn-cols-3 obgyn-mt-sm">
        ${csCount > 0 ? `
        <div class="obgyn-field is-span-2">
          <label for="obIdxCsIndications">${tx(isEn, 'علت سزارین(های) قبلی (الزامی طبق فرم بخش)', 'Prior CS Indication(s) (Mandatory)')}</label>
          <input type="text" class="input-text" id="obIdxCsIndications" value="${escapeHtml(idx.priorCsIndications || '')}" placeholder="${tx(isEn, 'مثلاً CPD / بریچ / عدم پیشرفت زایمان در ۹ سال قبل', 'e.g. CPD / Breech / Arrest of labor 4 years ago')}">
        </div>` : ''}
        ${isObs ? `
        <div class="obgyn-field">
          <label for="obIdxFetalCount">${tx(isEn, 'تعداد جنین فعلی', 'Current Fetal Count')}</label>
          <select class="input-select" id="obIdxFetalCount">
            <option value="" ${!idx.currentFetalCount ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
            <option value="1" ${Number(idx.currentFetalCount) === 1 ? 'selected' : ''}>${tx(isEn, 'تک‌قلو (Singleton)', 'Singleton (1)')}</option>
            <option value="2" ${Number(idx.currentFetalCount) === 2 ? 'selected' : ''}>${tx(isEn, 'دوقلو (Twin)', 'Twin (2)')}</option>
            <option value="3" ${Number(idx.currentFetalCount) >= 3 ? 'selected' : ''}>${tx(isEn, 'سه‌قلو و بیشتر (Higher-Order)', 'Triplet+ (3+)')}</option>
          </select>
        </div>` : ''}
        ${isObs && Number(idx.currentFetalCount || 0) > 1 ? `
        <div class="obgyn-field">
          <label for="obIdxChorionicity">${tx(isEn, 'کوریونیسیتی و آمنیونیسیتی', 'Chorionicity / Amnionicity')}</label>
          <input type="text" class="input-text dir-ltr" id="obIdxChorionicity" value="${escapeHtml(idx.chorionicity || '')}" placeholder="DCDA / MCDA / MCMA">
        </div>` : ''}
      </div>` : ''}
    </section>

    ${isObs ? `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('calendar', { size: 16 })}
          <span>${tx(isEn, 'محاسبه‌گر سه‌گانه سن بارداری (LMP + NT + آخرین سونو) و هشدار ACOG Redating', 'Triple-Anchor Gestational Age Calculator & ACOG Redating Engine')}</span>
        </div>
        <div class="obgyn-calendar-switch" role="group" aria-label="Calendar Mode">
          <button type="button" class="obgyn-cal-btn ${gd.lmpCalendar !== 'gregorian' ? 'active' : ''}" data-cal-mode="jalali">${tx(isEn, 'شمسی (Jalali)', 'Jalali (14xx)')}</button>
          <button type="button" class="obgyn-cal-btn ${gd.lmpCalendar === 'gregorian' ? 'active' : ''}" data-cal-mode="gregorian">${tx(isEn, 'میلادی (Gregorian)', 'Gregorian')}</button>
        </div>
      </div>

      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obGdLmpDate">${tx(isEn, 'تاریخ LMP (YYYY/MM/DD)', 'LMP Date (YYYY/MM/DD)')}</label>
          <input type="text" class="input-text dir-ltr" id="obGdLmpDate" value="${escapeHtml(gd.lmpDate || '')}" placeholder="${gd.lmpCalendar === 'gregorian' ? '2026-01-15' : '1404/05/10'}">
        </div>
        <div class="obgyn-field">
          <label for="obGdReliableLmp">${tx(isEn, 'اطمینان از LMP', 'LMP Reliability')}</label>
          <select class="input-select" id="obGdReliableLmp">
            <option value="true" ${gd.isReliableLmp !== false ? 'selected' : ''}>${tx(isEn, 'قطعی و منظم (Reliable)', 'Reliable / Regular')}</option>
            <option value="false" ${gd.isReliableLmp === false ? 'selected' : ''}>${tx(isEn, 'نامشخص / نامنظم (Unreliable)', 'Unreliable / Uncertain')}</option>
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obGdCycleLen">${tx(isEn, 'طول سیکل قاعدگی (روز)', 'Cycle Length (days)')}</label>
          <input type="number" min="18" max="60" class="input-text dir-ltr" id="obGdCycleLen" value="${escapeHtml(gd.cycleLengthDays ?? 28)}" placeholder="28">
        </div>
        <div class="obgyn-field">
          <label for="obGdAssessDate">${tx(isEn, 'تاریخ مرجع محاسبه (خالی = امروز)', 'Reference Date (Blank = Today)')}</label>
          <input type="text" class="input-text dir-ltr" id="obGdAssessDate" value="${escapeHtml(gd.assessmentDate || '')}" placeholder="${gd.lmpCalendar === 'gregorian' ? '2026-10-01' : '1405/01/15'}">
        </div>
      </div>

      <div class="obgyn-form-grid obgyn-cols-6 obgyn-mt-sm">
        <div class="obgyn-field is-span-2">
          <label for="obGdNtDate">${tx(isEn, 'تاریخ سونوگرافی NT / سه‌ماهه اول', '1st-Tri / NT Scan Date')}</label>
          <input type="text" class="input-text dir-ltr" id="obGdNtDate" value="${escapeHtml(gd.ntScanDate || '')}" placeholder="${gd.lmpCalendar === 'gregorian' ? '2026-04-10' : '1404/08/02'}">
        </div>
        <div class="obgyn-field">
          <label for="obGdNtW">${tx(isEn, 'سن NT (هفته)', 'NT GA (W)')}</label>
          <input type="number" min="5" max="42" class="input-text dir-ltr" id="obGdNtW" value="${escapeHtml(gd.ntGaWeeks || '')}" placeholder="12">
        </div>
        <div class="obgyn-field">
          <label for="obGdNtD">${tx(isEn, 'روز', 'Days')}</label>
          <input type="number" min="0" max="6" class="input-text dir-ltr" id="obGdNtD" value="${escapeHtml(gd.ntGaDays || '')}" placeholder="3">
        </div>
        <div class="obgyn-field">
          <label for="obGdLastDate">${tx(isEn, 'تاریخ آخرین سونو', 'Last Sono Date')}</label>
          <input type="text" class="input-text dir-ltr" id="obGdLastDate" value="${escapeHtml(gd.lastSonoDate || '')}" placeholder="${gd.lmpCalendar === 'gregorian' ? '2026-09-15' : '1405/01/05'}">
        </div>
        <div class="obgyn-field obgyn-split-num">
          <label for="obGdLastW">${tx(isEn, 'هفته / روز', 'GA (W/D)')}</label>
          <div class="obgyn-inline-pair">
            <input type="number" min="5" max="42" class="input-text dir-ltr" id="obGdLastW" value="${escapeHtml(gd.lastSonoGaWeeks || '')}" placeholder="W">
            <input type="number" min="0" max="6" class="input-text dir-ltr" id="obGdLastD" value="${escapeHtml(gd.lastSonoGaDays || '')}" placeholder="D">
          </div>
        </div>
      </div>

      <div id="obgynGaSummaryBox" class="obgyn-ga-summary-box obgyn-mt-sm">
        ${renderGaSummaryInner(gd, ga, isEn)}
      </div>
    </section>` : ''}
  `;
}

/* ================================ SPLIT-PILLS ================================ */

function renderCompactSplitGrid(items, stateMap, { type, isEn, isLockedFn = null }) {
  return `
    <div class="obgyn-split-grid">
      ${items.map((item) => {
        const entry = stateMap?.[item.id] || { state: 0, modifiers: [], detail: '' };
        const st = entry.state || 0;
        const locked = typeof isLockedFn === 'function' ? isLockedFn(item) : false;
        const hasDrawer = !locked && (st === 1 || st === -1) && type !== 'anemia';
        const modsList = (isEn && item.modifiersEn?.length) ? item.modifiersEn : (item.modifiers || []);
        const subTypes = Array.isArray(item.subTypes) ? item.subTypes : [];
        const idAttr = type === 'sym'
          ? `data-sym-id="${item.id}"`
          : type === 'anemia'
          ? `data-anemia-id="${item.id}"`
          : type === 'ros'
          ? `data-ros-id="${item.id}"`
          : type === 'genpe'
          ? `data-genpe-id="${item.id}"`
          : `data-pe-id="${item.id}"`;
        const detClass = type === 'sym'
          ? 'obgyn-sym-detail-input'
          : type === 'ros'
          ? 'obgyn-ros-detail-input'
          : type === 'genpe'
          ? 'obgyn-genpe-detail-input'
          : 'obgyn-pe-detail-input';
        const hint = (type === 'pe' || type === 'genpe')
          ? (isEn ? (item.detailHintEn || 'Detail...') : (item.detailHint || 'توضیح معاینه...'))
          : tx(isEn, 'توضیح تکمیلی، زمان و شدت...', 'Optional onset, severity, or detail...');

        return `
          <div class="obgyn-sym-cell ${st === 1 ? 'is-pos' : st === -1 ? 'is-neg' : ''} ${hasDrawer ? 'has-drawer' : ''} ${locked ? 'is-virgin-locked' : ''}">
            <div class="obgyn-split-pill ${item.redFlag ? 'has-redflag' : ''} ${st === 1 ? 'state-pos' : st === -1 ? 'state-neg' : 'state-neutral'}">
              <button type="button" class="obgyn-split-btn is-pos" ${idAttr} data-target-state="1" aria-label="Positive" ${locked ? 'disabled' : ''}>+</button>
              <span class="obgyn-split-label">
                ${escapeHtml(isEn ? item.en : item.fa)}
                ${item.redFlag ? `<span class="obgyn-flag-tag">${tx(isEn, 'هشدار', 'Red Flag')}</span>` : ''}
                ${locked ? `<span class="obgyn-flag-tag is-lock">${tx(isEn, 'قفل Virgin', 'Locked')}</span>` : ''}
              </span>
              <button type="button" class="obgyn-split-btn is-neg" ${idAttr} data-target-state="-1" aria-label="Negative" ${locked ? 'disabled' : ''}>-</button>
            </div>
            ${hasDrawer ? `
              <div class="obgyn-detail-drawer">
                <span class="obgyn-drawer-arrow" aria-hidden="true">${getIconSvg(isEn ? 'arrow-right' : 'arrow-left', { size: 13 })}</span>
                <div class="obgyn-drawer-body">
                  ${st === 1 && modsList.length > 0 ? `
                    <div class="obgyn-mod-chips">
                      ${(item.modifiers || []).map((faMod, mIdx) => {
                        const disp = isEn ? (item.modifiersEn?.[mIdx] || faMod) : faMod;
                        const isModSel = Array.isArray(entry.modifiers) && entry.modifiers.includes(faMod);
                        return `<button type="button" class="obgyn-mod-chip ${isModSel ? 'active' : ''}" data-sym-id="${item.id}" data-mod-val="${escapeHtml(faMod)}">${escapeHtml(disp)}</button>`;
                      }).join('')}
                    </div>
                  ` : ''}
                  ${st === 1 && type === 'ros' && subTypes.length > 0 ? `
                    <div class="obgyn-mod-chips">
                      ${subTypes.map((stOpt) => {
                        const isSubSel = Array.isArray(entry.subTypes) && entry.subTypes.includes(stOpt);
                        const dispSub = localizeBankText(stOpt, '', isEn);
                        return `<button type="button" class="obgyn-mod-chip ${isSubSel ? 'active' : ''}" data-ros-sub-id="${item.id}" data-ros-sub-val="${escapeHtml(stOpt)}">${escapeHtml(dispSub)}</button>`;
                      }).join('')}
                    </div>
                  ` : ''}
                  <input type="text" class="input-text ${detClass}" ${idAttr} value="${escapeHtml(entry.detail || '')}" placeholder="${escapeHtml(hint)}">
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderAnemiaClusterHtml(anemiaMap, isEn, inCard = false) {
  const allNeg = OBGYN_ANEMIA_SYMPTOMS.every((it) => anemiaMap?.[it.id]?.state === -1);
  return `
    <div class="obgyn-anemia-strip ${inCard ? 'is-embedded' : ''}">
      <div class="obgyn-anemia-head">
        <span class="obgyn-anemia-title">${getIconSvg('droplet', { size: 14 })} ${tx(isEn, 'خوشه علائم کم‌خونی (Anemia Symptoms Cluster)', 'Anemia Symptoms Cluster')}</span>
        <button type="button" class="obgyn-toggle-chip ${allNeg ? 'active is-danger' : ''}" data-anemia-neg-all="1">
          <span>${tx(isEn, 'نفی علائم کم‌خونی (−)', 'Deny Anemia Symptoms (−)')}</span>
        </button>
      </div>
      ${renderCompactSplitGrid(OBGYN_ANEMIA_SYMPTOMS, anemiaMap, { type: 'anemia', isEn })}
    </div>
  `;
}

/* =============================== TAB 2: HPI =============================== */

function renderTabHpi(state, ob, guardrails, isEn) {
  const hpi = ob.ccAndHpi || {};
  const isGyn = activeSubMode === 'gynecology';
  const archetypes = isGyn ? OBGYN_GYN_ARCHETYPES : OBGYN_OBSTETRIC_ARCHETYPES;
  const presentations = Array.isArray(hpi.presentations) ? hpi.presentations : [];
  const subKey = isGyn ? 'gynecology' : 'obstetrics';

  let symBank = OBGYN_SYMPTOM_BANK.filter((s) => s.subMode === subKey);
  if (symptomSearchQuery.trim()) {
    symBank = smartClinicalSearch(symptomSearchQuery, symBank, 40);
  } else if (!showAllSymptoms) {
    symBank = symBank.filter((s) => s.isCore || (hpi.symptoms?.[s.id]?.state === 1 || hpi.symptoms?.[s.id]?.state === -1));
  }

  const ssUnassessed = OBGYN_SS_FIVE_IDS.filter((id) => {
    const st = hpi.symptoms?.[id]?.state;
    return st !== 1 && st !== -1;
  }).length;

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'hpi')}

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('file-text', { size: 16 })}
          <span>${tx(isEn, '۱. شکایت اصلی (CC) و شرح بیماری موجز چندمشکله (Multi-Presentation HPI)', '1. Chief Complaint (CC) & Multi-Presentation HPI')}</span>
        </div>
        <span class="obgyn-safety-pill">${tx(isEn, 'ثبت‌نشده ≠ منفی', 'Not Assessed ≠ Negative')}</span>
      </div>
      <div class="obgyn-form-grid obgyn-cols-3">
        <div class="obgyn-field is-span-2">
          <label for="obHpiCc">${tx(isEn, 'شکایت اصلی بیمار (CC)', 'Chief Complaint (CC)')}</label>
          <input type="text" class="input-text" id="obHpiCc" value="${escapeHtml(hpi.ccText || state?.cc?.patientQuote || '')}" placeholder="${isGyn ? tx(isEn, 'مثلاً خونریزی شدید واژینال و درد لگن از ۳ روز قبل', 'e.g. Heavy vaginal bleeding & pelvic pain for 3 days') : tx(isEn, 'مثلاً آبریزش و انقباضات رحمی / سردرد و فشار بالا', 'e.g. ROM leakage & contractions / High BP & headache')}">
        </div>
        <div class="obgyn-field">
          <label for="obHpiDuration">${tx(isEn, 'مدت شروع تا مراجعه', 'Duration Prior to Arrival')}</label>
          <input type="text" class="input-text" id="obHpiDuration" value="${escapeHtml(hpi.duration || '')}" placeholder="${tx(isEn, 'مثلاً ۶ ساعت / ۲ هفته', 'e.g. 6 hours / 2 weeks')}">
        </div>
      </div>

      <div class="obgyn-launcher-label obgyn-mt-sm">
        ${tx(isEn, 'برای افزودن کارت شرح حال اختصاصی (امکان افزودن همزمان چند تابلوی بالینی)، کلیک کنید:', 'Click any clinical presentation below to append a structured HPI card (multiple allowed):')}
      </div>
      <div class="obgyn-archetype-grid obgyn-mt-xs">
        ${archetypes.map((arch) => {
          const addedCnt = presentations.filter((p) => p.archetypeId === arch.id).length;
          return `
            <button type="button" class="obgyn-archetype-card ${addedCnt > 0 ? 'has-added' : ''}" data-add-archetype-id="${arch.id}">
              <div class="obgyn-arch-top">
                <span class="obgyn-arch-code">${escapeHtml(arch.id)}</span>
                <strong class="obgyn-arch-title">${escapeHtml(isEn ? arch.en : arch.fa)}</strong>
                <span class="obgyn-arch-add-badge">${addedCnt > 0 ? `+ (${addedCnt})` : '+'}</span>
              </div>
              <span class="obgyn-arch-sub">${escapeHtml(isEn ? arch.subEn : arch.subFa)}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${presentations.length === 0 ? `
        <div class="obgyn-empty-hint obgyn-mt-sm">${tx(isEn, 'هیچ تظاهر بالینی (Archetype) انتخاب نشده است. روی کارت‌های بالا کلیک کنید تا فرم زمان‌بندی و جزئیات هر مشکل اضافه شود.', 'No presentation cards added yet. Click any archetype above to append structured HPI questions.')}</div>
      ` : `
        <div class="obgyn-pres-cards obgyn-mt-sm">
          ${presentations.map((pres, pIdx) => {
            const arch = archetypes.find((a) => a.id === pres.archetypeId)
              || [...OBGYN_OBSTETRIC_ARCHETYPES, ...OBGYN_GYN_ARCHETYPES].find((a) => a.id === pres.archetypeId);
            if (!arch) return '';
            const collapsed = Boolean(pres.collapsed);
            const isBleedCard = arch.id === 'OB-3' || arch.id === 'GYN-1';
            return `
              <div class="obgyn-arch-fields-box" data-pres-id="${escapeHtml(pres.id)}">
                <div class="obgyn-pres-card-head">
                  <button type="button" class="obgyn-pres-collapse-btn" data-toggle-pres-id="${escapeHtml(pres.id)}" aria-expanded="${!collapsed}">
                    ${getIconSvg(collapsed ? 'chevron-down' : 'chevron-up', { size: 15 })}
                    <span class="obgyn-arch-code">${escapeHtml(arch.id)}</span>
                    <strong>#${pIdx + 1} · ${escapeHtml(isEn ? arch.en : arch.fa)}</strong>
                  </button>
                  <button type="button" class="obgyn-icon-del" data-del-pres-id="${escapeHtml(pres.id)}" title="${tx(isEn, 'حذف این کارت', 'Remove presentation')}">${getIconSvg('x', { size: 14 })}</button>
                </div>
                ${!collapsed ? `
                  <div class="obgyn-form-grid obgyn-cols-3 obgyn-mt-sm">
                    ${(arch.fields || []).map((f) => {
                      const curVal = pres.fields?.[f.key] || '';
                      if (f.type === 'select') {
                        return `
                          <div class="obgyn-field">
                            <label>${escapeHtml(isEn ? f.en : f.fa)}</label>
                            <select class="input-select obgyn-pres-input" data-pres-id="${escapeHtml(pres.id)}" data-pres-key="${f.key}">
                              <option value="">${tx(isEn, '-- انتخاب نشده --', '-- Not assessed --')}</option>
                              ${(f.options || []).map((o) => `
                                <option value="${escapeHtml(o.val)}" ${curVal === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
                              `).join('')}
                            </select>
                          </div>
                        `;
                      }
                      return `
                        <div class="obgyn-field">
                          <label>${escapeHtml(isEn ? f.en : f.fa)}</label>
                          <input type="text" class="input-text obgyn-pres-input" data-pres-id="${escapeHtml(pres.id)}" data-pres-key="${f.key}" value="${escapeHtml(curVal)}" placeholder="${escapeHtml(isEn ? (f.phEn || '') : (f.phFa || ''))}">
                        </div>
                      `;
                    }).join('')}
                  </div>
                  ${isBleedCard ? renderAnemiaClusterHtml(hpi.anemiaSymptoms || {}, isEn, true) : ''}
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `}
    </section>

    ${!isGyn ? `
    <section class="clinical-card obgyn-ss-quickbar">
      <div class="obgyn-ss-header">
        <div class="obgyn-ss-title">
          ${getIconSvg('siren', { size: 16 })}
          <span>${tx(isEn, 'غربالگری ۵ علامت خطر پره‌اکلامپسی (Severe Signs - SS)', 'Preeclampsia 5 Severe Signs (SS) Screen')}</span>
          <span class="obgyn-ss-badge ${ssUnassessed === 0 ? 'is-clear' : 'is-pending'}">${ssUnassessed === 0 ? tx(isEn, 'تکمیل شد', 'Complete') : tx(isEn, `${ssUnassessed} مورد بررسی نشده`, `${ssUnassessed} Unassessed`)}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip" id="btnObgynAssessAllSsNeg">
          ${getIconSvg('check-circle', { size: 14 })}
          <span>${tx(isEn, 'ثبت هر ۵ علامت SS به صورت منفی', 'Mark All 5 SS Negative')}</span>
        </button>
      </div>
      <div class="obgyn-split-grid is-ss-grid">
        ${OBGYN_SS_FIVE_IDS.map((ssId) => {
          const item = OBGYN_SYMPTOM_BANK.find((s) => s.id === ssId);
          if (!item) return '';
          const st = hpi.symptoms?.[ssId]?.state || 0;
          return `
            <div class="obgyn-split-pill is-compact ${st === 1 ? 'state-pos' : st === -1 ? 'state-neg' : 'state-neutral'}" data-sym-id="${ssId}">
              <button type="button" class="obgyn-split-btn is-pos" data-sym-id="${ssId}" data-target-state="1" aria-label="Positive">+</button>
              <span class="obgyn-split-label">${escapeHtml(isEn ? item.en : item.fa)}</span>
              <button type="button" class="obgyn-split-btn is-neg" data-sym-id="${ssId}" data-target-state="-1" aria-label="Negative">-</button>
            </div>
          `;
        }).join('')}
      </div>
    </section>` : ''}

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('activity', { size: 16 })}
          <span>${tx(isEn, 'علائم همراه HPI (مثبت و منفی)', 'Associated HPI Symptoms (Split-Pills)')}</span>
        </div>
        <div class="obgyn-filter-bar">
          <div class="obgyn-search-wrap">
            ${getIconSvg('search', { size: 14 })}
            <input type="search" class="input-text obgyn-inline-search" id="obHpiSymSearch" value="${escapeHtml(symptomSearchQuery)}" placeholder="${tx(isEn, 'جستجوی علامت (فارسی/عامیانه/En)...', 'Search symptom...')}">
          </div>
          <button type="button" class="obgyn-toggle-chip ${showAllSymptoms ? 'active' : ''}" id="btnObgynToggleAllSyms">
            <span>${tx(isEn, showAllSymptoms ? 'فقط علائم کلیدی' : 'نمایش همه علائم', showAllSymptoms ? 'Core Only' : 'Show All')}</span>
          </button>
        </div>
      </div>

      ${symBank.length === 0
        ? `<div class="obgyn-empty-hint">${tx(isEn, 'موردی با این عبارت جستجو یافت نشد.', 'No matching symptoms found.')}</div>`
        : renderCompactSplitGrid(symBank, hpi.symptoms, { type: 'sym', isEn })}

      ${!presentations.some((p) => p.archetypeId === 'OB-3' || p.archetypeId === 'GYN-1')
        ? `<div class="obgyn-mt-md">${renderAnemiaClusterHtml(hpi.anemiaSymptoms || {}, isEn, false)}</div>`
        : ''}

      <div class="obgyn-field obgyn-mt-md">
        <label for="obHpiExtra">${tx(isEn, 'توضیح تکمیلی HPI (آزاد)', 'Additional Free-Text HPI Narrative')}</label>
        <textarea class="input-textarea" id="obHpiExtra" rows="2" placeholder="${tx(isEn, 'سیر مراجعه، اقدامات سرپایی قبل از بستری و جزئیات اضافی...', 'Prior ER visits, outpatient workup, or extra chronology...')}">${escapeHtml(hpi.narrativeExtra || '')}</textarea>
      </div>
    </section>
  `;
}

/* =========================== TAB 3: PMH & PSH =========================== */

function renderSharedSearchResults(kind, state, isEn) {
  const q = sharedSearchQueries[kind] || '';
  if (!q.trim()) return '';
  if (kind === 'pmh') {
    const matches = smartClinicalSearch(q, ALL_MASTER_PMH_ITEMS, 12);
    if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'موردی یافت نشد.', 'No match found.')}</div>`;
    return matches.map((it) => `
      <button type="button" class="obgyn-search-result-chip" data-add-shared-pmh="${escapeHtml(it.id)}">
        ${getIconSvg('plus', { size: 12 })}
        <span>${escapeHtml(localizeBankText(it.fa || it.label || it.name, it.en, isEn))}</span>
      </button>
    `).join('');
  }
  if (kind === 'psh') {
    const matches = smartClinicalSearch(q, MASTER_PSH_SURGERIES_BANK, 12);
    if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'موردی یافت نشد.', 'No match found.')}</div>`;
    return matches.map((it) => `
      <button type="button" class="obgyn-search-result-chip" data-add-shared-psh="${escapeHtml(it.id)}">
        ${getIconSvg('plus', { size: 12 })}
        <span>${escapeHtml(localizeBankText(it.fa || it.label || it.name, it.en, isEn))}</span>
      </button>
    `).join('');
  }
  const matches = smartClinicalSearch(q, ALL_MASTER_DRUGS, 12);
  if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'دارویی یافت نشد.', 'No drug match found.')}</div>`;
  return matches.map((it) => `
    <button type="button" class="obgyn-search-result-chip" data-add-shared-dh="${escapeHtml(it.id)}">
      ${getIconSvg('plus', { size: 12 })}
      <span>${escapeHtml(localizeBankText(it.fa || it.label || it.name, it.en, isEn))}</span>
    </button>
  `).join('');
}

function renderPohSectionHtml(poh, flags, flagDefs, isEn) {
  return `
    <div class="obgyn-comp-chips">
      ${flagDefs.map(([k, faL, enL]) => `
        <button type="button" class="obgyn-toggle-chip ${flags[k] ? 'active' : ''}" data-poh-flag="${k}">
          <span>${escapeHtml(isEn ? enL : faL)}</span>
        </button>
      `).join('')}
    </div>
    <div class="obgyn-preg-list obgyn-mt-sm">
      ${(!poh.pregnancies || poh.pregnancies.length === 0) ? `
        <div class="obgyn-empty-hint">${tx(isEn, 'بارداری قبلی ثبت نشده است (در صورت مولتی‌پار بودن روی «افزودن بارداری قبلی» کلیک کنید).', 'No prior pregnancies recorded. Click "Add Pregnancy" for multiparous history.')}</div>
      ` : poh.pregnancies.map((row, idxRow) => `
        <div class="obgyn-preg-row" data-preg-index="${idxRow}">
          <div class="obgyn-preg-badge">G${escapeHtml(row.orderNumber || idxRow + 1)}</div>
          <input type="text" class="input-text obgyn-preg-input" data-preg-index="${idxRow}" data-preg-field="yearOrChildAge" value="${escapeHtml(row.yearOrChildAge || '')}" placeholder="${tx(isEn, 'سال / سن فرزند', 'Year / Child Age')}">
          <select class="input-select obgyn-preg-input" data-preg-index="${idxRow}" data-preg-field="outcomeType">
            ${[
              ['NVD', tx(isEn, 'زایمان طبیعی (NVD)', 'NVD')],
              ['CS', tx(isEn, 'سزارین (CS)', 'CS')],
              ['Miscarriage', tx(isEn, 'سقط (Abortion)', 'Miscarriage')],
              ['EP', tx(isEn, 'حاملگی خارج‌رحمی (EP)', 'Ectopic (EP)')],
              ['IUFD', tx(isEn, 'مرده‌زایی (IUFD)', 'IUFD')],
              ['Molar', tx(isEn, 'حاملگی مولار', 'Molar')]
            ].map(([val, lbl]) => `<option value="${val}" ${row.outcomeType === val ? 'selected' : ''}>${escapeHtml(lbl)}</option>`).join('')}
          </select>
          <input type="text" class="input-text dir-ltr obgyn-preg-input" data-preg-index="${idxRow}" data-preg-field="gaAtOutcomeWeeks" value="${escapeHtml(row.gaAtOutcomeWeeks || '')}" placeholder="${tx(isEn, 'هفته (38)', 'GA (wk)')}">
          <input type="text" class="input-text dir-ltr obgyn-preg-input" data-preg-index="${idxRow}" data-preg-field="birthWeightGrams" value="${escapeHtml(row.birthWeightGrams || '')}" placeholder="${tx(isEn, 'وزن (گرم)', 'BW (g)')}">
          <input type="text" class="input-text obgyn-preg-input" data-preg-index="${idxRow}" data-preg-field="csIndicationOrLossMethod" value="${escapeHtml(row.csIndicationOrLossMethod || '')}" placeholder="${tx(isEn, 'علت سزارین / کورتاژ / عارضه', 'CS Indication / D&C / Note')}">
          <button type="button" class="obgyn-icon-del" data-del-preg="${idxRow}" title="${tx(isEn, 'حذف', 'Delete')}">${getIconSvg('trash', { size: 14 })}</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMenstrualHtml(mh, gsr, isEn) {
  return `
    <div class="obgyn-form-grid obgyn-cols-4">
      <div class="obgyn-field">
        <label for="obMhMenarche">${tx(isEn, 'سن منارک (اولین قاعدگی)', 'Menarche Age')}</label>
        <input type="number" class="input-text dir-ltr" id="obMhMenarche" value="${escapeHtml(mh.menarcheAge || '')}" placeholder="13">
      </div>
      <div class="obgyn-field">
        <label for="obMhLmp">${tx(isEn, 'تاریخ LMP (قاعدگی)', 'LMP Date')}</label>
        <input type="text" class="input-text dir-ltr" id="obMhLmp" value="${escapeHtml(mh.lmpDate || '')}" placeholder="1405/01/05">
      </div>
      <div class="obgyn-field">
        <label for="obMhReg">${tx(isEn, 'نظم سیکل', 'Cycle Regularity')}</label>
        <select class="input-select" id="obMhReg">
          <option value="" ${!mh.regularity ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          <option value="regular" ${mh.regularity === 'regular' ? 'selected' : ''}>${tx(isEn, 'منظم', 'Regular')}</option>
          <option value="irregular" ${mh.regularity === 'irregular' ? 'selected' : ''}>${tx(isEn, 'نامنظم', 'Irregular')}</option>
        </select>
      </div>
      <div class="obgyn-field">
        <label for="obMhInterval">${tx(isEn, 'فاصله سیکل / طول خونریزی (روز)', 'Interval / Duration (d)')}</label>
        <div class="obgyn-inline-pair">
          <input type="text" class="input-text dir-ltr" id="obMhInterval" value="${escapeHtml(mh.cycleIntervalDays || '')}" placeholder="28">
          <input type="text" class="input-text dir-ltr" id="obMhDuration" value="${escapeHtml(mh.bleedingDurationDays || '')}" placeholder="5">
        </div>
      </div>

      <div class="obgyn-field">
        <label for="obMhFlow">${tx(isEn, 'حجم خونریزی (جدا از لخته)', 'Bleeding Volume (Independent)')}</label>
        <select class="input-select" id="obMhFlow">
          <option value="" ${!mh.flowVolume ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          ${OBGYN_BLEED_VOLUME_OPTIONS.map((o) => `
            <option value="${o.val}" ${mh.flowVolume === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
          `).join('')}
        </select>
      </div>
      <div class="obgyn-field">
        <label for="obMhClots">${tx(isEn, 'وضعیت دفع لخته (Clots)', 'Clot Passage')}</label>
        <select class="input-select" id="obMhClots">
          <option value="" ${!mh.clotStatus ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          ${OBGYN_CLOT_OPTIONS.map((o) => `
            <option value="${o.val}" ${mh.clotStatus === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
          `).join('')}
        </select>
      </div>
      <div class="obgyn-field">
        <label for="obMhPads">${tx(isEn, 'تعداد پد در روز', 'Pads / Day')}</label>
        <input type="text" class="input-text dir-ltr" id="obMhPads" value="${escapeHtml(mh.padsPerDay || '')}" placeholder="3">
      </div>
      <div class="obgyn-field">
        <label for="obMhDys">${tx(isEn, 'دیسمنوره (درد قاعدگی)', 'Dysmenorrhea')}</label>
        <select class="input-select" id="obMhDys">
          <option value="" ${!mh.dysmenorrhea ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          <option value="none" ${mh.dysmenorrhea === 'none' ? 'selected' : ''}>${tx(isEn, 'ندارد', 'None')}</option>
          <option value="mild" ${mh.dysmenorrhea === 'mild' ? 'selected' : ''}>${tx(isEn, 'خفیف', 'Mild')}</option>
          <option value="moderate" ${mh.dysmenorrhea === 'moderate' ? 'selected' : ''}>${tx(isEn, 'متوسط', 'Moderate')}</option>
          <option value="severe" ${mh.dysmenorrhea === 'severe' ? 'selected' : ''}>${tx(isEn, 'شدید', 'Severe')}</option>
        </select>
      </div>
      <div class="obgyn-field is-span-2">
        <label for="obScrContra">${tx(isEn, 'روش پیشگیری فعلی از بارداری', 'Current Contraception Method')}</label>
        <select class="input-select" id="obScrContra">
          <option value="" ${!gsr.contraception?.currentMethod ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          ${OBGYN_CONTRACEPTION_OPTIONS.map((o) => `
            <option value="${o.val}" ${gsr.contraception?.currentMethod === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
          `).join('')}
        </select>
      </div>
      <div class="obgyn-field is-span-2">
        <label for="obScrContraPrior">${tx(isEn, 'روش‌های پیشگیری قبلی / عوارض', 'Prior Contraception / Side Effects')}</label>
        <input type="text" class="input-text" id="obScrContraPrior" value="${escapeHtml(gsr.contraception?.priorMethodsAndSideEffects || '')}" placeholder="${tx(isEn, 'توضیح اختیاری...', 'Optional note...')}">
      </div>
    </div>

    <div class="obgyn-comp-chips obgyn-mt-sm">
      ${[
        ['floodingOrNightChange', 'Flooding / تعویض شبانه پد', 'Flooding / Nocturnal Pads'],
        ['imb', 'خونریزی بین‌قاعدگی (IMB)', 'Intermenstrual (IMB)'],
        ['pcb', 'خونریزی پس از نزدیکی (PCB)', 'Postcoital (PCB)'],
        ['isPostmenopausal', 'یائسه (Postmenopausal)', 'Postmenopausal'],
        ['hrtUse', 'مصرف هورمون / HRT', 'Prior HRT Use']
      ].map(([k, faL, enL]) => `
        <button type="button" class="obgyn-toggle-chip ${mh[k] ? 'active' : ''}" data-mh-flag="${k}">
          <span>${escapeHtml(isEn ? enL : faL)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderTabPmhPsh(state, ob, isEn) {
  const pmhSel = collectSelectedPmhItems(state);
  const pshList = Array.isArray(state?.psh?.surgeries) ? state.psh.surgeries : [];
  const poh = ob.pastObstetricHistory || { priorComplicationFlags: {}, pregnancies: [] };
  const flags = poh.priorComplicationFlags || {};
  const mh = ob.menstrualHistory || {};
  const gsr = ob.gynScreeningAndRecords || {};
  const isObs = activeSubMode !== 'gynecology';

  const flagDefs = [
    ['priorIugr', 'محدودیت رشد (IUGR)', 'Prior IUGR/FGR'],
    ['priorPreeclampsia', 'پره‌اکلامپسی / اکلامپسی', 'Prior Preeclampsia'],
    ['priorPph', 'خونریزی پس از زایمان (PPH)', 'Prior PPH'],
    ['priorPretermLabor', 'زایمان زودرس', 'Prior Preterm Labor'],
    ['priorGdm', 'دیابت بارداری (GDM)', 'Prior GDM'],
    ['priorPlacentaAccretaOrPrevia', 'جفت پرویا / آکرتا', 'Previa / Accreta'],
    ['priorShoulderDystociaOrMacrosomia', 'دیستوشی شانه / ماکروزومی', 'Shoulder Dystocia'],
    ['priorNicuOrAnomaly', 'بستری NICU / آنومالی', 'NICU / Anomaly']
  ];

  const quickPsh = [
    ...OBGYN_PSH_DELTA.filter((x) => ['psh_cs', 'psh_dnc', 'psh_ivf_opu_et', 'psh_iui', 'psh_gyn_laparoscopy', 'psh_myomectomy', 'psh_tah_bso', 'psh_cerclage', 'psh_ovarian_cystectomy'].includes(x.id))
  ];

  return `
    <!-- PMHx -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('shield', { size: 16 })}
          <span>${tx(isEn, '۳-۱. سوابق بیماری‌های زمینه‌ای (PMHx)', '3.1 Past Medical History (PMHx)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${state?.pmh?.masterRoutineNegative ? 'active is-danger' : ''}" id="btnObgynPmhNeg">
          <span>${tx(isEn, 'سابقه بیماری زمینه‌ای ندارد (−)', 'No Chronic PMHx (−)')}</span>
        </button>
      </div>
      <div class="obgyn-search-wrap">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obSharedPmhSearch" value="${escapeHtml(sharedSearchQueries.pmh)}" placeholder="${tx(isEn, 'جستجوی فازی بیماری (دیابت، فشار خون، کم‌کاری تیروئید، PCOS، آندومتریوز...)', 'Search PMH (DM, HTN, Hypothyroidism, PCOS, Endometriosis...)')}">
      </div>
      <div id="obSharedPmhResults" class="obgyn-comp-chips obgyn-mt-xs">${renderSharedSearchResults('pmh', state, isEn)}</div>
      <div class="obgyn-comp-chips obgyn-mt-xs">
        ${OBGYN_PMH_DELTA.slice(0, 8).map((it) => {
          const selected = pmhSel.some((p) => p.id === it.id && p.state === 1);
          return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-pmh="${escapeHtml(it.id)}">${escapeHtml(isEn ? it.en : it.fa)}</button>`;
        }).join('')}
      </div>
      ${pmhSel.length > 0 ? `
        <div class="obgyn-selected-list obgyn-mt-sm">
          ${pmhSel.map((item) => `
            <div class="obgyn-selected-row">
              <strong>${escapeHtml(localizeBankText(item.label || item.fa, item.en, isEn))}</strong>
              <input type="text" class="input-text obgyn-shared-pmh-det" data-pmh-cat="${escapeHtml(item.catId)}" data-pmh-id="${escapeHtml(item.id)}" value="${escapeHtml(item.detail || '')}" placeholder="${tx(isEn, 'توضیح / سال تشخیص...', 'Detail / year...')}">
              <button type="button" class="obgyn-icon-del" data-del-shared-pmh="${escapeHtml(item.id)}" data-pmh-cat="${escapeHtml(item.catId)}">${getIconSvg('x', { size: 13 })}</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>

    <!-- PSHx (with IVF, IUI, Laparoscopy + inline anesthesia/surgical note) -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('scalpel', { size: 16 })}
          <span>${tx(isEn, '۳-۲. سوابق جراحی و پروسیجرها (PSHx — شامل IVF / IUI / لاپاراسکوپی)', '3.2 Past Surgical & Procedure History (PSHx)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${state?.psh?.noSurgeries ? 'active is-danger' : ''}" id="btnObgynPshNeg">
          <span>${tx(isEn, 'سابقه جراحی ندارد (−)', 'No Prior Surgeries (−)')}</span>
        </button>
      </div>
      <div class="obgyn-search-wrap">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obSharedPshSearch" value="${escapeHtml(sharedSearchQueries.psh)}" placeholder="${tx(isEn, 'جستجوی جراحی یا پروسیجر (سزارین، IVF، IUI، لاپاراسکوپی، کورتاژ، میومکتومی...)', 'Search surgery/procedure (CS, IVF, IUI, Laparoscopy, D&C...)')}">
      </div>
      <div id="obSharedPshResults" class="obgyn-comp-chips obgyn-mt-xs">${renderSharedSearchResults('psh', state, isEn)}</div>
      <div class="obgyn-comp-chips obgyn-mt-xs">
        ${quickPsh.map((it) => {
          const selected = pshList.some((s) => s.id === it.id);
          return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-psh="${escapeHtml(it.id)}">${escapeHtml(isEn ? it.en : it.fa)}</button>`;
        }).join('')}
      </div>
      ${pshList.length > 0 ? `
        <div class="obgyn-selected-list obgyn-mt-sm">
          ${pshList.map((s, sIdx) => `
            <div class="obgyn-selected-row is-psh">
              <strong>${escapeHtml(localizeBankText(s.label || s.procedure, s.en, isEn))}</strong>
              <input type="text" class="input-text dir-ltr obgyn-shared-psh-inp" data-psh-idx="${sIdx}" data-psh-fld="year" value="${escapeHtml(s.year || '')}" placeholder="${tx(isEn, 'سال', 'Year')}">
              <input type="text" class="input-text obgyn-shared-psh-inp" data-psh-idx="${sIdx}" data-psh-fld="note" value="${escapeHtml(s.note || '')}" placeholder="${tx(isEn, 'نوع بیهوشی / عارضه / توضیح', 'Anesthesia / complication / note')}">
              <button type="button" class="obgyn-icon-del" data-del-shared-psh="${sIdx}">${getIconSvg('trash', { size: 13 })}</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>

    <!-- SubMode-tailored POH & Menstrual History -->
    ${isObs ? `
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('list-checks', { size: 16 })}
            <span>${tx(isEn, 'سوابق بارداری‌های قبلی (POH) و عوارض مامایی', 'Prior Obstetric History (POH) & Complications')}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddPregnancy">
            ${getIconSvg('plus', { size: 14 })}
            <span>${tx(isEn, 'افزودن بارداری قبلی', 'Add Pregnancy')}</span>
          </button>
        </div>
        ${renderPohSectionHtml(poh, flags, flagDefs, isEn)}
      </section>

      <section class="clinical-card obgyn-pe-accordion ${obsMenstrualExpanded ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" id="btnToggleObsMenstrualAcc" aria-expanded="${obsMenstrualExpanded}">
            ${getIconSvg(obsMenstrualExpanded ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, 'سوابق قاعدگی قبل از بارداری و پیشگیری (اختیاری)', 'Prior Menstrual & Contraception History (Optional)')}</strong>
          </button>
        </div>
        ${obsMenstrualExpanded ? `<div class="obgyn-pe-acc-body">${renderMenstrualHtml(mh, gsr, isEn)}</div>` : ''}
      </section>
    ` : `
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('calendar', { size: 16 })}
            <span>${tx(isEn, 'سوابق قاعدگی، یائسگی و پیشگیری از بارداری', 'Menstrual History & Contraception')}</span>
          </div>
        </div>
        ${renderMenstrualHtml(mh, gsr, isEn)}
      </section>

      <section class="clinical-card obgyn-pe-accordion ${gynPohExpanded ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" id="btnToggleGynPohAcc" aria-expanded="${gynPohExpanded}">
            ${getIconSvg(gynPohExpanded ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, 'جدول بارداری‌های قبلی (در صورت سابقه بارداری)', 'Prior Pregnancies Table (Optional)')}</strong>
            <span class="obgyn-pe-count">${poh.pregnancies?.length || 0}</span>
          </button>
          ${gynPohExpanded ? `
            <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddPregnancy">
              ${getIconSvg('plus', { size: 14 })}
              <span>${tx(isEn, 'افزودن بارداری قبلی', 'Add Pregnancy')}</span>
            </button>
          ` : ''}
        </div>
        ${gynPohExpanded ? `<div class="obgyn-pe-acc-body">${renderPohSectionHtml(poh, flags, flagDefs, isEn)}</div>` : ''}
      </section>
    `}
  `;
}

/* =========================== TAB 4: DH / AH / SH / FH =========================== */

function renderTabDhAhShFh(state, ob, isEn) {
  const dhList = Array.isArray(state?.dh?.activeDrugs) ? state.dh.activeDrugs : [];
  const customDrugs = Array.isArray(state?.dh?.customDrugs) ? state.dh.customDrugs : [];
  const ahSel = Array.isArray(state?.ah?.selected) ? state.ah.selected : [];
  const quickDrugs = OBGYN_MEDICATIONS_DELTA.slice(0, 10);

  return `
    <!-- 1. Drug Hx -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('pill', { size: 16 })}
          <span>${tx(isEn, '۴-۱. داروهای مصرفی (Drug Hx — جستجوی برندهای ایرانی و نام ژنریک)', '4.1 Medication History (Drug Hx)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${state?.dh?.noRoutineMeds ? 'active is-danger' : ''}" id="btnObgynDhNeg">
          <span>${tx(isEn, 'داروی مصرفی ندارد (−)', 'No Routine Meds (−)')}</span>
        </button>
      </div>
      <div class="obgyn-search-wrap">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obSharedDhSearch" value="${escapeHtml(sharedSearchQueries.dh)}" placeholder="${tx(isEn, 'جستجوی فازی دارو (متورال، متیلدوپا، کلگزان، آ اس آ، لوزار، ففول، دوفاستون، سایکلوژست...)', 'Search drug (Metoral, Methyldopa, Clexane, ASA, Losar, Fefol, Duphaston...)')}">
      </div>
      <div id="obSharedDhResults" class="obgyn-comp-chips obgyn-mt-xs">${renderSharedSearchResults('dh', state, isEn)}</div>
      <div class="obgyn-comp-chips obgyn-mt-xs">
        ${quickDrugs.map((dr) => {
          const selected = dhList.some((x) => x.id === dr.id);
          return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-dh="${escapeHtml(dr.id)}">${escapeHtml(isEn ? dr.en : dr.fa)}</button>`;
        }).join('')}
      </div>
      <div class="obgyn-inline-add-row obgyn-mt-sm">
        <input type="text" class="input-text" id="obCustomDrugInput" placeholder="${tx(isEn, 'نام داروی آزاد یا مکمل دلخواه...', 'Add custom medication or supplement...')}">
        <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddCustomDrug">
          ${getIconSvg('plus', { size: 13 })}
          <span>${tx(isEn, 'افزودن دارو', 'Add Custom Drug')}</span>
        </button>
      </div>

      ${(dhList.length > 0 || customDrugs.length > 0) ? `
        <div class="obgyn-selected-list obgyn-mt-sm">
          ${dhList.map((dr, dIdx) => `
            <div class="obgyn-selected-row is-dh">
              <strong>${escapeHtml(localizeBankText(dr.name || dr.label, dr.en, isEn))}</strong>
              <input type="text" class="input-text dir-ltr obgyn-shared-dh-inp" data-dh-kind="active" data-dh-idx="${dIdx}" data-dh-fld="dose" value="${escapeHtml(dr.dose || '')}" placeholder="${tx(isEn, 'دوز (مثلاً 50mg)', 'Dose')}">
              <select class="input-select obgyn-shared-dh-inp" data-dh-kind="active" data-dh-idx="${dIdx}" data-dh-fld="sig">
                ${DH_SIG_OPTIONS.map((opt) => `<option value="${escapeHtml(opt)}" ${dr.sig === opt ? 'selected' : ''}>${escapeHtml(localizeBankText(opt, '', isEn))}</option>`).join('')}
              </select>
              <button type="button" class="obgyn-icon-del" data-del-shared-dh="${dIdx}" data-dh-kind="active">${getIconSvg('trash', { size: 13 })}</button>
            </div>
          `).join('')}
          ${customDrugs.map((dr, cIdx) => `
            <div class="obgyn-selected-row is-dh">
              <strong>${escapeHtml(localizeBankText(dr.name || dr.label || '', dr.en, isEn))}</strong>
              <input type="text" class="input-text dir-ltr obgyn-shared-dh-inp" data-dh-kind="custom" data-dh-idx="${cIdx}" data-dh-fld="dose" value="${escapeHtml(dr.dose || '')}" placeholder="${tx(isEn, 'دوز', 'Dose')}">
              <select class="input-select obgyn-shared-dh-inp" data-dh-kind="custom" data-dh-idx="${cIdx}" data-dh-fld="sig">
                ${DH_SIG_OPTIONS.map((opt) => `<option value="${escapeHtml(opt)}" ${dr.sig === opt ? 'selected' : ''}>${escapeHtml(localizeBankText(opt, '', isEn))}</option>`).join('')}
              </select>
              <button type="button" class="obgyn-icon-del" data-del-shared-dh="${cIdx}" data-dh-kind="custom">${getIconSvg('trash', { size: 13 })}</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>

    <!-- 2. Multi-Allergy Row Builder (AH) -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('alert-triangle', { size: 16 })}
          <span>${tx(isEn, '۴-۲. سوابق حساسیت‌ها با ثبت واکنش مجزا برای هر آلرژن (AH)', '4.2 Multi-Allergy Builder with Per-Allergen Reactions (AH)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${state?.ah?.nkda && ahSel.length === 0 ? 'active is-danger' : ''}" id="btnObgynAhNkda">
          <span>${tx(isEn, 'حساسیت دارویی ندارد (NKDA)', 'No Known Drug Allergies (NKDA)')}</span>
        </button>
      </div>

      <div class="obgyn-comp-chips">
        ${OBGYN_QUICK_ALLERGENS.map((alg) => {
          const exists = ahSel.some((x) => x.id === alg.id || x.label === alg.fa || x.en === alg.en);
          return `
            <button type="button" class="obgyn-toggle-chip ${exists ? 'active' : ''}" data-add-allergen-preset="${escapeHtml(alg.id)}">
              ${getIconSvg(exists ? 'check' : 'plus', { size: 12 })}
              <span>${escapeHtml(isEn ? alg.en : alg.fa)}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="obgyn-inline-add-row obgyn-mt-sm">
        <input type="text" class="input-text" id="obCustomAllergenInput" placeholder="${tx(isEn, 'نام ماده حساسیت‌زا (مثلاً ایبوپروفن، تخم‌مرغ، متوکلروپرامید...)', 'Custom allergen name (e.g. Ibuprofen, Shellfish...)')}">
        <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddCustomAllergen">
          ${getIconSvg('plus', { size: 13 })}
          <span>${tx(isEn, 'افزودن آلرژی', 'Add Allergy')}</span>
        </button>
      </div>

      ${ahSel.length === 0 ? `
        <div class="obgyn-empty-hint obgyn-mt-sm">${state?.ah?.nkda ? tx(isEn, 'وضعیت بیمار به صورت «فاقد حساسیت (NKDA)» ثبت شده است.', 'Patient allergy status recorded as NKDA.') : tx(isEn, 'حساسیتی ثبت نشده است. برای NKDA دکمه بالا را بزنید یا یک یا چند آلرژن اضافه کنید.', 'No allergens added. Click NKDA above or select/add an allergen row.')}</div>
      ` : `
        <div class="obgyn-allergy-rows obgyn-mt-sm">
          ${ahSel.map((alg, aIdx) => {
            const obj = alg && typeof alg === 'object' ? alg : { id: `alg_${aIdx}`, label: String(alg), reactions: [], detail: '' };
            const curRx = Array.isArray(obj.reactions) ? obj.reactions : [];
            const displayLbl = isEn ? (obj.en || obj.label || '') : (obj.label || obj.en || '');
            return `
              <div class="obgyn-allergy-row" data-allergy-idx="${aIdx}">
                <div class="obgyn-allergy-row-head">
                  <strong class="obgyn-allergy-name">${escapeHtml(displayLbl)}</strong>
                  <button type="button" class="obgyn-icon-del" data-del-allergy-idx="${aIdx}" title="${tx(isEn, 'حذف آلرژی', 'Remove allergen')}">${getIconSvg('x', { size: 14 })}</button>
                </div>
                <div class="obgyn-reaction-chips">
                  ${OBGYN_ALLERGY_REACTIONS.map((rx) => {
                    const active = curRx.includes(rx.id) || curRx.includes(rx.fa) || curRx.includes(rx.en);
                    return `
                      <button type="button" class="obgyn-reaction-chip ${active ? 'active' : ''}" data-allergy-idx="${aIdx}" data-rx-id="${escapeHtml(rx.id)}">
                        <span>${escapeHtml(isEn ? rx.en : rx.fa)}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
                <input type="text" class="input-text obgyn-allergy-detail-inp" data-allergy-idx="${aIdx}" value="${escapeHtml(obj.detail || '')}" placeholder="${tx(isEn, 'توضیح تکمیلی واکنش (شدت، زمان یا درمان)...', 'Additional reaction detail...')}">
              </div>
            `;
          }).join('')}
        </div>
      `}
    </section>

    <!-- 3. Social & Family History (SH & FH) -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('user', { size: 16 })}
          <span>${tx(isEn, '۴-۳. عادات فردی (SH) و سابقه فامیلی (FH)', '4.3 Social History (SH) & Family History (FH)')}</span>
        </div>
      </div>
      <div class="obgyn-comp-chips">
        <button type="button" class="obgyn-toggle-chip ${state?.sh?.negSmoking ? 'active is-danger' : ''}" data-sh-toggle="negSmoking">${tx(isEn, 'عدم مصرف سیگار (−)', 'Non-Smoker (−)')}</button>
        <button type="button" class="obgyn-toggle-chip ${state?.sh?.negOpium ? 'active is-danger' : ''}" data-sh-toggle="negOpium">${tx(isEn, 'عدم مصرف مخدر (−)', 'No Opium (−)')}</button>
        <button type="button" class="obgyn-toggle-chip ${state?.sh?.negAlcohol ? 'active is-danger' : ''}" data-sh-toggle="negAlcohol">${tx(isEn, 'عدم مصرف الکل (−)', 'No Alcohol (−)')}</button>
        <button type="button" class="obgyn-toggle-chip ${state?.fh?.negFamilyHistory ? 'active is-danger' : ''}" id="btnObgynFhNeg">${tx(isEn, 'سابقه فامیلی منفی (−)', 'Negative Family Hx (−)')}</button>
      </div>
      <div class="obgyn-form-grid obgyn-cols-2 obgyn-mt-sm">
        <div class="obgyn-field">
          <label for="obSharedShNote">${tx(isEn, 'توضیح عادات / شغل / قلیان / سیگار', 'Social Habits / Occupation Note')}</label>
          <input type="text" class="input-text" id="obSharedShNote" value="${escapeHtml(state?.sh?.note || '')}" placeholder="${tx(isEn, 'شغل، مصرف سیگار/قلیان/مخدر...', 'Occupation or habit details...')}">
        </div>
        <div class="obgyn-field">
          <label for="obSharedFhNote">${tx(isEn, 'سابقه فامیلی (سرطان پستان/تخمدان/رحم، دیابت، HTN، ترومبوفیلی)', 'Family Hx (BRCA, Ovarian/Endometrial Ca, DM, HTN, VTE...)')}</label>
          <input type="text" class="input-text" id="obSharedFhNote" value="${escapeHtml(state?.fh?.note || '')}" placeholder="${tx(isEn, 'مادر: دیابت و پرفشاری خون...', 'Mother: DM, HTN...')}">
        </div>
      </div>
    </section>
  `;
}

/* ================================ TAB 5: ROS ================================ */

function getNonMaleRosGroups() {
  return (ROS_GROUPS_BILINGUAL || [])
    .filter((g) => g.systemKey !== 'male_reproductive')
    .map((g) => ({
      ...g,
      items: (g.items || []).filter((it) => it.gender !== 'male')
    }))
    .filter((g) => g.items.length > 0);
}

function renderTabRos(state, ob, isEn) {
  const rosItems = state?.ros?.items || {};
  const groups = getNonMaleRosGroups();
  const allSearchable = groups.flatMap((g) => g.items);
  const query = rosSearchQuery.trim();
  const searchHits = query ? smartClinicalSearch(query, allSearchable, 36) : [];

  return `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('list-checks', { size: 16 })}
          <span>${tx(isEn, '۵. مرور کامل سیستم‌ها از نوک مو تا نوک پا (ROS)', '5. Complete Head-to-Toe Review of Systems (ROS)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip" id="btnObgynRosNegRemaining">
          ${getIconSvg('check-circle', { size: 14 })}
          <span>${tx(isEn, 'ثبت منفی سیستم‌های باقی‌مانده (−)', 'Mark Unassessed ROS Items Negative (−)')}</span>
        </button>
      </div>

      <div class="obgyn-search-wrap">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obRosSearchInput" value="${escapeHtml(rosSearchQuery)}" placeholder="${tx(isEn, 'جستجوی فازی علامت در کل ROS (تنگی نفس، تپش قلب، سوزش ادرار، سردرد، یبوست...)', 'Fuzzy search all 13 ROS systems (dyspnea, palpitations, dysuria, headache...)')}">
      </div>

      ${query ? `
        <div class="obgyn-mt-sm">
          <div class="obgyn-launcher-label">${tx(isEn, `نتایج جستجو (${searchHits.length}):`, `Search results (${searchHits.length}):`)}</div>
          ${searchHits.length === 0
            ? `<div class="obgyn-empty-hint obgyn-mt-xs">${tx(isEn, 'علامتی یافت نشد.', 'No matching ROS symptom.')}</div>`
            : `<div class="obgyn-mt-xs">${renderCompactSplitGrid(searchHits, rosItems, { type: 'ros', isEn })}</div>`
          }
        </div>
      ` : ''}

      <div class="obgyn-mt-sm">
        ${renderAnemiaClusterHtml(ob.ccAndHpi?.anemiaSymptoms || {}, isEn, false)}
      </div>
    </section>

    <div class="obgyn-pe-accordions">
      ${groups.map((grp) => {
        const isOpen = expandedRosSystems.has(grp.systemKey);
        let posCnt = 0;
        let negCnt = 0;
        grp.items.forEach((it) => {
          const st = rosItems[it.id]?.state;
          if (st === 1) posCnt += 1;
          else if (st === -1) negCnt += 1;
        });
        return `
          <div class="clinical-card obgyn-sys-accordion ${isOpen ? 'is-open' : ''}">
            <div class="obgyn-sys-acc-head">
              <button type="button" class="obgyn-pe-acc-toggle" data-ros-sys-toggle="${escapeHtml(grp.systemKey)}" aria-expanded="${isOpen}">
                ${getIconSvg(isOpen ? 'chevron-up' : 'chevron-down', { size: 15 })}
                <strong>${escapeHtml(isEn ? grp.en : stripTitleNoise(grp.group))}</strong>
                <span class="obgyn-sys-counters">
                  <span class="obgyn-sys-badge-pos ${posCnt > 0 ? 'has-val' : ''}">+${posCnt}</span>
                  <span class="obgyn-sys-badge-neg ${negCnt > 0 ? 'has-val' : ''}">-${negCnt}</span>
                  <span class="obgyn-pe-count">${posCnt + negCnt}/${grp.items.length}</span>
                </span>
              </button>
              <button type="button" class="obgyn-normal-sec-btn" data-ros-sys-neg="${escapeHtml(grp.systemKey)}">
                ${getIconSvg('minus', { size: 13 })}
                <span>${tx(isEn, 'ثبت منفی این سیستم (−)', 'Mark System Negative (−)')}</span>
              </button>
            </div>
            ${isOpen ? `
              <div class="obgyn-pe-acc-body">
                ${renderCompactSplitGrid(grp.items, rosItems, { type: 'ros', isEn })}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* =============================== TAB 6: PE =============================== */

function selectHtml(id, label, listKey, curVal, isEn, disabled = false, cls = 'obgyn-pe-opt-inp', dataAttrs = '') {
  const opts = OBGYN_PE_OPTIONS[listKey] || [];
  return `
    <div class="obgyn-field">
      <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
      <select class="input-select ${cls}" id="${escapeHtml(id)}" ${dataAttrs} ${disabled ? 'disabled' : ''}>
        <option value="" ${!curVal ? 'selected' : ''}>${tx(isEn, '—', '—')}</option>
        ${opts.map((o) => `<option value="${escapeHtml(o.val)}" ${curVal === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderTabPe(state, ob, guardrails, isEn) {
  const v = ob.pe?.vitals || {};
  const om = ob.pe?.obsMeasurements || {};
  const ge = ob.pe?.gynExam || {};
  const genFindings = state?.pe?.findings || {};
  const isGyn = activeSubMode === 'gynecology';
  const bishop = calculateBishopScore(om);

  const generalPillars = (PE_MANDATORY_PILLARS || []).filter((p) => OBGYN_GENERAL_PE_SYSTEM_KEYS.includes(p.systemKey));
  const allGenItems = generalPillars.flatMap((p) => p.items || []);
  const genQuery = generalPeSearchQuery.trim();
  const genHits = genQuery ? smartClinicalSearch(genQuery, allGenItems, 30) : [];

  const dilationBtns = [
    ['0', tx(isEn, 'Closed', 'Closed')],
    ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => [n, `${n}cm`])
  ];
  const effacementBtns = ['0', '20', '30', '40', '50', '60', '70', '80', '90', '100'].map((n) => [n, `${n}%`]);

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'pe')}

    <!-- Block A: Vital Signs -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('activity', { size: 16 })}
          <span>${tx(isEn, '۶-A. علائم حیاتی (Vital Signs)', '6.A Bedside Vital Signs')}</span>
        </div>
      </div>
      <div class="obgyn-form-grid ${isGyn ? 'obgyn-cols-5' : 'obgyn-cols-6'}">
        <div class="obgyn-field">
          <label for="obPeBp">BP (mmHg)</label>
          <input type="text" class="input-text dir-ltr" id="obPeBp" value="${escapeHtml(v.bp || '')}" placeholder="120/80">
        </div>
        ${!isGyn ? `
        <div class="obgyn-field">
          <label for="obPeBpRep">${tx(isEn, 'تکرار BP', 'Repeat BP')}</label>
          <input type="text" class="input-text dir-ltr" id="obPeBpRep" value="${escapeHtml(v.bpRepeat || '')}" placeholder="140/90">
        </div>` : ''}
        <div class="obgyn-field">
          <label for="obPePr">PR (bpm)</label>
          <input type="text" class="input-text dir-ltr" id="obPePr" value="${escapeHtml(v.pr || '')}" placeholder="84">
        </div>
        <div class="obgyn-field">
          <label for="obPeRr">RR (/min)</label>
          <input type="text" class="input-text dir-ltr" id="obPeRr" value="${escapeHtml(v.rr || '')}" placeholder="18">
        </div>
        <div class="obgyn-field">
          <label for="obPeTemp">T (°C)</label>
          <input type="text" class="input-text dir-ltr" id="obPeTemp" value="${escapeHtml(v.temp || '')}" placeholder="36.8">
        </div>
        <div class="obgyn-field">
          <label for="obPeSpo2">SpO2 (%)</label>
          <input type="text" class="input-text dir-ltr" id="obPeSpo2" value="${escapeHtml(v.spo2 || '')}" placeholder="98%">
        </div>
        ${!isGyn ? `
        <div class="obgyn-field">
          <label for="obPeDipstick">Urine Dipstick</label>
          <select class="input-select dir-ltr" id="obPeDipstick">
            <option value="">—</option>
            ${['Negative', 'Trace', '+1', '+2', '+3', '+4'].map((op) => `<option value="${op}" ${v.urineDipstick === op ? 'selected' : ''}>${op}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>
    </section>

    <!-- Block B: Strict SubMode Specialized Exam -->
    ${!isGyn ? `
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('stethoscope', { size: 16 })}
            <span>${tx(isEn, '۶-B۱. معاینه شکم حاملگی، مانورهای لئوپولد، FHR و انقباضات', '6.B1 Gravid Abdomen, Leopold Maneuvers, FHR & Contractions')}</span>
          </div>
          <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="obsAbdomen">
            ${getIconSvg('check-circle', { size: 13 })}
            <span>${tx(isEn, 'ثبت معاینه شکم طبیعی', 'Normal Gravid Abdomen')}</span>
          </button>
        </div>

        <div class="obgyn-form-grid obgyn-cols-4">
          <div class="obgyn-field">
            <label for="obPeFh">${tx(isEn, 'ارتفاع فوندوس FH (cm)', 'Fundal Height (cm)')}</label>
            <input type="text" class="input-text dir-ltr obgyn-obs-inp" id="obPeFh" data-obs-key="fundalHeightCm" value="${escapeHtml(om.fundalHeightCm || '')}" placeholder="34">
          </div>
          <div class="obgyn-field">
            <label for="obPeFhWeek">${tx(isEn, 'ارتفاع فوندوس معادل (هفته)', 'FH Corresponds To (weeks)')}</label>
            <input type="text" class="input-text dir-ltr obgyn-obs-inp" id="obPeFhWeek" data-obs-key="fundalHeightWeek" value="${escapeHtml(om.fundalHeightWeek || '')}" placeholder="34">
          </div>
          ${selectHtml('obPeScarStatus', tx(isEn, 'اسکار سزارین / جراحی', 'Surgical / CS Scar'), 'scarStatus', om.scarStatus, isEn, false, 'obgyn-obs-inp', 'data-obs-key="scarStatus"')}
          ${selectHtml('obPeScarTend', tx(isEn, 'تندرنس محل اسکار', 'Scar Tenderness'), 'scarTenderness', om.scarTenderness, isEn, false, 'obgyn-obs-inp', 'data-obs-key="scarTenderness"')}

          ${selectHtml('obPeLeoLie', tx(isEn, 'لئوپولد ۱/۲: قرار (Lie)', 'Leopold: Lie'), 'leopoldLie', om.leopoldLie, isEn, false, 'obgyn-obs-inp', 'data-obs-key="leopoldLie"')}
          ${selectHtml('obPeLeoPres', tx(isEn, 'لئوپولد ۳: عضو پرزانته', 'Leopold: Presentation'), 'leopoldPresentation', om.leopoldPresentation, isEn, false, 'obgyn-obs-inp', 'data-obs-key="leopoldPresentation"')}
          ${selectHtml('obPeLeoBack', tx(isEn, 'لئوپولد ۲: جهت پشت جنین', 'Leopold: Fetal Back'), 'leopoldBack', om.leopoldBack, isEn, false, 'obgyn-obs-inp', 'data-obs-key="leopoldBack"')}
          ${selectHtml('obPeLeoEng', tx(isEn, 'لئوپولد ۴: انگاژمان', 'Leopold: Engagement'), 'leopoldEngagement', om.leopoldEngagement, isEn, false, 'obgyn-obs-inp', 'data-obs-key="leopoldEngagement"')}

          <div class="obgyn-field">
            <label for="obPeFhr">FHR (bpm)</label>
            <input type="text" class="input-text dir-ltr obgyn-obs-inp" id="obPeFhr" data-obs-key="fhr" value="${escapeHtml(om.fhr || '')}" placeholder="142">
          </div>
          <div class="obgyn-field">
            <label for="obPeFhrQuad">${tx(isEn, 'کوادران سمع FHR', 'FHR Quadrant')}</label>
            <select class="input-select dir-ltr obgyn-obs-inp" id="obPeFhrQuad" data-obs-key="fhrQuadrant">
              <option value="">—</option>
              ${['LLQ', 'RLQ', 'LUQ', 'RUQ', 'Midline'].map((q) => `<option value="${q}" ${om.fhrQuadrant === q ? 'selected' : ''}>${q}</option>`).join('')}
            </select>
          </div>
          ${selectHtml('obPeFhrReg', tx(isEn, 'نظم FHR', 'FHR Rhythm'), 'fhrRegularity', om.fhrRegularity, isEn, false, 'obgyn-obs-inp', 'data-obs-key="fhrRegularity"')}
          ${selectHtml('obPeEpigTend', tx(isEn, 'تندرنس اپیگاستر / RUQ', 'Epigastric / RUQ Tenderness'), 'epigastricRuqTenderness', om.epigastricRuqTenderness, isEn, false, 'obgyn-obs-inp', 'data-obs-key="epigastricRuqTenderness"')}

          <div class="obgyn-field">
            <label for="obPeCtxFreq">${tx(isEn, 'فواصل انقباضات', 'Contraction Frequency')}</label>
            <input type="text" class="input-text obgyn-obs-inp" id="obPeCtxFreq" data-obs-key="contractionsFreq" value="${escapeHtml(om.contractionsFreq || '')}" placeholder="${tx(isEn, 'مثلاً ۴ در ۱۰ دقیقه', 'e.g. Q3-4 min')}">
          </div>
          <div class="obgyn-field">
            <label for="obPeCtxDur">${tx(isEn, 'مدت انقباضات', 'Contraction Duration')}</label>
            <input type="text" class="input-text obgyn-obs-inp" id="obPeCtxDur" data-obs-key="contractionsDuration" value="${escapeHtml(om.contractionsDuration || '')}" placeholder="${tx(isEn, 'مثلاً ۴۵ ثانیه', 'e.g. 45 sec')}">
          </div>
          ${selectHtml('obPeCtxInt', tx(isEn, 'شدت انقباضات', 'Contraction Intensity'), 'contractionsIntensity', om.contractionsIntensity, isEn, false, 'obgyn-obs-inp', 'data-obs-key="contractionsIntensity"')}
          ${selectHtml('obPeUtTone', tx(isEn, 'تون پایه رحم بین انقباضات', 'Resting Uterine Tone'), 'uterineTone', om.uterineTone, isEn, false, 'obgyn-obs-inp', 'data-obs-key="uterineTone"')}
        </div>
      </section>

      <!-- Obstetric TV + Tactile Pills + ROM + 4-Point Pelvimetry -->
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('target', { size: 16 })}
            <span>${tx(isEn, '۶-B۲. معاینه واژینال (TV)، تست‌های ROM و پلویمتری ۴ نقطه‌ای', '6.B2 Obstetric TV Exam, ROM Tests & 4-Point Pelvimetry')}</span>
          </div>
          <span id="obgynBishopBadge" class="obgyn-bishop-badge is-${bishop.status}">
            ${escapeHtml(bishop.assessedCount > 0 ? (isEn ? bishop.labelEn : bishop.labelFa) : tx(isEn, 'Bishop Score: معیارها را وارد کنید', 'Bishop Score: Enter TV params'))}
          </span>
        </div>

        <div class="obgyn-tv-box ${guardrails.virginLock ? 'is-locked' : guardrails.previaTvContraindicated ? 'is-previa-warn' : ''}">
          <div class="obgyn-tactile-row">
            <span class="obgyn-tactile-label">${tx(isEn, 'دیلاتاسیون سرویکس:', 'Dilation:')}</span>
            <div class="obgyn-tactile-pills">
              ${dilationBtns.map(([val, lbl]) => `
                <button type="button" class="obgyn-tactile-btn ${String(om.dilationCm ?? '') === val ? 'active' : ''}" data-tactile-key="dilationCm" data-tactile-val="${val}" ${guardrails.virginLock ? 'disabled' : ''}>${escapeHtml(lbl)}</button>
              `).join('')}
            </div>
          </div>

          <div class="obgyn-tactile-row obgyn-mt-xs">
            <span class="obgyn-tactile-label">${tx(isEn, 'افاسمان سرویکس:', 'Effacement:')}</span>
            <div class="obgyn-tactile-pills">
              ${effacementBtns.map(([val, lbl]) => `
                <button type="button" class="obgyn-tactile-btn ${String(om.effacementPct ?? '') === val ? 'active' : ''}" data-tactile-key="effacementPct" data-tactile-val="${val}" ${guardrails.virginLock ? 'disabled' : ''}>${escapeHtml(lbl)}</button>
              `).join('')}
            </div>
          </div>

          <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-sm">
            <div class="obgyn-field">
              <label for="obPeStation">${tx(isEn, 'Station و مقیاس', 'Station & Scale')}</label>
              <div class="obgyn-inline-pair">
                <select class="input-select dir-ltr obgyn-obs-inp" id="obPeStationScale" data-obs-key="stationScale" ${guardrails.virginLock ? 'disabled' : ''}>
                  <option value="5" ${om.stationScale !== '3' ? 'selected' : ''}>-5..+5 [UNI]</option>
                  <option value="3" ${om.stationScale === '3' ? 'selected' : ''}>-3..+3 [REF]</option>
                </select>
                <input type="text" class="input-text dir-ltr obgyn-obs-inp" id="obPeStation" data-obs-key="stationValue" value="${escapeHtml(om.stationValue ?? '')}" placeholder="-2" ${guardrails.virginLock ? 'disabled' : ''}>
              </div>
            </div>
            ${selectHtml('obPeCons', tx(isEn, 'قوام سرویکس', 'Cervix Consistency'), 'cervixConsistency', om.cervixConsistency, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="cervixConsistency"')}
            ${selectHtml('obPePos', tx(isEn, 'موقعیت سرویکس', 'Cervix Position'), 'cervixPosition', om.cervixPosition, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="cervixPosition"')}
            ${selectHtml('obPePres', tx(isEn, 'عضو پرزانته', 'Presenting Part'), 'presentingPart', om.presentingPart, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="presentingPart"')}

            ${selectHtml('obPePresPos', tx(isEn, 'پوزیشن پرزانتاسیون (OA/OP...)', 'Presenting Position'), 'presentingPosition', om.presentingPosition, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="presentingPosition"')}
            ${selectHtml('obPeMembranes', tx(isEn, 'وضعیت پرده‌ها', 'Membranes'), 'membranesStatus', om.membranesStatus, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="membranesStatus"')}
            ${selectHtml('obPeFluidChar', tx(isEn, 'مشخصات مایع آمنیوتیک', 'Amniotic Fluid'), 'amnioticFluidChar', om.amnioticFluidChar, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="amnioticFluidChar"')}
          </div>

          <div class="obgyn-subbox-label obgyn-mt-sm">${tx(isEn, 'تست‌های بالینی پارگی کیسه آب (Bedside ROM Tests)', 'Bedside ROM Tests')}</div>
          <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-xs">
            ${selectHtml('obRomPool', 'Pooling Test', 'romTest', om.romPooling, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="romPooling"')}
            ${selectHtml('obRomNit', 'Nitrazine pH', 'romTest', om.romNitrazine, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="romNitrazine"')}
            ${selectHtml('obRomFern', 'Fern Test', 'romTest', om.romFern, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="romFern"')}
            ${selectHtml('obRomAmni', 'AmniSure (PAMG-1)', 'romTest', om.romAmnisure, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="romAmnisure"')}
          </div>

          <div class="obgyn-subbox-label obgyn-mt-sm">${tx(isEn, 'پلویمتری بالینی ۴ نقطه‌ای (Clinical Pelvimetry)', '4-Point Clinical Pelvimetry')}</div>
          <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-xs">
            ${selectHtml('obPelvProm', tx(isEn, 'پرومونتوار ساکروم', 'Sacral Promontory'), 'pelvimetryPromontory', om.pelvimetryPromontory, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="pelvimetryPromontory"')}
            ${selectHtml('obPelvSpin', tx(isEn, 'خارهای ایسکیال', 'Ischial Spines'), 'pelvimetrySpines', om.pelvimetrySpines, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="pelvimetrySpines"')}
            ${selectHtml('obPelvArch', tx(isEn, 'قوس ساب‌پوبیک', 'Subpubic Arch'), 'pelvimetryArch', om.pelvimetryArch, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="pelvimetryArch"')}
            ${selectHtml('obPelvOverall', tx(isEn, 'ارزیابی کلی لگن', 'Overall Pelvic Adequacy'), 'pelvimetryOverall', om.pelvimetryOverall, isEn, guardrails.virginLock, 'obgyn-obs-inp', 'data-obs-key="pelvimetryOverall"')}
          </div>
        </div>
      </section>

      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('zap', { size: 16 })}
            <span>${tx(isEn, '۶-B۳. اندام‌ها، ادم و رفلکس‌های تاندونی عمقی (Edema & DTR)', '6.B3 Extremities, Edema & DTR / Clonus')}</span>
          </div>
          <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="obsExtremities">
            ${getIconSvg('check-circle', { size: 13 })}
            <span>${tx(isEn, 'ثبت طبیعی (DTR +2، بدون ادم)', 'Record Normal (DTR +2, No Edema)')}</span>
          </button>
        </div>
        <div class="obgyn-form-grid obgyn-cols-5">
          ${selectHtml('obExtEdema', tx(isEn, 'شدت ادم (0 تا +4)', 'Edema Grade'), 'grade04', om.edemaGrade, isEn, false, 'obgyn-obs-inp', 'data-obs-key="edemaGrade"')}
          ${selectHtml('obExtEdLoc', tx(isEn, 'محل ادم', 'Edema Location'), 'edemaLocation', om.edemaLocation, isEn, false, 'obgyn-obs-inp', 'data-obs-key="edemaLocation"')}
          ${selectHtml('obExtCalf', tx(isEn, 'تندرنس ساق / واریس', 'Calf Tenderness / Varicosities'), 'calfTendernessVaricosities', om.calfTendernessVaricosities, isEn, false, 'obgyn-obs-inp', 'data-obs-key="calfTendernessVaricosities"')}
          ${selectHtml('obExtDtr', tx(isEn, 'رفلکس پاتلار DTR', 'Patellar DTR'), 'grade04', om.dtrGrade, isEn, false, 'obgyn-obs-inp', 'data-obs-key="dtrGrade"')}
          ${selectHtml('obExtClonus', tx(isEn, 'کلونوس مچ پا', 'Ankle Clonus'), 'ankleClonus', om.ankleClonus, isEn, false, 'obgyn-obs-inp', 'data-obs-key="ankleClonus"')}
        </div>
      </section>
    ` : `
      <!-- Deep Gynecology Specialized PE -->
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('stethoscope', { size: 16 })}
            <span>${tx(isEn, '۶-B۱. معاینه پستان‌ها و آگزیلا', '6.B1 Breast & Axillary Exam')}</span>
          </div>
          <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="gynBreast">
            ${getIconSvg('check-circle', { size: 13 })}
            <span>${tx(isEn, 'ثبت معاینه پستان طبیعی', 'Normal Breast Exam')}</span>
          </button>
        </div>
        <div class="obgyn-form-grid obgyn-cols-4">
          ${selectHtml('gynBrSym', tx(isEn, 'تقارن پستان‌ها', 'Symmetry'), 'breastSymmetry', ge.breast?.symmetry, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="breast" data-gyn-key="symmetry"')}
          ${selectHtml('gynBrMass', tx(isEn, 'توده قابل لمس', 'Palpable Mass'), 'breastMass', ge.breast?.mass, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="breast" data-gyn-key="mass"')}
          ${selectHtml('gynBrDis', tx(isEn, 'ترشح نوک پستان', 'Nipple Discharge'), 'breastDischarge', ge.breast?.discharge, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="breast" data-gyn-key="discharge"')}
          ${selectHtml('gynBrAx', tx(isEn, 'لنفادنوپاتی آگزیلاری', 'Axillary LAD'), 'axillaryLad', ge.breast?.axillaryLad, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="breast" data-gyn-key="axillaryLad"')}
        </div>
      </section>

      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('target', { size: 16 })}
            <span>${tx(isEn, '۶-B۲. معاینه کامل شکم ژنیکولوژی', '6.B2 Gynecologic Abdominal Exam')}</span>
          </div>
          <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="gynAbdomen">
            ${getIconSvg('check-circle', { size: 13 })}
            <span>${tx(isEn, 'ثبت معاینه شکم طبیعی', 'Normal Abdomen Exam')}</span>
          </button>
        </div>
        <div class="obgyn-form-grid obgyn-cols-5">
          <div class="obgyn-field">
            <label for="gynAbdScars">${tx(isEn, 'اسکارهای جراحی', 'Surgical Scars')}</label>
            <input type="text" class="input-text obgyn-gyn-inp" id="gynAbdScars" data-gyn-sec="abdomen" data-gyn-key="scars" value="${escapeHtml(ge.abdomen?.scars || '')}" placeholder="${tx(isEn, 'فانن‌اشتیل / تروکار / ندارد', 'Pfannenstiel / None')}">
          </div>
          ${selectHtml('gynAbdTend', tx(isEn, 'تندرنس شکمی', 'Quadrant Tenderness'), 'tendernessQuadrant', ge.abdomen?.tendernessQuadrant, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="abdomen" data-gyn-key="tendernessQuadrant"')}
          ${selectHtml('gynAbdReb', tx(isEn, 'ریباند و گاردینگ', 'Rebound / Guarding'), 'reboundGuarding', ge.abdomen?.reboundGuarding, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="abdomen" data-gyn-key="reboundGuarding"')}
          <div class="obgyn-field">
            <label for="gynAbdMass">${tx(isEn, 'توده قابل لمس (اندازه / تحرک)', 'Palpable Mass (Size/Mobility)')}</label>
            <input type="text" class="input-text obgyn-gyn-inp" id="gynAbdMass" data-gyn-sec="abdomen" data-gyn-key="palpableMass" value="${escapeHtml(ge.abdomen?.palpableMass || '')}" placeholder="${tx(isEn, 'ندارد / توده سوپراپوبیک...', 'None / 14w firm mass...')}">
          </div>
          ${selectHtml('gynAbdCva', 'CVA Tenderness', 'cvaTenderness', ge.abdomen?.cvaTenderness, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="abdomen" data-gyn-key="cvaTenderness"')}
        </div>
      </section>

      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('shield', { size: 16 })}
            <span>${tx(isEn, '۶-B۳. ژنیتالیای خارجی، پرولاپس، اسپکولوم و معاینه دودستی لگن', '6.B3 External Genitalia, Speculum & Deep Bimanual Pelvic Suite')}</span>
          </div>
        </div>

        <div class="obgyn-subbox-head">
          <strong>${tx(isEn, 'ژنیتالیای خارجی و پرولاپس', 'External Genitalia & Prolapse')}</strong>
          <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="gynExternal">
            ${getIconSvg('check-circle', { size: 12 })}
            <span>${tx(isEn, 'ثبت طبیعی', 'Normal')}</span>
          </button>
        </div>
        <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-xs">
          ${selectHtml('gynExtVulva', tx(isEn, 'ولو و پرینه', 'Vulva & Perineum'), 'vulvaPerineum', ge.externalGenitalia?.vulvaPerineum, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="externalGenitalia" data-gyn-key="vulvaPerineum"')}
          ${selectHtml('gynExtBarth', tx(isEn, 'غدد بارتولن و اسکین', 'Bartholin & Skene'), 'bartholinSkene', ge.externalGenitalia?.bartholinSkene, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="externalGenitalia" data-gyn-key="bartholinSkene"')}
          ${selectHtml('gynExtProl', tx(isEn, 'پرولاپس (گرید)', 'Pelvic Organ Prolapse'), 'prolapse', ge.externalGenitalia?.prolapse, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="externalGenitalia" data-gyn-key="prolapse"')}
          ${selectHtml('gynExtCough', tx(isEn, 'تست استرس سرفه (SUI)', 'Cough Stress Test'), 'coughStressTest', ge.externalGenitalia?.coughStressTest, isEn, false, 'obgyn-gyn-inp', 'data-gyn-sec="externalGenitalia" data-gyn-key="coughStressTest"')}
        </div>

        <div class="obgyn-tv-box ${guardrails.virginLock ? 'is-locked' : ''} obgyn-mt-md">
          <div class="obgyn-subbox-head">
            <strong>${tx(isEn, 'معاینه ۴ نقطه‌ای با اسپکولوم', '4-Checkpoint Speculum Exam')}</strong>
            ${!guardrails.virginLock ? `
              <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="gynSpeculum">
                ${getIconSvg('check-circle', { size: 12 })}
                <span>${tx(isEn, 'ثبت اسپکولوم طبیعی', 'Normal Speculum')}</span>
              </button>
            ` : `<span class="obgyn-flag-tag is-lock">${tx(isEn, 'قفل Virgin', 'Virgin Locked')}</span>`}
          </div>
          <div class="obgyn-form-grid obgyn-cols-5 obgyn-mt-xs">
            ${selectHtml('gynSpWall', tx(isEn, 'دیواره‌های واژن', 'Vaginal Walls'), 'vaginalWalls', ge.speculum?.vaginalWalls, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="speculum" data-gyn-key="vaginalWalls"')}
            ${selectHtml('gynSpCvx', tx(isEn, 'ظاهر سرویکس', 'Cervix Appearance'), 'cervixAppearance', ge.speculum?.cervixAppearance, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="speculum" data-gyn-key="cervixAppearance"')}
            ${selectHtml('gynSpVb', tx(isEn, 'شدت خونریزی واژینال (VB)', 'VB Volume'), 'vbVolume', ge.speculum?.vbVolume, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="speculum" data-gyn-key="vbVolume"')}
            ${selectHtml('gynSpClots', tx(isEn, 'دفع لخته در اسپکولوم', 'Clots on Speculum'), 'vbClots', ge.speculum?.vbClots, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="speculum" data-gyn-key="vbClots"')}
            ${selectHtml('gynSpDis', tx(isEn, 'ترشحات واژینال / سرویسیت', 'Discharge'), 'dischargeChar', ge.speculum?.dischargeChar, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="speculum" data-gyn-key="dischargeChar"')}
          </div>

          <div class="obgyn-subbox-head obgyn-mt-md">
            <strong>${tx(isEn, 'معاینه دودستی لگن و رکتوواژینال (Bimanual / Rectovaginal)', 'Deep Bimanual & Rectovaginal Exam')}</strong>
            ${!guardrails.virginLock ? `
              <button type="button" class="obgyn-normal-sec-btn" data-pe-preset="gynBimanual">
                ${getIconSvg('check-circle', { size: 12 })}
                <span>${tx(isEn, 'ثبت Bimanual طبیعی', 'Normal Bimanual')}</span>
              </button>
            ` : ''}
          </div>
          <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-xs">
            ${selectHtml('gynBmSize', tx(isEn, 'اندازه رحم (معادل هفته)', 'Uterus Size (Weeks)'), 'uterusSizeWeeks', ge.bimanual?.uterusSizeWeeks, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusSizeWeeks"')}
            ${selectHtml('gynBmCont', tx(isEn, 'کانتور / سطح رحم', 'Uterus Contour'), 'uterusContour', ge.bimanual?.uterusContour, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusContour"')}
            ${selectHtml('gynBmCons', tx(isEn, 'قوام رحم', 'Uterus Consistency'), 'uterusConsistency', ge.bimanual?.uterusConsistency, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusConsistency"')}
            ${selectHtml('gynBmPos', tx(isEn, 'وضعیت رحم (AV/RV/Mid)', 'Uterus Position'), 'uterusPosition', ge.bimanual?.uterusPosition, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusPosition"')}

            ${selectHtml('gynBmMob', tx(isEn, 'تحرک رحم', 'Uterus Mobility'), 'uterusMobility', ge.bimanual?.uterusMobility, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusMobility"')}
            ${selectHtml('gynBmTend', tx(isEn, 'تندرنس رحم', 'Uterine Tenderness'), 'uterusTenderness', ge.bimanual?.uterusTenderness, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="uterusTenderness"')}
            ${selectHtml('gynBmCvxC', tx(isEn, 'قوام سرویکس', 'Cervix Consistency'), 'cervixConsistencyGyn', ge.bimanual?.cervixConsistency, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="cervixConsistency"')}
            ${selectHtml('gynBmCvxM', tx(isEn, 'تحرک سرویکس', 'Cervix Mobility'), 'cervixMobility', ge.bimanual?.cervixMobility, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="cervixMobility"')}

            ${selectHtml('gynBmCmt', 'CMT', 'cmt', ge.bimanual?.cmt, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="cmt"')}
            ${selectHtml('gynBmRAdx', tx(isEn, 'آدنکس راست (Right Adnexa)', 'Right Adnexa'), 'adnexa', ge.bimanual?.rightAdnexa, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="rightAdnexa"')}
            ${selectHtml('gynBmLAdx', tx(isEn, 'آدنکس چپ (Left Adnexa)', 'Left Adnexa'), 'adnexa', ge.bimanual?.leftAdnexa, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="leftAdnexa"')}
            ${selectHtml('gynBmCul', tx(isEn, 'بن‌بست خلفی (Cul-de-sac)', 'Posterior Cul-de-sac'), 'culDeSac', ge.bimanual?.culDeSac, isEn, guardrails.virginLock, 'obgyn-gyn-inp', 'data-gyn-sec="bimanual" data-gyn-key="culDeSac"')}
          </div>
          <div class="obgyn-field obgyn-mt-xs">
            <label for="gynBmNote">${tx(isEn, 'توضیح تکمیلی معاینه دودستی (مثلاً ابعاد توده آدنکس)', 'Additional Bimanual / Adnexal Mass Detail')}</label>
            <input type="text" class="input-text obgyn-gyn-inp" id="gynBmNote" data-gyn-sec="bimanual" data-gyn-key="note" value="${escapeHtml(ge.bimanual?.note || '')}" placeholder="${tx(isEn, 'مثلاً توده ۵ سانتی‌متری تندر در آدنکس چپ...', 'e.g. Tender 5cm left adnexal mass...')}" ${guardrails.virginLock ? 'disabled' : ''}>
          </div>
        </div>
      </section>
    `}

    <!-- Block C: Complete Head-to-Toe General PE (from MASTER_PE_BANK) -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('user', { size: 16 })}
          <span>${tx(isEn, '۶-C. معاینه فیزیکی عمومی سر تا پا (General Head-to-Toe PE)', '6.C Head-to-Toe General Physical Examination')}</span>
        </div>
      </div>
      <div class="obgyn-search-wrap">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obGenPeSearchInput" value="${escapeHtml(generalPeSearchQuery)}" placeholder="${tx(isEn, 'جستجوی علامت در معاینه عمومی (رنگ‌پریدگی ملتحمه، سوفل، کراکل ریه، تیروئید، DTR...)', 'Search general PE findings (conjunctival pallor, murmur, crackles, thyroid, GCS...)')}">
      </div>
      ${genQuery ? `
        <div class="obgyn-mt-sm">
          ${genHits.length === 0
            ? `<div class="obgyn-empty-hint">${tx(isEn, 'موردی یافت نشد.', 'No matching general PE item.')}</div>`
            : renderCompactSplitGrid(genHits, genFindings, { type: 'genpe', isEn })
          }
        </div>
      ` : ''}
    </section>

    <div class="obgyn-pe-accordions">
      ${generalPillars.map((pillar) => {
        const isOpen = expandedGenPeSystems.has(pillar.systemKey);
        let posCnt = 0;
        let negCnt = 0;
        (pillar.items || []).forEach((it) => {
          const st = genFindings[it.id]?.state;
          if (st === 1) posCnt += 1;
          else if (st === -1) negCnt += 1;
        });
        const titleTxt = isEn ? pillar.en : stripTitleNoise(pillar.title);
        return `
          <div class="clinical-card obgyn-sys-accordion ${isOpen ? 'is-open' : ''}">
            <div class="obgyn-sys-acc-head">
              <button type="button" class="obgyn-pe-acc-toggle" data-genpe-sys-toggle="${escapeHtml(pillar.systemKey)}" aria-expanded="${isOpen}">
                ${getIconSvg(isOpen ? 'chevron-up' : 'chevron-down', { size: 15 })}
                <strong>${escapeHtml(titleTxt)}</strong>
                <span class="obgyn-sys-counters">
                  <span class="obgyn-sys-badge-pos ${posCnt > 0 ? 'has-val' : ''}">+${posCnt}</span>
                  <span class="obgyn-sys-badge-neg ${negCnt > 0 ? 'has-val' : ''}">-${negCnt}</span>
                  <span class="obgyn-pe-count">${posCnt + negCnt}/${pillar.items.length}</span>
                </span>
              </button>
              <button type="button" class="obgyn-normal-sec-btn" data-genpe-sys-normal="${escapeHtml(pillar.systemKey)}">
                ${getIconSvg('check-circle', { size: 13 })}
                <span>${tx(isEn, 'ثبت معاینه نرمال این بخش', 'Record Normal Exam')}</span>
              </button>
            </div>
            ${isOpen ? `
              <div class="obgyn-pe-acc-body">
                ${renderCompactSplitGrid(pillar.items, genFindings, { type: 'genpe', isEn })}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* =========================== TAB 7: PARACLINICS =========================== */

function renderStudyCardHtml(study, isEn) {
  const def = OBGYN_PARACLINIC_STUDY_TYPES.find((t) => t.id === study.type);
  if (!def) return '';
  const f = study.fields || {};
  let nichdHtml = '';
  if (study.type === 'nst_efm') {
    const hasTrace = hasVal(f.baselineBpm) && hasVal(f.variability);
    const nichd = evaluateNichdCategory({
      baselineBpm: f.baselineBpm,
      variability: f.variability,
      decelerations: { type: f.decelType || 'None', isRecurrent: f.decelRecurrent === 'yes', variablePathologicalFlags: {}, cordCompressionPatternVariant: 'None' }
    });
    const cls = nichd.category === 'Category III' ? 'cat3' : nichd.category === 'Category I' ? 'cat1' : 'cat2';
    nichdHtml = `<span class="obgyn-nichd-badge is-${cls}">${escapeHtml(hasTrace ? (isEn ? nichd.labelEn : nichd.labelFa) : tx(isEn, 'NICHD: پارامترها را وارد کنید', 'NICHD: Enter trace'))}</span>`;
  }
  return `
    <div class="obgyn-study-card" data-study-id="${escapeHtml(study.id)}">
      <div class="obgyn-study-head">
        <div class="obgyn-study-title-wrap">
          <strong>${escapeHtml(isEn ? def.en : def.fa)}</strong>
          ${nichdHtml}
        </div>
        <button type="button" class="obgyn-icon-del" data-del-study-id="${escapeHtml(study.id)}" title="${tx(isEn, 'حذف گزارش', 'Remove study')}">${getIconSvg('trash', { size: 14 })}</button>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-xs">
        <div class="obgyn-field">
          <label>${tx(isEn, 'تاریخ / ساعت مطالعه', 'Date / Time')}</label>
          <input type="text" class="input-text dir-ltr obgyn-study-date-inp" data-study-id="${escapeHtml(study.id)}" value="${escapeHtml(study.date || '')}" placeholder="1405/01/15">
        </div>
        ${(def.fields || []).map((fd) => {
          const cur = f[fd.key] || '';
          if (fd.type === 'select') {
            return `
              <div class="obgyn-field">
                <label>${escapeHtml(isEn ? fd.en : fd.fa)}</label>
                <select class="input-select obgyn-study-fld-inp" data-study-id="${escapeHtml(study.id)}" data-study-fld="${escapeHtml(fd.key)}">
                  <option value="" ${!cur ? 'selected' : ''}>—</option>
                  ${(fd.options || []).map((o) => `<option value="${escapeHtml(o.val)}" ${cur === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>`).join('')}
                </select>
              </div>
            `;
          }
          return `
            <div class="obgyn-field">
              <label>${escapeHtml(isEn ? fd.en : fd.fa)}</label>
              <input type="text" class="input-text obgyn-study-fld-inp" data-study-id="${escapeHtml(study.id)}" data-study-fld="${escapeHtml(fd.key)}" value="${escapeHtml(cur)}">
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTabParaclinics(state, ob, guardrails, isEn) {
  const kl = ob.paraclinics?.keyLabs || {};
  const extraLabs = Array.isArray(ob.paraclinics?.extraLabs) ? ob.paraclinics.extraLabs : [];
  const studies = Array.isArray(ob.paraclinics?.studies) ? ob.paraclinics.studies : [];
  const isGyn = activeSubMode === 'gynecology';

  const obsLabRows = [
    ['hb', 'Hb (g/dL)', '11.4', false],
    ['wbc', 'WBC (/mm3)', '11200', false],
    ['plt', 'Plt (/mm3)', '145000', false],
    ['urinePrCr', 'Urine Pr/Cr', '0.45', false],
    ['ast', 'AST (U/L)', '42', false],
    ['alt', 'ALT (U/L)', '38', false],
    ['ldh', 'LDH (U/L)', '390', false],
    ['cr', 'Cr (mg/dL)', '0.8', false],
    ['ogtt75', 'OGTT 75g', '90/155/130', false],
    ['viralMarkers', tx(isEn, 'مارکرهای ویروسی', 'Viral Markers'), 'HBsAg(-)/HIV(-)', false],
    ['indirectCoombs', 'Indirect Coombs', 'Negative', false],
    ['gbs', 'GBS Swab (35-37w)', 'Negative', false]
  ];
  const gynLabRows = [
    ['bhcg', 'β-hCG (IU/L)', '<5 / 2450', guardrails.bhcgMandatory],
    ['hb', 'Hb / MCV', '9.8 / 74', false],
    ['wbc', 'WBC (/mm3)', '8500', false],
    ['plt', 'Plt (/mm3)', '240000', false],
    ['tsh', 'TSH (mIU/L)', '2.3', false],
    ['ptInr', 'PT / PTT / INR', '12.5 / 30 / 1.0', false],
    ['ca125', 'CA-125 (U/mL)', '22', false],
    ['prolactin', 'Prolactin (ng/mL)', '18', false],
    ['fshLh', 'FSH / LH', '6.2 / 5.4', false],
    ['cr', 'Cr (mg/dL)', '0.7', false]
  ];
  const activeLabRows = isGyn ? gynLabRows : obsLabRows;
  const labSearchHits = labSearchQuery.trim() ? smartClinicalSearch(labSearchQuery, MASTER_ALL_LAB_TESTS, 12) : [];

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'paraclinics')}

    <!-- Section A: Labs + Shared 200+ Lab Search -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('test-tube', { size: 16 })}
          <span>${tx(isEn, '۷-A. آزمایشات منتخب زنان/مامایی و جستجوی ۲۰۰+ آزمایش هسته مشترک', '7.A Quick Ob/Gyn Labs & 200+ Shared Lab Search')}</span>
        </div>
      </div>

      <div class="obgyn-form-grid obgyn-cols-6">
        ${activeLabRows.map(([k, lbl, ph, highlight]) => `
          <div class="obgyn-field ${highlight ? 'is-bhcg-mandatory' : ''}">
            <label for="obKl_${k}">${escapeHtml(lbl)}</label>
            <input type="text" class="input-text dir-ltr obgyn-kl-input" id="obKl_${k}" data-kl-key="${k}" value="${escapeHtml(kl[k] || '')}" placeholder="${ph}">
          </div>
        `).join('')}
      </div>

      <div class="obgyn-search-wrap obgyn-mt-md">
        ${getIconSvg('search', { size: 14 })}
        <input type="search" class="input-text obgyn-inline-search" id="obLabSearchInput" value="${escapeHtml(labSearchQuery)}" placeholder="${tx(isEn, 'افزودن آزمایش دیگر از ۲۰۰+ تست هسته مشترک (Fibrinogen, Ferritin, AMH, D-Dimer, Potassium...)...', 'Search 200+ shared labs (Fibrinogen, Ferritin, AMH, D-Dimer, Potassium...)')}">
      </div>
      ${labSearchHits.length > 0 ? `
        <div class="obgyn-comp-chips obgyn-mt-xs">
          ${labSearchHits.map((t) => `
            <button type="button" class="obgyn-search-result-chip" data-add-extra-lab="${escapeHtml(t.id)}">
              ${getIconSvg('plus', { size: 12 })}
              <span>${escapeHtml(localizeBankText(t.label || t.fa, t.en, isEn))}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}

      ${extraLabs.length > 0 ? `
        <div class="obgyn-selected-list obgyn-mt-sm">
          ${extraLabs.map((row, idx) => `
            <div class="obgyn-selected-row">
              <strong>${escapeHtml(localizeBankText(row.label, row.en, isEn))}${row.unit ? ` <small>(${escapeHtml(row.unit)})</small>` : ''}</strong>
              <input type="text" class="input-text dir-ltr obgyn-extra-lab-inp" data-extra-lab-idx="${idx}" value="${escapeHtml(row.value || '')}" placeholder="${tx(isEn, 'مقدار...', 'Result...')}">
              <button type="button" class="obgyn-icon-del" data-del-extra-lab="${idx}">${getIconSvg('x', { size: 13 })}</button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="obgyn-field obgyn-mt-sm">
        <label for="obKlNote">${tx(isEn, 'توضیحات آزمایشات و کراس‌مچ', 'Additional Lab / Crossmatch Notes')}</label>
        <input type="text" class="input-text" id="obKlNote" value="${escapeHtml(ob.paraclinics?.keyLabsNote || '')}" placeholder="${tx(isEn, 'کراس‌مچ ۲ واحد گلبول فشرده، نتایج تکمیلی...', 'Crossmatched 2u pRBC, coagulation profile...')}">
      </div>
    </section>

    <!-- Section B: On-Demand Diagnostic Study Launcher (Zero Blank Forms Until Clicked) -->
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('ultrasound', { size: 16 })}
          <span>${tx(isEn, '۷-B. افزودن گزارش سونوگرافی، NST، پاپ‌اسمیر، ماموگرافی و پاتولوژی (انتخابی)', '7.B On-Demand Diagnostic Studies Launcher (Optional Add-Ons)')}</span>
        </div>
      </div>
      <div class="obgyn-study-launcher">
        ${OBGYN_PARACLINIC_STUDY_TYPES.map((st) => {
          const cnt = studies.filter((x) => x.type === st.id).length;
          return `
            <button type="button" class="obgyn-study-launch-btn ${cnt > 0 ? 'has-items' : ''}" data-add-study-type="${escapeHtml(st.id)}">
              ${getIconSvg('plus', { size: 13 })}
              <span>${escapeHtml(isEn ? st.en : st.fa)}</span>
              ${cnt > 0 ? `<span class="obgyn-pe-count has-filled">${cnt}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      ${studies.length === 0 ? `
        <div class="obgyn-empty-hint obgyn-mt-sm">${tx(isEn, 'هیچ فرم خالی از پیش چاپ نمی‌شود. در صورت وجود سونوگرافی، نوار قلب جنین، پاپ‌اسمیر، ماموگرافی یا جواب پاتولوژی روی دکمه‌های بالا کلیک کنید.', 'Zero empty templates are pre-printed. Click any study button above to add an optional dated report.')}</div>
      ` : `
        <div class="obgyn-studies-list obgyn-mt-md">
          ${studies.map((s) => renderStudyCardHtml(s, isEn)).join('')}
        </div>
      `}
    </section>
  `;
}

/* ================================ TAB 8: PLAN ================================ */

function renderTabPlan(state, ob, isEn) {
  const ap = ob.assessmentAndPlan || {};
  const adca = ap.adcaVanDimls || {};
  const isGyn = activeSubMode === 'gynecology';
  const presets = isGyn ? OBGYN_DDX_PRESETS.gynecology : OBGYN_DDX_PRESETS.obstetrics;
  const selectedDdx = Array.isArray(ap.ddx) ? ap.ddx : [];

  const adcaRows = [
    ['A_admission', 'A — Admission', 'بستری و بخش'],
    ['D_diagnosis', 'D — Diagnosis', 'تشخیص'],
    ['C_condition', 'C — Condition', 'حال عمومی (Good / Critical)'],
    ['A_allergies', 'A — Allergies', 'حساسیت (NKDA)'],
    ['V_vitals', 'V — Vitals', 'کنترل علائم حیاتی و DTR'],
    ['A_activity', 'A — Activity', 'فعالیت (CBR / RBR)'],
    ['N_nursing', 'N — Nursing', 'دستورات پرستاری، I/O، رزرو خون'],
    ['D_diet', 'D — Diet', 'رژیم غذایی / NPO'],
    ['I_iv', 'I — IV Fluids', 'مایع‌درمانی و سرم'],
    ['M_medications', 'M — Medications', 'داروها (MgSO4 / آنتی‌بیوتیک / هموستاتیک)'],
    ['L_labs', 'L — Labs', 'آزمایشات و تکرار سریال'],
    ['S_special', 'S — Special / Consults', 'موارد خاص، سونو، رضایت، مشاوره']
  ];
  const filledCount = adcaRows.filter(([k]) => hasVal(adca[k])).length;

  return `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('list-checks', { size: 16 })}
          <span>${tx(isEn, 'تشخیص‌های افتراقی (DDx) و پلن بالینی', 'Differential Diagnoses (DDx) & Clinical Plan')}</span>
        </div>
      </div>
      <div class="obgyn-comp-chips">
        ${presets.map((p) => {
          const valStr = isEn ? p.en : p.fa;
          const active = selectedDdx.includes(p.fa) || selectedDdx.includes(p.en);
          return `<button type="button" class="obgyn-toggle-chip ${active ? 'active' : ''}" data-ddx-val="${escapeHtml(valStr)}">${escapeHtml(valStr)}</button>`;
        }).join('')}
      </div>
      <div class="obgyn-form-grid obgyn-cols-2 obgyn-mt-sm">
        <div class="obgyn-field">
          <label for="obPlanDdxCustom">${tx(isEn, 'سایر تشخیص‌های افتراقی (هر خط یک مورد)', 'Custom DDx (one per line)')}</label>
          <textarea class="input-textarea" id="obPlanDdxCustom" rows="2" placeholder="${tx(isEn, 'تشخیص اضافی...', 'Additional DDx...')}">${escapeHtml(ap.ddxCustom || '')}</textarea>
        </div>
        <div class="obgyn-field">
          <label for="obPlanSummary">${tx(isEn, 'خلاصه پلن درمانی (Assessment & Plan)', 'Management Plan Summary')}</label>
          <textarea class="input-textarea" id="obPlanSummary" rows="2" placeholder="${tx(isEn, 'توضیح استدلال بالینی و تصمیم ختم بارداری / جراحی...', 'Clinical reasoning and definitive management...')}">${escapeHtml(ap.planSummary || '')}</textarea>
        </div>
      </div>
    </section>

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('zap', { size: 16 })}
          <span>${tx(isEn, 'پروتکل‌های آماده بستری (One-Click Protocols)', 'One-Click University Order Protocols')}</span>
        </div>
      </div>
      <div class="obgyn-preset-bar">
        ${Object.entries(ADCA_VAN_DIMLS_PRESETS).map(([presetKey, presetObj]) => `
          <button type="button" class="obgyn-preset-btn" data-adca-preset="${presetKey}">
            ${getIconSvg('zap', { size: 14 })}
            <span>${escapeHtml(isEn ? presetObj.labelEn : presetObj.labelFa)}</span>
          </button>
        `).join('')}
      </div>

      <div class="obgyn-pe-accordion obgyn-adca-accordion ${adcaExpanded ? 'is-open' : ''} obgyn-mt-sm">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" id="btnToggleAdcaAcc" aria-expanded="${adcaExpanded}">
            ${getIconSvg(adcaExpanded ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, 'فرم ۱۲ جزئی دستورات بخش (ADCA VAN DIMLS)', '12-Part Ward Order Form (ADCA VAN DIMLS)')}</strong>
            <span class="obgyn-pe-count ${filledCount > 0 ? 'has-filled' : ''}">${filledCount}/12</span>
          </button>
        </div>
        ${adcaExpanded ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-form-grid obgyn-cols-2">
              ${adcaRows.map(([fieldKey, titleEn, titleFa]) => {
                const filledCls = hasVal(adca[fieldKey]) ? 'is-filled' : '';
                return `
                  <div class="obgyn-field ${filledCls} ${['N_nursing', 'M_medications', 'L_labs', 'S_special'].includes(fieldKey) ? 'is-span-2' : ''}">
                    <label for="obAdca_${fieldKey}">${escapeHtml(isEn ? titleEn : `${titleEn} — ${titleFa}`)}</label>
                    ${['N_nursing', 'M_medications', 'L_labs', 'S_special'].includes(fieldKey)
                      ? `<textarea class="input-textarea obgyn-adca-input" id="obAdca_${fieldKey}" data-adca-key="${fieldKey}" rows="2">${escapeHtml(adca[fieldKey] || '')}</textarea>`
                      : `<input type="text" class="input-text obgyn-adca-input" id="obAdca_${fieldKey}" data-adca-key="${fieldKey}" value="${escapeHtml(adca[fieldKey] || '')}">`
                    }
                  </div>
                `;
              }).join('')}
              <div class="obgyn-field">
                <label for="obAdcaPhysician">${tx(isEn, 'نام و مهر پزشک دستور دهنده', 'Ordering Physician')}</label>
                <input type="text" class="input-text obgyn-adca-input" id="obAdcaPhysician" data-adca-key="physicianName" value="${escapeHtml(adca.physicianName || '')}" placeholder="${tx(isEn, 'دکتر / اینترن بخش زنان', 'Dr. ...')}">
              </div>
              <div class="obgyn-field">
                <label for="obAdcaDt">${tx(isEn, 'تاریخ و ساعت ثبت دستور', 'Order Date & Time')}</label>
                <input type="text" class="input-text dir-ltr obgyn-adca-input" id="obAdcaDt" data-adca-key="dateTime" value="${escapeHtml(adca.dateTime || '')}" placeholder="1405/01/15 14:30">
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

function renderSoapeCapsuleRow(fieldKey, currentText, items, isEn) {
  return `
    <div class="obgyn-capsule-bar">
      ${items.map((cap) => {
        const phrase = isEn ? cap.en : cap.fa;
        const active = (currentText || '').includes(phrase);
        return `<button type="button" class="obgyn-capsule-chip ${active ? 'active' : ''}" data-soape-cap-field="${fieldKey}" data-soape-cap-text="${escapeHtml(phrase)}">${active ? getIconSvg('check', { size: 12 }) : getIconSvg('plus', { size: 12 })}<span>${escapeHtml(phrase)}</span></button>`;
      }).join('')}
    </div>
  `;
}

function renderSubModeSoape(state, ob, isEn) {
  const days = Array.isArray(ob.soapeHistory) ? ob.soapeHistory : [];
  const activeDay = days.find((d) => d.id === ob.activeSoapeId) || days[days.length - 1] || null;
  const ds = ob.dischargeSadaf || { sadaf: {} };
  const cn = ob.consultNote || {};
  const vt = activeDay?.vitals || {};

  return `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('trend-up', { size: 16 })}
          <span>${tx(isEn, 'سیر روزانه بخش زنان و زایمان (Ward SOAPE + کپسول‌های سریع بالینی)', 'Ob/Gyn Ward Daily Progress Tracker (Capsule-Driven SOAPE)')}</span>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="btnObgynAddSoapeDay">
          ${getIconSvg('plus', { size: 14 })}
          <span>${tx(isEn, 'ثبت روز جدید SOAPE', 'Add New SOAPE Day')}</span>
        </button>
      </div>

      ${days.length > 0 ? `
        <div class="obgyn-day-pills">
          ${days.map((d) => `
            <button type="button" class="obgyn-day-pill ${activeDay && d.id === activeDay.id ? 'active' : ''}" data-select-soape="${escapeHtml(d.id)}">
              <span>${tx(isEn, `روز ${d.dayNumber || 1}`, `Day ${d.dayNumber || 1}`)}</span>
              ${d.dateTime ? `<small class="dir-ltr">${escapeHtml(d.dateTime)}</small>` : ''}
            </button>
          `).join('')}
          ${activeDay ? `<button type="button" class="obgyn-icon-del" id="btnObgynDelSoapeDay" title="${tx(isEn, 'حذف این روز', 'Delete Day')}">${getIconSvg('trash', { size: 14 })}</button>` : ''}
        </div>
      ` : ''}

      ${activeDay ? `
        <div class="obgyn-form-grid obgyn-cols-3 obgyn-mt-sm">
          <div class="obgyn-field">
            <label for="obSoapeNum">${tx(isEn, 'شماره روز بستری', 'Hospital Day #')}</label>
            <input type="number" min="1" class="input-text dir-ltr obgyn-soape-input" id="obSoapeNum" data-soape-key="dayNumber" value="${escapeHtml(activeDay.dayNumber || 1)}">
          </div>
          <div class="obgyn-field">
            <label for="obSoapeType">${tx(isEn, 'نوع یادداشت', 'Note Type')}</label>
            <select class="input-select obgyn-soape-input" id="obSoapeType" data-soape-key="noteType">
              ${[
                ['سیر روزانه', 'Daily Progress'],
                ['پست-اپ روز ۱', 'Post-Op Day 1'],
                ['ارزیابی لیبر / مامایی', 'Labor / Obstetric Evaluation'],
                ['پیگیری پس از زایمان', 'Postpartum Follow-Up']
              ].map(([valFa, lblEn]) => `
                <option value="${escapeHtml(valFa)}" ${activeDay.noteType === valFa ? 'selected' : ''}>${escapeHtml(tx(isEn, valFa, lblEn))}</option>
              `).join('')}
            </select>
          </div>
          <div class="obgyn-field">
            <label for="obSoapeDt">${tx(isEn, 'تاریخ و ساعت راند', 'Date & Time')}</label>
            <input type="text" class="input-text dir-ltr obgyn-soape-input" id="obSoapeDt" data-soape-key="dateTime" value="${escapeHtml(activeDay.dateTime || '')}" placeholder="1405/01/16 08:00">
          </div>

          <div class="obgyn-field is-span-3">
            <label for="obSoapeS">S — ${tx(isEn, 'گزارش بیمار (Subjective)', 'Subjective')}</label>
            ${renderSoapeCapsuleRow('S', activeDay.S, OBGYN_SOAPE_CAPSULES.S, isEn)}
            <textarea class="input-textarea obgyn-soape-input" id="obSoapeS" data-soape-key="S" rows="2">${escapeHtml(activeDay.S || '')}</textarea>
          </div>

          <div class="obgyn-field is-span-3">
            <label for="obSoapeO">O — ${tx(isEn, 'یافته‌های عینی و علائم حیاتی بالین (Objective — بدون تفسیر!)', 'Objective Vitals & Bedside Exam (Factual Only!)')}</label>
            <div class="obgyn-form-grid obgyn-cols-6 obgyn-vitals-mini">
              <input type="text" class="input-text dir-ltr obgyn-soape-vital-inp" data-sv-key="bp" value="${escapeHtml(vt.bp || '')}" placeholder="BP (120/80)">
              <input type="text" class="input-text dir-ltr obgyn-soape-vital-inp" data-sv-key="pr" value="${escapeHtml(vt.pr || '')}" placeholder="PR (82)">
              <input type="text" class="input-text dir-ltr obgyn-soape-vital-inp" data-sv-key="rr" value="${escapeHtml(vt.rr || '')}" placeholder="RR (18)">
              <input type="text" class="input-text dir-ltr obgyn-soape-vital-inp" data-sv-key="temp" value="${escapeHtml(vt.temp || '')}" placeholder="T (36.8)">
              <input type="text" class="input-text is-span-2 obgyn-soape-vital-inp" data-sv-key="io" value="${escapeHtml(vt.io || '')}" placeholder="${tx(isEn, 'I/O (مثلاً UOP 70 mL/h)', 'I&O (UOP 70 mL/h)')}">
            </div>
            ${renderSoapeCapsuleRow('O', activeDay.O, OBGYN_SOAPE_CAPSULES.O, isEn)}
            <textarea class="input-textarea obgyn-soape-input" id="obSoapeO" data-soape-key="O" rows="2">${escapeHtml(activeDay.O || '')}</textarea>
          </div>

          <div class="obgyn-field is-span-3">
            <label for="obSoapeA">A — ${tx(isEn, 'ارزیابی بالینی و لیست اولویت‌دار مشکلات (Assessment)', 'Assessment & Prioritized Problem List')}</label>
            <textarea class="input-textarea obgyn-soape-input" id="obSoapeA" data-soape-key="A" rows="2">${escapeHtml(activeDay.A || '')}</textarea>
          </div>

          <div class="obgyn-field is-span-3">
            <label>${tx(isEn, 'P — تغییر دستورات و کپسول‌های سریع پلن', 'P — Plan Quick Capsules & Modifications')}</label>
            ${renderSoapeCapsuleRow('P_modifications', activeDay.P_modifications, OBGYN_SOAPE_CAPSULES.P, isEn)}
          </div>
          <div class="obgyn-field">
            <label for="obSoapePMod">${tx(isEn, 'تغییر یا ادامه دستورات', 'Plan Modifications')}</label>
            <input type="text" class="input-text obgyn-soape-input" id="obSoapePMod" data-soape-key="P_modifications" value="${escapeHtml(activeDay.P_modifications || '')}" placeholder="${tx(isEn, 'ادامه آنتی‌بیوتیک / قطع سولفات...', 'Hold MgSO4 / Switch PO...')}">
          </div>
          <div class="obgyn-field">
            <label for="obSoapePReason">${tx(isEn, 'علت علمی تغییر دستور (Reason)', 'Clinical Rationale (Mandatory)')}</label>
            <input type="text" class="input-text obgyn-soape-input" id="obSoapePReason" data-soape-key="P_reason" value="${escapeHtml(activeDay.P_reason || '')}" placeholder="${tx(isEn, 'ثبات همودینامیک و کنترل درد', 'Stable vitals / Completed 24h...')}">
          </div>
          <div class="obgyn-field">
            <label for="obSoapePNew">${tx(isEn, 'دستورات جدید / آزمایش فردا', 'New Orders')}</label>
            <input type="text" class="input-text obgyn-soape-input" id="obSoapePNew" data-soape-key="P_newOrders" value="${escapeHtml(activeDay.P_newOrders || '')}" placeholder="${tx(isEn, 'تکرار CBC صبح، مشاوره...', 'Repeat CBC QAM...')}">
          </div>

          <div class="obgyn-field is-span-3">
            <label for="obSoapeE">E — ${tx(isEn, 'آموزش بالینی به بیمار و خانواده (Education)', 'Patient Education')}</label>
            ${renderSoapeCapsuleRow('E', activeDay.E, OBGYN_SOAPE_CAPSULES.E, isEn)}
            <textarea class="input-textarea obgyn-soape-input" id="obSoapeE" data-soape-key="E" rows="2">${escapeHtml(activeDay.E || '')}</textarea>
          </div>
        </div>
      ` : `
        <div class="obgyn-empty-hint obgyn-mt-sm">${tx(isEn, 'هنوز روزی در جدول SOAPE ثبت نشده است. برای شروع روی «ثبت روز جدید SOAPE» کلیک کنید.', 'No SOAPE day recorded yet. Click "Add New SOAPE Day" to begin.')}</div>
      `}
    </section>

    <section class="clinical-card obgyn-section-card ${activeSoapeSection === 'discharge_sadaf' ? 'is-focused-drawer' : ''}">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('save', { size: 16 })}
          <span>${tx(isEn, 'خلاصه پرونده ترخیص (PD / DS) و آموزش استاندارد SADAF', 'Discharge Summary (PD/DS) & SADAF Counseling')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${ds.active ? 'active' : ''}" id="btnObgynToggleSadaf">
          <span>${tx(isEn, ds.active ? 'بستن فرم ترخیص' : 'فعال‌سازی در خروجی ترخیص', ds.active ? 'Included in Note' : 'Include Discharge / SADAF')}</span>
        </button>
      </div>
      ${ds.active ? `
        <div class="obgyn-form-grid obgyn-cols-2">
          <div class="obgyn-field">
            <label for="obDsInit">${tx(isEn, 'شکایت و تشخیص اولیه', 'CC & Initial Diagnosis')}</label>
            <input type="text" class="input-text obgyn-ds-input" id="obDsInit" data-ds-key="ccAndInitialDx" value="${escapeHtml(ds.ccAndInitialDx || '')}">
          </div>
          <div class="obgyn-field">
            <label for="obDsFinal">${tx(isEn, 'تشخیص نهایی ترخیص', 'Final Diagnosis')}</label>
            <input type="text" class="input-text obgyn-ds-input" id="obDsFinal" data-ds-key="finalDx" value="${escapeHtml(ds.finalDx || '')}">
          </div>
          <div class="obgyn-field">
            <label for="obDsProc">${tx(isEn, 'اقدامات درمانی و جراحی انجام‌شده', 'Treatments & Procedures')}</label>
            <input type="text" class="input-text obgyn-ds-input" id="obDsProc" data-ds-key="treatmentsAndProcedures" value="${escapeHtml(ds.treatmentsAndProcedures || '')}">
          </div>
          <div class="obgyn-field">
            <label for="obDsLabs">${tx(isEn, 'خلاصه آزمایشات مثبت و منفی مهم', 'Key Positive & Negative Labs')}</label>
            <input type="text" class="input-text obgyn-ds-input" id="obDsLabs" data-ds-key="labSummary" value="${escapeHtml(ds.labSummary || '')}">
          </div>
          <div class="obgyn-field">
            <label for="obDsCourse">${tx(isEn, 'سیر بیماری', 'Hospital Course')}</label>
            <select class="input-select obgyn-ds-input" id="obDsCourse" data-ds-key="diseaseCourse">
              <option value="improving" ${ds.diseaseCourse === 'improving' ? 'selected' : ''}>${tx(isEn, 'رو به بهبود (Improving)', 'Improving')}</option>
              <option value="unchanged" ${ds.diseaseCourse === 'unchanged' ? 'selected' : ''}>${tx(isEn, 'بدون تغییر', 'Unchanged')}</option>
              <option value="worsening" ${ds.diseaseCourse === 'worsening' ? 'selected' : ''}>${tx(isEn, 'رو به وخامت', 'Worsening')}</option>
            </select>
          </div>
          <div class="obgyn-field">
            <label for="obDsCond">${tx(isEn, 'وضعیت زمان ترخیص', 'Condition at Discharge')}</label>
            <input type="text" class="input-text obgyn-ds-input" id="obDsCond" data-ds-key="dischargeCondition" value="${escapeHtml(ds.dischargeCondition || '')}" placeholder="${tx(isEn, 'پایدار و هوشیار', 'Stable')}">
          </div>
        </div>
        <div class="obgyn-form-grid obgyn-cols-2 obgyn-mt-sm">
          ${[
            ['S_stitches', 'S — بخیه و مراقبت زخم (Stitches)', 'S — Stitches / Wound Care'],
            ['A_activity', 'A — فعالیت مجاز و ممنوع (Activity)', 'A — Activity & Sexual Intercourse'],
            ['D_drugsDiet', 'D — داروها و رژیم غذایی (Drugs & Diet)', 'D — Discharge Medications & Diet'],
            ['F_followUp', 'F — مراجعه بعدی، پاتولوژی و علائم خطر (Follow-up)', 'F — Follow-Up & Red Flags']
          ].map(([k, faL, enL]) => `
            <div class="obgyn-field">
              <label for="obSadaf_${k}">${escapeHtml(isEn ? enL : faL)}</label>
              <input type="text" class="input-text obgyn-sadaf-input" id="obSadaf_${k}" data-sadaf-key="${k}" value="${escapeHtml(ds.sadaf?.[k] || '')}">
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>

    <section class="clinical-card obgyn-section-card ${activeSoapeSection === 'consult' ? 'is-focused-drawer' : ''}">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('coreLink', { size: 16 })}
          <span>${tx(isEn, 'برگه درخواست مشاوره تخصصی (نگارش مشاوره)', 'Specialty Consultation Request Sheet')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${cn.active ? 'active' : ''}" id="btnObgynToggleConsult">
          <span>${tx(isEn, cn.active ? 'مشاوره فعال در خروجی' : 'افزودن برگه مشاوره', cn.active ? 'Included in Note' : 'Include Consultation Request')}</span>
        </button>
      </div>
      ${cn.active ? `
        <div class="obgyn-form-grid obgyn-cols-3">
          <div class="obgyn-field">
            <label for="obCnService">${tx(isEn, 'سرویس مشاوره‌شونده (Target Service)', 'Target Specialty Service')}</label>
            <input type="text" class="input-text obgyn-cn-input" id="obCnService" data-cn-key="targetService" value="${escapeHtml(cn.targetService || '')}" placeholder="${tx(isEn, 'داخلی / جراحی عمومی / قلب / عفونی', 'Internal Medicine / Surgery / Cardiology')}">
          </div>
          <div class="obgyn-field">
            <label for="obCnUrg">${tx(isEn, 'سطح فوریت', 'Urgency')}</label>
            <select class="input-select obgyn-cn-input" id="obCnUrg" data-cn-key="urgency">
              <option value="non_urgent" ${cn.urgency === 'non_urgent' ? 'selected' : ''}>${tx(isEn, 'غیراورژانس / روتین', 'Non-Urgent')}</option>
              <option value="urgent" ${cn.urgency === 'urgent' ? 'selected' : ''}>${tx(isEn, 'اورژانس (STAT)', 'URGENT / STAT')}</option>
            </select>
          </div>
          <div class="obgyn-field">
            <label for="obCnDt">${tx(isEn, 'تاریخ و ساعت', 'Date & Time')}</label>
            <input type="text" class="input-text dir-ltr obgyn-cn-input" id="obCnDt" data-cn-key="dateTime" value="${escapeHtml(cn.dateTime || '')}" placeholder="1405/01/16 10:00">
          </div>
          <div class="obgyn-field">
            <label for="obCnAdm">${tx(isEn, 'علت بستری بیمار', 'Reason for Admission')}</label>
            <input type="text" class="input-text obgyn-cn-input" id="obCnAdm" data-cn-key="admissionReason" value="${escapeHtml(cn.admissionReason || '')}">
          </div>
          <div class="obgyn-field">
            <label for="obCnReason">${tx(isEn, 'علت دقیق درخواست مشاوره', 'Reason for Consultation')}</label>
            <input type="text" class="input-text obgyn-cn-input" id="obCnReason" data-cn-key="consultReason" value="${escapeHtml(cn.consultReason || '')}" placeholder="${tx(isEn, 'بررسی و OK جهت جراحی', 'Preoperative medical clearance...')}">
          </div>
          <div class="obgyn-field">
            <label for="obCnDoc">${tx(isEn, 'پزشک درخواست‌کننده', 'Requesting Physician')}</label>
            <input type="text" class="input-text obgyn-cn-input" id="obCnDoc" data-cn-key="requestingPhysician" value="${escapeHtml(cn.requestingPhysician || '')}">
          </div>
          <div class="obgyn-field is-span-3">
            <label for="obCnSum">${tx(isEn, 'خلاصه بالینی نکات کلیدی', 'Clinical Summary for Consultant')}</label>
            <textarea class="input-textarea obgyn-cn-input" id="obCnSum" data-cn-key="summary" rows="2">${escapeHtml(cn.summary || '')}</textarea>
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

/* ======================== BADGE REFRESH & HANDLERS ======================== */

function refreshDynamicBadgesWithoutRerender(state, ob, isEn) {
  if (typeof document === 'undefined') return;
  const stripEl = document.getElementById('obgynExecStrip');
  if (stripEl) stripEl.innerHTML = buildExecSummaryHtml(state, ob, isEn);

  const gaBox = document.getElementById('obgynGaSummaryBox');
  if (gaBox) {
    const ga = calculateTripleGestationalAge(ob.gestationalDating);
    gaBox.innerHTML = renderGaSummaryInner(ob.gestationalDating, ga, isEn);
  }

  const bishopEl = document.getElementById('obgynBishopBadge');
  if (bishopEl) {
    const b = calculateBishopScore(ob.pe?.obsMeasurements);
    bishopEl.className = `obgyn-bishop-badge is-${b.status}`;
    bishopEl.textContent = b.assessedCount > 0
      ? (isEn ? b.labelEn : b.labelFa)
      : tx(isEn, 'Bishop Score: معیارها را وارد کنید', 'Bishop Score: Enter TV params');
  }
}

function bindFieldInput(container, id, assignFn, onAfter = null) {
  const el = container.querySelector(`#${id}`);
  if (!el) return;
  const evt = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(evt, () => {
    assignFn(el.value);
    if (onAfter) onAfter();
  });
}

function toggleSharedPmhItem(state, itemObj) {
  if (!state.pmh) state.pmh = { masterRoutineNegative: false, categories: {} };
  if (!state.pmh.categories) state.pmh.categories = {};
  const catId = itemObj.catId || 'pmh_cat_other';
  if (!state.pmh.categories[catId]) {
    state.pmh.categories[catId] = { status: 'neutral', items: {}, otherNote: '' };
  }
  const items = state.pmh.categories[catId].items;
  if (items[itemObj.id] && items[itemObj.id].state === 1) {
    delete items[itemObj.id];
  } else {
    state.pmh.masterRoutineNegative = false;
    items[itemObj.id] = {
      state: 1,
      label: itemObj.label || itemObj.fa || itemObj.en,
      fa: itemObj.fa || itemObj.label || '',
      en: itemObj.en || '',
      detail: '',
      catId
    };
    state.pmh.categories[catId].status = 'has_positive';
  }
}

function addSharedPshItem(state, procObj) {
  if (!state.psh) state.psh = { surgeries: [], noSurgeries: false, note: '' };
  if (!Array.isArray(state.psh.surgeries)) state.psh.surgeries = [];
  const existsIdx = state.psh.surgeries.findIndex((s) => s.id === procObj.id);
  if (existsIdx >= 0) {
    state.psh.surgeries.splice(existsIdx, 1);
  } else {
    state.psh.noSurgeries = false;
    state.psh.surgeries.push({
      id: procObj.id,
      label: procObj.label || procObj.fa || procObj.en,
      procedure: procObj.label || procObj.fa || procObj.en,
      en: procObj.en || '',
      year: '',
      note: ''
    });
  }
}

function addSharedDrugItem(state, drugObj) {
  if (!state.dh) state.dh = { noRoutineMeds: false, activeDrugs: [], categories: {}, customDrugs: [], note: '' };
  if (!Array.isArray(state.dh.activeDrugs)) state.dh.activeDrugs = [];
  const existsIdx = state.dh.activeDrugs.findIndex((d) => d.id === drugObj.id);
  if (existsIdx >= 0) {
    state.dh.activeDrugs.splice(existsIdx, 1);
  } else {
    state.dh.noRoutineMeds = false;
    state.dh.activeDrugs.push({
      id: drugObj.id,
      name: drugObj.label || drugObj.fa || drugObj.en,
      en: drugObj.en || '',
      dose: drugObj.commonDose || drugObj.defaultDose || '',
      sig: 'Daily (روزانه)',
      note: ''
    });
  }
}

function bindSharedSearchHandlers(container, state, isEn) {
  container.querySelectorAll('[data-add-shared-pmh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-shared-pmh');
      const itemObj = ALL_MASTER_PMH_ITEMS.find((x) => x.id === id) || OBGYN_PMH_DELTA.find((x) => x.id === id);
      if (itemObj) {
        toggleSharedPmhItem(state, itemObj);
        renderObgynWorkspace();
        hostBridge.onStateChange();
      }
    });
  });

  container.querySelectorAll('[data-add-shared-psh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-shared-psh');
      const procObj = MASTER_PSH_SURGERIES_BANK.find((x) => x.id === id) || OBGYN_PSH_DELTA.find((x) => x.id === id);
      if (procObj) {
        addSharedPshItem(state, procObj);
        renderObgynWorkspace();
        hostBridge.onStateChange();
      }
    });
  });

  container.querySelectorAll('[data-add-shared-dh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-shared-dh');
      const drugObj = ALL_MASTER_DRUGS.find((x) => x.id === id) || OBGYN_MEDICATIONS_DELTA.find((x) => x.id === id);
      if (drugObj) {
        addSharedDrugItem(state, drugObj);
        renderObgynWorkspace();
        hostBridge.onStateChange();
      }
    });
  });
}

function bindAnemiaEvents(container, ob, isEn) {
  container.querySelectorAll('[data-anemia-id][data-target-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aid = btn.getAttribute('data-anemia-id');
      const target = Number(btn.getAttribute('data-target-state'));
      if (!ob.ccAndHpi.anemiaSymptoms) ob.ccAndHpi.anemiaSymptoms = {};
      const cur = ob.ccAndHpi.anemiaSymptoms[aid]?.state || 0;
      ob.ccAndHpi.anemiaSymptoms[aid] = { state: cur === target ? 0 : target };
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('[data-anemia-neg-all]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!ob.ccAndHpi.anemiaSymptoms) ob.ccAndHpi.anemiaSymptoms = {};
      const allNeg = OBGYN_ANEMIA_SYMPTOMS.every((it) => ob.ccAndHpi.anemiaSymptoms[it.id]?.state === -1);
      OBGYN_ANEMIA_SYMPTOMS.forEach((it) => {
        if (allNeg) {
          delete ob.ccAndHpi.anemiaSymptoms[it.id];
        } else if (ob.ccAndHpi.anemiaSymptoms[it.id]?.state !== 1) {
          ob.ccAndHpi.anemiaSymptoms[it.id] = { state: -1 };
        }
      });
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
}

function preserveFocusRerender(id, caret) {
  renderObgynWorkspace();
  const reEl = document.getElementById(id);
  if (reEl) {
    reEl.focus();
    if (typeof caret === 'number') reEl.setSelectionRange(caret, caret);
  }
}

function bindObgynWorkspaceEvents(container, state, ob, isEn) {
  const triggerSoftSync = () => {
    refreshDynamicBadgesWithoutRerender(state, ob, isEn);
    hostBridge.onStateChange();
  };

  // Tab 1: Admission & CC
  const syncDemoDom = (domId, val) => {
    const domEl = document.getElementById(domId);
    if (domEl && domEl.value !== val) domEl.value = val;
  };
  bindFieldInput(container, 'obDemoName', (v) => { state.demographics.fullName = v; syncDemoDom('demoFullName', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoAge', (v) => { state.demographics.age = v; syncDemoDom('demoAge', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoWard', (v) => { state.demographics.ward = v; syncDemoDom('demoWard', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoBed', (v) => { state.demographics.bed = v; syncDemoDom('demoBed', v); }, triggerSoftSync);

  bindFieldInput(container, 'obAdmCc', (v) => {
    ob.ccAndHpi.ccText = v;
    if (!state.cc) state.cc = {};
    state.cc.patientQuote = v;
  }, triggerSoftSync);
  bindFieldInput(container, 'obAdmDur', (v) => { ob.ccAndHpi.duration = v; }, triggerSoftSync);

  container.querySelector('#btnObgynToggleVirgin')?.addEventListener('click', () => {
    ob.obstetricIndex.isVirgin = !ob.obstetricIndex.isVirgin;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  bindFieldInput(container, 'obIdxMarital', (v) => { ob.obstetricIndex.maritalStatus = v; }, triggerSoftSync);
  bindFieldInput(container, 'obIdxConception', (v) => { ob.obstetricIndex.conceptionMethod = v; }, triggerSoftSync);
  bindFieldInput(container, 'obIdxReproStatus', (v) => {
    ob.obstetricIndex.reproductiveStatus = v;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  bindFieldInput(container, 'obIdxMenopauseAge', (v) => {
    ob.obstetricIndex.menopauseAge = v;
    ob.menstrualHistory.menopauseAge = v;
  }, triggerSoftSync);
  bindFieldInput(container, 'obIdxBgRh', (v) => {
    ob.obstetricIndex.maternalBgRh = v;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  bindFieldInput(container, 'obIdxPatBgRh', (v) => { ob.obstetricIndex.paternalBgRh = v; }, triggerSoftSync);
  bindFieldInput(container, 'obIdxRhogam', (v) => { ob.obstetricIndex.indirectCoombsRhogam = v; }, triggerSoftSync);

  container.querySelector('#btnObgynExpandZeroIndex')?.addEventListener('click', () => {
    ob.obstetricIndex.expandZeroIndexFields = !ob.obstetricIndex.expandZeroIndexFields;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('.obgyn-idx-num').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.getAttribute('data-idx-key');
      if (!k) return;
      const prevCs = Number(ob.obstetricIndex.CS || 0);
      ob.obstetricIndex[k] = inp.value === '' ? null : inp.value;
      const nextCs = Number(ob.obstetricIndex.CS || 0);
      if (k === 'CS' && ((prevCs === 0 && nextCs > 0) || (prevCs > 0 && nextCs === 0))) {
        renderObgynWorkspace();
        container.querySelector('#obIdx_CS')?.focus();
      } else {
        triggerSoftSync();
      }
    });
  });

  bindFieldInput(container, 'obIdxCsIndications', (v) => { ob.obstetricIndex.priorCsIndications = v; }, triggerSoftSync);
  bindFieldInput(container, 'obIdxFetalCount', (v) => {
    ob.obstetricIndex.currentFetalCount = v ? parseInt(v, 10) : null;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  bindFieldInput(container, 'obIdxChorionicity', (v) => { ob.obstetricIndex.chorionicity = v; }, triggerSoftSync);

  container.querySelectorAll('.obgyn-cal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      ob.gestationalDating.lmpCalendar = btn.getAttribute('data-cal-mode') || 'jalali';
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  bindFieldInput(container, 'obGdLmpDate', (v) => {
    ob.gestationalDating.lmpDate = v;
    if (!ob.menstrualHistory.lmpDate) ob.menstrualHistory.lmpDate = v;
  }, triggerSoftSync);
  bindFieldInput(container, 'obGdReliableLmp', (v) => { ob.gestationalDating.isReliableLmp = v !== 'false'; }, triggerSoftSync);
  bindFieldInput(container, 'obGdCycleLen', (v) => { ob.gestationalDating.cycleLengthDays = parseInt(v, 10) || 28; }, triggerSoftSync);
  bindFieldInput(container, 'obGdAssessDate', (v) => { ob.gestationalDating.assessmentDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdNtDate', (v) => { ob.gestationalDating.ntScanDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdNtW', (v) => { ob.gestationalDating.ntGaWeeks = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdNtD', (v) => { ob.gestationalDating.ntGaDays = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdLastDate', (v) => { ob.gestationalDating.lastSonoDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdLastW', (v) => { ob.gestationalDating.lastSonoGaWeeks = v; }, triggerSoftSync);
  bindFieldInput(container, 'obGdLastD', (v) => { ob.gestationalDating.lastSonoGaDays = v; }, triggerSoftSync);

  // Tab 2: HPI
  bindFieldInput(container, 'obHpiCc', (v) => {
    ob.ccAndHpi.ccText = v;
    if (!state.cc) state.cc = {};
    state.cc.patientQuote = v;
  }, triggerSoftSync);
  bindFieldInput(container, 'obHpiDuration', (v) => { ob.ccAndHpi.duration = v; }, triggerSoftSync);
  bindFieldInput(container, 'obHpiExtra', (v) => { ob.ccAndHpi.narrativeExtra = v; }, triggerSoftSync);

  container.querySelectorAll('[data-add-archetype-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aId = btn.getAttribute('data-add-archetype-id');
      if (!Array.isArray(ob.ccAndHpi.presentations)) ob.ccAndHpi.presentations = [];
      ob.ccAndHpi.presentations.push({
        id: `obpres_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        archetypeId: aId,
        collapsed: false,
        fields: {}
      });
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('[data-toggle-pres-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-toggle-pres-id');
      const target = (ob.ccAndHpi.presentations || []).find((p) => p.id === pid);
      if (target) {
        target.collapsed = !target.collapsed;
        renderObgynWorkspace();
      }
    });
  });
  container.querySelectorAll('[data-del-pres-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-del-pres-id');
      ob.ccAndHpi.presentations = (ob.ccAndHpi.presentations || []).filter((p) => p.id !== pid);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-pres-input').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const pid = el.getAttribute('data-pres-id');
      const key = el.getAttribute('data-pres-key');
      const target = (ob.ccAndHpi.presentations || []).find((p) => p.id === pid);
      if (target) {
        if (!target.fields) target.fields = {};
        target.fields[key] = el.value;
        triggerSoftSync();
      }
    });
  });

  container.querySelector('#btnObgynAssessAllSsNeg')?.addEventListener('click', () => {
    if (!ob.ccAndHpi.symptoms) ob.ccAndHpi.symptoms = {};
    OBGYN_SS_FIVE_IDS.forEach((id) => {
      const existing = ob.ccAndHpi.symptoms[id];
      if (!existing || (existing.state !== 1 && existing.state !== -1)) {
        ob.ccAndHpi.symptoms[id] = { state: -1, modifiers: [], detail: '' };
      }
    });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelector('#obHpiSymSearch')?.addEventListener('input', (e) => {
    symptomSearchQuery = e.target.value || '';
    preserveFocusRerender('obHpiSymSearch', e.target.selectionStart);
  });
  container.querySelector('#btnObgynToggleAllSyms')?.addEventListener('click', () => {
    showAllSymptoms = !showAllSymptoms;
    renderObgynWorkspace();
  });

  container.querySelectorAll('[data-sym-id][data-target-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const symId = btn.getAttribute('data-sym-id');
      const target = Number(btn.getAttribute('data-target-state'));
      if (!ob.ccAndHpi.symptoms) ob.ccAndHpi.symptoms = {};
      const cur = ob.ccAndHpi.symptoms[symId] || { state: 0, modifiers: [], detail: '' };
      ob.ccAndHpi.symptoms[symId] = { ...cur, state: cur.state === target ? 0 : target };
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-mod-chip[data-sym-id]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const symId = chip.getAttribute('data-sym-id');
      const modVal = chip.getAttribute('data-mod-val');
      if (!ob.ccAndHpi.symptoms[symId]) ob.ccAndHpi.symptoms[symId] = { state: 1, modifiers: [], detail: '' };
      const arr = Array.isArray(ob.ccAndHpi.symptoms[symId].modifiers) ? ob.ccAndHpi.symptoms[symId].modifiers : [];
      ob.ccAndHpi.symptoms[symId].modifiers = arr.includes(modVal) ? arr.filter((x) => x !== modVal) : [...arr, modVal];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-sym-detail-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const symId = inp.getAttribute('data-sym-id');
      if (!ob.ccAndHpi.symptoms[symId]) ob.ccAndHpi.symptoms[symId] = { state: 1, modifiers: [], detail: '' };
      ob.ccAndHpi.symptoms[symId].detail = inp.value;
      triggerSoftSync();
    });
  });

  bindAnemiaEvents(container, ob, isEn);

  // Tab 3: PMH & PSH + POH/Menstrual
  container.querySelector('#btnObgynPmhNeg')?.addEventListener('click', () => {
    state.pmh.masterRoutineNegative = !state.pmh.masterRoutineNegative;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelector('#btnObgynPshNeg')?.addEventListener('click', () => {
    state.psh.noSurgeries = !state.psh.noSurgeries;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelector('#btnToggleObsMenstrualAcc')?.addEventListener('click', () => {
    obsMenstrualExpanded = !obsMenstrualExpanded;
    renderObgynWorkspace();
  });
  container.querySelector('#btnToggleGynPohAcc')?.addEventListener('click', () => {
    gynPohExpanded = !gynPohExpanded;
    renderObgynWorkspace();
  });

  [
    ['obSharedPmhSearch', 'pmh', 'obSharedPmhResults'],
    ['obSharedPshSearch', 'psh', 'obSharedPshResults'],
    ['obSharedDhSearch', 'dh', 'obSharedDhResults']
  ].forEach(([inpId, kind, resId]) => {
    container.querySelector(`#${inpId}`)?.addEventListener('input', (e) => {
      sharedSearchQueries[kind] = e.target.value || '';
      const resEl = container.querySelector(`#${resId}`);
      if (resEl) {
        resEl.innerHTML = renderSharedSearchResults(kind, state, isEn);
        bindSharedSearchHandlers(container, state, isEn);
      }
    });
  });
  bindSharedSearchHandlers(container, state, isEn);

  container.querySelectorAll('.obgyn-shared-pmh-det').forEach((inp) => {
    inp.addEventListener('input', () => {
      const cat = inp.getAttribute('data-pmh-cat');
      const id = inp.getAttribute('data-pmh-id');
      if (state.pmh?.categories?.[cat]?.items?.[id]) {
        state.pmh.categories[cat].items[id].detail = inp.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-del-shared-pmh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-pmh-cat');
      const id = btn.getAttribute('data-del-shared-pmh');
      if (state.pmh?.categories?.[cat]?.items?.[id]) {
        delete state.pmh.categories[cat].items[id];
        renderObgynWorkspace();
        hostBridge.onStateChange();
      }
    });
  });

  container.querySelectorAll('.obgyn-shared-psh-inp').forEach((inp) => {
    inp.addEventListener('input', () => {
      const idx = parseInt(inp.getAttribute('data-psh-idx'), 10);
      const fld = inp.getAttribute('data-psh-fld');
      if (state.psh?.surgeries?.[idx]) {
        state.psh.surgeries[idx][fld] = inp.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-del-shared-psh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-shared-psh'), 10);
      state.psh.surgeries.splice(idx, 1);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelector('#btnObgynAddPregnancy')?.addEventListener('click', () => {
    ob.pastObstetricHistory.pregnancies.push({
      id: `preg_${Date.now()}`,
      orderNumber: ob.pastObstetricHistory.pregnancies.length + 1,
      yearOrChildAge: '',
      outcomeType: 'NVD',
      gaAtOutcomeWeeks: '',
      birthWeightGrams: '',
      csIndicationOrLossMethod: ''
    });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelectorAll('[data-del-preg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idxRow = parseInt(btn.getAttribute('data-del-preg'), 10);
      ob.pastObstetricHistory.pregnancies.splice(idxRow, 1);
      ob.pastObstetricHistory.pregnancies.forEach((p, i) => { p.orderNumber = i + 1; });
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-preg-input').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const idxRow = parseInt(el.getAttribute('data-preg-index'), 10);
      const fld = el.getAttribute('data-preg-field');
      if (ob.pastObstetricHistory.pregnancies[idxRow]) {
        ob.pastObstetricHistory.pregnancies[idxRow][fld] = el.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-poh-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-poh-flag');
      ob.pastObstetricHistory.priorComplicationFlags[k] = !ob.pastObstetricHistory.priorComplicationFlags[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  bindFieldInput(container, 'obMhMenarche', (v) => { ob.menstrualHistory.menarcheAge = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhLmp', (v) => {
    ob.menstrualHistory.lmpDate = v;
    if (!ob.gestationalDating.lmpDate) ob.gestationalDating.lmpDate = v;
  }, triggerSoftSync);
  bindFieldInput(container, 'obMhReg', (v) => { ob.menstrualHistory.regularity = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhInterval', (v) => { ob.menstrualHistory.cycleIntervalDays = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhDuration', (v) => { ob.menstrualHistory.bleedingDurationDays = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhFlow', (v) => { ob.menstrualHistory.flowVolume = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhClots', (v) => { ob.menstrualHistory.clotStatus = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhPads', (v) => { ob.menstrualHistory.padsPerDay = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhDys', (v) => { ob.menstrualHistory.dysmenorrhea = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrContra', (v) => { ob.gynScreeningAndRecords.contraception.currentMethod = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrContraPrior', (v) => { ob.gynScreeningAndRecords.contraception.priorMethodsAndSideEffects = v; }, triggerSoftSync);
  container.querySelectorAll('[data-mh-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-mh-flag');
      ob.menstrualHistory[k] = !ob.menstrualHistory[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  // Tab 4: DH / AH / SH / FH
  container.querySelector('#btnObgynDhNeg')?.addEventListener('click', () => {
    state.dh.noRoutineMeds = !state.dh.noRoutineMeds;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelector('#btnObgynAddCustomDrug')?.addEventListener('click', () => {
    const inp = container.querySelector('#obCustomDrugInput');
    const name = inp?.value?.trim();
    if (!name) return;
    if (!state.dh) state.dh = { noRoutineMeds: false, activeDrugs: [], customDrugs: [], categories: {}, note: '' };
    if (!Array.isArray(state.dh.customDrugs)) state.dh.customDrugs = [];
    state.dh.noRoutineMeds = false;
    state.dh.customDrugs.push({ id: `cust_${Date.now()}`, name, dose: '', sig: 'Daily (روزانه)' });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelectorAll('.obgyn-shared-dh-inp').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const idx = parseInt(el.getAttribute('data-dh-idx'), 10);
      const fld = el.getAttribute('data-dh-fld');
      const kind = el.getAttribute('data-dh-kind');
      const arr = kind === 'custom' ? state.dh?.customDrugs : state.dh?.activeDrugs;
      if (arr?.[idx]) {
        arr[idx][fld] = el.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-del-shared-dh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-shared-dh'), 10);
      const kind = btn.getAttribute('data-dh-kind');
      const arr = kind === 'custom' ? state.dh?.customDrugs : state.dh?.activeDrugs;
      if (arr) {
        arr.splice(idx, 1);
        renderObgynWorkspace();
        hostBridge.onStateChange();
      }
    });
  });

  // Multi-Allergy Row Builder events
  container.querySelector('#btnObgynAhNkda')?.addEventListener('click', () => {
    if (!state.ah) state.ah = { nkda: false, selected: [], note: '' };
    state.ah.nkda = !state.ah.nkda;
    if (state.ah.nkda) state.ah.selected = [];
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelectorAll('[data-add-allergen-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-add-allergen-preset');
      const preset = OBGYN_QUICK_ALLERGENS.find((x) => x.id === pid);
      if (!preset) return;
      if (!state.ah) state.ah = { nkda: false, selected: [], note: '' };
      if (!Array.isArray(state.ah.selected)) state.ah.selected = [];
      const exists = state.ah.selected.some((x) => x.id === preset.id || x.label === preset.fa);
      if (!exists) {
        state.ah.nkda = false;
        state.ah.selected.push({ id: preset.id, label: preset.fa, en: preset.en, reactions: [], detail: '' });
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelector('#btnObgynAddCustomAllergen')?.addEventListener('click', () => {
    const inp = container.querySelector('#obCustomAllergenInput');
    const lbl = inp?.value?.trim();
    if (!lbl) return;
    if (!state.ah) state.ah = { nkda: false, selected: [], note: '' };
    if (!Array.isArray(state.ah.selected)) state.ah.selected = [];
    state.ah.nkda = false;
    state.ah.selected.push({ id: `alg_cust_${Date.now()}`, label: lbl, en: lbl, reactions: [], detail: '' });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelectorAll('[data-del-allergy-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aIdx = parseInt(btn.getAttribute('data-del-allergy-idx'), 10);
      state.ah.selected.splice(aIdx, 1);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-reaction-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aIdx = parseInt(btn.getAttribute('data-allergy-idx'), 10);
      const rxId = btn.getAttribute('data-rx-id');
      const row = state.ah?.selected?.[aIdx];
      if (!row || typeof row !== 'object') return;
      if (!Array.isArray(row.reactions)) row.reactions = [];
      row.reactions = row.reactions.includes(rxId) ? row.reactions.filter((x) => x !== rxId) : [...row.reactions, rxId];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-allergy-detail-inp').forEach((inp) => {
    inp.addEventListener('input', () => {
      const aIdx = parseInt(inp.getAttribute('data-allergy-idx'), 10);
      if (state.ah?.selected?.[aIdx] && typeof state.ah.selected[aIdx] === 'object') {
        state.ah.selected[aIdx].detail = inp.value;
        triggerSoftSync();
      }
    });
  });

  container.querySelectorAll('[data-sh-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-sh-toggle');
      state.sh[k] = !state.sh[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelector('#btnObgynFhNeg')?.addEventListener('click', () => {
    state.fh.negFamilyHistory = !state.fh.negFamilyHistory;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  bindFieldInput(container, 'obSharedShNote', (v) => { state.sh.note = v; }, triggerSoftSync);
  bindFieldInput(container, 'obSharedFhNote', (v) => { state.fh.note = v; }, triggerSoftSync);

  // Tab 5: ROS
  container.querySelector('#obRosSearchInput')?.addEventListener('input', (e) => {
    rosSearchQuery = e.target.value || '';
    preserveFocusRerender('obRosSearchInput', e.target.selectionStart);
  });
  container.querySelector('#btnObgynRosNegRemaining')?.addEventListener('click', () => {
    if (!state.ros) state.ros = { items: {} };
    if (!state.ros.items) state.ros.items = {};
    getNonMaleRosGroups().forEach((grp) => {
      grp.items.forEach((it) => {
        const cur = state.ros.items[it.id];
        if (!cur || (cur.state !== 1 && cur.state !== -1)) {
          state.ros.items[it.id] = { state: -1, subTypes: [], detail: '', system: it.system, label: it.fa || it.label, en: it.en };
        }
      });
    });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelectorAll('[data-ros-sys-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-ros-sys-toggle');
      if (expandedRosSystems.has(k)) expandedRosSystems.delete(k);
      else expandedRosSystems.add(k);
      renderObgynWorkspace();
    });
  });
  container.querySelectorAll('[data-ros-sys-neg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-ros-sys-neg');
      const grp = getNonMaleRosGroups().find((g) => g.systemKey === k);
      if (!grp) return;
      if (!state.ros) state.ros = { items: {} };
      if (!state.ros.items) state.ros.items = {};
      grp.items.forEach((it) => {
        const cur = state.ros.items[it.id];
        if (!cur || cur.state !== 1) {
          state.ros.items[it.id] = { state: -1, subTypes: [], detail: '', system: it.system, label: it.fa || it.label, en: it.en };
        }
      });
      expandedRosSystems.add(k);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('[data-ros-id][data-target-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rid = btn.getAttribute('data-ros-id');
      const target = Number(btn.getAttribute('data-target-state'));
      if (!state.ros) state.ros = { items: {} };
      if (!state.ros.items) state.ros.items = {};
      const cur = state.ros.items[rid] || { state: 0, subTypes: [], detail: '' };
      const all = getNonMaleRosGroups().flatMap((g) => g.items);
      const bi = all.find((x) => x.id === rid);
      if (cur.state === target) {
        delete state.ros.items[rid];
      } else {
        state.ros.items[rid] = { ...cur, state: target, system: bi?.system || cur.system, label: bi?.fa || cur.label, en: bi?.en || cur.en };
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('[data-ros-sub-id]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const rid = chip.getAttribute('data-ros-sub-id');
      const val = chip.getAttribute('data-ros-sub-val');
      const cur = state.ros?.items?.[rid];
      if (!cur) return;
      const arr = Array.isArray(cur.subTypes) ? cur.subTypes : [];
      cur.subTypes = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-ros-detail-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const rid = inp.getAttribute('data-ros-id');
      if (state.ros?.items?.[rid]) {
        state.ros.items[rid].detail = inp.value;
        triggerSoftSync();
      }
    });
  });

  // Tab 6: PE (Vitals + Deep Obs / Gyn + General Head-to-Toe)
  bindFieldInput(container, 'obPeBp', (v) => { ob.pe.vitals.bp = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeBpRep', (v) => { ob.pe.vitals.bpRepeat = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPePr', (v) => { ob.pe.vitals.pr = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeRr', (v) => { ob.pe.vitals.rr = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeTemp', (v) => { ob.pe.vitals.temp = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeSpo2', (v) => { ob.pe.vitals.spo2 = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeDipstick', (v) => { ob.pe.vitals.urineDipstick = v; }, triggerSoftSync);

  container.querySelectorAll('.obgyn-obs-inp').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const k = el.getAttribute('data-obs-key');
      if (k) {
        ob.pe.obsMeasurements[k] = el.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-tactile-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const k = btn.getAttribute('data-tactile-key');
      const v = btn.getAttribute('data-tactile-val');
      ob.pe.obsMeasurements[k] = String(ob.pe.obsMeasurements[k] ?? '') === v ? '' : v;
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('.obgyn-gyn-inp').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const sec = el.getAttribute('data-gyn-sec');
      const key = el.getAttribute('data-gyn-key');
      if (!ob.pe.gynExam) ob.pe.gynExam = {};
      if (!ob.pe.gynExam[sec]) ob.pe.gynExam[sec] = {};
      ob.pe.gynExam[sec][key] = el.value;
      triggerSoftSync();
    });
  });

  container.querySelectorAll('[data-pe-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-pe-preset');
      const vals = OBGYN_PE_NORMAL_PRESETS[key];
      if (!vals) return;
      if (key === 'obsAbdomen' || key === 'obsExtremities') {
        Object.assign(ob.pe.obsMeasurements, vals);
      } else {
        const secMap = {
          gynBreast: 'breast',
          gynAbdomen: 'abdomen',
          gynExternal: 'externalGenitalia',
          gynSpeculum: 'speculum',
          gynBimanual: 'bimanual'
        };
        const targetSec = secMap[key];
        if (targetSec) {
          if (!ob.pe.gynExam) ob.pe.gynExam = {};
          if (!ob.pe.gynExam[targetSec]) ob.pe.gynExam[targetSec] = {};
          Object.assign(ob.pe.gynExam[targetSec], vals);
        }
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  // General PE search + accordions
  container.querySelector('#obGenPeSearchInput')?.addEventListener('input', (e) => {
    generalPeSearchQuery = e.target.value || '';
    preserveFocusRerender('obGenPeSearchInput', e.target.selectionStart);
  });
  container.querySelectorAll('[data-genpe-sys-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-genpe-sys-toggle');
      if (expandedGenPeSystems.has(k)) expandedGenPeSystems.delete(k);
      else expandedGenPeSystems.add(k);
      renderObgynWorkspace();
    });
  });
  container.querySelectorAll('[data-genpe-sys-normal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-genpe-sys-normal');
      const pillar = (PE_MANDATORY_PILLARS || []).find((p) => p.systemKey === k);
      if (!pillar) return;
      if (!state.pe) state.pe = { findings: {} };
      if (!state.pe.findings) state.pe.findings = {};
      (pillar.items || []).forEach((it) => {
        if (it.normalState === 1 || it.normalState === -1) {
          const curDet = state.pe.findings[it.id]?.detail || '';
          state.pe.findings[it.id] = { state: it.normalState, detail: curDet, system: it.system, label: it.fa, en: it.en };
        }
      });
      expandedGenPeSystems.add(k);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('[data-genpe-id][data-target-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-genpe-id');
      const target = Number(btn.getAttribute('data-target-state'));
      if (!state.pe) state.pe = { findings: {} };
      if (!state.pe.findings) state.pe.findings = {};
      const cur = state.pe.findings[pid] || { state: 0, detail: '' };
      const all = (PE_MANDATORY_PILLARS || []).flatMap((p) => p.items || []);
      const bi = all.find((x) => x.id === pid);
      if (cur.state === target) {
        delete state.pe.findings[pid];
      } else {
        state.pe.findings[pid] = { ...cur, state: target, system: bi?.system || cur.system, label: bi?.fa || cur.label, en: bi?.en || cur.en };
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-genpe-detail-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const pid = inp.getAttribute('data-genpe-id');
      if (state.pe?.findings?.[pid]) {
        state.pe.findings[pid].detail = inp.value;
        triggerSoftSync();
      }
    });
  });

  // Tab 7: Paraclinics & On-Demand Studies
  container.querySelectorAll('.obgyn-kl-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.getAttribute('data-kl-key');
      ob.paraclinics.keyLabs[k] = inp.value;
      triggerSoftSync();
    });
  });
  bindFieldInput(container, 'obKlNote', (v) => { ob.paraclinics.keyLabsNote = v; }, triggerSoftSync);

  container.querySelector('#obLabSearchInput')?.addEventListener('input', (e) => {
    labSearchQuery = e.target.value || '';
    preserveFocusRerender('obLabSearchInput', e.target.selectionStart);
  });
  container.querySelectorAll('[data-add-extra-lab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lid = btn.getAttribute('data-add-extra-lab');
      const t = MASTER_ALL_LAB_TESTS.find((x) => x.id === lid);
      if (!t) return;
      if (!Array.isArray(ob.paraclinics.extraLabs)) ob.paraclinics.extraLabs = [];
      if (!ob.paraclinics.extraLabs.some((x) => x.id === lid)) {
        ob.paraclinics.extraLabs.push({ id: lid, label: t.fa || t.label, en: t.en || t.label, unit: t.unit || '', value: '' });
      }
      labSearchQuery = '';
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-extra-lab-inp').forEach((inp) => {
    inp.addEventListener('input', () => {
      const idx = parseInt(inp.getAttribute('data-extra-lab-idx'), 10);
      if (ob.paraclinics.extraLabs?.[idx]) {
        ob.paraclinics.extraLabs[idx].value = inp.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-del-extra-lab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-extra-lab'), 10);
      ob.paraclinics.extraLabs.splice(idx, 1);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('[data-add-study-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const typeId = btn.getAttribute('data-add-study-type');
      if (!Array.isArray(ob.paraclinics.studies)) ob.paraclinics.studies = [];
      ob.paraclinics.studies.push({
        id: `study_${typeId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: typeId,
        date: '',
        fields: {}
      });
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('[data-del-study-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sid = btn.getAttribute('data-del-study-id');
      ob.paraclinics.studies = (ob.paraclinics.studies || []).filter((s) => s.id !== sid);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-study-date-inp').forEach((inp) => {
    inp.addEventListener('input', () => {
      const sid = inp.getAttribute('data-study-id');
      const target = (ob.paraclinics.studies || []).find((s) => s.id === sid);
      if (target) {
        target.date = inp.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('.obgyn-study-fld-inp').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const sid = el.getAttribute('data-study-id');
      const fld = el.getAttribute('data-study-fld');
      const target = (ob.paraclinics.studies || []).find((s) => s.id === sid);
      if (target) {
        if (!target.fields) target.fields = {};
        target.fields[fld] = el.value;
        if (target.type === 'nst_efm') {
          const card = el.closest('.obgyn-study-card');
          const badge = card?.querySelector('.obgyn-nichd-badge');
          if (badge) {
            const f = target.fields;
            const n = evaluateNichdCategory({
              baselineBpm: f.baselineBpm,
              variability: f.variability,
              decelerations: { type: f.decelType || 'None', isRecurrent: f.decelRecurrent === 'yes', variablePathologicalFlags: {}, cordCompressionPatternVariant: 'None' }
            });
            badge.className = `obgyn-nichd-badge is-${n.category === 'Category III' ? 'cat3' : n.category === 'Category I' ? 'cat1' : 'cat2'}`;
            badge.textContent = (hasVal(f.baselineBpm) && hasVal(f.variability)) ? (isEn ? n.labelEn : n.labelFa) : tx(isEn, 'NICHD: پارامترها را وارد کنید', 'NICHD: Enter trace');
          }
        }
        triggerSoftSync();
      }
    });
  });

  // Tab 8: DDx, Plan & ADCA VAN DIMLS
  container.querySelectorAll('[data-ddx-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-ddx-val');
      const arr = ob.assessmentAndPlan.ddx;
      ob.assessmentAndPlan.ddx = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  bindFieldInput(container, 'obPlanDdxCustom', (v) => { ob.assessmentAndPlan.ddxCustom = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPlanSummary', (v) => { ob.assessmentAndPlan.planSummary = v; }, triggerSoftSync);
  container.querySelector('#btnToggleAdcaAcc')?.addEventListener('click', () => {
    adcaExpanded = !adcaExpanded;
    renderObgynWorkspace();
  });
  container.querySelectorAll('[data-adca-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pKey = btn.getAttribute('data-adca-preset');
      const preset = ADCA_VAN_DIMLS_PRESETS[pKey];
      if (!preset) return;
      const pack = isEn ? preset.en : preset.fa;
      Object.assign(ob.assessmentAndPlan.adcaVanDimls, pack);
      adcaExpanded = true;
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  container.querySelectorAll('.obgyn-adca-input').forEach((el) => {
    el.addEventListener('input', () => {
      const k = el.getAttribute('data-adca-key');
      ob.assessmentAndPlan.adcaVanDimls[k] = el.value;
      triggerSoftSync();
    });
  });

  // Sub-mode 3: Capsule-Driven SOAPE, SADAF & Consult
  container.querySelector('#btnObgynAddSoapeDay')?.addEventListener('click', () => {
    const days = ob.soapeHistory;
    const newId = `soape_${Date.now()}`;
    days.push({
      id: newId,
      dayNumber: days.length + 1,
      noteType: 'سیر روزانه',
      dateTime: new Date().toLocaleDateString(isEn ? 'en-US' : 'fa-IR'),
      vitals: { bp: '', pr: '', rr: '', temp: '', io: '' },
      S: '',
      O: '',
      A: '',
      P_modifications: '',
      P_reason: '',
      P_newOrders: '',
      E: ''
    });
    ob.activeSoapeId = newId;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('[data-select-soape]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ob.activeSoapeId = btn.getAttribute('data-select-soape');
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelector('#btnObgynDelSoapeDay')?.addEventListener('click', () => {
    const idx = ob.soapeHistory.findIndex((d) => d.id === ob.activeSoapeId);
    if (idx >= 0) {
      ob.soapeHistory.splice(idx, 1);
      ob.activeSoapeId = ob.soapeHistory[ob.soapeHistory.length - 1]?.id || null;
      renderObgynWorkspace();
      hostBridge.onStateChange();
    }
  });

  container.querySelectorAll('.obgyn-soape-vital-inp').forEach((inp) => {
    inp.addEventListener('input', () => {
      const activeDay = ob.soapeHistory.find((d) => d.id === ob.activeSoapeId) || ob.soapeHistory[ob.soapeHistory.length - 1];
      if (!activeDay) return;
      if (!activeDay.vitals) activeDay.vitals = {};
      activeDay.vitals[inp.getAttribute('data-sv-key')] = inp.value;
      triggerSoftSync();
    });
  });

  container.querySelectorAll('[data-soape-cap-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const activeDay = ob.soapeHistory.find((d) => d.id === ob.activeSoapeId) || ob.soapeHistory[ob.soapeHistory.length - 1];
      if (!activeDay) return;
      const fld = btn.getAttribute('data-soape-cap-field');
      const phrase = btn.getAttribute('data-soape-cap-text');
      const sep = isEn ? '; ' : '؛ ';
      const cur = (activeDay[fld] || '').trim();
      if (cur.includes(phrase)) {
        const parts = cur.split(/[؛;]\s*/).filter((p) => p.trim() && p.trim() !== phrase);
        activeDay[fld] = parts.join(sep);
      } else {
        activeDay[fld] = cur ? `${cur}${sep}${phrase}` : phrase;
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('.obgyn-soape-input').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const activeDay = ob.soapeHistory.find((d) => d.id === ob.activeSoapeId) || ob.soapeHistory[ob.soapeHistory.length - 1];
      if (!activeDay) return;
      const k = el.getAttribute('data-soape-key');
      activeDay[k] = k === 'dayNumber' ? (parseInt(el.value, 10) || 1) : el.value;
      triggerSoftSync();
    });
  });

  container.querySelector('#btnObgynToggleSadaf')?.addEventListener('click', () => {
    ob.dischargeSadaf.active = !ob.dischargeSadaf.active;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('.obgyn-ds-input').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      ob.dischargeSadaf[el.getAttribute('data-ds-key')] = el.value;
      triggerSoftSync();
    });
  });

  container.querySelectorAll('.obgyn-sadaf-input').forEach((el) => {
    el.addEventListener('input', () => {
      ob.dischargeSadaf.sadaf[el.getAttribute('data-sadaf-key')] = el.value;
      triggerSoftSync();
    });
  });

  container.querySelector('#btnObgynToggleConsult')?.addEventListener('click', () => {
    ob.consultNote.active = !ob.consultNote.active;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('.obgyn-cn-input').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      ob.consultNote[el.getAttribute('data-cn-key')] = el.value;
      triggerSoftSync();
    });
  });
}

export function renderObgynWorkspace(subModeOverride = null) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('view-mode-obgyn');
  if (!container) return;

  const state = hostBridge.getState();
  const ob = ensureObgynStateOnHost(state);
  if (subModeOverride) {
    activeSubMode = normalizeSubMode(subModeOverride);
    ob.subMode = activeSubMode;
  } else {
    activeSubMode = normalizeSubMode(ob.subMode);
  }
  const tabAlias = { history: 'pmh_psh', shared: 'dh_ah_sh_fh', workup: 'paraclinics' }[ob.activeTab] || ob.activeTab;
  if (tabAlias && OBGYN_TABS.some((t) => t.id === tabAlias)) {
    activeTab = tabAlias;
    ob.activeTab = tabAlias;
  }

  const isEn = getCurrentLanguage() === 'en';
  const guardrails = evaluateObgynSafetyGuardrails(ob);

  syncModeSwitcherDom();
  renderObgynNavigationRail(state, ob, isEn);

  let sectionHtml = '';
  if (activeSubMode === 'soape') {
    sectionHtml = renderSubModeSoape(state, ob, isEn);
  } else if (activeTab === 'hpi') {
    sectionHtml = renderTabHpi(state, ob, guardrails, isEn);
  } else if (activeTab === 'pmh_psh') {
    sectionHtml = renderTabPmhPsh(state, ob, isEn);
  } else if (activeTab === 'dh_ah_sh_fh') {
    sectionHtml = renderTabDhAhShFh(state, ob, isEn);
  } else if (activeTab === 'ros') {
    sectionHtml = renderTabRos(state, ob, isEn);
  } else if (activeTab === 'pe') {
    sectionHtml = renderTabPe(state, ob, guardrails, isEn);
  } else if (activeTab === 'paraclinics') {
    sectionHtml = renderTabParaclinics(state, ob, guardrails, isEn);
  } else if (activeTab === 'plan') {
    sectionHtml = renderTabPlan(state, ob, isEn);
  } else {
    sectionHtml = renderTabAdmission(state, ob, guardrails, isEn);
  }

  container.innerHTML = `
    <div id="obgynExecStrip" class="obgyn-exec-strip">
      ${buildExecSummaryHtml(state, ob, isEn)}
    </div>
    <div class="obgyn-tab-stage">
      ${sectionHtml}
    </div>
  `;

  bindObgynWorkspaceEvents(container, state, ob, isEn);
}

export function enterObgynSharedCoreTab(tabId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.obgynShared = 'true';
  const obView = document.getElementById('view-mode-obgyn');
  if (obView) obView.style.setProperty('display', 'none', 'important');

  const hpView = document.getElementById('view-mode-hp');
  if (hpView) {
    let banner = document.getElementById('obgynSharedCoreReturnBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'obgynSharedCoreReturnBanner';
      banner.className = 'obgyn-shared-return-banner';
      hpView.prepend(banner);
    }
    const isEn = getCurrentLanguage() === 'en';
    banner.innerHTML = `
      <div class="obgyn-shared-return-info">
        ${getIconSvg('coreLink', { size: 15 })}
        <span>${tx(isEn, 'در حال تکمیل هسته مشترک بیمار (متصل به پرونده زنان و زایمان)', 'Editing Shared Clinical Core (Synchronized with Ob/Gyn Lens)')}</span>
      </div>
      <button type="button" class="obgyn-shared-return-btn" id="btnReturnFromSharedToObgyn">
        ${getIconSvg(isEn ? 'arrow-left' : 'arrow-right', { size: 14 })}
        <span>${tx(isEn, 'بازگشت به پرونده زنان و زایمان', 'Return to Ob/Gyn Workspace')}</span>
      </button>
    `;
    banner.querySelector('#btnReturnFromSharedToObgyn')?.addEventListener('click', () => {
      exitObgynSharedCoreBanner();
    });
  }
  hostBridge.openSharedCoreTab(tabId);
}

export function exitObgynSharedCoreBanner() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.obgynShared = 'false';
  document.getElementById('obgynSharedCoreReturnBanner')?.remove();
  const isObgyn = document.documentElement.dataset.specialty === 'obgyn';
  const obView = document.getElementById('view-mode-obgyn');
  if (obView) {
    obView.style.display = isObgyn ? 'flex' : 'none';
  }
  if (isObgyn) {
    renderObgynWorkspace();
    hostBridge.onStateChange();
  }
}
