/**
 * Clinical Schema & Medical Taxonomy - Surg-Scribe v0.5-Surg
 * Complete surgical ontology for General Surgery inpatient admissions.
 * Features:
 * - Multi-focal pain episodes with timing, aggravating & relieving factors
 * - Unlockable HPI symptom modules (default basic GI/constitutional)
 * - 7 Tree Gatekeepers for PMH with core routine negatives
 * - Categorized Drug History (DH) with 3-box inline inputs (Dose, Sig, Note)
 * - Bilingual ROS with intelligent gender filtering (ROS_GROUPS_BILINGUAL)
 * - 4 Abdominal Exam Pillars + 5 Unlockable Specialized Exam Modules
 * - Compact Paraclinic Modality Launcher with multi-instance imaging & MRI/MRCP
 */

export const PAIN_TIMING_OPTIONS = [
  { id: 'continuous', label: 'دائمی و پیوسته (Continuous)' },
  { id: 'intermittent', label: 'متناوب / حمله‌ای (Intermittent/Episodic)' },
  { id: 'nocturnal', label: 'شبانه / بیدارکننده از خواب (Nocturnal)' },
  { id: 'catamenial', label: 'سیلیکیک / همزمان با قاعدگی (Catamenial/Menstrual)' },
  { id: 'postprandial', label: 'پس از وعده غذایی (Postprandial)' }
];

export const PAIN_AGGRAVATING_FACTORS = [
  'مصرف غذای چرب / غذا خوردن',
  'دراز کشیدن به پشت (Supine)',
  'حرکت، سرفه و دم عمیق',
  'فعالیت بدنی و تقلا (Exertion)',
  'دوران قاعدگی (Menstruation)',
  'گرسنگی / ناشتایی'
];

export const PAIN_RELIEVING_FACTORS = [
  'خم شدن به جلو (Leaning forward)',
  'استراحت و بی‌حرکتی',
  'مصرف مسکن / ضدالتهاب',
  'استفراغ کردن',
  'دفع گاز یا مدفوع',
  'مصرف آنتی‌اسید یا غذا',
  'نیتروگلیسیرین (TNG)'
];

export const HPI_BASIC_SYMPTOMS = [
  { id: 'anorexia', label: 'بی‌اشتهایی (Anorexia)', detailHint: 'مدت و شدت...' },
  { id: 'nausea', label: 'تهوع (Nausea)', detailHint: 'مداوم یا متناوب...' },
  { id: 'vomiting', label: 'استفراغ (Vomiting)', detailHint: 'تعداد دفعات، محتویات (غذایی/صفراوی/خونی)، تسکین درد پس از آن...' },
  { id: 'fever', label: 'تب (Fever)', detailHint: 'درجه، زمانبندی...' },
  { id: 'chills_rigors', label: 'لرز تکانی (Chills / Rigors)', detailHint: 'تناوب و شدت...' },
  { id: 'inability_pass_gas', label: 'عدم دفع گاز (Inability to pass flatus / Obstipation)', detailHint: 'از چند ساعت/روز قبل...' },
  { id: 'diarrhea', label: 'اسهال (Diarrhea)', detailHint: 'قوام، دفعات، خونی یا آبکی...' }
];

export const HPI_UNLOCKABLE_MODULES = [
  {
    id: 'mod_cholestasis',
    buttonLabel: '➕ باز کردن ماژول: علائم صفراوی و کلستاز (زردی، خارش، ادرار چای‌رنگ، مدفوع آکولیک)',
    title: 'علائم صفراوی و کلستاز (Hepatobiliary & Cholestasis)',
    chips: [
      { id: 'icterus_jaundice', label: 'زردی پوست و اسکلرا (Icterus / Jaundice)', detailHint: 'سیر پیشرونده یا نوسانی...' },
      { id: 'pruritus', label: 'خارش پوستی (Pruritus)', detailHint: 'شدت و زمان تشدید...' },
      { id: 'dark_tea_urine', label: 'تیره شدن رنگ ادرار (چای‌رنگ / Dark Urine)', detailHint: 'از چند روز قبل...' },
      { id: 'acholic_pale_stool', label: 'کم‌رنگ یا سفید شدن مدفوع (Acholic Stool)', detailHint: 'مدت زمان...' }
    ]
  },
  {
    id: 'mod_postop_drain',
    buttonLabel: '➕ باز کردن ماژول: عوارض محل عمل جراحی اخیر و درن (درد/سفتی محل درن، ترشح، باز شدن بخیه)',
    title: 'عوارض محل عمل جراحی اخیر و درن (Post-Op & Drain Site Complications)',
    chips: [
      { id: 'drain_site_pain_induration', label: 'درد و سفتی (Induration) در محل درن یا خط بخیه', detailHint: 'ناحیه درن و فاصله زمانی از عمل...' },
      { id: 'drain_output_change', label: 'تغییر حجم یا ماهیت ترشحات درن', detailHint: 'حجم ۲۴ ساعته به cc و ماهیت: سروزی/هموراژیک/چرکی/صفراوی...' },
      { id: 'drain_dislodgement_blockage', label: 'انسداد، نشت از کنار درن یا خروج ناخواسته درن', detailHint: 'میزان نشت یا انسداد...' },
      { id: 'wound_erythema_warmth_dehiscence', label: 'قرمزی، گرمی، ترشح یا باز شدن (Dehiscence) خط بخیه', detailHint: 'ترشح، باز شدن لبه‌ها...' }
    ]
  },
  {
    id: 'mod_gi_bleeding',
    buttonLabel: '➕ باز کردن ماژول: علائم خونریزی گوارشی و آنورکتال (هماتمز، ملنا، هماتوشزی، دیسفاژی)',
    title: 'علائم خونریزی گوارشی و آنورکتال (GI Bleeding & Anorectal)',
    chips: [
      { id: 'hematemesis', label: 'هماتمز (استفراغ خونی یا Coffee-ground)', detailHint: 'حجم و دفعات...' },
      { id: 'melena', label: 'ملنا (مدفوع قیری و سیاه)', detailHint: 'دفعات و حجم...' },
      { id: 'hematochezia', label: 'هماتوشزی / رکتوراژی (خون روشن از رکتوم)', detailHint: 'مخلوط با مدفوع یا قطره‌ای پس از دفع...' },
      { id: 'dysphagia_odynophagia', label: 'دیسفاژی یا ادینوفاژی (اختلال یا درد بلع)', detailHint: 'به جامدات یا مایعات...' },
      { id: 'tenesmus_anorectal_pain', label: 'زورپیچ (Tenesmus) یا درد حین اجابت مزاج', detailHint: 'شدت درد...' }
    ]
  },
  {
    id: 'mod_mass_hernia',
    buttonLabel: '➕ باز کردن ماژول: علائم توده، فتق، پستان و تیروئید (جا رفتن توده، تغییرات پوست، خشونت صدا)',
    title: 'علائم توده، فتق، پستان و تیروئید (Mass, Hernia, Breast & Thyroid)',
    chips: [
      { id: 'reducible_mass', label: 'جا رفتن توده در حالت خوابیده یا با دست (Reducible)', detailHint: 'روش جااندازی...' },
      { id: 'incarcerated_irreducible', label: 'گیر افتادن و عدم جا رفتن توده (Incarcerated)', detailHint: 'از چند ساعت قبل...' },
      { id: 'strangulation_erythema_pain', label: 'درد شدید، قرمزی و گرمی پوست روی توده (Strangulation)', detailHint: 'علائم ایسکمی...' },
      { id: 'nipple_discharge_retraction', label: 'ترشح از نیپل یا فرورفتگی نوک پستان', detailHint: 'خونی/سروزی، یکطرفه/دوطرفه...' },
      { id: 'skin_dimpling_peau', label: 'کشیدگی پوست یا نمای پوست‌پرتقالی (Peau d’orange)', detailHint: 'محل در پستان...' },
      { id: 'hoarseness_voice_change', label: 'خشونت یا تغییر صدا (Hoarseness)', detailHint: 'مدت زمان...' }
    ]
  },
  {
    id: 'mod_urinary_pelvic',
    buttonLabel: '➕ باز کردن ماژول: علائم ادراری و لگنی (دیزوری، هماچوری، احتباس/کاهش جریان ادرار)',
    title: 'علائم دستگاه ادراری و لگنی (Urinary & Pelvic Symptoms)',
    chips: [
      { id: 'dysuria_frequency', label: 'سوزش یا تکرر ادرار (Dysuria / Frequency)', detailHint: 'تغییر رنگ ادرار...' },
      { id: 'hematuria', label: 'هماچوری (تغییر رنگ خونی ادرار)', detailHint: 'لخته، ابتدا یا کل ادرار...' },
      { id: 'urinary_retention_hesitancy', label: 'احتباس، تاخیر در شروع یا کاهش جریان ادرار', detailHint: 'سابقه سوندگذاری...' },
      { id: 'gyn_discharge_bleeding_lmp', label: 'ترشح/خونریزی غیرطبیعی واژینال یا تاخیر پریود (در خانم‌ها)', detailHint: 'تاریخ LMP...' }
    ]
  }
];

