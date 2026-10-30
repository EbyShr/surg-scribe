/**
 * i18n & Localization Engine - Surg-Scribe v1.2-Bilingual-CleanUI
 * Complete bilingual support: Persian (RTL) & Medical English (LTR)
 * Manages Language, Directionality, Themes, and 5 Typography Styles.
 */

import {
  tLabel,
  tBrands,
  DIRECT_FA_TO_EN_MAP,
  getCurrentLang,
  setCurrentLang,
  getItemDisplayTitle
} from './schema.js';

export { tLabel, tBrands, DIRECT_FA_TO_EN_MAP, getCurrentLang, setCurrentLang, getItemDisplayTitle };

export const STORAGE_LANG_KEY = 'surg_app_lang_v05';
export const STORAGE_FONT_KEY = 'surg_app_font_v05';
export const STORAGE_THEME_KEY = 'surg_theme_mode';

export const I18N_DICTIONARY = {
  fa: {
    app_title: 'سامانه جامع شرح‌حال و پیگیری جراحی | v2.0-Pro',
    brand_title: 'SurgHistory',
    version_pill: 'v2.0-Pro',
    case_id_tooltip: 'شناسه یکتا پرونده شیفت',
    btn_new_case: 'پرونده جدید',
    collector_label: 'ثبت‌کننده:',
    collector_ph: 'نام شما (ID)',
    btn_cloud_sync: 'ثبت در Google Sheets',
    btn_cloud_sync_title: 'ارسال پرونده فعلی به Google Sheets (حذف خودکار اطلاعات هویتی حساس)',
    offline_queue: 'صف آفلاین:',
    btn_settings_title: 'تنظیمات سامانه (زبان، فونت، تم و کلاد)',
    btn_shift_title: 'مدیریت پرونده‌های شیفت و دانلود تجمیعی',
    shift_label: 'شیفت:',
    btn_theme_title: 'تغییر تم تاریک / روشن',

    // Modes
    mode_admission: 'H&P',
    mode_atls: 'ATLS',
    mode_soap: 'SOAP',

    // Tabs
    tab_cc: '۱. پذیرش و CC',
    tab_hpi: '۲. شرح بیماری (HPI)',
    tab_pmh: '۳. سوابق (PMH/PSH)',
    tab_dh: '۴. دارو و عادات (DH)',
    tab_ros: '۵. بررسی سیستم‌ها (ROS)',
    tab_pe: '۶. معاینه فیزیکی (PE)',
    tab_paraclinics: '۷. پاراکلینیک جامع',
    tab_reasoning: '۸. استدلال بالینی (DDx)',

    // Tab 1 Demographics
    demo_title: 'مشخصات هویتی بیمار (ویژه پرونده بیمارستان)',
    privacy_shield: 'سپر حریم خصوصی فعال',
    privacy_shield_tip: 'نام و تاریخ تولد هنگام ارسال به کلاد یا اکسل جهت حفظ حریم خصوصی به طور خودکار پاک می‌شوند',
    fullname_label: 'نام و نام خانوادگی بیمار',
    fullname_ph: 'مثلاً علی رضایی',
    father_name_label: 'نام پدر',
    father_name_ph: 'مثلاً حسین',
    birthdate_label: 'تاریخ تولد',
    age_label: 'سن (سال)',
    age_ph: 'مثلاً ۴۵',
    demo_ward_label: 'بخش بستری',
    demo_ward_ph: 'مثلاً جراحی ۲',
    demo_bed_label: 'شماره تخت',
    demo_bed_ph: 'مثلاً ۱۲',
    gender_label: 'جنسیت',
    gender_empty: '-- انتخاب جنسیت --',
    gender_female: 'خانم (Female)',
    gender_male: 'آقا (Male)',
    gender_other: 'سایر / عدم تمایل به ذکر',
    marital_label: 'وضعیت تأهل',
    marital_empty: '-- انتخاب وضعیت تأهل --',
    marital_married: 'متأهل',
    marital_single: 'مجرد',
    marital_widowed: 'همسر فوت‌شده',
    marital_ph: 'متأهل / مجرد',
    city_label: 'محل سکونت و قومیت',
    city_ph: 'مثلاً تهران / کرد',
    job_label: 'شغل و حرفه',
    job_ph: 'مثلاً کارمند / آزاد',
    cc_pathway_label: 'مسیر پذیرش بیمار',
    pathway_emergency: 'اورژانس جراحی (Emergency / Acute Abdomen)',
    pathway_clinic: 'ارجاع از درمانگاه الکتیو (Clinic Referral / Planned Surgery)',
    pathway_postop: 'عوارض و پیگیری پس از عمل (Post-Op & Drain Complications)',
    attending_label: 'استاد محترم معالج (Attending Physician)',
    attending_ph: 'مثلاً دکتر احمدی',
    prelim_dx_label: 'تشخیص احتمالی اولیه (Preliminary Diagnosis)',
    prelim_dx_ph: 'مثلاً آپاندیسیت حاد یا کله‌سیستیت',
    planned_proc_label: 'اقدام درمانی یا عمل برنامه‌ریزی‌شده (Planned Procedure)',
    planned_proc_ph: 'مثلاً لاپاراسکوپی تشخیصی یا آپاندکتومی',
    cc_box_title: 'شکایت اصلی (Chief Complaint - CC)',
    cc_quote_label: 'شکایت اصلی بیمار (عین عبارت بیمار یا شکایت محوری به فارسی):',
    cc_quote_ph: 'مثلاً دل‌پیچه شدید دور ناف از دیشب که به پایین راست تیر می‌کشد...',

    // SOAP
    soap_btn_add_day: 'روز جدید',
    soap_btn_del_day: 'حذف این روز',
    soap_confirm_delete_day: 'آیا از حذف یادداشت پیگیری این روز اطمینان دارید؟ این عمل قابل بازگشت نیست.',
    shift_confirm_delete_case: 'آیا از حذف دائمی و قطعی این پرونده از حافظه اطمینان دارید؟ این عمل غیرقابل بازگشت است.',

    // Tab 2 HPI & Presentations
    archetypes_title: 'کهن‌الگوهای مواجهه بالینی (5 Clinical Presentation Archetypes)',
    archetype_pain: 'درد / ناراحتی (Pain)',
    archetype_mass: 'توده / کیست / ضایعه (Mass/Lesion)',
    archetype_trauma: 'تروما / سوختگی (ATLS Trauma)',
    archetype_functional: 'عملکردی / خونریزی (Functional/Bleed)',
    archetype_elective: 'بستری الکتیو / بی‌علامت',
    btn_add_presentation: 'افزودن کهن‌الگوی مواجهه بالینی دیگر',
    quick_search_ph: 'جستجوی سریع تگ‌ها (مثلاً: تهوع، دیابت، پلاویکس، مورفی، ارتوپنه...)',
    pain_episodes_title: 'کانون‌های درد و شکایات محوری (Pain Episodes & Trajectory)',
    btn_add_pain: 'افزودن کانون درد / شکایت همزمان دیگر',
    hpi_associated_title: 'علائم همراه HPI (معماری ماژولار Unlockable)',
    hpi_badge_tip: 'تپ: خنثی / + مثبت / − منفی',
    hpi_basic_label: 'علائم پایه و همراه عمومی (Basic GI & Constitutional):',

    // Tab 3 PMH & PSH
    pmh_gatekeepers_title: 'سوابق پزشکی گذشته (PMH - ساختار درختی ۷ گانه)',
    pmh_routine_btn: 'نفی کلیه سوابق بیماری‌های زمینه‌ای روتین (دیابت، پرفشاری خون، IHD، چربی خون)',
    psh_card_title: 'سوابق جراحی و بستری قبلی (Past Surgical History - PSH)',
    btn_add_surgery: 'افزودن عمل جراحی قبلی',
    obgyn_card_title: 'سوابق بارداری و زایمان (Ob/Gyn - ویژه بانوان)',
    obgyn_gravida: 'تعداد بارداری (Gravida):',
    obgyn_para: 'تعداد زایمان (Para):',
    obgyn_abortion: 'تعداد سقط (Abortion):',
    obgyn_living: 'فرزند زنده (Living):',
    btn_add_pregnancy: 'ثبت زایمان / سقط جدید',

    // Tab 4 DH, SH, AH, FH
    dh_card_title: 'سوابق دارویی دسته‌بندی‌شده (Drug History - DH)',
    btn_add_custom_drug: 'افزودن داروی دلخواه',
    ah_card_title: 'سوابق حساسیت‌ها (Allergy History - AH)',
    ah_nkda: 'عدم سابقه حساسیت دارویی یا غذایی شناخته‌شده (NKDA)',
    ah_drug_label: 'حساسیت‌های دارویی مشخص (Drug Allergies):',
    ah_food_label: 'حساسیت‌های غذایی / سایر (Food/Environmental):',
    sh_card_title: 'عادات و مواجهات فردی (Social History - SH)',
    fh_card_title: 'سوابق خانوادگی بیماری‌ها و نئوپلاسم‌ها (Family History - FH)',
    fh_noncontributory: 'سابقه خانوادگی بیماری جراحی، سرطان یا فوت زودهنگام فامیلی منفی است (Non-contributory)',

    // Tab 5 ROS
    ros_card_title: 'بررسی سیستم‌ها (Review of Systems - ۱۱ سیستم استاندارد بالینی)',
    ros_tip: 'سیستم‌های غیراختصاصی به طور پیش‌فرض جمع هستند. روی هر سیستم تپ کنید تا علائم باز شوند.',

    // Tab 6 PE
    vitals_card_title: 'علائم حیاتی و وضعیت تغذیه (Vital Signs & Nutrition)',
    vitals_bp: 'فشار خون (BP mmHg)',
    vitals_pr: 'ضربان قلب (PR bpm)',
    vitals_rr: 'تعداد تنفس (RR /min)',
    vitals_temp: 'درجه حرارت (Temp °C)',
    vitals_spo2: 'اشباع اکسیژن (SpO2 %)',
    vitals_npo: 'وضعیت تغذیه (NPO Status)',
    general_exam_title: 'وضعیت عمومی بیمار (General Appearance & Exam)',
    abdominal_pillars_title: 'ارکان چهارگانه معاینه شکم (4 Mandatory Abdominal Pillars)',
    rectal_exam_title: 'معاینه رکتوم و پرینه (DRE & Perineal Exam)',
    btn_set_normal_exam: 'ثبت معاینه کاملاً طبیعی این بخش',
    mass_exam_btn: 'افزودن کارت معاینه موضعی توده / ضایعه (سر، فک، گردن، پستان، تنه، اندام)',
    atls_module_btn: 'باز کردن ماژول تروما، جراحات نافذ و سوختگی (ATLS Exam)',

    // Tab 7 Paraclinics
    paraclinics_title: 'پاراکلینیک جامع و مطالعات تشخیصی',
    paraclinics_tip: 'تپ روی هر مدالیته تصویربرداری کارت مجزای آن را برای ثبت گزارش باز می‌کند.',
    imaging_launcher_title: 'مدالیته‌های تصویربرداری و گزارش‌ها:',
    efast_modality_btn: 'سونوگرافی eFAST (تروما)',

    // Tab 8 DDx
    ddx_card_title: 'استدلال بالینی، تشخیص‌های افتراقی و پلن (DDx & Plan)',

    // Live Preview & Column Left
    live_preview_title: 'پیش‌نمایش شرح‌حال ساختاریافته بالینی',
    badge_pos_suffix: 'مثبت',
    badge_neg_suffix: 'منفی',
    btn_copy_markdown: 'کپی متن شرح‌حال',
    btn_print: 'پرینت برگه',
    btn_export_json: 'دانلود JSON پژوهشی',

    // Shift Manager Modal
    shift_modal_title: 'مدیریت پرونده‌های شیفت (Offline Shift Vault)',
    shift_modal_desc: 'پرونده‌های ثبت‌شده در این شیفت به صورت ۱۰۰٪ آفلاین در حافظه مرورگر نگهداری می‌شوند.',
    shift_save_current: 'ذخیره پرونده فعلی در صندوق شیفت',
    shift_import: 'ورود فایل JSON',
    shift_export: 'دانلود یکجای تمام پرونده‌ها (Shift JSON)',
    shift_clear: 'پاکسازی تاریخچه شیفت',
    shift_empty_msg: 'پرونده بایگانی‌شده‌ای در شیفت فعلی وجود ندارد.',
    btn_load_case: 'بارگذاری',
    btn_delete_case: 'حذف',

    // Settings Modal
    settings_modal_title: 'تنظیمات سامانه | System Settings',
    settings_lang_label: 'زبان سامانه و جهت نمایش (Language & Direction)',
    settings_theme_label: 'پوسته بصری نرم‌افزار (Theme & Appearance)',
    theme_dark_title: 'تیره جراحی (Dark Slate)',
    theme_dark_desc: 'کاهش خستگی چشم در شیفت شب',
    theme_light_title: 'روشن پزشکی (Clean Medical)',
    theme_light_desc: 'کنتراست استاندارد بیمارستانی',
    settings_font_label: 'فونت سامانه (Typography - 5 Styles)',
    settings_cloud_label: 'همگام‌سازی ابری Google Sheets (Apps Script Web App)',
    settings_collector_label: 'نام ثبت‌کننده (Collector Name / ID)',
    settings_url_label: 'آدرس وب‌اپ گوگل اسکریپت (Google Apps Script Web App URL)',
    settings_install_label: 'نصب مستقیم اپلیکیشن (Install App)',
    settings_install_desc: 'نصب برنامه با عملکرد کاملاً مستقل و آفلاین روی گوشی اندروید یا سیستم ویندوز (بدون نیاز به باز کردن مرورگر).',
    btn_cancel: 'انصراف',
    btn_save_settings: 'ذخیره تنظیمات',

    // Common Buttons
    btn_toggle_negatives: '− منفی کردن بقیه',
    btn_toggle_reset: '↺ بازنشانی منفی‌ها',

    // Chart Letterhead & Preview Header
    chart_hospital_title: 'برگه شرح‌حال، معاینه بالینی و سیر بستری بخش جراحی',
    chart_hospital_subtitle: 'Medical Center Clinical Chart — Department of General Surgery',
    btn_copy_short: 'کپی',
    btn_print_short: 'پرینت',
    btn_json_short: 'JSON',
    mobile_preview_btn: 'مشاهده و کپی متن شرح‌حال',

    // SOAP Standard Hospital Titles (Bug 6 — Zero ذهنی/عینی)
    soap_nav_hd: '۱. مشخصات سیر و روز بستری (HD / POD)',
    soap_nav_s: '۲. Subjective (گزارش بیمار و علائم ۲۴ ساعت اخیر)',
    soap_nav_o: '۳. Objective (علائم حیاتی، بیلان، معاینه و پاراکلینیک)',
    soap_nav_a: '۴. Assessment (ارزیابی بالینی امروز)',
    soap_nav_p: '۵. Plan (پلن درمانی و دستورات)',

    // ATLS Navigation Titles
    atls_nav_primary: '۱. ارزیابی اولیه حیاتی (Primary Survey - ABCDE)',
    atls_nav_mist_ample: '۲. مکانیسم تروما و سوابق (MIST & AMPLE)',
    atls_nav_secondary: '۳. ارزیابی ثانویه، زخم‌ها و سوختگی (Secondary Survey)',
    atls_nav_efast_plan: '۴. eFAST، تصویربرداری و پلن اورژانس'
  },

  en: {
    app_title: 'SurgHistory Clinical Workstation | v2.0-Pro',
    brand_title: 'SurgHistory',
    version_pill: 'v2.0-Pro',
    case_id_tooltip: 'Unique Shift Case ID',
    btn_new_case: 'New Patient',
    collector_label: 'Collector:',
    collector_ph: 'Your Name (ID)',
    btn_cloud_sync: 'Sync to Sheets',
    btn_cloud_sync_title: 'Send current case to Google Sheets (PII automatically stripped)',
    offline_queue: 'Offline Queue:',
    btn_settings_title: 'System Settings (Language, Font, Theme & Cloud)',
    btn_shift_title: 'Shift Vault & Batch Dataset Manager',
    shift_label: 'Shift:',
    btn_theme_title: 'Toggle Dark / Light Mode',

    // Modes
    mode_admission: 'H&P',
    mode_atls: 'ATLS',
    mode_soap: 'SOAP',

    // Tabs
    tab_cc: '1. Admission & CC',
    tab_hpi: '2. History of Present Illness (HPI)',
    tab_pmh: '3. Medical & Surgical History (PMH/PSH)',
    tab_dh: '4. Medications & Habits (DH/SH)',
    tab_ros: '5. Review of Systems (ROS)',
    tab_pe: '6. Physical Examination (PE)',
    tab_paraclinics: '7. Diagnostic Studies & Labs',
    tab_reasoning: '8. Clinical Reasoning & DDx',

    // Tab 1 Demographics
    demo_title: 'Patient Demographics & Identification (Local Hospital Note)',
    privacy_shield: 'Privacy Shield Active',
    privacy_shield_tip: 'Patient Name & Birth Date are automatically stripped before exporting or syncing to Cloud',
    fullname_label: 'Patient Full Name',
    fullname_ph: 'e.g. John Doe',
    father_name_label: "Father's Name",
    father_name_ph: 'e.g. Robert',
    birthdate_label: 'Date of Birth',
    age_label: 'Age (Years)',
    age_ph: 'e.g. 45',
    demo_ward_label: 'Hospital Ward',
    demo_ward_ph: 'e.g. Surgery Ward 2',
    demo_bed_label: 'Bed #',
    demo_bed_ph: 'e.g. Bed 12',
    gender_label: 'Biological Sex',
    gender_empty: '-- Select Sex --',
    gender_female: 'Female',
    gender_male: 'Male',
    gender_other: 'Other / Prefer not to say',
    marital_label: 'Marital Status',
    marital_empty: '-- Select Marital Status --',
    marital_married: 'Married',
    marital_single: 'Single',
    marital_widowed: 'Widowed',
    marital_ph: 'Married / Single / Divorced',
    city_label: 'Residence & Ethnicity',
    city_ph: 'e.g. New York / Caucasian',
    job_label: 'Occupation',
    job_ph: 'e.g. Teacher / Engineer',
    cc_pathway_label: 'Admission Pathway',
    pathway_emergency: 'Surgical Emergency (Acute Abdomen / Trauma)',
    pathway_clinic: 'Elective Outpatient Referral (Planned Surgery)',
    pathway_postop: 'Post-Op Complication / Drain Issue',
    attending_label: 'Attending Surgeon (Attending Physician)',
    attending_ph: 'e.g. Dr. Adams, MD',
    prelim_dx_label: 'Working / Preliminary Diagnosis',
    prelim_dx_ph: 'e.g. Acute Appendicitis vs. Cholecystitis',
    planned_proc_label: 'Planned Procedure / Intervention',
    planned_proc_ph: 'e.g. Diagnostic Laparoscopy, Appendectomy',
    cc_box_title: 'Chief Complaint (CC)',
    cc_quote_label: 'Chief Complaint (Patient’s Own Words):',
    cc_quote_ph: 'e.g. Severe periumbilical crampy pain since last night radiating to RLQ...',

    // Tab 2 HPI & Presentations
    archetypes_title: 'Clinical Presentation Archetypes (5 Standard Models)',
    archetype_pain: 'Pain / Discomfort (Pain)',
    archetype_mass: 'Mass / Cyst / Lesion',
    archetype_trauma: 'Trauma & Burns (ATLS)',
    archetype_functional: 'Functional & Bleeding',
    archetype_elective: 'Elective / Asymptomatic Referral',
    btn_add_presentation: 'Add Clinical Presentation Archetype',
    quick_search_ph: 'Quick search tags (e.g. nausea, diabetes, plavix, murphy, orthopnea...)',
    pain_episodes_title: 'Pain Focus Episodes & Trajectory',
    btn_add_pain: 'Add Secondary Pain Focus / Concurrent Symptom',
    hpi_associated_title: 'Associated Symptoms (Unlockable Clinical Modules)',
    hpi_badge_tip: 'Tap: Neutral / + Positive / − Negative',
    hpi_basic_label: 'Constitutional & Core GI Symptoms:',

    // Tab 3 PMH & PSH
    pmh_gatekeepers_title: 'Past Medical History (PMH - 7 Organ Gatekeepers)',
    pmh_routine_btn: 'Denies All Chronic Routine Illnesses (DM, HTN, IHD, Dyslipidemia)',
    psh_card_title: 'Past Surgical History (PSH & Prior Admissions)',
    btn_add_surgery: 'Add Prior Surgical Procedure',
    obgyn_card_title: 'Obstetric & Gynecologic History (Ob/Gyn - Females)',
    obgyn_gravida: 'Gravida (Total Pregnancies):',
    obgyn_para: 'Para (Viable Births):',
    obgyn_abortion: 'Abortion / Miscarriages:',
    obgyn_living: 'Living Children:',
    btn_add_pregnancy: 'Add Pregnancy Event',

    // Tab 4 DH, SH, AH, FH
    dh_card_title: 'Categorized Medications (Drug History - DH)',
    btn_add_custom_drug: 'Add Custom Medication',
    ah_card_title: 'Allergies & Adverse Drug Reactions (AH)',
    ah_nkda: 'No Known Drug Allergies (NKDA)',
    ah_drug_label: 'Drug Allergies & Manifestations:',
    ah_food_label: 'Food & Environmental Allergies:',
    sh_card_title: 'Social History & Habits (SH)',
    fh_card_title: 'Family History (FH - Malignancies & Surgical Conditions)',
    fh_noncontributory: 'Family history is non-contributory (Denies familial GI cancer or premature deaths)',

    // Tab 5 ROS
    ros_card_title: 'Review of Systems (ROS - 11 Standard Clinical Systems)',
    ros_tip: 'Non-surgical systems are collapsed by default. Click any header to expand and review.',

    // Tab 6 PE
    vitals_card_title: 'Vital Signs & NPO Status',
    vitals_bp: 'Blood Pressure (BP mmHg)',
    vitals_pr: 'Pulse Rate (PR bpm)',
    vitals_rr: 'Respiratory Rate (RR /min)',
    vitals_temp: 'Body Temperature (Temp °C)',
    vitals_spo2: 'Pulse Oximetry (SpO2 %)',
    vitals_npo: 'NPO Status (Fasting)',
    general_exam_title: 'General Appearance & Sensorium',
    abdominal_pillars_title: 'Four Mandatory Pillars of Abdominal Examination',
    rectal_exam_title: 'Digital Rectal Exam (DRE) & Perineum',
    btn_set_normal_exam: 'Set Normal Baseline for this Section',
    mass_exam_btn: 'Add Local Mass & Lesion Exam Card',
    atls_module_btn: 'Open Trauma, Penetrating Injury & Burn Module (ATLS)',

    // Tab 7 Paraclinics
    paraclinics_title: 'Diagnostic Studies, Labs & Imaging',
    paraclinics_tip: 'Click any imaging modality button to launch a dedicated reporting card.',
    imaging_launcher_title: 'Imaging Modalities & Diagnostic Reports:',
    efast_modality_btn: 'eFAST Ultrasound (Trauma)',

    // Tab 8 DDx
    ddx_card_title: 'Clinical Reasoning, Differential Diagnosis & Plan (DDx & Plan)',

    // Live Preview & Column Left
    live_preview_title: 'Live Structured Clinical Admission Note',
    badge_pos_suffix: 'Pos',
    badge_neg_suffix: 'Neg',
    btn_copy_markdown: 'Copy Markdown',
    btn_print: 'Print Note',
    btn_export_json: 'Download Research JSON',

    // Shift Manager Modal
    shift_modal_title: 'Shift Vault Manager (Offline Shift Vault)',
    shift_modal_desc: 'All cases documented during this shift are persisted 100% offline in browser storage.',
    shift_save_current: 'Save Current Case to Vault',
    shift_import: 'Import Shift JSON',
    shift_export: 'Batch Download All Shift Cases (JSON)',
    shift_clear: 'Clear Shift History',
    shift_empty_msg: 'No archived cases in the current shift vault.',
    btn_load_case: 'Load Case',
    btn_delete_case: 'Delete',

    // Settings Modal
    settings_modal_title: 'System Settings',
    settings_lang_label: 'Language & Layout Direction',
    settings_theme_label: 'Appearance & Color Theme',
    theme_dark_title: 'Dark Slate Surgical',
    theme_dark_desc: 'Reduces glare during night calls',
    theme_light_title: 'Clean Medical Light',
    theme_light_desc: 'High-contrast hospital documentation',
    settings_font_label: 'Typography & Font Style (5 Options)',
    settings_cloud_label: 'Google Sheets Cloud Sync (Apps Script Web App)',
    settings_collector_label: 'Collector Name / Attending ID',
    settings_url_label: 'Google Apps Script Web App Endpoint URL',
    settings_install_label: 'Direct App Installation (Install App)',
    settings_install_desc: 'Install SurgHistory as a standalone native app on Android, Windows, or iOS for seamless offline clinical charting.',
    btn_cancel: 'Cancel',
    btn_save_settings: 'Save Settings',

    // SOAP
    soap_btn_add_day: 'Add Day',
    soap_btn_del_day: 'Delete Day',
    soap_confirm_delete_day: 'Are you sure you want to permanently delete this daily SOAP note? This cannot be undone.',
    shift_confirm_delete_case: 'Are you sure you want to permanently delete this case? This action cannot be undone.',

    // Common Buttons
    btn_toggle_negatives: '− Mark Rest as Negative',
    btn_toggle_reset: '↺ Reset Negatives',

    // Chart Letterhead & Preview Header
    chart_hospital_title: 'Department of General Surgery — Clinical Chart & Progress Record',
    chart_hospital_subtitle: 'Medical Center Clinical Chart — Inpatient & Trauma Documentation',
    btn_copy_short: 'Copy',
    btn_print_short: 'Print',
    btn_json_short: 'JSON',
    mobile_preview_btn: 'Preview & Copy Clinical Note',

    // SOAP Standard Hospital Titles
    soap_nav_hd: '1. Course & Hospital Day (HD# / POD#)',
    soap_nav_s: '2. Subjective (24h Patient Report & Symptoms)',
    soap_nav_o: '3. Objective (Vitals, I/O, Focused PE & Labs)',
    soap_nav_a: '4. Assessment (Daily Clinical Impression)',
    soap_nav_p: '5. Plan (Management & Daily Orders)',

    // ATLS Navigation Titles
    atls_nav_primary: '1. Primary Survey (ABCDE)',
    atls_nav_mist_ample: '2. Mechanism & History (MIST & AMPLE)',
    atls_nav_secondary: '3. Secondary Survey, Wounds & Burns',
    atls_nav_efast_plan: '4. eFAST, Imaging & Trauma Plan'
  }
};

