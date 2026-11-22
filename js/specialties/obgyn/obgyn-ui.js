/**
 * MedHistorism v3.1.1 — Ob/Gyn Complete Interactive Clinical UI Module
 * Multi-Presentation HPI, Compact Multi-Column Split-Pills, Strict Obs/Gyn Separation,
 * In-Place Shared Core Pickers (PMH/PSH/DH/Allergy/SH/FH), Capsule-Driven SOAPE & SADAF.
 */

import {
  OBGYN_OBSTETRIC_ARCHETYPES,
  OBGYN_GYN_ARCHETYPES,
  OBGYN_SS_FIVE_IDS,
  OBGYN_SYMPTOM_BANK,
  OBGYN_STRUCTURED_PE_IDS,
  OBGYN_PE_BANK,
  OBGYN_CONTRACEPTION_OPTIONS,
  OBGYN_DDX_PRESETS,
  OBGYN_PMH_DELTA,
  OBGYN_PSH_DELTA,
  OBGYN_MEDICATIONS_DELTA,
  OBGYN_SOAPE_CAPSULES,
  ADCA_VAN_DIMLS_PRESETS
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
  SURGICAL_SCHEMA,
  DH_SIG_OPTIONS
} from '../../schema.js';
import { getCurrentLanguage } from '../../i18n.js';
import { getIconSvg } from '../../icons.js';
import { smartClinicalSearch } from '../../fuzzy-search.js';

let hostBridge = {
  getState: () => null,
  onStateChange: () => {},
  openSharedCoreTab: () => {},
  switchToSoapMode: () => {}
};

let activeSubMode = 'obstetrics'; // 'obstetrics' | 'gynecology' | 'soape'
let activeTab = 'admission'; // 'admission' | 'hpi' | 'history' | 'shared' | 'pe' | 'workup' | 'plan'
let activeSoapeSection = 'soape_daily';
let symptomSearchQuery = '';
let showAllSymptoms = false;
let obsMenstrualExpanded = false;
let gynPohExpanded = false;
let adcaExpanded = false;
const sharedSearchQueries = { pmh: '', psh: '', dh: '' };
const expandedPeGroups = new Set();
const expandedSharedGroups = new Set();