export const PMH_CATEGORIES = [
  {
    id: 'pmh_cardiovascular',
    title: 'بیماری‌های قلبی-عروقی و فشار خون (Cardiovascular & HTN)',
    items: [
      { id: 'pmh_htn', label: 'پرفشاری خون (HTN)', isRoutine: true, detailHint: 'مدت ابتلا، داروها، فشار خون معمول...' },
      { id: 'pmh_ihd', label: 'بیماری ایسکمیک قلبی (IHD / MI / استنت / CABG)', isRoutine: true, detailHint: 'سال رخداد، تعداد رگ، آخرین اکو/آنژیو (EF%)...' },
      { id: 'pmh_chf', label: 'نارسایی قلبی (CHF)', isRoutine: false, detailHint: 'کلاس عملکردی (NYHA)، EF%...' },
      { id: 'pmh_arrhythmia', label: 'آریتمی قلبی / فیبریلاسیون دهلیزی (AF) / پیس‌میکر', isRoutine: false, detailHint: 'نوع آریتمی و داروی ضدآریتمی/ضدانعقاد...' }
    ]
  },
  {
    id: 'pmh_endocrine',
    title: 'بیماری‌های غدد و متابولیک (Endocrine & Metabolic)',
    items: [
      { id: 'pmh_dm', label: 'دیابت شیرین (DM)', isRoutine: true, detailHint: 'نوع، مدت ابتلا، داروهای مصرفی (انسولین/خوراکی)، آخرین HbA1c...' },
      { id: 'pmh_dlp', label: 'چربی خون / دیس‌لیپیدمی (DLP/HLP)', isRoutine: true, detailHint: 'داروی مصرفی (استاتین و...)...' },
      { id: 'pmh_thyroid', label: 'کم‌کاری یا پرکاری تیروئید (Hypo/Hyperthyroidism)', isRoutine: false, detailHint: 'دوز لووتیروکسین یا متی‌مازول...' }
    ]
  },
  {
    id: 'pmh_gi_hepatobiliary',
    title: 'بیماری‌های گوارشی، کبدی و صفراوی (GI & Hepatobiliary)',
    items: [
      { id: 'pmh_pud_gerd', label: 'بیماری اولسر پپتیک (PUD) / ریفلاکس (GERD)', isRoutine: false, detailHint: 'سابقه اندوسکوپی یا مصرف PPI...' },
      { id: 'pmh_liver', label: 'کبد چرب / سیروز / هپاتیت', isRoutine: false, detailHint: 'گرید یا کلاس Child-Pugh...' },
      { id: 'pmh_ibd', label: 'بیماری التهابی روده (IBD / کرون / کولیت اولسراتیو)', isRoutine: false, detailHint: 'مدت و داروهای سرکوب‌کننده ایمنی...' },
      { id: 'pmh_gallstones', label: 'سنگ کیسه صفرا یا مجاری صفراوی (Gallstones)', isRoutine: false, detailHint: 'علامت‌دار یا بدون علامت...' }
    ]
  },
  {
    id: 'pmh_respiratory',
    title: 'بیماری‌های تنفسی و ریوی (Respiratory)',
    items: [
      { id: 'pmh_asthma', label: 'آسم (Asthma)', isRoutine: false, detailHint: 'اسپری‌های استنشاقی، سابقه بستری...' },
      { id: 'pmh_copd', label: 'بیماری مزمن انسدادی ریه (COPD)', isRoutine: false, detailHint: 'مصرف اکسیژن خانگی، بستری...' },
      { id: 'pmh_sleep_apnea', label: 'آپنه انسدادی خواب (Sleep Apnea / CPAP)', isRoutine: false, detailHint: 'استفاده از دستگاه CPAP...' }
    ]
  },
  {
    id: 'pmh_renal_urologic',
    title: 'بیماری‌های کلیوی و مجاری ادراری (Renal & Urologic)',
    items: [
      { id: 'pmh_ckd_dialysis', label: 'بیماری مزمن کلیوی / دیالیز (CKD / Dialysis)', isRoutine: false, detailHint: 'کراتینین پایه، برنامه دیالیز...' },
      { id: 'pmh_kidney_stones', label: 'سنگ کلیه و مجاری ادراری (Nephrolithiasis)', isRoutine: false, detailHint: 'سابقه سنگ‌شکنی یا جراحی...' },
      { id: 'pmh_bph', label: 'بزرگی خوش‌خیم پروستات (BPH)', isRoutine: false, detailHint: 'داروهای مصرفی (تامسولوسین و...)...' }
    ]
  },
  {
    id: 'pmh_heme_oncology',
    title: 'هماتولوژی، ترومبوآمبولی و بدخیمی (Heme & Oncology)',
    items: [
      { id: 'pmh_dvt_pte', label: 'سابقه ترومبوز ورید عمقی (DVT) یا آمبولی ریه (PTE)', isRoutine: false, detailHint: 'زمان رخداد و درمان ضدانعقادی...' },
      { id: 'pmh_chronic_anemia', label: 'کم‌خونی مزمن (Chronic Anemia)', isRoutine: false, detailHint: 'نوع کم‌خونی و سابقه ترانسفوزیون...' },
      { id: 'pmh_coagulopathy', label: 'اختلالات انعقادی و خونریزی‌دهنده (Coagulopathy)', isRoutine: false, detailHint: 'نوع اختلال فاکتوری یا پلاکتی...' },
      { id: 'pmh_malignancy_chemo', label: 'سابقه کنسر / شیمی‌درمانی / رادیوتراپی', isRoutine: false, detailHint: 'نوع بدخیمی، سال تشخیص و اقدامات...' }
    ]
  },
  {
    id: 'pmh_neuro_psych',
    title: 'بیماری‌های مغز و اعصاب و روان (Neuro & Psych)',
    items: [
      { id: 'pmh_cva_tia', label: 'سکته مغزی یا حمله ایسکمیک گذرا (CVA / TIA)', isRoutine: false, detailHint: 'سال رخداد، نقص نورولوژیک باقیمانده...' },
      { id: 'pmh_seizure', label: 'صرع یا تشنج (Seizure / Epilepsy)', isRoutine: false, detailHint: 'داروهای ضدتشنج، زمان آخرین حمله...' }
    ]
  }
];

export const DH_SIG_OPTIONS = [
  'Daily (روزانه)',
  'BD (هر ۱۲ ساعت)',
  'TDS (هر ۸ ساعت)',
  'QID (هر ۶ ساعت)',
  'PRN (هنگام نیاز/درد)',
  'Stat',
  'Weekly'
];

