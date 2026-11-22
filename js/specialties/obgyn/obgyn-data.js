/**
 * MedHistorism v3.1 — Ob/Gyn Clinical Data Layer (Leaf Module, Zero Imports)
 * Complete Obstetrics & Gynecology Archetypes, Symptom Bank, 7-Group PE Bank,
 * Shared Core Delta Banks (Drugs, Labs, PSH, PMH), and ADCA VAN DIMLS Presets.
 */

export const OBGYN_OBSTETRIC_ARCHETYPES = [
  {
    id: 'OB-1',
    fa: 'درد زایمان و انقباضات رحمی',
    en: 'Labor Pain & Uterine Contractions',
    subFa: 'شروع، فواصل، مدت انقباض، Show و وضعیت مایع/خونریزی',
    subEn: 'Onset, frequency, duration, bloody show & ROM/VB check',
    fields: [
      { key: 'onsetTime', type: 'text', fa: 'زمان شروع دردها', en: 'Onset Time', phFa: 'مثلاً از ۶ ساعت قبل', phEn: 'e.g. 6 hours prior to arrival' },
      { key: 'frequencyMins', type: 'text', fa: 'فاصله انقباضات (دقیقه)', en: 'Frequency (min)', phFa: 'مثلاً هر ۵ دقیقه', phEn: 'e.g. Every 5 minutes' },
      { key: 'durationSecs', type: 'text', fa: 'مدت هر انقباض (ثانیه)', en: 'Duration (sec)', phFa: 'مثلاً ۴۵ ثانیه', phEn: 'e.g. 45 seconds' },
      { key: 'regularity', type: 'select', fa: 'نظم و سیر انقباضات', en: 'Regularity', options: [
        { val: 'regular_progressive', fa: 'منظم و پیشرونده', en: 'Regular and progressive' },
        { val: 'irregular_braxton', fa: 'نامنظم (Braxton Hicks)', en: 'Irregular (Braxton Hicks)' }
      ]},
      { key: 'locationRadiation', type: 'text', fa: 'محل و انتشار درد', en: 'Location & Radiation', phFa: 'انتشار از پشت و کمر به زیر شکم و کشاله ران', phEn: 'Radiating from lower back to suprapubic/groin' },
      { key: 'bloodyShow', type: 'select', fa: 'دفع موکوس خونی (Show)', en: 'Bloody Show', options: [
        { val: 'no', fa: 'ندارد', en: 'Absent' },
        { val: 'yes', fa: 'مثبت (دفع موکوس خونی)', en: 'Present (bloody show)' }
      ]}
    ]
  },
  {
    id: 'OB-2',
    fa: 'آبریزش واژینال (ROM / PROM / PPROM)',
    en: 'Vaginal Fluid Leakage (ROM / PROM / PPROM)',
    subFa: 'ساعت دقیق پارگی کیسه آب، حجم، رنگ، بو و علائم عفونت',
    subEn: 'Exact rupture time, gush/trickle, fluid color, odor & fever',
    fields: [
      { key: 'ruptureDateTime', type: 'text', fa: 'تاریخ و ساعت دقیق آبریزش', en: 'Exact Rupture Date/Time', phFa: 'مثلاً ساعت ۰۴:۰۰ صبح امروز', phEn: 'e.g. 04:00 AM today' },
      { key: 'onsetCharacter', type: 'select', fa: 'الگوی خروج مایع', en: 'Onset Character', options: [
        { val: 'gush', fa: 'خروج ناگهانی و با فشار مایع (Gush)', en: 'Sudden gush of fluid' },
        { val: 'trickle', fa: 'نشت تدریجی و مداوم (Trickle)', en: 'Continuous slow trickle' }
      ]},
      { key: 'fluidColor', type: 'select', fa: 'رنگ مایع', en: 'Fluid Color', options: [
        { val: 'clear', fa: 'شفاف (Clear)', en: 'Clear' },
        { val: 'meconium', fa: 'آغشته به مکونیوم (Meconium-stained)', en: 'Meconium-stained' },
        { val: 'bloody', fa: 'خونی (Bloody)', en: 'Blood-tinged / bloody' },
        { val: 'purulent', fa: 'زرد یا چرکی', en: 'Yellow / purulent' }
      ]},
      { key: 'fluidOdor', type: 'select', fa: 'بوی مایع', en: 'Fluid Odor', options: [
        { val: 'odorless', fa: 'بدون بوی بد', en: 'No foul odor' },
        { val: 'foul', fa: 'بدبو (Foul-smelling)', en: 'Foul-smelling' }
      ]},
      { key: 'padSoakingCount', type: 'text', fa: 'تعداد پد یا لباس خیس‌شده', en: 'Pads / Clothing Soaked', phFa: 'مثلاً ۳ پد کاملاً خیس', phEn: 'e.g. 3 soaked pads' }
    ]
  },
  {
    id: 'OB-3',
    fa: 'خونریزی واژینال در بارداری (Antepartum VB)',
    en: 'Antepartum Vaginal Bleeding',
    subFa: 'حجم، رنگ خون، ارتباط با درد/تتانوس رحمی و سابقه پرویا/اسکار',
    subEn: 'Volume, blood color, painful vs painless & triggers',
    fields: [
      { key: 'bleedingOnset', type: 'text', fa: 'شروع و مدت خونریزی', en: 'Onset & Duration', phFa: 'شروع ناگهانی از ۲ ساعت قبل', phEn: 'Sudden onset 2 hours prior' },
      { key: 'bleedingAmount', type: 'select', fa: 'میزان خونریزی', en: 'Bleeding Amount', options: [
        { val: 'spotting', fa: 'لکه‌بینی (Spotting)', en: 'Spotting' },
        { val: 'menses_like', fa: 'در حد منس', en: 'Equivalent to menses' },
        { val: 'heavy_clots', fa: 'شدید همراه با دفع لخته', en: 'Heavy with clots' }
      ]},
      { key: 'bloodColor', type: 'select', fa: 'رنگ خون', en: 'Blood Color', options: [
        { val: 'bright_red', fa: 'قرمز روشن (Bright red)', en: 'Bright red' },
        { val: 'dark_old', fa: 'تیره (Dark/old)', en: 'Dark / old blood' }
      ]},
      { key: 'painAssociation', type: 'select', fa: 'همراهی با درد رحمی', en: 'Pain Association', options: [
        { val: 'painless', fa: 'بدون درد (Painless — شک به جفت پرویا)', en: 'Painless (suspicious for Placenta Previa)' },
        { val: 'painful_tetanic', fa: 'همراه با درد مداوم و سفتی رحم (شک به دکولمان)', en: 'Constant abdominal pain / uterine tenderness (suspicious for Abruption)' }
      ]},
      { key: 'trigger', type: 'select', fa: 'عامل محرک', en: 'Trigger', options: [
        { val: 'spontaneous', fa: 'خودبه‌خودی', en: 'Spontaneous' },
        { val: 'postcoital', fa: 'پس از نزدیکی (Postcoital)', en: 'Postcoital' },
        { val: 'trauma', fa: 'پس از تروما یا سقوط', en: 'Following trauma or fall' }
      ]}
    ]
  },
  {
    id: 'OB-4',
    fa: 'افزایش فشار خون و پره‌اکلامپسی (علائم SS)',
    en: 'Hypertension & Preeclampsia (Severe Signs)',
    subFa: 'بالاترین فشار خون، سردرد مقاوم، تاری دید/دوبینی و درد اپی‌گاستر',
    subEn: 'Max BP, refractory headache, visual changes & epigastric pain',
    fields: [
      { key: 'maxRecordedBp', type: 'text', fa: 'بالاترین فشار خون ثبت‌شده و زمان آن', en: 'Max Recorded BP & Time', phFa: 'مثلاً 165/110 mmHg ساعت ۰۶:۰۰ صبح در منزل', phEn: 'e.g. 165/110 mmHg at 06:00 AM at home' },
      { key: 'headacheCharacter', type: 'text', fa: 'ویژگی سردرد', en: 'Headache Character', phFa: 'فرونتال-اکسیپیتال، مداوم و ضربان‌دار، مقاوم به استامینوفن', phEn: 'Fronto-occipital, throbbing, refractory to acetaminophen' },
      { key: 'visualSymptoms', type: 'select', fa: 'علائم چشمی (SS)', en: 'Visual Symptoms (SS)', options: [
        { val: 'none', fa: 'ندارد', en: 'None' },
        { val: 'blurred', fa: 'تاری دید متناوب (Blurred vision)', en: 'Intermittent blurred vision' },
        { val: 'scotomata', fa: 'اسکوتوم و جرقه‌های نوری', en: 'Scotomata / photopsia' },
        { val: 'diplopia', fa: 'دوبینی (Diplopia)', en: 'Diplopia' }
      ]},
      { key: 'epigastricPain', type: 'text', fa: 'توصیف درد اپیگاستر / RUQ', en: 'Epigastric / RUQ Pain', phFa: 'درد مبهم و مداوم در اپیگاستر و RUQ از ۲ ساعت قبل', phEn: 'Persistent epigastric / RUQ pain' }
    ]
  },
  {
    id: 'OB-5',
    fa: 'کاهش حرکات جنین (Decreased FM)',
    en: 'Decreased Fetal Movements (FM)',
    subFa: 'مدت کاهش حرکات، شمارش پس از غذا و پهلوی چپ، مصرف دارو',
    subEn: 'Duration, post-meal left-lateral kick count & maternal factors',
    fields: [
      { key: 'durationHours', type: 'text', fa: 'مدت کاهش یا قطع حرکات (ساعت)', en: 'Duration (hours)', phFa: 'مثلاً از ۶ ساعت قبل', phEn: 'e.g. For the past 6 hours' },
      { key: 'kickCountAfterMeal', type: 'text', fa: 'شمارش حرکات پس از وعده شیرین در پهلوی چپ', en: 'Post-Meal Kick Count (Left Lateral)', phFa: 'مثلاً کمتر از ۴ حرکت طی ۲ ساعت', phEn: 'e.g. <4 movements over 2 hours' },
      { key: 'maternalFastingOrSedatives', type: 'text', fa: 'ناشتایی مادر یا مصرف داروهای آرام‌بخش', en: 'Fasting or Sedative Use', phFa: 'ناشتا نبوده / داروی خواب‌آور مصرف نکرده', phEn: 'Non-fasting, no sedatives taken' }
    ]
  },
  {
    id: 'OB-6',
    fa: 'خونریزی نیمه اول / تهوع شدید / شک به EP',
    en: 'Early Pregnancy Bleeding / Hyperemesis / Suspected EP',
    subFa: 'درد یک‌طرفه لگن، دفع بافت، دفعات استفراغ و علائم هموپریتوئن',
    subEn: 'Pain lateralization, tissue passage, emesis & shoulder pain',
    fields: [
      { key: 'painLateralization', type: 'select', fa: 'الگوی درد شکمی/لگنی', en: 'Pain Lateralization', options: [
        { val: 'unilateral_iliac', fa: 'درد یک‌طرفه ایلیاک/لگن (شک به EP)', en: 'Unilateral iliac/pelvic pain' },
        { val: 'midline_cramp', fa: 'کرامپ خط وسط زیر شکم', en: 'Midline suprapubic cramping' },
        { val: 'none', fa: 'بدون درد شکمی', en: 'No abdominal pain' }
      ]},
      { key: 'passageOfTissue', type: 'select', fa: 'دفع بافت یا وزیکول', en: 'Tissue Passage', options: [
        { val: 'none', fa: 'ندارد', en: 'None' },
        { val: 'clots_tissue', fa: 'دفع لخته یا بقایای بافتی', en: 'Clots or tissue passage' },
        { val: 'vesicles', fa: 'وزیکول‌های خوشه‌انگوری (شک به مول)', en: 'Grape-like vesicles (suspicious for mole)' }
      ]},
      { key: 'vomitingFrequency', type: 'text', fa: 'تعداد دفعات استفراغ و تحمل مایعات', en: 'Vomiting Frequency & PO Tolerance', phFa: 'مثلاً ۶ بار در روز، عدم تحمل مایعات', phEn: 'e.g. 6 episodes/day, unable to tolerate PO fluids' }
    ]
  },
  {
    id: 'OB-7',
    fa: 'دیابت بارداری / سزارین الکتیو / القای زایمان',
    en: 'GDM / Elective Cesarean / Induction of Labor',
    subFa: 'اندیکاسیون بستری، رژیم درمانی قند و برنامه ختم بارداری',
    subEn: 'Admission indication, glycemic regimen & delivery plan',
    fields: [
      { key: 'indicationForAdmission', type: 'select', fa: 'علت بستری الکتیو / برنامه‌ریزی‌شده', en: 'Indication for Admission', options: [
        { val: 'repeat_cs', fa: 'ختم بارداری به علت سزارین قبلی (Repeat CS)', en: 'Elective Repeat Cesarean Section' },
        { val: 'postterm_induction', fa: 'بارداری پست‌ترم / القای زایمان', en: 'Post-term / Induction of Labor' },
        { val: 'gdm_profile', fa: 'کنترل قند خون و پروفایل گلیسمی (GDM)', en: 'Glycemic profile & GDM management' },
        { val: 'fgr_oligo', fa: 'پایش FGR یا الیگوهیدرآمنیوس', en: 'FGR / Oligohydramnios surveillance' }
      ]},
      { key: 'insulinOrDietControl', type: 'text', fa: 'رژیم کنترل قند (رژیم غذایی / متفورمین / انسولین)', en: 'GDM Regimen (Diet / Metformin / Insulin)', phFa: 'مثلاً رژیم غذایی + انسولین NPH شبانه ۱۰ واحد', phEn: 'e.g. Diet-controlled or Insulin regimen & doses' }
    ]
  }
];

