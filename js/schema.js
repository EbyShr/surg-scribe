export const SURGICAL_SCHEMA = {
  admissionPathways: [
    { id: 'emergency_symptom', label: 'مراجعه با علامت حاد / اورژانس' },
    { id: 'clinic_referral', label: 'ارجاع از درمانگاه با نامه استاد / بستری الکتیو' }
  ],

  painSpatialPatterns: [
    { id: 'localized', label: 'لوکالیزه (تک‌ناحیه‌ای یا چندناحیه‌ای)' },
    { id: 'generalized_pure', label: 'ژنرالیزه یکنواخت در کل شکم' },
    { id: 'generalized_predominant', label: 'ژنرالیزه با ارجحیت در ناحیه خاص' },
    { id: 'localized_to_generalized', label: 'شروع لوکالیزه و سپس ژنرالیزه شدن' },
    { id: 'migratory_shifting', label: 'تغییر محل / مهاجرت درد (Shifting Pain)' }
  ],

  abdominalRegions: [
    { id: 'epigastric', label: 'اپیگاستر (Epigastric)' },
    { id: 'periumbilical', label: 'دور ناف (Periumbilical)' },
    { id: 'suprapubic', label: 'سوپراپوبیک (Suprapubic)' },
    { id: 'ruq', label: 'RUQ (رباع فوقانی راست)' },
    { id: 'rlq', label: 'RLQ (رباع تحتانی راست)' },
    { id: 'luq', label: 'LUQ (رباع فوقانی چپ)' },
    { id: 'llq', label: 'LLQ (رباع تحتانی چپ)' },
    { id: 'right_flank', label: 'پهلوی راست (Right Flank)' },
    { id: 'left_flank', label: 'پهلوی چپ (Left Flank)' }
  ],

  radiationSites: [
    { id: 'rad_none', label: 'بدون انتشار' },
    { id: 'rad_back_band', label: 'پشت و کمر (کمربندی)' },
    { id: 'rad_right_scapula', label: 'شانه و کتف راست' },
    { id: 'rad_left_shoulder', label: 'شانه چپ (Kehr’s Sign)' },
    { id: 'rad_groin', label: 'کشاله ران / بیضه / لابیا' },
    { id: 'rad_chest', label: 'قفسه سینه' }
  ],

  familyRelations: ['مادر', 'پدر', 'برادر', 'خواهر', 'درجه ۲'],

  chiefComplaints: [
    {
      id: 'abdominal_gi_biliary',
      label: 'درد شکم، شکایات کبدی-صفراوی و گوارشی',
      symptomGroups: [
        {
          groupTitle: 'علائم گوارشی فوقانی (Upper GI)',
          chips: [
            { id: 'anorexia', label: 'بی‌اشتهایی (Anorexia)', detailHint: 'مدت و شدت...' },
            { id: 'nausea', label: 'تهوع (Nausea)', detailHint: 'مداوم یا متناوب...' },
            { id: 'vomiting', label: 'استفراغ (Vomiting)', detailHint: 'تعداد دفعات، محتویات (غذایی/صفراوی/فکالوئید)، تسکین درد پس از آن...' },
            { id: 'postprandial_fatty', label: 'تشدید درد با مصرف غذای چرب', detailHint: 'فاصله زمانی پس از غذا...' },
            { id: 'relief_leaning_forward', label: 'بهبود نسبی درد با خم شدن به جلو', detailHint: 'میزان تسکین...' },
            { id: 'early_satiety_dyspepsia', label: 'سیری زودرس / سوءهاضمه و سوزش سردل', detailHint: 'علائم همراه...' },
            { id: 'dysphagia_odynophagia', label: 'دیسفاژی / ادینوفاژی', detailHint: 'به جامدات یا مایعات...' },
            { id: 'hematemesis', label: 'هماتمز (استفراغ خونی یا Coffee-ground)', detailHint: 'حجم و دفعات...' }
          ]
        },
        {
          groupTitle: 'علائم صفراوی و کلستاز (Hepatobiliary & Cholestasis)',
          chips: [
            { id: 'icterus_jaundice', label: 'زردی پوست و اسکلرا (Icterus/Jaundice)', detailHint: 'سیر پیشرونده یا نوسانی...' },
            { id: 'pruritus', label: 'خارش پوستی (Pruritus)', detailHint: 'شدت و زمان تشدید...' },
            { id: 'dark_tea_urine', label: 'تیره شدن رنگ ادرار (چای‌رنگ / Dark Urine)', detailHint: 'از چند روز قبل...' },
            { id: 'acholic_pale_stool', label: 'کم‌رنگ یا سفید شدن مدفوع (Acholic Stool)', detailHint: 'مدت زمان...' }
          ]
        },
        {
          groupTitle: 'علائم گوارشی تحتانی و انسدادی (Lower GI & Obstructive)',
          chips: [
            { id: 'inability_pass_gas', label: 'عدم دفع گاز (Inability to pass flatus)', detailHint: 'از چند ساعت/روز قبل...' },
            { id: 'constipation_obstipation', label: 'یبوست اخیر / عدم دفع مدفوع (Obstipation)', detailHint: 'آخرین نوبت دفع...' },
            { id: 'abdominal_distension_bloating', label: 'نفخ و اتساع شکم (Abdominal Distension)', detailHint: 'تدریجی یا ناگهانی...' },
            { id: 'diarrhea', label: 'اسهال (Diarrhea)', detailHint: 'قوام، دفعات، خونی یا آبکی...' },
            { id: 'stool_caliber_change', label: 'تغییر کالیبر (باریک شدن) مدفوع', detailHint: 'مدت زمان...' },
            { id: 'melena', label: 'ملنا (مدفوع قیری و بدبو)', detailHint: 'دفعات و حجم...' },
            { id: 'hematochezia', label: 'هماتوشزی / رکتوراژی (خون روشن از رکتوم)', detailHint: 'مخلوط با مدفوع یا قطره‌ای پس از دفع...' },
            { id: 'tenesmus_anorectal_pain', label: 'زورپیچ (Tenesmus) / درد حین اجابت مزاج', detailHint: 'شدت درد...' }
          ]
        },
        {
          groupTitle: 'علائم سیستمیک، عفونی و ادراری-لگنی (Systemic & Uro/Gyn)',
          chips: [
            { id: 'fever', label: 'تب (Fever)', detailHint: 'درجه، زمانبندی...' },
            { id: 'chills_rigors', label: 'لرز تکانی (Chills / Rigors)', detailHint: 'تناوب و شدت...' },
            { id: 'unintentional_weight_loss', label: 'کاهش وزن ناخواسته', detailHint: 'چند کیلوگرم در چند ماه...' },
            { id: 'dysuria_frequency', label: 'سوزش یا تکرر ادرار (Dysuria / Frequency)', detailHint: 'تغییر رنگ ادرار...' },
            { id: 'hematuria', label: 'هماچوری (تغییر رنگ خونی ادرار)', detailHint: 'لخته، ابتدا یا کل ادرار...' },
            { id: 'gyn_discharge_bleeding_lmp', label: 'ترشح/خونریزی غیرطبیعی واژینال یا تاخیر پریود (در خانم‌ها)', detailHint: 'تاریخ LMP...' }
          ]
        },
        {
          groupTitle: 'علائم محل عمل، زخم و درن جراحی (Post-Op & Drain Site)',
          chips: [
            { id: 'drain_site_pain_induration', label: 'درد و سفتی (Induration) در محل درن یا برش جراحی', detailHint: 'ناحیه درن و فاصله از عمل...' },
            { id: 'drain_output_change', label: 'تغییر حجم یا ماهیت ترشحات درن', detailHint: 'حجم ۲۴ ساعته به cc و ماهیت: سروزی/هموراژیک/چرکی/صفراوی...' },
            { id: 'drain_dislodgement_blockage', label: 'انسداد، نشت از کنار درن یا خروج ناخواسته درن', detailHint: 'میزان نشت یا انسداد...' },
            { id: 'wound_erythema_warmth_dehiscence', label: 'قرمزی، گرمی، ترشح یا باز شدن (Dehiscence) خط بخیه', detailHint: 'ترشح، باز شدن لبه‌ها...' }
          ]
        }
      ]
    },
    {
      id: 'mass_hernia_breast_thyroid',
      label: 'توده، فتق، ضایعه پستان یا تیروئید (Mass / Hernia / Breast / Neck)',
      symptomGroups: [
        {
          groupTitle: 'ویژگی‌های توده و فتق',
          chips: [
            { id: 'reducible_mass', label: 'جا رفتن توده در حالت خوابیده یا با دست (Reducible)', detailHint: 'روش جااندازی...' },
            { id: 'incarcerated_irreducible', label: 'گیر افتادن و عدم جا رفتن توده (Incarcerated)', detailHint: 'از چند ساعت قبل...' },
            { id: 'strangulation_erythema_pain', label: 'درد شدید، قرمزی و گرمی پوست روی توده (Strangulation)', detailHint: 'علائم ایسکمی...' },
            { id: 'size_increase_valsalva', label: 'برجسته شدن با سرفه، ایستادن و زور زدن', detailHint: 'میزان تغییر سایز...' },
            { id: 'progressive_rapid_growth', label: 'رشد پیشرونده سایز توده', detailHint: 'در چه بازه زمانی...' }
          ]
        },
        {
          groupTitle: 'علائم اختصاصی پستان و سر و گردن/تیروئید',
          chips: [
            { id: 'nipple_discharge_retraction', label: 'ترشح از نیپل یا فرورفتگی نوک پستان', detailHint: 'خونی/سروزی، یکطرفه/دوطرفه...' },
            { id: 'skin_dimpling_peau', label: 'کشیدگی پوست یا نمای پوست‌پرتقالی (Peau d’orange)', detailHint: 'محل در پستان...' },
            { id: 'hoarseness_voice_change', label: 'خشونت یا تغییر صدا (Hoarseness)', detailHint: 'مدت زمان...' },
            { id: 'compressive_dyspnea_dysphagia', label: 'احساس فشار، تنگی نفس یا دیسفاژی فشاری در گردن', detailHint: 'در وضعیت خوابیده...' },
            { id: 'hyper_hypothyroid_symptoms', label: 'علائم پرکاری یا کم‌کاری تیروئید (تپش قلب، عدم تحمل گرما/سرما)', detailHint: 'تعریق، لرزش...' }
          ]
        }
      ]
    },
    {
      id: 'trauma_ulcer_abscess',
      label: 'تروما، زخم، آبسه یا پای دیابتی',
      symptomGroups: [
        {
          groupTitle: 'علائم تروما و عفونت بافت نرم',
          chips: [
            { id: 'loc_amnesia', label: 'کاهش سطح هوشیاری یا فراموشی حول حادثه', detailHint: 'مدت زمان...' },
            { id: 'purulent_foul_discharge', label: 'ترشح چرکی و بدبو از موضع', detailHint: 'رنگ و بو...' },
            { id: 'crepitus_necrosis_bullae', label: 'کرپیتاسیون زیرجلدی، نکروز سیاه‌رنگ یا تاول هموراژیک', detailHint: 'وسعت درگیری...' },
            { id: 'distal_numbness_coldness', label: 'سردی، گزگز یا اختلال حس و حرکت دیستال اندام', detailHint: 'وضعیت نبض دیستال...' },
            { id: 'claudication_history', label: 'سابقه لنگش متناوب عروقی (Claudication)', detailHint: 'مسافت لنگش...' }
          ]
        }
      ]
    }
  ],

  pmhItems: [
    { id: 'pmh_dm', label: 'دیابت شیرین (DM)', isCoreNegative: true, detailHint: 'نوع، مدت ابتلا، داروهای مصرفی، آخرین HbA1c...' },
    { id: 'pmh_htn', label: 'پرفشاری خون (HTN)', isCoreNegative: true, detailHint: 'مدت ابتلا، داروها، فشار خون معمول...' },
    { id: 'pmh_dlp', label: 'چربی خون / دیس‌لیپیدمی (DLP/HLP)', isCoreNegative: true, detailHint: 'داروی مصرفی (استاتین و...)...' },
    { id: 'pmh_ihd', label: 'بیماری ایسکمیک قلبی (IHD / MI / استنت / CABG)', isCoreNegative: true, detailHint: 'سال رخداد، تعداد رگ، آخرین اکو/آنژیو (EF%)...' },
    { id: 'pmh_chf', label: 'نارسایی قلبی (CHF)', isCoreNegative: false, detailHint: 'کلاس عملکردی (NYHA)، EF...' },
    { id: 'pmh_arrhythmia', label: 'آریتمی قلبی / فیبریلاسیون دهلیزی (AF) / پیس‌میکر', isCoreNegative: false, detailHint: 'نوع آریتمی و داروی ضدحصبه/ضدانعقاد...' },
    { id: 'pmh_thyroid', label: 'بیماری تیروئید (کم‌کاری / پرکاری / گواتر)', isCoreNegative: true, detailHint: 'نوع و دوز لووتیروکسین/متی‌مازول...' },
    { id: 'pmh_ckd', label: 'بیماری مزمن کلیوی (CKD / دیالیز / سنگ کلیه)', isCoreNegative: false, detailHint: 'کراتینین پایه، برنامه دیالیز...' },
    { id: 'pmh_asthma_copd', label: 'آسم / COPD / بیماری مزمن ریوی', isCoreNegative: true, detailHint: 'اسپری‌های مصرفی، سابقه بستری یا اینتوباسیون...' },
    { id: 'pmh_liver', label: 'بیماری کبدی (کبد چرب / هپاتیت / سیروز)', isCoreNegative: false, detailHint: 'گرید یا Child-Pugh...' },
    { id: 'pmh_pud_gerd', label: 'بیماری اولسر پپتیک (PUD) / ریفلاکس شدید (GERD)', isCoreNegative: false, detailHint: 'سابقه اندوسکوپی یا مصرف PPI...' },
    { id: 'pmh_ibd', label: 'بیماری التهابی روده (کرون / کولیت اولسراتیو)', isCoreNegative: false, detailHint: 'مدت و داروهای سرکوب‌کننده ایمنی...' },
    { id: 'pmh_dvt_pte', label: 'سابقه ترومبوز ورید عمقی (DVT) یا آمبولی ریه (PTE)', isCoreNegative: true, detailHint: 'زمان رخداد و وضعیت درمان ضدانعقادی...' },
    { id: 'pmh_cva_seizure', label: 'سابقه سکته مغزی (CVA / TIA) یا تشنج (Epilepsy)', isCoreNegative: false, detailHint: 'عوارض باقیمانده و داروها...' },
    { id: 'pmh_malignancy', label: 'سابقه بدخیمی یا شیمی‌درمانی/رادیوتراپی قبلی', isCoreNegative: true, detailHint: 'نوع کنسر، سال تشخیص و درمان‌های انجام‌شده...' },
    { id: 'pmh_coagulopathy_anemia', label: 'کم‌خونی مزمن یا اختلالات انعقادی/خونریزی‌دهنده', isCoreNegative: false, detailHint: 'نوع اختلال و سابقه ترانسفوزیون...' }
  ],

  highAlertSurgicalDrugs: [
    { id: 'aspirin', label: 'آسپرین (ASA 80mg)', category: 'Antiplatelet', detailHint: 'ساعت آخرین مصرف و علت تجویز...' },
    { id: 'clopidogrel', label: 'کلوپیدوگرل (Plavix)', category: 'Antiplatelet', detailHint: 'ساعت آخرین مصرف، استنت قلبی...' },
    { id: 'warfarin', label: 'وارفارین (Warfarin)', category: 'Anticoagulant', detailHint: 'آخرین دوز، آخرین INR...' },
    { id: 'doac', label: 'ریواروکسابان / آپیکسابان (Xarelto/Eliquis)', category: 'DOAC', detailHint: 'ساعت دقیق آخرین دوز...' },
    { id: 'heparin_enoxaparin', label: 'هپارین / انوکساپارین (Clexane)', category: 'Anticoagulant', detailHint: 'دوز و ساعت تزریق آخر...' },
    { id: 'corticosteroid', label: 'پردنیزولون / کورتون مزمن (ریسک نارسایی آدرنال)', category: 'Steroid', detailHint: 'دوز روزانه و مدت مصرف...' },
    { id: 'insulin', label: 'انسولین (Insulin)', category: 'Antidiabetic', detailHint: 'نوع و واحدهای تزریقی...' },
    { id: 'metformin_sglt2', label: 'متفورمین / امپاگلیفلوزین (Hold قبل عمل)', category: 'Oral Antidiabetic', detailHint: 'ساعت آخرین قرص...' },
    { id: 'levothyroxine', label: 'لووتیروکسین', category: 'Hormone', detailHint: 'دوز روزانه...' },
    { id: 'beta_blocker', label: 'بتابلاکر (متوپرولول/پروپرانولول/بیزوپرولول)', category: 'Cardiovascular', detailHint: 'دوز و آخرین مصرف...' }
  ],

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

  rosGroups: [
    {
      id: 'ros_constitutional',
      group: '۱. علائم عمومی (Constitutional)',
      items: [
        { id: 'ros_fever', label: 'تب', detailHint: 'درجه و تناوب...' },
        { id: 'ros_chills', label: 'لرز', detailHint: '' },
        { id: 'ros_weight_loss', label: 'کاهش وزن ناخواسته', detailHint: 'میزان کاهش وزن...' },
        { id: 'ros_weight_gain', label: 'افزایش وزن اخیر', detailHint: '' },
        { id: 'ros_anorexia', label: 'کاهش اشتها', detailHint: '' },
        { id: 'ros_fatigue', label: 'ضعف و بی‌حالی عمومی', detailHint: '' },
        { id: 'ros_night_sweats', label: 'تعریق شبانه', detailHint: '' },
        { id: 'ros_insomnia', label: 'اختلال خواب', detailHint: '' }
      ]
    },
    {
      id: 'ros_skin_breast',
      group: '۲. پوست، مو، ناخن و پستان (Skin & Breast)',
      items: [
        { id: 'ros_jaundice', label: 'زردی پوست (Icterus)', detailHint: 'مدت زردی...' },
        { id: 'ros_pruritus', label: 'خارش پوستی (Pruritus)', detailHint: 'شدت خارش...' },
        { id: 'ros_rash_ulcer', label: 'بثورات، زخم مزمن یا تغییر رنگ پوست', detailHint: 'محل ضایعه...' },
        { id: 'ros_ecchymosis_petechiae', label: 'کبودی آسان، پتشی یا اکیموز', detailHint: '' },
        { id: 'ros_breast_mass_pain', label: 'توده یا درد پستان (Mastalgia)', detailHint: 'موضع و ارتباط با دوره...' },
        { id: 'ros_nipple_discharge', label: 'ترشح از نوک پستان', detailHint: 'خونی یا سروزی...' }
      ]
    },
    {
      id: 'ros_heent',
      group: '۳. سر، چشم، گوش، حلق و گردن (HEENT & Neck)',
      items: [
        { id: 'ros_headache', label: 'سردرد غیرمعمول', detailHint: 'محل و شدت...' },
        { id: 'ros_vision_change_diplopia', label: 'تاری دید، دوبینی یا زردی اسکلرا', detailHint: '' },
        { id: 'ros_vertigo_tinnitus', label: 'سرگیجه حقیقی (Vertigo) یا وزوز گوش', detailHint: '' },
        { id: 'ros_epistaxis_gingival', label: 'اپیستاکسی (خوندماغ) یا خونریزی لثه', detailHint: '' },
        { id: 'ros_sore_throat_hoarseness', label: 'گلودرد یا خشونت صدا (Hoarseness)', detailHint: 'مدت خشونت صدا...' },
        { id: 'ros_neck_mass_pain', label: 'توده یا درد گردنی', detailHint: 'محل و ابعاد...' }
      ]
    },
    {
      id: 'ros_respiratory',
      group: '۴. دستگاه تنفسی (Respiratory)',
      items: [
        { id: 'ros_dyspnea', label: 'تنگی نفس (Dyspnea)', detailHint: 'در حال استراحت یا فعالیت...' },
        { id: 'ros_cough', label: 'سرفه (خشک یا خلط‌دار)', detailHint: 'مدت سرفه...' },
        { id: 'ros_sputum', label: 'خلط چرکی', detailHint: 'رنگ و حجم...' },
        { id: 'ros_hemoptysis', label: 'هموپتزی (خلط خونی)', detailHint: 'رگه خونی یا خون خالص...' },
        { id: 'ros_pleuritic_cp', label: 'درد قفسه سینه پلورتیک (تشدید با تنفس)', detailHint: 'محل درد...' },
        { id: 'ros_wheezing', label: 'خس‌خس سینه (Wheezing)', detailHint: '' }
      ]
    },
    {
      id: 'ros_cardiovascular',
      group: '۵. دستگاه قلبی-عروقی (Cardiovascular)',
      items: [
        { id: 'ros_exertional_cp', label: 'درد یا فشار قفسه سینه فعالیتی', detailHint: 'انتشار به دست چپ یا فک...' },
        { id: 'ros_dyspnea_on_exertion', label: 'تنگی نفس فعالیتی (DOE / Function Class)', detailHint: 'کلاس ۱ تا ۴...' },
        { id: 'ros_orthopnea', label: 'ارتوپنه (تنگی نفس در حالت درازکش)', detailHint: 'تعداد بالش...' },
        { id: 'ros_pnd', label: 'تنگی نفس حمله‌ای شبانه (PND)', detailHint: '' },
        { id: 'ros_palpitation', label: 'تپش قلب (Palpitation)', detailHint: 'ناگهانی یا تدریجی...' },
        { id: 'ros_syncope_presyncope', label: 'سنکوپ یا سیاهی رفتن چشم', detailHint: 'تعداد دفعات...' },
        { id: 'ros_edema', label: 'ادم اندام تحتانی', detailHint: 'دوطرفه یا یکطرفه، گودگذار...' },
        { id: 'ros_claudication', label: 'لنگش متناوب عروقی (Claudication)', detailHint: 'مسافت لنگش...' }
      ]
    },
    {
      id: 'ros_gastrointestinal',
      group: '۶. دستگاه گوارش و کبد (Gastrointestinal)',
      items: [
        { id: 'ros_nausea_vomiting', label: 'تهوع و استفراغ', detailHint: 'تعداد دفعات و محتویات...' },
        { id: 'ros_dysphagia', label: 'دیسفاژی (گیر کردن لقمه)', detailHint: 'جامدات یا مایعات...' },
        { id: 'ros_odynophagia', label: 'ادینوفاژی (بلع دردناک)', detailHint: '' },
        { id: 'ros_heartburn_regurgitation', label: 'سوزش سردل (Heartburn) و ترش کردن', detailHint: '' },
        { id: 'ros_early_satiety_bloating', label: 'سیری زودرس و نفخ شکم', detailHint: '' },
        { id: 'ros_abd_pain', label: 'دردهای راجعه شکمی', detailHint: 'محل و تناوب...' },
        { id: 'ros_constipation', label: 'یبوست', detailHint: 'آخرین اجابت مزاج...' },
        { id: 'ros_diarrhea', label: 'اسهال', detailHint: 'دفعات در روز و قوام...' },
        { id: 'ros_bowel_habit_change', label: 'تغییر اخیر عادات روده‌ای یا کالیبر مدفوع', detailHint: 'مدت تغییر...' },
        { id: 'ros_melena_hematochezia', label: 'ملنا یا هماتوشزی (خون در مدفوع)', detailHint: 'حجم و دفعات...' },
        { id: 'ros_hematemesis', label: 'استفراغ خونی (Hematemesis)', detailHint: 'روشن یا تیره...' },
        { id: 'ros_tenesmus_proctalgia', label: 'زورپیچ (Tenesmus) یا درد و خارش مقعد', detailHint: '' },
        { id: 'ros_acholic_stool', label: 'مدفوع بی‌رنگ (آکولیک)', detailHint: '' }
      ]
    },
    {
      id: 'ros_genitourinary',
      group: '۷. دستگاه ادراری و تناسلی (Genitourinary)',
      items: [
        { id: 'ros_dysuria', label: 'سوزش ادرار (Dysuria)', detailHint: '' },
        { id: 'ros_frequency_urgency', label: 'تکرر یا فوریت ادراری (Frequency / Urgency)', detailHint: '' },
        { id: 'ros_hematuria', label: 'هماچوری (خون در ادرار)', detailHint: 'لخته، ابتدا یا کل ادرار...' },
        { id: 'ros_dark_urine', label: 'تغییر رنگ ادرار به چای‌رنگ', detailHint: '' },
        { id: 'ros_flank_pain', label: 'درد پهلو و کولیک کلیوی', detailHint: 'انتشار به کشاله...' },
        { id: 'ros_hesitancy_incontinence', label: 'احتباس، قطره قطره آمدن یا بی‌اختیاری ادرار', detailHint: '' },
        { id: 'ros_scrotal_pain_swelling', label: 'درد یا تورم بیضه و کیسه بیضه', detailHint: 'سمت راست یا چپ...' },
        { id: 'ros_abnormal_vaginal_bleeding', label: 'اختلال قاعدگی، منوراژی یا ترشح واژینال', detailHint: 'تاریخ LMP...' }
      ]
    },
    {
      id: 'ros_musculoskeletal',
      group: '۸. دستگاه عضلانی-اسکلتی و مفاصل (Musculoskeletal)',
      items: [
        { id: 'ros_arthralgia_arthritis', label: 'درد یا تورم مفاصل (Arthralgia)', detailHint: 'کدام مفاصل...' },
        { id: 'ros_myalgia', label: 'درد عضلانی (Myalgia)', detailHint: '' },
        { id: 'ros_back_pain', label: 'کمردرد یا درد ستون فقرات', detailHint: 'انتشار به پا...' },
        { id: 'ros_calf_pain_swelling', label: 'درد یا تورم یکطرفه ساق پا', detailHint: 'سمت راست یا چپ...' }
      ]
    },
    {
      id: 'ros_neurological',
      group: '۹. دستگاه عصبی (Neurological)',
      items: [
        { id: 'ros_paresthesia_numbness', label: 'گزگز، بی‌حسی یا پارستزی اندام‌ها', detailHint: 'توزیع در اندام‌ها...' },
        { id: 'ros_paresis_weakness', label: 'ضعف حرکتی موضعی اندام‌ها', detailHint: 'دست یا پا...' },
        { id: 'ros_seizure', label: 'تشنج یا حرکات غیرارادی', detailHint: 'سابقه تشنج اخیر...' },
        { id: 'ros_tremor_ataxia', label: 'لرزش (Tremor) یا اختلال تعادل', detailHint: '' },
        { id: 'ros_sphincter_dysfunction', label: 'اختلال اسفنکتری جدید', detailHint: 'ادرار یا مدفوع...' }
      ]
    },
    {
      id: 'ros_endocrine',
      group: '۱۰. غدد درون‌ریز (Endocrine)',
      items: [
        { id: 'ros_heat_cold_intolerance', label: 'عدم تحمل به گرما یا سرما', detailHint: '' },
        { id: 'ros_polyuria_polydipsia', label: 'پلی‌اوری و پلی‌دیپسی (پرنوشی و پرادراری)', detailHint: '' },
        { id: 'ros_sweating_flushing', label: 'تعریق بیش از حد یا گرگرفتگی', detailHint: '' }
      ]
    },
    {
      id: 'ros_heme_psych',
      group: '۱۱. هماتولوژی، لنفاوی و اعصاب و روان (Heme/Lymph & Psychiatric)',
      items: [
        { id: 'ros_lymphadenopathy', label: 'بزرگی غدد لنفاوی (گردن، زیربغل، کشاله ران)', detailHint: 'محل و سایز...' },
        { id: 'ros_prolonged_bleeding', label: 'خونریزی طولانی‌مدت پس از بریدگی یا کشیدن دندان', detailHint: '' },
        { id: 'ros_anxiety_depression', label: 'اضطراب شدید یا خلق افسرده', detailHint: '' },
        { id: 'ros_confusion_delirium', label: 'گیجی یا تغییر اخیر وضعیت ذهنی', detailHint: 'زمان شروع...' }
      ]
    }
  ],

  peFindings: {
    generalAndHeadNeck: [
      { id: 'pe_conscious_oriented', label: 'هوشیار و آگاه به زمان، مکان و شخص (Oriented ×3)', detailHint: 'GCS...' },
      { id: 'pe_ill_toxic', label: 'ظاهر Ill یا Toxic', detailHint: 'بیقراری، وضعیت خوابیده...' },
      { id: 'pe_pale_conjunctiva', label: 'ملتحمه رنگ‌پریده (Pale Conjunctiva)', detailHint: 'شدت رنگ‌پریدگی...' },
      { id: 'pe_icteric_sclera', label: 'اسکلرای ایکتریک (Icteric Sclera)', detailHint: 'شدت زردی...' },
      { id: 'pe_dehydrated_mucosa', label: 'مخاطات خشک و شواهد دهیدراتاسیون', detailHint: 'تورگور پوستی...' },
      { id: 'pe_thyroid_exam', label: 'بزرگی یا ندول قابل لمس تیروئید', detailHint: 'لوب، سایز، قوام، حرکت با بلع...' },
      { id: 'pe_cervical_supraclav_lap', label: 'لنفادنوپاتی گردنی، سوپراکلاویکولار (Virchow) یا آگزیلاری', detailHint: 'محل، سایز، متحرک یا فیکس...' }
    ],
    cardiopulmonaryAndBreast: [
      { id: 'pe_clear_lungs', label: 'سمع ریه دوطرفه شفاف و قرینه', detailHint: '' },
      { id: 'pe_abnormal_lung_sounds', label: 'صداهای غیرطبیعی ریه (کراکل / ویز / کاهش صدا)', detailHint: 'سمت راست/چپ، قاعده یا کل ریه...' },
      { id: 'pe_normal_heart_sounds', label: 'سمع قلب: S1 و S2 نرمال و منظم بدون سوفل', detailHint: '' },
      { id: 'pe_heart_murmur_arrhythmia', label: 'سوفل قلبی یا ریتم نامنظم', detailHint: 'گرید و کانون سمع...' },
      { id: 'pe_breast_mass_change', label: 'یافته پاتولوژیک در معاینه پستان', detailHint: 'سمت، ساعت، فاصله از آرئول، سایز (cm)، قوام...' }
    ],
    abdomenInspectionAuscultation: [
      { id: 'pe_abd_flat_symmetrical', label: 'مشاهده: شکم صاف و قرینه، هم‌سطح قفسه سینه و همراه با تنفس', detailHint: '' },
      { id: 'pe_abd_distension', label: 'مشاهده: دیستانسیون و اتساع شکم', detailHint: 'ژنرالیزه یا لوکالیزه...' },
      { id: 'pe_abd_surgical_scar', label: 'مشاهده: اسکار جراحی قبلی روی شکم', detailHint: 'نوع برش (میدلاین/مک‌برنی/کوشر/فان‌اشتیل) و مربوط به چه عملی...' },
      { id: 'pe_laparoscopic_port_drain_site', label: 'بررسی پورت‌های لاپاراسکوپی و محل ورود درن', detailHint: 'وضعیت پانسمان، تندرنس موضعی، هماتوم، سلولیت یا ترشح اطراف درن...' },
      { id: 'pe_abd_ecchymosis_striae_veins', label: 'مشاهده: اکیموز (کولن/گری‌ترنر)، استریا یا عروق کولترال', detailHint: 'توضیح محل...' },
      { id: 'pe_normoactive_bs', label: 'سمع: صداهای روده‌ای نرمال (Normoactive BS)', detailHint: '' },
      { id: 'pe_hyperactive_metallic_bs', label: 'سمع: صداهای روده‌ای هیپراکتیو یا متالیک (High-pitched)', detailHint: '' },
      { id: 'pe_hypoactive_absent_bs', label: 'سمع: کاهش یا سکوت صداهای روده‌ای (Hypoactive/Silent)', detailHint: '' }
    ],
    abdomenPalpationAndSigns: [
      { id: 'pe_soft_nontender', label: 'لمس: شکم نرم و بدون تندرنس (Soft, Non-tender)', detailHint: '' },
      { id: 'pe_tenderness', label: 'تندرنس شکمی در لمس سطحی/عمقی', detailHint: 'نواحی دقیق (مثلاً RLQ و سوپراپوبیک)...' },
      { id: 'pe_rebound_tenderness', label: 'ریباند تندرنس مثبت (Rebound Tenderness)', detailHint: 'محل ریباند...' },
      { id: 'pe_guarding_rigidity', label: 'گاردینگ (ارادی/غیرارادی) یا ریجیدیتی', detailHint: 'لوکالیزه یا Board-like...' },
      { id: 'pe_murphy_sign', label: 'علامت مورفی (Murphy’s Sign)', detailHint: '' },
      { id: 'pe_mcburney_rovsing', label: 'تندرنس نقطه مک‌برنی / علامت روزینگ (Rovsing)', detailHint: '' },
      { id: 'pe_psoas_obturator', label: 'علامت پسواس (Psoas) / ابتوراتور (Obturator)', detailHint: '' },
      { id: 'pe_cva_tenderness', label: 'تندرنس زاویه دنده‌ای-مهره‌ای (CVA Tenderness)', detailHint: 'راست یا چپ...' },
      { id: 'pe_hepatosplenomegaly', label: 'هپاتومگالی / اسپلنومگالی یا آسیت (Shifting Dullness)', detailHint: 'چند سانت زیر لبه دنده...' },
      { id: 'pe_palpable_abd_mass', label: 'توده قابل لمس در شکم', detailHint: 'ناحیه، ابعاد، قوام، ضربان...' },
      { id: 'pe_hernia_exam', label: 'فتق قابل لمس (اینگوئینال / فمورال / نافی / انسزیونال)', detailHint: 'سمت، قابل جااندازی (Reducible) یا گیرکرده، سایز نقص فاشیا...' }
    ],
    dreAndExtremities: [
      { id: 'pe_dre_normal', label: 'معاینه رکتال (TR): تون اسفنکتر نرمال، بدون توده، دستکش آغشته به مدفوع طبیعی', detailHint: '' },
      { id: 'pe_dre_melena_hematochezia', label: 'TR: مشاهده ملنا یا خون روشن روی انگشت دستکش', detailHint: '' },
      { id: 'pe_dre_empty_or_impaction', label: 'TR: آمپول رکتوم خالی یا ایمپکشن مدفوعی', detailHint: '' },
      { id: 'pe_dre_mass_fissure_hemorrhoid', label: 'TR: لمس توده، فیشر، فیستول یا هموروئید', detailHint: 'فاصله از Anal verge، ساعت، تندرنس...' },
      { id: 'pe_distal_pulses_intact', label: 'معاینه عروقی اندام‌ها: نبض‌های دیستال قرینه و پر (2+)', detailHint: '' },
      { id: 'pe_limb_dvt_ulcer_edema', label: 'تورم یکطرفه ساق (DVT)، ادم یا زخم/نکروز دیستال اندام', detailHint: 'محل، سایز زخم، وضعیت نبض...' }
    ]
  },

  paraclinicLabDefinitions: [
    { id: 'wbc', label: 'WBC', unit: '×10³/µL', min: 4.0, max: 11.0, group: 'هماتولوژی روتین' },
    { id: 'rbc', label: 'RBC', unit: '×10⁶/µL', min: 4.2, max: 5.9, group: 'هماتولوژی روتین' },
    { id: 'hb', label: 'Hb', unit: 'g/dL', min: 12.0, max: 17.5, group: 'هماتولوژی روتین' },
    { id: 'hct', label: 'Hct', unit: '%', min: 36.0, max: 52.0, group: 'هماتولوژی روتین' },
    { id: 'mcv', label: 'MCV', unit: 'fL', min: 80, max: 100, group: 'هماتولوژی روتین' },
    { id: 'plt', label: 'Plt', unit: '×10³/µL', min: 150, max: 450, group: 'هماتولوژی روتین' },
    { id: 'neut', label: 'Neutrophils', unit: '%', min: 40, max: 75, group: 'هماتولوژی روتین' },
    { id: 'lymph', label: 'Lymphocytes', unit: '%', min: 20, max: 45, group: 'هماتولوژی روتین' },

    { id: 'pt', label: 'PT', unit: 'sec', min: 11.0, max: 13.5, group: 'انعقادی و التهابی' },
    { id: 'ptt', label: 'PTT', unit: 'sec', min: 25, max: 35, group: 'انعقادی و التهابی' },
    { id: 'inr', label: 'INR', unit: '', min: 0.8, max: 1.2, group: 'انعقادی و التهابی' },
    { id: 'esr', label: 'ESR', unit: 'mm/hr', min: 0, max: 20, group: 'انعقادی و التهابی' },
    { id: 'crp', label: 'CRP', unit: 'mg/L', min: 0, max: 6, group: 'انعقادی و التهابی' },
    { id: 'ddimer', label: 'D-Dimer', unit: 'ng/mL', min: 0, max: 500, group: 'انعقادی و التهابی' },

    { id: 'bs', label: 'BS', unit: 'mg/dL', min: 70, max: 140, group: 'بیوشیمی و کلیه' },
    { id: 'bun', label: 'BUN', unit: 'mg/dL', min: 7, max: 20, group: 'بیوشیمی و کلیه' },
    { id: 'cr', label: 'Cr', unit: 'mg/dL', min: 0.6, max: 1.3, group: 'بیوشیمی و کلیه' },
    { id: 'na', label: 'Na', unit: 'mEq/L', min: 135, max: 145, group: 'بیوشیمی و کلیه' },
    { id: 'k', label: 'K', unit: 'mEq/L', min: 3.5, max: 5.1, group: 'بیوشیمی و کلیه' },
    { id: 'ca', label: 'Ca', unit: 'mg/dL', min: 8.5, max: 10.5, group: 'بیوشیمی و کلیه' },
    { id: 'mg', label: 'Mg', unit: 'mg/dL', min: 1.7, max: 2.2, group: 'بیوشیمی و کلیه' },
    { id: 'albumin', label: 'Albumin', unit: 'g/dL', min: 3.5, max: 5.2, group: 'بیوشیمی و کلیه' },

    { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', min: 5, max: 40, group: 'کبد و صفرا و پانکراس' },
    { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', min: 5, max: 40, group: 'کبد و صفرا و پانکراس' },
    { id: 'alp', label: 'ALP', unit: 'U/L', min: 40, max: 130, group: 'کبد و صفرا و پانکراس' },
    { id: 'bili_t', label: 'Bili Total', unit: 'mg/dL', min: 0.1, max: 1.2, group: 'کبد و صفرا و پانکراس' },
    { id: 'bili_d', label: 'Bili Direct', unit: 'mg/dL', min: 0.0, max: 0.3, group: 'کبد و صفرا و پانکراس' },
    { id: 'amylase', label: 'Amylase', unit: 'U/L', min: 30, max: 110, group: 'کبد و صفرا و پانکراس' },
    { id: 'lipase', label: 'Lipase', unit: 'U/L', min: 10, max: 140, group: 'کبد و صفرا و پانکراس' },

    { id: 'ph', label: 'pH', unit: '', min: 7.35, max: 7.45, group: 'گازهای خونی' },
    { id: 'pco2', label: 'PCO2', unit: 'mmHg', min: 35, max: 45, group: 'گازهای خونی' },
    { id: 'hco3', label: 'HCO3', unit: 'mEq/L', min: 22, max: 26, group: 'گازهای خونی' },
    { id: 'be', label: 'Base Excess (BE)', unit: 'mEq/L', min: -2, max: 2, group: 'گازهای خونی' },
    { id: 'po2', label: 'PO2', unit: 'mmHg', min: 40, max: 100, group: 'گازهای خونی' },
    { id: 'lactate', label: 'Lactate', unit: 'mmol/L', min: 0.5, max: 2.2, group: 'گازهای خونی' },

    { id: 'tsh', label: 'TSH', unit: 'mIU/L', min: 0.4, max: 4.5, group: 'هورمونی و تومورمارکر' },
    { id: 'bhcg', label: 'β-hCG', unit: 'mIU/mL', min: 0, max: 5, group: 'هورمونی و تومورمارکر' },
    { id: 'cea', label: 'CEA', unit: 'ng/mL', min: 0, max: 5.0, group: 'هورمونی و تومورمارکر' },
    { id: 'ca19_9', label: 'CA 19-9', unit: 'U/mL', min: 0, max: 37, group: 'هورمونی و تومورمارکر' }
  ],

  paraclinicModalities: [
    {
      id: 'ultrasound',
      label: 'سونوگرافی (Ultrasound)',
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
      label: 'سی‌تی اسکن (CT Scan)',
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
      id: 'xray_cxr_axr',
      label: 'گرافی قفسه سینه و شکم (CXR / AXR)',
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
      label: 'آندوسکوپی فوقانی (EGD)',
      quickTags: [
        { id: 'egd_ulcer', label: 'اولسر پپتیک معده یا دئودنوم', detailHint: 'محل زخم، سایز و کلاس Forrest...' },
        { id: 'egd_mass_stricture', label: 'ضایعه توده‌ای، اولسراتیو یا تنگی مری/معده', detailHint: 'فاصله از دندان‌های پیشین و درصد انسداد...' },
        { id: 'egd_varices_gastritis', label: 'واریس مری/فوندوس یا گاستریت اروزویو', detailHint: 'گرید واریس و شواهد خونریزی فعال...' }
      ]
    },
    {
      id: 'colonoscopy',
      label: 'کولونوسکوپی (Colonoscopy)',
      quickTags: [
        { id: 'col_mass', label: 'توده شکننده یا انسدادی در رکتوم/کولون', detailHint: 'فاصله از Anal verge (به cm) و وضعیت عبور اسکوپ...' },
        { id: 'col_polyps', label: 'پولیپ‌های کولورکتال', detailHint: 'تعداد، محل و سایز...' },
        { id: 'col_diverticulosis_ibd', label: 'دیورتیکولوز، کولیت یا هموروئید داخلی', detailHint: 'محل و شدت...' }
      ]
    },
    {
      id: 'laryngoscopy',
      label: 'لارنگوسکوپی (Laryngoscopy - قبل/بعد از جراحی تیروئید و گردن)',
      quickTags: [
        { id: 'lar_normal_tvc', label: 'حرکت طناب‌های صوتی حقیقی (TVC) دوطرفه طبیعی و قرینه', detailHint: '' },
        { id: 'lar_vocal_cord_palsy', label: 'فلج یا کاهش حرکت طناب صوتی', detailHint: 'سمت راست یا چپ، وضعیت راه هوایی...' }
      ]
    },
    {
      id: 'pathology_fna',
      label: 'پاتولوژی / بیوپسی / FNA',
      quickTags: [
        { id: 'path_adenocarcinoma', label: 'آدنوکارسینوم (Adenocarcinoma)', detailHint: 'گرید تمایز (Well/Mod/Poorly differentiated)...' },
        { id: 'path_thyroid_bethesda', label: 'نتیجه FNA تیروئید (Bethesda System)', detailHint: 'کلاس Bethesda (I تا VI) و نوع سلول (مثلاً PTC)...' },
        { id: 'path_breast_core', label: 'نتیجه Core Needle Biopsy پستان', detailHint: 'نوع تومور (IDC/ILC) و وضعیت ER/PR/HER2/Ki67...' },
        { id: 'path_benign', label: 'پاتولوژی خوش‌خیم / التهابی', detailHint: 'تشخیص دقیق گزارش پاتولوژی...' }
      ]
    }
  ],

  semanticQualifiers: [
    { pair: 'زمان‌بندی', options: ['حاد (Acute)', 'تحت‌حاد (Subacute)', 'مزمن (Chronic)', 'الکتیو از پیش تشخیص‌داده‌شده (Elective Pre-diagnosed)'] },
    { pair: 'الگوی سیر', options: ['پیشرونده (Progressive)', 'کولیکی / متناوب (Colicky/Intermittent)', 'ثابت و مداوم (Constant)', 'مهاجر (Migratory)'] },
    { pair: 'توزیع آناتومیک', options: ['لوکالیزه (Localized)', 'ژنرالیزه (Generalized)', 'یکطرفه (Unilateral)', 'دوطرفه (Bilateral)'] },
    { pair: 'ماهیت پاتوفیزیولوژیک', options: ['التهابی/عفونی (Inflammatory)', 'انسدادی (Obstructive)', 'خونریزی‌دهنده (Hemorrhagic)', 'نئوپلاستیک/توده‌ای (Neoplastic)', 'پرفوراسیون/پریتونیت (Perforated)'] }
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