const OBGYN_TABS = [
  { id: 'admission', icon: 'file-text', fa: '۱. پذیرش، شاخص و سن بارداری', en: '1. Admission, Index & GA' },
  { id: 'hpi', icon: 'activity', fa: '۲. شکایت اصلی و شرح بیماری', en: '2. CC & HPI' },
  { id: 'history', icon: 'calendar', fa: '۳. سوابق مامایی، منس و غربالگری', en: '3. POH, Menstrual & Screen' },
  { id: 'shared', icon: 'grid', fa: '۴. هسته مشترک و سابقه بیهوشی', en: '4. Shared Core & PAHx' },
  { id: 'pe', icon: 'stethoscope', fa: '۵. معاینه تخصصی و TV', en: '5. Ob/Gyn Physical Exam' },
  { id: 'workup', icon: 'ultrasound', fa: '۶. سونوگرافی، NST و آزمایش', en: '6. US, NST & Key Labs' },
  { id: 'plan', icon: 'clipboard', fa: '۷. DDx، پلن و دستورات ADCA', en: '7. DDx, Plan & ADCA' }
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

function hasVal(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
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
  if (OBGYN_TABS.some((t) => t.id === tabId)) {
    activeTab = tabId;
    const state = hostBridge.getState();
    if (state) {
      const ob = ensureObgynStateOnHost(state);
      ob.activeTab = tabId;
    }
  } else if (SOAPE_RAIL_TABS.some((t) => t.id === tabId)) {
    activeSoapeSection = tabId;
    const state = hostBridge.getState();
    if (state) {
      const ob = ensureObgynStateOnHost(state);
      if (tabId === 'discharge_sadaf') ob.dischargeSadaf.active = true;
      if (tabId === 'consult') ob.consultNote.active = true;
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
  let rosCount = 0;
  Object.values(c.ros?.systems || {}).forEach((sys) => {
    Object.values(sys?.items || {}).forEach((v) => {
      const st = v && typeof v === 'object' ? v.state : v;
      if (st === 1 || st === -1) rosCount += 1;
    });
  });
  const labCount = Array.isArray(c.paraclinics?.labs)
    ? c.paraclinics.labs.length
    : Object.keys(c.paraclinics?.selectedLabs || {}).length;
  return { pmhCount, pshCount, dhCount, ahCount, shFhCount, rosCount, labCount };
}

function getTabBadgeCount(tabId, state, ob) {
  if (!ob) return '';
  if (tabId === 'admission') {
    const idx = ob.obstetricIndex || {};
    return hasVal(idx.G) || hasVal(ob.gestationalDating?.lmpDate) || hasVal(ob.gestationalDating?.ntScanDate) ? '1+' : '';
  }
  if (tabId === 'hpi') {
    const presCnt = Array.isArray(ob.ccAndHpi?.presentations) ? ob.ccAndHpi.presentations.length : 0;
    const symCnt = Object.values(ob.ccAndHpi?.symptoms || {}).filter((s) => s?.state === 1 || s?.state === -1).length;
    return presCnt + symCnt > 0 ? String(presCnt + symCnt) : '';
  }
  if (tabId === 'history') {
    const cnt = (ob.pastObstetricHistory?.pregnancies?.length || 0) + (ob.gynScreeningAndRecords?.priorPathologyAndCurettage?.records?.length || 0);
    return cnt > 0 ? String(cnt) : '';
  }
  if (tabId === 'shared') {
    const sc = countSharedCoreStats(state);
    const pahx = ob.gynScreeningAndRecords?.pahx;
    const pahxSet = pahx && (pahx.status === 1 || pahx.status === -1 || pahx.hasPriorAnesthesia) ? 1 : 0;
    const total = sc.pmhCount + sc.pshCount + sc.dhCount + sc.ahCount + sc.shFhCount + pahxSet;
    return total > 0 ? String(total) : '';
  }
  if (tabId === 'pe') {
    const cnt = Object.entries(ob.pe?.findings || {}).filter(([id, f]) => !OBGYN_STRUCTURED_PE_IDS.has(id) && (f?.state === 1 || f?.state === -1)).length;
    return cnt > 0 ? String(cnt) : '';
  }
  if (tabId === 'workup') {
    const klCnt = Object.values(ob.paraclinics?.keyLabs || {}).filter((v) => String(v || '').trim() !== '').length;
    return klCnt > 0 ? String(klCnt) : '';
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
      ? tx(isEn, 'بخش‌های پرونده ژنیکولوژی', 'GYNECOLOGY SECTIONS')
      : tx(isEn, 'بخش‌های پرونده مامایی', 'OBSTETRICS SECTIONS');

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
  const rhLabel = hasVal(idx.maternalBgRh) ? idx.maternalBgRh : tx(isEn, 'Rh: —', 'Rh: —');

  let pills = [];
  if (activeSubMode === 'gynecology') {
    const lmpStr = ob.menstrualHistory?.lmpDate || ob.gestationalDating?.lmpDate || '—';
    const patternStr = ob.menstrualHistory?.regularity === 'irregular'
      ? tx(isEn, 'نامنظم', 'Irregular')
      : ob.menstrualHistory?.regularity === 'regular'
      ? tx(isEn, 'منظم', 'Regular')
      : '—';
    const cObj = OBGYN_CONTRACEPTION_OPTIONS.find((o) => o.val === ob.gynScreeningAndRecords?.contraception?.currentMethod);
    const cStr = cObj ? (isEn ? cObj.en : cObj.fa) : '—';
    pills = [
      `<span class="obgyn-mono-pill">${escapeHtml(formulaCode)}</span>`,
      `<span class="obgyn-mono-pill">LMP: ${escapeHtml(lmpStr)}</span>`,
      patternStr !== '—' ? `<span class="obgyn-mono-pill">${escapeHtml(patternStr)}</span>` : '',
      cStr !== '—' ? `<span class="obgyn-mono-pill">${escapeHtml(cStr)}</span>` : '',
      idx.isVirgin ? `<span class="obgyn-mono-pill is-lock">${getIconSvg('lock', { size: 12 })} Virgin Lock</span>` : ''
    ].filter(Boolean);
  } else {
    const gaNt = ga.gaByNt ? `GA(NT) ${ga.gaByNt.code}` : '';
    const gaLmp = ga.gaByLmp ? `GA(LMP) ${ga.gaByLmp.code}` : '';
    const bishopPill = bishop.assessedCount > 0 ? `<span class="obgyn-mono-pill">Bishop: ${bishop.score}/13</span>` : '';
    const redatePill = ga.redatingAlert?.shouldRedate ? `<span class="obgyn-mono-pill is-alert">Redated -> NT</span>` : '';
    pills = [
      `<span class="obgyn-mono-pill">${escapeHtml(formulaCode)}</span>`,
      gaNt ? `<span class="obgyn-mono-pill">${escapeHtml(gaNt)}</span>` : '',
      gaLmp ? `<span class="obgyn-mono-pill">${escapeHtml(gaLmp)}</span>` : '',
      hasVal(idx.maternalBgRh) ? `<span class="obgyn-mono-pill">${escapeHtml(rhLabel)}</span>` : '',
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
  if (guardrails.previaTvContraindicated && (contextTab === 'hpi' || contextTab === 'pe' || contextTab === 'workup')) {
    alerts.push({ tone: 'danger', icon: 'siren', text: isEn ? guardrails.messages.previaEn : guardrails.messages.previaFa });
  }
  if ((guardrails.accretaDopplerMandatory || guardrails.priorCsIndicationMissing) && (contextTab === 'admission' || contextTab === 'workup')) {
    alerts.push({ tone: 'warning', icon: 'alert-triangle', text: isEn ? guardrails.messages.accretaEn : guardrails.messages.accretaFa });
  }
  if (guardrails.ndCsMismatch && contextTab === 'admission') {
    alerts.push({ tone: 'warning', icon: 'alert-triangle', text: isEn ? guardrails.messages.ndCsEn : guardrails.messages.ndCsFa });
  }
  if (guardrails.bhcgMandatory && (contextTab === 'hpi' || contextTab === 'workup')) {
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

function renderTabAdmission(state, ob, guardrails, isEn) {
  const d = state?.demographics || {};
  const idx = ob.obstetricIndex || {};
  const gd = ob.gestationalDating || {};
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
          <span>${tx(isEn, 'مشخصات دموگرافیک، وضعیت تاهل و بکارت (جنسیت: خانم)', 'Demographics, Marital Status & Virgin Lock (Female)')}</span>
        </div>
        <button type="button" class="obgyn-toggle-chip ${idx.isVirgin ? 'active is-lock' : ''}" id="btnObgynToggleVirgin" aria-pressed="${Boolean(idx.isVirgin)}">
          ${getIconSvg(idx.isVirgin ? 'lock' : 'unlock', { size: 14 })}
          <span>${tx(isEn, idx.isVirgin ? 'Virgin (معاینه داخلی قفل)' : 'غیر Virgin / متاهل', idx.isVirgin ? 'Virgin (Internal Exam Locked)' : 'Non-Virgin')}</span>
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
          <label for="obIdxMarriageYrs">${tx(isEn, 'مدت ازدواج (سال)', 'Marriage Duration (yr)')}</label>
          <input type="number" class="input-text dir-ltr" id="obIdxMarriageYrs" min="0" value="${escapeHtml(idx.marriageDurationYears || '')}" placeholder="4">
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

function renderCompactSplitGrid(items, stateMap, { type, isEn, isLockedFn = null }) {
  return `
    <div class="obgyn-split-grid">
      ${items.map((item) => {
        const entry = stateMap?.[item.id] || { state: 0, modifiers: [], detail: '' };
        const st = entry.state || 0;
        const locked = typeof isLockedFn === 'function' ? isLockedFn(item) : false;
        const hasDrawer = !locked && (st === 1 || st === -1);
        const modsList = (isEn && item.modifiersEn?.length) ? item.modifiersEn : (item.modifiers || []);
        const idAttr = type === 'sym' ? `data-sym-id="${item.id}"` : `data-pe-id="${item.id}"`;
        const detClass = type === 'sym' ? 'obgyn-sym-detail-input' : 'obgyn-pe-detail-input';
        const hint = type === 'pe'
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
          <span>${tx(isEn, '۱. شکایت اصلی (CC) و افزودن یک یا چند تظاهر بالینی (Multi-Presentation HPI)', '1. Chief Complaint (CC) & Multi-Presentation Builder')}</span>
        </div>
        <span class="obgyn-safety-pill">${tx(isEn, 'نرسیده = ثبت‌نشده (≠ منفی)', 'Not Assessed ≠ Negative')}</span>
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
          <span>${tx(isEn, 'چک‌لیست دقیق علائم مثبت و منفی (Split-Pills)', 'Precision Symptom Checklist (Compact Tri-State Grid)')}</span>
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

      <div class="obgyn-field obgyn-mt-md">
        <label for="obHpiExtra">${tx(isEn, 'پاراگراف تکمیلی HPI (آزاد)', 'Additional Free-Text HPI Narrative')}</label>
        <textarea class="input-textarea" id="obHpiExtra" rows="2" placeholder="${tx(isEn, 'سیر مراجعه، اقدامات سرپایی قبل از بستری و جزئیات اضافی...', 'Prior ER visits, outpatient workup, or extra chronology...')}">${escapeHtml(hpi.narrativeExtra || '')}</textarea>
      </div>
    </section>
  `;
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
              ['IUFD', tx(isEn, 'مرده زایی (IUFD)', 'IUFD')],
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

function renderMenstrualAndScreeningHtml(mh, gsr, pathRecs, isEn) {
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
        <label for="obMhFlow">${tx(isEn, 'حجم خونریزی', 'Flow Volume')}</label>
        <select class="input-select" id="obMhFlow">
          <option value="" ${!mh.flowVolume ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          <option value="normal" ${mh.flowVolume === 'normal' ? 'selected' : ''}>${tx(isEn, 'متوسط / طبیعی', 'Moderate / Normal')}</option>
          <option value="light" ${mh.flowVolume === 'light' ? 'selected' : ''}>${tx(isEn, 'کم‌حجم (Hypomenorrhea)', 'Light')}</option>
          <option value="heavy" ${mh.flowVolume === 'heavy' ? 'selected' : ''}>${tx(isEn, 'شدید (HMB)', 'Heavy (HMB)')}</option>
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
      <div class="obgyn-field">
        <label for="obMhPmp">${tx(isEn, 'قاعدگی ماقبل آخر (PMP)', 'Previous Menses (PMP)')}</label>
        <input type="text" class="input-text dir-ltr" id="obMhPmp" value="${escapeHtml(mh.pmpDate || '')}" placeholder="1404/12/06">
      </div>
    </div>

    <div class="obgyn-comp-chips obgyn-mt-sm">
      ${[
        ['clotPassage', 'دفع لخته (Clots)', 'Clot Passage'],
        ['floodingOrNightChange', 'Flooding / تعویض شبانه پد', 'Flooding / Nocturnal Pads'],
        ['imb', 'خونریزی بین‌قاعدگی (IMB)', 'Intermenstrual (IMB)'],
        ['pcb', 'خونریزی پس از نزدیکی (PCB)', 'Postcoital (PCB)'],
        ['isPostmenopausal', 'یائسه (PMB Checklist)', 'Postmenopausal'],
        ['hrtUse', 'مصرف هورمون / HRT', 'Prior HRT Use']
      ].map(([k, faL, enL]) => `
        <button type="button" class="obgyn-toggle-chip ${mh[k] ? 'active' : ''}" data-mh-flag="${k}">
          <span>${escapeHtml(isEn ? enL : faL)}</span>
        </button>
      `).join('')}
    </div>

    <div class="obgyn-form-grid obgyn-cols-4 obgyn-mt-md">
      <div class="obgyn-field is-span-2">
        <label for="obScrContra">${tx(isEn, 'روش پیشگیری فعلی از بارداری', 'Current Contraception Method')}</label>
        <select class="input-select" id="obScrContra">
          <option value="" ${!gsr.contraception?.currentMethod ? 'selected' : ''}>${tx(isEn, '-- انتخاب نشده --', '-- Not selected --')}</option>
          ${OBGYN_CONTRACEPTION_OPTIONS.map((o) => `
            <option value="${o.val}" ${gsr.contraception?.currentMethod === o.val ? 'selected' : ''}>${escapeHtml(isEn ? o.en : o.fa)}</option>
          `).join('')}
        </select>
      </div>
      <div class="obgyn-field">
        <label for="obScrPapDate">${tx(isEn, 'تاریخ آخرین پاپ‌اسمیر', 'Last Pap Date')}</label>
        <input type="text" class="input-text dir-ltr" id="obScrPapDate" value="${escapeHtml(gsr.cervicalAndBreastScreening?.lastPapSmearDate || '')}" placeholder="1403/08">
      </div>
      <div class="obgyn-field">
        <label for="obScrPapRes">${tx(isEn, 'نتیجه پاپ‌اسمیر', 'Pap Smear Result')}</label>
        <input type="text" class="input-text" id="obScrPapRes" value="${escapeHtml(gsr.cervicalAndBreastScreening?.lastPapSmearResult || '')}" placeholder="${tx(isEn, 'NILM / ASCUS / انجام نشده', 'NILM / ASCUS / Not done')}">
      </div>
      <div class="obgyn-field">
        <label for="obScrHpv">${tx(isEn, 'وضعیت تست HPV', 'HPV DNA Status')}</label>
        <input type="text" class="input-text" id="obScrHpv" value="${escapeHtml(gsr.cervicalAndBreastScreening?.hpvTestStatus || '')}" placeholder="${tx(isEn, 'منفی / مثبت (تایپ ۱۶/۱۸)', 'Negative / Positive')}">
      </div>
      <div class="obgyn-field">
        <label for="obScrColpo">${tx(isEn, 'نتیجه کولپوسکوپی قبلی', 'Prior Colposcopy')}</label>
        <input type="text" class="input-text" id="obScrColpo" value="${escapeHtml(gsr.cervicalAndBreastScreening?.priorColposcopyResult || '')}" placeholder="${tx(isEn, 'CIN I / نرمال...', 'CIN I / Normal...')}">
      </div>
      <div class="obgyn-field">
        <label for="obScrMammoDate">${tx(isEn, 'تاریخ ماموگرافی / سونو پستان', 'Mammography / Breast US Date')}</label>
        <input type="text" class="input-text dir-ltr" id="obScrMammoDate" value="${escapeHtml(gsr.cervicalAndBreastScreening?.lastMammographyOrBreastUsDate || '')}" placeholder="1404/02">
      </div>
      <div class="obgyn-field">
        <label for="obScrMammoBirads">${tx(isEn, 'BI-RADS پستان', 'Breast BI-RADS')}</label>
        <input type="text" class="input-text dir-ltr" id="obScrMammoBirads" value="${escapeHtml(gsr.cervicalAndBreastScreening?.lastMammographyBirads || '')}" placeholder="BI-RADS 1/2">
      </div>
    </div>

    <div class="obgyn-mt-sm">
      <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddPathology">
        ${getIconSvg('plus', { size: 14 })}
        <span>${tx(isEn, 'افزودن پاتولوژی / D&C قبلی', 'Add Prior Pathology / D&C')}</span>
      </button>
      ${pathRecs.length > 0 ? `
        <div class="obgyn-preg-list obgyn-mt-xs">
          ${pathRecs.map((rec, rIdx) => `
            <div class="obgyn-preg-row is-path">
              <div class="obgyn-preg-badge">P${rIdx + 1}</div>
              <input type="text" class="input-text dir-ltr obgyn-path-input" data-path-index="${rIdx}" data-path-field="date" value="${escapeHtml(rec.date || '')}" placeholder="${tx(isEn, 'تاریخ', 'Date')}">
              <input type="text" class="input-text obgyn-path-input" data-path-index="${rIdx}" data-path-field="procedureType" value="${escapeHtml(rec.procedureType || '')}" placeholder="${tx(isEn, 'نوع اقدام (D&C / Pipelle)', 'Procedure (D&C / Biopsy)')}">
              <input type="text" class="input-text obgyn-path-input is-wide" data-path-index="${rIdx}" data-path-field="pathologyResult" value="${escapeHtml(rec.pathologyResult || '')}" placeholder="${tx(isEn, 'گزارش پاتولوژی...', 'Pathology report...')}">
              <button type="button" class="obgyn-icon-del" data-del-path="${rIdx}">${getIconSvg('trash', { size: 14 })}</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderTabHistory(state, ob, isEn) {
  const poh = ob.pastObstetricHistory || { priorComplicationFlags: {}, pregnancies: [] };
  const flags = poh.priorComplicationFlags || {};
  const mh = ob.menstrualHistory || {};
  const gsr = ob.gynScreeningAndRecords || {};
  const ac = ob.antenatalCareChecklist || {};
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
  const pathRecs = Array.isArray(gsr.priorPathologyAndCurettage?.records) ? gsr.priorPathologyAndCurettage.records : [];

  if (!isObs) {
    // STRICT GYNECOLOGY: Menstrual + Screening prominent, POH collapsed by default, NO Antenatal Care Checklist
    return `
      <section class="clinical-card obgyn-section-card">
        <div class="card-header">
          <div class="card-title">
            ${getIconSvg('calendar', { size: 16 })}
            <span>${tx(isEn, 'سوابق قاعدگی، یائسگی، پیشگیری و غربالگری (پاپ‌اسمیر / HPV / پاتولوژی)', 'Menstrual History, Contraception & Cervical/Pathology Screening')}</span>
          </div>
        </div>
        ${renderMenstrualAndScreeningHtml(mh, gsr, pathRecs, isEn)}
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
    `;
  }

  // STRICT OBSTETRICS: POH + Antenatal Care open, Menstrual tucked collapsed-by-default
  return `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('list-checks', { size: 16 })}
          <span>${tx(isEn, 'تاریخچه بارداری به بارداری (G1, G2, ...) و عوارض مامایی', 'Pregnancy-by-Pregnancy Table & Prior Complications')}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="btnObgynAddPregnancy">
          ${getIconSvg('plus', { size: 14 })}
          <span>${tx(isEn, 'افزودن بارداری قبلی', 'Add Pregnancy')}</span>
        </button>
      </div>
      ${renderPohSectionHtml(poh, flags, flagDefs, isEn)}
    </section>

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('check-circle', { size: 16 })}
          <span>${tx(isEn, 'چک‌لیست مراقبت‌های دوران بارداری (Antenatal Care Audit)', 'Antenatal Screening & Routine Labs Audit')}</span>
        </div>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obAcReg">${tx(isEn, 'وضعیت مراقبت‌های پره‌ناتال', 'Prenatal Care Regularity')}</label>
          <input type="text" class="input-text" id="obAcReg" value="${escapeHtml(ac.careRegularity || '')}" placeholder="${tx(isEn, 'مراقبت منظم داشته است', 'Regular prenatal care')}">
        </div>
        <div class="obgyn-field">
          <label for="obAcNtMm">${tx(isEn, 'اندازه NT (mm) & Double Marker', '1st-Tri NT (mm) / Risk')}</label>
          <div class="obgyn-inline-pair">
            <input type="text" class="input-text dir-ltr" id="obAcNtMm" value="${escapeHtml(ac.firstTrimesterScreening?.ntMeasurementMm || '')}" placeholder="1.4 mm">
            <input type="text" class="input-text" id="obAcDouble" value="${escapeHtml(ac.firstTrimesterScreening?.doubleMarkerRisk || '')}" placeholder="${tx(isEn, 'کم‌خطر (Low risk)', 'Low risk')}">
          </div>
        </div>
        <div class="obgyn-field">
          <label for="obAcAnom">${tx(isEn, 'آنومالی اسکن سه‌ماهه دوم', '2nd-Tri Anomaly Scan')}</label>
          <input type="text" class="input-text" id="obAcAnom" value="${escapeHtml(ac.secondTrimesterScreening?.anomalyScanResult || '')}" placeholder="${tx(isEn, 'هفته ۱۹ نرمال بدون ناهنجاری', '19w Normal')}">
        </div>
        <div class="obgyn-field">
          <label for="obAcOgtt">${tx(isEn, 'تست قند بارداری (75g OGTT)', 'GDM Screening (75g OGTT)')}</label>
          <input type="text" class="input-text" id="obAcOgtt" value="${escapeHtml(ac.routineAntenatalLabsAudit?.gdmScreening75gOgtt || '')}" placeholder="${tx(isEn, 'نرمال (82/135/110)', 'Normal (82/135/110)')}">
        </div>
        <div class="obgyn-field">
          <label for="obAcViral">${tx(isEn, 'ویرال مارکرها (HBsAg/HCV/HIV)', 'Viral Markers (HBsAg/HCV/HIV)')}</label>
          <input type="text" class="input-text" id="obAcViral" value="${escapeHtml(ac.routineAntenatalLabsAudit?.viralMarkers || '')}" placeholder="${tx(isEn, 'منفی (Non-reactive)', 'Negative')}">
        </div>
        <div class="obgyn-field">
          <label for="obAcTsh">${tx(isEn, 'تیروئید (TSH) و کشت ادرار (U/C)', 'TSH & Urine Culture')}</label>
          <div class="obgyn-inline-pair">
            <input type="text" class="input-text dir-ltr" id="obAcTsh" value="${escapeHtml(ac.routineAntenatalLabsAudit?.tshLevel || '')}" placeholder="TSH 2.1">
            <input type="text" class="input-text" id="obAcUc" value="${escapeHtml(ac.routineAntenatalLabsAudit?.urineCulture || '')}" placeholder="${tx(isEn, 'استریل', 'Sterile')}">
          </div>
        </div>
        <div class="obgyn-field">
          <label for="obAcGbs">${tx(isEn, 'کشت GBS (هفته ۳۵-۳۷)', 'GBS Swab (35-37w)')}</label>
          <input type="text" class="input-text" id="obAcGbs" value="${escapeHtml(ac.routineAntenatalLabsAudit?.gbsSwab35to37w || '')}" placeholder="${tx(isEn, 'منفی / مثبت / انجام نشده', 'Negative / Positive')}">
        </div>
        <div class="obgyn-field">
          <label for="obAcFibroid">${tx(isEn, 'یافته‌های قبلی سونو (فیبروم/پرویا)', 'Prior Fibroids / Previa Hx')}</label>
          <input type="text" class="input-text" id="obAcFibroid" value="${escapeHtml(ac.notableSonographicFindingsInPregnancy?.uterineFibroids || '')}" placeholder="${tx(isEn, 'بدون میوم یا سابقه پرویا', 'None')}">
        </div>
      </div>
      <div class="obgyn-comp-chips obgyn-mt-sm">
        ${[
          ['ntScanDone', 'NT سه‌ماهه اول انجام شده', '1st-Tri NT Completed'],
          ['anomalyScanDone', 'آنومالی اسکن انجام شده', 'Anomaly Scan Completed']
        ].map(([k, faL, enL]) => {
          const checked = k === 'ntScanDone' ? ac.firstTrimesterScreening?.ntScanDone : ac.secondTrimesterScreening?.anomalyScanDone;
          return `<button type="button" class="obgyn-toggle-chip ${checked ? 'active' : ''}" data-ac-flag="${k}"><span>${escapeHtml(isEn ? enL : faL)}</span></button>`;
        }).join('')}
        ${[
          ['folicAcid', 'اسید فولیک', 'Folic Acid'],
          ['ferrousSulfate', 'آهن (Ferrous)', 'Iron'],
          ['calciumVitaminD', 'کلسیم + ویتامین D', 'Ca + Vit D'],
          ['multivitamin', 'مولتی‌ویتامین پره‌ناتال', 'Prenatal MVI']
        ].map(([k, faL, enL]) => `
          <button type="button" class="obgyn-toggle-chip ${ac.supplementsAndVaccines?.[k] ? 'active' : ''}" data-sup-flag="${k}"><span>${escapeHtml(isEn ? enL : faL)}</span></button>
        `).join('')}
      </div>
    </section>

    <section class="clinical-card obgyn-pe-accordion ${obsMenstrualExpanded ? 'is-open' : ''}">
      <div class="obgyn-pe-acc-header">
        <button type="button" class="obgyn-pe-acc-toggle" id="btnToggleObsMenstrualAcc" aria-expanded="${obsMenstrualExpanded}">
          ${getIconSvg(obsMenstrualExpanded ? 'chevron-up' : 'chevron-down', { size: 15 })}
          <strong>${tx(isEn, 'سوابق قاعدگی، پیشگیری از بارداری و پاپ‌اسمیر قبلی (اختیاری)', 'Prior Menstrual, Contraception & Pap History (Optional)')}</strong>
        </button>
      </div>
      ${obsMenstrualExpanded ? `<div class="obgyn-pe-acc-body">${renderMenstrualAndScreeningHtml(mh, gsr, pathRecs, isEn)}</div>` : ''}
    </section>
  `;
}

function renderSharedSearchResults(kind, state, isEn) {
  const q = sharedSearchQueries[kind] || '';
  if (!q.trim()) return '';
  if (kind === 'pmh') {
    const matches = smartClinicalSearch(q, ALL_MASTER_PMH_ITEMS, 12);
    if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'موردی یافت نشد.', 'No match found.')}</div>`;
    return matches.map((it) => `
      <button type="button" class="obgyn-search-result-chip" data-add-shared-pmh="${escapeHtml(it.id)}">
        ${getIconSvg('plus', { size: 12 })}
        <span>${escapeHtml(isEn ? (it.en || it.label) : (it.fa || it.label))}</span>
      </button>
    `).join('');
  }
  if (kind === 'psh') {
    const matches = smartClinicalSearch(q, MASTER_PSH_SURGERIES_BANK, 12);
    if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'موردی یافت نشد.', 'No match found.')}</div>`;
    return matches.map((it) => `
      <button type="button" class="obgyn-search-result-chip" data-add-shared-psh="${escapeHtml(it.id)}">
        ${getIconSvg('plus', { size: 12 })}
        <span>${escapeHtml(isEn ? (it.en || it.label) : (it.fa || it.label))}</span>
      </button>
    `).join('');
  }
  const matches = smartClinicalSearch(q, ALL_MASTER_DRUGS, 12);
  if (matches.length === 0) return `<div class="obgyn-empty-hint">${tx(isEn, 'دارویی یافت نشد.', 'No drug match found.')}</div>`;
  return matches.map((it) => `
    <button type="button" class="obgyn-search-result-chip" data-add-shared-dh="${escapeHtml(it.id)}">
      ${getIconSvg('plus', { size: 12 })}
      <span>${escapeHtml(isEn ? (it.en || it.label) : (it.fa || it.label || it.name))}</span>
    </button>
  `).join('');
}

function renderTabShared(state, ob, isEn) {
  const pahx = ob.gynScreeningAndRecords?.pahx || {};
  const pahxStatus = pahx.status === 1 || pahx.hasPriorAnesthesia ? 1 : (pahx.status === -1 ? -1 : 0);
  const anesTypes = Array.isArray(pahx.anesthesiaTypes) ? pahx.anesthesiaTypes : [];
  const sc = countSharedCoreStats(state);
  const pmhSel = collectSelectedPmhItems(state);
  const pshList = Array.isArray(state?.psh?.surgeries) ? state.psh.surgeries : [];
  const dhList = Array.isArray(state?.dh?.activeDrugs) ? state.dh.activeDrugs : [];
  const ahSel = Array.isArray(state?.ah?.selected) ? state.ah.selected : [];
  const quickDrugs = OBGYN_MEDICATIONS_DELTA.slice(0, 10);

  return `
    <section class="clinical-card obgyn-pahx-mandatory-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('shield', { size: 17 })}
          <span>${tx(isEn, '۶. سابقه بیهوشی و بی‌حسی قبلی (PAHx — ستون الزامی پرونده)', '6. Past Anesthesia History (PAHx — Mandatory Pillar)')}</span>
        </div>
        <div class="obgyn-comp-chips">
          <button type="button" class="obgyn-toggle-chip ${pahxStatus === -1 ? 'active is-danger' : ''}" id="btnObgynPahxNeg">
            <span>${tx(isEn, 'سابقه بیهوشی ندارد (−)', 'No Prior Anesthesia (−)')}</span>
          </button>
          <button type="button" class="obgyn-toggle-chip ${pahxStatus === 1 ? 'active' : ''}" id="btnObgynPahxPos">
            <span>${tx(isEn, 'سابقه بیهوشی دارد (+)', 'Prior Anesthesia (+)')}</span>
          </button>
        </div>
      </div>
      <div class="obgyn-comp-chips">
        ${[
          ['General Anesthesia (GA)', 'بیهوشی عمومی (GA)', 'General Anesthesia (GA)'],
          ['Spinal Anesthesia', 'بی‌حسی نخاعی (Spinal)', 'Spinal Anesthesia'],
          ['Epidural Analgesia', 'اپیدورال (Epidural)', 'Epidural Analgesia'],
          ['Local / Sedation', 'بی‌حسی موضعی / سدیشن', 'Local / Sedation']
        ].map(([val, faL, enL]) => {
          const active = anesTypes.includes(val);
          return `<button type="button" class="obgyn-toggle-chip ${active ? 'active' : ''}" data-pahx-type="${escapeHtml(val)}">${escapeHtml(isEn ? enL : faL)}</button>`;
        }).join('')}
      </div>
      <div class="obgyn-field obgyn-mt-sm">
        <label for="obPahxComp">${tx(isEn, 'عوارض بیهوشی قبلی (انتوباسیون دشوار، تهوع، سردرد اسپاینال...)', 'Anesthesia Complications / Notes')}</label>
        <input type="text" class="input-text" id="obPahxComp" value="${escapeHtml(pahx.complications || '')}" placeholder="${tx(isEn, 'بدون عارضه (Without complications) یا ذکر عارضه خاص', 'Without complications / Difficult airway...')}">
      </div>
    </section>

    <div class="obgyn-pe-accordions obgyn-mt-sm">
      <!-- 1. IN-PLACE PMHx -->
      <div class="clinical-card obgyn-pe-accordion ${expandedSharedGroups.has('pmh') ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" data-shared-acc-toggle="pmh" aria-expanded="${expandedSharedGroups.has('pmh')}">
            ${getIconSvg(expandedSharedGroups.has('pmh') ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, '۳. سوابق بیماری‌های زمینه‌ای (PMHx)', '3. Past Medical History (PMHx)')}</strong>
            <span class="obgyn-pe-count">${state?.pmh?.masterRoutineNegative ? tx(isEn, 'منفی (−)', 'Negative') : sc.pmhCount}</span>
          </button>
          <button type="button" class="obgyn-toggle-chip ${state?.pmh?.masterRoutineNegative ? 'active is-danger' : ''}" id="btnObgynPmhNeg">
            <span>${tx(isEn, 'سابقه بیماری زمینه‌ای ندارد (−)', 'No Chronic PMHx (−)')}</span>
          </button>
        </div>
        ${expandedSharedGroups.has('pmh') ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-search-wrap">
              ${getIconSvg('search', { size: 14 })}
              <input type="search" class="input-text obgyn-inline-search" id="obSharedPmhSearch" value="${escapeHtml(sharedSearchQueries.pmh)}" placeholder="${tx(isEn, 'جستجوی فازی بیماری (مثلاً دیابت، فشار خون، PCOS، آندومتریوز...)', 'Search PMH (DM, HTN, PCOS, Endometriosis...)')}">
            </div>
            <div id="obSharedPmhResults" class="obgyn-comp-chips">${renderSharedSearchResults('pmh', state, isEn)}</div>
            <div class="obgyn-comp-chips">
              ${OBGYN_PMH_DELTA.slice(0, 8).map((it) => {
                const selected = pmhSel.some((p) => p.id === it.id && p.state === 1);
                return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-pmh="${escapeHtml(it.id)}">${escapeHtml(isEn ? it.en : it.fa)}</button>`;
              }).join('')}
            </div>
            ${pmhSel.length > 0 ? `
              <div class="obgyn-selected-list">
                ${pmhSel.map((item) => `
                  <div class="obgyn-selected-row">
                    <strong>${escapeHtml(isEn ? (item.en || item.label) : (item.label || item.fa))}</strong>
                    <input type="text" class="input-text obgyn-shared-pmh-det" data-pmh-cat="${escapeHtml(item.catId)}" data-pmh-id="${escapeHtml(item.id)}" value="${escapeHtml(item.detail || '')}" placeholder="${tx(isEn, 'توضیح / مدت...', 'Detail / year...')}">
                    <button type="button" class="obgyn-icon-del" data-del-shared-pmh="${escapeHtml(item.id)}" data-pmh-cat="${escapeHtml(item.catId)}">${getIconSvg('x', { size: 13 })}</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- 2. IN-PLACE PSHx -->
      <div class="clinical-card obgyn-pe-accordion ${expandedSharedGroups.has('psh') ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" data-shared-acc-toggle="psh" aria-expanded="${expandedSharedGroups.has('psh')}">
            ${getIconSvg(expandedSharedGroups.has('psh') ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, '۴. سوابق جراحی و پروسیجرهای قبلی (PSHx)', '4. Past Surgical History (PSHx)')}</strong>
            <span class="obgyn-pe-count">${state?.psh?.noSurgeries ? tx(isEn, 'منفی (−)', 'Negative') : sc.pshCount}</span>
          </button>
          <button type="button" class="obgyn-toggle-chip ${state?.psh?.noSurgeries ? 'active is-danger' : ''}" id="btnObgynPshNeg">
            <span>${tx(isEn, 'سابقه جراحی ندارد (−)', 'No Prior Surgeries (−)')}</span>
          </button>
        </div>
        ${expandedSharedGroups.has('psh') ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-search-wrap">
              ${getIconSvg('search', { size: 14 })}
              <input type="search" class="input-text obgyn-inline-search" id="obSharedPshSearch" value="${escapeHtml(sharedSearchQueries.psh)}" placeholder="${tx(isEn, 'جستجوی جراحی (سزارین، کورتاژ، میومکتومی، آپاندکتومی...)', 'Search surgical procedure (CS, D&C, Myomectomy...)')}">
            </div>
            <div id="obSharedPshResults" class="obgyn-comp-chips">${renderSharedSearchResults('psh', state, isEn)}</div>
            <div class="obgyn-comp-chips">
              ${OBGYN_PSH_DELTA.slice(0, 8).map((it) => {
                const selected = pshList.some((s) => s.id === it.id);
                return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-psh="${escapeHtml(it.id)}">${escapeHtml(isEn ? it.en : it.fa)}</button>`;
              }).join('')}
            </div>
            ${pshList.length > 0 ? `
              <div class="obgyn-selected-list">
                ${pshList.map((s, sIdx) => `
                  <div class="obgyn-selected-row is-psh">
                    <strong>${escapeHtml(isEn ? (s.en || s.label) : (s.label || s.procedure))}</strong>
                    <input type="text" class="input-text dir-ltr obgyn-shared-psh-inp" data-psh-idx="${sIdx}" data-psh-fld="year" value="${escapeHtml(s.year || '')}" placeholder="${tx(isEn, 'سال', 'Year')}">
                    <input type="text" class="input-text obgyn-shared-psh-inp" data-psh-idx="${sIdx}" data-psh-fld="note" value="${escapeHtml(s.note || '')}" placeholder="${tx(isEn, 'توضیح / عارضه', 'Detail / outcome')}">
                    <button type="button" class="obgyn-icon-del" data-del-shared-psh="${sIdx}">${getIconSvg('trash', { size: 13 })}</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- 3. IN-PLACE DRUG Hx -->
      <div class="clinical-card obgyn-pe-accordion ${expandedSharedGroups.has('dh') ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" data-shared-acc-toggle="dh" aria-expanded="${expandedSharedGroups.has('dh')}">
            ${getIconSvg(expandedSharedGroups.has('dh') ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, '۵. داروهای مصرفی بیمار (Drug Hx — ۶۴۳ داروی هسته مشترک + زنان)', '5. Medication History (Drug Hx — 643 Merged Drugs)')}</strong>
            <span class="obgyn-pe-count">${state?.dh?.noRoutineMeds ? tx(isEn, 'منفی (−)', 'Negative') : sc.dhCount}</span>
          </button>
          <button type="button" class="obgyn-toggle-chip ${state?.dh?.noRoutineMeds ? 'active is-danger' : ''}" id="btnObgynDhNeg">
            <span>${tx(isEn, 'داروی مصرفی ندارد (−)', 'No Routine Meds (−)')}</span>
          </button>
        </div>
        ${expandedSharedGroups.has('dh') ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-search-wrap">
              ${getIconSvg('search', { size: 14 })}
              <input type="search" class="input-text obgyn-inline-search" id="obSharedDhSearch" value="${escapeHtml(sharedSearchQueries.dh)}" placeholder="${tx(isEn, 'جستجوی فازی دارو (فارسی/برند/انگلیسی مثلاً متیل‌دوپا، ففول، LD، سولفات...)', 'Search drug formulary (Methyldopa, Fefol, OCP, MgSO4...)')}">
            </div>
            <div id="obSharedDhResults" class="obgyn-comp-chips">${renderSharedSearchResults('dh', state, isEn)}</div>
            <div class="obgyn-comp-chips">
              ${quickDrugs.map((dr) => {
                const selected = dhList.some((x) => x.id === dr.id);
                return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-add-shared-dh="${escapeHtml(dr.id)}">${escapeHtml(isEn ? dr.en : dr.fa)}</button>`;
              }).join('')}
            </div>
            ${dhList.length > 0 ? `
              <div class="obgyn-selected-list">
                ${dhList.map((dr, dIdx) => `
                  <div class="obgyn-selected-row is-dh">
                    <strong>${escapeHtml(isEn ? (dr.en || dr.name) : (dr.name || dr.label))}</strong>
                    <input type="text" class="input-text dir-ltr obgyn-shared-dh-inp" data-dh-idx="${dIdx}" data-dh-fld="dose" value="${escapeHtml(dr.dose || '')}" placeholder="${tx(isEn, 'دوز (مثلاً 250mg)', 'Dose')}">
                    <select class="input-select obgyn-shared-dh-inp" data-dh-idx="${dIdx}" data-dh-fld="sig">
                      ${DH_SIG_OPTIONS.map((opt) => `<option value="${escapeHtml(opt)}" ${dr.sig === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
                    </select>
                    <button type="button" class="obgyn-icon-del" data-del-shared-dh="${dIdx}">${getIconSvg('trash', { size: 13 })}</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- 4. IN-PLACE ALLERGY -->
      <div class="clinical-card obgyn-pe-accordion ${expandedSharedGroups.has('ah') ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" data-shared-acc-toggle="ah" aria-expanded="${expandedSharedGroups.has('ah')}">
            ${getIconSvg(expandedSharedGroups.has('ah') ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, '۷. سوابق حساسیت دارویی و غذایی (Allergies)', '7. Drug & Food Allergies')}</strong>
            <span class="obgyn-pe-count">${state?.ah?.nkda ? 'NKDA' : sc.ahCount}</span>
          </button>
          <button type="button" class="obgyn-toggle-chip ${state?.ah?.nkda ? 'active is-danger' : ''}" id="btnObgynAhNkda">
            <span>${tx(isEn, 'حساسیت دارویی ندارد (NKDA)', 'No Known Drug Allergies (NKDA)')}</span>
          </button>
        </div>
        ${expandedSharedGroups.has('ah') ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-comp-chips">
              ${(SURGICAL_SCHEMA.allergyTemplates || []).map((t) => {
                const selected = ahSel.some((x) => x.id === t.id);
                return `<button type="button" class="obgyn-toggle-chip ${selected ? 'active' : ''}" data-toggle-shared-ah="${escapeHtml(t.id)}">${escapeHtml(t.label)}</button>`;
              }).join('')}
            </div>
            <div class="obgyn-field">
              <label for="obSharedAhNote">${tx(isEn, 'توضیح واکنش آلرژیک', 'Allergy Reaction / Custom Allergen')}</label>
              <input type="text" class="input-text" id="obSharedAhNote" value="${escapeHtml(state?.ah?.note || '')}" placeholder="${tx(isEn, 'مثلاً راش خارش‌دار به پنی‌سیلین...', 'e.g. Urticaria to Penicillin...')}">
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 5. IN-PLACE SH / FH / ROS -->
      <div class="clinical-card obgyn-pe-accordion ${expandedSharedGroups.has('shfh') ? 'is-open' : ''}">
        <div class="obgyn-pe-acc-header">
          <button type="button" class="obgyn-pe-acc-toggle" data-shared-acc-toggle="shfh" aria-expanded="${expandedSharedGroups.has('shfh')}">
            ${getIconSvg(expandedSharedGroups.has('shfh') ? 'chevron-up' : 'chevron-down', { size: 15 })}
            <strong>${tx(isEn, 'عادات (SH)، سابقه فامیلی (FH) و مرور سیستم‌ها (ROS)', 'Social Hx (SH), Family Hx (FH) & Optional Core ROS')}</strong>
            <span class="obgyn-pe-count">${sc.shFhCount + sc.rosCount}</span>
          </button>
        </div>
        ${expandedSharedGroups.has('shfh') ? `
          <div class="obgyn-pe-acc-body">
            <div class="obgyn-comp-chips">
              <button type="button" class="obgyn-toggle-chip ${state?.sh?.negSmoking ? 'active' : ''}" data-sh-toggle="negSmoking">${tx(isEn, 'عدم مصرف سیگار (−)', 'Non-Smoker (−)')}</button>
              <button type="button" class="obgyn-toggle-chip ${state?.sh?.negOpium ? 'active' : ''}" data-sh-toggle="negOpium">${tx(isEn, 'عدم مصرف مخدر (−)', 'No Opium (−)')}</button>
              <button type="button" class="obgyn-toggle-chip ${state?.sh?.negAlcohol ? 'active' : ''}" data-sh-toggle="negAlcohol">${tx(isEn, 'عدم مصرف الکل (−)', 'No Alcohol (−)')}</button>
              <button type="button" class="obgyn-toggle-chip ${state?.fh?.negFamilyHistory ? 'active' : ''}" id="btnObgynFhNeg">${tx(isEn, 'سابقه فامیلی منفی (−)', 'Negative Family Hx (−)')}</button>
            </div>
            <div class="obgyn-form-grid obgyn-cols-2">
              <div class="obgyn-field">
                <label for="obSharedShNote">${tx(isEn, 'توضیح عادات / شغل', 'Social Habits Note')}</label>
                <input type="text" class="input-text" id="obSharedShNote" value="${escapeHtml(state?.sh?.note || '')}" placeholder="${tx(isEn, 'توضیح...', 'Details...')}">
              </div>
              <div class="obgyn-field">
                <label for="obSharedFhNote">${tx(isEn, 'سابقه فامیلی (سرطان پستان/تخمدان، دیابت، HTN...)', 'Family Hx (BRCA, DM, HTN...)')}</label>
                <input type="text" class="input-text" id="obSharedFhNote" value="${escapeHtml(state?.fh?.note || '')}" placeholder="${tx(isEn, 'مادر: دیابت و پرفشاری خون...', 'Mother: DM, HTN...')}">
              </div>
            </div>
            <div class="obgyn-comp-chips">
              <button type="button" class="obgyn-shared-bridge-btn" data-open-shared-tab="tab-ros">
                ${getIconSvg('coreLink', { size: 14 })}
                <span>${tx(isEn, `مرور جامع ۱۰ سیستمی ROS (${sc.rosCount})`, `Full 10-System Core ROS (${sc.rosCount})`)}</span>
              </button>
              <button type="button" class="obgyn-shared-bridge-btn" data-open-shared-tab="tab-paraclinics">
                ${getIconSvg('coreLink', { size: 14 })}
                <span>${tx(isEn, `پنل پاراکلینیک جامع (${sc.labCount})`, `Full Core Paraclinics (${sc.labCount})`)}</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderTabPe(state, ob, guardrails, isEn) {
  const v = ob.pe?.vitals || {};
  const om = ob.pe?.obsMeasurements || {};
  const findings = ob.pe?.findings || {};
  const isGyn = activeSubMode === 'gynecology';
  const subKey = isGyn ? 'gynecology' : 'obstetrics';
  const bishop = calculateBishopScore(om);

  // Filter strictly non-duplicated qualitative PE items separated cleanly by subMode
  const items = OBGYN_PE_BANK.filter((it) =>
    !OBGYN_STRUCTURED_PE_IDS.has(it.id) &&
    (it.subMode === 'both' || it.subMode === subKey)
  );
  const groupOrder = [];
  const grouped = new Map();
  items.forEach((it) => {
    if (!grouped.has(it.subGroup)) {
      grouped.set(it.subGroup, { subGroupFa: it.subGroup, subGroupEn: it.subGroupEn, items: [] });
      groupOrder.push(it.subGroup);
    }
    grouped.get(it.subGroup).items.push(it);
  });

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'pe')}

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('activity', { size: 16 })}
          <span>${tx(isEn, isGyn ? 'علائم حیاتی (Vital Signs)' : 'علائم حیاتی (Vital Signs) و پروتئین ادرار', isGyn ? 'Bedside Vital Signs' : 'Bedside Vital Signs & Urine Dipstick')}</span>
        </div>
      </div>
      <div class="obgyn-form-grid ${isGyn ? 'obgyn-cols-4' : 'obgyn-cols-6'}">
        <div class="obgyn-field">
          <label for="obPeBp">BP (mmHg)</label>
          <input type="text" class="input-text dir-ltr" id="obPeBp" value="${escapeHtml(v.bp || '')}" placeholder="120/80">
        </div>
        ${!isGyn ? `
        <div class="obgyn-field">
          <label for="obPeBpRep">${tx(isEn, 'تکرار BP (پس از ۴h)', 'Repeat BP')}</label>
          <input type="text" class="input-text dir-ltr" id="obPeBpRep" value="${escapeHtml(v.bpRepeat || '')}" placeholder="160/105">
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

    ${!isGyn ? `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('stethoscope', { size: 16 })}
          <span>${tx(isEn, 'اندازه‌گیری‌های شکم حاملگی، FHR و معاینه واژینال مامایی (TV / Bishop)', 'Obstetric FHR, Fundal Height & Vaginal Exam (TV / Bishop)')}</span>
        </div>
        <span id="obgynBishopBadge" class="obgyn-bishop-badge is-${bishop.status}">
          ${escapeHtml(bishop.assessedCount > 0 ? (isEn ? bishop.labelEn : bishop.labelFa) : tx(isEn, 'Bishop Score: معیارها را وارد کنید', 'Bishop Score: Enter TV params'))}
        </span>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obPeFhr">FHR (bpm)</label>
          <input type="text" class="input-text dir-ltr" id="obPeFhr" value="${escapeHtml(om.fhr || '')}" placeholder="142">
        </div>
        <div class="obgyn-field">
          <label for="obPeFhrQuad">${tx(isEn, 'کوادران سمع FHR', 'FHR Quadrant')}</label>
          <select class="input-select dir-ltr" id="obPeFhrQuad">
            <option value="">—</option>
            ${['LLQ', 'RLQ', 'LUQ', 'RUQ', 'Midline'].map((q) => `<option value="${q}" ${om.fhrQuadrant === q ? 'selected' : ''}>${q}</option>`).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obPeFh">${tx(isEn, 'ارتفاع فوندوس رحم FH (cm)', 'Fundal Height (cm)')}</label>
          <input type="text" class="input-text dir-ltr" id="obPeFh" value="${escapeHtml(om.fundalHeightCm || '')}" placeholder="34">
        </div>
        <div class="obgyn-field">
          <label for="obPePres">${tx(isEn, 'عضو پرزانته', 'Presenting Part')}</label>
          <select class="input-select" id="obPePres" ${guardrails.virginLock ? 'disabled' : ''}>
            <option value="">—</option>
            <option value="سفالیک (Cephalic)" ${om.presentingPart === 'سفالیک (Cephalic)' ? 'selected' : ''}>${tx(isEn, 'سفالیک (Cephalic)', 'Cephalic')}</option>
            <option value="بریچ (Breech)" ${om.presentingPart === 'بریچ (Breech)' ? 'selected' : ''}>${tx(isEn, 'بریچ (Breech)', 'Breech')}</option>
            <option value="عرضی / شانه" ${om.presentingPart === 'عرضی / شانه' ? 'selected' : ''}>${tx(isEn, 'عرضی / شانه', 'Transverse / Shoulder')}</option>
            <option value="خارج از دسترس (High)" ${om.presentingPart === 'خارج از دسترس (High)' ? 'selected' : ''}>${tx(isEn, 'خارج از دسترس (High)', 'High / Unengaged')}</option>
          </select>
        </div>
      </div>

      <div class="obgyn-tv-box ${guardrails.virginLock ? 'is-locked' : guardrails.previaTvContraindicated ? 'is-previa-warn' : ''} obgyn-mt-sm">
        <div class="obgyn-form-grid obgyn-cols-4">
          <div class="obgyn-field">
            <label for="obPeDil">${tx(isEn, 'دیلاتاسیون (cm)', 'Dilation (cm)')}</label>
            <input type="text" class="input-text dir-ltr" id="obPeDil" value="${escapeHtml(om.dilationCm ?? '')}" placeholder="0 - 10" ${guardrails.virginLock ? 'disabled' : ''}>
          </div>
          <div class="obgyn-field">
            <label for="obPeEff">${tx(isEn, 'افاسمان (%)', 'Effacement (%)')}</label>
            <input type="text" class="input-text dir-ltr" id="obPeEff" value="${escapeHtml(om.effacementPct ?? '')}" placeholder="0 - 100" ${guardrails.virginLock ? 'disabled' : ''}>
          </div>
          <div class="obgyn-field">
            <label for="obPeStation">${tx(isEn, 'Station و مقیاس', 'Station & Scale')}</label>
            <div class="obgyn-inline-pair">
              <select class="input-select dir-ltr" id="obPeStationScale" ${guardrails.virginLock ? 'disabled' : ''}>
                <option value="5" ${om.stationScale !== '3' ? 'selected' : ''}>-5..+5 [UNI]</option>
                <option value="3" ${om.stationScale === '3' ? 'selected' : ''}>-3..+3 [REF]</option>
              </select>
              <input type="text" class="input-text dir-ltr" id="obPeStation" value="${escapeHtml(om.stationValue ?? '')}" placeholder="-3" ${guardrails.virginLock ? 'disabled' : ''}>
            </div>
          </div>
          <div class="obgyn-field">
            <label for="obPeCons">${tx(isEn, 'قوام و موقعیت سرویکس', 'Consistency & Position')}</label>
            <div class="obgyn-inline-pair">
              <select class="input-select" id="obPeCons" ${guardrails.virginLock ? 'disabled' : ''}>
                <option value="">${tx(isEn, 'قوام...', 'Firmness...')}</option>
                <option value="firm" ${om.cervixConsistency === 'firm' ? 'selected' : ''}>${tx(isEn, 'سفت (Firm)', 'Firm')}</option>
                <option value="medium" ${om.cervixConsistency === 'medium' ? 'selected' : ''}>${tx(isEn, 'متوسط', 'Medium')}</option>
                <option value="soft" ${om.cervixConsistency === 'soft' ? 'selected' : ''}>${tx(isEn, 'نرم (Soft)', 'Soft')}</option>
              </select>
              <select class="input-select" id="obPePos" ${guardrails.virginLock ? 'disabled' : ''}>
                <option value="">${tx(isEn, 'موقعیت...', 'Position...')}</option>
                <option value="posterior" ${om.cervixPosition === 'posterior' ? 'selected' : ''}>${tx(isEn, 'خلفی', 'Posterior')}</option>
                <option value="mid" ${om.cervixPosition === 'mid' ? 'selected' : ''}>${tx(isEn, 'میانی', 'Mid')}</option>
                <option value="anterior" ${om.cervixPosition === 'anterior' ? 'selected' : ''}>${tx(isEn, 'قدامی', 'Anterior')}</option>
              </select>
            </div>
          </div>
          <div class="obgyn-field is-span-2">
            <label for="obPeMembranes">${tx(isEn, 'وضعیت پرده‌ها (Intact / Ruptured)', 'Membranes Status')}</label>
            <select class="input-select" id="obPeMembranes" ${guardrails.virginLock ? 'disabled' : ''}>
              <option value="">—</option>
              <option value="سالم (Intact)" ${om.membranesStatus === 'سالم (Intact)' ? 'selected' : ''}>${tx(isEn, 'سالم (Intact)', 'Intact')}</option>
              <option value="پاره (Ruptured)" ${om.membranesStatus === 'پاره (Ruptured)' ? 'selected' : ''}>${tx(isEn, 'پاره (Ruptured)', 'Ruptured')}</option>
            </select>
          </div>
          <div class="obgyn-field is-span-2">
            <label for="obPeFluidChar">${tx(isEn, 'رنگ و بوی مایع آمنیوتیک', 'Amniotic Fluid Character')}</label>
            <input type="text" class="input-text" id="obPeFluidChar" value="${escapeHtml(om.amnioticFluidChar || '')}" placeholder="${tx(isEn, 'شفاف / مکونیوم / خونی / بدون بوی بد', 'Clear / Meconium / No odor')}" ${guardrails.virginLock ? 'disabled' : ''}>
          </div>
        </div>
      </div>
    </section>` : ''}

    <div class="obgyn-pe-accordions">
      ${groupOrder.map((grpKey) => {
        const grp = grouped.get(grpKey);
        const isOpen = expandedPeGroups.has(grpKey);
        const assessedCnt = grp.items.filter((it) => {
          const st = findings[it.id]?.state;
          return st === 1 || st === -1;
        }).length;
        const hasNormalTargets = grp.items.some((it) => (it.normalState === 1 || it.normalState === -1) && !(guardrails.virginLock && it.isInternalPelvic));

        return `
          <div class="clinical-card obgyn-pe-accordion ${isOpen ? 'is-open' : ''}">
            <div class="obgyn-pe-acc-header">
              <button type="button" class="obgyn-pe-acc-toggle" data-pe-group-toggle="${escapeHtml(grpKey)}" aria-expanded="${isOpen}">
                ${getIconSvg(isOpen ? 'chevron-up' : 'chevron-down', { size: 15 })}
                <strong>${escapeHtml(isEn ? grp.subGroupEn : grp.subGroupFa)}</strong>
                <span class="obgyn-pe-count">${assessedCnt}/${grp.items.length}</span>
              </button>
              ${hasNormalTargets ? `
                <button type="button" class="obgyn-normal-sec-btn" data-pe-normal-group="${escapeHtml(grpKey)}">
                  ${getIconSvg('check-circle', { size: 13 })}
                  <span>${tx(isEn, 'ثبت معاینه نرمال این بخش', 'Record Normal Exam')}</span>
                </button>
              ` : ''}
            </div>
            ${isOpen ? `
              <div class="obgyn-pe-acc-body">
                ${renderCompactSplitGrid(grp.items, findings, {
                  type: 'pe',
                  isEn,
                  isLockedFn: (it) => guardrails.virginLock && it.isInternalPelvic
                })}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTabWorkup(state, ob, guardrails, isEn) {
  const us = ob.paraclinics?.lastObstetricUltrasound || {};
  const tvs = ob.paraclinics?.gynecologicUltrasound || {};
  const fm = ob.paraclinics?.fetalMonitoring || {};
  const dec = fm.decelerations || { variablePathologicalFlags: {} };
  const kl = ob.paraclinics?.keyLabs || {};
  const nichd = evaluateNichdCategory(fm);
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

  return `
    ${renderGuardrailBannersHtml(guardrails, isEn, 'workup')}

    ${!isGyn ? `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('ultrasound', { size: 16 })}
          <span>${tx(isEn, 'آخرین سونوگرافی بارداری (۶ محور الزامی + داپلر آکرتا)', 'Last Obstetric Ultrasound (6 Checkpoints + Accreta Doppler)')}</span>
        </div>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obUsDate">${tx(isEn, 'تاریخ سونوگرافی', 'Scan Date')}</label>
          <input type="text" class="input-text dir-ltr" id="obUsDate" value="${escapeHtml(us.scanDate || '')}" placeholder="1405/01/15">
        </div>
        <div class="obgyn-field">
          <label for="obUsPres">${tx(isEn, '۱. پرزانتاسیون و ضربان', '1. Presentation & FHR')}</label>
          <input type="text" class="input-text" id="obUsPres" value="${escapeHtml(us.presentation || '')}" placeholder="${tx(isEn, 'سفالیک، FHR نرمال', 'Cephalic, normal FHR')}">
        </div>
        <div class="obgyn-field">
          <label for="obUsPlacenta">${tx(isEn, '۲. محل و گرید جفت', '2. Placental Location & Grade')}</label>
          <input type="text" class="input-text" id="obUsPlacenta" value="${escapeHtml(us.placentalLocationAndGrade || '')}" placeholder="${tx(isEn, 'قدامی گرید ۲ / پایین یا پرویا', 'Anterior Gr II')}">
        </div>
        <div class="obgyn-field">
          <label for="obUsFluid">${tx(isEn, '۳. مایع آمنیوتیک (AFI/MVP)', '3. Amniotic Fluid (AFI)')}</label>
          <input type="text" class="input-text" id="obUsFluid" value="${escapeHtml(us.amnioticFluidVolume || '')}" placeholder="${tx(isEn, 'نرمال (AFI 12 cm)', 'Normal (AFI 12 cm)')}">
        </div>
        <div class="obgyn-field">
          <label for="obUsGa">${tx(isEn, '۴. سن بارداری سونو', '4. Sonographic GA')}</label>
          <input type="text" class="input-text dir-ltr" id="obUsGa" value="${escapeHtml(us.sonographicGa || '')}" placeholder="34W+2d">
        </div>
        <div class="obgyn-field">
          <label for="obUsEfw">${tx(isEn, '۵. وزن تخمینی (EFW) و صدک', '5. EFW (g) & Percentile')}</label>
          <input type="text" class="input-text" id="obUsEfw" value="${escapeHtml(us.efwGramsAndPercentile || '')}" placeholder="${tx(isEn, '2300 g (صدک ۳۰)', '2300 g (30th %ile)')}">
        </div>
        <div class="obgyn-field is-span-2 ${guardrails.accretaDopplerMandatory ? 'is-amber-mandatory' : ''}">
          <label for="obUsAccreta">${tx(isEn, '۶. کالرداپلر آکرتای جفت (الزامی در سابقه CS)', '6. Placenta Accreta Color Doppler (Mandatory if prior CS)')}</label>
          <input type="text" class="input-text" id="obUsAccreta" value="${escapeHtml(us.placentaAccretaColorDoppler || '')}" placeholder="${tx(isEn, 'فاقد شواهد چسبندگی جفت (No Accreta)', 'No sonographic signs of placenta accreta')}">
        </div>
        <div class="obgyn-field">
          <label for="obUsBpp">BPP Score</label>
          <input type="text" class="input-text dir-ltr" id="obUsBpp" value="${escapeHtml(us.bppScore || '')}" placeholder="8/8">
        </div>
        <div class="obgyn-field is-span-2">
          <label for="obUsDoppler">${tx(isEn, 'داپلر نافی / مغزی (UA/MCA PI)', 'Umbilical / MCA Doppler')}</label>
          <input type="text" class="input-text" id="obUsDoppler" value="${escapeHtml(us.umbilicalAndMcaDoppler || '')}" placeholder="${tx(isEn, 'UA-PI نرمال، جریان دیاستولیک مثبت', 'Normal UA-PI, positive EDF')}">
        </div>
        <div class="obgyn-field">
          <label for="obUsCl">${tx(isEn, 'طول سرویکس (mm)', 'Cervical Length (mm)')}</label>
          <input type="text" class="input-text dir-ltr" id="obUsCl" value="${escapeHtml(us.cervicalLengthMm || '')}" placeholder="32 mm">
        </div>
      </div>
    </section>

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('activity', { size: 16 })}
          <span>${tx(isEn, 'ابزار تفسیر ۵ مرحله‌ای NST / EFM و رده‌بندی خودکار NICHD', '5-Step NST / FHT Builder & Auto NICHD Evaluator')}</span>
        </div>
        <span id="obgynNichdBadge" class="obgyn-nichd-badge is-${nichd.category === 'Category III' ? 'cat3' : nichd.category === 'Category I' ? 'cat1' : 'cat2'}">
          ${escapeHtml(fm.baselineBpm || fm.variability ? (isEn ? nichd.labelEn : nichd.labelFa) : tx(isEn, 'NICHD: پارامترهای NST را وارد کنید', 'NICHD: Enter NST trace'))}
        </span>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obNstType">${tx(isEn, 'نوع تست', 'Test Modality')}</label>
          <select class="input-select dir-ltr" id="obNstType">
            ${['NST', 'OCT', 'Continuous EFM'].map((m) => `<option value="${m}" ${fm.testType === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obNstBase">${tx(isEn, '۱. ضربان پایه Baseline (bpm)', '1. Baseline FHR (bpm)')}</label>
          <input type="number" class="input-text dir-ltr" id="obNstBase" value="${escapeHtml(fm.baselineBpm || '')}" placeholder="140">
        </div>
        <div class="obgyn-field">
          <label for="obNstVar">${tx(isEn, '۲. تغییرپذیری (Variability)', '2. Variability')}</label>
          <select class="input-select" id="obNstVar">
            <option value="">—</option>
            ${['Moderate', 'Minimal', 'Absent', 'Marked'].map((vr) => `<option value="${vr}" ${fm.variability === vr ? 'selected' : ''}>${vr}</option>`).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obNstAccel">${tx(isEn, '۳. تسریع (Accelerations)', '3. Accelerations')}</label>
          <input type="text" class="input-text" id="obNstAccel" value="${escapeHtml(fm.accelerations || '')}" placeholder="${tx(isEn, 'Reactive (2x >=15bpm for 15s)', 'Present / Reactive')}">
        </div>
        <div class="obgyn-field">
          <label for="obNstDecelType">${tx(isEn, '۴. افت ضربان (Decelerations)', '4. Deceleration Type')}</label>
          <select class="input-select" id="obNstDecelType">
            ${['None', 'Early', 'Variable', 'Late', 'Prolonged'].map((tp) => `<option value="${tp}" ${dec.type === tp ? 'selected' : ''}>${tp}</option>`).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obNstVariant">${tx(isEn, 'الگوی خاص (Sinusoidal / Saltatory)', 'Special Variant')}</label>
          <select class="input-select" id="obNstVariant">
            ${['None', 'Saltatory', 'Sinusoidal'].map((vt) => `<option value="${vt}" ${dec.cordCompressionPatternVariant === vt ? 'selected' : ''}>${vt}</option>`).join('')}
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obNstCtx">${tx(isEn, '۵. انقباضات رحمی در ۱۰ دقیقه', '5. Contractions / 10 min')}</label>
          <input type="text" class="input-text" id="obNstCtx" value="${escapeHtml(fm.contractionsIn10Min || '')}" placeholder="${tx(isEn, 'ندارد / ۳ بار در ۱۰ دقیقه', 'None / 3 in 10 min')}">
        </div>
        <div class="obgyn-field obgyn-flex-end">
          <button type="button" class="obgyn-toggle-chip ${dec.isRecurrent ? 'active' : ''}" id="btnObgynDecelRecurrent">
            <span>${tx(isEn, 'افت راجعه (>=50% انقباضات)', 'Recurrent (>=50%)')}</span>
          </button>
        </div>
      </div>

      ${dec.type === 'Variable' ? `
        <div class="obgyn-var-decel-box obgyn-mt-sm">
          <strong>${tx(isEn, 'معیارهای افت متغیر پاتولوژیک (Pathological Variable Decelerations):', 'Pathological Variable Deceleration Criteria:')}</strong>
          <div class="obgyn-comp-chips obgyn-mt-xs">
            ${[
              ['dropBelow70Bpm', 'افت زیر 70 bpm', 'Drop <70 bpm'],
              ['durationOver60Sec', 'طول افت بیش از 60 ثانیه', 'Duration >60 sec'],
              ['moreThan3In20Min', 'بیش از ۳ بار در ۲۰ دقیقه', '>3 times / 20 min']
            ].map(([k, faL, enL]) => `
              <button type="button" class="obgyn-toggle-chip ${dec.variablePathologicalFlags?.[k] ? 'active is-danger' : ''}" data-var-flag="${k}">${escapeHtml(isEn ? enL : faL)}</button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </section>` : `
    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('ultrasound', { size: 16 })}
          <span>${tx(isEn, 'سونوگرافی واژینال / شکمی ژنیکولوژی (TAS / TVS)', 'Gynecologic Pelvic Ultrasound (TAS / TVS)')}</span>
        </div>
      </div>
      <div class="obgyn-form-grid obgyn-cols-4">
        <div class="obgyn-field">
          <label for="obTvsType">${tx(isEn, 'روش سونوگرافی', 'Scan Modality')}</label>
          <select class="input-select dir-ltr" id="obTvsType">
            <option value="TVS" ${tvs.scanType === 'TVS' ? 'selected' : ''}>TVS (Transvaginal)</option>
            <option value="TAS" ${tvs.scanType === 'TAS' ? 'selected' : ''}>TAS (Transabdominal)</option>
          </select>
        </div>
        <div class="obgyn-field">
          <label for="obTvsDate">${tx(isEn, 'تاریخ سونو', 'Scan Date')}</label>
          <input type="text" class="input-text dir-ltr" id="obTvsDate" value="${escapeHtml(tvs.scanDate || '')}" placeholder="1405/01/15">
        </div>
        <div class="obgyn-field">
          <label for="obTvsUterus">${tx(isEn, 'ابعاد رحم (mm)', 'Uterus Size (mm)')}</label>
          <input type="text" class="input-text dir-ltr" id="obTvsUterus" value="${escapeHtml(tvs.uterusDimensionsMm || '')}" placeholder="82 x 48 mm">
        </div>
        <div class="obgyn-field">
          <label for="obTvsEt">${tx(isEn, 'ضخامت اندومتر ET (mm)', 'Endometrial Thickness (mm)')}</label>
          <input type="text" class="input-text dir-ltr" id="obTvsEt" value="${escapeHtml(tvs.endometrialThicknessMm || '')}" placeholder="16">
        </div>
        <div class="obgyn-field is-span-2">
          <label for="obTvsMyoma">${tx(isEn, 'میومتر، فیبروم (FIGO) یا آدنومیوز', 'Myometrial Echo & Myomas')}</label>
          <input type="text" class="input-text" id="obTvsMyoma" value="${escapeHtml(tvs.myometrialEchoAndMyomas || '')}" placeholder="${tx(isEn, 'میوم ساب‌موکوزال 30mm...', 'Submucosal myoma 30mm...')}">
        </div>
        <div class="obgyn-field">
          <label for="obTvsRo">${tx(isEn, 'تخمدان راست (RO)', 'Right Ovary')}</label>
          <input type="text" class="input-text" id="obTvsRo" value="${escapeHtml(tvs.rightOvary || '')}" placeholder="${tx(isEn, 'نرمال', 'Normal')}">
        </div>
        <div class="obgyn-field">
          <label for="obTvsLo">${tx(isEn, 'تخمدان چپ (LO)', 'Left Ovary')}</label>
          <input type="text" class="input-text" id="obTvsLo" value="${escapeHtml(tvs.leftOvary || '')}" placeholder="${tx(isEn, 'کیست ساده 35mm', 'Simple cyst 35mm')}">
        </div>
        <div class="obgyn-field is-span-4">
          <label for="obTvsCul">${tx(isEn, 'مایع آزاد کل‌دوساک (Cul-de-sac)', 'Cul-de-sac Free Fluid')}</label>
          <input type="text" class="input-text" id="obTvsCul" value="${escapeHtml(tvs.culDeSacFreeFluid || '')}" placeholder="${tx(isEn, 'فاقد مایع آزاد', 'No free fluid')}">
        </div>
      </div>
    </section>`}

    <section class="clinical-card obgyn-section-card">
      <div class="card-header">
        <div class="card-title">
          ${getIconSvg('test-tube', { size: 16 })}
          <span>${tx(isEn, isGyn ? 'خلاصه آزمایشات ژنیکولوژی (β-hCG / CBC / TSH / Coag / مارکرها)' : 'خلاصه آزمایشات مامایی (HELLP / CBC / Pr-Cr / OGTT / Coombs / GBS)', isGyn ? 'Gynecology Quick Labs' : 'Obstetric Quick Labs')}</span>
        </div>
        <button type="button" class="obgyn-shared-bridge-btn" data-open-shared-tab="tab-paraclinics">
          ${getIconSvg('coreLink', { size: 14 })}
          <span>${tx(isEn, 'پنل جامع آزمایشات هسته مشترک', 'Open Full Shared Lab Panel')}</span>
        </button>
      </div>
      <div class="obgyn-form-grid obgyn-cols-6">
        ${activeLabRows.map(([k, lbl, ph, highlight]) => `
          <div class="obgyn-field ${highlight ? 'is-bhcg-mandatory' : ''}">
            <label for="obKl_${k}">${escapeHtml(lbl)}</label>
            <input type="text" class="input-text dir-ltr obgyn-kl-input" id="obKl_${k}" data-kl-key="${k}" value="${escapeHtml(kl[k] || '')}" placeholder="${ph}">
          </div>
        `).join('')}
      </div>
      <div class="obgyn-field obgyn-mt-sm">
        <label for="obKlNote">${tx(isEn, 'توضیحات آزمایشات و کراس‌مچ', 'Additional Lab / Crossmatch Notes')}</label>
        <input type="text" class="input-text" id="obKlNote" value="${escapeHtml(ob.paraclinics?.keyLabsNote || '')}" placeholder="${tx(isEn, 'مثلاً ۲ واحد پک‌سل رزرو شد...', 'e.g. 2 units PRBCs crossmatched...')}">
      </div>
    </section>
  `;
}

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

  const nichdEl = document.getElementById('obgynNichdBadge');
  if (nichdEl) {
    const fm = ob.paraclinics?.fetalMonitoring || {};
    const n = evaluateNichdCategory(fm);
    nichdEl.className = `obgyn-nichd-badge is-${n.category === 'Category III' ? 'cat3' : n.category === 'Category I' ? 'cat1' : 'cat2'}`;
    nichdEl.textContent = (fm.baselineBpm || fm.variability)
      ? (isEn ? n.labelEn : n.labelFa)
      : tx(isEn, 'NICHD: پارامترهای NST را وارد کنید', 'NICHD: Enter NST trace');
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

function bindObgynWorkspaceEvents(container, state, ob, isEn) {
  const triggerSoftSync = () => {
    refreshDynamicBadgesWithoutRerender(state, ob, isEn);
    hostBridge.onStateChange();
  };

  // Tab 1: Demographics & Obstetric Index
  const syncDemoDom = (domId, val) => {
    const domEl = document.getElementById(domId);
    if (domEl && domEl.value !== val) domEl.value = val;
  };
  bindFieldInput(container, 'obDemoName', (v) => { state.demographics.fullName = v; syncDemoDom('demoFullName', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoAge', (v) => { state.demographics.age = v; syncDemoDom('demoAge', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoWard', (v) => { state.demographics.ward = v; syncDemoDom('demoWard', v); }, triggerSoftSync);
  bindFieldInput(container, 'obDemoBed', (v) => { state.demographics.bed = v; syncDemoDom('demoBed', v); }, triggerSoftSync);

  container.querySelector('#btnObgynToggleVirgin')?.addEventListener('click', () => {
    ob.obstetricIndex.isVirgin = !ob.obstetricIndex.isVirgin;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  bindFieldInput(container, 'obIdxMarital', (v) => { ob.obstetricIndex.maritalStatus = v; }, triggerSoftSync);
  bindFieldInput(container, 'obIdxMarriageYrs', (v) => { ob.obstetricIndex.marriageDurationYears = v; }, triggerSoftSync);
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

  // Triple-Anchor GA
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

  // Tab 2: Multi-Presentation HPI & Split-Pills
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
    const caret = e.target.selectionStart;
    renderObgynWorkspace();
    const reEl = document.getElementById('obHpiSymSearch');
    if (reEl) {
      reEl.focus();
      if (typeof caret === 'number') reEl.setSelectionRange(caret, caret);
    }
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

  container.querySelectorAll('.obgyn-mod-chip').forEach((chip) => {
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

  // Tab 3: POH, Menstrual & Screening
  container.querySelector('#btnToggleObsMenstrualAcc')?.addEventListener('click', () => {
    obsMenstrualExpanded = !obsMenstrualExpanded;
    renderObgynWorkspace();
  });
  container.querySelector('#btnToggleGynPohAcc')?.addEventListener('click', () => {
    gynPohExpanded = !gynPohExpanded;
    renderObgynWorkspace();
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
  bindFieldInput(container, 'obMhPads', (v) => { ob.menstrualHistory.padsPerDay = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhDys', (v) => { ob.menstrualHistory.dysmenorrhea = v; }, triggerSoftSync);
  bindFieldInput(container, 'obMhPmp', (v) => { ob.menstrualHistory.pmpDate = v; }, triggerSoftSync);

  container.querySelectorAll('[data-mh-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-mh-flag');
      ob.menstrualHistory[k] = !ob.menstrualHistory[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  bindFieldInput(container, 'obScrContra', (v) => { ob.gynScreeningAndRecords.contraception.currentMethod = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrPapDate', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.lastPapSmearDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrPapRes', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.lastPapSmearResult = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrHpv', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.hpvTestStatus = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrColpo', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.priorColposcopyResult = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrMammoDate', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.lastMammographyOrBreastUsDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obScrMammoBirads', (v) => { ob.gynScreeningAndRecords.cervicalAndBreastScreening.lastMammographyBirads = v; }, triggerSoftSync);

  container.querySelector('#btnObgynAddPathology')?.addEventListener('click', () => {
    ob.gynScreeningAndRecords.priorPathologyAndCurettage.hasPriorDncOrBiopsy = true;
    ob.gynScreeningAndRecords.priorPathologyAndCurettage.records.push({ id: `path_${Date.now()}`, date: '', procedureType: '', pathologyResult: '' });
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('[data-del-path]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rIdx = parseInt(btn.getAttribute('data-del-path'), 10);
      ob.gynScreeningAndRecords.priorPathologyAndCurettage.records.splice(rIdx, 1);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('.obgyn-path-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const rIdx = parseInt(inp.getAttribute('data-path-index'), 10);
      const fld = inp.getAttribute('data-path-field');
      if (ob.gynScreeningAndRecords.priorPathologyAndCurettage.records[rIdx]) {
        ob.gynScreeningAndRecords.priorPathologyAndCurettage.records[rIdx][fld] = inp.value;
        triggerSoftSync();
      }
    });
  });

  bindFieldInput(container, 'obAcReg', (v) => { ob.antenatalCareChecklist.careRegularity = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcNtMm', (v) => { ob.antenatalCareChecklist.firstTrimesterScreening.ntMeasurementMm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcDouble', (v) => { ob.antenatalCareChecklist.firstTrimesterScreening.doubleMarkerRisk = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcAnom', (v) => { ob.antenatalCareChecklist.secondTrimesterScreening.anomalyScanResult = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcOgtt', (v) => { ob.antenatalCareChecklist.routineAntenatalLabsAudit.gdmScreening75gOgtt = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcViral', (v) => { ob.antenatalCareChecklist.routineAntenatalLabsAudit.viralMarkers = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcTsh', (v) => { ob.antenatalCareChecklist.routineAntenatalLabsAudit.tshLevel = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcUc', (v) => { ob.antenatalCareChecklist.routineAntenatalLabsAudit.urineCulture = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcGbs', (v) => { ob.antenatalCareChecklist.routineAntenatalLabsAudit.gbsSwab35to37w = v; }, triggerSoftSync);
  bindFieldInput(container, 'obAcFibroid', (v) => { ob.antenatalCareChecklist.notableSonographicFindingsInPregnancy.uterineFibroids = v; }, triggerSoftSync);

  container.querySelectorAll('[data-ac-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-ac-flag');
      if (k === 'ntScanDone') ob.antenatalCareChecklist.firstTrimesterScreening.ntScanDone = !ob.antenatalCareChecklist.firstTrimesterScreening.ntScanDone;
      if (k === 'anomalyScanDone') ob.antenatalCareChecklist.secondTrimesterScreening.anomalyScanDone = !ob.antenatalCareChecklist.secondTrimesterScreening.anomalyScanDone;
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('[data-sup-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-sup-flag');
      ob.antenatalCareChecklist.supplementsAndVaccines[k] = !ob.antenatalCareChecklist.supplementsAndVaccines[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  // Tab 4: PAHx Tri-State & In-Place Shared Core Pickers
  container.querySelector('#btnObgynPahxNeg')?.addEventListener('click', () => {
    const p = ob.gynScreeningAndRecords.pahx;
    p.status = p.status === -1 ? 0 : -1;
    p.hasPriorAnesthesia = false;
    if (p.status === -1) {
      p.anesthesiaTypes = [];
      p.complications = '';
    }
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelector('#btnObgynPahxPos')?.addEventListener('click', () => {
    const p = ob.gynScreeningAndRecords.pahx;
    p.status = p.status === 1 ? 0 : 1;
    p.hasPriorAnesthesia = p.status === 1;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('[data-pahx-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-pahx-type');
      const p = ob.gynScreeningAndRecords.pahx;
      const arr = Array.isArray(p.anesthesiaTypes) ? p.anesthesiaTypes : [];
      if (arr.includes(val)) {
        p.anesthesiaTypes = arr.filter((x) => x !== val);
      } else {
        p.anesthesiaTypes = [...arr, val];
        p.status = 1;
        p.hasPriorAnesthesia = true;
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  bindFieldInput(container, 'obPahxComp', (v) => {
    const p = ob.gynScreeningAndRecords.pahx;
    p.complications = v;
    if (hasVal(v)) {
      p.status = 1;
      p.hasPriorAnesthesia = true;
    }
  }, triggerSoftSync);

  container.querySelectorAll('[data-shared-acc-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-shared-acc-toggle');
      if (expandedSharedGroups.has(k)) expandedSharedGroups.delete(k);
      else expandedSharedGroups.add(k);
      renderObgynWorkspace();
    });
  });

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
  container.querySelector('#btnObgynDhNeg')?.addEventListener('click', () => {
    state.dh.noRoutineMeds = !state.dh.noRoutineMeds;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  container.querySelector('#btnObgynAhNkda')?.addEventListener('click', () => {
    state.ah.nkda = !state.ah.nkda;
    renderObgynWorkspace();
    hostBridge.onStateChange();
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

  container.querySelectorAll('.obgyn-shared-dh-inp').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const idx = parseInt(el.getAttribute('data-dh-idx'), 10);
      const fld = el.getAttribute('data-dh-fld');
      if (state.dh?.activeDrugs?.[idx]) {
        state.dh.activeDrugs[idx][fld] = el.value;
        triggerSoftSync();
      }
    });
  });
  container.querySelectorAll('[data-del-shared-dh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del-shared-dh'), 10);
      state.dh.activeDrugs.splice(idx, 1);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('[data-toggle-shared-ah]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aid = btn.getAttribute('data-toggle-shared-ah');
      if (!state.ah.selected) state.ah.selected = [];
      const curIdx = state.ah.selected.findIndex((x) => x.id === aid);
      if (curIdx >= 0) {
        state.ah.selected.splice(curIdx, 1);
      } else {
        const tmpl = (SURGICAL_SCHEMA.allergyTemplates || []).find((t) => t.id === aid);
        state.ah.nkda = false;
        if (tmpl) state.ah.selected.push({ id: tmpl.id, label: tmpl.label, detail: '' });
      }
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });
  bindFieldInput(container, 'obSharedAhNote', (v) => { state.ah.note = v; if (hasVal(v)) state.ah.nkda = false; }, triggerSoftSync);

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

  container.querySelectorAll('[data-open-shared-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-open-shared-tab');
      if (tabId) enterObgynSharedCoreTab(tabId);
    });
  });

  // Tab 5: PE
  bindFieldInput(container, 'obPeBp', (v) => { ob.pe.vitals.bp = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeBpRep', (v) => { ob.pe.vitals.bpRepeat = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPePr', (v) => { ob.pe.vitals.pr = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeRr', (v) => { ob.pe.vitals.rr = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeTemp', (v) => { ob.pe.vitals.temp = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeDipstick', (v) => { ob.pe.vitals.urineDipstick = v; }, triggerSoftSync);

  bindFieldInput(container, 'obPeFhr', (v) => { ob.pe.obsMeasurements.fhr = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeFhrQuad', (v) => { ob.pe.obsMeasurements.fhrQuadrant = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeFh', (v) => { ob.pe.obsMeasurements.fundalHeightCm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPePres', (v) => { ob.pe.obsMeasurements.presentingPart = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeDil', (v) => { ob.pe.obsMeasurements.dilationCm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeEff', (v) => { ob.pe.obsMeasurements.effacementPct = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeStationScale', (v) => { ob.pe.obsMeasurements.stationScale = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeStation', (v) => { ob.pe.obsMeasurements.stationValue = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeCons', (v) => { ob.pe.obsMeasurements.cervixConsistency = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPePos', (v) => { ob.pe.obsMeasurements.cervixPosition = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeMembranes', (v) => { ob.pe.obsMeasurements.membranesStatus = v; }, triggerSoftSync);
  bindFieldInput(container, 'obPeFluidChar', (v) => { ob.pe.obsMeasurements.amnioticFluidChar = v; }, triggerSoftSync);

  container.querySelectorAll('[data-pe-group-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grp = btn.getAttribute('data-pe-group-toggle');
      if (expandedPeGroups.has(grp)) expandedPeGroups.delete(grp);
      else expandedPeGroups.add(grp);
      renderObgynWorkspace();
    });
  });

  container.querySelectorAll('[data-pe-normal-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grp = btn.getAttribute('data-pe-normal-group');
      const isVirgin = Boolean(ob.obstetricIndex?.isVirgin);
      const subKey = activeSubMode === 'gynecology' ? 'gynecology' : 'obstetrics';
      if (!ob.pe.findings) ob.pe.findings = {};
      OBGYN_PE_BANK.forEach((it) => {
        if (!OBGYN_STRUCTURED_PE_IDS.has(it.id) && (it.subMode === 'both' || it.subMode === subKey) && it.subGroup === grp) {
          if (isVirgin && it.isInternalPelvic) return;
          if (it.normalState === 1 || it.normalState === -1) {
            const curDet = ob.pe.findings[it.id]?.detail || '';
            ob.pe.findings[it.id] = { state: it.normalState, detail: curDet };
          }
        }
      });
      expandedPeGroups.add(grp);
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('[data-pe-id][data-target-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const peId = btn.getAttribute('data-pe-id');
      const target = Number(btn.getAttribute('data-target-state'));
      if (!ob.pe.findings) ob.pe.findings = {};
      const cur = ob.pe.findings[peId] || { state: 0, detail: '' };
      ob.pe.findings[peId] = { ...cur, state: cur.state === target ? 0 : target };
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  container.querySelectorAll('.obgyn-pe-detail-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const peId = inp.getAttribute('data-pe-id');
      if (!ob.pe.findings[peId]) ob.pe.findings[peId] = { state: 1, detail: '' };
      ob.pe.findings[peId].detail = inp.value;
      triggerSoftSync();
    });
  });

  // Tab 6: Workup
  bindFieldInput(container, 'obUsDate', (v) => { ob.paraclinics.lastObstetricUltrasound.scanDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsPres', (v) => { ob.paraclinics.lastObstetricUltrasound.presentation = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsPlacenta', (v) => { ob.paraclinics.lastObstetricUltrasound.placentalLocationAndGrade = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsFluid', (v) => { ob.paraclinics.lastObstetricUltrasound.amnioticFluidVolume = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsGa', (v) => { ob.paraclinics.lastObstetricUltrasound.sonographicGa = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsEfw', (v) => { ob.paraclinics.lastObstetricUltrasound.efwGramsAndPercentile = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsAccreta', (v) => { ob.paraclinics.lastObstetricUltrasound.placentaAccretaColorDoppler = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsBpp', (v) => { ob.paraclinics.lastObstetricUltrasound.bppScore = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsDoppler', (v) => { ob.paraclinics.lastObstetricUltrasound.umbilicalAndMcaDoppler = v; }, triggerSoftSync);
  bindFieldInput(container, 'obUsCl', (v) => { ob.paraclinics.lastObstetricUltrasound.cervicalLengthMm = v; }, triggerSoftSync);

  bindFieldInput(container, 'obNstType', (v) => { ob.paraclinics.fetalMonitoring.testType = v; }, triggerSoftSync);
  bindFieldInput(container, 'obNstBase', (v) => { ob.paraclinics.fetalMonitoring.baselineBpm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obNstVar', (v) => { ob.paraclinics.fetalMonitoring.variability = v; }, triggerSoftSync);
  bindFieldInput(container, 'obNstAccel', (v) => { ob.paraclinics.fetalMonitoring.accelerations = v; }, triggerSoftSync);
  bindFieldInput(container, 'obNstDecelType', (v) => {
    ob.paraclinics.fetalMonitoring.decelerations.type = v;
    ob.paraclinics.fetalMonitoring.decelerations.status = v === 'None' ? 'None' : 'Present';
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });
  bindFieldInput(container, 'obNstVariant', (v) => { ob.paraclinics.fetalMonitoring.decelerations.cordCompressionPatternVariant = v; }, triggerSoftSync);
  bindFieldInput(container, 'obNstCtx', (v) => { ob.paraclinics.fetalMonitoring.contractionsIn10Min = v; }, triggerSoftSync);

  container.querySelector('#btnObgynDecelRecurrent')?.addEventListener('click', () => {
    ob.paraclinics.fetalMonitoring.decelerations.isRecurrent = !ob.paraclinics.fetalMonitoring.decelerations.isRecurrent;
    renderObgynWorkspace();
    hostBridge.onStateChange();
  });

  container.querySelectorAll('[data-var-flag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-var-flag');
      const vf = ob.paraclinics.fetalMonitoring.decelerations.variablePathologicalFlags;
      vf[k] = !vf[k];
      renderObgynWorkspace();
      hostBridge.onStateChange();
    });
  });

  bindFieldInput(container, 'obTvsType', (v) => { ob.paraclinics.gynecologicUltrasound.scanType = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsDate', (v) => { ob.paraclinics.gynecologicUltrasound.scanDate = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsUterus', (v) => { ob.paraclinics.gynecologicUltrasound.uterusDimensionsMm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsEt', (v) => { ob.paraclinics.gynecologicUltrasound.endometrialThicknessMm = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsMyoma', (v) => { ob.paraclinics.gynecologicUltrasound.myometrialEchoAndMyomas = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsRo', (v) => { ob.paraclinics.gynecologicUltrasound.rightOvary = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsLo', (v) => { ob.paraclinics.gynecologicUltrasound.leftOvary = v; }, triggerSoftSync);
  bindFieldInput(container, 'obTvsCul', (v) => { ob.paraclinics.gynecologicUltrasound.culDeSacFreeFluid = v; }, triggerSoftSync);

  container.querySelectorAll('.obgyn-kl-input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.getAttribute('data-kl-key');
      ob.paraclinics.keyLabs[k] = inp.value;
      triggerSoftSync();
    });
  });
  bindFieldInput(container, 'obKlNote', (v) => { ob.paraclinics.keyLabsNote = v; }, triggerSoftSync);

  // Tab 7: DDx, Plan & Collapsible ADCA VAN DIMLS
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
  if (ob.activeTab && OBGYN_TABS.some((t) => t.id === ob.activeTab)) {
    activeTab = ob.activeTab;
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
  } else if (activeTab === 'history') {
    sectionHtml = renderTabHistory(state, ob, isEn);
  } else if (activeTab === 'shared') {
    sectionHtml = renderTabShared(state, ob, isEn);
  } else if (activeTab === 'pe') {
    sectionHtml = renderTabPe(state, ob, guardrails, isEn);
  } else if (activeTab === 'workup') {
    sectionHtml = renderTabWorkup(state, ob, guardrails, isEn);
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