export const DH_CATEGORIES = [
  {
    id: 'anticoagulants',
    title: '۱. ضدانعقادها و ضدپلاکت‌ها (حساس در جراحی)',
    drugs: [
      { id: 'aspirin', label: 'آسپرین (ASA)', defaultDose: '80mg' },
      { id: 'clopidogrel', label: 'کلوپیدوگرل (Plavix)', defaultDose: '75mg' },
      { id: 'warfarin', label: 'وارفارین (Warfarin)', defaultDose: '5mg' },
      { id: 'rivaroxaban', label: 'ریواروکسابان (Xarelto)', defaultDose: '20mg' },
      { id: 'apixaban', label: 'آپیکسابان (Eliquis)', defaultDose: '5mg' },
      { id: 'enoxaparin', label: 'انوکساپارین (Clexane)', defaultDose: '40mg' },
      { id: 'heparin', label: 'هپارین (Heparin)', defaultDose: '5000 IU' }
    ]
  },
  {
    id: 'cardiovascular',
    title: '۲. داروهای قلبی و فشار خون',
    drugs: [
      { id: 'losartan', label: 'لوزارتان (Losartan)', defaultDose: '25mg' },
      { id: 'valsartan', label: 'والزارتان (Valsartan)', defaultDose: '80mg' },
      { id: 'amlodipine', label: 'آملودیپین (Amlodipine)', defaultDose: '5mg' },
      { id: 'metoprolol', label: 'متوپرولول (Metoral)', defaultDose: '50mg' },
      { id: 'propranolol', label: 'پروپرانولول (Propranolol)', defaultDose: '20mg' },
      { id: 'bisoprolol', label: 'بیزوپرولول (Concor)', defaultDose: '5mg' },
      { id: 'atorvastatin', label: 'آتورواستاتین (Atorvastatin)', defaultDose: '20mg' },
      { id: 'rosuvastatin', label: 'رزوواستاتین (Rosuvastatin)', defaultDose: '10mg' },
      { id: 'furosemide', label: 'فوروزماید (Lasix)', defaultDose: '40mg' },
      { id: 'spironolactone', label: 'اسپیرونولاکتون (Aldactone)', defaultDose: '25mg' },
      { id: 'digoxin', label: 'دیگوکسین (Digoxin)', defaultDose: '0.25mg' },
      { id: 'nitrocontin', label: 'نیتروکانتین (Nitrocontin)', defaultDose: '2.6mg' }
    ]
  },
  {
    id: 'endocrine_steroid',
    title: '۳. داروهای دیابت، تیروئید و کورتون',
    drugs: [
      { id: 'metformin', label: 'متفورمین (Metformin)', defaultDose: '500mg' },
      { id: 'glibenclamide_gliclazide', label: 'گلی‌بنکلامید / گلیکلازید', defaultDose: '5mg' },
      { id: 'empagliflozin', label: 'امپاگلیفلوزین (Jardiance)', defaultDose: '10mg' },
      { id: 'sitagliptin', label: 'سیتاگلیپتین (Januvia)', defaultDose: '100mg' },
      { id: 'insulin', label: 'انسولین (لانتوس/نووراپید)', defaultDose: 'واحدهای تزریقی' },
      { id: 'levothyroxine', label: 'لووتیروکسین (Levothyroxine)', defaultDose: '100mcg' },
      { id: 'methimazole', label: 'متی‌مازول (Methimazole)', defaultDose: '5mg' },
      { id: 'prednisolone', label: 'پردنیزولون (Prednisolone)', defaultDose: '5mg' },
      { id: 'dexamethasone_hydrocortisone', label: 'دگزامتازون / هیدروکورتیزون', defaultDose: 'آمپول/قرص' }
    ]
  },
  {
    id: 'gi',
    title: '۴. داروهای گوارشی',
    drugs: [
      { id: 'pantoprazole', label: 'پنتوپرازول (Pantoprazole)', defaultDose: '40mg' },
      { id: 'omeprazole', label: 'امپرازول (Omeprazole)', defaultDose: '20mg' },
      { id: 'famotidine', label: 'فاموتیدین (Famotidine)', defaultDose: '40mg' },
      { id: 'ondansetron', label: 'اندانسترون (Ondansetron)', defaultDose: '4mg' },
      { id: 'metoclopramide', label: 'متوکلوپرامید (Plasil)', defaultDose: '10mg' },
      { id: 'dimethicone', label: 'دایمتیکون (Dimethicone)', defaultDose: 'قرص جویدنی' },
      { id: 'lactulose', label: 'لاکتولوز (Lactulose)', defaultDose: 'شربت' },
      { id: 'mesalazine', label: 'مزالازین (Mesalazine)', defaultDose: '500mg' }
    ]
  },
  {
    id: 'analgesic_abx_psych',
    title: '۵. مسکن‌ها، آنتی‌بیوتیک‌ها و اعصاب/سایر',
    drugs: [
      { id: 'acetaminophen', label: 'استامینوفن (Acetaminophen)', defaultDose: '500mg' },
      { id: 'novafen', label: 'نووافن (Novafen)', defaultDose: 'کپسول' },
      { id: 'ibuprofen_naproxen', label: 'ایبوپروفن / ناپروکسن', defaultDose: '400mg' },
      { id: 'celecoxib', label: 'سلکوکسیب (Celebrex)', defaultDose: '100mg' },
      { id: 'diclofenac', label: 'دیکلوفناک (Voltaren)', defaultDose: '100mg' },
      { id: 'gabapentin_pregabalin', label: 'گاباپنتین / پرگابالین', defaultDose: '100mg' },
      { id: 'sertraline_fluoxetine', label: 'سرترالین / فلوکستین', defaultDose: '50mg' },
      { id: 'alprazolam_clonazepam', label: 'آلپرازولام / کلونازپام', defaultDose: '0.5mg' }
    ]
  }
];

