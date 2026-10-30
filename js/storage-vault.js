/**
 * Immortal Local Storage Vault (IndexedDB + LocalStorage + Legacy Version Migrator)
 * v1.0-Immortal-Core
 * تضمین می‌کند که با ریلود شدن صفحه یا آپدیت شدن نسخه سایت در GitHub Pages،
 * هیچ پرونده ذخیره‌شده یا فرم نیمه‌کاره‌ای (Active Draft) هرگز پاک نشود.
 */

const PERMANENT_CASES_KEY = 'SURG_SCRIBE_PERMANENT_CASES_VAULT';
const PERMANENT_ACTIVE_DRAFT_KEY = 'SURG_SCRIBE_ACTIVE_DRAFT_STATE';
const PERMANENT_ACTIVE_TAB_KEY = 'SURG_SCRIBE_ACTIVE_UI_TAB';
const PERMANENT_DELETED_IDS_KEY = 'SURG_SCRIBE_DELETED_CASE_IDS';
const IDB_NAME = 'ClinicalScribeImmortalDB';
const IDB_STORE = 'vault_store';

export class ImmortalStorageVault {
  constructor() {
    this.dbPromise = this._initIndexedDB();
    this._migrateLegacyKeys();
  }

  _initIndexedDB() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) return resolve(null);
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    });
  }

  async _idbSet(key, val) {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async _idbGet(key) {
    const db = await this.dbPromise;
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  /**
   * اسکن خودکار تمام کلیدهای نسخه‌های قبلی (v0.1 تا v0.9) در localStorage
   * و ادغام بدونِ حذفیات آنها در گاوصندوق دائمی با رعایت لیست سیاه حذف‌شده‌ها (Tombstone)
   */
  _migrateLegacyKeys() {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return;
    try {
      const deletedIds = JSON.parse(localStorage.getItem(PERMANENT_DELETED_IDS_KEY) || '[]');
      const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds : []);

      const existingCasesMap = new Map();
      const rawCurrent = localStorage.getItem(PERMANENT_CASES_KEY);
      if (rawCurrent) {
        const parsed = JSON.parse(rawCurrent);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c && c.caseId && !deletedSet.has(c.caseId)) {
              existingCasesMap.set(c.caseId, c);
            }
          });
        }
      }

      const len = typeof localStorage.length === 'number' ? localStorage.length : 0;
      for (let i = 0; i < len; i++) {
        if (typeof localStorage.key !== 'function') break;
        const k = localStorage.key(i);
        if (!k || k === PERMANENT_CASES_KEY || k === PERMANENT_ACTIVE_DRAFT_KEY || k === PERMANENT_ACTIVE_TAB_KEY || k === PERMANENT_DELETED_IDS_KEY) continue;
        if (k.toLowerCase().includes('surg') || k.toLowerCase().includes('case') || k.toLowerCase().includes('clinical')) {
          try {
            const rawVal = localStorage.getItem(k);
            const val = JSON.parse(rawVal);
            if (Array.isArray(val)) {
              let modified = false;
              val.forEach((item) => {
                if (item && item.caseId) {
                  if (deletedSet.has(item.caseId)) {
                    modified = true;
                  } else if (!existingCasesMap.has(item.caseId)) {
                    existingCasesMap.set(item.caseId, item);
                  }
                }
              });
              if (modified) {
                const cleaned = val.filter((item) => !item || !item.caseId || !deletedSet.has(item.caseId));
                localStorage.setItem(k, JSON.stringify(cleaned));
              }
            } else if (val && val.caseId && val.demographics) {
              if (deletedSet.has(val.caseId)) {
                localStorage.removeItem(k);
              } else if (!existingCasesMap.has(val.caseId)) {
                existingCasesMap.set(val.caseId, val);
              }
            }
          } catch (_) {
            // نادیده گرفتن کلیدهای غیر JSON
          }
        }
      }

      const mergedArray = Array.from(existingCasesMap.values());
      if (typeof localStorage.setItem === 'function') {
        localStorage.setItem(PERMANENT_CASES_KEY, JSON.stringify(mergedArray));
        this._idbSet(PERMANENT_CASES_KEY, mergedArray);
      }
    } catch (err) {
      console.error('Migration check error:', err);
    }
  }

  /**
   * ذخیره فوری فرم در حال تکمیل (در هر کلیک یا تایپ صدا زده شود تا با ریلود نپرد)
   */
  saveActiveDraft(stateObj, activeTabId = null) {
    if (!stateObj) return;
    stateObj.updatedAt = new Date().toISOString();
    const serialized = JSON.stringify(stateObj);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PERMANENT_ACTIVE_DRAFT_KEY, serialized);
      if (activeTabId) {
        localStorage.setItem(PERMANENT_ACTIVE_TAB_KEY, activeTabId);
      }
    }
    this._idbSet(PERMANENT_ACTIVE_DRAFT_KEY, stateObj);

    // همزمان پرونده فعلی را در لیست آرشیو شیفت نیز آپدیت کن
    this.upsertCaseInArchive(stateObj);
  }

  /**
   * بازیابی فرم در حال تکمیل در لحظه ریلود شدن صفحه (همراه با Deep-Merge برای سازگاری با فیلدهای جدید آپدیت سایت)
   */
  async loadActiveDraft(defaultEmptyStateFactory) {
    const defaultState = typeof defaultEmptyStateFactory === 'function' ? defaultEmptyStateFactory() : {};
    let savedDraft = null;

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(PERMANENT_ACTIVE_DRAFT_KEY);
        if (raw) savedDraft = JSON.parse(raw);
      } catch (_) {}
    }

    if (!savedDraft) {
      savedDraft = await this._idbGet(PERMANENT_ACTIVE_DRAFT_KEY);
    }

    if (!savedDraft || !savedDraft.caseId) {
      const savedTab = typeof localStorage !== 'undefined' ? (localStorage.getItem(PERMANENT_ACTIVE_TAB_KEY) || 'tab-cc') : 'tab-cc';
      return { state: defaultState, activeTab: savedTab, restored: false };
    }

    // بررسی Tombstone: اگر این پرونده در لیست سیاه حذف‌شده‌ها بود، بارگذاری نشود
    if (typeof localStorage !== 'undefined') {
      const deletedIds = JSON.parse(localStorage.getItem(PERMANENT_DELETED_IDS_KEY) || '[]');
      if (Array.isArray(deletedIds) && deletedIds.includes(savedDraft.caseId)) {
        localStorage.removeItem(PERMANENT_ACTIVE_DRAFT_KEY);
        await this._idbSet(PERMANENT_ACTIVE_DRAFT_KEY, null);
        const savedTab = localStorage.getItem(PERMANENT_ACTIVE_TAB_KEY) || 'tab-cc';
        return { state: defaultState, activeTab: savedTab, restored: false };
      }
    }

    // ادغام ایمن (Deep Merge): حفظ ۱۰۰٪ دیتای قبلی کاربر + افزودن کلیدهای جدیدی که در آپدیت‌های بعدی سایت اضافه شده‌اند
    const mergedState = this._deepMergeWithDefaults(defaultState, savedDraft);
    const savedTab = typeof localStorage !== 'undefined' ? (localStorage.getItem(PERMANENT_ACTIVE_TAB_KEY) || 'tab-cc') : 'tab-cc';
    return { state: mergedState, activeTab: savedTab, restored: true };
  }

  _deepMergeWithDefaults(targetDefault, sourceSaved) {
    if (typeof targetDefault !== 'object' || targetDefault === null) {
      return sourceSaved !== undefined ? sourceSaved : targetDefault;
    }
    if (Array.isArray(targetDefault)) {
      return Array.isArray(sourceSaved) ? sourceSaved : targetDefault;
    }
    const output = { ...targetDefault };
    if (typeof sourceSaved === 'object' && sourceSaved !== null) {
      Object.keys(sourceSaved).forEach((key) => {
        if (key in targetDefault) {
          output[key] = this._deepMergeWithDefaults(targetDefault[key], sourceSaved[key]);
        } else {
          output[key] = sourceSaved[key];
        }
      });
    }
    return output;
  }

  upsertCaseInArchive(caseObj) {
    if (!caseObj || !caseObj.caseId) return;
    const allCases = this.getAllArchivedCasesSync();
    const idx = allCases.findIndex((c) => c.caseId === caseObj.caseId);
    if (idx >= 0) {
      allCases[idx] = caseObj;
    } else {
      allCases.unshift(caseObj);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PERMANENT_CASES_KEY, JSON.stringify(allCases));
    }
    this._idbSet(PERMANENT_CASES_KEY, allCases);
  }

  upsertCaseToArchive(caseObj) {
    return this.upsertCaseInArchive(caseObj);
  }

  async getAllPermanentCases() {
    let cases = this.getAllArchivedCasesSync();
    if (!cases || cases.length === 0) {
      cases = (await this._idbGet(PERMANENT_CASES_KEY)) || [];
    }
    return cases;
  }

  async getPermanentCaseById(caseId) {
    const cases = await this.getAllPermanentCases();
    return cases.find(c => c.caseId === caseId) || null;
  }

  getAllArchivedCasesSync() {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return [];
    try {
      const raw = localStorage.getItem(PERMANENT_CASES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  deleteCaseFromArchive(caseId) {
    if (!caseId) return;
    return this.permanentlyDeleteCase(caseId);
  }

  /**
   * حذف قطعی و برگشت‌ناپذیر پرونده از تمام حافظه‌ها (LocalStorage, IndexedDB, ActiveDraft & Tombstone)
   */
  async permanentlyDeleteCase(caseId, createEmptyStateFn) {
    if (!caseId) return null;

    // 1. ثبت در لیست سیاه حذف‌شده‌ها (Tombstone) تا هرگز از کلیدهای قدیمی ریکاوری نشود
    const deletedIds = JSON.parse(localStorage.getItem(PERMANENT_DELETED_IDS_KEY) || '[]');
    if (!deletedIds.includes(caseId)) {
      deletedIds.push(caseId);
      localStorage.setItem(PERMANENT_DELETED_IDS_KEY, JSON.stringify(deletedIds));
    }

    // 2. حذف از آرایه اصلی پرونده‌ها در localStorage و IndexedDB
    const allCases = this.getAllArchivedCasesSync().filter((c) => c && c.caseId !== caseId);
    localStorage.setItem(PERMANENT_CASES_KEY, JSON.stringify(allCases));
    await this._idbSet(PERMANENT_CASES_KEY, allCases);

    // 3. پاکسازی قطعی از تمام کلیدهای فرعی و شیفت در localStorage
    try {
      const shiftRaw = localStorage.getItem('surg_shift_cases_v05');
      if (shiftRaw) {
        const shiftList = JSON.parse(shiftRaw);
        if (Array.isArray(shiftList)) {
          localStorage.setItem('surg_shift_cases_v05', JSON.stringify(shiftList.filter((c) => c && c.caseId !== caseId)));
        }
      }
    } catch (_) {}

    try {
      const currRaw = localStorage.getItem('surg_current_case_state_v05');
      if (currRaw && currRaw.includes(caseId)) {
        localStorage.removeItem('surg_current_case_state_v05');
      }
    } catch (_) {}

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || k === PERMANENT_CASES_KEY || k === PERMANENT_DELETED_IDS_KEY) continue;
      try {
        const raw = localStorage.getItem(k);
        if (raw && raw.includes(caseId)) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localStorage.setItem(k, JSON.stringify(parsed.filter((x) => x?.caseId !== caseId)));
          } else if (parsed?.caseId === caseId) {
            localStorage.removeItem(k);
          }
        }
      } catch (_) {}
    }

    // 4. اگر پرونده‌ای که پاک شد، همان پرونده فعال روی صفحه بود، به پرونده بعدی سوییچ کن یا فرم سفید باز کن
    const activeDraftRaw = localStorage.getItem(PERMANENT_ACTIVE_DRAFT_KEY);
    const idbDraft = await this._idbGet(PERMANENT_ACTIVE_DRAFT_KEY);
    const isTargetActive = (activeDraftRaw && activeDraftRaw.includes(caseId)) || (idbDraft && idbDraft.caseId === caseId);

    if (isTargetActive) {
      if (allCases.length > 0) {
        await this.saveActiveDraft(allCases[0], 'tab-cc');
        return allCases[0];
      } else {
        const freshState = typeof createEmptyStateFn === 'function' ? createEmptyStateFn() : {};
        await this.saveActiveDraft(freshState, 'tab-cc');
        return freshState;
      }
    }
    return null;
  }
}

export const storageVault = new ImmortalStorageVault();
