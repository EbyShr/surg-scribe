/**
 * Clinical Schema & Medical Taxonomy - Surg-Scribe v0.6-Universal-Surg
 * Complete surgical ontology for General Surgery inpatient admissions.
 * Features:
 * - 5 Clinical Presentation Archetypes (Pain, Mass/Lesion, Trauma/Burns, Functional/Bleeding, Elective)
 * - Multi-region body pain selector (Abdomen, Chest, Head/Neck, Extremities/Spine)
 * - Live Quick Search & Tag Filter across all categorical pillars
 * - Local Mass & Lesion Examination Module
 * - ATLS Primary & Secondary Survey Trauma & Burn Module
 * - eFAST Ultrasound Modality in Paraclinics
 * - One-click Normal PE Baseline Buttons
 * - 7 Tree Gatekeepers for PMH with core routine negatives
 * - Categorized Drug History (DH) with 3-box inline inputs (Dose, Sig, Note)
 * - Bilingual ROS with intelligent gender filtering (ROS_GROUPS_BILINGUAL)
 * - 4 Abdominal Exam Pillars + 5 Unlockable Specialized Exam Modules
 * - Compact Paraclinic Modality Launcher with multi-instance imaging & MRI/MRCP
 */

export const CLINICAL_PRESENTATION_ARCHETYPES = [
  {
    id: 'pain_archetype',
    labelFa: 'درد یا ناراحتی (شکم، قفسه سینه، سر و گردن، کمر و اندام)',
    labelEn: 'Pain or Discomfort (Abdominal, Thoracic, HEENT, Extremities)',
    icon: '⚡',
    badge: 'OLDCARTS'
  },
  {
    id: 'mass_lesion_archetype',
    labelFa: 'توده، کیست، تورم یا ضایعه (پستان، پوست سر، فک، تیروئید، فتق)',
    labelEn: 'Mass, Cyst, Swelling or Lesion (Breast, Scalp, Mandible, Thyroid, Hernia)',
    icon: '🔘',
    badge: 'Mass & Lesion'
  },
  {
    id: 'trauma_burn_archetype',
    labelFa: 'تروما، جراحت نافذ (چاقو/گلوله)، تصادف و سوختگی',
    labelEn: 'Trauma, Penetrating Wound (Stab/GSW), MVA & Burns',
    icon: '🚨',
    badge: 'ATLS Trauma'
  },
  {
    id: 'functional_bleeding_archetype',
    labelFa: 'شکایات عملکردی، خونریزی گوارشی، زردی یا تنگی نفس',
    labelEn: 'Functional, Dyspnea, GI Bleed, Painless Jaundice, Obstipation',
    icon: '🩸',
    badge: 'Functional & Bleeding'
  },
  {
    id: 'elective_asymptomatic_archetype',
    labelFa: 'بستری الکتیو بی‌علامت / جراحی برنامه‌ریزی‌شده',
    labelEn: 'Elective / Asymptomatic Referral for Planned Surgery',
    icon: '📋',
    badge: 'Elective Admission'
  }
];

export const PAIN_BODY_REGIONS = [
  {
    id: 'abdomen_pelvis',
    labelFa: 'شکم و لگن (Abdomen & Pelvis)',
    labelEn: 'Abdomen & Pelvis',
    subregions: [
      { id: 'ruq', label: 'RUQ (فوقانی راست)', code: 'RUQ', fa: 'فوقانی راست' },
      { id: 'epigastric', label: 'اپی‌گاستر (Epigastric)', code: 'Epigastric', fa: 'اپی‌گاستر' },
      { id: 'luq', label: 'LUQ (فوقانی چپ)', code: 'LUQ', fa: 'فوقانی چپ' },
      { id: 'right_flank', label: 'پهلوی راست (Right Flank)', code: 'R-Flank', fa: 'پهلوی راست' },
      { id: 'periumbilical', label: 'دور ناف (Periumbilical)', code: 'Umbilical', fa: 'دور ناف' },
      { id: 'left_flank', label: 'پهلوی چپ (Left Flank)', code: 'L-Flank', fa: 'پهلوی چپ' },
      { id: 'rlq', label: 'RLQ (تحتانی راست)', code: 'RLQ', fa: 'تحتانی راست' },
      { id: 'suprapubic', label: 'سوپراپوبیک (Suprapubic)', code: 'Suprapubic', fa: 'سوپراپوبیک' },
      { id: 'llq', label: 'LLQ (تحتانی چپ)', code: 'LLQ', fa: 'تحتانی چپ' }
    ]
  },
  {
    id: 'chest_precordial',
    labelFa: 'قفسه سینه و قلبی-تنفسی (Chest / Precordial)',
    labelEn: 'Chest & Precordial',
    subregions: [
      { id: 'retrosternal', label: 'رتروواسترنال (Retro-sternal)', code: 'Retro-sternal', fa: 'رتروواسترنال' },
      { id: 'precordial_left', label: 'پریکوردیال / سمت چپ قفسه سینه', code: 'Precordial / Left Chest', fa: 'پریکوردیال و چپ قفسه سینه' },
      { id: 'right_chest', label: 'سمت راست قفسه سینه', code: 'Right Chest', fa: 'سمت راست قفسه سینه' },
      { id: 'pleuritic_chest_wall', label: 'پلورتیک / جدار قفسه سینه (Chest Wall)', code: 'Chest Wall', fa: 'جدار قفسه سینه' }
    ]
  },
  {
    id: 'head_maxillofacial_neck',
    labelFa: 'سر، صورت و گردن (Head, Maxillofacial & Neck)',
    labelEn: 'Head, Maxillofacial & Neck',
    subregions: [
      { id: 'frontal_temporal_occipital', label: 'فرونتال / تمپورال / اکسیپیتال (Scalp/Cranial)', code: 'Scalp/Cranial', fa: 'پوست سر و جمجمه' },
      { id: 'jaw_mandible_maxilla', label: 'فک، مندیبل یا ماگزیلا (Jaw / Mandible / Maxilla)', code: 'Mandible/Maxilla', fa: 'فک و مندیبل' },
      { id: 'anterior_lateral_neck', label: 'قدام یا طرفین گردن (Anterior / Lateral Neck)', code: 'Neck', fa: 'قدام یا طرفین گردن' }
    ]
  },
  {
    id: 'back_extremities_perineum',
    labelFa: 'کمر، ستون فقرات، اندام‌ها یا پرینه (Back, Extremities & Perineum)',
    labelEn: 'Back, Extremities & Perineum',
    subregions: [
      { id: 'upper_extremity', label: 'اندام فوقانی (Upper Extremity)', code: 'Upper Extremity', fa: 'اندام فوقانی' },
      { id: 'lower_extremity', label: 'اندام تحتانی (Lower Extremity)', code: 'Lower Extremity', fa: 'اندام تحتانی' },
      { id: 'thoracolumbar_back', label: 'کمر و ستون فقرات توراکولومبار (Back / Spine)', code: 'Spine / Back', fa: 'کمر و ستون فقرات' },
      { id: 'perineum_gluteal', label: 'پرینه و ناحیه گلوتئال (Perineum / Gluteal)', code: 'Perineum', fa: 'پرینه و گلوتئال' }
    ]
  }
];

export const MASS_GROWTH_PATTERNS = [
  'ثابت و بدون تغییر سایز (Stable)',
  'رشد تدریجی و آهسته (Slowly Progressive)',
  'رشد سریع اخیر (Rapid Enlargement)',
  'نوسانی / تغییر سایز با زور زدن یا ایستادن (Fluctuant / Reducible)'
];

export const MASS_PAIN_STATUSES = [
  'کاملاً بدون درد (Painless)',
  'حساسیت خفیف در لمس یا فشار',
  'دردناک شدن اخیر'
];

export const MASS_ASSOCIATED_SIGNS = [
  { id: 'mass_erythema', label: 'قرمزی، گرمی یا التهاب پوست رویی (Erythema / Inflammation)' },
  { id: 'mass_discharge', label: 'ترشح چرکی، سباسه یا خونی از ضایعه (Discharge)' },
  { id: 'mass_ulceration', label: 'زخم شدن یا کشیدگی پوست (Ulceration / Skin Dimpling)' },
  { id: 'mass_compressive', label: 'علائم فشاری موضعی (دیسفاژی، دیسپنه، خشونت صدا، تریسموس یا بی‌حسی)' },
  { id: 'mass_recurrence', label: 'سابقه توده مشابه در سایر نقاط یا عود پس از جراحی قبلی' }
];

export const TRAUMA_MOI_OPTIONS = [
  'ترومای نافذ - چاقو / جسم تیز (Stab Wound / Sharp Penetrating)',
  'ترومای نافذ - گلوله / ساچمه (Gunshot / Shotgun Wound - GSW)',
  'ترومای بلانت - تصادف خودرو/موتورسیکلت/عابر (MVA / MCA / Pedestrian)',
  'ترومای بلانت - سقوط از ارتفاع (Fall from Height)',
  'ترومای بلانت - نزاع و ضرب‌وشتم (Assault)',
  'سوختگی حرارتی (شعله / مایعات داغ Scald / انفجار)',
  'سوختگی شیمیایی (Chemical Burn)',
  'سوختگی الکتریکی (Electrical Burn)'
];

export const TRAUMA_TRANSPORT_OPTIONS = [
  'آمبولانس اورژانس (EMS 115)',
  'خودروی شخصی / همراهان',
  'ارجاع با بالگرد امداد (Air Ambulance)',
  'مراجعه با پای خود (Walk-in)'
];

export const TRAUMA_INJURED_ZONES = [
  'سر و صورت (Head & Face)',
  'گردن (Zone I/II/III Neck)',
  'قفسه سینه (Thorax)',
  'شکم و پهلو (Abdomen & Flank)',
  'لگن و پرینه (Pelvis & Perineum)',
  'اندام فوقانی (Upper Extremity)',
  'اندام تحتانی (Lower Extremity)',
  'پشت و ستون مهره‌ها (Back & Spine)'
];