export const ROS_GROUPS_BILINGUAL = [
  {
    id: 'ros_constitutional',
    group: '۱. علائم عمومی (Constitutional Symptoms)',
    items: [
      { id: 'ros_fever', label: 'تب (Fever / Pyrexia)', gender: 'all' },
      { id: 'ros_chills', label: 'لرز (Chills / Rigors)', gender: 'all' },
      { id: 'ros_weight_loss', label: 'کاهش وزن ناخواسته (Unintentional Weight Loss)', gender: 'all' },
      { id: 'ros_weight_gain', label: 'افزایش وزن (Weight Gain)', gender: 'all' },
      { id: 'ros_anorexia', label: 'بی‌اشتهایی (Anorexia)', gender: 'all' },
      { id: 'ros_fatigue', label: 'ضعف و بی‌حالی (Fatigue / Malaise)', gender: 'all' },
      { id: 'ros_night_sweats', label: 'تعریق شبانه (Night Sweats / Diaphoresis)', gender: 'all' }
    ]
  },
  {
    id: 'ros_skin_breast',
    group: '۲. پوست، ضمائم و پستان (Integumentary & Breast)',
    items: [
      { id: 'ros_jaundice', label: 'زردی پوست (Cutaneous Icterus / Jaundice)', gender: 'all' },
      { id: 'ros_pruritus', label: 'خارش پوستی (Pruritus)', gender: 'all' },
      { id: 'ros_rash_ulcer', label: 'بثورات یا زخم پوستی (Skin Rash / Ulceration)', gender: 'all' },
      { id: 'ros_ecchymosis', label: 'کبودی آسان و پتشی (Easy Bruising / Ecchymosis / Petechiae)', gender: 'all' },
      { id: 'ros_mastalgia_mass', label: 'درد یا توده پستان (Mastalgia / Breast Mass)', gender: 'female' },
      { id: 'ros_nipple_discharge', label: 'ترشح از نوک پستان (Nipple Discharge / Galactorrhea)', gender: 'female' },
      { id: 'ros_gynecomastia', label: 'بزرگی یا توده پستان در آقایان (Gynecomastia / Male Breast Mass)', gender: 'male' }
    ]
  },
  {
    id: 'ros_heent',
    group: '۳. سر، چشم، گوش، حلق و گردن (HEENT & Neck)',
    items: [
      { id: 'ros_headache', label: 'سردرد (Cephalgia / Headache)', gender: 'all' },
      { id: 'ros_vision_diplopia', label: 'تاری دید یا دوبینی (Blurred Vision / Diplopia)', gender: 'all' },
      { id: 'ros_scleral_icterus', label: 'زردی اسکلرا (Scleral Icterus)', gender: 'all' },
      { id: 'ros_vertigo_tinnitus', label: 'سرگیجه حقیقی یا وزوز گوش (Vertigo / Tinnitus)', gender: 'all' },
      { id: 'ros_epistaxis', label: 'خوندماغ یا خونریزی لثه (Epistaxis / Gingival Bleeding)', gender: 'all' },
      { id: 'ros_hoarseness', label: 'خشونت صدا (Hoarseness / Dysphonia)', gender: 'all' },
      { id: 'ros_neck_mass', label: 'توده یا لنفادنوپاتی گردنی (Cervical Mass / Lymphadenopathy)', gender: 'all' }
    ]
  },
  {
    id: 'ros_respiratory',
    group: '۴. دستگاه تنفسی (Respiratory System)',
    items: [
      { id: 'ros_dyspnea', label: 'تنگی نفس (Dyspnea)', gender: 'all' },
      { id: 'ros_cough', label: 'سرفه (Cough)', gender: 'all' },
      { id: 'ros_sputum', label: 'خلط (Sputum Production)', gender: 'all' },
      { id: 'ros_hemoptysis', label: 'خلط خونی (Hemoptysis)', gender: 'all' },
      { id: 'ros_pleuritic_cp', label: 'درد قفسه سینه پلورتیک (Pleuritic Chest Pain)', gender: 'all' },
      { id: 'ros_wheezing', label: 'خس‌خس سینه (Wheezing)', gender: 'all' }
    ]
  },
  {
    id: 'ros_cardiovascular',
    group: '۵. دستگاه قلبی-عروقی (Cardiovascular System)',
    items: [
      { id: 'ros_exertional_cp', label: 'درد قفسه سینه فعالیتی (Exertional Angina / Chest Pain)', gender: 'all' },
      { id: 'ros_doe', label: 'تنگی نفس فعالیتی (Dyspnea on Exertion - DOE)', gender: 'all' },
      { id: 'ros_orthopnea', label: 'تنگی نفس در حالت درازکش (Orthopnea)', gender: 'all' },
      { id: 'ros_pnd', label: 'تنگی نفس حمله‌ای شبانه (Paroxysmal Nocturnal Dyspnea - PND)', gender: 'all' },
      { id: 'ros_palpitation', label: 'تپش قلب (Palpitations)', gender: 'all' },
      { id: 'ros_syncope', label: 'سنکوپ یا پیش‌سنکوپ (Syncope / Presyncope)', gender: 'all' },
      { id: 'ros_peripheral_edema', label: 'ادم اندام تحتانی (Peripheral Pitting Edema)', gender: 'all' },
      { id: 'ros_claudication', label: 'لنگش متناوب عروقی (Intermittent Claudication)', gender: 'all' }
    ]
  },
  {
    id: 'ros_gastrointestinal',
    group: '۶. دستگاه گوارش و کبد (Gastrointestinal & Hepatobiliary)',
    items: [
      { id: 'ros_nausea_vomiting', label: 'تهوع و استفراغ (Nausea & Vomiting)', gender: 'all' },
      { id: 'ros_dysphagia', label: 'گیر کردن لقمه / اختلال بلع (Dysphagia)', gender: 'all' },
      { id: 'ros_odynophagia', label: 'بلع دردناک (Odynophagia)', gender: 'all' },
      { id: 'ros_heartburn', label: 'سوزش سردل و ریفلاکس (Pyrosis / Acid Regurgitation)', gender: 'all' },
      { id: 'ros_early_satiety', label: 'سیری زودرس و نفخ (Early Satiety & Bloating)', gender: 'all' },
      { id: 'ros_constipation', label: 'یبوست (Constipation)', gender: 'all' },
      { id: 'ros_obstipation', label: 'عدم دفع گاز و مدفوع (Obstipation)', gender: 'all' },
      { id: 'ros_diarrhea', label: 'اسهال (Diarrhea)', gender: 'all' },
      { id: 'ros_bowel_caliber', label: 'تغییر عادات روده‌ای و کالیبر مدفوع (Altered Bowel Habits / Stool Caliber)', gender: 'all' },
      { id: 'ros_melena', label: 'مدفوع قیری و سیاه (Melena)', gender: 'all' },
      { id: 'ros_hematochezia', label: 'دفع خون روشن از رکتوم (Hematochezia / Rectorrhagia)', gender: 'all' },
      { id: 'ros_hematemesis', label: 'استفراغ خونی (Hematemesis)', gender: 'all' },
      { id: 'ros_tenesmus', label: 'زورپیچ و درد مقعدی (Tenesmus / Proctalgia)', gender: 'all' },
      { id: 'ros_acholic_stool', label: 'مدفوع بی‌رنگ (Acholic / Clay-colored Stool)', gender: 'all' }
    ]
  },
  {
    id: 'ros_genitourinary',
    group: '۷. دستگاه ادراری و تناسلی (Genitourinary System)',
    items: [
      { id: 'ros_dysuria', label: 'سوزش ادرار (Dysuria)', gender: 'all' },
      { id: 'ros_frequency_urgency', label: 'تکرر و فوریت ادراری (Urinary Frequency & Urgency)', gender: 'all' },
      { id: 'ros_hematuria', label: 'خون در ادرار (Hematuria)', gender: 'all' },
      { id: 'ros_dark_urine', label: 'ادرار تیره / چای‌رنگ (Dark / Tea-colored Urine)', gender: 'all' },
      { id: 'ros_flank_pain', label: 'درد پهلو (Flank Pain / Renal Colic)', gender: 'all' },
      { id: 'ros_hesitancy_stream', label: 'تاخیر در شروع ادرار یا کاهش جریان ادرار (Urinary Hesitancy / Weak Stream / Retention)', gender: 'all' },
      { id: 'ros_scrotal_pain', label: 'درد یا تورم اسکروتوم و بیضه (Scrotal Pain / Swelling)', gender: 'male' },
      { id: 'ros_menometrorrhagia', label: 'خونریزی غیرطبیعی رحمی یا دیسمنوره (Abnormal Uterine Bleeding / Dysmenorrhea)', gender: 'female' },
      { id: 'ros_vaginal_discharge', label: 'ترشحات غیرطبیعی واژینال یا درد لگنی (Abnormal Vaginal Discharge / Pelvic Pain)', gender: 'female' }
    ]
  },
  {
    id: 'ros_musculoskeletal',
    group: '۸. دستگاه عضلانی-اسکلتی (Musculoskeletal System)',
    items: [
      { id: 'ros_arthralgia', label: 'درد یا التهاب مفاصل (Arthralgia / Arthritis)', gender: 'all' },
      { id: 'ros_myalgia', label: 'درد عضلانی (Myalgia)', gender: 'all' },
      { id: 'ros_back_pain', label: 'کمردرد (Low Back Pain / Lumbago)', gender: 'all' },
      { id: 'ros_calf_swelling', label: 'درد و تورم یکطرفه ساق پا (Unilateral Calf Pain / Swelling)', gender: 'all' }
    ]
  },
  {
    id: 'ros_neuro_endo_heme',
    group: '۹. عصبی، غدد و هماتولوژی (Neurological, Endocrine & Hematologic)',
    items: [
      { id: 'ros_paresthesia', label: 'گزگز و بی‌حسی اندام‌ها (Paresthesia / Numbness)', gender: 'all' },
      { id: 'ros_paresis', label: 'ضعف حرکتی موضعی (Focal Motor Weakness / Paresis)', gender: 'all' },
      { id: 'ros_seizure', label: 'تشنج (Seizure / Convulsion)', gender: 'all' },
      { id: 'ros_heat_cold', label: 'عدم تحمل به گرما یا سرما (Heat / Cold Intolerance)', gender: 'all' },
      { id: 'ros_polyuria_polydipsia', label: 'پرادراری و پرنوشی (Polyuria & Polydipsia)', gender: 'all' },
      { id: 'ros_bleeding_diathesis', label: 'خونریزی طولانی از زخم یا مخاطات (Prolonged Mucocutaneous Bleeding)', gender: 'all' }
    ]
  }
];

