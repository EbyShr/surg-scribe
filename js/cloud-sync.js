export class CloudSyncManager {
  constructor() {
    this.config = JSON.parse(localStorage.getItem('surg_cloud_config') || '{}');
    this.pendingQueue = JSON.parse(localStorage.getItem('surg_sync_queue') || '[]');
    this.stagedRecords = JSON.parse(localStorage.getItem('surg_staged_records') || '[]');

    window.addEventListener('online', () => this.flushOfflineQueue());
  }

  saveConfig({ collectorName, mode, endpointUrl, apiKey }) {
    this.config = {
      collectorName: (collectorName || '').trim(),
      mode: mode || 'webhook',
      endpointUrl: (endpointUrl || '').trim(),
      apiKey: (apiKey || '').trim()
    };
    localStorage.setItem('surg_cloud_config', JSON.stringify(this.config));
  }

  getCollectorName() {
    return this.config.collectorName || 'anonymous_clerk';
  }

  getPendingCount() {
    return this.pendingQueue.length;
  }

  /**
   * ارسال پرونده به مخزن ابری (با پشتیبانی از صف آفلاین در صورت قطع بودن اینترنت بیمارستان)
   */
  async submitCaseToCloud(fullCaseRecord) {
    const payload = {
      case_id: fullCaseRecord.caseId,
      collector_name: this.config.collectorName || 'anonymous_clerk',
      review_status: 'pending_review',
      submitted_at: new Date().toISOString(),
      rotation: 'general_surgery',
      schema_version: 'v0.3-Surg',
      record_json: fullCaseRecord
    };

    // Also automatically add to local staging for manager review
    this.addCaseToStaging(payload);

    if (!navigator.onLine) {
      this._enqueueOffline(payload);
      return {
        status: 'queued_offline',
        message: 'اینترنت در دسترس نیست؛ پرونده در صف آفلاین ذخیره شد و به محض برقراری اتصال ارسال می‌گردد.'
      };
    }

    return await this._sendOverNetwork(payload);
  }

  async _sendOverNetwork(payload) {
    if (!this.config.endpointUrl) {
      this._enqueueOffline(payload);
      return {
        status: 'no_endpoint',
        message: 'آدرس مخزن ابری تنظیم نشده است. پرونده در صف ذخیره شد تا پس از وارد کردن آدرس ارسال شود.'
      };
    }

    try {
      if (this.config.mode === 'supabase') {
        // ارسال مستقیم به جدول clinical_cases در Supabase REST API
        const res = await fetch(`${this.config.endpointUrl}/rest/v1/clinical_cases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config.apiKey,
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
      } else {
        // ارسال به Google Apps Script Webhook یا سرور دلخواه
        const res = await fetch(this.config.endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
      }
      return { status: 'synced', message: 'پرونده با موفقیت به مخزن مرکزی ارسال شد (در انتظار بازبینی).' };
    } catch (err) {
      this._enqueueOffline(payload);
      return { status: 'queued_retry', message: `خطا در ارتباط؛ پرونده در صف آفلاین قرار گرفت (${err.message}).` };
    }
  }

  _enqueueOffline(payload) {
    this.pendingQueue = this.pendingQueue.filter((item) => item.case_id !== payload.case_id);
    this.pendingQueue.push(payload);
    localStorage.setItem('surg_sync_queue', JSON.stringify(this.pendingQueue));
  }

  async flushOfflineQueue() {
    if (!navigator.onLine || this.pendingQueue.length === 0 || !this.config.endpointUrl) return;
    const remaining = [];
    for (const item of this.pendingQueue) {
      const res = await this._sendOverNetwork(item);
      if (res.status !== 'synced') remaining.push(item);
    }
    this.pendingQueue = remaining;
    localStorage.setItem('surg_sync_queue', JSON.stringify(this.pendingQueue));
  }

  /* ==========================================================================
     Admin Staging & Batch Merge System
     ========================================================================== */
  addCaseToStaging(record) {
    const existingIdx = this.stagedRecords.findIndex((r) => r.case_id === record.case_id);
    if (existingIdx >= 0) {
      this.stagedRecords[existingIdx] = { ...this.stagedRecords[existingIdx], ...record };
    } else {
      this.stagedRecords.push({
        ...record,
        review_status: record.review_status || 'pending_review'
      });
    }
    this.saveStagedRecords();
  }

  saveStagedRecords() {
    localStorage.setItem('surg_staged_records', JSON.stringify(this.stagedRecords));
  }

  getStagedRecords() {
    return this.stagedRecords;
  }

  updateRecordStatus(caseId, newStatus) {
    const item = this.stagedRecords.find((r) => r.case_id === caseId);
    if (item) {
      item.review_status = newStatus;
      item.reviewed_at = new Date().toISOString();
      this.saveStagedRecords();
    }
  }

  deleteStagedRecord(caseId) {
    this.stagedRecords = this.stagedRecords.filter((r) => r.case_id !== caseId);
    this.saveStagedRecords();
  }

  /**
   * تولید خروجی یکپارچه دیتاست مرجع استاندارد با شماره‌گذاری ترتیبی REF-SURG-001, REF-SURG-002, ...
   */
  exportMasterDataset(onlyApproved = false) {
    const recordsToExport = onlyApproved
      ? this.stagedRecords.filter((r) => r.review_status === 'approved')
      : this.stagedRecords;

    if (recordsToExport.length === 0) {
      throw new Error('هیچ پرونده‌ای برای خروجی دیتاست وجود ندارد.');
    }

    const masterDataset = {
      dataset_title: 'SurgHistory Master Benchmark Dataset',
      dataset_version: 'v0.3-Surg',
      generated_at: new Date().toISOString(),
      total_cases: recordsToExport.length,
      cases: recordsToExport.map((item, index) => {
        const refId = `REF-SURG-${String(index + 1).padStart(3, '0')}`;
        return {
          reference_id: refId,
          original_case_id: item.case_id,
          collector_name: item.collector_name,
          review_status: item.review_status,
          submitted_at: item.submitted_at,
          record: item.record_json
        };
      })
    };

    const blob = new Blob([JSON.stringify(masterDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SurgHistory_MasterDataset_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return masterDataset;
  }
}
