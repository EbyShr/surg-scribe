/**
 * MedHistorism v3.0 — Specialty Hub & Modular Lens Router
 * Synthesizes Landing Command Center, Shift Continuity, Universal Core Strip,
 * and Non-Destructive Specialty Lens switching (Surgery <-> Ob/Gyn).
 */

import { getIconSvg } from './icons.js';
import {
  getCurrentLanguage,
  setLanguage,
  getCurrentTheme,
  setTheme,
  t,
  applyI18nToDOM
} from './i18n.js';
import {
  ALL_MASTER_DRUGS,
  MASTER_PE_BANK,
  MASTER_ALL_LAB_TESTS,
  MASTER_ROS_BANK
} from './schema.js';
import {
  initObgynLens,
  renderObgynWorkspace,
  setObgynSubMode,
  setObgynActiveTab,
  exitObgynSharedCoreBanner
} from './specialties/obgyn/obgyn-shell.js';

let hubBridge = {
  getState: () => null,
  getShiftCases: () => [],
  getCurrentMode: () => 'admission',
  switchMode: () => {},
  loadCaseById: () => null,
  openCommandPalette: () => {},
  openShiftManager: () => {},
  openAppSettings: () => {},
  updateLivePreview: () => {},
  persistState: () => {},
  showToast: () => {},
  openAdmissionTab: () => {}
};

let activeLens = 'surgery';
let hubInitialized = false;

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelativeTime(isoStr, isEn) {
  if (!isoStr) return isEn ? 'Just now' : 'لحظاتی پیش';
  const ts = new Date(isoStr).getTime();
  if (!Number.isFinite(ts)) return isEn ? 'Recently' : 'اخیر';
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 1) return isEn ? 'Just now' : 'لحظاتی پیش';
  if (diffMin < 60) return isEn ? `${diffMin}m ago` : `${diffMin} دقیقه پیش`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isEn ? `${diffHr}h ago` : `${diffHr} ساعت پیش`;
  const diffDay = Math.floor(diffHr / 24);
  return isEn ? `${diffDay}d ago` : `${diffDay} روز پیش`;
}

function computeSharedCoreActiveCount(state) {
  if (!state) return 0;
  let total = 0;
  total += (state.dh?.activeDrugs?.length || 0) + (state.dh?.customDrugs?.length || 0);
  total += state.psh?.surgeries?.length || 0;
  if (state.ros?.items) {
    total += Object.values(state.ros.items).filter((v) => v && (v.state === 1 || v.state === -1)).length;
  }
  if (state.pe?.findings) {
    total += Object.values(state.pe.findings).filter((v) => v && (v.state === 1 || v.state === -1)).length;
  }
  if (state.paraclinics?.labs) {
    total += Object.values(state.paraclinics.labs).filter((v) => String(v || '').trim() !== '').length;
  }
  if (state.paraclinics?.additionalLabs) {
    total += Object.keys(state.paraclinics.additionalLabs).length;
  }
  return total;
}

export function getActiveSpecialtyLens() {
  return activeLens;
}

export function setActiveSpecialtyLens(lens = 'surgery', { persistToCase = true } = {}) {
  const normalized = lens === 'obgyn' ? 'obgyn' : 'surgery';
  activeLens = normalized;

  const state = hubBridge.getState();
  if (persistToCase && state) {
    state.specialty = normalized;
    hubBridge.persistState();
  }

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.specialty = normalized;
    document.documentElement.dataset.obgynShared = 'false';

    document.querySelectorAll('#specialtyLensSwitcher [data-lens]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lens') === normalized);
    });

    const surgSwitcher = document.getElementById('appModeSwitcher');
    const obSwitcher = document.getElementById('obgynModeSwitcher');
    const railObgyn = document.getElementById('railNavObgyn');
    const obView = document.getElementById('view-mode-obgyn');
    const obMobileTabs = document.getElementById('obgyn-mobile-tabs');

    if (normalized === 'obgyn') {
      if (surgSwitcher) surgSwitcher.style.display = 'none';
      if (obSwitcher) obSwitcher.style.display = '';
      if (railObgyn) railObgyn.style.display = '';
      if (obMobileTabs) obMobileTabs.hidden = false;

      // Hide Surgery mode containers safely without altering Surgery state
      const hpView = document.getElementById('view-mode-hp');
      const atlsView = document.getElementById('view-mode-atls');
      const soapView = document.getElementById('view-mode-soap');
      if (hpView) hpView.style.setProperty('display', 'none', 'important');
      if (atlsView) atlsView.style.setProperty('display', 'none', 'important');
      if (soapView) soapView.style.setProperty('display', 'none', 'important');
      if (obView) obView.style.setProperty('display', 'flex', 'important');

      const subMode = state?.obgynModule?.subMode || state?.obgyn?.subMode || 'obstetrics';
      setObgynSubMode(subMode);
    } else {
      exitObgynSharedCoreBanner();
      if (obSwitcher) obSwitcher.style.display = 'none';
      if (surgSwitcher) surgSwitcher.style.display = '';
      if (railObgyn) railObgyn.style.display = 'none';
      if (obMobileTabs) obMobileTabs.hidden = true;
      if (obView) obView.style.setProperty('display', 'none', 'important');

      hubBridge.switchMode(hubBridge.getCurrentMode() || 'admission');
    }
  }

  updateSharedCoreFooterIndicator();
  hubBridge.updateLivePreview();
}