export const PE_MANDATORY_PILLARS = [
  {
    id: 'pe_general_heent_cp',
    title: '۱. ظاهر عمومی، سر و گردن و قلب و ریه (General, HEENT & Cardiopulmonary)',
    items: [
      { id: 'pe_conscious_oriented', label: 'هوشیار و آگاه به زمان، مکان و شخص (Oriented ×3)', detailHint: 'GCS...' },
      { id: 'pe_ill_toxic', label: 'ظاهر Ill یا Toxic', detailHint: 'بیقراری، تعریق...' },
      { id: 'pe_pale_conjunctiva', label: 'ملتحمه رنگ‌پریده (Pale Conjunctiva)', detailHint: 'شدت رنگ‌پریدگی...' },
      { id: 'pe_icteric_sclera', label: 'اسکلرای ایکتریک (Icteric Sclera)', detailHint: 'شدت زردی...' },
      { id: 'pe_clear_lungs', label: 'سمع ریه دوطرفه شفاف و بدون صدای اضافی', detailHint: '' },
      { id: 'pe_abnormal_lung_sounds', label: 'صداهای غیرطبیعی ریه (کراکل / ویز / کاهش صدا)', detailHint: 'سمت راست/چپ، قاعده...' },
      { id: 'pe_normal_heart_sounds', label: 'سمع قلب: S1 و S2 نرمال و منظم بدون سوفل', detailHint: '' },
      { id: 'pe_heart_murmur_arrhythmia', label: 'سوفل قلبی یا ریتم نامنظم', detailHint: 'گرید و کانون سمع...' }
    ]
  },
  {
    id: 'pe_abd_inspection',
    title: '۲. معاینه شکم - مشاهده (Abdominal Inspection)',
    items: [
      { id: 'pe_abd_flat_symmetrical', label: 'شکم صاف و قرینه (Flat & Symmetrical)', detailHint: '' },
      { id: 'pe_abd_distension', label: 'دیستانسیون و اتساع شکمی (Abdominal Distension)', detailHint: 'ژنرالیزه یا موضعی...' },
      { id: 'pe_abd_surgical_scar', label: 'اسکار جراحی قبلی روی شکم (Surgical Scar)', detailHint: 'نوع برش (میدلاین/مک‌برنی/کوشر/فان‌اشتیل) و نام عمل...' },
      { id: 'pe_abd_ecchymosis', label: 'اکیموز جدار شکم (علامت کولن یا گری‌ترنر)', detailHint: 'دور ناف یا پهلوها...' },
      { id: 'pe_abd_visible_bulge', label: 'برجستگی یا فتق واضح در مشاهده جدار شکم', detailHint: 'محل و سایز...' }
    ]
  },
  {
    id: 'pe_abd_auscultation',
    title: '۳. معاینه شکم - سمع (Abdominal Auscultation)',
    items: [
      { id: 'pe_normoactive_bs', label: 'صداهای روده‌ای نرمال (Normoactive Bowel Sounds)', detailHint: '' },
      { id: 'pe_hyperactive_metallic_bs', label: 'صداهای هیپراکتیو یا متالیک (Hyperactive / High-pitched Metallic BS)', detailHint: '' },
      { id: 'pe_hypoactive_absent_bs', label: 'کاهش یا سکوت صداهای روده‌ای (Hypoactive / Absent BS)', detailHint: '' },
      { id: 'pe_abdominal_bruit', label: 'بروئی عروقی آئورت یا شریان کلیوی (Abdominal Bruit)', detailHint: 'محل بروئی...' }
    ]
  },
  {
    id: 'pe_abd_percussion',
    title: '۴. معاینه شکم - دق (Abdominal Percussion)',
    items: [
      { id: 'pe_normal_tympanism', label: 'دق تیمپان طبیعی در چهار چهارک (Normal Tympanic Percussion)', detailHint: '' },
      { id: 'pe_shifting_dullness', label: 'ماتیته جابه‌جاشونده آسیت (Shifting Dullness)', detailHint: 'میزان مایع آزاد...' },
      { id: 'pe_hyperresonance', label: 'افزایش رزونانس / تیمپانیسم شدید ناشی از گاز (Hyperresonance)', detailHint: '' },
      { id: 'pe_cva_tenderness', label: 'تندرنس در دق زاویه دنده‌ای-مهره‌ای (CVA Percussion Tenderness)', detailHint: 'سمت راست یا چپ...' }
    ]
  },
  {
    id: 'pe_abd_palpation',
    title: '۵. معاینه شکم - لمس و مانورهای تخصصی جراحی (Abdominal Palpation & Special Signs)',
    items: [
      { id: 'pe_soft_nontender', label: 'شکم نرم و بدون تندرنس (Soft, Non-tender)', detailHint: '' },
      { id: 'pe_tenderness', label: 'تندرنس سطحی یا عمقی در لمس (Tenderness)', detailHint: 'نواحی دقیق (مثلاً RLQ، اپی‌گاستر)...' },
      { id: 'pe_rebound_tenderness', label: 'ریباند تندرنس مثبت (Rebound Tenderness)', detailHint: 'محل دقیق...' },
      { id: 'pe_guarding_rigidity', label: 'گاردینگ یا شکم تخته‌ای (Guarding / Board-like Rigidity)', detailHint: 'ارادی/غیرارادی، لوکالیزه یا ژنرالیزه...' },
      { id: 'pe_murphy_sign', label: 'علامت مورفی مثبت (Murphy’s Sign)', detailHint: '' },
      { id: 'pe_mcburney_rovsing', label: 'تندرنس مک‌برنی و علامت روزینگ (McBurney & Rovsing’s Sign)', detailHint: '' },
      { id: 'pe_psoas_obturator', label: 'علامت پسواس و ابتوراتور (Psoas & Obturator Signs)', detailHint: '' },
      { id: 'pe_palpable_mass', label: 'لمس توده شکمی یا جدار شکم (Palpable Mass / Carnett’s Sign)', detailHint: 'محل، ابعاد (cm)، قوام، تست کارنت...' },
      { id: 'pe_hepatosplenomegaly', label: 'هپاتومگالی یا اسپلنومگالی (Hepatosplenomegaly)', detailHint: 'سانتیمتر زیر لبه دنده...' }
    ]
  }
];

