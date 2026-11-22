# SurgHistory Clinical Workstation — Project Manifest

> **Generated:** 2026-11-22  
> **Application Version:** `2.0.0` (`package.json`) / `v2.0-Pro` (`index.html`, `sw.js`, `i18n.js`)  
> **Architecture:** Zero-build Vanilla ES Modules + Offline-First PWA (`sw.js`) + Capacitor Android wrapper (`capacitor.config.json`)

---

## 1. Complete Project File Tree & File Roles

### 1.1 Directory Tree (30 Source, Asset & Config Files)

```text
E:\Medicine proposal\
├── .gitignore
├── capacitor.config.json
├── index.html
├── manifest.json
├── package.json
├── PROJECT_MANIFEST.md
├── README.md
├── server.js
├── start-app.bat
├── sw.js
├── test_v07.mjs
├── css/
│   └── clinical-ui.css
├── icons/
│   ├── icon-192.png
│   ├── icon-192.svg
│   ├── icon-512.png
│   └── icon-512.svg
└── js/
    ├── app.js
    ├── cloud-sync.js
    ├── fuzzy-search.js
    ├── generator.js
    ├── google-sync.js
    ├── i18n.js
    ├── icons.js
    ├── schema.js
    ├── storage-vault.js
    ├── telemetry.js
    └── data/
        ├── drugs-supplements-v22.js
        ├── hpi-lexicon.js
        ├── pe-bank.js
        ├── psh-otc-labs-v21.js
        └── ros-bank.js
```

---

### 1.2 Detailed File Roles

