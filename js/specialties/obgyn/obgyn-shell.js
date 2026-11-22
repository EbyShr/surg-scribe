/**
 * MedHistorism v3.1 — Ob/Gyn Specialty Lens Public Facade
 * Clean DAG boundary connecting obgyn-state.js, obgyn-ui.js, and obgyn-generator.js.
 */

import {
  initObgynUi,
  renderObgynWorkspace,
  setObgynUiSubMode,
  setObgynActiveTab,
  enterObgynSharedCoreTab,
  exitObgynSharedCoreBanner,
  getObgynActiveSubMode,
  ensureObgynStateOnHost
} from './obgyn-ui.js';
import {
  createDefaultObgynState,
  normalizeSubMode,
  normalizeObgynState,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory,
  evaluateObgynSafetyGuardrails
} from './obgyn-state.js';
import { generateObgynNote } from './obgyn-generator.js';

export function initObgynLens(bridge = {}) {
  initObgynUi(bridge);
}

export function setObgynSubMode(subMode) {
  setObgynUiSubMode(subMode);
}

export {
  renderObgynWorkspace,
  setObgynActiveTab,
  enterObgynSharedCoreTab,
  exitObgynSharedCoreBanner,
  getObgynActiveSubMode,
  ensureObgynStateOnHost,
  createDefaultObgynState,
  normalizeSubMode,
  normalizeObgynState,
  calculateTripleGestationalAge,
  calculateBishopScore,
  evaluateNichdCategory,
  evaluateObgynSafetyGuardrails,
  generateObgynNote
};

export const generateObgynStructuredSummary = generateObgynNote;
