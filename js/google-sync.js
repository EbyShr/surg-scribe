const STORAGE_GSHEET_CONFIG_KEY = 'surg_gsheet_sync_config_v2';
const STORAGE_GSHEET_QUEUE_KEY = 'surg_gsheet_offline_queue_v2';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWKN6I80lNriVfPFr7XzZZm9wGdJckmms9led7xn7ieQJnbXz6oumHtWQ85uUHV0Q8/exec';

/**
 * Deeply strips all Patient Identifiable Information (PII) from both
 * structured fields AND rendered Markdown clinical notes before cloud transmission.
 */
export function deepStripPIIForCloud(rawPayload, rawClinicalState = null) {
  const clone = JSON.parse(JSON.stringify(rawPayload || {}));

  const piiTokens = [];
  const collectToken = (val) => {
    if (val && typeof val === 'string' && val.trim().length >= 2) {
      piiTokens.push(val.trim());
    }
  };

  if (rawClinicalState?.demographics) {
    collectToken(rawClinicalState.demographics.fullName);
    collectToken(rawClinicalState.demographics.name);
    collectToken(rawClinicalState.demographics.fatherName);
  }
  collectToken(clone.patientName);
  collectToken(clone.fatherName);
  if (clone.demographics) {
    collectToken(clone.demographics.fullName);
    collectToken(clone.demographics.name);
    collectToken(clone.demographics.fatherName);
  }

  delete clone.patientName;
  delete clone.fatherName;
  delete clone.birthDate;
  delete clone.dob;
  delete clone.bed;

  if (clone.demographics) {
    delete clone.demographics.fullName;
    delete clone.demographics.name;
    delete clone.demographics.fatherName;
    delete clone.demographics.birthDate;
    delete clone.demographics.dob;
    delete clone.demographics.bed;
  }

  if (clone.hp && clone.hp.demographics) {
    delete clone.hp.demographics.fullName;
    delete clone.hp.demographics.name;
    delete clone.hp.demographics.fatherName;
    delete clone.hp.demographics.birthDate;
    delete clone.hp.demographics.dob;
    delete clone.hp.demographics.bed;
  }

  if (Array.isArray(clone.soapHistory)) {
    clone.soapHistory.forEach((day) => {
      if (day.context) {
        collectToken(day.context.fullName);
        delete day.context.fullName;
        delete day.context.bed;
      }
      if (day.soapState && day.soapState.context) {
        collectToken(day.soapState.context.fullName);
        delete day.soapState.context.fullName;
        delete day.soapState.context.bed;
      }
    });
  }

  const scrubMarkdownText = (text) => {
    if (!text || typeof text !== 'string') return text;
    let cleaned = text;
    piiTokens.forEach((token) => {
      if (token.length >= 2) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(escaped, 'g'), '[حذف شده - کد: ' + (clone.caseId || 'SURG') + ']');
      }
    });
    cleaned = cleaned.replace(/تخت\s*[:#]?\s*[\d۰-۹A-Za-z\-]+/g, 'تخت [محفوظ]');
    cleaned = cleaned.replace(/Bed\s*[:#]?\s*[\dA-Za-z\-]+/gi, 'Bed [Redacted]');
    return cleaned;
  };

  if (clone.fullClinicalNote) {
    clone.fullClinicalNote = scrubMarkdownText(clone.fullClinicalNote);
  }
  if (clone.generatedTexts) {
    if (clone.generatedTexts.hp) clone.generatedTexts.hp = scrubMarkdownText(clone.generatedTexts.hp);
    if (clone.generatedTexts.atls) clone.generatedTexts.atls = scrubMarkdownText(clone.generatedTexts.atls);
    if (clone.generatedTexts.soapAllDays) clone.generatedTexts.soapAllDays = scrubMarkdownText(clone.generatedTexts.soapAllDays);
  }
  if (Array.isArray(clone.soapHistory)) {
    clone.soapHistory.forEach((day) => {
      if (day.renderedText) day.renderedText = scrubMarkdownText(day.renderedText);
      if (day.noteMarkdown) day.noteMarkdown = scrubMarkdownText(day.noteMarkdown);
    });
  }

  return clone;
}

export class GoogleSheetsSyncEngine {
  constructor() {
    this.config = this.loadConfig();
    this.queue = this.loadQueue();
    this._isSendingNow = false;
    this._lastSentFingerprint = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushOfflineQueue();
      });
    }
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_GSHEET_CONFIG_KEY) || localStorage.getItem('surg_gsheet_sync_config') || localStorage.getItem('surg_gsheet_config_v04');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          scriptUrl: (parsed.scriptUrl || DEFAULT_SCRIPT_URL).trim(),
          collectorName: (parsed.collectorName || '').trim(),
          lastSheetUrl: parsed.lastSheetUrl || ''
        };
      }
    } catch (_) {}
    return {
      scriptUrl: DEFAULT_SCRIPT_URL,
      collectorName: '',
      lastSheetUrl: ''
    };
  }

  saveConfig(newConfig = {}) {
    this.config = {
      ...this.config,
      scriptUrl: (newConfig.scriptUrl !== undefined ? newConfig.scriptUrl : this.config.scriptUrl).trim(),
      collectorName: (newConfig.collectorName !== undefined ? newConfig.collectorName : this.config.collectorName).trim(),
      lastSheetUrl: newConfig.lastSheetUrl || this.config.lastSheetUrl || ''
    };
    try {
      localStorage.setItem(STORAGE_GSHEET_CONFIG_KEY, JSON.stringify(this.config));
    } catch (_) {}
    return this.config;
  }

  loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_GSHEET_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(STORAGE_GSHEET_QUEUE_KEY, JSON.stringify(this.queue.slice(0, 50)));
    } catch (_) {}
  }

  enqueueOffline(cleanPayload) {
    const idx = this.queue.findIndex((item) => item.caseId === cleanPayload.caseId);
    if (idx >= 0) {
      this.queue[idx] = cleanPayload;
    } else {
      this.queue.push(cleanPayload);
    }
    this.saveQueue();
  }

  computePayloadFingerprint(cleanPayload) {
    const copy = { ...cleanPayload };
    delete copy.timestamp;
    delete copy.updatedAt;
    const str = JSON.stringify(copy);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `${cleanPayload.caseId}_${hash}`;
  }

  async sendPayload(rawPayload, rawClinicalState = null) {
    if (this._isSendingNow) {
      return {
        success: false,
        queued: false,
        message: 'درخواست قبلی در حال ارسال است؛ لطفاً چند ثانیه صبر کنید.'
      };
    }

    const scriptUrl = (this.config.scriptUrl || '').trim();
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        queued: false,
        message: 'آدرس Web App گوگل شیت تنظیم نشده است. لطفاً از بخش تنظیمات (⚙️) لینک اسکریپت را وارد کنید.'
      };
    }

    const cleanPayload = deepStripPIIForCloud(rawPayload, rawClinicalState);
    if (!cleanPayload.collectorName && this.config.collectorName) {
      cleanPayload.collectorName = this.config.collectorName;
    }

    const currentFingerprint = this.computePayloadFingerprint(cleanPayload);
    if (this._lastSentFingerprint && this._lastSentFingerprint === currentFingerprint) {
      return {
        success: true,
        queued: false,
        message: 'این اطلاعات قبلاً بدون هیچ تغییری در Google Sheets ثبت شده است (جلوگیری از ثبت تکراری).'
      };
    }

    this._isSendingNow = true;

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.enqueueOffline(cleanPayload);
        return {
          success: false,
          queued: true,
          message: 'دستگاه آفلاین است. پرونده در صف محلی ذخیره شد.'
        };
      }

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(cleanPayload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resultText = await response.text();
      let resultJson = null;
      try {
        resultJson = JSON.parse(resultText);
      } catch (_) {
        throw new Error('پاسخ دریافتی از Google Apps Script فرمت JSON معتبر ندارد.');
      }

      if (resultJson && resultJson.status === 'ignored') {
        return {
          success: false,
          queued: false,
          message: resultJson.message || 'اطلاعات پرونده روی حالت پیشفرض/خالی است و ثبت نشد.'
        };
      }

      if (resultJson && resultJson.status === 'success') {
        this._lastSentFingerprint = currentFingerprint;
        if (resultJson.sheetUrl) {
          this.saveConfig({ lastSheetUrl: resultJson.sheetUrl });
        }
        return {
          success: true,
          queued: false,
          data: resultJson,
          message: resultJson.message || `پرونده (${cleanPayload.caseId}) با موفقیت در Google Sheets ثبت شد.`
        };
      } else {
        throw new Error(resultJson?.message || 'خطای سرور گوگل');
      }
    } catch (err) {
      console.error('[GoogleSheetsSyncEngine] POST Error:', err);
      this.enqueueOffline(cleanPayload);
      return {
        success: false,
        queued: true,
        message: `ارسال مستقیم با خطا مواجه شد (${err.message}). در صف آفلاین قرار گرفت.`
      };
    } finally {
      this._isSendingNow = false;
    }
  }

  async flushOfflineQueue() {
    if (!this.queue || this.queue.length === 0) return { flushed: 0 };
    if (!this.config.scriptUrl) return { flushed: 0 };

    const pending = [...this.queue];
    this.queue = [];
    this.saveQueue();

    let flushedCount = 0;
    for (const item of pending) {
      const res = await this.sendPayload(item);
      if (res.success) flushedCount++;
    }
    return { flushed: flushedCount };
  }

  async fetchCloudDatabase() {
    const scriptUrl = (this.config.scriptUrl || '').trim();
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        message: 'لینک Google Apps Script در تنظیمات وارد نشده است.',
        cases: [],
        collectorStats: {},
        sheetUrl: ''
      };
    }

    try {
      const separator = scriptUrl.includes('?') ? '&' : '?';
      const urlWithParams = `${scriptUrl}${separator}action=getAllCases&t=${Date.now()}`;

      const response = await fetch(urlWithParams, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const rawText = await response.text();
      const data = JSON.parse(rawText);

      if (data && data.status === 'success') {
        if (data.sheetUrl) {
          this.saveConfig({ lastSheetUrl: data.sheetUrl });
        }
        return {
          success: true,
          cases: Array.isArray(data.cases) ? data.cases : [],
          collectorStats: data.collectorStats || {},
          sheetUrl: data.sheetUrl || this.config.lastSheetUrl || '',
          totalCases: data.totalCases || (Array.isArray(data.cases) ? data.cases.length : 0)
        };
      } else {
        throw new Error(data?.message || 'خطا در دریافت اطلاعات از شیت');
      }
    } catch (err) {
      console.error('[GoogleSheetsSyncEngine] GET Error:', err);
      return {
        success: false,
        message: `خطا در ارتباط زنده با Google Sheets: ${err.message}`,
        cases: [],
        collectorStats: {},
        sheetUrl: this.config.lastSheetUrl || ''
      };
    }
  }
}