export function enterWorkstation({ lens = null, mode = null, obgynSubMode = null } = {}) {
  const targetLens = lens || activeLens || 'surgery';

  if (typeof document !== 'undefined') {
    document.body.classList.remove('view-hub');
    document.body.classList.add('view-workstation');
  }

  if (targetLens === 'obgyn') {
    setActiveSpecialtyLens('obgyn');
    if (obgynSubMode) {
      setObgynSubMode(obgynSubMode);
    }
  } else {
    setActiveSpecialtyLens('surgery');
    if (mode) {
      hubBridge.switchMode(mode);
    }
  }

  updateSharedCoreFooterIndicator();
  hubBridge.updateLivePreview();
}

export function showHubView() {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('view-workstation');
    document.body.classList.add('view-hub');
  }
  refreshHubView();
}

export function updateSharedCoreFooterIndicator() {
  if (typeof document === 'undefined') return;
  const countEl = document.getElementById('sharedCoreLiveCount');
  if (!countEl) return;
  const isEn = getCurrentLanguage() === 'en';
  const count = computeSharedCoreActiveCount(hubBridge.getState());
  countEl.textContent = isEn ? `${count} Active` : `${count} مورد فعال`;
}

export function refreshHubView() {
  if (typeof document === 'undefined') return;
  updateSharedCoreFooterIndicator();
  const container = document.getElementById('medhistorism-hub-view');
  if (!container) return;

  const lang = getCurrentLanguage();
  const isEn = lang === 'en';
  const theme = getCurrentTheme();
  const isDark = theme === 'dark';

  const drugCount = ALL_MASTER_DRUGS.length;
  const peCount = MASTER_PE_BANK.length;
  const labCount = MASTER_ALL_LAB_TESTS.length;
  const rosCount = MASTER_ROS_BANK.length;

  const shiftCases = hubBridge.getShiftCases() || [];
  const activeState = hubBridge.getState();
  const activeId = activeState?.caseId || 'SURG-ACTIVE';
  const activeWard = activeState?.demographics?.ward?.trim() || t('hub_no_ward');
  const activeBed = activeState?.demographics?.bed?.trim() || t('hub_no_bed');
  const activeUpdated = formatRelativeTime(activeState?.updatedAt, isEn);
  const activeName = activeState?.demographics?.fullName?.trim();
  const activeCaseSpec = activeState?.specialty === 'obgyn' ? 'obgyn' : 'surgery';

  const shiftRowsHtml = shiftCases.slice(0, 6).map((c) => {
    const cId = c?.caseId || 'CASE';
    const cWard = c?.demographics?.ward?.trim() || t('hub_no_ward');
    const cBed = c?.demographics?.bed?.trim() ? (isEn ? `Bed ${c.demographics.bed}` : `تخت ${c.demographics.bed}`) : t('hub_no_bed');
    const cRel = formatRelativeTime(c?.updatedAt || c?.createdAt, isEn);
    const isObgyn = c?.specialty === 'obgyn';
    return `
      <button type="button" class="hub-shift-item" data-hub-case-id="${escapeHtml(cId)}">
        <div class="hub-shift-item-top">
          <span class="hub-shift-case-id">#${escapeHtml(cId)}</span>
          <span class="hub-shift-dot ${isObgyn ? 'is-obgyn' : 'is-surgery'}" title="${isObgyn ? 'Ob/Gyn' : 'Surgery'}"></span>
        </div>
        <div class="hub-shift-ward">${escapeHtml(cWard)} · ${escapeHtml(cBed)}</div>
        <div class="hub-shift-bottom">
          <span>${escapeHtml(cRel)}</span>
          <span class="hub-shift-arrow" aria-hidden="true">${getIconSvg('arrow-right', { size: 13 })}</span>
        </div>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="hub-shell">
      <!-- Top Floating Minimalist Header Bar -->
      <div class="hub-header" role="banner">
        <div class="hub-brand-group">
          <span class="hub-brand-emblem">${getIconSvg('medhistorismLogo', { size: 20 })}</span>
          <span class="hub-brand-wordmark">MedHistorism</span>
          <span class="hub-version-badge">${t('hub_version_badge')}</span>
        </div>

        <button type="button" class="hub-search-trigger" id="hubCmdTrigger">
          ${getIconSvg('search', { size: 15 })}
          <span class="hub-search-text">${t('hub_search_ph')}</span>
          <kbd class="hub-search-kbd">Ctrl+K</kbd>
        </button>

        <div class="hub-header-actions">
          <span class="hub-offline-pill">
            <span class="hub-offline-dot" aria-hidden="true"></span>
            <span>${t('hub_offline_ready')}</span>
          </span>

          <div class="hub-lang-toggle" role="group" aria-label="Language">
            <button type="button" class="hub-lang-btn ${!isEn ? 'active' : ''}" data-hub-lang="fa">FA</button>
            <button type="button" class="hub-lang-btn ${isEn ? 'active' : ''}" data-hub-lang="en">EN</button>
          </div>

          <button type="button" class="hub-icon-btn" id="hubThemeToggleBtn" title="${t('btn_theme_title')}" aria-label="${t('btn_theme_title')}">
            ${getIconSvg(isDark ? 'sun' : 'moon', { size: 16 })}
          </button>

          <button type="button" class="hub-vault-btn" id="hubShiftVaultBtn">
            ${getIconSvg('folder', { size: 15 })}
            <span>${t('hub_shift_vault')}</span>
            <span class="hub-vault-count">${shiftCases.length}</span>
          </button>
        </div>
      </div>

      <!-- Main Hub Content Grid -->
      <div class="hub-main-grid">
        <div class="hub-primary-column">
          <div class="hub-hero-head">
            <span class="hub-eyebrow">${t('hub_eyebrow')}</span>
            <h1 class="hub-heading">${t('hub_heading')}</h1>
            <p class="hub-subheading">${t('hub_subheading')}</p>
          </div>

          <!-- Flagship Active Specialty Cards -->
          <div class="hub-flagship-grid">
            <!-- Flagship Card 1: Surgery & Trauma -->
            <article class="hub-lens-card" data-lens="surgery">
              <div class="hub-lens-head">
                <div class="hub-lens-icon-box">${getIconSvg('lensSurgery', { size: 22 })}</div>
                <div class="hub-lens-titles">
                  <h2 class="hub-lens-title">${t('lens_surgery_title')}</h2>
                  <div class="hub-lens-sub">${isEn ? 'General Surgery · Emergency Trauma · Ward SOAP' : 'جراحی عمومی · ترومای اورژانس · سیر روزانه'}</div>
                </div>
              </div>

              <div class="hub-quick-section">
                <span class="hub-quick-label">${t('hub_quick_launch')}</span>
                <div class="hub-quick-pills">
                  <button type="button" class="hub-quick-pill" data-launch-lens="surgery" data-launch-mode="admission">
                    ${getIconSvg('clipboard', { size: 13 })}
                    <span>${t('mode_admission_full')}</span>
                  </button>
                  <button type="button" class="hub-quick-pill" data-launch-lens="surgery" data-launch-mode="atls">
                    ${getIconSvg('ambulance', { size: 13 })}
                    <span>${t('mode_atls_full')}</span>
                  </button>
                  <button type="button" class="hub-quick-pill" data-launch-lens="surgery" data-launch-mode="soap">
                    ${getIconSvg('trend-up', { size: 13 })}
                    <span>${t('mode_soap_full')}</span>
                  </button>
                </div>
              </div>

              <button type="button" class="hub-lens-cta" data-launch-lens="surgery" data-launch-mode="admission">
                <span>${t('lens_surgery_cta')}</span>
                ${getIconSvg('arrow-right', { size: 15 })}
              </button>

              <div class="hub-lens-footer">
                <span>${isEn ? `${drugCount} Drugs` : `${drugCount} دارو`}</span>
                <span>·</span>
                <span>${isEn ? `${peCount} Exam Signs` : `${peCount} نشانه معاینه`}</span>
                <span>·</span>
                <span>${isEn ? `${labCount} Labs Linked` : `${labCount} آزمایش متصل`}</span>
              </div>
            </article>

            <!-- Flagship Card 2: Ob/Gyn -->
            <article class="hub-lens-card" data-lens="obgyn">
              <div class="hub-lens-head">
                <div class="hub-lens-icon-box">${getIconSvg('lensObgyn', { size: 22 })}</div>
                <div class="hub-lens-titles">
                  <h2 class="hub-lens-title">${t('lens_obgyn_title')}</h2>
                  <div class="hub-lens-sub">${isEn ? 'Prenatal Intake · Gynecology · Ward Progress' : 'پره‌ناتال و زایمان · بیماری‌های زنان · ویزیت بخش'}</div>
                </div>
              </div>

              <div class="hub-quick-section">
                <span class="hub-quick-label">${t('hub_quick_launch')}</span>
                <div class="hub-quick-pills">
                  <button type="button" class="hub-quick-pill" data-launch-lens="obgyn" data-launch-obgyn="obstetrics">
                    ${getIconSvg('calendar', { size: 13 })}
                    <span>${t('obgyn_mode_prenatal')}</span>
                  </button>
                  <button type="button" class="hub-quick-pill" data-launch-lens="obgyn" data-launch-obgyn="gynecology">
                    ${getIconSvg('lensObgyn', { size: 13 })}
                    <span>${t('obgyn_mode_gyn')}</span>
                  </button>
                  <button type="button" class="hub-quick-pill" data-launch-lens="obgyn" data-launch-obgyn="soape">
                    ${getIconSvg('trend-up', { size: 13 })}
                    <span>${t('obgyn_mode_soap')}</span>
                  </button>
                </div>
              </div>

              <button type="button" class="hub-lens-cta" data-launch-lens="obgyn" data-launch-obgyn="obstetrics">
                <span>${t('lens_obgyn_cta')}</span>
                ${getIconSvg('arrow-right', { size: 15 })}
              </button>

              <div class="hub-lens-footer">
                <span>${isEn ? `${drugCount} Drugs` : `${drugCount} دارو`}</span>
                <span>·</span>
                <span>${isEn ? `Shared ${labCount} Labs & ${rosCount} ROS Linked` : `اتصال به ${labCount} آزمایش و ${rosCount} علامت ROS`}</span>
              </div>
            </article>
          </div>

          <!-- Modular Core Expansion Cards -->
          <section class="hub-expansion-block" aria-label="${t('hub_expansion_title')}">
            <h3 class="hub-section-heading">${t('hub_expansion_title')}</h3>
            <div class="hub-expansion-grid">
              <button type="button" class="hub-expansion-card" data-expansion-lens="internal">
                <div class="hub-expansion-top">
                  <div class="hub-expansion-title-wrap">
                    <span class="hub-expansion-icon">${getIconSvg('lensInternal', { size: 16 })}</span>
                    <span class="hub-expansion-name">${t('lens_internal_title')}</span>
                  </div>
                  ${getIconSvg('lock', { size: 14 })}
                </div>
                <span class="hub-expansion-tag">${t('hub_extensible_tag')}</span>
              </button>

              <button type="button" class="hub-expansion-card" data-expansion-lens="pediatrics">
                <div class="hub-expansion-top">
                  <div class="hub-expansion-title-wrap">
                    <span class="hub-expansion-icon">${getIconSvg('lensPediatrics', { size: 16 })}</span>
                    <span class="hub-expansion-name">${t('lens_pediatrics_title')}</span>
                  </div>
                  ${getIconSvg('lock', { size: 14 })}
                </div>
                <span class="hub-expansion-tag">${t('hub_extensible_tag')}</span>
              </button>

              <button type="button" class="hub-expansion-card" data-expansion-lens="emergency">
                <div class="hub-expansion-top">
                  <div class="hub-expansion-title-wrap">
                    <span class="hub-expansion-icon">${getIconSvg('lensEmergency', { size: 16 })}</span>
                    <span class="hub-expansion-name">${t('lens_emergency_title')}</span>
                  </div>
                  ${getIconSvg('lock', { size: 14 })}
                </div>
                <span class="hub-expansion-tag">${t('hub_extensible_tag')}</span>
              </button>
            </div>
          </section>
        </div>

        <!-- Right Side Rail: Today's Shift Cases -->
        <aside class="hub-shift-rail" aria-label="${t('hub_shift_cases_title')}">
          <div class="hub-rail-header">
            <h2 class="hub-rail-title">${t('hub_shift_cases_title')}</h2>
            <span class="hub-rail-count">${shiftCases.length}</span>
          </div>
          <div class="hub-shift-list">
            ${shiftRowsHtml || `<div style="font-size:0.8rem; color:var(--v3-text-muted); padding:1rem; text-align:center;">${t('shift_empty_msg')}</div>`}
          </div>
        </aside>
      </div>

      <!-- Active Shift Continuity Bar -->
      <section class="hub-continuity-card" aria-label="${t('hub_continuity_title')}">
        <div class="hub-continuity-info">
          <span class="hub-continuity-badge">${t('hub_resume_draft')}</span>
          <span class="hub-continuity-meta">
            #${escapeHtml(activeId)}${activeName ? ` · ${escapeHtml(activeName)}` : ''} · ${escapeHtml(activeWard)} · ${escapeHtml(activeBed)} · ${escapeHtml(activeUpdated)}
          </span>
        </div>
        <button type="button" class="hub-continuity-btn" id="hubContinueDraftBtn">
          <span>${t('hub_continue_btn')}</span>
          ${getIconSvg('arrow-right', { size: 14 })}
        </button>
      </section>

      <!-- Bottom Universal Core Strip -->
      <footer class="hub-core-strip" aria-label="${t('core_strip_title')}">
        <span class="hub-core-strip-label">
          ${getIconSvg('coreLink', { size: 15 })}
          <span>${t('core_strip_title')}</span>
        </span>
        <div class="hub-core-pills">
          <span class="hub-core-pill">${getIconSvg('pill', { size: 13 })} <span class="hub-core-num">${drugCount}</span> ${t('core_formulary')}</span>
          <span class="hub-core-pill">${getIconSvg('stethoscope', { size: 13 })} <span class="hub-core-num">${peCount}</span> ${t('core_exam_signs')}</span>
          <span class="hub-core-pill">${getIconSvg('test-tube', { size: 13 })} <span class="hub-core-num">${labCount}</span> ${t('core_lab_panels')}</span>
          <span class="hub-core-pill">${getIconSvg('check-circle', { size: 13 })} ${t('core_zero_hallucination')}</span>
          <span class="hub-core-pill is-shield">${getIconSvg('shieldPii', { size: 13 })} ${t('core_pii_active')}</span>
        </div>
      </footer>

      <!-- Mobile Bedside Hub Bottom Dock (< 1024px) -->
      <nav class="hub-mobile-dock" aria-label="Hub Mobile Navigation">
        <button type="button" class="hub-dock-btn active" id="hubDockLenses">
          ${getIconSvg('layers', { size: 17 })}
          <span>${t('dock_lenses')}</span>
        </button>
        <button type="button" class="hub-dock-btn" id="hubDockSearch">
          ${getIconSvg('search', { size: 17 })}
          <span>${t('dock_search')}</span>
        </button>
        <button type="button" class="hub-dock-btn" id="hubDockVault">
          ${getIconSvg('folder', { size: 17 })}
          <span>${t('dock_vault')}</span>
        </button>
        <button type="button" class="hub-dock-btn" id="hubDockSettings">
          ${getIconSvg('settings', { size: 17 })}
          <span>${t('dock_settings')}</span>
        </button>
      </nav>
    </div>
  `;

  bindHubDomEvents(container, activeCaseSpec);
}

function bindHubDomEvents(container, activeCaseSpec) {
  container.querySelector('#hubCmdTrigger')?.addEventListener('click', () => {
    hubBridge.openCommandPalette();
  });

  container.querySelector('#hubShiftVaultBtn')?.addEventListener('click', () => {
    hubBridge.openShiftManager();
  });

  container.querySelector('#hubThemeToggleBtn')?.addEventListener('click', () => {
    const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    refreshHubView();
  });

  container.querySelectorAll('[data-hub-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetLang = btn.getAttribute('data-hub-lang') || 'fa';
      setLanguage(targetLang);
      applyI18nToDOM(targetLang);
      refreshHubView();
    });
  });

  container.querySelectorAll('[data-launch-lens]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lens = btn.getAttribute('data-launch-lens') || 'surgery';
      const mode = btn.getAttribute('data-launch-mode') || null;
      const obgynSubMode = btn.getAttribute('data-launch-obgyn') || null;
      enterWorkstation({ lens, mode, obgynSubMode });
    });
  });

  container.querySelectorAll('[data-expansion-lens]').forEach((btn) => {
    btn.addEventListener('click', () => {
      hubBridge.showToast(t('hub_module_toast'), 'info');
    });
  });

  container.querySelectorAll('[data-hub-case-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caseId = btn.getAttribute('data-hub-case-id');
      if (!caseId) return;
      const loaded = hubBridge.loadCaseById(caseId, { skipConfirm: true });
      const targetLens = loaded?.specialty === 'obgyn' ? 'obgyn' : 'surgery';
      enterWorkstation({
        lens: targetLens,
        obgynSubMode: targetLens === 'obgyn' ? (loaded?.obgynModule?.subMode || loaded?.obgyn?.subMode || 'obstetrics') : null
      });
    });
  });

  container.querySelector('#hubContinueDraftBtn')?.addEventListener('click', () => {
    enterWorkstation({ lens: activeCaseSpec });
  });

  container.querySelector('#hubDockLenses')?.addEventListener('click', () => {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  });

  container.querySelector('#hubDockSearch')?.addEventListener('click', () => {
    hubBridge.openCommandPalette();
  });

  container.querySelector('#hubDockVault')?.addEventListener('click', () => {
    hubBridge.openShiftManager();
  });

  container.querySelector('#hubDockSettings')?.addEventListener('click', () => {
    hubBridge.openAppSettings();
  });
}