export const TRAUMA_CHECKLIST = [
  { id: 'trauma_loc_amnesia', label: 'کاهش سطح هوشیاری در صحنه یا فراموشی حول حادثه (LOC / Post-traumatic Amnesia)' },
  { id: 'trauma_active_bleeding', label: 'خونریزی فعال یا جهنده (Active / Pulsatile Bleeding) در صحنه' },
  { id: 'trauma_acute_dyspnea_cp', label: 'تنگی نفس حاد یا درد قفسه سینه پس از تروما' },
  { id: 'trauma_hematuria_gi_bleed', label: 'هماتوری یا خونریزی گوارشی پس از تروما' },
  { id: 'trauma_neurovascular_deficit', label: 'اختلال حس یا حرکت در اندام آسیب‌دیده' },
  { id: 'trauma_smoke_inhalation', label: 'در سوختگی: مواجهه در فضای بسته / استنشاق دود (Enclosed Space / Smoke Inhalation)' },
  { id: 'trauma_tetanus_prior_mgmt', label: 'دریافت واکسن و ایمونوگلوبولین کزاز (Tetanus Prophylaxis) یا اقدامات اولیه در مرکز دیگر' }
];

export const FUNCTIONAL_SYMPTOM_OPTIONS = [
  'تنگی نفس حاد یا پیشرونده (Dyspnea)',
  'خونریزی گوارشی فوقانی (هماتمز / ملنا)',
  'خونریزی گوارشی تحتانی (هماتوشزی / رکتوراژی)',
  'زردی بدون درد (Painless Jaundice)',
  'استفراغ مکرر و عدم تحمل خوراکی (Intractable Vomiting)',
  'عدم دفع گاز و مدفوع / انسداد روده (Obstipation / Bowel Obstruction)',
  'احتباس حاد ادراری (Acute Urinary Retention)'
];

export const FUNCTIONAL_ONSET_OPTIONS = [
  'ناگهانی (Sudden)',
  'تدریجی (Gradual)',
  'حمله‌ای و عودکننده (Paroxysmal)'
];

export const ELECTIVE_DISCOVERY_OPTIONS = [
  'چکاپ روتین و غربالگری سلامت (Routine Check-up / Screening)',
  'تصویربرداری یا سونوگرافی تصادفی (Incidentaloma)',
  'پیگیری پاتولوژی یا عمل جراحی قبلی (Follow-up / Surveillance)',
  'نامه ارجاع از درمانگاه جراحی جهت عمل الکتیو (Elective Referral Letter)'
];

export const MASS_EXAM_SCHEMA = {
  consistencies: [
    'نرم و خمیری (Soft / Doughy)',
    'کیستیک مواج (Fluctuant / Cystic)',
    'لاستیکی (Rubbery)',
    'سفت (Firm / Hard)',
    'استخوانی (Bony / Calcified)'
  ],
  margins: [
    'منظم و کاملاً مشخص (Well-defined / Circumscribed)',
    'نامنظم و نفوذی (Ill-defined / Infiltrative)'
  ],
  mobilities: [
    'کاملاً متحرک در هر دو جهت (Freely Mobile)',
    'چسبیده به پوست رویی (Adherent to overlying skin / Punctum)',
    'فیکس به بافت، فاشیا، عضله یا استخوان عمقی (Fixed to deep structures)'
  ],
  skinFindings: [
    'پوست نرمال و بدون تندرنس (Non-tender / Normal skin)',
    'تندر و گرم با اریتم پوست (Tender, Warm, Erythematous)',
    'دارای منفذ مرکزی کیست اپیدرموئید (Central Punctum)',
    'زخم یا کشیدگی پوست رویی (Ulceration / Skin Tethering)'
  ]
};

export const ATLS_EXAM_SCHEMA = {
  primarySurvey: {
    airway: [
      { id: 'airway_patent', label: 'راه هوایی باز، تمیز و برقرار (Patent Airway)' },
      { id: 'airway_c_collar', label: 'کلار گردنی سفت بسته شده (C-Spine Collar Immobilized)' },
      { id: 'airway_stridor_foreign', label: 'استریدور، صدای خشن یا جسم خارجی در راه هوایی' },
      { id: 'airway_intubated', label: 'بیمار اینتوبه و تحت تهویه مکانیکی (ETT In Situ)' }
    ],
    breathing: [
      { id: 'breathing_symmetric', label: 'تنفس خودبه‌خودی، دوطرفه قرینه و شفاف (Symmetric BS)' },
      { id: 'breathing_dec_left', label: 'کاهش صداهای تنفسی در همیتوراکس چپ (Decreased BS Left)' },
      { id: 'breathing_dec_right', label: 'کاهش صداهای تنفسی در همیتوراکس راست (Decreased BS Right)' },
      { id: 'breathing_subq_emphysema', label: 'آمفیزم زیرجلدی در جدار قفسه سینه / گردن' },
      { id: 'breathing_tracheal_dev', label: 'انحراف تراشه به سمت مقابل (Tracheal Deviation)' }
    ],
    circulation: [
      { id: 'circ_stable', label: 'همودینامیک پایدار، CRT < 2s و نبض‌های محیطی پر' },
      { id: 'circ_shock', label: 'علائم شوک و بی‌ثباتی همودینامیک (تاکی‌کاردی، افت فشار خون)' },
      { id: 'circ_active_bleed', label: 'خونریزی فعال خارجی با فوران عروقی' },
      { id: 'circ_pelvic_instability', label: 'بی‌ثباتی استخوانی در معاینه حلقه لگن (Pelvic Springing)' }
    ],
    disability: [
      { id: 'dis_pyrrela', label: 'مردمک‌ها قرینه و راکتیو به نور (PERRLA)' },
      { id: 'dis_anisocoria', label: 'مردمک‌های نامتقارن یا فیکس (Anisocoria / Blown Pupil)' },
      { id: 'dis_focal_deficit', label: 'نقص فوکال عصبی یا پلژی اندام‌ها' }
    ]
  },
  woundTypes: [
    'ورودی چاقو / جسم تیز (Stab Wound)',
    'ورودی گلوله (Bullet Entry Wound)',
    'خروجی گلوله (Bullet Exit Wound)',
    'لاسراسیون و بریدگی وسیع (Laceration)',
    'دفورمیتی و شکستگی باز (Open Fracture / Deformity)',
    'دفورمیتی و شکستگی بسته (Closed Deformity / Fracture)'
  ],
  bleedingStatuses: [
    'خونریزی فعال و جهنده (Active / Pulsatile Bleeding)',
    'کنترل‌شده با پانسمان فشاری (Controlled by Pressure)',
    'هماتوم در حال گسترش (Expanding Hematoma)',
    'بدون خونریزی فعال (No Active Bleeding / Clotted)'
  ],
  distalNeurovascularStatuses: [
    'نبض دیستال لمس، حس و حرکت کاملاً سالم (Intact Distal Neurovascular)',
    'نبض دیستال لمس نمی‌شود (Absent Distal Pulses)',
    'اختلال حسی یا پارستزی در دیستال زخم (Sensory Deficit)',
    'اختلال حرکتی دیستال اندام (Motor Deficit)'
  ],
  burnDegrees: [
    'درجه ۱ (Erythema / سطحی)',
    'درجه ۲ سطحی (Superficial Partial-thickness / تاول‌دار)',
    'درجه ۲ عمقی (Deep Partial-thickness)',
    'درجه ۳ تمام ضخامت (Full-thickness / چرمی و بدون درد)',
    'درجه ۴ (درگیری استخوان و عضله عمقی)'
  ],
  burnInhalationSigns: [
    { id: 'burn_inh_facial', label: 'سوختگی موهای بینی، صورت و ابرو (Facial / Nasal Singeing)' },
    { id: 'burn_inh_soot', label: 'رسوب دوده در دهان، حلق یا خلط سیاه (Soot in Oropharynx)' },
    { id: 'burn_inh_hoarseness', label: 'خشونت صدا یا استریدور حنجره (Hoarseness / Stridor)' },
    { id: 'burn_inh_wheezing', label: 'ویزینگ و دیسترس تنفسی حاد (Wheezing / Respiratory Distress)' }
  ]
};

export const PE_NORMAL_BASELINES = {
  pe_general_heent_cp: {
    pos: ['pe_conscious_oriented', 'pe_clear_lungs', 'pe_normal_heart_sounds'],
    neg: ['pe_ill_toxic', 'pe_pale_conjunctiva', 'pe_icteric_sclera', 'pe_abnormal_lung_sounds', 'pe_heart_murmur_arrhythmia']
  },
  pe_abd_inspection: {
    pos: ['pe_abd_flat_symmetrical'],
    neg: ['pe_abd_distension', 'pe_abd_surgical_scar', 'pe_abd_ecchymosis', 'pe_abd_visible_bulge']
  },
  pe_abd_auscultation: {
    pos: ['pe_normoactive_bs'],
    neg: ['pe_hyperactive_metallic_bs', 'pe_hypoactive_absent_bs', 'pe_abdominal_bruit']
  },
  pe_abd_percussion: {
    pos: ['pe_normal_tympanism'],
    neg: ['pe_shifting_dullness', 'pe_hyperresonance', 'pe_cva_tenderness']
  },
  pe_abd_palpation: {
    pos: ['pe_soft_nontender'],
    neg: ['pe_tenderness', 'pe_rebound_tenderness', 'pe_guarding_rigidity', 'pe_murphy_sign', 'pe_mcburney_rovsing', 'pe_psoas_obturator', 'pe_palpable_mass', 'pe_hepatosplenomegaly']
  }
};

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