export const PE_UNLOCKABLE_MODULES = [
  {
    id: 'exam_dre',
    buttonLabel: '➕ افزودن معاینه رکتال و آنورکتال (Digital Rectal Exam - TR / DRE)',
    title: 'معاینه رکتال و آنورکتال (Digital Rectal Exam - TR / DRE)',
    items: [
      { id: 'pe_dre_normal', label: 'تون اسفنکتر نرمال، بدون توده، دستکش آغشته به مدفوع طبیعی', detailHint: '' },
      { id: 'pe_dre_melena_hematochezia', label: 'مشاهده ملنا یا خون روشن روی انگشت دستکش', detailHint: '' },
      { id: 'pe_dre_empty_or_impaction', label: 'آمپول رکتوم خالی یا ایمپکشن مدفوعی', detailHint: '' },
      { id: 'pe_dre_mass_fissure_hemorrhoid', label: 'لمس توده، فیشر، فیستول یا هموروئید', detailHint: 'فاصله از Anal verge، ساعت، تندرنس...' }
    ]
  },
  {
    id: 'exam_breast',
    buttonLabel: '➕ افزودن معاینه اختصاصی پستان و آگزیلا (Breast & Axillary Exam)',
    title: 'معاینه اختصاصی پستان و آگزیلا (Breast & Axillary Exam)',
    items: [
      { id: 'pe_breast_normal', label: 'معاینه پستان و آگزیلا دوطرفه طبیعی، بدون توده یا ترشح', detailHint: '' },
      { id: 'pe_breast_mass_palpable', label: 'توده قابل لمس در پستان', detailHint: 'سمت، ساعت، فاصله از آرئول، ابعاد cm، قوام، تحرک...' },
      { id: 'pe_axillary_lap', label: 'لنفادنوپاتی آگزیلاری قابل لمس', detailHint: 'سمت، تعداد، سایز، متحرک یا فیکس...' },
      { id: 'pe_nipple_retraction_skin', label: 'فرورفتگی نوک پستان، کشیدگی یا نمای پوست‌پرتقالی', detailHint: 'موضع...' }
    ]
  },
  {
    id: 'exam_thyroid',
    buttonLabel: '➕ افزودن معاینه اختصاصی تیروئید و لنفادنوپاتی گردن (Thyroid & Cervical Exam)',
    title: 'معاینه اختصاصی تیروئید و لنفادنوپاتی گردن (Thyroid & Cervical Exam)',
    items: [
      { id: 'pe_thyroid_normal', label: 'تیروئید بدون بزرگی، بدون ندول لمس‌پذیر و متحرک با بلع', detailHint: '' },
      { id: 'pe_thyroid_nodule_goiter', label: 'گواتر منتشر یا ندول قابل لمس تیروئید', detailHint: 'لوب راست/چپ/ایستموس، ابعاد به cm، قوام...' },
      { id: 'pe_cervical_lap_detailed', label: 'لنفادنوپاتی گردنی یا سوپراکلاویکولار (Cervical / Virchow LAP)', detailHint: 'سطح لول گردنی، سایز cm، متحرک یا فیکس...' }
    ]
  },
  {
    id: 'exam_hernia',
    buttonLabel: '➕ افزودن معاینه اختصاصی کانال اینگوئینال و فتق‌ها (Hernia & Groin Exam)',
    title: 'معاینه اختصاصی کانال اینگوئینال و فتق‌ها (Hernia & Groin Exam)',
    items: [
      { id: 'pe_groin_no_hernia', label: 'کانال‌های اینگوئینال دوطرفه بدون بالج یا فتق لمس‌پذیر', detailHint: '' },
      { id: 'pe_inguinal_hernia', label: 'فتق اینگوئینال (مستقیم یا غیرمستقیم)', detailHint: 'سمت راست یا چپ، قابل جااندازی (Reducible) یا گیرکرده...' },
      { id: 'pe_femoral_umbilical_hernia', label: 'فتق فمورال، نافی یا اپی‌گاستریک', detailHint: 'محل و سایز نقص فاشیا به cm...' },
      { id: 'pe_incisional_hernia', label: 'فتق انسزیونال در محل اسکار جراحی قبلی', detailHint: 'ابعاد نقص فاشیا به cm...' }
    ]
  },
  {
    id: 'exam_wound_drain',
    buttonLabel: '➕ افزودن بررسی محل درن، زخم و پورت‌های جراحی (Post-Op Wound & Drain Inspection)',
    title: 'بررسی محل درن، زخم و پورت‌های جراحی (Post-Op Wound & Drain Inspection)',
    items: [
      { id: 'pe_wound_clean_intact', label: 'خط بخیه تمیز، خشک و بدون ترشح یا اریتم', detailHint: '' },
      { id: 'pe_wound_infection_dehiscence', label: 'اریتم، گرمی، ترشح یا باز شدن (Dehiscence) لبه‌های بخیه', detailHint: 'وسعت اریتم، ماهیت ترشح...' },
      { id: 'pe_drain_functioning', label: 'درن جراحی فیکس، فعال و دارای کارکرد مناسب', detailHint: '' },
      { id: 'pe_drain_site_complication', label: 'نشت ترشح از اطراف درن، جابه‌جایی یا اریتم محل ورود درن', detailHint: 'توضیحات نشت یا انسداد...' }
    ]
  }
];