export const OBGYN_GYN_ARCHETYPES = [
  {
    id: 'GYN-1',
    fa: 'خونریزی غیرطبیعی رحمی و پس از یائسگی (AUB / PMB)',
    en: 'Abnormal Uterine Bleeding (AUB) & PMB',
    subFa: 'الگو، مدت تغییر سیکل، تعداد پد و لخته',
    subEn: 'Bleeding pattern, abnormality duration, pad count & clots',
    fields: [
      { key: 'durationOfAbnormality', type: 'text', fa: 'مدت تغییر الگوی خونریزی', en: 'Duration of Abnormality', phFa: 'مثلاً طی ۶ ماه اخیر', phEn: 'e.g. Over the past 6 months' },
      { key: 'bleedingPattern', type: 'select', fa: 'الگوی خونریزی', en: 'Bleeding Pattern', options: [
        { val: 'hmb', fa: 'منوراژی / خونریزی شدید قاعدگی (HMB)', en: 'Menorrhagia / Heavy menstrual bleeding (HMB)' },
        { val: 'imb', fa: 'متروراژی / خونریزی نامنظم بین سیکل (IMB)', en: 'Metrorrhagia / Intermenstrual bleeding (IMB)' },
        { val: 'menometrorrhagia', fa: 'منومتروراژی (شدید و نامنظم)', en: 'Menometrorrhagia (heavy and irregular)' },
        { val: 'pmb', fa: 'خونریزی پس از یائسگی (PMB)', en: 'Postmenopausal bleeding (PMB)' },
        { val: 'pcb', fa: 'خونریزی پس از نزدیکی (PCB)', en: 'Postcoital bleeding (PCB)' }
      ]},
      { key: 'padsPerDay', type: 'text', fa: 'تعداد پد در روز و تعویض شبانه', en: 'Pads/Day & Nighttime Changes', phFa: '۷ تا ۸ پد کاملاً خیس و نیاز به تعویض شبانه', phEn: '7-8 soaked pads/day with nighttime pad changes' },
      { key: 'clotPassage', type: 'select', fa: 'دفع لخته', en: 'Clot Passage', options: [
        { val: 'yes', fa: 'مثبت (دفع لخته‌های بزرگ)', en: 'Present (large clots)' },
        { val: 'no', fa: 'منفی', en: 'Absent' }
      ]},
      { key: 'currentEpisodeDays', type: 'text', fa: 'مدت اپیزود فعلی خونریزی (روز)', en: 'Current Episode Duration (days)', phFa: 'مثلاً ۱۲ روز متوالی', phEn: 'e.g. 12 consecutive days' }
    ]
  },
  {
    id: 'GYN-2',
    fa: 'درد حاد یا مزمن شکم و لگن',
    en: 'Acute or Chronic Pelvic / Abdominal Pain',
    subFa: 'شروع حاد/تدریجی، سمت درد، ماهیت و ارتباط با قاعدگی',
    subEn: 'Onset mode, laterality, quality & cycle relationship',
    fields: [
      { key: 'onsetMode', type: 'select', fa: 'نحوه شروع درد', en: 'Onset Mode', options: [
        { val: 'acute_sudden', fa: 'ناگهانی و حاد (شک به تورشن / پارگی کیست / EP)', en: 'Acute sudden onset (torsion / cyst rupture / EP)' },
        { val: 'gradual_chronic', fa: 'تدریجی و مزمن', en: 'Gradual / chronic' }
      ]},
      { key: 'laterality', type: 'select', fa: 'موقعیت و سمت درد', en: 'Laterality / Location', options: [
        { val: 'rlq', fa: 'ربع تحتانی راست (RLQ)', en: 'RLQ' },
        { val: 'llq', fa: 'ربع تحتانی چپ (LLQ)', en: 'LLQ' },
        { val: 'suprapubic', fa: 'سوپراپوبیک / خط وسط', en: 'Suprapubic / Midline' },
        { val: 'bilateral', fa: 'دو طرفه پایین شکم', en: 'Bilateral lower abdomen' }
      ]},
      { key: 'quality', type: 'text', fa: 'کیفیت درد', en: 'Pain Quality', phFa: 'کرامپی / تیز و خنجری / مبهم و فشاری', phEn: 'Crampy / sharp / dull pressure' },
      { key: 'cycleRelation', type: 'select', fa: 'ارتباط با سیکل قاعدگی', en: 'Cycle Relationship', options: [
        { val: 'cyclic', fa: 'مرتبط با قاعدگی (Cyclic)', en: 'Cyclic (menses-related)' },
        { val: 'acyclic', fa: 'غیرمرتبط با سیکل (Acyclic)', en: 'Acyclic (non-menstrual)' }
      ]}
    ]
  },
  {
    id: 'GYN-3',
    fa: 'توده لگنی / میوم رحمی / کیست تخمدان',
    en: 'Pelvic Mass / Uterine Myoma / Ovarian Cyst',
    subFa: 'نحوه کشف، سرعت رشد و علائم فشاری',
    subEn: 'Detection method, growth rate & bulk symptoms',
    fields: [
      { key: 'detectionMethod', type: 'select', fa: 'نحوه کشف ضایعه', en: 'Detection Method', options: [
        { val: 'ultrasound_incidental', fa: 'یافته سونوگرافی', en: 'Identified on ultrasound' },
        { val: 'patient_palpation', fa: 'احساس توده و بزرگی شکم توسط بیمار', en: 'Self-palpated mass / abdominal enlargement' }
      ]},
      { key: 'growthRate', type: 'text', fa: 'مدت و سرعت رشد', en: 'Duration & Growth Rate', phFa: 'افزایش سایز طی ۶ ماه اخیر', phEn: 'Progressive enlargement over 6 months' },
      { key: 'bulkSymptoms', type: 'text', fa: 'علائم فشاری (مثانه/رکتوم)', en: 'Bulk / Pressure Symptoms', phFa: 'تکرر ادرار، احساس پری لگن یا یبوست', phEn: 'Urinary frequency, pelvic fullness, or constipation' }
    ]
  },
  {
    id: 'GYN-4',
    fa: 'پرولاپس ارگان‌های لگنی و بی‌اختیاری ادراری',
    en: 'Pelvic Organ Prolapse & Urinary Incontinence',
    subFa: 'نوع بی‌اختیاری، احساس توده واژینال و جا انداختن دستی',
    subEn: 'Incontinence subtype, bulge sensation & splinting',
    fields: [
      { key: 'incontinenceType', type: 'select', fa: 'نوع بی‌اختیاری ادراری', en: 'Incontinence Type', options: [
        { val: 'sui', fa: 'استرسی (با سرفه، عطسه و خنده — SUI)', en: 'Stress Urinary Incontinence (SUI)' },
        { val: 'uui', fa: 'فوریتی (نیاز ناگهانی و غیرقابل کنترل — UUI)', en: 'Urge Urinary Incontinence (UUI)' },
        { val: 'mixed', fa: 'مختلط (Mixed)', en: 'Mixed Incontinence' },
        { val: 'none', fa: 'ندارد', en: 'None' }
      ]},
      { key: 'bulgeSensation', type: 'select', fa: 'احساس خروج توده از واژن', en: 'Vaginal Bulge Sensation', options: [
        { val: 'yes_standing', fa: 'مثبت (تشدید در پایان روز و ایستادن طولانی)', en: 'Present (worse with prolonged standing)' },
        { val: 'no', fa: 'منفی', en: 'Absent' }
      ]},
      { key: 'manualReduction', type: 'select', fa: 'نیاز به جا انداختن دستی جهت دفع (Splinting)', en: 'Manual Reduction (Splinting)', options: [
        { val: 'no', fa: 'ندارد', en: 'Absent' },
        { val: 'yes', fa: 'مثبت', en: 'Present' }
      ]}
    ]
  },
  {
    id: 'GYN-5',
    fa: 'ترشحات واژینال، تب و PID',
    en: 'Vaginal Discharge, Fever & PID',
    subFa: 'رنگ و قوام ترشحات، بو، خارش و علائم همسر',
    subEn: 'Discharge character, odor, pruritus & partner symptoms',
    fields: [
      { key: 'dischargeColorConsistency', type: 'select', fa: 'رنگ و قوام ترشح', en: 'Discharge Character', options: [
        { val: 'mucopurulent', fa: 'موکوپورولان و چرکی (سرویسیت / PID)', en: 'Mucopurulent (cervicitis / PID)' },
        { val: 'curdy_white', fa: 'سفید پنیری (کاندیدا)', en: 'Thick white curdy (Candida)' },
        { val: 'thin_gray', fa: 'خاکستری رقیق هموژن (BV)', en: 'Thin homogeneous gray (BV)' },
        { val: 'frothy_yellow_green', fa: 'زرد-سبز کف‌آلود (تریکوموناس)', en: 'Frothy yellow-green (Trichomonas)' }
      ]},
      { key: 'odor', type: 'select', fa: 'بو', en: 'Odor', options: [
        { val: 'foul', fa: 'بدبو / بوی ماهی پس از نزدیکی', en: 'Foul / fishy odor' },
        { val: 'odorless', fa: 'بدون بو', en: 'Odorless' }
      ]},
      { key: 'pruritusIrritation', type: 'text', fa: 'خارش و سوزش ولو', en: 'Vulvar Pruritus / Irritation', phFa: 'خارش و سوزش خفیف/شدید ولو و واژن', phEn: 'Mild/severe vulvovaginal pruritus' }
    ]
  },
  {
    id: 'GYN-6',
    fa: 'نازایی و سقط مکرر (Infertility / RPL)',
    en: 'Infertility & Recurrent Pregnancy Loss',
    subFa: 'اولیه یا ثانویه، مدت اقدام، بررسی‌های قبلی (HSG/اسپرم/ART)',
    subEn: 'Primary/secondary, duration, HSG, semen analysis & ART',
    fields: [
      { key: 'infertilityType', type: 'select', fa: 'نوع نازایی', en: 'Infertility Type', options: [
        { val: 'primary', fa: 'اولیه (Primary)', en: 'Primary Infertility' },
        { val: 'secondary', fa: 'ثانویه (Secondary)', en: 'Secondary Infertility' },
        { val: 'rpl', fa: 'سقط مکرر (RPL)', en: 'Recurrent Pregnancy Loss (RPL)' }
      ]},
      { key: 'unprotectedIntercourseDurationMonths', type: 'text', fa: 'مدت اقدام بدون پیشگیری (ماه/سال)', en: 'Duration of Unprotected Intercourse', phFa: 'مثلاً ۲۴ ماه', phEn: 'e.g. 24 months' },
      { key: 'coitalFrequency', type: 'text', fa: 'تعداد دفعات نزدیکی در هفته', en: 'Coital Frequency / Week', phFa: 'مثلاً ۲ تا ۳ بار در هفته', phEn: 'e.g. 2-3 times/week' },
      { key: 'priorWorkupAndArt', type: 'text', fa: 'بررسی‌ها و درمان‌های قبلی (HSG / اسپرموگرام / IUI / IVF)', en: 'Prior Workup & ART', phFa: 'HSG باز، آنالیز اسپرم همسر طبیعی، ۲ نوبت IUI ناموفق', phEn: 'Patent HSG, normal semen analysis, 2 failed IUI cycles' }
    ]
  }
];

export const OBGYN_SS_FIVE_IDS = [
  'obs_ss_headache',
  'obs_ss_nausea_vomiting',
  'obs_ss_blurred_vision',
  'obs_ss_diplopia',
  'obs_ss_epigastric_pain'
];