| File Path | Size (Bytes) | Lines | Exact Role |
| :--- | ---: | ---: | :--- |
| `.gitignore` | 56 | 7 | Git ignore rules excluding OS metadata (`.DS_Store`, `Thumbs.db`), `*.log`, `node_modules/`, `.vscode/`, and `.idea/`. |
| `capacitor.config.json` | 478 | 25 | Capacitor native mobile wrapper configuration (`appId: "com.surghistory.clinical"`, `appName: "SurgHistory"`, `webDir: "."`, `androidScheme: "https"`, `SplashScreen`, and `StatusBar` plugins). |
| `index.html` | 283,253 | 2,885 | Single-page clinical workstation shell. Defines the 56px top workstation bar, 3-column desktop grid (230px Navigation Rail, Center Workspace, 420px Live Clinical Chart Sheet), 3 workstation modes (**Mode 1: Admission H&P** across 8 tabs, **Mode 2: Emergency ATLS**, **Mode 3: SOAP Progress Notes**), mobile bottom dock/preview drawer, Global Command Palette (`Ctrl+K`), Shift Manager modal, System Settings modal, Secret URL Admin Vault modal (`#admin-vault` / `?admin=1`), ES module entry (`<script type="module" src="js/app.js?v=1.2.0">`), and inline Service Worker registration (`sw.js?v=1.2.0`). |
| `manifest.json` | 1,922 | 76 | PWA Web App Manifest (`id: "/surg-scribe/"`, `display: "standalone"`, `lang: "fa"`, `dir: "rtl"`, `theme_color: "#0D9488"`, 6 icon entries, and 3 quick-launch shortcuts for `admission`, `atls`, and `soap`). |
| `package.json` | 384 | 14 | NPM package descriptor (`name: "surghistory-clinical"`, `version: "2.0.0"`, `main: "server.js"`, scripts `"start": "node server.js"` and `"test": "node test_v07.mjs"`). Note: does not set `"type": "module"` because `server.js` uses CommonJS `require()`. |
| `README.md` | 4,566 | 67 | Legacy Persian documentation (`v0.2-Surg`) describing initial architectural concepts, tri-state clinical chips, pain trajectory mapping, telemetry, and local HTTP execution. |
| `server.js` | 1,486 | 50 | Zero-dependency Node.js HTTP static file server listening on `PORT = 8000` with MIME type mapping (`.html`, `.js`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.ico`), `Cache-Control: no-cache`, and `Access-Control-Allow-Origin: *`. |
| `start-app.bat` | 318 | 10 | Windows launcher script that opens `http://localhost:8000` in the default browser and runs `node server.js`. |
| `sw.js` | 3,039 | 101 | Offline-first PWA Service Worker (`CACHE_NAME = 'surg-v2.0.0-clinical-pro-cache-v200'`). Pre-caches core static assets on `install`, cleans legacy caches on `activate`, applies network-first with cache fallback for same-origin requests/navigation, and stale-while-revalidate for Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`). |
| `test_v07.mjs` | 2,988 | 66 | Node.js ESM smoke test script validating schema bank counts, `filterSchemaItems` omnisearch across Persian/English/brand terms, default empty `hpi.presentations` state, and `generateClinicalNote` narrative output with 0 and 3 presentations. |
| `css/clinical-ui.css` | 217,670 | 9,262 | Complete UI design system (`v2.0-Pro` / `v2.1-Audit-Core`): CSS custom properties, 3-panel desktop & responsive `< 1024px` mobile layouts, Dark/Light themes, RTL/LTR localization overrides, 5 typography profiles, tri-state split pills, archetype cards, SOAP/ATLS capsule grids, A4 print styling, command palette modal, and Admin Vault table/inspector styles. |
| `icons/icon-192.png` | 1,556 | — | 192×192 raster PWA icon (`any` & `maskable`). |
| `icons/icon-192.svg` | 716 | 15 | 192×192 vector SVG PWA icon. |
| `icons/icon-512.png` | 4,828 | — | 512×512 raster PWA icon (`any` & `maskable`). |
| `icons/icon-512.svg` | 1,270 | 26 | 512×512 vector SVG PWA icon. |
| `js/app.js` | 513,246 | 12,386 | Main application controller and UI orchestrator. Defines state factories (`clinicalState`, `soapState`, `atls`), reactive DOM event bindings, dynamic rendering for HPI presentations, PMH/PSH/DH/AH/SH/FH, ROS, PE, Paraclinics, ATLS, and multi-day SOAP tracking, shift case deduplication/vault integration, Google Sheets sync triggers, command bar, and Secret Admin Vault explorer. |
| `js/cloud-sync.js` | 6,983 | 190 | Legacy `CloudSyncManager` class supporting generic webhook/Supabase REST submission, offline sync queuing, local review staging (`surg_staged_records`), and master benchmark JSON export (`REF-SURG-###`). Currently unimported by active modules. |
| `js/fuzzy-search.js` | 6,062 | 152 | Bilingual typo-tolerant search engine (`v0.8-Omnisearch`) providing Arabic/Persian character & zero-width normalization, Persian phonetic skeletonization, Damerau-Levenshtein edit distance, and multi-token scored matching (`smartClinicalSearch`). |
| `js/generator.js` | 150,916 | 2,870 | Deterministic bilingual clinical narrative engine. Generates Markdown/text clinical notes for Admission H&P (Persian & English), Problem Representation synthesis, ATLS Trauma Surveys (Persian & English), Daily SOAP Progress Notes (Persian & English), Persian text normalization, and PII-ready export sanitization. |
| `js/google-sync.js` | 14,632 | 418 | Google Apps Script sync engine (`GoogleSheetsSyncEngine` + `gsheetSync` singleton). Performs deep PII stripping (`deepStripPIIForCloud`) across structured fields and Markdown strings, payload fingerprinting for deduplication, offline queue persistence, and admin 2D sheet fetching (`fetchCloudDatabase`, `fetchSheet2DData`). |
| `js/i18n.js` | 32,173 | 678 | Bilingual localization (`fa` RTL / `en` LTR), theme (`dark` / `light`), and typography engine (`AVAILABLE_FONTS` — 5 font profiles). Holds `I18N_DICTIONARY`, DOM translation (`applyI18nToDOM`), and re-exports label translators from `schema.js`. |
| `js/icons.js` | 18,226 | 104 | Lucide-inspired inline SVG icon registry (`ICONS`, 55 vector icons) and DOM helper functions (`getIconSvg`, `injectDomIcons`). |
| `js/schema.js` | 330,678 | 3,071 | Master clinical taxonomy, bilingual translation dictionary (`DIRECT_FA_TO_EN_MAP`, 754 entries), HPI presentation archetypes, PMH/PSH/DH/FH/ROS/PE/Lab panels, normal PE baselines, and aggregator/re-export hub for `js/data/*.js`. |
| `js/storage-vault.js` | 13,761 | 354 | Dual-layer offline persistence vault (`ImmortalStorageVault` + `storageVault` singleton) synchronizing `localStorage` and `IndexedDB` (`ClinicalScribeImmortalDB`), migrating legacy `v0.1`–`v0.9` storage keys, deep-merging drafts against default schemas, and maintaining permanent delete tombstones. |
| `js/telemetry.js` | 8,469 | 224 | Case analytics and telemetry metadata engine (`ClinicalCaseAnalytics`, `ClinicalTelemetryEngine`) counting positive/negative clinical findings, recorded labs, and system gap notes across `clinicalState`. |
| `js/data/drugs-supplements-v22.js` | 92,545 | 336 | Expanded formulary bank (`EXPANDED_DRUGS_AND_SUPPLEMENTS_BANK`, 321 entries) covering modern medications, biologics, inhalers, supplements, and Persian/English brand aliases. |
| `js/data/hpi-lexicon.js` | 189,409 | 469 | Master HPI vocabulary bank containing 98 pain qualifiers (`HPI_PAIN_QUALIFIERS`), 311 associated symptoms (`HPI_ASSOCIATED_SYMPTOMS`), and their combined 409-item array (`HPI_QUALIFIERS_AND_SYMPTOMS`). |
| `js/data/pe-bank.js` | 118,750 | 367 | Master Physical Examination signs bank (`MASTER_PE_BANK`, 306 items) organized by system and subGroup with core flags, normal states, and detail hints. |
| `js/data/psh-otc-labs-v21.js` | 75,677 | 284 | v2.1 clinical data patch exporting OTC/herbal drugs (`OTC_AND_HERBAL_DRUGS_BANK`, 69 items), surgical procedures (`MASTER_PSH_SURGERIES_BANK`, 122 items), and supplementary lab tests (`MISSING_LABS_PATCH_V21`, 85 items). |
| `js/data/ros-bank.js` | 96,971 | 191 | Master Review of Systems bank (`MASTER_ROS_BANK`, 162 items) tagged by system, gender applicability, core status, aliases, and subTypes. |

---

## 2. Exported Functions, Arrays, Objects & Classes per JavaScript Module

### 2.1 Data Bank Modules (`js/data/*.js`)

#### `js/data/hpi-lexicon.js` (3 exports)
| Export Name | Type / Size | Item Keys / Definition |
| :--- | :--- | :--- |
| `HPI_PAIN_QUALIFIERS` | `Array(98)` | `{ id, type, category, en, fa, colloquial_fa, modifiers }` |
| `HPI_ASSOCIATED_SYMPTOMS` | `Array(311)` | `{ id, type, category, en, fa, colloquial_fa, modifiers, isCore, isPainLocation, aliases }` |
| `HPI_QUALIFIERS_AND_SYMPTOMS` | `Array(409)` | Concatenated bank `[...HPI_PAIN_QUALIFIERS, ...HPI_ASSOCIATED_SYMPTOMS]` |

#### `js/data/ros-bank.js` (1 export)
| Export Name | Type / Size | Item Keys |
| :--- | :--- | :--- |
| `MASTER_ROS_BANK` | `Array(162)` | `{ id, system, gender, isCore, en, fa, aliases, subTypes }` |

#### `js/data/pe-bank.js` (1 export)
| Export Name | Type / Size | Item Keys |
| :--- | :--- | :--- |
| `MASTER_PE_BANK` | `Array(306)` | `{ id, system, subGroup, en, fa, aliases, isCore, normalState, detailHint }` |

#### `js/data/psh-otc-labs-v21.js` (3 exports)
| Export Name | Type / Size | Item Keys |
| :--- | :--- | :--- |
| `OTC_AND_HERBAL_DRUGS_BANK` | `Array(69)` | `{ id, label, en, category, aliases }` |
| `MASTER_PSH_SURGERIES_BANK` | `Array(122)` | `{ id, label, en, category, aliases }` |
| `MISSING_LABS_PATCH_V21` | `Array(85)` | `{ id, label, en, unit, min, max, panel, isCore, aliases }` |

#### `js/data/drugs-supplements-v22.js` (1 export)
| Export Name | Type / Size | Item Keys |
| :--- | :--- | :--- |
| `EXPANDED_DRUGS_AND_SUPPLEMENTS_BANK` | `Array(321)` | `{ id, label, en, category, aliases }` |

---

### 2.2 `js/schema.js` (62 exports)

#### Re-exports from `js/data/*` (8)
- `HPI_QUALIFIERS_AND_SYMPTOMS` (`Array(409)`)
- `HPI_PAIN_QUALIFIERS` (`Array(98)`)
- `HPI_ASSOCIATED_SYMPTOMS` (`Array(311)`)
- `MASTER_ROS_BANK` (`Array(162)`)
- `MASTER_PE_BANK` (`Array(306)`)
- `OTC_AND_HERBAL_DRUGS_BANK` (`Array(69)`)
- `EXPANDED_DRUGS_AND_SUPPLEMENTS_BANK` (`Array(321)`)
- `MISSING_LABS_PATCH_V21` (`Array(85)`)

#### Exported Functions (7)
- `getCurrentLang()` — Reads `'fa' | 'en'` from `localStorage` (`surg_app_lang_v05`) or in-memory fallback.
- `setCurrentLang(lang)` — Sets and persists active schema language.
- `getItemDisplayTitle(item)` — Formats a bilingual item title according to active language.
- `tBrands(rawBrands)` — Strips Persian script from drug brand strings when UI language is `'en'`.
- `tLabel(rawLabel, explicitEn = '')` — Translates bilingual or Persian labels to clean English via `DIRECT_FA_TO_EN_MAP` or parenthetical extraction.
- `formatRadiationItem(site, modifier)` — Formats pain radiation site + modifier string.
- `inferPmhCatId(item)` — Infers the PMH category ID (`cardiac`, `pulm`, `endo`, `gi_hepatic`, `renal_gu`, `neuro_psych`, `heme_onc`) for any PMH item.

#### Exported Arrays & Objects (47)
- **Dictionaries & Archetypes:** `DIRECT_FA_TO_EN_MAP` (`Object(754 keys)`), `CLINICAL_PRESENTATION_ARCHETYPES` (`Array(5)`).
- **Pain & HPI Option Banks:** `PAIN_BODY_REGIONS` (`Array(4)`), `PAIN_TIMING_OPTIONS` (`Array(5)`), `PAIN_AGGRAVATING_FACTORS` (`Array(6)`), `PAIN_RELIEVING_FACTORS` (`Array(7)`), `RADIATION_SITES_V2` (`Array(11)`), `HPI_BASIC_SYMPTOMS` (`Array(8)`), `HPI_UNLOCKABLE_MODULES` (`Array(5)`), `MASTER_SYMPTOMS_BANK` (`Array(109)`), `ALL_MASTER_SYMPTOMS` (`Array(109)` — alias of `MASTER_SYMPTOMS_BANK`).
- **Non-Pain Archetype & Exam Schemas:** `MASS_GROWTH_PATTERNS` (`Array(4)`), `MASS_PAIN_STATUSES` (`Array(3)`), `MASS_ASSOCIATED_SIGNS` (`Array(5)`), `TRAUMA_MOI_OPTIONS` (`Array(8)`), `TRAUMA_TRANSPORT_OPTIONS` (`Array(4)`), `TRAUMA_INJURED_ZONES` (`Array(8)`), `TRAUMA_CHECKLIST` (`Array(7)`), `FUNCTIONAL_SYMPTOM_OPTIONS` (`Array(7)`), `FUNCTIONAL_ONSET_OPTIONS` (`Array(3)`), `ELECTIVE_DISCOVERY_OPTIONS` (`Array(4)`), `MASS_EXAM_SCHEMA` (`Object(4 keys)`: `consistencies`, `margins`, `mobilities`, `skinFindings`), `ATLS_EXAM_SCHEMA` (`Object(6 keys)`: `primarySurvey`, `woundTypes`, `bleedingStatuses`, `distalNeurovascularStatuses`, `burnDegrees`, `burnInhalationSigns`).
- **PMH, PSH, FH & DH Banks:** `MASTER_PMH_CATEGORIES` (`Array(7)`), `PMH_CATEGORIES` (`Array(7)` — alias), `HIDDEN_EXTENDED_PMH_DATABASE` (`Array(85)`), `ALL_MASTER_PMH_ITEMS` (`Array(122)`), `MASTER_PSH_SURGERIES_BANK` (`Array(140)`), `PSH_SURGICAL_PROCEDURES_BANK` (`Array(140)` — alias), `FH_CANCER_HEREDITARY_DATABASE` (`Array(20)`), `DH_SIG_OPTIONS` (`Array(7)`), `MASTER_DRUG_CATEGORIES` (`Array(10)`), `DH_CATEGORIES` (`Array(10)` — alias), `ALL_MASTER_DRUGS` (`Array(606)` — deduplicated union of core drugs, OTC/herbal, and v2.2 expanded drugs).
- **ROS, PE & General Surgical Schema:** `ROS_SYSTEM_META` (`Array(14)`), `ROS_GROUPS_BILINGUAL` (`Array(14)`), `PE_SYSTEMS_CONFIG` (`Array(12)`), `PE_SUBGROUP_TITLES` (`Object(55 keys)`), `PE_MANDATORY_PILLARS` (`Array(12)`), `PE_UNLOCKABLE_MODULES` (`Array(5)`), `PE_NORMAL_BASELINES` (`Object(5 keys)`: `pe_general_heent_cp`, `pe_abd_inspection`, `pe_abd_auscultation`, `pe_abd_percussion`, `pe_abd_palpation`), `PE_COMPREHENSIVE_SYSTEMS` (`Array(12)`), `SURGICAL_SCHEMA` (`Object(8 keys)`: `admissionPathways`, `painSpatialPatterns`, `abdominalRegions`, `radiationSites`, `familyRelations`, `allergyTemplates`, `fhItems`, `paraclinicModalities`).
- **Laboratory Panels & Banks:** `SURGICAL_LAB_PANELS` (`Array(7)`), `LAB_PANELS` (`Array(7)` — alias), `EXTENDED_LAB_DATABASE` (`Array(155)`), `MASTER_ALL_LAB_TESTS` (`Array(201)` — deduplicated union of panel labs, extended labs, and v2.1 patch labs).

---

### 2.3 `js/generator.js` (15 exports)

All 15 exports are functions:
1. `normalizePersianClinicalText(text)` — Standardizes Arabic/Persian glyphs (`ي`/`ك` → `ی`/`ک`), spacing, and punctuation.
2. `sanitizeRecordForExport(rawState)` — Returns a PII-stripped clone of a clinical record for safe export.
3. `renderArchetypeNarrative(item, index = 0, totalCount = 1)` — Renders Persian HPI prose for any of the 5 clinical presentation archetypes.
4. `renderArchetypeNarrativeEn(item, index = 0, totalCount = 1)` — Renders English HPI prose for any of the 5 clinical presentation archetypes.
5. `getRosFindingsBySystem(state, systemKey, lang = 'fa')` — Collects pertinent positive/negative ROS findings for a given system.
6. `getPeFindingsBySystem(state, systemKey, lang = 'fa')` — Collects pertinent positive/negative PE findings for a given system.
7. `getPanelizedLabFindings(state, lang = 'fa')` — Groups recorded lab values by panel and appends abnormal `↑ High` / `↓ Low` flags.
8. `generateNarrativeCCAndHPI(state)` — Builds the Persian Chief Complaint and HPI narrative blocks.
9. `generateEnglishClinicalNote(state)` — Builds the complete Admission H&P clinical note in English.
10. `generateClinicalNote(state, langOverride)` — Main Admission H&P note entry point; delegates to English or Persian generator based on `langOverride` or `getCurrentLanguage()`.
11. `synthesizeProblemRepresentation(state)` — Synthesizes a 1-sentence clinical Problem Representation summary.
12. `generateEnglishSOAPNote(soapState, linkedCaseState = null)` — Generates an English daily SOAP progress note.
13. `generateSOAPProgressNote(soapState, linkedCaseState = null)` — Main SOAP note entry point (bilingual dispatch).
14. `generateEnglishATLSNote(atlsState = {}, clinicalState = null)` — Generates an English ATLS Trauma Primary/Secondary survey note.
15. `generateATLSNote(atlsState = {}, clinicalState = null)` — Main ATLS note entry point (bilingual dispatch).

---

### 2.4 `js/storage-vault.js` (6 exports)

| Export Name | Type / Signature | Role |
| :--- | :--- | :--- |
| `PERMANENT_CASES_KEY` | `String` (`"SURG_SCRIBE_PERMANENT_CASES_VAULT"`) | LocalStorage & IndexedDB key for archived shift cases. |
| `PERMANENT_ACTIVE_DRAFT_KEY` | `String` (`"SURG_SCRIBE_ACTIVE_DRAFT_STATE"`) | Key for active auto-saved patient draft. |
| `PERMANENT_ACTIVE_TAB_KEY` | `String` (`"SURG_SCRIBE_ACTIVE_UI_TAB"`) | Key for persisting the last active UI tab. |
| `PERMANENT_DELETED_IDS_KEY` | `String` (`"SURG_SCRIBE_DELETED_CASE_IDS"`) | Tombstone list preventing legacy migration from resurrecting deleted cases. |
| `ImmortalStorageVault` | `Class` | Persistence engine with methods: `_initIndexedDB()`, `_idbSet(key, val)`, `_idbGet(key)`, `_migrateLegacyKeys()`, `saveActiveDraft(stateObj, activeTabId = null)`, `loadActiveDraft(defaultEmptyStateFactory)`, `getActiveDraftSync()`, `hasActiveDraftSync()`, `_deepMergeWithDefaults(targetDefault, sourceSaved)`, `upsertCaseInArchive(caseObj)`, `upsertCaseToArchive(caseObj)`, `getAllPermanentCases()`, `getPermanentCaseById(caseId)`, `getAllArchivedCasesSync()`, `deleteCaseFromArchive(caseId)`, `permanentlyDeleteCase(caseId, createEmptyStateFn)`. |
| `storageVault` | `Instance<ImmortalStorageVault>` | Default singleton instance initialized on module load. |

---

### 2.5 `js/fuzzy-search.js` (4 exports)

All 4 exports are functions:
1. `normalizeTextForSearch(str)` — Lowercases text, unifies `ي/ئ→ی`, `ك→ک`, `آ/أ/إ→ا`, `ة→ه`, removes ZWNJ/diacritics and non-alphanumeric punctuation.
2. `buildPhoneticSkeleton(str)` — Collapses Persian homophones (`ص/ث→س`, `ذ/ض/ظ→ز`, `ط→ت`, `ح→ه`, `غ→ق`), strips medial `و`/`ا`, and deduplicates repeated letters.
3. `editDistance(a, b)` — Computes Damerau-Levenshtein distance (capped at `99` when length delta `> 2`).
4. `smartClinicalSearch(query, dataset, limit = 25)` — Multi-token ranked search scoring exact prefix (`100`), substring (`85`), phonetic skeleton (`75`), word edit distance (`60 - dist * 15`), and skeleton edit distance (`50`).

---

### 2.6 Other Supporting Modules (`js/i18n.js`, `js/icons.js`, `js/telemetry.js`, `js/google-sync.js`, `js/cloud-sync.js`)

#### `js/i18n.js` (20 exports)
- **Re-exports (6 from `schema.js`):** `tLabel`, `tBrands`, `DIRECT_FA_TO_EN_MAP`, `getCurrentLang`, `setCurrentLang`, `getItemDisplayTitle`.
- **Constants & Dictionaries (5):** `STORAGE_LANG_KEY` (`"surg_app_lang_v05"`), `STORAGE_FONT_KEY` (`"surg_app_font_v05"`), `STORAGE_THEME_KEY` (`"surg_theme_mode"`), `I18N_DICTIONARY` (`Object(2 keys: fa, en)`), `AVAILABLE_FONTS` (`Array(5)`).
- **Functions (9):** `getCurrentLanguage()`, `t(faOrKey, enStr = '')`, `getLocalizedItemLabel(item, lang = getCurrentLanguage())`, `setLanguage(lang)`, `applyI18nToDOM(lang = getCurrentLanguage())`, `getCurrentFont()`, `setFont(fontId)`, `getCurrentTheme()`, `setTheme(theme)`.

#### `js/icons.js` (3 exports)
- `ICONS` (`Object(55 keys)`): SVG string dictionary.
- `getIconSvg(name, { size = 16, className = '', strokeWidth = 1.75 } = {})`
- `injectDomIcons(root = document)`

#### `js/telemetry.js` (2 exports)
- `ClinicalCaseAnalytics` (`Class`): static `analyzeState(clinicalState)`, static `buildMetadataSnapshot(clinicalState, collectorName = '')`.
- `ClinicalTelemetryEngine` (`Class`): `switchSection(newSectionId)`, `recordInteraction()`, `pauseActiveTimer()`, `logMissingItem(sec, item)`, `exportTelemetrySnapshot(clinicalState)`.

#### `js/google-sync.js` (3 exports)
- `deepStripPIIForCloud(rawPayload, rawClinicalState = null)`
- `GoogleSheetsSyncEngine` (`Class`): `loadConfig()`, `saveConfig(newConfig = {})`, `loadQueue()`, `saveQueue()`, `enqueueOffline(cleanPayload)`, `computePayloadFingerprint(cleanPayload)`, `sendPayload(rawPayload, rawClinicalState = null)`, `flushOfflineQueue()`, `fetchCloudDatabase(options = {})`, `fetchSheet2DData(sheetName = 'Admission_HP', passkey = 'SURG2026')`.
- `gsheetSync` (`Instance<GoogleSheetsSyncEngine>`)

#### `js/cloud-sync.js` (1 export — legacy/unimported)
- `CloudSyncManager` (`Class`): `saveConfig(...)`, `getCollectorName()`, `getPendingCount()`, `submitCaseToCloud(fullCaseRecord)`, `_sendOverNetwork(payload)`, `_enqueueOffline(payload)`, `flushOfflineQueue()`, `addCaseToStaging(record)`, `saveStagedRecords()`, `getStagedRecords()`, `updateRecordStatus(caseId, newStatus)`, `deleteStagedRecord(caseId)`, `exportMasterDataset(onlyApproved = false)`.

---

### 2.7 `js/app.js` (63 exports)

- **State Factories & Singletons (11):** `createDefaultPainEpisode(id = 1, title = '')`, `createDefaultPresentation(archetype = 'pain_archetype', id = 1)`, `createDefaultAtlsState()`, `createDefaultClinicalState()`, `clinicalState` (`let`, `Object(20 keys)`), `currentAppMode` (`let`, `'admission' | 'atls' | 'soap'`), `createDefaultSoapState()`, `soapState` (`let`, `Object(10 keys)`), `getLinkedOrCurrentCase()`, `getAllAvailableCases()`, `persistCurrentStateNow()`.
- **Header, HPI, PSH, DH, FH & PE Renderers (15):** `updateHeaderActivePatientBadge()`, `renderArchetypeSelectorGrid()`, `renderArchetypeSelectorBar` (alias), `renderHpiPresentations()`, `addPshSurgeryItem(procObj)`, `renderPshCapsulesAndSelected(filterQuery = '')`, `addActiveDrug(drugObj, maybeLabel, maybeCategory)`, `renderActiveDrugs()`, `renderDhCategoryPills()`, `renderFhQuickPills()`, `addFhDisease(item)`, `renderFhActiveDiseases()`, `renderPeComprehensiveSystems()`, `filterSchemaItems(query, itemsArray)`, `renderFhSearchTray(query, tray, input)`.
- **Omnisearch, Paraclinics, ROS/PE Gaps & Live Preview (7):** `initTagQuickSearch` (alias of `initSchemaOmnisearch`), `renderParaclinicLabs()`, `addAdditionalLab(testObj, initialVal = '')`, `renderAdditionalLabs()`, `renderRosGapChips()`, `renderPeGapChips()`, `updateLivePreview()`.
- **Shift Cases, Cloud Payload & Counters (6):** `extractCaseChiefComplaint(c, isEn = false)`, `extractCaseAgeGender(c, isEn = false)`, `getDeduplicatedShiftCases()`, `isSoapDayMeaningfulClient(dayEntry)`, `buildCloudSyncPayload(state)`, `updateSectionCounters()`.
- **Mode Switching, ATLS & Multi-Day SOAP (11):** `switchAppMode(mode)`, `renderAtlsInjuriesList()`, `syncAtlsDomFromState()`, `renderSoapDayTracker()`, `initFreshDayOneSoapNote()`, `deleteSoapDay(dayId)`, `updateSoapActivePatientStatusPill(selectedCase)`, `addSoapLabCard(labId, labTitle = null, value = '')`, `scheduleDebouncedSoapAutoSave()`, `syncActiveSoapDayToHistory()`, `saveSoapProgressNote(silent = false)`.
- **Secret Admin Vault (`#admin-vault` / `?admin=1`) & Bootstrap (13):** `checkSecretAdminRoute()`, `renderAdminCollectorStatsBar(collectorStats = {}, totalCases = 0, sheetUrl = '')`, `loadAdminVaultCases()`, `renderAdminVaultTable()`, `inspectAdminCase(c)`, `updateAdminInspectorView()`, `rehydrateCloudCaseForEditor(cloudCase)`, `importCloudCaseToEditor(caseItem)`, `downloadSingleCaseJson(c)`, `exportAdminDatabaseCsv()`, `exportAdminDatabaseJson()`, `initSecretAdminVault()`, `initApp()`.

---

## 3. Exact Application `state` Object Structure

### 3.1 Top-Level `clinicalState` Keys (`createDefaultClinicalState()`, `js/app.js` L280–433)

`clinicalState` contains **20 top-level keys**:
1. `caseId` (`string` — format `SURG-YYYYMMDD-XXXX`)
2. `createdAt` (`string` — ISO-8601 timestamp)
3. `updatedAt` (`string` — ISO-8601 timestamp)
4. `demographics` (`object`)
5. `admission` (`object`)
6. `cc` (`object`)
7. `hpi` (`object`)
8. `obgyn` (`object`)
9. `pmh` (`object`)
10. `psh` (`object`)
11. `dh` (`object`)
12. `ah` (`object`)
13. `sh` (`object`)
14. `fh` (`object`)
15. `ros` (`object`)
16. `pe` (`object`)
17. `paraclinics` (`object`)
18. `reasoning` (`object`)
19. `atls` (`object`)
20. `soapHistory` (`array` of SOAP day records)

---

### 3.2 Complete Nested `clinicalState` Schema

```jsonc
{
  "caseId": "SURG-YYYYMMDD-XXXX",
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string",

  "demographics": {
    "fullName": "",
    "fatherName": "",
    "birthDate": "",
    "gender": "",            // "" | "male" | "female"
    "age": "",
    "marital": "",
    "city": "",
    "occupation": "",
    "informant": "خود بیمار",
    "ward": "",
    "bed": ""
  },

  "admission": {
    "pathway": "emergency_acute",
    "emergencyPattern": "subacute_chronic", // "subacute_chronic" | "acute"
    "unresponsiveTrauma": false,
    "traumaMoi": "",
    "isProcedureOnly": false,
    "clinicAttending": "",
    "clinicDiagnosis": "",
    "clinicPlannedProcedure": "",
    "originWard": "",
    "originPrimaryReason": "",
    "transferReason": ""
  },

  "cc": {
    "pathway": "emergency_acute",           // "emergency_acute" | "elective_clinic" | "inpatient_transfer"
    "emergencyPattern": "subacute_chronic", // "subacute_chronic" | "acute"
    "patientQuote": "",
    "establishedDiagnosis": "",
    "referringAttending": "",
    "plannedProcedure": "",
    "originWardHospital": "",
    "primaryAdmissionReason": "",
    "transferConsultReason": ""
  },

  "hpi": {
    "duration": "",
    "presentations": [],     // Array of archetype objects (empty by default)
    "painList": [],          // Legacy/auxiliary pain episode array
    "unlockedModules": [],   // Array of unlocked HPI module IDs
    "symptoms": {},          // symptomId -> { state: 1 | -1, detail: "" } | number
    "preAdmissionWorkup": "",
    "narrativeNote": "",
    "systemGapNote": ""
  },

  "obgyn": {
    "g": "",
    "p": "",
    "ab": "",
    "l": "",
    "deliveryType": "",
    "lmp": "",
    "dysmenorrhea": "",
    "pregnancies": [],       // Array of { id, outcome, deliveryMethod, year, complications }
    "note": "",
    "systemGapNote": ""
  },

  "pmh": {
    "masterRoutineNegative": false,
    "categories": {},        // catId -> { status: "neutral"|"negated"|"has_positive", items: {}, otherNote: "" }
    "items": {},             // itemId -> { state: 1 | -1, detail: "" }
    "systemGapNote": ""
  },

  "psh": {
    "surgeries": [],         // Array of { id, label, en, note }
    "note": "",
    "systemGapNote": ""
  },

  "dh": {
    "noRoutineMeds": false,
    "activeDrugs": [],       // Array of { id, name, en, dose, sig, note }
    "categories": {},        // catId -> { status, items, otherNote }
    "customDrugs": [],
    "note": "",
    "systemGapNote": ""
  },

  "ah": {
    "nkda": false,
    "selected": [],          // Array of { id, label, detail }
    "note": "",
    "systemGapNote": ""
  },

  "sh": {
    "negSmoking": false,
    "negOpium": false,
    "negAlcohol": false,
    "cigsPerDay": "",
    "yearsSmoked": "",
    "opium": "",
    "note": "",
    "systemGapNote": ""
  },

  "fh": {
    "negFamilyHistory": false,
    "masterNeg": false,
    "diseases": [],          // Array of { id, name, en, relatives: [], status: "living"|"deceased", ageNote: "" }
    "selected": [],
    "note": "",
    "systemGapNote": ""
  },

  "ros": {
    "items": {},             // itemId -> { state: 1 | -1, detail: "" }
    "showAllGenders": false,
    "systemGapNote": "",
    "unobtainable": false,
    "unobtainableReason": ""
  },

  "pe": {
    "vitals": {
      "bp": "",
      "pr": "",
      "rr": "",
      "temp": "",
      "spo2": "",
      "npo": ""
    },
    "findings": {},          // itemId -> { state: 1 | -1, detail: "" }
    "unlockedModules": [],   // Array of module IDs (e.g., "exam_dre")
    "massExams": [],         // Array of local mass/lesion exam objects
    "massExamList": [],      // Backward-compatibility alias
    "atlsExam": {
      "active": false,
      "enabled": false,
      "primarySurvey": {},
      "wounds": [],
      "burn": {
        "degree": "",
        "tbsa": "",
        "regions": "",
        "inhalationSigns": []
      }
    },
    "comprehensiveSystems": {}, // sysId -> { examined: false, isNormal: false, text: "", selectedTags: [] }
    "note": "",
    "systemGapNote": ""
  },

  "paraclinics": {
    "labs": {},              // labId -> string value
    "additionalLabs": {},    // labId -> { value: "", unit: "", name: "", normalRange: "" }
    "labNote": "",
    "imagingReports": [],    // Array of { id, modalityId, modalityLabel, date, tags: [{ id, label, detail }], summary: "" }
    "systemGapNote": ""
  },

  "reasoning": {
    "problemRepresentation": "",
    "ddx": ""
  },

  "atls": { /* See Section 3.4 */ },

  "soapHistory": [ /* Array of SOAP day state objects — See Section 3.5 */ ]
}
```

---

### 3.3 `hpi.presentations[]` Archetype Sub-Schemas

Items added to `clinicalState.hpi.presentations` are created via `createDefaultPresentation(archetype, id)`:

1. **`pain_archetype`** (from `createDefaultPainEpisode(id, title)`):
   `{ id, uid, title, archetype: 'pain_archetype', bodyRegion: '', bodyRegionGroup: '', spatialPattern: '', selectedRegions: [], initialRegions: [], currentRegions: [], localizationDelay: '', onset: '', duration: '', character: '', course: '', timing: '', severity: null, radiationList: [], noRadiation: false, aggravating: [], relieving: [] }`
2. **`mass_lesion_archetype`**:
   `{ id, uid, archetype: 'mass_lesion_archetype', title, location: '', discoveryTime: '', growthPattern: 'ثابت و بدون تغییر سایز (Stable)', painStatus: 'کاملاً بدون درد (Painless)', findings: {}, posFindings: [], negFindings: [] }`
3. **`trauma_burn_archetype`**:
   `{ id, uid, archetype: 'trauma_burn_archetype', title, mechanism: 'ترومای بلانت - تصادف خودرو/موتورسیکلت/عابر (MVA / MCA / Pedestrian)', timeSinceInjury: '', transportMode: 'آمبولانس اورژانس (EMS 115)', injuredZones: [], checklist: {}, posFindings: [], negFindings: [] }`
4. **`functional_bleeding_archetype`**:
   `{ id, uid, archetype: 'functional_bleeding_archetype', title, symptomTitle: 'تنگی نفس حاد یا پیشرونده (Dyspnea)', duration: '', onset: 'تدریجی (Gradual)', severityOrFrequency: '', aggravating: [], relieving: [], visualTraits: '' }`
5. **`elective_asymptomatic_archetype`**:
   `{ id, uid, archetype: 'elective_asymptomatic_archetype', title, isProcedureOnly: false, procedureName: '', insertionReasonAndTime: '', lastChemoOrInterventionDate: '', siteExamStatus: '', discoveryMethod: 'چکاپ روتین و غربالگری سلامت (Routine Check-up / Screening)', workupSummary: '', currentStatus: 'کاملاً بدون علامت حاد بالینی' }`

---

### 3.4 `atls` Sub-Schema (`createDefaultAtlsState()`, `js/app.js` L221–278)

```jsonc
{
  "mist": {
    "arrivalMode": "",
    "mechanisms": [],
    "incidentTime": "",
    "mechanismDetail": "",
    "prehospitalActions": []
  },
  "primary": {
    "vitals": {
      "bp": "", "pr": "", "rr": "", "temp": "", "spo2": "",
      "gcsE": null, "gcsV": null, "gcsM": null, "gcsTotal": null
    },
    "airway": [],
    "breathing": [],
    "circulation": [],
    "disability": [],
    "disabilityPupils": "",
    "exposure": []
  },
  "ample": {
    "allergies": "",
    "medications": "",
    "pastHistory": "",
    "lastMeal": "",
    "eventsTetanus": ""
  },
  "secondary": {
    "injuries": [],
    "burnActive": false,
    "burnDegree": "",
    "burnTbsa": "",
    "burnInhalation": "",
    "headToToeCapsules": {},
    "headFace": "",
    "neck": "",
    "chest": "",
    "abdomenPelvis": "",
    "perineumDre": "",
    "extremitiesNeuro": "",
    "efastStatus": "",
    "efastWindows": [],
    "efastDetail": "",
    "imagingNote": "",
    "statLabsNote": "",
    "actionsAndPlan": [],
    "planCustomNote": ""
  }
}
```

---

### 3.5 `soapState` & `soapHistory[]` Entry Schema (`createDefaultSoapState()`, `js/app.js` L467–537)

```jsonc
{
  "recordType": "SOAP_PROGRESS",
  "dayId": "soap_day_<timestamp>",
  "mode": "linked",          // "linked" | "standalone"
  "linkedCaseId": null,
  "dateStr": "<fa-IR date string>",
  "context": {
    "fullName": "",
    "age": "",
    "gender": "",
    "workingDiagnosis": "",
    "procedureDone": "",
    "hdNumber": "1",
    "podType": "POD",
    "podNumber": "1"
  },
  "subjective": {
    "overallTrend": "",
    "painStatus": "",
    "painDetail": "",
    "dietTolerance": "",
    "flatus": null,          // null | 1 | -1
    "bowelMovement": null,   // null | 1 | -1
    "bowelDetail": "",
    "ambulation": "",
    "overnightSymptoms": {},
    "symptoms": {},
    "symptomDetails": {},
    "customSymptoms": [],
    "narrativeNote": ""
  },
  "objective": {
    "vitals": {
      "bp": "", "pr": "", "rr": "", "temp": "", "tmax": "", "spo2": "", "hemodynamics": ""
    },
    "io": {
      "intake24h": "", "urineOutput24h": "", "ngtOutput24h": "", "urineStatus": ""
    },
    "intake24h": "",
    "urineOutput24h": "",
    "ngtOutput24h": "",
    "drains": [],
    "generalAndCardioPulm": "",
    "abdomenExam": "",
    "woundAndDressing": "",
    "extremitiesDvt": "",
    "examNote": "",
    "labs": {},
    "previousBaselineLabs": {},
    "newParaclinicNote": ""
  },
  "assessment": {
    "summaryText": "",
    "clinicalStatus": ""
  },
  "plan": {
    "selectedTags": [],
    "customPlanText": ""
  }
}
```

### 3.6 Runtime, Legacy & Window-Scoped State Properties
- **Global `window` UI registries (`js/app.js` L99–108, L459):** `window.currentAppState` (alias of `clinicalState`), `window._rosExpandedMap`, `window._peExpandedMap`, `window._labExpandedMap`, `window._rosShowAllMap`, `window._peShowAllMap`, `window._labShowAllMap`, `window._activeLabTests` (all `Set` instances), and `window._rosBreastEnabledForMale` (`boolean`).
- **Dynamic / Backward-Compatibility Keys:** `cc.ccPhrase`, `psh.noSurgeries`, `psh.historyOfAnesthesia`, `dh.highAlert`, `ros.systems`, `reasoning.differentials`, and `progressNotes` are read/set dynamically in UI handlers, `generator.js`, or `telemetry.js` for legacy draft compatibility.

---

## 4. Import/Export, Undeclared Identifier & Console/Runtime Audit Report

### 4.1 Audit Summary

| Check Category | Status | Scope Verified | Result |
| :--- | :---: | :--- | :--- |
| **ES Module Import/Export Resolution** | **PASS** | All 15 ES modules + `test_v07.mjs` | **0 broken imports**, **0 missing module targets**, **0 circular dependencies**. Every imported identifier resolves to an exported binding. |
| **Dynamic Node ESM Import Check** | **PASS** | All 15 ES modules loaded via `node --input-type=module` (Node `v25.9.0`) | **15 / 15 modules** parsed and evaluated with **0 `SyntaxError` or `ReferenceError`**. |
| **Undeclared Identifier Static Scan** | **PASS** | All 18 `.js` / `.mjs` files | **0 undeclared identifier suspects** across all scanned modules. |
| **Runtime Logic & Generator Smoke Tests** | **PASS** | `node test_v07.mjs` + 16 targeted function calls (`generateClinicalNote` fa/en, `generateSOAPProgressNote`, `generateEnglishSOAPNote`, `generateATLSNote`, `generateEnglishATLSNote`, `synthesizeProblemRepresentation`, `sanitizeRecordForExport`, `ClinicalCaseAnalytics.analyzeState`, `deepStripPIIForCloud`, `smartClinicalSearch`) | **0 failures** (`test_v07.mjs` exited `0`; 16/16 smoke tests passed). |
| **DOM `getElementById` & Inline Event Safety** | **PASS** | 426 static IDs in `index.html` vs. `js/app.js` | **0 inline `on*` attributes** in `index.html` or `js/app.js` templates. 39 legacy/optional IDs queried by `js/app.js` (e.g., `pshSystemGapInput`, `soapExamWound`, legacy `adminCasesTable`) are guarded with `if (document.getElementById(...))`, optional chaining `?.`, or `||` fallbacks—**0 unguarded null-dereferences**. |

---

### 4.2 Non-Breaking Warnings & Maintenance Advisories (Informational Only)

1. **Unused Imports (20 total across 3 files):**
   - `js/app.js` (14): `injectDomIcons`, `ICONS` (L1); `PERMANENT_CASES_KEY`, `PERMANENT_ACTIVE_DRAFT_KEY`, `PERMANENT_ACTIVE_TAB_KEY` (L2); `PE_SYSTEMS_CONFIG`, `LAB_PANELS`, `MASTER_PMH_CATEGORIES`, `MASTER_DRUG_CATEGORIES`, `ALL_MASTER_SYMPTOMS`, `HPI_BASIC_SYMPTOMS`, `CLINICAL_PRESENTATION_ARCHETYPES`, `PE_NORMAL_BASELINES` (L11–64); `getLocalizedItemLabel` (L75).
   - `js/generator.js` (5): `getLocalizedItemLabel` (L1); `PE_COMPREHENSIVE_SYSTEMS`, `MASS_EXAM_SCHEMA`, `ATLS_EXAM_SCHEMA`, `DIRECT_FA_TO_EN_MAP` (L2).
   - `test_v07.mjs` (1): `ALL_MASTER_SYMPTOMS` (L1).
2. **Unimported Legacy Module (`js/cloud-sync.js`):**
   - `CloudSyncManager` in `js/cloud-sync.js` is listed in `sw.js` `STATIC_ASSETS` but is not imported by `js/app.js` or any other module (superseded by `js/google-sync.js`).
3. **Service Worker Pre-Cache Gap (`sw.js`):**
   - `STATIC_ASSETS` in `sw.js` pre-caches root `./js/*.js` files on `install`, but omits the 5 data bank modules in `./js/data/*.js`. They are cached dynamically on first `fetch`, so an offline launch before first-load script evaluation could miss uncached data banks.
4. **Duplicate `GoogleSheetsSyncEngine` Instantiation:**
   - `js/google-sync.js` exports `export const gsheetSync = new GoogleSheetsSyncEngine();` (L417), while `js/app.js` creates its own `let gsheetSync = new GoogleSheetsSyncEngine();` (L95) instead of importing the singleton.
5. **Node CLI `MODULE_TYPELESS_PACKAGE_JSON` Warning:**
   - Running `npm test` (`node test_v07.mjs`) prints a Node runtime warning because `package.json` omits `"type": "module"` (intentional so `server.js` runs as CommonJS). Browser `<script type="module">` execution is completely unaffected.