export const SURGICAL_SCHEMA = {
  admissionPathways: [
    { id: 'emergency_symptom', label: 'مراجعه با علامت حاد / اورژانس' },
    { id: 'clinic_referral', label: 'ارجاع از درمانگاه با نامه استاد / بستری الکتیو' },
    { id: 'postop_complication', label: 'مراجعه به دنبال عمل جراحی اخیر / عوارض پس از عمل' }
  ],

  painSpatialPatterns: [
    { id: 'localized', label: 'لوکالیزه (تک‌ناحیه‌ای یا چندناحیه‌ای)' },
    { id: 'generalized_predominant', label: 'ژنرالیزه با ارجحیت در ناحیه خاص' },
    { id: 'localized_to_generalized', label: 'شروع لوکالیزه و سپس ژنرالیزه شدن' },
    { id: 'migratory_shifting', label: 'تغییر محل / مهاجرت درد (Shifting Pain)' }
  ],

  abdominalRegions: [
    { id: 'ruq', label: 'RUQ (فوقانی راست)', code: 'RUQ', fa: 'فوقانی راست' },
    { id: 'epigastric', label: 'اپی‌گاستر (Epigastric)', code: 'Epigastric', fa: 'اپی‌گاستر' },
    { id: 'luq', label: 'LUQ (فوقانی چپ)', code: 'LUQ', fa: 'فوقانی چپ' },
    { id: 'right_flank', label: 'پهلوی راست (Right Flank)', code: 'R-Flank', fa: 'پهلوی راست' },
    { id: 'periumbilical', label: 'دور ناف (Periumbilical)', code: 'Umbilical', fa: 'دور ناف' },
    { id: 'left_flank', label: 'پهلوی چپ (Left Flank)', code: 'L-Flank', fa: 'پهلوی چپ' },
    { id: 'rlq', label: 'RLQ (تحتانی راست)', code: 'RLQ', fa: 'تحتانی راست' },
    { id: 'suprapubic', label: 'سوپراپوبیک (Suprapubic)', code: 'Suprapubic', fa: 'سوپراپوبیک' },
    { id: 'llq', label: 'LLQ (تحتانی چپ)', code: 'LLQ', fa: 'تحتانی چپ' }
  ],

  radiationSites: [
    { id: 'rad_none', label: 'بدون انتشار (No Radiation)' },
    { id: 'rad_scapula', label: 'کتف و شانه (Scapula / Shoulder)', detailHint: 'راست / چپ...' },
    { id: 'rad_back', label: 'پشت و کمر (Back / Lumbar)', detailHint: 'کمربندی / مهره‌ای...' },
    { id: 'rad_groin', label: 'کشاله ران (Inguinal / Groin)', detailHint: 'راست / چپ...' },
    { id: 'rad_flank', label: 'پهلو (Flank)', detailHint: 'راست / چپ...' },
    { id: 'rad_chest_neck_arm', label: 'قفسه سینه، گردن یا بازو (Chest / Neck / Arm)', detailHint: 'محل دقیق...' },
    { id: 'rad_genitalia_perineum', label: 'ناحیه تناسلی یا پرینه (Genitalia / Perineum)', detailHint: 'جزئیات...' }
  ],

  familyRelations: ['مادر', 'پدر', 'برادر', 'خواهر', 'درجه ۲'],

  allergyTemplates: [
    { id: 'allergy_penicillin', label: 'پنیسیلین و بتالاکتام‌ها', detailHint: 'نوع واکنش: کهیر، آنژیوادم، آنافیلاکسی...' },
    { id: 'allergy_cephalosporin', label: 'سفالوسپورین‌ها', detailHint: 'نوع واکنش...' },
    { id: 'allergy_contrast', label: 'ماده حاجب وریدی (IV Contrast) / ید', detailHint: 'سابقه پیش‌درمانی با هیدروکورتیزون...' },
    { id: 'allergy_latex', label: 'لاتکس (Latex)', detailHint: 'حساسیت تماسی یا تنفسی...' },
    { id: 'allergy_anesthesia', label: 'داروهای بیهوشی / شل‌کننده عضلانی', detailHint: 'هیپرترمی بدخیم یا آپنه طولانی...' },
    { id: 'allergy_nsaids', label: 'مسکن‌ها (NSAIDs / مورفین / کدئین)', detailHint: 'نوع واکنش...' },
    { id: 'allergy_food', label: 'مواد غذایی (کیوی/گوجه/مغزیجات)', detailHint: 'نوع واکنش...' }
  ],

  fhItems: [
    { id: 'fh_crc', label: 'کانسر کولورکتال در بستگان درجه یک', detailHint: 'نسبت فامیلی و سن بروز...' },
    { id: 'fh_gastric', label: 'کانسر معده یا مری', detailHint: 'نسبت و سن بروز...' },
    { id: 'fh_breast_ovarian', label: 'کانسر پستان یا تخمدان (BRCA)', detailHint: 'تعداد افراد مبتلا در خانواده...' },
    { id: 'fh_thyroid_men', label: 'کانسر مدولاری/پاپیلاری تیروئید یا سندروم MEN', detailHint: 'نوع بدخیمی...' },
    { id: 'fh_ihd_early', label: 'بیماری ایسکمیک قلبی زودرس (مرد <55، زن <65)', detailHint: 'نسبت...' },
    { id: 'fh_dm_htn', label: 'دیابت شیرین و پرفشاری خون خانوادگی', detailHint: 'نسبت فامیلی...' },
    { id: 'fh_coagulopathy', label: 'اختلالات ترومبوفیلی، DVT مکرر یا خونریزی ارثی', detailHint: 'سابقه آمبولی در خانواده...' }
  ],

  paraclinicModalities: [
    {
      id: 'ultrasound',
      label: 'سونوگرافی (US)',
      fullName: 'سونوگرافی شکم و لگن و سطحی (Ultrasound)',
      quickTags: [
        { id: 'us_gallstones', label: 'سنگ کیسه صفرا (Cholelithiasis)', detailHint: 'تعداد و حداکثر سایز به mm...' },
        { id: 'us_sludge', label: 'لجن صفراوی (Biliary Sludge)', detailHint: 'شواهد لجن...' },
        { id: 'us_gb_wall', label: 'افزایش ضخامت جدار کیسه صفرا', detailHint: 'ضخامت به mm (مثلاً 5mm) و مایع دور کیسه...' },
        { id: 'us_murphy', label: 'علامت مورفی سونوگرافیک مثبت', detailHint: '' },
        { id: 'us_cbd_dilated', label: 'دیلاتاسیون مجرای صفراوی مشترک (CBD)', detailHint: 'قطر CBD به mm و وجود سنگ داخل آن...' },
        { id: 'us_cbd_normal', label: 'قطر CBD و مجاری داخل کبدی طبیعی', detailHint: 'قطر CBD به mm...' },
        { id: 'us_appendix', label: 'لوپ بلایند و غیرقابل کمپرس آپاندیس', detailHint: 'قطر آپاندیس به mm، آپاندیکولیت، Fat stranding...' },
        { id: 'us_free_fluid', label: 'مایع آزاد در حفره شکم یا لگن', detailHint: 'حجم (Mild/Mod/Severe) و محل (موریسون/کلدوساک)...' },
        { id: 'us_hernia_defect', label: 'نقص فاشیا و فتق در سونوگرافی سطحی', detailHint: 'سایز دهانه فتق به mm و محتویات (امنتوم/لوپ روده)...' },
        { id: 'us_thyroid_nodule', label: 'ندول تیروئید', detailHint: 'لوب، ابعاد به mm و کلاس TI-RADS...' },
        { id: 'us_breast_mass', label: 'ضایعه پستان یا آگزیلا', detailHint: 'سمت، ساعت، ابعاد و کلاس BI-RADS...' }
      ]
    },
    {
      id: 'ct_scan',
      label: 'سی‌تی اسکن (CT)',
      fullName: 'سی‌تی اسکن شکم و لگن با/بدون کنتراست (CT Scan)',
      quickTags: [
        { id: 'ct_fat_stranding', label: 'التهاب و Fat Stranding موضعی', detailHint: 'اطراف آپاندیس / پانکراس / کیسه صفرا / دیورتیکول...' },
        { id: 'ct_pneumoperitoneum', label: 'هوای آزاد داخل پریتوئن (Pneumoperitoneum)', detailHint: 'محل و حجم هوا...' },
        { id: 'ct_bowel_obstruction', label: 'دیلاتاسیون لوپ‌های روده و سطح مایع-هوا', detailHint: 'روده باریک یا کولون، محل Transition point...' },
        { id: 'ct_wall_thickening_mass', label: 'ضخامت نامنظم جدار یا توده فضاگیر گوارشی', detailHint: 'محل آناتومیک و ابعاد...' },
        { id: 'ct_abscess_collection', label: 'کلکسیون، آبسه یا مایع آزاد', detailHint: 'محل و ابعاد به mm...' },
        { id: 'ct_lymphadenopathy_mets', label: 'لنفادنوپاتی یا ضایعات متاستاتیک کبد/ریه', detailHint: 'تعداد و محل...' }
      ]
    },
    {
      id: 'mri_mrcp',
      label: 'ام‌آر‌آی (MRI / MRCP)',
      fullName: 'ام‌آر‌آی و کولانژیوپانکراتوگرافی مغناطیسی (MRI / MRCP)',
      quickTags: [
        { id: 'mri_choledocholithiasis_stricture', label: 'سنگ یا انسداد در مجاری صفراوی (Choledocholithiasis / Stricture in MRCP)', detailHint: 'محل سنگ یا تنگی در CBD/CHD...' },
        { id: 'mri_abd_wall_endometrioma', label: 'توده یا ضایعه جدار شکم / اندومتریوما (Abdominal Wall Mass / Endometrioma)', detailHint: 'ابعاد و لایه‌های عضلانی درگیر...' },
        { id: 'mri_pelvic_adnexal', label: 'پاتولوژی رحم، تخمدان یا مایع آزاد لگنی (Pelvic / Adnexal Findings)', detailHint: 'توده تخمدان، کیست شکلاتی یا فیبروم...' },
        { id: 'mri_perianal_fistula', label: 'فیستول پری‌آنال یا آبسه لگنی (Perianal Fistula Track)', detailHint: 'کلاس پارک، اسفنکتر درگیر...' },
        { id: 'mri_liver_pancreas_mets', label: 'ضایعه کبدی، پانکراس یا متاستاز', detailHint: 'تعداد، سگمان کبد یا محل در پانکراس...' }
      ]
    },
    {
      id: 'xray_cxr_axr',
      label: 'گرافی (CXR / AXR)',
      fullName: 'گرافی ساده قفسه سینه و شکم (CXR / AXR)',
      quickTags: [
        { id: 'xr_free_air', label: 'هوای آزاد زیر دیافراگم در CXR ایستاده', detailHint: 'یکطرفه یا دوطرفه...' },
        { id: 'xr_air_fluid_levels', label: 'سطوح متعدد مایع-هوا (Air-Fluid Levels) در AXR ایستاده', detailHint: 'تعداد سطوح...' },
        { id: 'xr_dilated_loops', label: 'دیلاتاسیون لوپ‌های روده در AXR خوابیده', detailHint: 'مرکزی یا محیطی...' },
        { id: 'xr_rectal_gas', label: 'وضعیت گاز در آمپول رکتوم', detailHint: 'موجود است / فاقد گاز...' },
        { id: 'xr_cxr_normal', label: 'CXR: فیلدهای ریوی پاک، زاویه دنده‌ای-فرنیک باز، سایه قلبی طبیعی', detailHint: '' }
      ]
    },
    {
      id: 'endoscopy',
      label: 'آندوسکوپی (EGD)',
      fullName: 'آندوسکوپی فوقانی دستگاه گوارش (EGD)',
      quickTags: [
        { id: 'egd_ulcer', label: 'اولسر پپتیک معده یا دئودنوم', detailHint: 'محل زخم، سایز و کلاس Forrest...' },
        { id: 'egd_mass_stricture', label: 'ضایعه توده‌ای، اولسراتیو یا تنگی مری/معده', detailHint: 'فاصله از دندان‌های پیشین و درصد انسداد...' },
        { id: 'egd_varices_gastritis', label: 'واریس مری/فوندوس یا گاستریت اروزویو', detailHint: 'گرید واریس و شواهد خونریزی فعال...' }
      ]
    },
    {
      id: 'colonoscopy',
      label: 'کولونوسکوپی',
      fullName: 'کولونوسکوپی و سیگموئیدوسکوپی (Colonoscopy)',
      quickTags: [
        { id: 'col_mass', label: 'توده شکننده یا انسدادی در رکتوم/کولون', detailHint: 'فاصله از Anal verge (به cm) و وضعیت عبور اسکوپ...' },
        { id: 'col_polyps', label: 'پولیپ‌های کولورکتال', detailHint: 'تعداد، محل و سایز...' },
        { id: 'col_diverticulosis_ibd', label: 'دیورتیکولوز، کولیت یا هموروئید داخلی', detailHint: 'محل و شدت...' }
      ]
    },
    {
      id: 'laryngoscopy',
      label: 'لارنگوسکوپی',
      fullName: 'لارنگوسکوپی غیرمستقیم طناب‌های صوتی (Laryngoscopy)',
      quickTags: [
        { id: 'lar_normal_tvc', label: 'حرکت طناب‌های صوتی حقیقی (TVC) دوطرفه طبیعی و قرینه', detailHint: '' },
        { id: 'lar_vocal_cord_palsy', label: 'فلج یا کاهش حرکت طناب صوتی', detailHint: 'سمت راست یا چپ، وضعیت راه هوایی...' }
      ]
    },
    {
      id: 'pathology_fna',
      label: 'پاتولوژی / FNA',
      fullName: 'پاتولوژی، بیوپسی و آسپیراسیون سوزن باریک (Pathology / FNA)',
      quickTags: [
        { id: 'path_adenocarcinoma', label: 'آدنوکارسینوم (Adenocarcinoma)', detailHint: 'گرید تمایز (Well/Mod/Poorly differentiated)...' },
        { id: 'path_thyroid_bethesda', label: 'نتیجه FNA تیروئید (Bethesda System)', detailHint: 'کلاس Bethesda (I تا VI) و نوع سلول (مثلاً PTC)...' },
        { id: 'path_breast_core', label: 'نتیجه Core Needle Biopsy پستان', detailHint: 'نوع تومور (IDC/ILC) و وضعیت ER/PR/HER2/Ki67...' },
        { id: 'path_benign', label: 'پاتولوژی خوش‌خیم / التهابی', detailHint: 'تشخیص دقیق گزارش پاتولوژی...' }
      ]
    }
  ]
};