export const OBGYN_SYMPTOM_BANK = [
  // OBSTETRICS CORE SYMPTOMS (12)
  {
    id: 'obs_labor_contractions',
    subMode: 'obstetrics',
    en: 'Uterine contractions / labor pain',
    fa: 'درد زایمانی و انقباضات رحمی',
    colloquial_fa: 'درد زایمان و سفت شدن شکم',
    isCore: true,
    normalState: -1,
    modifiers: ['منظم و پیشرونده', 'نامنظم', 'انتشار از کمر به زیر شکم', 'همراه با دفع موکوس خونی (Show)'],
    modifiersEn: ['Regular and progressive', 'Irregular', 'Radiating from back to lower abdomen', 'Accompanied by bloody show'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'obs_rom_leakage',
    subMode: 'obstetrics',
    en: 'Vaginal fluid leakage (ROM)',
    fa: 'آبریزش واژینال (پارگی کیسه آب)',
    colloquial_fa: 'پاره شدن کیسه آب / خیس شدن لباس زیر',
    isCore: true,
    normalState: -1,
    modifiers: ['خروج ناگهانی (Gush)', 'نشت تدریجی (Trickle)', 'مایع شفاف (Clear)', 'آغشته به مکونیوم (Meconium)', 'خونی (Bloody)', 'بدبو'],
    modifiersEn: ['Sudden gush', 'Continuous trickle', 'Clear fluid', 'Meconium-stained', 'Blood-tinged', 'Foul-smelling'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_vaginal_bleeding',
    subMode: 'obstetrics',
    en: 'Antepartum vaginal bleeding',
    fa: 'خونریزی واژینال',
    colloquial_fa: 'خونریزی یا لکه‌بینی',
    isCore: true,
    normalState: -1,
    modifiers: ['لکه‌بینی (Spotting)', 'خونریزی روشن بدون درد', 'خونریزی تیره همراه با درد شکم', 'همراه با دفع لخته'],
    modifiersEn: ['Spotting', 'Painless bright red bleeding', 'Painful dark bleeding', 'With passage of clots'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_decreased_fm',
    subMode: 'obstetrics',
    en: 'Decreased fetal movements',
    fa: 'کاهش حرکات جنین',
    colloquial_fa: 'کم شدن تکان‌های بچه',
    isCore: true,
    normalState: -1,
    modifiers: ['کاهش نسبی حرکات', 'عدم حس حرکات جنین پس از وعده غذایی و استراحت به پهلوی چپ'],
    modifiersEn: ['Relative decrease in kick count', 'Absent fetal movement after meal in left lateral position'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_ss_headache',
    subMode: 'obstetrics',
    en: 'Severe headache (SS)',
    fa: 'سردرد (از علائم SS)',
    colloquial_fa: 'سردرد شدید که با مسکن خوب نمی‌شود',
    isCore: true,
    normalState: -1,
    modifiers: ['فرونتال', 'اکسیپیتال', 'مقاوم به مسکن', 'ضربان‌دار'],
    modifiersEn: ['Frontal', 'Occipital', 'Refractory to analgesia', 'Throbbing'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_ss_blurred_vision',
    subMode: 'obstetrics',
    en: 'Blurred vision / scotomata (SS)',
    fa: 'تاری دید و اسکوتوم (از علائم SS)',
    colloquial_fa: 'تار شدن چشم یا دیدن جرقه و مگس‌پران',
    isCore: true,
    normalState: -1,
    modifiers: ['تاری دید', 'جرقه نوری (فوتوپسی)', 'اسکوتوم'],
    modifiersEn: ['Blurred vision', 'Photopsia', 'Scotomata'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_ss_diplopia',
    subMode: 'obstetrics',
    en: 'Diplopia (SS)',
    fa: 'دوبینی (از علائم SS)',
    colloquial_fa: 'دوتا دیدن اشیاء',
    isCore: true,
    normalState: -1,
    modifiers: ['مداوم', 'متناوب'],
    modifiersEn: ['Constant', 'Intermittent'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_ss_epigastric_pain',
    subMode: 'obstetrics',
    en: 'Epigastric / RUQ pain (SS)',
    fa: 'درد اپیگاستر یا RUQ (از علائم SS)',
    colloquial_fa: 'درد سر دل یا زیر دنده‌های راست',
    isCore: true,
    normalState: -1,
    modifiers: ['اپیگاستر', 'RUQ', 'مداوم و شدید'],
    modifiersEn: ['Epigastric', 'RUQ', 'Constant and severe'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_ss_nausea_vomiting',
    subMode: 'obstetrics',
    en: 'Nausea and vomiting (SS / Hyperemesis)',
    fa: 'تهوع و استفراغ (N/V)',
    colloquial_fa: 'حالت تهوع و بالا آوردن',
    isCore: true,
    normalState: -1,
    modifiers: ['تهوع بدون استفراغ', 'استفراغ مکرر غیرقابل کنترل'],
    modifiersEn: ['Nausea without vomiting', 'Intractable recurrent vomiting'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_elevated_bp',
    subMode: 'obstetrics',
    en: 'Elevated blood pressure',
    fa: 'افزایش فشار خون',
    colloquial_fa: 'بالا رفتن فشار خون',
    isCore: true,
    normalState: -1,
    modifiers: ['ثبت‌شده در منزل', 'ثبت‌شده در درمانگاه/مطب'],
    modifiersEn: ['Home-recorded', 'Clinic-recorded'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_fever_chills',
    subMode: 'obstetrics',
    en: 'Fever and chills',
    fa: 'تب و لرز',
    colloquial_fa: 'تب و لرز',
    isCore: true,
    normalState: -1,
    modifiers: ['تب اندازه‌گیری‌شده با دماسنج', 'لرز تکانی'],
    modifiersEn: ['Measured fever', 'Rigors / chills'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'obs_dyspnea_edema',
    subMode: 'obstetrics',
    en: 'Dyspnea or sudden facial/hand edema',
    fa: 'تنگی نفس یا ادم ناگهانی صورت و دست‌ها',
    colloquial_fa: 'نفس‌تنگی یا ورم صورت و دست',
    isCore: false,
    normalState: -1,
    modifiers: ['ارتوپنه', 'ادم ژنرالیزه', 'کاهش حجم ادرار (الیگوری)'],
    modifiersEn: ['Orthopnea', 'Generalized edema', 'Oliguria'],
    redFlag: true,
    source: '[REF]'
  },

  // GYNECOLOGY CORE SYMPTOMS (13 — PDF 1 Verbatim)
  {
    id: 'gyn_vaginal_bleeding',
    subMode: 'gynecology',
    en: 'Abnormal vaginal bleeding (AUB / PMB)',
    fa: 'خونریزی غیرطبیعی واژینال (AUB / PMB)',
    colloquial_fa: 'خونریزی شدید یا نامنظم زنانه',
    isCore: true,
    normalState: -1,
    modifiers: ['منوراژی (HMB)', 'متروراژی / لکه‌بینی بین سیکل (IMB)', 'منومتروراژی', 'خونریزی پس از یائسگی (PMB)', 'همراه با دفع لخته'],
    modifiersEn: ['Menorrhagia (HMB)', 'Intermenstrual bleeding (IMB)', 'Menometrorrhagia', 'Postmenopausal bleeding (PMB)', 'With blood clots'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'gyn_pcb',
    subMode: 'gynecology',
    en: 'Postcoital bleeding (PCB)',
    fa: 'خونریزی پس از نزدیکی (PCB)',
    colloquial_fa: 'لکه‌بینی یا خونریزی بعد از رابطه زناشویی',
    isCore: true,
    normalState: -1,
    modifiers: ['لکه‌بینی روشن', 'خونریزی واضح'],
    modifiersEn: ['Bright spotting', 'Frank bleeding'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'gyn_abdominal_pelvic_pain',
    subMode: 'gynecology',
    en: 'Abdominal or pelvic pain',
    fa: 'درد شکم و لگن',
    colloquial_fa: 'درد زیر دل و کمر',
    isCore: true,
    normalState: -1,
    modifiers: ['حاد و ناگهانی', 'مزمن (>۶ ماه)', 'RLQ', 'LLQ', 'سوپراپوبیک'],
    modifiersEn: ['Acute sudden', 'Chronic (>6 months)', 'RLQ', 'LLQ', 'Suprapubic'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_dysmenorrhea',
    subMode: 'gynecology',
    en: 'Dysmenorrhea',
    fa: 'دیسمنوره (قاعدگی دردناک)',
    colloquial_fa: 'درد شدید موقع پریود',
    isCore: true,
    normalState: -1,
    modifiers: ['اولیه', 'ثانویه و پیشرونده', 'نیازمند مسکن تزریقی/استراحت'],
    modifiersEn: ['Primary', 'Secondary progressive', 'Requiring parenteral analgesia/rest'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_dyspareunia',
    subMode: 'gynecology',
    en: 'Dyspareunia',
    fa: 'دیسپارونی (درد هنگام نزدیکی)',
    colloquial_fa: 'درد موقع رابطه زناشویی',
    isCore: true,
    normalState: -1,
    modifiers: ['سطحی (Superficial)', 'عمقی (Deep)'],
    modifiersEn: ['Superficial', 'Deep'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_infertility_hx',
    subMode: 'gynecology',
    en: 'History of infertility',
    fa: 'سابقه نازایی',
    colloquial_fa: 'بچه‌دار نشدن با وجود اقدام',
    isCore: true,
    normalState: -1,
    modifiers: ['اولیه (Primary)', 'ثانویه (Secondary)'],
    modifiersEn: ['Primary', 'Secondary'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_urinary_incontinence',
    subMode: 'gynecology',
    en: 'Urinary incontinence / LUTS',
    fa: 'بی‌اختیاری ادراری و علائم ادراری',
    colloquial_fa: 'ریزش بی‌اختیار ادرار یا سوزش و تکرر ادرار',
    isCore: true,
    normalState: -1,
    modifiers: ['استرسی (SUI - با سرفه و عطسه)', 'فوریتی (UUI)', 'مختلط (Mixed)', 'تکرر ادرار و دیزوری', 'احتباس ادراری'],
    modifiersEn: ['Stress (SUI)', 'Urgency (UUI)', 'Mixed', 'Frequency and dysuria', 'Urinary retention'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_sexual_dysfunction',
    subMode: 'gynecology',
    en: 'Sexual dysfunction',
    fa: 'مشکلات جنسی (مشکلات sex)',
    colloquial_fa: 'مشکل در رابطه زناشویی، خشکی واژن یا واژینیسموس',
    isCore: true,
    normalState: -1,
    modifiers: ['خشکی واژن', 'واژینیسموس', 'کاهش میل جنسی'],
    modifiersEn: ['Vaginal dryness', 'Vaginismus', 'Decreased libido'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_gi_associated',
    subMode: 'gynecology',
    en: 'Associated gastrointestinal symptoms',
    fa: 'علائم گوارشی همراه',
    colloquial_fa: 'تهوع، استفراغ، نفخ، یبوست یا درد موقع دفع',
    isCore: true,
    normalState: -1,
    modifiers: ['تهوع و استفراغ', 'نفخ و سیری زودرس', 'یبوست مزمن', 'دیسشزی (درد هنگام دفع مدفوع)'],
    modifiersEn: ['Nausea and vomiting', 'Bloating and early satiety', 'Chronic constipation', 'Dyschezia'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_vaginal_discharge',
    subMode: 'gynecology',
    en: 'Abnormal vaginal discharge / pruritus',
    fa: 'ترشحات غیرطبیعی یا خارش واژینال',
    colloquial_fa: 'ترشح بدبو، رنگی یا خارش و سوزش',
    isCore: true,
    normalState: -1,
    modifiers: ['سفید پنیری', 'خاکستری با بوی ماهی', 'زرد-سبز کف‌آلود', 'چرکی (موکوپورولان)', 'همراه با خارش و سوزش ولو'],
    modifiersEn: ['Thick white curdy', 'Gray fishy odor', 'Frothy yellow-green', 'Mucopurulent', 'With vulvar pruritus'],
    redFlag: false,
    source: '[UNI]'
  },
  {
    id: 'gyn_fever',
    subMode: 'gynecology',
    en: 'Fever and chills',
    fa: 'تب و لرز',
    colloquial_fa: 'تب و لرز',
    isCore: true,
    normalState: -1,
    modifiers: ['تب بالا (>۳۸.۳)', 'لرز'],
    modifiersEn: ['High fever (>38.3 C)', 'Chills'],
    redFlag: true,
    source: '[UNI]'
  },
  {
    id: 'gyn_pelvic_bulge_pressure',
    subMode: 'gynecology',
    en: 'Pelvic pressure or vaginal bulge sensation',
    fa: 'احساس سنگینی لگن یا خروج توده از واژن',
    colloquial_fa: 'احساس افتادگی رحم یا مثانه',
    isCore: false,
    normalState: -1,
    modifiers: ['تشدید در پایان روز و ایستادن طولانی', 'نیاز به جا انداختن با دست (Splinting)'],
    modifiersEn: ['Worse with prolonged standing', 'Requires manual splinting'],
    redFlag: false,
    source: '[REF]'
  },
  {
    id: 'gyn_anemia_constitutional',
    subMode: 'gynecology',
    en: 'Anemia symptoms or unintentional weight loss',
    fa: 'علائم آنمی (ضعف، سرگیجه، تپش قلب) یا کاهش وزن',
    colloquial_fa: 'بی‌حالی، سرگیجه، تپش قلب یا لاغر شدن بی‌دلیل',
    isCore: false,
    normalState: -1,
    modifiers: ['ضعف و سرگیجه ارتوستاتیک', 'تپش قلب و تنگی نفس کوششی', 'کاهش وزن ناخواسته و بی‌اشتهایی'],
    modifiersEn: ['Orthostatic dizziness and fatigue', 'Palpitations and exertional dyspnea', 'Unintentional weight loss and anorexia'],
    redFlag: true,
    source: '[REF]'
  }
];

export const OBGYN_PE_BANK = [
  // 1. VITAL SIGNS & PREECLAMPSIA BEDSIDE CHECKS (5)
  {
    id: 'pe_vitals_bp',
    subMode: 'both',
    subGroup: 'علائم حیاتی (Vital Signs)',
    subGroupEn: 'Vital Signs',
    en: 'Blood Pressure (BP)',
    fa: 'فشار خون (BP)',
    isCore: true,
    normalState: 1,
    detailHint: 'mmHg (در بارداری: ≥140/90 پرفشاری خون؛ ≥160/110 پره‌اکلامپسی شدید)',
    detailHintEn: 'mmHg (Pregnancy: >=140/90 HTN; >=160/110 severe range)',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_vitals_pr',
    subMode: 'both',
    subGroup: 'علائم حیاتی (Vital Signs)',
    subGroupEn: 'Vital Signs',
    en: 'Pulse Rate (PR)',
    fa: 'ضربان قلب (PR)',
    isCore: true,
    normalState: 1,
    detailHint: 'beats/min (نرمال: ۶۰ تا ۱۰۰)',
    detailHintEn: 'bpm (Normal: 60-100)',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_vitals_rr',
    subMode: 'both',
    subGroup: 'علائم حیاتی (Vital Signs)',
    subGroupEn: 'Vital Signs',
    en: 'Respiratory Rate (RR)',
    fa: 'تعداد تنفس (RR)',
    isCore: true,
    normalState: 1,
    detailHint: 'breaths/min (در مسمومیت با سولفات منیزیم: <۱۲/min خطرناک است)',
    detailHintEn: 'breaths/min (<12/min indicates MgSO4 toxicity)',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_vitals_temp',
    subMode: 'both',
    subGroup: 'علائم حیاتی (Vital Signs)',
    subGroupEn: 'Vital Signs',
    en: 'Temperature (T)',
    fa: 'دمای بدن (T)',
    isCore: true,
    normalState: 1,
    detailHint: '°C (≥۳۸.۰ تب؛ شک به کوریوآمنیونیت یا PID)',
    detailHintEn: 'C (>=38.0 C fever; suspect chorioamnionitis or PID)',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_urine_dipstick',
    subMode: 'obstetrics',
    subGroup: 'علائم حیاتی (Vital Signs)',
    subGroupEn: 'Vital Signs',
    en: 'Bedside Urine Dipstick Protein',
    fa: 'پروتئین ادرار نواری (Urine Dipstick)',
    isCore: false,
    normalState: -1,
    detailHint: 'Negative | Trace | +1 | +2 | +3 | +4 (≥+2 به نفع پروتئینوری پره‌اکلامپسی)',
    detailHintEn: 'Negative / Trace / +1 / +2 / +3 / +4',
    isInternalPelvic: false,
    source: '[REF]'
  },

  // 2. OBSTETRIC ABDOMINAL EXAM, FHR & LEOPOLD MANEUVERS (7)
  {
    id: 'pe_obs_fhr',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Fetal Heart Rate (FHR) auscultation',
    fa: 'سمع ضربان قلب جنین (FHR)',
    isCore: true,
    normalState: 1,
    detailHint: 'تعداد ضربان در دقیقه (نرمال: ۱۱۰ تا ۱۶۰ bpm) و کوادران سمع (LLQ/RLQ/LUQ/RUQ)',
    detailHintEn: '110-160 bpm and quadrant (LLQ/RLQ/LUQ/RUQ)',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_fundal_height',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Fundal Height (FH)',
    fa: 'ارتفاع رحم (Fundal Height)',
    isCore: true,
    normalState: 0,
    detailHint: 'بر حسب سانتی‌متر (از سمفیز پوبیس تا فوندوس)',
    detailHintEn: 'cm from symphysis pubis to uterine fundus',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_leopold_1_2_lie',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Leopold I & II: Fetal Lie & Back Position',
    fa: 'مانور لئوپولد ۱ و ۲ (قرار جنین و وضعیت پشت)',
    isCore: false,
    normalState: 1,
    detailHint: 'قرار طولی (Longitudinal)، عرضی یا مایل؛ پشت جنین چپ یا راست',
    detailHintEn: 'Longitudinal/transverse/oblique lie; fetal back left/right',
    isInternalPelvic: false,
    source: '[REF]'
  },
  {
    id: 'pe_obs_leopold_3_presentation',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Leopold III (Pawlik): Presenting Part',
    fa: 'مانور لئوپولد ۳ (عضو پرزانته بر فراز لگن)',
    isCore: true,
    normalState: 1,
    detailHint: 'سفالیک (Cephalic) | بریچ (Breech) | شانه/عرضی',
    detailHintEn: 'Cephalic / Breech / Shoulder-transverse',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_leopold_4_engagement',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Leopold IV: Engagement of Presenting Part',
    fa: 'مانور لئوپولد ۴ (وضعیت انگاژمان عضو پرزانته)',
    isCore: false,
    normalState: 0,
    detailHint: 'انگاژه شده (Engaged) vs شناور (Floating / Unengaged)',
    detailHintEn: 'Engaged vs. Floating / Unengaged',
    isInternalPelvic: false,
    source: '[REF]'
  },
  {
    id: 'pe_obs_uterine_contractions',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Palpable Uterine Contractions',
    fa: 'لمس انقباضات رحمی (Contractions)',
    isCore: true,
    normalState: -1,
    detailHint: 'تعداد در ۱۰ دقیقه، مدت (ثانیه)، شدت و تونوسیته پایه رحم',
    detailHintEn: 'Frequency per 10 min, duration (sec), intensity & baseline resting tone',
    isInternalPelvic: false,
    source: '[REF]'
  },
  {
    id: 'pe_obs_scar_tenderness',
    subMode: 'obstetrics',
    subGroup: 'معاینه شکم حاملگی و سمع FHR',
    subGroupEn: 'Obstetric Abdominal Exam & FHR',
    en: 'Prior Pfannenstiel / CS Scar Tenderness or Uterine Tetany',
    fa: 'تندرنس محل اسکار سزارین قبلی یا سفتی تندر رحم (شک به دکولمان/راپچر)',
    isCore: true,
    normalState: -1,
    detailHint: 'تندرنس سوپراپوبیک روی خط برش یا رحم تخته‌ای (Woody uterus)',
    detailHintEn: 'Suprapubic scar tenderness or woody/tetanic uterus',
    isInternalPelvic: false,
    source: '[REF]'
  },

  // 3. OBSTETRIC VAGINAL EXAM (TV) & PELVIMETRY (7)
  {
    id: 'pe_obs_tv_dilation',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Cervical Dilation (cm)',
    fa: 'میزان دیلاتاسیون سرویکس (بر حسب CM)',
    isCore: true,
    normalState: 0,
    detailHint: 'Closed (بسته / 0 cm) تا Full (۱۰ سانتی‌متر)',
    detailHintEn: 'Closed (0 cm) to Full (10 cm)',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_tv_effacement',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Cervical Effacement (%)',
    fa: 'میزان افاسمان سرویکس (بر اساس درصد ۰ تا ۱۰۰٪)',
    isCore: true,
    normalState: 0,
    detailHint: '۰٪ (ضخیم / Thick) تا ۱۰۰٪ (کاملاً نازک‌شده)',
    detailHintEn: '0% (Thick) to 100% (Fully effaced)',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_tv_station',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Fetal Station',
    fa: 'Station جنین (نسبت به خارهای ایسکیال)',
    isCore: true,
    normalState: 0,
    detailHint: 'فرم دانشگاهی: ۵- تا ۵+ [UNI] (یا استاندارد: ۳- تا ۳+)',
    detailHintEn: '-5 to +5 [UNI] (or -3 to +3 scale; 0 = ischial spines)',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_tv_presenting_part',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Presenting Part & Position on TV',
    fa: 'نوع عضو پرزانته در معاینه TV',
    isCore: true,
    normalState: 1,
    detailHint: 'سفالیک (OA/LOA/ROA/OP/OT) | بریچ | خارج از دسترس (High)',
    detailHintEn: 'Cephalic (OA/LOA/ROA/OP/OT) / Breech / High unengaged',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_tv_membranes',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Membrane Status & Amniotic Fluid Character',
    fa: 'وضعیت پرده‌ها (Intact یا Rupture) و نوع مایع',
    isCore: true,
    normalState: 1,
    detailHint: 'سالم (Intact) | پاره (Ruptured: شفاف/مکونیوم/خونی/بدبو)',
    detailHintEn: 'Intact vs. Ruptured (clear / meconium / bloody / foul)',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_obs_tv_cervix_consistency_position',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Cervical Consistency & Position (for Bishop Score)',
    fa: 'قوام و موقعیت سرویکس (جهت محاسبه Bishop Score)',
    isCore: false,
    normalState: 0,
    detailHint: 'قوام: سفت/متوسط/نرم؛ موقعیت: خلفی/میانی/قدامی',
    detailHintEn: 'Consistency: Firm/Medium/Soft; Position: Posterior/Mid/Anterior',
    isInternalPelvic: true,
    source: '[REF]'
  },
  {
    id: 'pe_obs_clinical_pelvimetry',
    subMode: 'obstetrics',
    subGroup: 'معاینه واژینال مامایی (TV) و لگن',
    subGroupEn: 'Obstetric Vaginal Exam (TV) & Pelvimetry',
    en: 'Clinical Pelvimetry (Inlet, Midpelvis, Outlet)',
    fa: 'معاینه لگن (پلویمتری بالینی)',
    isCore: true,
    normalState: 1,
    detailHint: 'پرومونتوار ساکروم غیرقابل لمس، خار ایسکیال غیربرجسته، قوس ساب‌پوبیک >۹۰ درجه (متناسب)',
    detailHintEn: 'Sacral promontory not tipped, non-prominent spines, subpubic arch >90 deg (adequate)',
    isInternalPelvic: true,
    source: '[UNI]'
  },

  // 4. OBSTETRIC EXTREMITIES & DTR (2)
  {
    id: 'pe_obs_edema',
    subMode: 'obstetrics',
    subGroup: 'معاینه اندام‌ها و رفلکس‌ها (DTR)',
    subGroupEn: 'Extremities & Deep Tendon Reflexes (DTR)',
    en: 'Peripheral / Pretibial / Generalized Edema',
    fa: 'ادم اندام‌ها، پره‌تیبیال یا ژنرالیزه',
    isCore: true,
    normalState: -1,
    detailHint: 'ادم گوده‌گذار پره‌تیبیال (+1 تا +4) یا ادم دست و صورت',
    detailHintEn: 'Pretibial pitting edema (+1 to +4) or facial/hand edema',
    isInternalPelvic: false,
    source: '[REF]'
  },
  {
    id: 'pe_obs_dtr_clonus',
    subMode: 'obstetrics',
    subGroup: 'معاینه اندام‌ها و رفلکس‌ها (DTR)',
    subGroupEn: 'Extremities & Deep Tendon Reflexes (DTR)',
    en: 'Deep Tendon Reflexes (DTR) & Ankle Clonus',
    fa: 'رفلکس‌های تاندونی عمقی (DTR) و کلونوس',
    isCore: true,
    normalState: 1,
    detailHint: 'نرمال: +2 قرینه بدون کلونوس؛ هایپررفلکسی +3/+4 یا کلونوس؛ فقدان DTR در مسمومیت MgSO4',
    detailHintEn: 'Normal +2 symmetric without clonus; +3/+4 hyperreflexia or clonus in severe PEC',
    isInternalPelvic: false,
    source: '[REF]'
  },

  // 5. GYNECOLOGIC BREAST & ABDOMINAL EXAM (2)
  {
    id: 'pe_gyn_breasts',
    subMode: 'gynecology',
    subGroup: 'معاینه پستان و شکم',
    subGroupEn: 'Breast & Abdominal Exam',
    en: 'Breast & Axillary Exam',
    fa: 'معاینه پستان‌ها و آگزیلا',
    isCore: false,
    normalState: 1,
    detailHint: 'قرینه، بدون توده، تندرنس، گالاکتوره یا لنفادنوپاتی آگزیلاری',
    detailHintEn: 'Symmetric, no palpable masses, tenderness, galactorrhea, or axillary LAD',
    isInternalPelvic: false,
    source: '[REF]'
  },
  {
    id: 'pe_gyn_abdomen',
    subMode: 'gynecology',
    subGroup: 'معاینه پستان و شکم',
    subGroupEn: 'Breast & Abdominal Exam',
    en: 'Abdominal Exam (Masses, Tenderness, Scars)',
    fa: 'معاینه شکم (توده، تندرنس سوپراپوبیک/ایلیاک، اسکار جراحی)',
    isCore: true,
    normalState: 1,
    detailHint: 'نرم، بدون تندرنس/ریباند/گاردینگ، بدون توده یا ارگانومگالی؛ اسکار جراحی',
    detailHintEn: 'Soft, non-tender, no rebound/guarding, no palpable mass; document surgical scars',
    isInternalPelvic: false,
    source: '[REF]'
  },

  // 6. GYNECOLOGIC SPECULUM EXAM (4)
  {
    id: 'pe_gyn_vulva_perineum',
    subMode: 'both',
    subGroup: 'معاینه با اسپکولوم و ژنیتال خارجی',
    subGroupEn: 'External Genitalia & Speculum Exam',
    en: 'Inspection of Vulva & Perineum (Lesions, Prolapse, Bartholin)',
    fa: 'بررسی ظاهر ولو و پرینه و ضایعات موجود',
    isCore: true,
    normalState: 1,
    detailHint: 'ولو و پرینه طبیعی، بدون زخم، کندیلوم، توده بارتولن یا پرولاپس',
    detailHintEn: 'Normal vulva & perineum without lesions, ulcers, condyloma, Bartholin mass, or prolapse',
    isInternalPelvic: false,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_speculum_cervix_vagina',
    subMode: 'both',
    subGroup: 'معاینه با اسپکولوم و ژنیتال خارجی',
    subGroupEn: 'External Genitalia & Speculum Exam',
    en: 'Appearance of Cervix & Vaginal Walls on Speculum',
    fa: 'ظاهر سرویکس و دیواره‌های واژن در معاینه با اسپکولوم',
    isCore: true,
    normalState: 1,
    detailHint: 'مخاط واژن و سرویکس صورتی‌رنگ و طبیعی، بدون پولیپ، زخم یا تومور',
    detailHintEn: 'Normal pink vaginal walls & smooth cervix without polyps, ulcers, or lesions',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_speculum_vb',
    subMode: 'both',
    subGroup: 'معاینه با اسپکولوم و ژنیتال خارجی',
    subGroupEn: 'External Genitalia & Speculum Exam',
    en: 'Presence and Amount of Vaginal Bleeding (VB) on Speculum',
    fa: 'وجود یا عدم وجود خونریزی واژینال (VB) و توصیف مقدار آن',
    isCore: true,
    normalState: -1,
    detailHint: 'خونریزی فعال ندارد / لکه‌بینی / خونریزی متوسط یا شدید با لخته',
    detailHintEn: 'No active bleeding / spotting / moderate or heavy bleeding with clots',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_speculum_discharge',
    subMode: 'both',
    subGroup: 'معاینه با اسپکولوم و ژنیتال خارجی',
    subGroupEn: 'External Genitalia & Speculum Exam',
    en: 'Cervicitis or Vaginal Discharge on Speculum',
    fa: 'ترشحات سرویسیت یا ترشحات واژینال',
    isCore: true,
    normalState: -1,
    detailHint: 'فاقد ترشح پاتولوژیک یا سرویسیت / ترشح چرکی، پنیری، کف‌آلود؛ Pooling / Fern / Nitrazine',
    detailHintEn: 'No mucopurulent cervicitis or abnormal discharge / Pooling, Fern, Nitrazine tests',
    isInternalPelvic: true,
    source: '[UNI]'
  },

  // 7. GYNECOLOGIC BIMANUAL PELVIC EXAM (5)
  {
    id: 'pe_gyn_bimanual_uterus',
    subMode: 'gynecology',
    subGroup: 'معاینه دودستی لگن (Bimanual Exam)',
    subGroupEn: 'Bimanual Pelvic Exam',
    en: 'Uterine Size, Borders, Surface Regularity & Position (AV/RV)',
    fa: 'سایز، حدود، منظم بودن سطوح و آنته‌ورسه/رترورسه بودن رحم',
    isCore: true,
    normalState: 1,
    detailHint: 'سایز طبیعی یا بزرگ معادل X هفته، حدود مشخص، سطوح منظم/نامنظم، آنته‌ورسه/رترورسه',
    detailHintEn: 'Size (normal or X-week gestational size), borders, regular/irregular contour, AV/RV',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_bimanual_cervix_mobility',
    subMode: 'gynecology',
    subGroup: 'معاینه دودستی لگن (Bimanual Exam)',
    subGroupEn: 'Bimanual Pelvic Exam',
    en: 'Cervical Consistency & Mobility (Mobile vs. Fixed)',
    fa: 'قوام سرویکس و متحرک یا فیکس بودن آن',
    isCore: true,
    normalState: 1,
    detailHint: 'قوام طبیعی و متحرک (Mobile) یا فیکس‌شده (Fixed)',
    detailHintEn: 'Normal firm consistency and freely mobile vs. fixed',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_bimanual_cmt',
    subMode: 'gynecology',
    subGroup: 'معاینه دودستی لگن (Bimanual Exam)',
    subGroupEn: 'Bimanual Pelvic Exam',
    en: 'Cervical Motion Tenderness (CMT)',
    fa: 'تندرنس حرکت سرویکس (CMT)',
    isCore: true,
    normalState: -1,
    detailHint: 'CMT منفی | CMT مثبت (به نفع PID، EP پاره یا کیست هموراژیک)',
    detailHintEn: 'CMT negative vs. CMT positive (PID, ruptured EP, hemorrhagic cyst)',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_bimanual_adnexa',
    subMode: 'gynecology',
    subGroup: 'معاینه دودستی لگن (Bimanual Exam)',
    subGroupEn: 'Bimanual Pelvic Exam',
    en: 'Adnexal Tenderness & Mobility (Free vs. Fixed / Mass)',
    fa: 'تندرنس آدنکس‌ها و Free یا Fix بودن آدنکس‌ها',
    isCore: true,
    normalState: 1,
    detailHint: 'آدنکس‌های دو طرف آزاد (Free)، بدون تندرنس و توده [یا توده X سانتی‌متری فیکس/تندر]',
    detailHintEn: 'Bilateral adnexa Free, non-tender, without palpable mass',
    isInternalPelvic: true,
    source: '[UNI]'
  },
  {
    id: 'pe_gyn_rectovaginal_culdesac',
    subMode: 'gynecology',
    subGroup: 'معاینه دودستی لگن (Bimanual Exam)',
    subGroupEn: 'Bimanual Pelvic Exam',
    en: 'Cul-de-sac (Pouch of Douglas) & Rectovaginal Exam',
    fa: 'معاینه بن‌بست دوگلاس (Cul-de-sac) و رکتوواژینال',
    isCore: false,
    normalState: 1,
    detailHint: 'بن‌بست خلفی آزاد، بدون پری (Fullness) و ندولاریته',
    detailHintEn: 'Cul-de-sac free, no fullness or uterosacral nodularity',
    isInternalPelvic: true,
    source: '[REF]'
  }
];

export const OBGYN_MEDICATIONS_DELTA = [
  { id: 'med_oxytocin', en: 'Oxytocin (Syntocinon)', fa: 'اکسی‌توسین (سینتوسینون)', category: 'Uterotonic', commonDose: '10–30 IU in 1000 mL Ringer / IV infusion', aliases: 'اکسی توسین سینتوسینون امپول فشار زایمان oxytocin syntocinon pitocin' },
  { id: 'med_misoprostol', en: 'Misoprostol (Cytotec)', fa: 'میزوپروستول (سایتوتک)', category: 'Prostaglandin E1', commonDose: '25–50 mcg PV/SL (Q4-6h) or 600–800 mcg PR/SL for PPH', aliases: 'میزوپروستول سایتوتک سقط القا misoprostol cytotec' },
  { id: 'med_methylergonovine', en: 'Methylergonovine (Methergine)', fa: 'متیل‌ارگونوین (مترژن)', category: 'Uterotonic (کنتراندیکه در HTN)', commonDose: '0.2 mg IM Q2-4h', aliases: 'متیل ارگونوین مترژن خونریزی رحم methylergonovine methergine' },
  { id: 'med_carboprost', en: 'Carboprost (Hemabate / PGF2α)', fa: 'کاربوپروست (همابیت)', category: 'Uterotonic (کنتراندیکه در آسم)', commonDose: '250 mcg IM', aliases: 'کاربوپروست همابیت پي جي اف ٢ الفا carboprost hemabate' },
  { id: 'med_mgso4', en: 'Magnesium Sulfate (MgSO4)', fa: 'سولفات منیزیم (پروتکل پریچارد / زوسپان)', category: 'Anticonvulsant / Neuroprotection / Tocolytic', commonDose: '4g IV loading over 20 min + 1–2 g/h IV maintenance', aliases: 'سولفات منیزیم منیزیم پره اکلامپسی اکلامپسی mgso4 magnesium sulfate' },
  { id: 'med_calcium_gluconate', en: 'Calcium Gluconate 10%', fa: 'گلوکونات کلسیم ۱۰٪ (آنتی‌دوت سولفات منیزیم)', category: 'Antidote', commonDose: '10 mL (1g) IV slow over 10 min', aliases: 'گلوکونات کلسیم مسمومیت منیزیم calcium gluconate' },
  { id: 'med_labetalol', en: 'Labetalol', fa: 'لاببتالول (خوراکی / تزریقی)', category: 'Antihypertensive in Pregnancy', commonDose: '20 mg IV bolus, then 40–80 mg Q10min or 100–400 mg PO BID', aliases: 'لاببتالول فشار خون بارداری labetalol trandate' },
  { id: 'med_hydralazine', en: 'Hydralazine', fa: 'هیدرالازین', category: 'Antihypertensive in Pregnancy', commonDose: '5–10 mg IV Q20min', aliases: 'هیدرالازین فشار بارداری hydralazine' },
  { id: 'med_nifedipine', en: 'Nifedipine (Adalat)', fa: 'نیفدیپین (آدالات)', category: 'Antihypertensive / Tocolytic', commonDose: '10–20 mg PO immediate-release', aliases: 'نیفدیپین ادالات توکولیتیک فشار خون nifedipine adalat' },
  { id: 'med_methyldopa', en: 'Methyldopa (Aldomet)', fa: 'متیل‌دوپا (آلدومت)', category: 'Antihypertensive in Pregnancy', commonDose: '250–500 mg PO BID/TID', aliases: 'متیل دوپا الدومت فشار خون حاملگی methyldopa aldomet' },
  { id: 'med_indomethacin_supp', en: 'Indomethacin (Suppository / PO)', fa: 'شیاف/قرص ایندومتاسین (توکولیتیک زیر ۳۲ هفته)', category: 'Tocolytic / NSAID', commonDose: '50–100 mg PR/PO loading, then 25 mg Q6h max 48h', aliases: 'ایندومتاسین شیاف توکولیتیک زایمان زودرس indomethacin' },
  { id: 'med_betamethasone_obs', en: 'Betamethasone', fa: 'بتامتازون (رسیدگی ریه جنین)', category: 'Antenatal Corticosteroid', commonDose: '12 mg IM Q24h × 2 doses', aliases: 'بتامتازون ریه جنین بتا ال ای ال ام betamethasone' },
  { id: 'med_dexamethasone_obs', en: 'Dexamethasone', fa: 'دگزامتازون (رسیدگی ریه جنین)', category: 'Antenatal Corticosteroid', commonDose: '6 mg IM Q12h × 4 doses', aliases: 'دگزامتازون دگزا ریه جنین dexamethasone' },
  { id: 'med_rhogam', en: 'Anti-D Immunoglobulin (RhoGAM)', fa: 'آمپول روگام (Anti-D Immunoglobulin)', category: 'Rh Isoimmunization Prophylaxis', commonDose: '300 mcg IM at 28w and within 72h postpartum', aliases: 'روگام امپول ار هاش منفی rhogam anti d' },
  { id: 'med_dydrogesterone', en: 'Dydrogesterone (Duphaston)', fa: 'دیدروژسترون (دوفاستون)', category: 'Progestin', commonDose: '10 mg PO BID', aliases: 'دوفاستون دیدروژسترون پروژسترون duphaston dydrogesterone' },
  { id: 'med_progesterone_supp', en: 'Micronized Progesterone (Cyclogest / Utrogestan)', fa: 'شیاف واژینال/رکتال پروژسترون (سایکلوژست ۴۰۰ / اوتروژستان ۲۰۰)', category: 'Progestin', commonDose: '200–400 mg PV/PR daily', aliases: 'سایکلوژست اوتروژستان شیاف پروژسترون cyclogest utrogestan progesterone' },
  { id: 'med_proluton', en: 'Hydroxyprogesterone Caproate (Proluton / Femolife)', fa: 'آمپول پرولوتون (فمولایف)', category: 'Progestin', commonDose: '250 mg IM weekly', aliases: 'پرولوتون فمولایف امپول جلوگیری از زایمان زودرس proluton femolife' },
  { id: 'med_medroxyprogesterone', en: 'Medroxyprogesterone Acetate (Provera / DMPA)', fa: 'مدروکسی‌پروژسترون (پروورا خوراکی / آمپول دپوپروورا)', category: 'Progestin', commonDose: '5–10 mg PO daily (10–14 days/month) or 150 mg IM Q3M', aliases: 'مدروکسی پروژسترون پروورا دپوپروورا medroxyprogesterone provera dmpa' },
  { id: 'med_megestrol', en: 'Megestrol Acetate (Megace)', fa: 'مژسترول استات (مگاس)', category: 'Progestin (درمان هایپرپلازی اندومتر)', commonDose: '40–160 mg PO daily', aliases: 'مژسترول مگاس هایپرپلازی megestrol megace' },
  { id: 'med_ocp_ld_hd', en: 'Combined OCP (LD / HD / Ethinylestradiol + Levonorgestrel)', fa: 'قرص LD / HD', category: 'Combined Oral Contraceptive', commonDose: '1 tab PO daily × 21 days', aliases: 'ال دی اچ دی قرص ضدبارداری اوسپ او سی پی ld hd ocp' },
  { id: 'med_ocp_yasmin_yaz', en: 'Drospirenone + Ethinylestradiol (Yasmin / Yaz / Roketin)', fa: 'قرص یاسمین / یاز (روکتین)', category: 'Combined OCP', commonDose: '1 tab PO daily', aliases: 'یاسمین یاز روکتین دروسپیرنون yasmin yaz roketin drospirenone' },
  { id: 'med_ocp_diane', en: 'Cyproterone Compound (Diane-35 / Daphne)', fa: 'قرص سیپروترون کامپاند (دیان / دافنه)', category: 'Anti-androgen OCP', commonDose: '1 tab PO daily', aliases: 'سیپروترون کامپاند دیان دافنه پی سی او اس diane daphne cyproterone' },
  { id: 'med_ocp_cerazette', en: 'Desogestrel / Lynestrenol (Cerazette / Exluton)', fa: 'قرص شیردهی (سرازت / لاینسترونول)', category: 'Progestin-Only Pill (POP)', commonDose: '1 tab PO daily continuously', aliases: 'قرص شیردهی سرازت لاینسترونول اکسلوتون cerazette lynestrenol' },
  { id: 'med_conjugated_estrogens', en: 'Conjugated Equine Estrogens (Premarin)', fa: 'استروژن کنژوگه (پرمارین خوراکی/وریدی/کرم واژینال)', category: 'Estrogen', commonDose: '25 mg IV Q4-6h (acute severe AUB) or 0.625–1.25 mg PO', aliases: 'پرمارین استروژن کنژوگه خونریزی رحمی premarin estrogen' },
  { id: 'med_tranexamic_acid', en: 'Tranexamic Acid (Transid)', fa: 'ترانگزامیک اسید (ترنسید)', category: 'Antifibrinolytic (درمان AUB و PPH)', commonDose: '500–1000 mg PO TID during menses or 1g IV over 10 min', aliases: 'ترانگزامیک اسید ترنسید خونریزی tranexamic transid' },
  { id: 'med_letrozole', en: 'Letrozole (Femara)', fa: 'لتروزول (فمارا - تحریک تخمک‌گذاری)', category: 'Aromatase Inhibitor', commonDose: '2.5–5 mg PO daily (cycle days 3–7)', aliases: 'لتروزول فمارا تحریک تخمک گذاری نازایی letrozole femara' },
  { id: 'med_clomiphene', en: 'Clomiphene Citrate (Clomid)', fa: 'کلومیفن سیترات', category: 'SERM / Ovulation Induction', commonDose: '50–100 mg PO daily (cycle days 3–7)', aliases: 'کلومیفن کلومید تحریک تخمک گذاری نازایی clomiphene clomid' },
  { id: 'med_hcg_ovitrelle', en: 'hCG / Choriogonadotropin Alfa (PDpreg / Ovitrelle)', fa: 'آمپول hCG (پی‌دی‌پرگ / اوویترل)', category: 'Gonadotropin (آزادسازی تخمک)', commonDose: '5000–10,000 IU IM or 250 mcg SC', aliases: 'امپول اچ سی جی پی دی پرگ اوویترل تخمک گذاری hcg pdpreg ovitrelle' },
  { id: 'med_dienogest', en: 'Dienogest (Visanne)', fa: 'دینوژست (ویزان - درمان آندومتریوز)', category: 'Progestin', commonDose: '2 mg PO daily', aliases: 'دینوژست ویزان اندومتریوز dienogest visanne' },
  { id: 'med_gnrh_agonist', en: 'Triptorelin / Leuprolide (Diphereline / Microrelin)', fa: 'آمپول دیفرلین / میکرورلین (آگونیست GnRH)', category: 'GnRH Agonist', commonDose: '3.75 mg IM monthly or 11.25 mg Q3M', aliases: 'دیفرلین میکرورلین تریپتورلین لوپرولید میوم اندومتریوز diphereline microrelin' },
  { id: 'med_methotrexate_ep', en: 'Methotrexate (MTX for Ectopic Pregnancy)', fa: 'متوترکسات (پروتکل تک‌دوز یا دودوز EP)', category: 'Antimetabolite', commonDose: '50 mg/m² IM (Single-dose protocol)', aliases: 'متوترکسات حاملگی خارج رحمی ای پی methotrexate mtx ectopic' },
  { id: 'med_cabergoline', en: 'Cabergoline (Dostinex)', fa: 'کابرگولین (داستینکس - مهار شیردهی / هایپرپرولاکتینمی)', category: 'Dopamine Agonist', commonDose: '0.25–0.5 mg PO twice weekly (or 1 mg single dose to suppress lactation)', aliases: 'کابرگولین داستینکس پرولاکتین شیر خشک کن cabergoline dostinex' },
  { id: 'med_fefol_pregna', en: 'Ferrous Sulfate + Folic Acid (Fefol / Pregnacare)', fa: 'کپسول ففول / پرگناکر / آهن و اسیدفولیک', category: 'Prenatal Supplement', commonDose: '1 cap PO daily', aliases: 'ففول پرگناکر آهن اسید فولیک کم خونی بارداری fefol pregnacare iron' },
  { id: 'med_vitamin_b6_doxylamine', en: 'Pyridoxine + Doxylamine (Diclegis / Demitrin)', fa: 'ویتامین B6 / دمیترین (تهوع بارداری)', category: 'Antiemetic in Pregnancy', commonDose: '10–25 mg PO TID', aliases: 'دمیترین ویتامین ب۶ دایسلجیس تهوع بارداری diclegis demitrin b6' },
  { id: 'med_clotrimazole_vag', en: 'Clotrimazole Vaginal Cream / Tablet', fa: 'کرم یا قرص واژینال کلوتریمازول ۱٪ و ۲٪', category: 'Antifungal', commonDose: '1 applicator PV nightly × 3–7 nights', aliases: 'کلوتریمازول کرم واژینال قارچ کاندیدا clotrimazole' },
  { id: 'med_metronidazole_vag', en: 'Metronidazole Vaginal Gel / Tablet', fa: 'ژل/قرص واژینال یا خوراکی مترونیدازول', category: 'Antiprotozoal / Anaerobic', commonDose: '500 mg PO BID × 7 days', aliases: 'مترونیدازول ژل واژینال باکتریال واژینوز تریکوموناس metronidazole' },
  { id: 'med_cefazolin_prophylaxis', en: 'Cefazolin (Keflin)', fa: 'سفازولین (پروفیلاکسی جراحی/سزارین و GBS)', category: 'Cephalosporin', commonDose: '2g IV 60 min prior to skin incision', aliases: 'سفازولین کفلین انتی بیوتیک سزارین cefazolin keflin' }
];

export const OBGYN_LABS_DELTA = [
  { id: 'lab_bhcg_quant', en: 'Quantitative Serum Beta-hCG (β-hCG Titration)', fa: 'تیتر بتا (Quantitative β-hCG)', unit: 'mIU/mL', normalRange: 'Non-pregnant <5; 48h doubling ≥53–66% in viable IUP', aliases: 'تیتر بتا بارداری حامله خارج رحمی bhcg hcg' },
  { id: 'lab_ogtt_75g', en: '75g 2-Hour Oral Glucose Tolerance Test (OGTT)', fa: 'تست تحمل گلوکز ۷۵ گرمی دو ساعته (OGTT 75g)', unit: 'mg/dL', normalRange: 'FBS <92, 1h <180, 2h <153', aliases: 'تست قند بارداری ۷۵ گرم جی تی تی ogtt gdm' },
  { id: 'lab_gct_50g', en: '50g 1-Hour Glucose Challenge Test (GCT)', fa: 'تست چالش گلوکز ۵۰ گرمی یک‌ساعته (GCT 50g)', unit: 'mg/dL', normalRange: '<130–140 mg/dL', aliases: 'چالش قند ۵۰ گرم gct' },
  { id: 'lab_urine_pr_cr_ratio', en: 'Spot Urine Protein-to-Creatinine Ratio (Pr/Cr)', fa: 'نسبت پروتئین به کراتینین ادرار رندوم (Urine Pr/Cr)', unit: 'mg/mg', normalRange: '<0.3 (≥0.3 preeclampsia)', aliases: 'نسبت پروتئین کراتینین ادرار پره اکلامپسی pr cr' },
  { id: 'lab_24h_urine_protein', en: '24-Hour Urine Protein & Volume', fa: 'پروتئین و حجم ادرار ۲۴ ساعته', unit: 'mg/24h', normalRange: '<300 mg/24h in pregnancy', aliases: 'پروتئین ادرار ۲۴ ساعته دفع پروتئین' },
  { id: 'lab_indirect_coombs', en: 'Indirect Coombs Test (Antibody Screen)', fa: 'تست کومبس غیرمستقیم (Indirect Coombs)', unit: 'Titer', normalRange: 'Negative', aliases: 'کومبس غیر مستقیم ار هاش منفی coombs' },
  { id: 'lab_kleihauer_betke', en: 'Kleihauer-Betke Acid Elution Test', fa: 'تست کلایهاور-بتکه (خونریزی جنینی-مادری)', unit: '% Fetal RBCs', normalRange: 'Negative', aliases: 'کلایهاور بتکه خونریزی جنین مادر kleihauer' },
  { id: 'lab_gbs_rectovaginal', en: 'Rectovaginal GBS Culture (35–37w)', fa: 'کشت واژینال-رکتال استرپتوکوک گروه B (GBS)', unit: 'Qualitative', normalRange: 'Negative', aliases: 'کشت جی بی اس استرپتوکوک گروه بی gbs' },
  { id: 'lab_pap_smear_lbc', en: 'Liquid-Based Pap Smear (Bethesda System)', fa: 'تست پاپ‌اسمیر (Pap Smear)', unit: 'Bethesda', normalRange: 'NILM', aliases: 'پاپ اسمیر دهانه رحم غربالگری سرویکس pap smear' },
  { id: 'lab_hpv_cobas', en: 'High-Risk HPV DNA Genotyping', fa: 'تست تعیین ژنوتایپ HPV', unit: 'Qualitative', normalRange: 'Negative for HR-HPV', aliases: 'اچ پی وی زگیل تناسلی سرویکس hpv' },
  { id: 'lab_ca125', en: 'CA-125', fa: 'تومورمارکر CA-125', unit: 'U/mL', normalRange: '<35 U/mL', aliases: 'سی ای ۱۲۵ تخمدان اندومتریوز ca125' },
  { id: 'lab_he4_roma', en: 'HE4 & ROMA Index', fa: 'تومورمارکر HE4 و شاخص ROMA', unit: 'pmol/L', normalRange: 'Premenopausal <70; Postmenopausal <140', aliases: 'روما اچ ای ۴ تومور تخمدان he4 roma' },
  { id: 'lab_cea_ca19_9_afp_ldh_inhibin', en: 'Ovarian Germ Cell / Mucinous Panel (AFP, LDH, Inhibin, CEA, CA19-9)', fa: 'پنل تومورمارکرهای تخمدان (AFP, LDH, Inhibin, CEA, CA19-9)', unit: 'Panel', normalRange: 'Within reference limits', aliases: 'مارکر تخمدان اینهیبین ال دی اچ اف پی inhibin' },
  { id: 'lab_amh', en: 'Anti-Müllerian Hormone (AMH)', fa: 'ذخیره تخمدان (AMH)', unit: 'ng/mL', normalRange: '1.0–3.5 ng/mL', aliases: 'ای ام اچ ذخیره تخمدان نازایی amh' },
  { id: 'lab_fsh_lh_e2', en: 'Day-3 FSH, LH, Estradiol (E2)', fa: 'هورمون‌های روز ۳ سیکل (FSH, LH, Estradiol)', unit: 'mIU/mL | pg/mL', normalRange: 'Basal FSH <10 mIU/mL', aliases: 'اف اس اچ ال اچ استرادیول روز سوم سیکل fsh lh e2' },
  { id: 'lab_prolactin', en: 'Serum Prolactin (PRL)', fa: 'پرولاکتین سرم (PRL)', unit: 'ng/mL', normalRange: '<25 ng/mL (non-pregnant)', aliases: 'پرولاکتین شیر گالاکتوره prolactin prl' },
  { id: 'lab_androgen_panel', en: 'Total/Free Testosterone, DHEA-S, 17-OH-Progesterone', fa: 'پنل آندروژن (تستوسترون، DHEA-S، 17-OHP)', unit: 'Panel', normalRange: '17-OHP <200 ng/dL', aliases: 'تستوسترون دی هیدرو اپی اندروسترون پی سی او اس dheas testosterone 17ohp' },
  { id: 'lab_torch_panel', en: 'TORCH IgG / IgM Serology', fa: 'پنل تورچ (Toxoplasma, Rubella, CMV, HSV)', unit: 'Serology', normalRange: 'IgM Negative', aliases: 'تورچ توکسوپلاسما روبلا سیتومگالوویروس torch cmv' },
  { id: 'lab_fern_nitrazine_amnisure', en: 'Bedside ROM Tests (Pooling, Nitrazine pH, Fern Test, AmniSure)', fa: 'تست‌های تشخیص پارگی کیسه آب (فرن، نیترازین، آمنی‌شور)', unit: 'Qualitative', normalRange: 'Negative', aliases: 'فرن نیترازین امنیشور کیسه اب پارگی fern nitrazine amnisure' },
  { id: 'lab_wet_mount_koh_whiff', en: 'Vaginal Wet Mount, 10% KOH Whiff Test & Vaginal pH', fa: 'لام مرطوب واژینال، تست KOH (Whiff) و pH واژن', unit: 'Microscopy', normalRange: 'pH 3.8–4.5, Normal flora', aliases: 'لام مرطوب ویف واژینیت کاندیدا تریکوموناس koh whiff wet mount' }
];

export const OBGYN_PSH_DELTA = [
  { id: 'psh_cs', en: 'Cesarean Section (CS)', fa: 'سزارین (CS)', aliases: 'سزارین زایمان سزارین cesarean cs' },
  { id: 'psh_nvd_episiotomy', en: 'Normal Vaginal Delivery with Episiotomy (NVD)', fa: 'زایمان طبیعی واژینال همراه با اپیزیوتومی (NVD)', aliases: 'زایمان طبیعی اپیزیوتومی nvd nd' },
  { id: 'psh_dnc', en: 'Dilation & Curettage (D&C)', fa: 'کورتاژ تشخیصی یا تخلیه‌ای رحم (D&C)', aliases: 'کورتاژ تشخیصی تخلیه d&c dnc curettage' },
  { id: 'psh_tah_bso', en: 'Total Abdominal Hysterectomy ± BSO (TAH ± BSO)', fa: 'هیسترکتومی توتال شکمی همراه یا بدون برداشتن تخمدان‌ها (TAH ± BSO)', aliases: 'هیسترکتومی رحم برداری tah bso' },
  { id: 'psh_tvh_tlh', en: 'Vaginal or Laparoscopic Hysterectomy (TVH / TLH)', fa: 'هیسترکتومی واژینال یا لاپاروسکوپیک (TVH / TLH)', aliases: 'هیسترکتومی واژینال لاپاروسکوپی tvh tlh' },
  { id: 'psh_myomectomy', en: 'Myomectomy (Abdominal, Laparoscopic, or Hysteroscopic)', fa: 'میومکتومی (برداشتن فیبروم رحمی)', aliases: 'میومکتومی فیبروم رحم myomectomy' },
  { id: 'psh_ovarian_cystectomy', en: 'Ovarian Cystectomy / Oophorectomy', fa: 'سیستکتومی تخمدان / اوفورکتومی', aliases: 'کیست تخمدان سیستکتومی اوفورکتومی cystectomy oophorectomy' },
  { id: 'psh_salpingectomy_ep', en: 'Salpingectomy / Salpingostomy (for Ectopic Pregnancy)', fa: 'سالپنگکتومی / سالپنگوستومی (جراحی حاملگی خارج‌رحمی)', aliases: 'سالپنگکتومی سالپنگوستومی لوله رحم خارج رحمی salpingectomy' },
  { id: 'psh_cerclage', en: 'Cervical Cerclage (McDonald / Shirodkar)', fa: 'سرکلاژ سرویکس (دوختن دهانه رحم)', aliases: 'سرکلاژ دوختن دهانه رحم مک دونالد cerclage' },
  { id: 'psh_tl', en: 'Bilateral Tubal Ligation (TL)', fa: 'توبال لیگاسیون (بستن لوله‌های رحمی - TL)', aliases: 'بستن لوله توبال لیگاسیون tl tubal ligation' },
  { id: 'psh_hysteroscopy', en: 'Diagnostic / Operative Hysteroscopy', fa: 'هیستروسکوپی تشخیصی یا درمانی (پولیپکتومی / رزکسیون سپتوم)', aliases: 'هیستروسکوپی پولیپ سپتوم رحم hysteroscopy' },
  { id: 'psh_colposcopy_leep', en: 'Colposcopy / LEEP / Cold-Knife Conization', fa: 'کولپوسکوپی / لیپ (LEEP) / کونیزاسیون سرویکس', aliases: 'کولپوسکوپی لیپ کونیزاسیون دهانه رحم colposcopy leep' },
  { id: 'psh_apr_colporrhaphy', en: 'Anterior and Posterior Colporrhaphy (APR)', fa: 'کلپورافی قدامی و خلفی (تعمیر سیستوسل و رکتوسل - APR)', aliases: 'کلپورافی افتادگی مثانه رکتوم ای پی ار apr colporrhaphy' },
  { id: 'psh_tvt_tot', en: 'Midurethral Sling (TVT / TOT)', fa: 'جراحی اسلینگ مجرا (TVT / TOT جهت بی‌اختیاری ادراری استرسی)', aliases: 'اسلینگ تی وی تی تی او تی بی اختیاری ادرار tvt tot' },
  { id: 'psh_bartholin_marsupialization', en: 'Bartholin Gland Drainage / Marsupialization', fa: 'درناژ یا مارسوپیالیزاسیون کیست/آبسه بارتولن', aliases: 'بارتولن ابسه کیست مارسوپیالیزاسیون bartholin' }
];

export const OBGYN_PMH_DELTA = [
  { id: 'pmh_pcos', en: 'Polycystic Ovary Syndrome (PCOS)', fa: 'سندرم تخمدان پلی‌کیستیک (PCOS)', aliases: 'تخمدان پلی کیستیک تنبلی تخمدان پی سی او pcos' },
  { id: 'pmh_endometriosis', en: 'Endometriosis', fa: 'آندومتریوز', aliases: 'اندومتریوز کیست شکلاتی endometriosis' },
  { id: 'pmh_adenomyosis', en: 'Adenomyosis', fa: 'آدنومیوز', aliases: 'ادنومیوز بزرگی رحم adenomyosis' },
  { id: 'pmh_uterine_fibroids', en: 'Uterine Leiomyoma (Fibroids)', fa: 'فیبروم (میوم) رحمی', aliases: 'فیبروم میوم لیومیوم رحم fibroid myoma' },
  { id: 'pmh_endometrial_hyperplasia', en: 'Endometrial Hyperplasia', fa: 'هایپرپلازی اندومتر', aliases: 'هایپرپلازی اندومتر ضخامت رحم endometrial hyperplasia' },
  { id: 'pmh_prior_preeclampsia', en: 'Prior Preeclampsia / Eclampsia / HELLP Syndrome', fa: 'سابقه پره‌اکلامپسی / اکلامپسی / سندرم HELLP', aliases: 'پره اکلامپسی مسمومیت حاملگی اکلامپسی هلپ preeclampsia hellp' },
  { id: 'pmh_prior_gdm', en: 'Prior Gestational Diabetes Mellitus (GDM)', fa: 'سابقه دیابت بارداری (GDM)', aliases: 'دیابت بارداری قند بارداری gdm' },
  { id: 'pmh_rpl', en: 'Recurrent Pregnancy Loss (RPL)', fa: 'سقط مکرر (RPL)', aliases: 'سقط مکرر rpl recurrent pregnancy loss' },
  { id: 'pmh_infertility', en: 'Primary or Secondary Infertility', fa: 'سابقه نازایی اولیه یا ثانویه', aliases: 'نازایی ناباروری infertility' },
  { id: 'pmh_cervical_insufficiency', en: 'Cervical Insufficiency', fa: 'نارسایی سرویکس', aliases: 'نارسایی سرویکس دهانه رحم سرکلاژ cervical insufficiency' },
  { id: 'pmh_pid_sti', en: 'Pelvic Inflammatory Disease (PID)', fa: 'سابقه بیماری التهابی لگن (PID)', aliases: 'عفونت لگن بیماری التهابی لگن پی ای دی pid' },
  { id: 'pmh_aps_thrombophilia', en: 'Antiphospholipid Syndrome (APS) / Thrombophilia', fa: 'سندرم آنتی‌فسفولیپید (APS) / ترومبوفیلی', aliases: 'انتی فسفولیپید ترومبوفیلی انعقاد لخته سقط aps thrombophilia' }
];

export const OBGYN_CONTRACEPTION_OPTIONS = [
  { val: 'none', fa: 'بدون روش پیشگیری', en: 'None' },
  { val: 'natural_withdrawal', fa: 'روش طبیعی (منقطع / Withdrawal)', en: 'Natural (Withdrawal)' },
  { val: 'condom', fa: 'کاندوم (Condom)', en: 'Condom' },
  { val: 'ocp_combined', fa: 'قرص ترکیبی (OCP - LD / Yasmin / Yaz)', en: 'Combined Oral Contraceptive Pill (OCP)' },
  { val: 'ocp_progestin_only', fa: 'قرص شیردهی (POP / پروژسترونی)', en: 'Progestin-Only Pill (POP)' },
  { val: 'copper_iud', fa: 'آی‌یودی مسی (Copper IUD)', en: 'Copper IUD' },
  { val: 'mirena_lng_ius', fa: 'آی‌یودی هورمونی (Mirena / LNG-IUS)', en: 'Levonorgestrel IUS (Mirena)' },
  { val: 'dmpa_ampoule', fa: 'آمپول دپوپروورا (DMPA)', en: 'DMPA Injectable' },
  { val: 'tl', fa: 'توبال لیگاسیون (TL / بستن لوله‌ها)', en: 'Bilateral Tubal Ligation (TL)' },
  { val: 'vasectomy', fa: 'وازکتومی همسر', en: 'Partner Vasectomy' }
];

export const OBGYN_DDX_PRESETS = {
  obstetrics: [
    { fa: 'پره‌اکلامپسی همراه با تظاهرات شدید (Preeclampsia with Severe Features)', en: 'Preeclampsia with Severe Features' },
    { fa: 'سندرم HELLP (در حال تکمیل / ناقص)', en: 'HELLP Syndrome (Complete / Partial)' },
    { fa: 'فشار خون حاملگی شدید (Severe Gestational Hypertension)', en: 'Severe Gestational Hypertension' },
    { fa: 'فاز فعال یا نهفته زایمان (Active / Latent Labor)', en: 'Active / Latent Labor' },
    { fa: 'پارگی زودرس کیسه آب (PROM / PPROM)', en: 'Prelabor / Preterm Rupture of Membranes (PROM / PPROM)' },
    { fa: 'جفت سرراهی (Placenta Previa)', en: 'Placenta Previa' },
    { fa: 'دکولمان جفت (Placental Abruption)', en: 'Placental Abruption' },
    { fa: 'زایمان زودرس (Preterm Labor)', en: 'Preterm Labor' },
    { fa: 'کوریوآمنیونیت (Chorioamnionitis)', en: 'Intraamniotic Infection / Chorioamnionitis' },
    { fa: 'محدودیت رشد داخل رحمی (FGR / IUGR)', en: 'Fetal Growth Restriction (FGR)' }
  ],
  gynecology: [
    { fa: 'خونریزی غیرطبیعی رحمی ناشی از لیومیوم (AUB-L)', en: 'Abnormal Uterine Bleeding secondary to Leiomyoma (AUB-L)' },
    { fa: 'هایپرپلازی اندومتر یا بدخیمی اندومتر (AUB-M)', en: 'Endometrial Hyperplasia or Malignancy (AUB-M)' },
    { fa: 'اختلال تخمک‌گذاری (AUB-O)', en: 'Ovulatory Dysfunction (AUB-O)' },
    { fa: 'پولیپ اندومتر یا آدنومیوز (AUB-P / AUB-A)', en: 'Endometrial Polyp or Adenomyosis (AUB-P / AUB-A)' },
    { fa: 'حاملگی خارج‌رحمی (Ectopic Pregnancy - EP)', en: 'Ectopic Pregnancy (EP)' },
    { fa: 'بیماری التهابی لگن / آبسه توبواووارین (PID / TOA)', en: 'Pelvic Inflammatory Disease / Tubo-Ovarian Abscess (PID / TOA)' },
    { fa: 'تورشن آدنکس یا پارگی کیست تخمدان (Adnexal Torsion / Ruptured Cyst)', en: 'Adnexal Torsion / Ruptured Ovarian Cyst' },
    { fa: 'آندومتریوز / کیست اندومتریوما', en: 'Endometriosis / Endometrioma' }
  ]
};

export const ADCA_VAN_DIMLS_PRESETS = {
  aub_standard: {
    labelFa: 'پروتکل استاندارد بستری AUB (۱۷ آیتم دانشگاهی)',
    labelEn: 'Load AUB 17-Item University Orders',
    fa: {
      A_admission: 'بستری در بخش ژنیکولوژی (Gynecology Ward)',
      D_diagnosis: 'AUB (R/O Endometrial Hyperplasia & Submucosal Myoma)',
      C_condition: 'Good',
      A_allergies: 'NKDA (فاقد حساسیت دارویی شناخته‌شده)',
      V_vitals: 'CVS Q4h and chart',
      A_activity: 'RBR (استراحت نسبی)',
      N_nursing: '1) Reserve 2 units Packed Cell (isogroup, iso-Rh)\n2) Check VB and call physician if VB is severe',
      D_diet: 'Regular (NPO from 12 midnight)',
      I_iv: 'IV line fix and Serum Ringer 1 lit IV Q8h',
      M_medications: 'ادامه داروهای هموستاتیک/آهن بر اساس دستور پزشک مقیم و هموگلوبین',
      L_labs: '1) Check β-hCG, CBC, BG & Rh, PT, PTT, INR, Fibrinogen\n2) Check CBC Q6h (تنظیم فواصل بر اساس شدت خونریزی)',
      S_special: '1) Check I/O\n2) گزارش TVS ضمیمه پرونده شود\n3) انجام ECG\n4) مشاوره داخلی و قلب جهت OK عمل در صورت لزوم\n5) Pad test\n6) آمادگی جهت D&C فردا صبح در اتاق عمل'
    },
    en: {
      A_admission: 'Admit to Gynecology Ward',
      D_diagnosis: 'AUB (R/O Endometrial Hyperplasia & Submucosal Myoma)',
      C_condition: 'Good',
      A_allergies: 'No Known Drug Allergies (NKDA)',
      V_vitals: 'CVS Q4h and chart',
      A_activity: 'RBR (Relative Bed Rest)',
      N_nursing: '1) Reserve 2 units Packed RBCs (isogroup, iso-Rh)\n2) Check VB and call physician if VB is severe',
      D_diet: 'Regular (NPO from 12 midnight)',
      I_iv: 'Fix IV line and Serum Ringer 1 L IV Q8h',
      M_medications: 'Hemostatic / oral iron therapy per inpatient physician orders',
      L_labs: '1) Check Beta-hCG, CBC, BG & Rh, PT, PTT, INR, Fibrinogen\n2) Check CBC Q6h (adjust per bleeding severity)',
      S_special: '1) Check I/O\n2) Document TVS report in chart\n3) 12-lead ECG\n4) Internal Medicine / Cardiology preoperative clearance if indicated\n5) Strict Pad test\n6) Prepare for diagnostic D&C tomorrow morning'
    }
  },
  preeclampsia_severe: {
    labelFa: 'پروتکل پره‌اکلامپسی شدید (MgSO4 + Labetalol + ختم بارداری)',
    labelEn: 'Load Severe Preeclampsia Orders',
    fa: {
      A_admission: 'بستری در بخش مراقبت‌های ویژه مامایی / لیبر (High-Risk Labor Ward)',
      D_diagnosis: 'Preeclampsia with Severe Features (R/O HELLP Syndrome)',
      C_condition: 'Critical / Guarded',
      A_allergies: 'NKDA',
      V_vitals: 'کنترل BP هر ۱۵ دقیقه تا پایدارسازی و سپس هر ۱ ساعت؛ کنترل PR، RR، DTR پاتلار، سمع ریه و برون‌ده ادراری هر ۱ ساعت',
      A_activity: 'CBR (استراحت مطلق در تخت در پوزیشن لترال چپ و بالا بودن نرده‌های تخت)',
      N_nursing: '1) فیکس سوند فولی و چارت دقیق جذب و دفع (Strict I/O — اطلاع در صورت UOP <30 mL/h، RR <12/min، فقدان DTR یا BP >=160/110)\n2) رزرو ۲ واحد Packed Cell ایزوگروپ و ایزوارهاش\n3) آماده‌باش آمپول گلوکونات کلسیم ۱۰٪ بر بالین\n4) مانیتورینگ مداوم جنین (Continuous EFM)',
      D_diet: 'NPO جهت آمادگی ختم بارداری / سزارین',
      I_iv: 'تعبیه ۲ خط وریدی مناسب؛ محدودیت کل مایعات وریدی و دارویی به حداکثر 80 mL/h سرم رینگر لاکتات',
      M_medications: '1) Magnesium Sulfate (MgSO4): 4g IV loading over 20 min + 2 g/h IV maintenance infusion\n2) Labetalol 20 mg IV slow push PRN BP >=160/110 (repeat 40 mg in 10 min)\n3) Betamethasone 12 mg IM (if indicated for fetal lung maturity)\n4) Cefazolin 2g IV 60 min prior to CS incision',
      L_labs: 'تکرار سریال CBC (Plt)، AST، ALT، LDH، Cr، Bilirubin، PT، PTT، INR، Fibrinogen هر ۶ ساعت + Spot Urine Pr/Cr',
      S_special: 'اخذ رضایت‌نامه آگاهانه سزارین و ختم بارداری؛ اطلاع به متخصص بیهوشی و سرویس NICU جهت حضور در اتاق عمل'
    },
    en: {
      A_admission: 'Admit to High-Risk Labor & Delivery Unit',
      D_diagnosis: 'Preeclampsia with Severe Features (R/O HELLP Syndrome)',
      C_condition: 'Critical / Guarded',
      A_allergies: 'NKDA',
      V_vitals: 'BP Q15min until stabilized then Q1h; PR, RR, patellar DTRs, lung auscultation, and UOP Q1h',
      A_activity: 'CBR in left lateral decubitus with padded bed rails up',
      N_nursing: '1) Indwelling Foley catheter with strict hourly I/O (notify MD if UOP <30 mL/h, RR <12/min, absent DTRs, or BP >=160/110)\n2) Reserve 2 units crossmatched Packed RBCs\n3) Keep 10% Calcium Gluconate (10 mL) at bedside\n4) Continuous electronic fetal monitoring (EFM)',
      D_diet: 'NPO for delivery / cesarean section',
      I_iv: 'Establish 2 large-bore IV lines; restrict total IV + medication fluid intake to <=80 mL/h Lactated Ringer',
      M_medications: '1) Magnesium Sulfate: 4g IV loading over 20 min, then 2 g/h continuous IV infusion\n2) Labetalol 20 mg IV over 2 min PRN BP >=160/110 (repeat 40 mg in 10 min)\n3) Betamethasone 12 mg IM if indicated\n4) Cefazolin 2g IV 60 min prior to incision',
      L_labs: 'Serial CBC (Plt), AST, ALT, LDH, Cr, Bilirubin, PT, PTT, INR, Fibrinogen Q6h + Spot Urine Pr/Cr',
      S_special: 'Obtain informed surgical consent for delivery / CS; notify Anesthesiology and NICU teams'
    }
  },
  labor_rom_admission: {
    labelFa: 'پروتکل استاندارد پذیرش لیبر فعال و ROM',
    labelEn: 'Load Labor / ROM Admission Orders',
    fa: {
      A_admission: 'بستری در بخش زایمان (Labor & Delivery Ward)',
      D_diagnosis: 'Active Labor / Rupture of Membranes (ROM)',
      C_condition: 'Satisfactory',
      A_allergies: 'NKDA',
      V_vitals: 'کنترل علائم حیاتی (BP-PR-RR-T) هر ۲ ساعت (و کنترل T هر ۲ ساعت در ROM)',
      A_activity: 'آزاد در بخش / تشویق به تغییر پوزیشن و لترال چپ هنگام استراحت',
      N_nursing: 'کنترل FHR و انقباضات رحمی بر اساس فاز لیبر؛ بررسی ترشحات واژینال از نظر مکونیوم یا خونریزی؛ اجتناب از معاینات مکرر TV در صورت ROM',
      D_diet: 'رژیم مایعات شفاف / سبک در فاز نهفته؛ NPO در فاز فعال یا نزدیک به زایمان',
      I_iv: 'تعبیه خط وریدی مناسب (Heparin Lock یا سرم رینگر لاکتات در صورت القا/نیاز)',
      M_medications: 'در صورت اندیکاسیون GBS یا PPROM: آنتی‌بیوتیک پروفیلاکسی مطابق پروتکل (آمپی‌سیلین / اریترومایسین یا سفازولین)',
      L_labs: 'CBC، BG & Rh (تست کومبس در صورت Rh-)، آزمایشات روتین پذیرش زایمان',
      S_special: 'ثبت پارتوگراف (Partograph)؛ ارزیابی مداوم NST/EFM و ثبت Bishop Score و دیلاتاسیون'
    },
    en: {
      A_admission: 'Admit to Labor & Delivery Ward',
      D_diagnosis: 'Active Labor / Rupture of Membranes (ROM)',
      C_condition: 'Satisfactory',
      A_allergies: 'NKDA',
      V_vitals: 'Check BP, PR, RR, and T Q2h (monitor temperature closely in ROM)',
      A_activity: 'Ambulate as tolerated; left lateral tilt when recumbent',
      N_nursing: 'Monitor FHR and uterine contractions per labor stage; observe for meconium or VB; minimize digital TV exams in ROM',
      D_diet: 'Clear liquids in early labor; NPO during active labor or per anesthesia guidance',
      I_iv: 'Establish patent IV access (Lactated Ringer if augmentation/hydration required)',
      M_medications: 'GBS / PPROM antibiotic prophylaxis if indicated (Ampicillin / Cefazolin per protocol)',
      L_labs: 'CBC, Blood Group & Rh (Indirect Coombs if Rh-negative), routine admission labs',
      S_special: 'Maintain labor partograph; continuous/serial EFM monitoring and Bishop Score charting'
    }
  }
};
