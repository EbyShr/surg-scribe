/**
 * ClinicalCaseAnalytics - Surg-Scribe v0.4-Surg
 * Lightweight, timer-free case analytics and structured metadata extractor.
 * Extracts positive/negative finding counts, semantic qualifiers, and system gap logs.
 */

export class ClinicalCaseAnalytics {
  /**
   * Helper to count positives, negatives, and system gaps across all clinicalState sections.
   */
  static analyzeState(clinicalState) {
    let positiveCount = 0;
    let negativeCount = 0;
    const systemGaps = [];

    if (!clinicalState) {
      return { positiveCount, negativeCount, systemGaps };
    }

    // Helper for tag collections with values +1 / -1
    const scanTags = (obj, sectionName) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'systemGapNote' || key === 'notes' || key === 'detail' || key === 'note') {
          if (typeof val === 'string' && val.trim().length > 0) {
            systemGaps.push({ section: sectionName, field: key, note: val.trim() });
          }
          continue;
        }
        if (typeof val === 'object' && val !== null) {
          const st = val.state !== undefined ? val.state : (val.status !== undefined ? val.status : val.value);
          if (st === 1 || st === '+1') positiveCount++;
          else if (st === -1 || st === '-1') negativeCount++;
        } else if (val === 1 || val === '+1') {
          positiveCount++;
        } else if (val === -1 || val === '-1') {
          negativeCount++;
        }
      }
    };

    // Scan HPI
    if (clinicalState.hpi) {
      if (clinicalState.hpi.symptoms) scanTags(clinicalState.hpi.symptoms, 'hpi_symptoms');
      if (clinicalState.hpi.associatedSymptoms) scanTags(clinicalState.hpi.associatedSymptoms, 'hpi_associated');
      if (clinicalState.hpi.systemGapNote && clinicalState.hpi.systemGapNote.trim().length > 0) {
        systemGaps.push({ section: 'hpi', note: clinicalState.hpi.systemGapNote.trim() });
      }
    }

    // Scan PMH, PSH, HH, DH, AH, SH, FH
    ['pmh', 'psh', 'hh', 'dh', 'ah', 'sh', 'fh'].forEach((sec) => {
      const data = clinicalState[sec];
      if (data) {
        if (data.items) scanTags(data.items, sec);
        if (data.tags) scanTags(data.tags, sec);
        if (data.highAlert && Array.isArray(data.highAlert)) {
          positiveCount += data.highAlert.length;
        }
        if (data.selected && Array.isArray(data.selected)) {
          positiveCount += data.selected.length;
        }
        if (data.systemGapNote && data.systemGapNote.trim().length > 0) {
          systemGaps.push({ section: sec, note: data.systemGapNote.trim() });
        }
      }
    });

    // Scan ROS
    if (clinicalState.ros) {
      if (clinicalState.ros.items) scanTags(clinicalState.ros.items, 'ros');
      for (const [sysKey, sysVal] of Object.entries(clinicalState.ros)) {
        if (sysKey === 'systemGapNote') {
          if (typeof sysVal === 'string' && sysVal.trim().length > 0) {
            systemGaps.push({ section: 'ros', note: sysVal.trim() });
          }
        } else if (sysKey !== 'items' && typeof sysVal === 'object' && sysVal !== null) {
          scanTags(sysVal, `ros_${sysKey}`);
        }
      }
    }

    // Scan PE
    if (clinicalState.pe) {
      if (clinicalState.pe.findings) scanTags(clinicalState.pe.findings, 'pe_findings');
      for (const [peSecKey, peSecVal] of Object.entries(clinicalState.pe)) {
        if (peSecKey === 'systemGapNote') {
          if (typeof peSecVal === 'string' && peSecVal.trim().length > 0) {
            systemGaps.push({ section: 'pe', note: peSecVal.trim() });
          }
        } else if (peSecKey !== 'findings' && peSecKey !== 'vitals' && typeof peSecVal === 'object' && peSecVal !== null) {
          scanTags(peSecVal, `pe_${peSecKey}`);
        }
      }
    }

    // Scan Paraclinics imaging
    if (clinicalState.paraclinics) {
      if (clinicalState.paraclinics.imagingReports && Array.isArray(clinicalState.paraclinics.imagingReports)) {
        clinicalState.paraclinics.imagingReports.forEach((rep) => {
          if (rep.tags && Array.isArray(rep.tags)) {
            positiveCount += rep.tags.length;
          }
        });
      }
      if (clinicalState.paraclinics.systemGapNote && clinicalState.paraclinics.systemGapNote.trim().length > 0) {
        systemGaps.push({ section: 'paraclinics', note: clinicalState.paraclinics.systemGapNote.trim() });
      }
    }

    return { positiveCount, negativeCount, systemGaps };
  }

  /**
   * Build complete metadata snapshot for a clinical case (used by JSON export and Google Sheets sync)
   */
  static buildMetadataSnapshot(clinicalState, collectorName = '') {
    const { positiveCount, negativeCount, systemGaps } = this.analyzeState(clinicalState);

    // Semantic qualifiers selected
    const semanticQualifiersSelected = [];
    if (clinicalState?.reasoning?.selectedSQs && Array.isArray(clinicalState.reasoning.selectedSQs)) {
      clinicalState.reasoning.selectedSQs.forEach((sq) => {
        semanticQualifiersSelected.push({ value: sq });
      });
    } else if (clinicalState?.semanticQualifiers) {
      for (const [category, val] of Object.entries(clinicalState.semanticQualifiers)) {
        if (val && typeof val === 'string' && val.trim().length > 0) {
          semanticQualifiersSelected.push({ category, value: val.trim() });
        }
      }
    }

    // Check lab data
    let labCount = 0;
    if (clinicalState?.paraclinics?.labs) {
      for (const [k, v] of Object.entries(clinicalState.paraclinics.labs)) {
        if (v !== undefined && v !== null && v !== '') {
          labCount++;
        }
      }
    }

    return {
      schemaVersion: 'v0.4-Surg',
      exportedAt: new Date().toISOString(),
      caseId: clinicalState?.caseId || `SURG-${Date.now()}`,
      collector: collectorName || clinicalState?.collectorName || 'anonymous',
      admissionPathway: clinicalState?.cc?.pathway || clinicalState?.admissionPathway || 'unknown',
      chiefComplaint: clinicalState?.cc?.patientQuote || clinicalState?.cc?.selectedCategoryLabel || clinicalState?.chiefComplaint || '',
      metrics: {
        positiveFindingsCount: positiveCount,
        negativeFindingsCount: negativeCount,
        labsRecordedCount: labCount,
        systemGapsLoggedCount: systemGaps.length,
        freeTextFallbackTriggered: systemGaps.length > 0
      },
      semanticQualifiers: semanticQualifiersSelected,
      systemGapsLogged: systemGaps
    };
  }
}

// Backwards-compatible shim in case any component calls methods of ClinicalTelemetryEngine
export class ClinicalTelemetryEngine {
  constructor() {
    this.currentSection = null;
  }
  switchSection(newSectionId) {
    this.currentSection = newSectionId;
  }
  recordInteraction() {}
  pauseActiveTimer() {}
  logMissingItem(sec, item) {}
  exportTelemetrySnapshot(clinicalState) {
    return ClinicalCaseAnalytics.buildMetadataSnapshot(clinicalState);
  }
}