export const MASTER_SYMPTOMS_BANK = [
  // ۱. علائم عمومی و سیستمیک (Constitutional)
  { id: 'sym_fever', label: 'تب (Fever / Pyrexia)', category: 'عمومی (Constitutional)', keywords: 'داغی بدن حرارت' },
  { id: 'sym_chills', label: 'لرز و لرز تکانی (Chills / Rigors)', category: 'عمومی (Constitutional)', keywords: 'سرما لرزش' },
  { id: 'sym_night_sweats', label: 'تعریق شبانه (Night Sweats / Diaphoresis)', category: 'عمومی (Constitutional)', keywords: 'عرق سرد خیس شدن' },
  { id: 'sym_weight_loss', label: 'کاهش وزن ناخواسته (Unintentional Weight Loss)', category: 'عمومی (Constitutional)', keywords: 'لاغری کاشکسی' },
  { id: 'sym_weight_gain', label: 'افزایش وزن اخیر (Weight Gain)', category: 'عمومی (Constitutional)', keywords: 'چاقی ورم' },
  { id: 'sym_anorexia', label: 'بیاشتهایی و کاهش اشتها (Anorexia / Loss of Appetite)', category: 'عمومی (Constitutional)', keywords: 'غذا نخوردن میل' },
  { id: 'sym_fatigue', label: 'ضعف، بیحالی و خستگی مفرط (Fatigue / Malaise / Lethargy)', category: 'عمومی (Constitutional)', keywords: 'سستی کرختی' },
  { id: 'sym_insomnia', label: 'بیخوابی یا اختلال خواب (Insomnia / Sleep Disturbance)', category: 'عمومی (Constitutional)', keywords: 'بیداری شبانه' },

  // ۲. گوارش فوقانی و تحتانی (Gastrointestinal)
  { id: 'sym_nausea', label: 'تهوع (Nausea)', category: 'گوارش (GI)', keywords: 'حالت بهم خوردگی دل آشوب' },
  { id: 'sym_vomiting', label: 'استفراغ (Vomiting / Emesis)', category: 'گوارش (GI)', keywords: 'بالا آوردن استفراغ غذایی' },
  { id: 'sym_bilious_vomiting', label: 'استفراغ صفراوی سبز/زرد (Bilious Vomiting)', category: 'گوارش (GI)', keywords: 'تلخ زردآب' },
  { id: 'sym_fecaloid_vomiting', label: 'استفراغ فکالوئید بدبو (Feculent Vomiting)', category: 'گوارش (GI)', keywords: 'انسداد روده' },
  { id: 'sym_hematemesis', label: 'هماتمز / استفراغ خونی یا قهوهای (Hematemesis / Coffee-ground Emesis)', category: 'گوارش (GI)', keywords: 'خون بالا آوردن' },
  { id: 'sym_dysphagia_solids', label: 'دیسفاژی به جامدات (Dysphagia to Solids)', category: 'گوارش (GI)', keywords: 'گیر کردن لقمه بلع' },
  { id: 'sym_dysphagia_liquids', label: 'دیسفاژی به مایعات (Dysphagia to Liquids)', category: 'گوارش (GI)', keywords: 'مشکل قورت دادن آب' },
  { id: 'sym_odynophagia', label: 'ادینوفاژی / بلع دردناک (Odynophagia)', category: 'گوارش (GI)', keywords: 'درد قورت دادن' },
  { id: 'sym_globus', label: 'احساس توده در گلو (Globus Pharyngeus)', category: 'گوارش (GI)', keywords: 'بغض گیر کردن گلو' },
  { id: 'sym_heartburn', label: 'سوزش سردل و ریفلاکس اسید (Pyrosis / Heartburn / Regurgitation)', category: 'گوارش (GI)', keywords: 'ترش کردن اسید معده' },
  { id: 'sym_early_satiety', label: 'سیری زودرس (Early Satiety)', category: 'گوارش (GI)', keywords: 'پر شدن سریع معده' },
  { id: 'sym_dyspepsia_bloating', label: 'سوءهاضمه، نفخ و سنگینی سر دل (Dyspepsia / Bloating / Fullness)', category: 'گوارش (GI)', keywords: 'باد شکم گاز' },
  { id: 'sym_hiccups', label: 'سکسکه مداوم (Intractable Hiccups / Singultus)', category: 'گوارش (GI)', keywords: 'تحریک دیافراگم' },
  { id: 'sym_constipation', label: 'یبوست (Constipation)', category: 'گوارش (GI)', keywords: 'سفتی مدفوع کار نکردن شکم' },
  { id: 'sym_obstipation', label: 'عدم دفع گاز و مدفوع (Obstipation)', category: 'گوارش (GI)', keywords: 'انسداد کامل بسته شدن شکم' },
  { id: 'sym_inability_flatus', label: 'عدم دفع گاز (Inability to Pass Flatus)', category: 'گوارش (GI)', keywords: 'باد شکم' },
  { id: 'sym_diarrhea_watery', label: 'اسهال آبکی (Watery Diarrhea)', category: 'گوارش (GI)', keywords: 'شل بودن شکم' },
  { id: 'sym_dysentery', label: 'اسهال خونی و موکوسی (Bloody/Mucoid Diarrhea / Dysentery)', category: 'گوارش (GI)', keywords: 'اسهال بلغمی خونی' },
  { id: 'sym_steatorrhea', label: 'استئاتوره / مدفوع چرب و بدبو (Steatorrhea)', category: 'گوارش (GI)', keywords: 'سوءجذب چربی' },
  { id: 'sym_stool_caliber', label: 'تغییر کالیبر و باریک شدن مدفوع (Decreased Stool Caliber / Pencil-thin)', category: 'گوارش (GI)', keywords: 'مدفوع نواری' },
  { id: 'sym_melena', label: 'ملنا / مدفوع قیری و سیاه (Melena)', category: 'گوارش (GI)', keywords: 'مدفوع سیاه خونریزی فوقانی' },
  { id: 'sym_hematochezia', label: 'هماتوشزی / رکتوراژی / دفع خون روشن (Hematochezia / Rectorrhagia)', category: 'گوارش (GI)', keywords: 'خونریزی مقعدی' },
  { id: 'sym_tenesmus', label: 'زورپیچ و احساس دفع ناکامل (Tenesmus)', category: 'گوارش (GI)', keywords: 'پیچش مقعد' },
  { id: 'sym_proctalgia', label: 'درد مقعدی حین یا پس از دفع (Proctalgia / Anal Pain / Dyschezia)', category: 'گوارش (GI)', keywords: 'شقاق فیشر هموروئید' },
  { id: 'sym_perianal_discharge_itch', label: 'ترشح یا خارش ناحیه پریآنال (Perianal Discharge / Pruritus Ani)', category: 'گوارش (GI)', keywords: 'فیستول آبسه مقعد' },
  { id: 'sym_fecal_incontinence', label: 'بیاختیاری مدفوع یا گاز (Fecal Incontinence)', category: 'گوارش (GI)', keywords: 'اسفنکتر' },

  // ۳. کبد، مجاری صفراوی و پانکراس (Hepatobiliary & Pancreatic)
  { id: 'sym_jaundice', label: 'زردی پوست و اسکلرا (Jaundice / Icterus)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'یرقان زرد شدن چشم' },
  { id: 'sym_cholestatic_pruritus', label: 'خارش پوستی کلستاتیک (Cholestatic Pruritus)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'خارش بدن زردی' },
  { id: 'sym_dark_urine', label: 'تیره یا چایرنگ شدن ادرار (Dark / Tea-colored Urine)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'بیلی روبین ادرار پررنگ' },
  { id: 'sym_acholic_stool', label: 'سفید یا بیرنگ شدن مدفوع (Acholic / Clay-colored Stool)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'مدفوع گچی انسداد صفرا' },
  { id: 'sym_abd_distension_ascites', label: 'اتساع شکم و آسیت (Abdominal Distension / Ascites)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'آب آوردن شکم بزرگی شکم' },

  // ۴. قلب و عروق و عروق محیطی (Cardiovascular & Vascular)
  { id: 'sym_chest_pain_angina', label: 'درد یا فشار قفسه سینه فعالیتی (Exertional Chest Pain / Angina)', category: 'قلب و عروق (Cardiovascular)', keywords: 'سنگینی سینه آنژین قلبی' },
  { id: 'sym_palpitation', label: 'تپش قلب (Palpitations)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ضربان تند نامنظم قلب' },
  { id: 'sym_doe', label: 'تنگی نفس فعالیتی (Dyspnea on Exertion - DOE)', category: 'قلب و عروق (Cardiovascular)', keywords: 'کم آوردن نفس راه رفتن پله' },
  { id: 'sym_orthopnea', label: 'ارتوپنه / تنگی نفس در حالت درازکش (Orthopnea)', category: 'قلب و عروق (Cardiovascular)', keywords: 'چند بالش زیر سر' },
  { id: 'sym_pnd', label: 'تنگی نفس حملهای شبانه (Paroxysmal Nocturnal Dyspnea - PND)', category: 'قلب و عروق (Cardiovascular)', keywords: 'پریدن از خواب با خفگی' },
  { id: 'sym_syncope', label: 'سنکوپ / غش کردن و کاهش گذرای هوشیاری (Syncope)', category: 'قلب و عروق (Cardiovascular)', keywords: 'بیهوش شدن افتادن' },
  { id: 'sym_presyncope', label: 'پیشسنکوپ و سیاهی رفتن چشم (Presyncope / Lightheadedness)', category: 'قلب و عروق (Cardiovascular)', keywords: 'سرگیجه ارتواستاتیک' },
  { id: 'sym_lower_edema', label: 'ادم و ورم اندام تحتانی (Bilateral/Unilateral Lower Extremity Edema)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ورم پا قوزک' },
  { id: 'sym_claudication', label: 'لنگش متناوب عروقی (Intermittent Claudication)', category: 'قلب و عروق (Cardiovascular)', keywords: 'درد ساق پا موقع راه رفتن ایسکمی' },
  { id: 'sym_rest_limb_pain', label: 'درد استراحت و سردی/سیانوز اندام (Ischemic Rest Pain / Cyanosis)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ایسکمی حاد اندام آمبولی' },

  // ۵. دستگاه تنفسی و توراکس (Respiratory & Thoracic)
  { id: 'sym_dyspnea_rest', label: 'تنگی نفس در حال استراحت (Resting Dyspnea / Shortness of Breath)', category: 'تنفسی (Respiratory)', keywords: 'نفس تنگی حاد' },
  { id: 'sym_cough_dry', label: 'سرفه خشک (Dry / Non-productive Cough)', category: 'تنفسی (Respiratory)', keywords: 'سرفه بدون خلط' },
  { id: 'sym_cough_productive', label: 'سرفه خلطدار (Productive Cough / Sputum)', category: 'تنفسی (Respiratory)', keywords: 'خلط چرکی سبز زرد' },
  { id: 'sym_hemoptysis', label: 'هموپتزی / دفع خلط خونی (Hemoptysis)', category: 'تنفسی (Respiratory)', keywords: 'سرفه خونی ریه' },
  { id: 'sym_pleuritic_pain', label: 'درد قفسه سینه پلورتیک با دم عمیق (Pleuritic Chest Pain)', category: 'تنفسی (Respiratory)', keywords: 'درد تیرکشنده با نفس کشیدن آمبولی' },
  { id: 'sym_wheezing_stridor', label: 'خسخس سینه یا استریدور (Wheezing / Stridor)', category: 'تنفسی (Respiratory)', keywords: 'صدای سوت ریه انسداد راه هوایی' },

  // ۶. کلیه و مجاری ادراری و تناسلی آقایان (Genitourinary & Urology)
  { id: 'sym_dysuria', label: 'سوزش ادرار (Dysuria)', category: 'ادراری و تناسلی (GU)', keywords: 'درد موقع ادرار عفونت' },
  { id: 'sym_frequency', label: 'تکرر ادرار (Urinary Frequency)', category: 'ادراری و تناسلی (GU)', keywords: 'زیاد دستشویی رفتن' },
  { id: 'sym_urgency', label: 'فوریت ادراری (Urinary Urgency)', category: 'ادراری و تناسلی (GU)', keywords: 'عجله در دفع ادرار' },
  { id: 'sym_nocturia', label: 'نوکتوری / بیدار شدن شبانه برای ادرار (Nocturia)', category: 'ادراری و تناسلی (GU)', keywords: 'ادرار شبانه پروستات' },
  { id: 'sym_hematuria_gross', label: 'هماچوری واضح یا دفع لخته در ادرار (Gross Hematuria / Clots)', category: 'ادراری و تناسلی (GU)', keywords: 'ادرار خونی قرمز' },
  { id: 'sym_flank_renal_colic', label: 'درد پهلو و کولیک کلیوی (Flank Pain / Renal Colic)', category: 'ادراری و تناسلی (GU)', keywords: 'سنگ کلیه درد پهلو' },
  { id: 'sym_urinary_retention', label: 'احتباس ادراری یا کاهش قطر و فشار جریان ادرار (Urinary Retention / Weak Stream / Hesitancy)', category: 'ادراری و تناسلی (GU)', keywords: 'بند آمدن ادرار قطره قطره' },
  { id: 'sym_urinary_incontinence', label: 'بیاختیاری ادرار (Urinary Incontinence)', category: 'ادراری و تناسلی (GU)', keywords: 'ریزش ادرار' },
  { id: 'sym_pneumaturia_fecaluria', label: 'دفع هوا یا مدفوع در ادرار (Pneumaturia / Fecaluria)', category: 'ادراری و تناسلی (GU)', keywords: 'فیستول کلون به مثانه دیورتیکولیت' },
  { id: 'sym_scrotal_pain_mass', label: 'درد، تورم یا توده بیضه و اسکروتوم (Scrotal Pain / Swelling / Mass)', category: 'ادراری و تناسلی (GU)', keywords: 'تورشن اپیدیدیمیت هیدروسل واریکوسل فتق' },

  // ۷. زنان و مامایی (Gynecology & Obstetrics)
  { id: 'sym_aub_menorrhagia', label: 'خونریزی غیرطبیعی رحمی یا منوراژی (AUB / Menorrhagia / Metrorrhagia)', category: 'زنان (Ob/Gyn)', keywords: 'پریود سنگین لکه بینی' },
  { id: 'sym_amenorrhea_delayed', label: 'آمنوره یا تاخیر قاعدگی (Amenorrhea / Missed Period)', category: 'زنان (Ob/Gyn)', keywords: 'عقب افتادن پریود بارداری حاملگی خارج رحمی' },
  { id: 'sym_dysmenorrhea', label: 'دیسمنوره / درد شدید قاعدگی (Dysmenorrhea)', category: 'زنان (Ob/Gyn)', keywords: 'درد پریود اندومتریوز' },
  { id: 'sym_dyspareunia', label: 'دیسپارونی / درد حین مقاربت (Dyspareunia)', category: 'زنان (Ob/Gyn)', keywords: 'درد لگنی' },
  { id: 'sym_vaginal_discharge', label: 'ترشحات غیرطبیعی یا بدبوی واژینال (Abnormal Vaginal Discharge / Leukorrhea)', category: 'زنان (Ob/Gyn)', keywords: 'عفونت زنان PID' },
  { id: 'sym_postmenopausal_bleeding', label: 'خونریزی پس از یائسگی (Postmenopausal Bleeding - PMB)', category: 'زنان (Ob/Gyn)', keywords: 'خونریزی یائسگی' },

  // ۸. پستان، پوست و بافت نرم (Breast, Skin & Soft Tissue)
  { id: 'sym_breast_mass', label: 'لمس توده در پستان یا زیربغل (Palpable Breast / Axillary Mass)', category: 'پستان و پوست (Breast & Skin)', keywords: 'غده سینه کیست سینه' },
  { id: 'sym_mastalgia', label: 'درد پستان (Mastalgia / Mastodynia)', category: 'پستان و پوست (Breast & Skin)', keywords: 'درد سینه سیکلیک' },
  { id: 'sym_nipple_discharge', label: 'ترشح از نوک پستان - خونی/سروزی/شیری (Nipple Discharge / Galactorrhea)', category: 'پستان و پوست (Breast & Skin)', keywords: 'ترشح نیپل پاژه' },
  { id: 'sym_nipple_retraction_peau', label: 'فرورفتگی نیپل، کشیدگی پوست یا نمای پوستپرتقالی (Nipple Inversion / Skin Dimpling / Peau d’orange)', category: 'پستان و پوست (Breast & Skin)', keywords: 'تغییر پوست سینه' },
  { id: 'sym_skin_ulcer_abscess', label: 'زخم مزمن، آبسه، سلولیت یا ترشح چرکی پوست (Cutaneous Ulcer / Abscess / Cellulitis)', category: 'پستان و پوست (Breast & Skin)', keywords: 'جوش چرکی دمل پای دیابتی' },
  { id: 'sym_skin_rash_erythema', label: 'بثورات جلدی، کهیر یا اریتم (Skin Rash / Urticaria / Erythema)', category: 'پستان و پوست (Breast & Skin)', keywords: 'حساسیت پوستی قرمزی' },
  { id: 'sym_ecchymosis_petechiae', label: 'کبودی آسان، اکیموز یا پتشی و پورپورا (Easy Bruising / Ecchymosis / Petechiae)', category: 'پستان و پوست (Breast & Skin)', keywords: 'خونمردگی پلاکت' },

  // ۹. سر، صورت، فک، چشم، گوش، حلق و گردن (HEENT, Maxillofacial & Neck)
  { id: 'sym_headache', label: 'سردرد (Headache / Cephalgia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'میگرن درد سر' },
  { id: 'sym_facial_jaw_swelling', label: 'توده یا تورم فک، صورت، مندیبل یا غدد بزاقی (Maxillofacial / Mandibular / Parotid Mass)', category: 'سر و گردن (HEENT & Neck)', keywords: 'پاروتید زاویه فک کیست سر' },
  { id: 'sym_trismus', label: 'محدودیت باز کردن دهان / تریسموس (Trismus)', category: 'سر و گردن (HEENT & Neck)', keywords: 'قفل شدن فک آبسه دندانی' },
  { id: 'sym_neck_thyroid_mass', label: 'توده گردنی، بزرگی تیروئید یا گواتر (Neck Mass / Goiter / Thyroid Nodule)', category: 'سر و گردن (HEENT & Neck)', keywords: 'ندول تیروئید غده لنفاوی گردن' },
  { id: 'sym_hoarseness', label: 'خشونت یا تغییر صدا (Hoarseness / Dysphonia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'گرفتگی صدا عصب راجعه حنجره' },
  { id: 'sym_blurred_vision_diplopia', label: 'تاری دید، کاهش بینایی یا دوبینی (Blurred Vision / Visual Loss / Diplopia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'چشم دیدن' },
  { id: 'sym_vertigo_tinnitus', label: 'سرگیجه چرخشی حقیقی یا وزوز گوش (True Vertigo / Tinnitus / Otalgia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'گوش درد تعادل' },
  { id: 'sym_epistaxis_gingival', label: 'خوندماغ یا خونریزی لثه (Epistaxis / Gingival Bleeding)', category: 'سر و گردن (HEENT & Neck)', keywords: 'خونریزی بینی' },

  // ۱۰. مغز و اعصاب و عضلانی-اسکلتی (Neurology & Musculoskeletal)
  { id: 'sym_loc_confusion', label: 'کاهش سطح هوشیاری، گیجی یا دلیریوم (Altered Mental Status / Confusion / LOC)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'خواب آلودگی کما فراموشی' },
  { id: 'sym_seizure', label: 'تشنج و حرکات تونیک-کلونیک (Seizure / Convulsion)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'صرع غش' },
  { id: 'sym_focal_weakness_plegia', label: 'ضعف حرکتی، پارزی یا فلج اندام/صورت (Focal Weakness / Hemiparesis / Palsy)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'سکته بی حرکتی دست و پا' },
  { id: 'sym_paresthesia_numbness', label: 'گزگز، مورمور و بیحسی (Paresthesia / Numbness / Hypoesthesia)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'خواب رفتن دست و پا عصب' },
  { id: 'sym_dysarthria_aphasia', label: 'اختلال تکلم / دیسآرتری یا آفازی (Dysarthria / Aphasia)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'سنگینی زبان حرف زدن' },
  { id: 'sym_ataxia_tremor', label: 'اختلال تعادل، آتاکسی یا لرزش دست (Ataxia / Gait Instability / Tremor)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'تلوتلو خوردن' },
  { id: 'sym_arthralgia_myalgia', label: 'درد مفاصل یا درد عضلانی (Arthralgia / Arthritis / Myalgia)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'بدن درد ورم مفصل زانو' },
  { id: 'sym_low_back_radicular', label: 'کمردرد یا درد تیرکشنده سیاتیکی (Low Back Pain / Sciatica / Radiculopathy)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'دیسک کمر ستون فقرات' },
  { id: 'sym_unilateral_leg_swelling', label: 'تورم و درد یکطرفه ساق یا ران پا (Unilateral Leg Swelling / Calf Pain - DVT)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'لخته پا ترومبوز' },

  // ۱۱. غدد، هماتولوژی و روانپزشکی (Endocrine, Heme & Psych)
  { id: 'sym_polyuria_polydipsia', label: 'پرنوشی و پرادراری (Polydipsia & Polyuria)', category: 'غدد و خون (Endo & Heme)', keywords: 'تشنگی دیابت قند' },
  { id: 'sym_heat_cold_intolerance', label: 'عدم تحمل به گرما یا سرما (Heat / Cold Intolerance)', category: 'غدد و خون (Endo & Heme)', keywords: 'تیروئید کم کاری پرکاری' },
  { id: 'sym_lymphadenopathy_general', label: 'بزرگی غدد لنفاوی گردن، زیربغل یا کشاله ران (Lymphadenopathy)', category: 'غدد و خون (Endo & Heme)', keywords: 'غده لنفاوی لنفوم' },
  { id: 'sym_anxiety_depression_agitation', label: 'اضطراب شدید، بیقراری یا خلق افسرده (Anxiety / Agitation / Depressed Mood)', category: 'غدد و خون (Endo & Heme)', keywords: 'اعصاب استرس پانیک' }
];

export const MASTER_PMH_CATEGORIES = [
  {
    catId: 'pmh_cat_cardio',
    catTitle: '۱. قلبی-عروقی و فشار خون (Cardiovascular & HTN)',
    items: [
      { id: 'pmh_htn', label: 'پرفشاری خون (Hypertension - HTN)', isCoreNegative: true, keywords: 'فشار خون بالا' },
      { id: 'pmh_ihd_cad', label: 'بیماری ایسکمیک قلبی / تنگی عروق کرونر (IHD / CAD / ACS)', isCoreNegative: true, keywords: 'سکته قلبی آنژین MI' },
      { id: 'pmh_pci_stent', label: 'سابقه آنژیوپلاستی و تعبیه استنت کرونری (Prior PCI / Coronary Stent)', isCoreNegative: false, keywords: 'فنر قلب بالن آنژیوگرافی' },
      { id: 'pmh_cabg', label: 'سابقه جراحی پیوند عروق کرونر قلب (Prior CABG)', isCoreNegative: false, keywords: 'عمل قلب باز بای پس' },
      { id: 'pmh_chf', label: 'نارسایی احتقانی قلب (Heart Failure - HFrEF / HFpEF)', isCoreNegative: false, keywords: 'EF پایین نارسایی قلب' },
      { id: 'pmh_af_arrhythmia', label: 'فیبریلاسیون دهلیزی یا آریتمی قلبی (Atrial Fibrillation / Arrhythmia)', isCoreNegative: false, keywords: 'ضربان نامنظم AF' },
      { id: 'pmh_valvular_prosthetic', label: 'بیماری دریچهای یا دریچه مصنوعی قلب (Valvular Heart Disease / Prosthetic Valve)', isCoreNegative: false, keywords: 'تعویض دریچه میترال آئورت' },
      { id: 'pmh_pacemaker_icd', label: 'دارای پیسمیکر یا دفیبریلاتور قلبی (Permanent Pacemaker / ICD)', isCoreNegative: false, keywords: 'باطری قلب' },
      { id: 'pmh_pad', label: 'بیماری عروق محیطی (Peripheral Arterial Disease - PAD)', isCoreNegative: false, keywords: 'تنگی رگ پا' }
    ]
  },
  {
    catId: 'pmh_cat_endo',
    catTitle: '۲. غدد، متابولیک و چربی خون (Endocrine & Metabolic)',
    items: [
      { id: 'pmh_dm', label: 'دیابت شیرین تیپ ۱ یا ۲ (Diabetes Mellitus - DM)', isCoreNegative: true, keywords: 'مرض قند دیابت' },
      { id: 'pmh_dlp', label: 'دیسلیپیدمی / چربی خون بالا (Dyslipidemia / Hyperlipidemia - HLP)', isCoreNegative: true, keywords: 'کلسترول تری گلیسیرید چربی' },
      { id: 'pmh_hypothyroid', label: 'کمکاری تیروئید (Hypothyroidism)', isCoreNegative: true, keywords: 'تیروئید کم کار هاشیموتو' },
      { id: 'pmh_hyperthyroid', label: 'پرکاری تیروئید / گریوز / گواتر (Hyperthyroidism / Graves / Toxic Goiter)', isCoreNegative: false, keywords: 'تیروئید پرکار' },
      { id: 'pmh_adrenal_steroid', label: 'نارسایی آدرنال / سندرم کوشینگ / مصرف مزمن کورتون', isCoreNegative: false, keywords: 'غده فوق کلیه' },
      { id: 'pmh_parathyroid_osteoporosis', label: 'هیپرپاراتیروئیدیسم / استئوپوروز شدید / نقرس (Gout)', isCoreNegative: false, keywords: 'پوکی استخوان اسید اوریک' }
    ]
  },
  {
    catId: 'pmh_cat_gi_liver',
    catTitle: '۳. گوارش، کبد و مجاری صفراوی (GI & Hepatobiliary)',
    items: [
      { id: 'pmh_gerd_pud', label: 'ریفلاکس معده یا زخم پپتیک (GERD / Peptic Ulcer Disease - PUD)', isCoreNegative: false, keywords: 'زخم معده زخم اثنی عشر ورم معده' },
      { id: 'pmh_cholelithiasis', label: 'سنگ کیسه صفرا یا کولهسیستیت قبلی (Cholelithiasis / Biliary Colic)', isCoreNegative: false, keywords: 'سنگ صفرا' },
      { id: 'pmh_fatty_liver_cirrhosis', label: 'کبد چرب (NAFLD/MASLD) یا سیروز کبدی (Liver Cirrhosis)', isCoreNegative: false, keywords: 'نارسایی کبد آسیت' },
      { id: 'pmh_hepatitis', label: 'هپاتیت ویروسی مزمن B یا C یا اتوایمیون (Chronic Hepatitis B / C)', isCoreNegative: false, keywords: 'HBsAg HCV هپاتیت' },
      { id: 'pmh_ibd', label: 'بیماری التهابی روده - کرون یا کولیت اولسراتیو (IBD: Crohn’s / Ulcerative Colitis)', isCoreNegative: false, keywords: 'کولیت روده کرون' },
      { id: 'pmh_pancreatitis_diverticulosis', label: 'سابقه پانکراتیت یا دیورتیکولوز کولون (Pancreatitis / Diverticulosis)', isCoreNegative: false, keywords: 'التهاب پانکراس لوزالمعده' }
    ]
  },
  {
    catId: 'pmh_cat_resp',
    catTitle: '۴. تنفسی و ریوی (Respiratory)',
    items: [
      { id: 'pmh_asthma', label: 'آسم برونشیال (Bronchial Asthma)', isCoreNegative: true, keywords: 'آسم تنگی نفس اسپری' },
      { id: 'pmh_copd', label: 'بیماری انسدادی مزمن ریه / برونشیت مزمن (COPD / Emphysema)', isCoreNegative: true, keywords: 'آمفیزم ریه سیگاری' },
      { id: 'pmh_osa', label: 'آپنه انسدادی خواب (Obstructive Sleep Apnea - OSA)', isCoreNegative: false, keywords: 'خروپف وقفه تنفسی خواب CPAP' },
      { id: 'pmh_tb_ild', label: 'سابقه سل ریوی (TB)، برونشکتازی یا فیبروز ریه (ILD)', isCoreNegative: false, keywords: 'توبرکلوز ریه' }
    ]
  },
  {
    catId: 'pmh_cat_renal_uro',
    catTitle: '۵. کلیوی و مجاری ادراری (Renal & Urologic)',
    items: [
      { id: 'pmh_ckd_esrd', label: 'بیماری مزمن کلیوی یا دیالیز (CKD / ESRD on Hemodialysis)', isCoreNegative: true, keywords: 'نارسایی کلیه کراتینین بالا دیالیز' },
      { id: 'pmh_nephrolithiasis', label: 'سنگ کلیه و حالب (Nephrolithiasis / Urolithiasis)', isCoreNegative: false, keywords: 'سنگ ادراری TUL سنگ شکن' },
      { id: 'pmh_bph', label: 'بزرگی خوشخیم پروستات (Benign Prostatic Hyperplasia - BPH)', isCoreNegative: false, keywords: 'پروستات' }
    ]
  },
  {
    catId: 'pmh_cat_heme_onc_rheum',
    catTitle: '۶. هماتولوژی، ترومبوآمبولی، انکولوژی و روماتولوژی (Heme, Onc & Rheum)',
    items: [
      { id: 'pmh_dvt_pte', label: 'سابقه ترومبوز ورید عمقی یا آمبولی ریه (Prior DVT / Pulmonary Embolism - PTE)', isCoreNegative: true, keywords: 'لخته خون پا ریه' },
      { id: 'pmh_malignancy', label: 'سابقه بدخیمی / کانسر، شیمیدرمانی یا رادیوتراپی (Malignancy / Chemo / RT)', isCoreNegative: true, keywords: 'سرطان تومور کنسر' },
      { id: 'pmh_anemia_thalassemia', label: 'کمخونی فقر آهن، تالاسمی یا فاویسم (IDA / Thalassemia / G6PD Deficiency)', isCoreNegative: false, keywords: 'مینور فاویسم کم خونی' },
      { id: 'pmh_coagulopathy', label: 'اختلالات انعقادی یا ترومبوفیلی (ITP / Hemophilia / Factor Deficiency)', isCoreNegative: false, keywords: 'پلاکت پایین هموفیلی' },
      { id: 'pmh_rheum_autoimmune', label: 'بیماری روماتولوژیک - آرتریت روماتوئید، لوپوس، بهجت، اسکلرودرمی (RA / SLE / vasculitis)', isCoreNegative: false, keywords: 'روماتیسم لوپوس' }
    ]
  },
  {
    catId: 'pmh_cat_neuro_psych',
    catTitle: '۷. مغز و اعصاب و روانپزشکی (Neurology & Psychiatry)',
    items: [
      { id: 'pmh_cva_tia', label: 'سابقه سکته مغزی ایسکمیک/هموراژیک یا TIA (Prior Stroke / CVA / TIA)', isCoreNegative: true, keywords: 'سکته مغزی فلج' },
      { id: 'pmh_epilepsy_seizure', label: 'صرع و تشنج (Epilepsy / Seizure Disorder)', isCoreNegative: false, keywords: 'تشنج' },
      { id: 'pmh_migraine_parkinson_ms', label: 'میگرن، پارکینسون، اماس (MS) یا آلزایمر/دمانس', isCoreNegative: false, keywords: 'ام اس فراموشی لرزش' },
      { id: 'pmh_psych_disorder', label: 'افسردگی اساسی، اختلال اضطرابی، دوقطبی یا سایکوز (MDD / GAD / Bipolar)', isCoreNegative: false, keywords: 'اعصاب و روان' }
    ]
  }
];

// Compatibility bridge: ensure both catId/id and catTitle/title are present
MASTER_PMH_CATEGORIES.forEach(cat => {
  if (!cat.id) cat.id = cat.catId;
  if (!cat.title) cat.title = cat.catTitle;
  if (cat.items) {
    cat.items.forEach(it => {
      if (it.isRoutine === undefined) it.isRoutine = !!it.isCoreNegative;
    });
  }
});

export const PMH_CATEGORIES = MASTER_PMH_CATEGORIES;
export const ALL_MASTER_SYMPTOMS = MASTER_SYMPTOMS_BANK;
export const ALL_MASTER_PMH_ITEMS = MASTER_PMH_CATEGORIES.flatMap(cat => 
  (cat.items || []).map(it => ({ ...it, category: cat.catTitle || cat.title, catId: cat.catId || cat.id }))
);

export const DH_SIG_OPTIONS = [
  'Daily (روزانه)',
  'BD (هر ۱۲ ساعت)',
  'TDS (هر ۸ ساعت)',
  'QID (هر ۶ ساعت)',
  'PRN (هنگام نیاز/درد)',
  'Stat',
  'Weekly'
];


export const MASTER_DRUG_CATEGORIES = [
  {
    catId: 'dh_anticoag_antiplatelet',
    catTitle: '۱. ضدپلاکتها و ضدانعقادها (داروهای پرخطر جراحی - High-Alert)',
    drugs: [
      { id: 'drg_asa', label: 'آسپرین (Aspirin / ASA)', brands: 'Aspirin 80mg, 100mg, 325mg', defaultDose: '80mg', highAlert: true },
      { id: 'drg_clopidogrel', label: 'کلوپیدوگرل (Clopidogrel)', brands: 'Plavix پلاویکس, Osvix اسویکس, Zyllt زیلیت', defaultDose: '75mg', highAlert: true },
      { id: 'drg_ticagrelor', label: 'تیکاگرلور (Ticagrelor)', brands: 'Brilinta بریلینتا, Ticarel', defaultDose: '90mg', highAlert: true },
      { id: 'drg_prasugrel', label: 'پرازوگرل (Prasugrel)', brands: 'Effient', defaultDose: '10mg', highAlert: true },
      { id: 'drg_cilostazol', label: 'سیلوستازول (Cilostazol)', brands: 'Pletaal پلتال', defaultDose: '100mg', highAlert: true },
      { id: 'drg_warfarin', label: 'وارفارین (Warfarin)', brands: 'Coumadin کومادین', defaultDose: '5mg', highAlert: true },
      { id: 'drg_rivaroxaban', label: 'ریواروکسابان (Rivaroxaban)', brands: 'Xarelto زارلتو, ایکسارلتو, ریواکسان', defaultDose: '20mg', highAlert: true },
      { id: 'drg_apixaban', label: 'آپیکسابان (Apixaban)', brands: 'Eliquis الیکوئیس, آپیکسابان', defaultDose: '5mg', highAlert: true },
      { id: 'drg_dabigatran', label: 'دابیگاتران (Dabigatran)', brands: 'Pradaxa پراداکسا', defaultDose: '150mg', highAlert: true },
      { id: 'drg_enoxaparin', label: 'انوکساپارین (Enoxaparin)', brands: 'Clexane کلکسان', defaultDose: '40mg SC', highAlert: true },
      { id: 'drg_heparin', label: 'هپارین (Unfractionated Heparin)', brands: 'Heparin', defaultDose: '5000 IU', highAlert: true }
    ]
  },
  {
    catId: 'dh_cardiovascular_htn',
    catTitle: '۲. داروهای قلبی، فشار خون، ضدآریتمی و چربی خون',
    drugs: [
      { id: 'drg_losartan', label: 'لوزارتان (Losartan)', brands: 'پوزارکس, Cozaar', defaultDose: '25mg / 50mg' },
      { id: 'drg_valsartan', label: 'والزارتان (Valsartan)', brands: 'Diovan دیووان, والزومیکس', defaultDose: '80mg / 160mg' },
      { id: 'drg_telmisartan', label: 'تلمیزارتان (Telmisartan)', brands: 'Micardis میکاردس', defaultDose: '40mg / 80mg' },
      { id: 'drg_captopril', label: 'کاپتوپریل (Captopril)', brands: 'Capoten', defaultDose: '25mg / 50mg' },
      { id: 'drg_enalapril', label: 'انالاپریل (Enalapril)', brands: 'Renitec', defaultDose: '5mg / 20mg' },
      { id: 'drg_lisinopril', label: 'لیزینوپریل (Lisinopril)', brands: 'Zestril', defaultDose: '10mg' },
      { id: 'drg_amlodipine', label: 'آملودیپین (Amlodipine)', brands: 'Norvasc نورواسک, آملوپرس', defaultDose: '5mg' },
      { id: 'drg_nifedipine', label: 'نیفدیپین (Nifedipine)', brands: 'Adalat آدالات', defaultDose: '10mg / 30mg' },
      { id: 'drg_diltiazem', label: 'دیلتیازم (Diltiazem)', brands: 'Cardizem', defaultDose: '60mg / 120mg' },
      { id: 'drg_verapamil', label: 'وراپامیل (Verapamil)', brands: 'Isoptin ایزوپتین', defaultDose: '40mg / 80mg' },
      { id: 'drg_metoprolol', label: 'متوپرولول (Metoprolol Tartrate / Succinate)', brands: 'Metoral متورال, Betaloc بتالوک, امتا', defaultDose: '50mg / 47.5mg' },
      { id: 'drg_bisoprolol', label: 'بیزوپرولول (Bisoprolol)', brands: 'Concor کونکور, زباکور', defaultDose: '2.5mg / 5mg' },
      { id: 'drg_carvedilol', label: 'کارودیلول (Carvedilol)', brands: 'Coryol کوریول', defaultDose: '6.25mg / 12.5mg' },
      { id: 'drg_propranolol', label: 'پروپرانولول (Propranolol)', brands: 'Inderal ایندرال, پرانول', defaultDose: '10mg / 20mg / 40mg' },
      { id: 'drg_atenolol', label: 'آتنولول (Atenolol)', brands: 'Tenormin', defaultDose: '50mg / 100mg' },
      { id: 'drg_nebivolol', label: 'نبیوولول (Nebivolol)', brands: 'Nebilet نبیلت', defaultDose: '5mg' },
      { id: 'drg_furosemide', label: 'فوروزماید (Furosemide)', brands: 'Lasix لازیکس', defaultDose: '20mg / 40mg' },
      { id: 'drg_hydrochlorothiazide', label: 'هیدروکلروتیازید (Hydrochlorothiazide - HCTZ)', brands: 'HCT', defaultDose: '25mg / 50mg' },
      { id: 'drg_indapamide', label: 'اینداپامید (Indapamide)', brands: 'Natrilix ناتریلیکس', defaultDose: '1.5mg' },
      { id: 'drg_spironolactone', label: 'اسپیرونولاکتون (Spironolactone)', brands: 'Aldactone آلداکتون', defaultDose: '25mg / 100mg' },
      { id: 'drg_eplerenone', label: 'اپلرنون (Eplerenone)', brands: 'Inspra', defaultDose: '25mg / 50mg' },
      { id: 'drg_sacubitril_valsartan', label: 'ساکوبیترین / والزارتان (Sacubitril/Valsartan)', brands: 'Entresto انترستو, ویمپتو', defaultDose: '50mg / 100mg' },
      { id: 'drg_digoxin', label: 'دیگوکسین (Digoxin)', brands: 'Lanoxin لانوکسین', defaultDose: '0.25mg' },
      { id: 'drg_amiodarone', label: 'آمیودارون (Amiodarone)', brands: 'Cordarone کردارون', defaultDose: '200mg' },
      { id: 'drg_flecainide_propafenone', label: 'فلکاینید / پروپافنون (Flecainide / Propafenone)', brands: 'Rytmonorm ریتمونورم', defaultDose: '150mg' },
      { id: 'drg_nitroglycerin', label: 'نیتروگلیسیرین پیوستهرهش / زیرزبانی (Nitroglycerin / TNG)', brands: 'Nitrocontin نیتروکانتین, Sustac', defaultDose: '2.6mg / 6.4mg' },
      { id: 'drg_isosorbide', label: 'ایزوسورباید دینیترات / منونیترات (Isosorbide)', brands: 'Isordil ایزوردیل, Imdur', defaultDose: '10mg / 40mg' },
      { id: 'drg_atorvastatin', label: 'آتورواستاتین (Atorvastatin)', brands: 'Lipitor لیپیتور', defaultDose: '20mg / 40mg' },
      { id: 'drg_rosuvastatin', label: 'رزوواستاتین (Rosuvastatin)', brands: 'Crestor کرستور, روپیکسون', defaultDose: '10mg / 20mg' },
      { id: 'drg_simvastatin', label: 'سیمواستاتین (Simvastatin)', brands: 'Zocor', defaultDose: '20mg' },
      { id: 'drg_ezetimibe', label: 'ازتیمیب (Ezetimibe)', brands: 'Ezetrol ازترول', defaultDose: '10mg' },
      { id: 'drg_fenofibrate_gemfibrozil', label: 'فنوفیبرات / جمفیبروزیل (Fenofibrate / Gemfibrozil)', brands: 'Lipanthyl لیپانتیل, Lopid', defaultDose: '200mg / 300mg' },
      { id: 'drg_prazosin_clonidine', label: 'پرازوسین / کلونیدین / هیدرالازین (Prazosin / Clonidine / Hydralazine)', brands: 'Minipress, Catapres', defaultDose: '1mg / 0.2mg' }
    ]
  },
  {
    catId: 'dh_diabetes_endocrine_steroid',
    catTitle: '۳. داروهای دیابت، انسولینها، تیروئید، کورتونها و هورمونی',
    drugs: [
      { id: 'drg_metformin', label: 'متفورمین (Metformin)', brands: 'Glucophage گلوکوفاژ', defaultDose: '500mg / 1000mg', highAlert: true },
      { id: 'drg_gliclazide', label: 'گلیکلازید (Gliclazide)', brands: 'Diamicron دیامیکرون', defaultDose: '30mg / 60mg / 80mg' },
      { id: 'drg_glibenclamide', label: 'گلیبنکلامید (Glibenclamide / Glyburide)', brands: 'Daonil دائونیل', defaultDose: '5mg' },
      { id: 'drg_glimepiride', label: 'گلیمپراید (Glimepiride)', brands: 'Amaryl آماریل', defaultDose: '2mg / 4mg' },
      { id: 'drg_repaglinide', label: 'رپاگلینید (Repaglinide)', brands: 'Novonorm نوونورم', defaultDose: '1mg / 2mg' },
      { id: 'drg_pioglitazone', label: 'پیوگلیتازون (Pioglitazone)', brands: 'Actos آکتوس', defaultDose: '15mg / 30mg' },
      { id: 'drg_sitagliptin', label: 'سیتاگلیپتین / متفورمین (Sitagliptin)', brands: 'Januvia جانوویا, Ziptin زیپتین, زیپمت', defaultDose: '50mg / 100mg' },
      { id: 'drg_linagliptin', label: 'لیناگلیپتین (Linagliptin)', brands: 'Trajenta تراجنتا, گلورنتا, لینامکس', defaultDose: '5mg' },
      { id: 'drg_empagliflozin', label: 'امپاگلیفلوزین (Empagliflozin)', brands: 'Jardiance جاردیانس, گلوریپا, سینجاردی', defaultDose: '10mg / 25mg', highAlert: true },
      { id: 'drg_dapagliflozin', label: 'داپاگلیفلوزین (Dapagliflozin)', brands: 'Forxiga فورکسیگا', defaultDose: '10mg', highAlert: true },
      { id: 'drg_acarbose', label: 'آکاربوز (Acarbose)', brands: 'Glucobay', defaultDose: '50mg / 100mg' },
      { id: 'drg_liraglutide_semaglutide', label: 'لیراگلوتاید / سماگلوتاید (Liraglutide / Semaglutide)', brands: 'Victoza ویکتوزا, Ozempic اوزمپیک, ملیتود', defaultDose: '0.6mg / 1.2mg SC' },
      { id: 'drg_ins_glargine', label: 'انسولین گلارژین (Insulin Glargine)', brands: 'Lantus لانتوس, Toujeo توجئو, Basalin', defaultDose: 'Units SC', highAlert: true },
      { id: 'drg_ins_aspart', label: 'انسولین آسپارت / دوقسمتی (Insulin Aspart)', brands: 'NovoRapid نووراپید, NovoMix نوومیکس', defaultDose: 'Units SC', highAlert: true },
      { id: 'drg_ins_nph_reg', label: 'انسولین NPH / رگولار (NPH / Regular Insulin)', brands: 'Humulin, Insulatard', defaultDose: 'Units SC', highAlert: true },
      { id: 'drg_levothyroxine', label: 'لووتیروکسین (Levothyroxine)', brands: 'Euthyrox یوتیروکس', defaultDose: '50mcg / 100mcg' },
      { id: 'drg_methimazole', label: 'متیمازول / کاربیمازول (Methimazole)', brands: 'Tapazole تاپازول', defaultDose: '5mg / 10mg' },
      { id: 'drg_ptu', label: 'پروپیلتیواوراسیل (Propylthiouracil - PTU)', brands: 'PTU', defaultDose: '50mg' },
      { id: 'drg_prednisolone', label: 'پردنیزولون (Prednisolone)', brands: 'Nisolone نیزولون', defaultDose: '5mg / 50mg', highAlert: true },
      { id: 'drg_dexamethasone', label: 'دگزامتازون (Dexamethasone)', brands: 'Decadron', defaultDose: '0.5mg / 4mg / 8mg', highAlert: true },
      { id: 'drg_hydrocortisone', label: 'هیدروکورتیزون / متیلپردنیزولون (Hydrocortisone / Methylprednisolone)', brands: 'Solu-Cortef, Solu-Medrol', defaultDose: '100mg', highAlert: true },
      { id: 'drg_cabergoline', label: 'کابرگولین / بروموکریپتین (Cabergoline / Bromocriptine)', brands: 'Dostinex داستینکس', defaultDose: '0.5mg' },
      { id: 'drg_alendronate_calcium', label: 'آلندرونیت / کلسیم و ویتامین D / کلسیتریول (Alendronate / Rocaltrol)', brands: 'Fosamax فوزامکس, روکالترول', defaultDose: '70mg Weekly' },
      { id: 'drg_ocp_progesterone', label: 'قرص ضدبارداری (OCP / LD / HD)، دوفاستون، مدروکسیپروژسترون یا دانازول/دیفرلین', brands: 'Duphaston دوفاستون, Yasmin یاسمین, Yaz, Dienogest وروژست', defaultDose: 'Daily' }
    ]
  },
  {
    catId: 'dh_gastrointestinal',
    catTitle: '۴. داروهای گوارشی، کبدی و ضدتهوع',
    drugs: [
      { id: 'drg_pantoprazole', label: 'پنتوپرازول (Pantoprazole)', brands: 'Nolpaza نولپازا, پنتوزول, Controloc', defaultDose: '20mg / 40mg' },
      { id: 'drg_omeprazole', label: 'امپرازول (Omeprazole)', brands: 'Losec', defaultDose: '20mg' },
      { id: 'drg_esomeprazole', label: 'اسامپرازول (Esomeprazole)', brands: 'Nexium نکسیوم, اسوپرکس', defaultDose: '20mg / 40mg' },
      { id: 'drg_lansoprazole_rabeprazole', label: 'لنسوپرازول / رابپرازول (Lansoprazole / Rabeprazole)', brands: 'Pariet پاریت', defaultDose: '20mg / 30mg' },
      { id: 'drg_famotidine', label: 'فاموتیدین (Famotidine)', brands: 'Pepcid', defaultDose: '20mg / 40mg' },
      { id: 'drg_sucralfate_antacid', label: 'سوکرالفیت / شربت آلومینیوم امجیاس (Sucralfate / Aluminum MgS)', brands: 'Al-Mg-S', defaultDose: '10ml / 1g' },
      { id: 'drg_ondansetron', label: 'اندانسترون (Ondansetron)', brands: 'Zofran زوفران, دمیترون', defaultDose: '4mg / 8mg' },
      { id: 'drg_metoclopramide', label: 'متوکلوپرامید (Metoclopramide)', brands: 'Plasil پلازیل', defaultDose: '10mg' },
      { id: 'drg_domperidone', label: 'دومپریدون (Domperidone)', brands: 'Motilium موتیلیوم', defaultDose: '10mg' },
      { id: 'drg_hyoscine_dicyclomine', label: 'هیوسین / دیسیکلومین / کلیدینیوم سی / مبورین (Hyoscine / Dicyclomine / Mebeverine)', brands: 'Buscopan بوسکوپان, Colofac کلپرمین', defaultDose: '10mg / 135mg' },
      { id: 'drg_dimethicone_bismuth', label: 'دایمتیکون / بیسموت سابسیترات (Dimethicone / Bismuth)', brands: 'Simethicone', defaultDose: '40mg' },
      { id: 'drg_lactulose_peg', label: 'شربت لاکتولوز / پودر پیدرولاکس (Lactulose / PEG) / بیزاکودیل / سنا', brands: 'Pidrolax پیدرولاکس, Dulcolax', defaultDose: '15ml / 1 Sachet' },
      { id: 'drg_loperamide_diphenoxylate', label: 'لوپرامید / دیفنوکسیلات (Loperamide / Diphenoxylate)', brands: 'Imodium ایمودیوم', defaultDose: '2mg' },
      { id: 'drg_mesalazine_sulfasalazine', label: 'مزالازین / سولفاسالازین (Mesalazine / Sulfasalazine)', brands: 'Pentasa پنتاسا, Asacol آساکول', defaultDose: '500mg / 800mg' },
      { id: 'drg_ursodeoxycholic', label: 'اورسودئوکسیکولیک اسید (Ursodeoxycholic Acid - UDCA)', brands: 'Ursobil اورسوبیل, Ursofalk', defaultDose: '300mg' }
    ]
  },
  {
    catId: 'dh_analgesics_rheum_immuno',
    catTitle: '۵. مسکنها (NSAIDs / اپیوئیدها)، روماتولوژی و سرکوبکننده ایمنی',
    drugs: [
      { id: 'drg_acetaminophen', label: 'استامینوفن ساده / کدئین (Acetaminophen / Apotel)', brands: 'Tylenol, Apotel آپوتل', defaultDose: '500mg / 1000mg' },
      { id: 'drg_novafen_gelofen', label: 'نووافن / ژلوفن / ایبوپروفن (Novafen / Ibuprofen)', brands: 'Advil, Gelofen ژلوفن, نووافن', defaultDose: '400mg' },
      { id: 'drg_naproxen', label: 'ناپروکسن (Naproxen)', brands: 'Aleve', defaultDose: '250mg / 500mg' },
      { id: 'drg_diclofenac', label: 'دیکلوفناک سدیم / پتاسیم (Diclofenac)', brands: 'Voltaren ولتارن, آلفن ایکس ال', defaultDose: '50mg / 100mg' },
      { id: 'drg_celecoxib', label: 'سلکوکسیب (Celecoxib)', brands: 'Celebrex سلبرکس', defaultDose: '100mg / 200mg' },
      { id: 'drg_meloxicam_piroxicam', label: 'ملوکسیکام / پیروکسیکام / مفنامیک اسید / ایندومتاسین (Meloxicam / Indomethacin)', brands: 'Mobic موبیک, Ponstan', defaultDose: '7.5mg / 15mg' },
      { id: 'drg_ketorolac', label: 'کتورولاک (Ketorolac)', brands: 'Toradol', defaultDose: '30mg IV/IM' },
      { id: 'drg_tramadol_methadone', label: 'ترامادول / متادون / مورفین / پتیدین (Tramadol / Methadone / Morphine)', brands: 'Ultram', defaultDose: '50mg / 100mg' },
      { id: 'drg_allopurinol_febuxostat', label: 'آلوپورینول / فبوکسوستات / کلشیسین (Allopurinol / Febuxostat / Colchicine)', brands: 'Zyloric, Adenuric', defaultDose: '100mg / 300mg' },
      { id: 'drg_methotrexate_azathioprine', label: 'متوترکسات / آزاتیوپرین / سیکلوسپورین / تاکرولیموس / مایکوفنولات (MTX / Azathioprine / CellCept)', brands: 'Imuran ایموران, CellCept سلسپت, Prograf, هیدروکسی کلروکین', defaultDose: 'Daily / Weekly', highAlert: true },
      { id: 'drg_tamoxifen_letrozole', label: 'تاموکسیفن / لتروزول / آناستروزول (Tamoxifen / Letrozole - هورموندرمانی پستان)', brands: 'Nolvadex, Femara فمارا', defaultDose: '20mg / 2.5mg' }
    ]
  },
  {
    catId: 'dh_respiratory_uro_neuro_psych_abx',
    catTitle: '۶. تنفسی، اورولوژی، اعصاب و روان، مکملها و آنتیبیوتیکها',
    drugs: [
      { id: 'drg_salbutamol', label: 'اسپری سالبوتامول (Salbutamol / Albuterol Inhaler)', brands: 'Ventolin ونتولین', defaultDose: '2 Puffs PRN' },
      { id: 'drg_atrovent_tiotropium', label: 'اسپری ایپراتروپیوم / تیوتروپیوم (Ipratropium / Tiotropium)', brands: 'Atrovent آتروونت, Spiriva اسپیریوا, کپسیهالر', defaultDose: '2 Puffs' },
      { id: 'drg_symbicort_seretide', label: 'اسپری بودزوناید+فورموترول / فلوتیکازون+سالمترول (Budesonide/Formoterol)', brands: 'Symbicort سیمبیکورت, Seretide سرتاید, Pulmicort', defaultDose: '1-2 Puffs BD' },
      { id: 'drg_montelukast_theophylline', label: 'مونتهلوکاست / تئوفیلین / استیلسیستئین (Montelukast / NAC)', brands: 'Singulair سینگولر, ACC', defaultDose: '10mg' },
      { id: 'drg_cetirizine_fexofenadine', label: 'ستیریزین / لووستیریزین / فکسوفنادین / لوراتادین / هیدروکسیزین', brands: 'Zyrtec زیرتک, Telfast تلفست', defaultDose: '10mg / 180mg' },
      { id: 'drg_tamsulosin', label: 'تامسولوسین / ترازوسین / فیناستراید / سولیفناسین (Tamsulosin / Finasteride / Solifenacin)', brands: 'Omnic امنیک, Proscar, Vesicare وزیکر', defaultDose: '0.4mg' },
      { id: 'drg_gabapentin_pregabalin', label: 'گاباپنتین / پرگابالین (Gabapentin / Pregabalin)', brands: 'Neurontin نورونتین, Lyrica لیریکا', defaultDose: '100mg / 300mg / 75mg' },
      { id: 'drg_levetiracetam_valproate', label: 'لوهتیراستام / والپروات سدیم / کاربامازپین / فنیتوئین / لاموتریژین', brands: 'Keppra کپرا, Depakine دپاکین, Tegretol', defaultDose: '500mg' },
      { id: 'drg_levodopa_piribedil', label: 'لوودوپا-کاربیدوپا / پرامیپکسول / دونپزیل / ممانتین', brands: 'Sinemet سینمت, Madopar مادوپار, Ebixa', defaultDose: '100/25mg' },
      { id: 'drg_sertraline_fluoxetine', label: 'سرترالین / فلوکستین / سیتالوپرام / اسسیتالوپرام (SSRIs)', brands: 'Zoloft زولوفت, Prozac, Lexapro لگزاتال, آسنترا', defaultDose: '50mg / 20mg / 10mg' },
      { id: 'drg_nortriptyline_amitriptyline', label: 'نورتریپتیلین / آمیتریپتیلین / دولوکستین / ونلافاکسین', brands: 'Cymbalta سیمبالتا, Effexor', defaultDose: '10mg / 25mg / 30mg' },
      { id: 'drg_alprazolam_clonazepam', label: 'آلپرازولام / کلونازپام / لورازپام / دیازپام / زولپیدم / کلردیازپوکساید', brands: 'Xanax زاناکس, Rivotril, Stilnox', defaultDose: '0.5mg / 1mg' },
      { id: 'drg_quetiapine_olanzapine', label: 'کوئتیاپین / اولانزاپین / ریسپریدون / هالوپریدول / لیتیوم', brands: 'Seroquel سروکوئل, Zyprexa', defaultDose: '25mg / 5mg' },
      { id: 'drg_ferrous_folic', label: 'فروس سولفات (قرص آهن) / فولیک اسید / ویتامین B12 / مولتیویتامین', brands: 'Ferfolic فرفولیک, فیفول Fefol', defaultDose: 'Daily' },
      { id: 'drg_antibiotics_common', label: 'آنتیبیوتیک مصرفی اخیر (سفتریاکسون، سیپروفلوکساسین، مترونیدازول، کوآموکسیکلاو، سفالکسین، آزیترومایسین، مروپنم، وانکومایسین، کلیندامایسین)', brands: 'Rocephin, Flagyl, Augmentin', defaultDose: 'طبق دستور' }
    ]
  }
];

// Compatibility bridge: ensure both catId/id and catTitle/title are present
MASTER_DRUG_CATEGORIES.forEach(cat => {
  if (!cat.id) cat.id = cat.catId;
  if (!cat.title) cat.title = cat.catTitle;
});

export const DH_CATEGORIES = MASTER_DRUG_CATEGORIES;
export const ALL_MASTER_DRUGS = MASTER_DRUG_CATEGORIES.flatMap(cat => 
  (cat.drugs || []).map(drg => ({ ...drg, category: cat.catTitle || cat.title, catId: cat.catId || cat.id }))
);

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
      id: 'efast',
      label: 'سونوگرافی eFAST (تروما)',
      fullName: 'سونوگرافی اورژانس eFAST (تروما و بررسی مایع آزاد/پنوموتوراکس)',
      quickTags: [
        { id: 'efast_negative_all', label: 'eFAST کاملاً منفی از نظر مایع آزاد شکمی، پریکارد و پنوموتوراکس', detailHint: '' },
        { id: 'efast_ruq_morison', label: 'مایع آزاد مثبت در فضای موریسون (RUQ)', detailHint: 'میزان مایع (کم/متوسط/زیاد)...' },
        { id: 'efast_luq_splenorenal', label: 'مایع آزاد مثبت در فضای اسپلنورنال (LUQ)', detailHint: 'میزان مایع...' },
        { id: 'efast_pelvic_culdesac', label: 'مایع آزاد مثبت در لگن / کلدوساک (Suprapubic)', detailHint: 'میزان مایع...' },
        { id: 'efast_pericardial_effusion', label: 'مایع در پریکارد (Pericardial Effusion / Tamponade)', detailHint: 'کلاپس دیاستولیک RV...' },
        { id: 'efast_pneumo_hemothorax', label: 'شواهد پنوموتوراکس یا هموتوراکس در بررسی قفسه سینه', detailHint: 'سمت راست یا چپ، فقدان Lung sliding / خطوط بارکد (Stratosphere sign)...' }
      ]
    },
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