/**
 * Get active application language ('fa' | 'en')
 */
let inMemoryLang = 'fa';

export function getCurrentLanguage() {
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'fa') return saved;
  }
  return inMemoryLang;
}

/**
 * Central bilingual translator:
 * - Supports dictionary key lookup: t('btn_new_case')
 * - Supports inline bilingual strings: t('متن فارسی', 'English Text')
 */
export function t(faOrKey, enStr = '') {
  const lang = getCurrentLanguage();
  if (
    typeof faOrKey === 'string' &&
    I18N_DICTIONARY.fa &&
    Object.prototype.hasOwnProperty.call(I18N_DICTIONARY.fa, faOrKey)
  ) {
    return I18N_DICTIONARY[lang]?.[faOrKey] ?? (lang === 'en' && enStr ? enStr : I18N_DICTIONARY.fa[faOrKey]);
  }
  if (lang === 'en') {
    if (enStr !== undefined && enStr !== '') return enStr;
    return tLabel(faOrKey);
  }
  return faOrKey;
}

/**
 * Extract clean localized label from a schema item
 */
export function getLocalizedItemLabel(item, lang = getCurrentLanguage()) {
  if (!item) return '';
  return tLabel(item, lang === 'en' ? (item.en || item.labelEn || '') : (item.fa || item.labelFa || ''));
}