export const LAB_PANELS = [
  {
    id: 'cbc_diff',
    title: 'هماتولوژی روتین (CBC / Diff)',
    badge: 'CBC / Diff',
    tests: [
      { id: 'wbc', label: 'WBC', unit: '×10³/µL', min: 4.0, max: 11.0 },
      { id: 'rbc', label: 'RBC', unit: '×10⁶/µL', min: 4.2, max: 5.9 },
      { id: 'hb', label: 'Hb', unit: 'g/dL', min: 12.0, max: 17.5 },
      { id: 'hct', label: 'Hct', unit: '%', min: 36.0, max: 52.0 },
      { id: 'mcv', label: 'MCV', unit: 'fL', min: 80, max: 100 },
      { id: 'plt', label: 'Plt', unit: '×10³/µL', min: 150, max: 450 },
      { id: 'neut', label: 'Neutrophils', unit: '%', min: 40, max: 75 },
      { id: 'lymph', label: 'Lymphocytes', unit: '%', min: 20, max: 45 }
    ]
  },
  {
    id: 'coag_inflam',
    title: 'انعقادی و نشانگرهای التهابی',
    badge: 'Coag / Inflam',
    tests: [
      { id: 'pt', label: 'PT', unit: 'sec', min: 11.0, max: 13.5 },
      { id: 'ptt', label: 'PTT', unit: 'sec', min: 25, max: 35 },
      { id: 'inr', label: 'INR', unit: '', min: 0.8, max: 1.2 },
      { id: 'esr', label: 'ESR', unit: 'mm/hr', min: 0, max: 20 },
      { id: 'crp', label: 'CRP', unit: 'mg/L', min: 0, max: 6 },
      { id: 'ddimer', label: 'D-Dimer', unit: 'ng/mL', min: 0, max: 500 }
    ]
  },
  {
    id: 'biochem_renal',
    title: 'بیوشیمی، کلیوی و الکترولیت‌ها',
    badge: 'Biochem / Lytes',
    tests: [
      { id: 'bs', label: 'BS', unit: 'mg/dL', min: 70, max: 140 },
      { id: 'bun', label: 'BUN', unit: 'mg/dL', min: 7, max: 20 },
      { id: 'cr', label: 'Cr', unit: 'mg/dL', min: 0.6, max: 1.3 },
      { id: 'na', label: 'Na', unit: 'mEq/L', min: 135, max: 145 },
      { id: 'k', label: 'K', unit: 'mEq/L', min: 3.5, max: 5.1 },
      { id: 'ca', label: 'Ca', unit: 'mg/dL', min: 8.5, max: 10.5 },
      { id: 'mg', label: 'Mg', unit: 'mg/dL', min: 1.7, max: 2.2 },
      { id: 'albumin', label: 'Albumin', unit: 'g/dL', min: 3.5, max: 5.2 }
    ]
  },
  {
    id: 'hepato_biliary',
    title: 'کبدی، صفراوی و آنزیم‌های پانکراس',
    badge: 'LFT / Pancreas',
    tests: [
      { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', min: 5, max: 40 },
      { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', min: 5, max: 40 },
      { id: 'alp', label: 'ALP', unit: 'U/L', min: 40, max: 130 },
      { id: 'bili_t', label: 'Bilirubin Total', unit: 'mg/dL', min: 0.1, max: 1.2 },
      { id: 'bili_d', label: 'Bilirubin Direct', unit: 'mg/dL', min: 0.0, max: 0.3 },
      { id: 'amylase', label: 'Amylase', unit: 'U/L', min: 30, max: 110 },
      { id: 'lipase', label: 'Lipase', unit: 'U/L', min: 10, max: 140 }
    ]
  },
  {
    id: 'blood_gases',
    title: 'گازهای خونی (VBG / ABG)',
    badge: 'VBG / ABG',
    tests: [
      { id: 'ph', label: 'pH', unit: '', min: 7.35, max: 7.45 },
      { id: 'pco2', label: 'PCO2', unit: 'mmHg', min: 35, max: 45 },
      { id: 'hco3', label: 'HCO3', unit: 'mEq/L', min: 22, max: 26 },
      { id: 'be', label: 'Base Excess (BE)', unit: 'mEq/L', min: -2, max: 2 },
      { id: 'po2', label: 'PO2', unit: 'mmHg', min: 40, max: 100 },
      { id: 'lactate', label: 'Lactate', unit: 'mmol/L', min: 0.5, max: 2.2 }
    ]
  },
  {
    id: 'endocrine_tumor',
    title: 'هورمونی و تومورمارکرها',
    badge: 'Tumor / Endo',
    tests: [
      { id: 'tsh', label: 'TSH', unit: 'mIU/L', min: 0.4, max: 4.5 },
      { id: 'bhcg', label: 'β-hCG', unit: 'mIU/mL', min: 0, max: 5 },
      { id: 'cea', label: 'CEA', unit: 'ng/mL', min: 0, max: 5.0 },
      { id: 'ca19_9', label: 'CA 19-9', unit: 'U/mL', min: 0, max: 37 }
    ]
  }
];
