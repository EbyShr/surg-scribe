/**
 * GoogleSheetsSyncEngine - Surg-Scribe v0.4-Surg
 * Direct, zero-backend Google Sheets synchronization engine using Google Apps Script Web App.
 * Handles offline queueing in localStorage and avoids CORS preflight issues with text/plain payloads.
 */

const CONFIG_KEY = 'surg_gsheet_config_v04';
const QUEUE_KEY = 'surg_gsheet_offline_queue_v04';
const STAGED_KEY = 'surg_gsheet_staged_v04';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWKN6I80lNriVfPFr7XzZZm9wGdJckmms9led7xn7ieQJnbXz6oumHtWQ85uUHV0Q8/exec';

export class GoogleSheetsSyncEngine {
  constructor() {
    this.config = this.loadConfig();
    this.queue = this.loadQueue();
    this.staged = this.loadStaged();

    window.addEventListener('online', () => {
      this.flushQueue();
    });
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          scriptUrl: (parsed.scriptUrl && parsed.scriptUrl.trim().length > 0) ? parsed.scriptUrl.trim() : DEFAULT_SCRIPT_URL,
          collectorName: (parsed.collectorName || '').trim()
        };
      }
      return { scriptUrl: DEFAULT_SCRIPT_URL, collectorName: '' };
    } catch (e) {
      return { scriptUrl: DEFAULT_SCRIPT_URL, collectorName: '' };
    }
  }

  saveConfig({ scriptUrl, collectorName }) {
    this.config = {
      scriptUrl: (scriptUrl && scriptUrl.trim().length > 0) ? scriptUrl.trim() : DEFAULT_SCRIPT_URL,
      collectorName: (collectorName || '').trim()
    };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save Google Sheets config:', e);
    }
  }

  loadQueue() {
    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }

  loadStaged() {
    try {
      const saved = localStorage.getItem(STAGED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveStaged() {
    try {
      localStorage.setItem(STAGED_KEY, JSON.stringify(this.staged.slice(-50)));
    } catch (e) {
      console.warn('Failed to save staged cases:', e);
    }
  }

  enqueue(payload) {
    this.queue.push({
      id: payload.caseId || `QUEUED-${Date.now()}`,
      queuedAt: new Date().toISOString(),
      payload
    });
    this.saveQueue();
  }

  getQueueCount() {
    return this.queue.length;
  }

  getStagedCount() {
    return this.staged.length;
  }

  /**
   * Send a clinical case to Google Sheets Web App.
   * Uses Content-Type: text/plain;charset=utf-8 to prevent CORS Preflight (OPTIONS) failure.
   */
  async sendCase(clinicalState, generatedNote, metadataSnapshot) {
    const caseId = clinicalState.caseId || `SURG-${Date.now()}`;
    const payload = {
      action: 'record_case',
      schemaVersion: 'v0.4-Surg',
      caseId: caseId,
      timestamp: new Date().toISOString(),
      collectorName: this.config.collectorName || 'پزشک ثبت‌کننده',
      admissionPathway: clinicalState.admissionPathway || '',
      chiefComplaint: clinicalState.chiefComplaint || '',
      positiveFindingsCount: metadataSnapshot?.metrics?.positiveFindingsCount || 0,
      negativeFindingsCount: metadataSnapshot?.metrics?.negativeFindingsCount || 0,
      labsRecordedCount: metadataSnapshot?.metrics?.labsRecordedCount || 0,
      fullClinicalNote: generatedNote || '',
      semanticQualifiersJSON: JSON.stringify(metadataSnapshot?.semanticQualifiers || []),
      systemGapsJSON: JSON.stringify(metadataSnapshot?.systemGapsLogged || []),
      rawStateJSON: JSON.stringify(clinicalState)
    };

    // Keep in local staged history
    this.staged.unshift({
      caseId,
      timestamp: payload.timestamp,
      collectorName: payload.collectorName,
      chiefComplaint: payload.chiefComplaint,
      noteLength: (generatedNote || '').length
    });
    this.saveStaged();

    // Check script URL configuration
    if (!this.config.scriptUrl) {
      this.enqueue(payload);
      return {
        success: false,
        queued: true,
        message: 'آدرس وب‌اپ گوگل اسکریپت در تنظیمات وارد نشده است. پرونده در صف ذخیره شد.'
      };
    }

    // Check online status
    if (!navigator.onLine) {
      this.enqueue(payload);
      return {
        success: true,
        queued: true,
        message: 'اینترنت قطع است؛ پرونده در صف آفلاین ذخیره شد و پس از اتصال اینترنت خودکار ارسال می‌شود.'
      };
    }

    return await this._transmit(payload);
  }

  async _transmit(payload) {
    try {
      // POST with text/plain prevents CORS preflight OPTIONS request
      const response = await fetch(this.config.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.type !== 'opaque') {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        queued: false,
        message: 'پرونده با موفقیت به Google Sheets ارسال و ثبت شد.'
      };
    } catch (err) {
      console.warn('Network send failed, queueing offline:', err);
      this.enqueue(payload);
      return {
        success: true,
        queued: true,
        message: 'به دلیل خطای شبکه، پرونده در صف آفلاین محلی ذخیره شد و پس از رفع خطا ارسال می‌شود.'
      };
    }
  }

  /**
   * Flush all offline queued cases sequentially
   */
  async flushQueue() {
    if (!navigator.onLine || !this.config.scriptUrl || this.queue.length === 0) {
      return { count: this.queue.length, flushed: 0 };
    }

    let flushed = 0;
    const remaining = [];

    for (const item of this.queue) {
      try {
        const response = await fetch(this.config.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(item.payload)
        });

        if (response.ok || response.type === 'opaque') {
          flushed++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
        break; // Stop loop on continuous network failure
      }
    }

    this.queue = remaining;
    this.saveQueue();
    return { count: this.queue.length, flushed };
  }
}
