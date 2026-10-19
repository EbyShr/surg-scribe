/**
 * ClinicalCaseAnalytics - Surg-Scribe v0.5-Surg
 * Case analytics, structured metadata extractor and system gap logger.
 * Handles positive/negative findings metrics, lab metrics, and system gaps.
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

    const checkGap = (sec, val) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        systemGaps.push({ section: sec, note: val.trim() });
      }
    };

    // 1. Scan HPI
    if (clinicalState.hpi) {
      // Pain episodes
      if (clinicalState.hpi.painList && Array.isArray(clinicalState.hpi.painList)) {
        clinicalState.hpi.painList.forEach((p) => {
          if (p.selectedRegions && p.selectedRegions.length > 0) positiveCount++;
          if (p.radiationList && p.radiationList.length > 0) positiveCount += p.radiationList.length;
          if (p.noRadiation) negativeCount++;
          if (p.aggravating && p.aggravating.length > 0) positiveCount += p.aggravating.length;
          if (p.relieving && p.relieving.length > 0) positiveCount += p.relieving.length;
        });
      }

      // Symptoms
      if (clinicalState.hpi.symptoms && typeof clinicalState.hpi.symptoms === 'object') {
        Object.values(clinicalState.hpi.symptoms).forEach((val) => {
          const st = typeof val === 'object' && val !== null ? val.state : val;
          if (st === 1 || st === '+1') positiveCount++;
          else if (st === -1 || st === '-1') negativeCount++;
        });
      }

      checkGap('hpi', clinicalState.hpi.systemGapNote);
    }

    // 2. Scan PMH (7 Tree Gatekeepers & Items)
    if (clinicalState.pmh) {
      if (clinicalState.pmh.masterRoutineNegative) {
        negativeCount += 4; // DM, HTN, DLP, IHD
      }
      if (clinicalState.pmh.categories && typeof clinicalState.pmh.categories === 'object') {
        Object.values(clinicalState.pmh.categories).forEach((cat) => {
          if (cat.status === 'negated') negativeCount++;
          if (cat.items && typeof cat.items === 'object') {
            Object.values(cat.items).forEach((val) => {
              const st = typeof val === 'object' && val !== null ? val.state : val;
              if (st === 1 || st === '+1') positiveCount++;
              else if (st === -1 || st === '-1') negativeCount++;
            });
          }
          if (cat.otherNote && cat.otherNote.trim()) positiveCount++;
        });
      }
      if (clinicalState.pmh.items && typeof clinicalState.pmh.items === 'object') {
        Object.values(clinicalState.pmh.items).forEach((val) => {
          const st = typeof val === 'object' && val !== null ? val.state : val;
          if (st === 1 || st === '+1') positiveCount++;
          else if (st === -1 || st === '-1') negativeCount++;
        });
      }
      checkGap('pmh', clinicalState.pmh.systemGapNote);
    }

    // 3. Scan PSH & Ob/Gyn
    if (clinicalState.psh) {
      if (clinicalState.psh.note && clinicalState.psh.note.trim()) positiveCount++;
      checkGap('psh', clinicalState.psh.systemGapNote);
    }

    if (clinicalState.obgyn) {
      if (clinicalState.obgyn.pregnancies && Array.isArray(clinicalState.obgyn.pregnancies)) {
        positiveCount += clinicalState.obgyn.pregnancies.length;
      }
      checkGap('obgyn', clinicalState.obgyn.systemGapNote);
    }

    // 4. Scan DH (5 Categories & Custom Drugs)
    if (clinicalState.dh) {
      if (clinicalState.dh.categories && typeof clinicalState.dh.categories === 'object') {
        Object.values(clinicalState.dh.categories).forEach((cat) => {
          if (cat.drugs && typeof cat.drugs === 'object') {
            Object.values(cat.drugs).forEach((drug) => {
              if (drug && (drug.active || drug === true)) positiveCount++;
            });
          }
        });
      }
      if (clinicalState.dh.customDrugs && Array.isArray(clinicalState.dh.customDrugs)) {
        positiveCount += clinicalState.dh.customDrugs.length;
      }
      if (clinicalState.dh.highAlert && Array.isArray(clinicalState.dh.highAlert)) {
        positiveCount += clinicalState.dh.highAlert.length;
      }
      checkGap('dh', clinicalState.dh.systemGapNote);
    }

    // 5. Scan AH, SH, FH
    if (clinicalState.ah) {
      if (clinicalState.ah.nkda) negativeCount++;
      if (clinicalState.ah.selected && Array.isArray(clinicalState.ah.selected)) {
        positiveCount += clinicalState.ah.selected.length;
      }
      checkGap('ah', clinicalState.ah.systemGapNote);
    }

    if (clinicalState.sh) {
      if (clinicalState.sh.cigsPerDay && Number(clinicalState.sh.cigsPerDay) > 0) positiveCount++;
      if (clinicalState.sh.opium && clinicalState.sh.opium.trim()) positiveCount++;
      checkGap('sh', clinicalState.sh.systemGapNote);
    }

    if (clinicalState.fh) {
      if (clinicalState.fh.selected && Array.isArray(clinicalState.fh.selected)) {
        positiveCount += clinicalState.fh.selected.length;
      }
      checkGap('fh', clinicalState.fh.systemGapNote);
    }

    // 6. Scan ROS
    if (clinicalState.ros) {
      if (clinicalState.ros.items && typeof clinicalState.ros.items === 'object') {
        Object.values(clinicalState.ros.items).forEach((val) => {
          const st = typeof val === 'object' && val !== null ? val.state : val;
          if (st === 1 || st === '+1') positiveCount++;
          else if (st === -1 || st === '-1') negativeCount++;
        });
      }
      checkGap('ros', clinicalState.ros.systemGapNote);
    }

    // 7. Scan PE
    if (clinicalState.pe) {
      if (clinicalState.pe.findings && typeof clinicalState.pe.findings === 'object') {
        Object.values(clinicalState.pe.findings).forEach((val) => {
          const st = typeof val === 'object' && val !== null ? val.state : val;
          if (st === 1 || st === '+1') positiveCount++;
          else if (st === -1 || st === '-1') negativeCount++;
        });
      }
      checkGap('pe', clinicalState.pe.systemGapNote);
    }

    // 8. Scan Paraclinics
    if (clinicalState.paraclinics) {
      if (clinicalState.paraclinics.imagingReports && Array.isArray(clinicalState.paraclinics.imagingReports)) {
        clinicalState.paraclinics.imagingReports.forEach((rep) => {
          if (rep.tags && Array.isArray(rep.tags)) {
            positiveCount += rep.tags.length;
          }
          if (rep.summary && rep.summary.trim()) {
            positiveCount++;
          }
        });
      }
      checkGap('paraclinics', clinicalState.paraclinics.systemGapNote);
    }

    return { positiveCount, negativeCount, systemGaps };
  }

  /**
   * Build complete metadata snapshot for a clinical case
   */
  static buildMetadataSnapshot(clinicalState, collectorName = '') {
    const { positiveCount, negativeCount, systemGaps } = this.analyzeState(clinicalState);

    let labCount = 0;
    if (clinicalState?.paraclinics?.labs) {
      for (const [_, v] of Object.entries(clinicalState.paraclinics.labs)) {
        if (v !== undefined && v !== null && v !== '') {
          labCount++;
        }
      }
    }

    return {
      schemaVersion: 'v0.5-Surg',
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
      systemGapsLogged: systemGaps
    };
  }
}

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