export function initSpecialtyHub(bridge = {}) {
  hubBridge = { ...hubBridge, ...bridge };

  initObgynLens({
    getState: () => hubBridge.getState(),
    onStateChange: () => {
      hubBridge.persistState();
      updateSharedCoreFooterIndicator();
      hubBridge.updateLivePreview();
    },
    openSharedCoreTab: (tabId) => {
      hubBridge.openAdmissionTab(tabId);
    },
    switchToSoapMode: () => {
      setObgynSubMode('soape');
    },
    showToast: (msg, type) => hubBridge.showToast(msg, type)
  });

  if (typeof document === 'undefined' || hubInitialized) return;
  hubInitialized = true;

  document.getElementById('btnReturnToHub')?.addEventListener('click', () => {
    showHubView();
  });

  document.querySelectorAll('#specialtyLensSwitcher [data-lens]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lens = btn.getAttribute('data-lens') || 'surgery';
      setActiveSpecialtyLens(lens);
    });
  });

  document.getElementById('btnToggleSharedCoreBar')?.addEventListener('click', () => {
    if (activeLens === 'obgyn') {
      const st = hubBridge.getState();
      if ((st?.obgynModule?.subMode || st?.obgyn?.subMode) === 'soape') {
        setObgynSubMode('obstetrics');
      }
      setObgynActiveTab('shared');
    } else {
      hubBridge.openAdmissionTab('tab-dh');
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('surg:language-changed', () => {
      refreshHubView();
      if (activeLens === 'obgyn') {
        renderObgynWorkspace();
      }
    });
    window.addEventListener('surg:theme-changed', () => {
      refreshHubView();
    });
  }

  // Sync initial specialty from active draft or URL query params
  const currentState = hubBridge.getState();
  const initialCaseLens = currentState?.specialty === 'obgyn' ? 'obgyn' : 'surgery';
  activeLens = initialCaseLens;
  document.documentElement.dataset.specialty = initialCaseLens;

  let handledRoute = false;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search || '');
    const qMode = params.get('mode');
    const qLens = params.get('lens');
    if (qLens === 'obgyn') {
      enterWorkstation({ lens: 'obgyn' });
      handledRoute = true;
    } else if (qMode && ['admission', 'atls', 'soap'].includes(qMode)) {
      enterWorkstation({ lens: 'surgery', mode: qMode });
      handledRoute = true;
    } else if (qLens === 'surgery') {
      enterWorkstation({ lens: 'surgery', mode: 'admission' });
      handledRoute = true;
    }
  }

  refreshHubView();
  if (!handledRoute) {
    showHubView();
  }
}