/**
 * Set and persist active language
 */
export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'fa') lang = 'fa';
  inMemoryLang = lang;
  setCurrentLang(lang);
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  }

  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    const isEn = lang === 'en';

    html.setAttribute('lang', lang);
    html.setAttribute('dir', isEn ? 'ltr' : 'rtl');
    document.body.classList.toggle('lang-en', isEn);
    document.body.classList.toggle('lang-fa', !isEn);

    // Update static DOM elements with data-i18n
    applyI18nToDOM(lang);
  }

  // Fire event for app.js to re-render dynamic sections
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('surg:language-changed', { detail: { lang } }));
  }
}

/**
 * Apply translations to DOM elements having data-i18n attributes
 */
export function applyI18nToDOM(lang = getCurrentLanguage()) {
  if (typeof document === 'undefined') return;
  const isEn = lang === 'en';
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY.fa;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      const labelSpan = el.querySelector('.i18n-text');
      if (labelSpan) {
        labelSpan.textContent = dict[key];
      } else if (el.children.length === 0) {
        el.textContent = dict[key];
      }
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) {
      el.setAttribute('title', dict[key]);
    }
  });

  // Inline bilingual text attributes: data-fa / data-en
  document.querySelectorAll('[data-fa][data-en]').forEach((el) => {
    const txt = isEn ? el.getAttribute('data-en') : el.getAttribute('data-fa');
    if (txt !== null) {
      const labelSpan = el.querySelector('.i18n-text');
      if (labelSpan) {
        labelSpan.textContent = txt;
      } else if (el.children.length === 0) {
        el.textContent = txt;
      }
    }
  });

  document.querySelectorAll('[data-fa-ph][data-en-ph]').forEach((el) => {
    const txt = isEn ? el.getAttribute('data-en-ph') : el.getAttribute('data-fa-ph');
    if (txt !== null) el.setAttribute('placeholder', txt);
  });

  document.querySelectorAll('[data-fa-title][data-en-title]').forEach((el) => {
    const txt = isEn ? el.getAttribute('data-en-title') : el.getAttribute('data-fa-title');
    if (txt !== null) el.setAttribute('title', txt);
  });

  // Auto-localize static clinical capsule buttons while preserving dataset values
  document
    .querySelectorAll('[data-val], [data-plan], [data-uo-status], [data-pe-val], [data-atls-val]')
    .forEach((el) => {
      if (el.hasAttribute('data-fa') || el.hasAttribute('data-i18n')) return;
      const raw =
        el.getAttribute('data-val') ||
        el.getAttribute('data-plan') ||
        el.getAttribute('data-uo-status') ||
        el.getAttribute('data-pe-val') ||
        el.getAttribute('data-atls-val') ||
        '';
      if (!raw) return;
      const localized = isEn ? tLabel(raw) : raw;
      const chipSpan = el.querySelector('.chip-text');
      if (chipSpan) {
        chipSpan.textContent = localized;
      } else if (el.children.length === 0) {
        el.textContent = localized;
      }
    });

  // Auto-localize static <select> <option> labels while keeping option.value intact
  document.querySelectorAll('select option').forEach((opt) => {
    if (opt.hasAttribute('data-i18n') || opt.hasAttribute('data-fa')) return;
    if (!opt.hasAttribute('data-orig-fa')) {
      const currentTxt = (opt.textContent || '').trim();
      if (/[\u0600-\u06FF]/.test(currentTxt)) {
        opt.setAttribute('data-orig-fa', currentTxt);
      }
    }
    const origFa = opt.getAttribute('data-orig-fa');
    if (origFa) {
      opt.textContent = isEn ? tLabel(origFa) : origFa;
    }
  });

  document.title = dict.app_title || document.title;
}

