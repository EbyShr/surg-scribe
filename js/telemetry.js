export class ClinicalTelemetryEngine {
  constructor(idleThresholdMs = 15000) {
    this.idleThresholdMs = idleThresholdMs;
    this.currentSection = null;
    this.isSectionTimingActive = false; // تنها پس از اولین کلیک/تایپ در بخش فعال می‌شود
    this.lastInteractionTime = null;
    this.idleTimerId = null;

    this.metrics = {
      sessionCreatedAt: new Date().toISOString(),
      firstInteractionAt: null,
      lastInteractionAt: null,
      totalActiveDurationMs: 0,
      idlePauseCount: 0,
      sectionActiveMs: {
        cc_admission: 0,
        hpi: 0,
        pmh_psh_hh: 0,
        ah_dh_sh_fh: 0,
        ros: 0,
        pe: 0,
        paraclinics: 0,
        reasoning_sq: 0
      },
      interactionCounts: {},
      freeTextSectionsUsed: new Set(),
      loggedMissingItems: [] // لاگ کمبودهای سیستم جهت ارتقای برنامه (System Gap Logger)
    };

    this._bindLifecycleEvents();
  }

  _bindLifecycleEvents() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.pauseActiveTimer('tab_hidden');
      }
    });
    window.addEventListener('blur', () => {
      this.pauseActiveTimer('window_blur');
    });
  }

  /**
   * هنگام جابه‌جایی کاربر بین تب‌ها صدا زده می‌شود.
   * توجه: تغییر تب تایمر بخش جدید را شروع نمی‌کند تا زمانی که کاربر تعاملی انجام دهد!
   */
  switchSection(newSectionId) {
    this.pauseActiveTimer('section_switch');
    this.currentSection = newSectionId;
    this.isSectionTimingActive = false;
  }

  /**
   * تنها زمانی صدا زده می‌شود که کاربر واقعاً تگی را لمس کند، متنی تایپ کند یا گزینه‌ای را تغییر دهد.
   */
  recordInteraction(sectionId, interactionType = 'tap', isFreeText = false) {
    const now = performance.now();
    const targetSection = sectionId || this.currentSection || 'cc_admission';

    if (!this.metrics.firstInteractionAt) {
      this.metrics.firstInteractionAt = new Date().toISOString();
    }
    this.metrics.lastInteractionAt = new Date().toISOString();

    if (this.currentSection !== targetSection) {
      this.switchSection(targetSection);
    }

    if (this.isSectionTimingActive && this.lastInteractionTime !== null) {
      const delta = now - this.lastInteractionTime;
      if (delta <= this.idleThresholdMs) {
        this.metrics.sectionActiveMs[targetSection] =
          (this.metrics.sectionActiveMs[targetSection] || 0) + delta;
        this.metrics.totalActiveDurationMs += delta;
      } else {
        // اگر فاصله دو کلیک بیش از ۱۵ ثانیه بود، زمان وقفه را دور بریز و یک توقف ثبت کن
        this.metrics.idlePauseCount += 1;
      }
    } else {
      // شروع تایمر از اولین تعامل در این بخش: افزودن مقدار پایه ۱۵۰۰ میلی‌ثانیه جهت جبران زمان تفکر و لمس اول
      this.isSectionTimingActive = true;
      const baseInitialMs = 1500;
      this.metrics.sectionActiveMs[targetSection] =
        (this.metrics.sectionActiveMs[targetSection] || 0) + baseInitialMs;
      this.metrics.totalActiveDurationMs += baseInitialMs;
    }

    this.lastInteractionTime = now;
    this.metrics.interactionCounts[interactionType] =
      (this.metrics.interactionCounts[interactionType] || 0) + 1;

    if (isFreeText) {
      this.metrics.freeTextSectionsUsed.add(targetSection);
    }

    this._resetIdleWatchdog();
  }

  /**
   * ثبت کمبودهای سیستم و موارد خارج از لیست جهت بازخورد و ارتقای برنامه (System Gap Logger)
   */
  logSystemGap(sectionId, missingText) {
    if (!missingText || !missingText.trim()) return;
    const cleanText = missingText.trim();
    const existingIdx = this.metrics.loggedMissingItems.findIndex(
      (item) => item.section === sectionId && (item.text === cleanText || item.note === cleanText)
    );
    if (existingIdx >= 0) {
      this.metrics.loggedMissingItems[existingIdx].updatedAt = new Date().toISOString();
    } else {
      this.metrics.loggedMissingItems.push({
        section: sectionId,
        text: cleanText,
        note: cleanText,
        loggedAt: new Date().toISOString()
      });
    }
    this.recordInteraction(sectionId, 'system_gap_logged', true);
  }

  _resetIdleWatchdog() {
    if (this.idleTimerId) clearTimeout(this.idleTimerId);
    this.idleTimerId = setTimeout(() => {
      this.pauseActiveTimer('idle_timeout');
    }, this.idleThresholdMs);
  }

  pauseActiveTimer(reason = 'manual') {
    if (!this.isSectionTimingActive || this.lastInteractionTime === null) return;
    const now = performance.now();
    const delta = now - this.lastInteractionTime;

    if (delta <= this.idleThresholdMs && this.currentSection) {
      this.metrics.sectionActiveMs[this.currentSection] =
        (this.metrics.sectionActiveMs[this.currentSection] || 0) + delta;
      this.metrics.totalActiveDurationMs += delta;
    }
    if (reason === 'idle_timeout') {
      this.metrics.idlePauseCount += 1;
    }

    this.isSectionTimingActive = false;
    this.lastInteractionTime = null;
    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId);
      this.idleTimerId = null;
    }
  }

  exportTelemetrySnapshot(clinicalState) {
    this.pauseActiveTimer('export');
    const sectionSeconds = {};
    for (const [key, ms] of Object.entries(this.metrics.sectionActiveMs)) {
      sectionSeconds[key] = Math.round(ms / 100) / 10;
    }

    // استخراج خودکار تمام systemGapNoteها در لحظه Export از روی استیت بالینی
    const allSystemGaps = [...this.metrics.loggedMissingItems];
    const sectionsWithGap = ['hpi', 'pmh', 'psh', 'hh', 'dh', 'ah', 'sh', 'fh', 'ros', 'pe', 'paraclinics'];
    sectionsWithGap.forEach((secKey) => {
      const note = clinicalState?.[secKey]?.systemGapNote;
      if (note && note.trim()) {
        const cleanNote = note.trim();
        const exists = allSystemGaps.some(
          (g) => g.section === secKey && (g.text === cleanNote || g.note === cleanNote)
        );
        if (!exists) {
          allSystemGaps.push({
            section: secKey,
            text: cleanNote,
            note: cleanNote,
            loggedAt: new Date().toISOString()
          });
        }
      }
    });

    // شمارش خودکار نکات مثبت و منفی کلیدی در تمام بخش‌ها
    let posCount = 0;
    let negCount = 0;
    const countTriState = (obj) => {
      if (!obj) return;
      Object.values(obj).forEach((val) => {
        if (typeof val === 'number') {
          if (val === 1) posCount++;
          if (val === -1) negCount++;
        } else if (typeof val === 'object' && val !== null) {
          if (val.state === 1) posCount++;
          if (val.state === -1) negCount++;
        }
      });
    };

    countTriState(clinicalState?.hpi?.symptoms);
    countTriState(clinicalState?.pmh?.items);
    countTriState(clinicalState?.ros?.items);
    countTriState(clinicalState?.pe?.findings);

    return {
      total_active_duration_sec: Math.round(this.metrics.totalActiveDurationMs / 100) / 10,
      idle_pause_count: this.metrics.idlePauseCount,
      section_durations_sec: sectionSeconds,
      pertinent_positives_count: posCount,
      pertinent_negatives_count: negCount,
      semantic_qualifiers_count: (clinicalState?.reasoning?.selectedSQs || []).length,
      free_text_fallback_triggered: this.metrics.freeTextSectionsUsed.size > 0 || allSystemGaps.length > 0,
      free_text_sections: Array.from(this.metrics.freeTextSectionsUsed),
      system_gaps_logged: allSystemGaps,
      first_interaction_at: this.metrics.firstInteractionAt,
      last_interaction_at: this.metrics.lastInteractionAt
    };
  }
}