/**
 * Typography & Font Management
 * Available styles: vazirmatn, sahel, samim, shabnam, estedad
 */
export const AVAILABLE_FONTS = [
  { id: 'vazirmatn', labelFa: 'وزیرمتن (پیش‌فرض)', labelEn: 'Vazirmatn (Default)', family: "'Vazirmatn', sans-serif" },
  { id: 'sahel', labelFa: 'ساحل (کتابی و خوانا)', labelEn: 'Sahel / Noto Sans', family: "'Noto Sans Arabic', 'Sahel', 'Vazirmatn', sans-serif" },
  { id: 'samim', labelFa: 'صمیم (ارگونومیک گرد)', labelEn: 'Samim / Readex Pro', family: "'Readex Pro', 'Samim', 'Vazirmatn', sans-serif" },
  { id: 'shabnam', labelFa: 'شبنم (هندسی استاندارد)', labelEn: 'Shabnam / Rubik', family: "'Rubik', 'Shabnam', 'Vazirmatn', sans-serif" },
  { id: 'estedad', labelFa: 'استداد (تیتر و مدرن)', labelEn: 'Estedad / Cairo', family: "'Cairo', 'Estedad', 'Vazirmatn', sans-serif" }
];

export function getCurrentFont() {
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    const saved = localStorage.getItem(STORAGE_FONT_KEY);
    if (AVAILABLE_FONTS.some((f) => f.id === saved)) return saved;
  }
  return 'vazirmatn';
}

export function setFont(fontId) {
  const found = AVAILABLE_FONTS.find((f) => f.id === fontId) || AVAILABLE_FONTS[0];
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
    localStorage.setItem(STORAGE_FONT_KEY, found.id);
  }
  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-font', found.id);
    document.documentElement.style.setProperty('--font-persian', found.family);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('surg:font-changed', { detail: { font: found.id } }));
  }
}

/**
 * Theme Management (Light / Dark)
 */
export function getCurrentTheme() {
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  }
  return 'dark';
}

export function setTheme(theme) {
  const isDark = theme === 'dark';
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
    localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
  }
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('theme-light', !isDark);

    const sun = document.getElementById('themeIconSun');
    const moon = document.getElementById('themeIconMoon');
    if (sun && moon) {
      sun.style.display = isDark ? 'block' : 'none';
      moon.style.display = isDark ? 'none' : 'block';
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('surg:theme-changed', { detail: { theme: isDark ? 'dark' : 'light' } }));
  }
}
