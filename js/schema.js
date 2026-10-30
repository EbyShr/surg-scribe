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

import { HPI_QUALIFIERS_AND_SYMPTOMS } from './data/hpi-lexicon.js';
import { MASTER_ROS_BANK } from './data/ros-bank.js';
import { MASTER_PE_BANK } from './data/pe-bank.js';

export { HPI_QUALIFIERS_AND_SYMPTOMS, MASTER_ROS_BANK, MASTER_PE_BANK };

let currentSchemaLang = 'fa';

export function getCurrentLang() {
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    const saved = localStorage.getItem('surg_app_lang_v05');
    if (saved === 'en' || saved === 'fa') return saved;
  }
  return currentSchemaLang;
}

export function setCurrentLang(lang) {
  currentSchemaLang = lang === 'en' ? 'en' : 'fa';
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
    localStorage.setItem('surg_app_lang_v05', currentSchemaLang);
  }
}

export function getItemDisplayTitle(item) {
  if (!item) return '';
  const lang = getCurrentLang();
  if (lang === 'en') {
    return item.en || item.labelEn || item.label || item.name || '';
  }
  if (item.fa && item.en) {
    return `${item.fa} (${item.en})`;
  }
  return item.fa || item.labelFa || item.label || item.name || item.en || '';
}

export const DIRECT_FA_TO_EN_MAP = {
  // Common symptoms & constitutional
  'عرق سرد': 'Cold Sweats',
  'عرق سرد و ضعف': 'Cold Sweats & Weakness',
  'تهوع': 'Nausea',
  'استفراغ': 'Vomiting',
  'بی‌اشتهایی': 'Anorexia',
  'تب': 'Fever',
  'لرز': 'Chills',
  'کاهش وزن': 'Weight Loss',
  'ضعف و بی‌حالی': 'Fatigue / Malaise',
  'زردی': 'Jaundice',
  'خارش': 'Pruritus',
  'یبوست': 'Constipation',
  'اسهال': 'Diarrhea',
  'هماتوشزی': 'Hematochezia',
  'ملنا': 'Melena',
  'هماتمز': 'Hematemesis',
  'سوزش ادرار': 'Dysuria',
  'تکرر ادرار': 'Frequency',
  'هماچوری': 'Hematuria',
  'تنگی نفس': 'Dyspnea',
  'سرفه': 'Cough',
  'درد قفسه سینه': 'Chest Pain',
  'تپش قلب': 'Palpitations',
  'سرگیجه': 'Dizziness',
  'سنکوپ': 'Syncope',
  'سردرد': 'Headache',
  'ورم اندام‌ها': 'Peripheral Edema',
  'عدم دفع گاز و مدفوع': 'Obstipation (No flatus or stool)',
  'اتساع شکم': 'Abdominal Distension',
  'درد حاد شکم': 'Acute Abdominal Pain',
  'درد دور ناف': 'Periumbilical Pain',
  'درد اپی‌گاستر': 'Epigastric Pain',
  'درد هیپوکندریوم راست (RUQ)': 'RUQ Pain',
  'درد هیپوکندریوم چپ (LUQ)': 'LUQ Pain',
  'درد فوسای ایلیاک راست (RLQ)': 'RLQ Pain',
  'درد فوسای ایلیاک چپ (LLQ)': 'LLQ Pain',
  'درد سوپراپوبیک': 'Suprapubic Pain',
  'درد فلنک راست': 'Right Flank Pain',
  'درد فلنک چپ': 'Left Flank Pain',

  // Archetypes & modules
  'درد یا ناراحتی': 'Pain or Discomfort',
  'توده، کیست، تورم یا ضایعه': 'Mass, Cyst, Swelling or Lesion',
  'ترومای حاد و سوختگی': 'Acute Trauma & Burns (ATLS)',
  'اختلالات عملکردی و خونریزی': 'Functional & Bleeding Disorders',
  'بستری الکتیو یا بدون علامت': 'Elective Admission / Asymptomatic Referral',
  'ترومای حاد ATLS': 'Acute Trauma (ATLS)',
  'کانون درد شکم': 'Abdominal Pain Focus',
  'کانون درد قفسه سینه': 'Thoracic Pain Focus',
  'کانون درد سر و گردن': 'HEENT Pain Focus',
  'کانون درد کمر و اندام': 'Spine & Extremity Pain Focus',

  // Exam findings
  'شکم نرم و بدون تندرنس': 'Abdomen soft and non-tender',
  'تندرنس شکمی': 'Abdominal tenderness',
  'ریباند تندرنس': 'Rebound tenderness',
  'گاردینگ / ریجیدیتی': 'Guarding / Muscular Rigidity',
  'دیستانسیون شکم': 'Abdominal distension',
  'اسکار جراحی قبلی': 'Prior surgical scar',
  'اکیموز جدار شکم': 'Abdominal wall ecchymosis',
  'توده قابل لمس': 'Palpable mass',
  'صداهای روده نرمواکتیو': 'Normoactive bowel sounds',
  'صداهای روده هایپواکتیو / غایب': 'Hypoactive / absent bowel sounds',
  'صداهای روده هایپراکتیو فلزی': 'Hyperactive metallic bowel sounds',
  'بروی عروقی': 'Vascular bruit',
  'تیمپانیسم نرمال': 'Normal tympany',
  'شیفتینگ دالنس': 'Shifting dullness',
  'تندرنس CVA': 'CVA tenderness',
  'علامت مورفی مثبت': 'Positive Murphy sign',
  'علامت مک‌برنی مثبت': 'Positive McBurney sign',
  'علامت روزینگ مثبت': 'Positive Rovsing sign',
  'علامت پسواس مثبت': 'Positive Psoas sign',
  'علامت ابتراتور مثبت': 'Positive Obturator sign',
  'هوشیار و آگاه به زمان و مکان': 'Alert and oriented x3',
  'ایل و بدحال': 'Ill and toxic appearing',
  'ملتحمه رنگ‌پریده': 'Pale conjunctiva',
  'اسکلرا ایکتریک': 'Icteric sclera',
  'سمع ریه‌ها پاک و دوطرفه': 'Bilateral breath sounds clear',
  'صداهای ریوی غیرطبیعی': 'Abnormal breath sounds',
  'صداهای قلبی S1/S2 نرمال بدون سوفل': 'Normal S1/S2 heart sounds, no murmur',
  'سوفل قلبی یا آریتمی': 'Heart murmur or arrhythmia',
  'نبض‌های محیطی پر و قرینه': 'Peripheral pulses full and symmetric',
  'پرشدگی مجدد مویرگی زیر ۲ ثانیه': 'Capillary refill time < 2s',

  // Surgeries
  'آپاندکتومی': 'Appendectomy',
  'کله‌سیستکتومی': 'Cholecystectomy',
  'هرنیورافی اینگوینال': 'Inguinal Herniorrhaphy',
  'هرنیورافی نافی': 'Umbilical Herniorrhaphy',
  'لاپاراتومی اکسپلوراتوری': 'Exploratory Laparotomy',
  'بای‌پس معده': 'Gastric Bypass',
  'اسلیو گاسترکتومی': 'Sleeve Gastrectomy',
  'ماستکتومی': 'Mastectomy',
  'تیروییدکتومی': 'Thyroidectomy',
  'نفروکتومی': 'Nephrectomy',
  'سزارین': 'Cesarean Section',
  'هیسترکتومی': 'Hysterectomy',
  'هموروئیدکتومی': 'Hemorrhoidectomy',
  'فیشرکتومی': 'Fissurectomy',
  'کرانیوتومی': 'Craniotomy',
  'توراکوتومی': 'Thoracotomy',
  'پیوند کلیه': 'Renal Transplant',
  'تعویض مفصل': 'Joint Arthroplasty',

  // Statuses & Demographics & Admission
  'مثبت': 'Positive',
  'منفی': 'Negative',
  'طبیعی': 'Normal',
  'غیرطبیعی': 'Abnormal',
  'نامشخص': 'Unknown',
  'بخش بستری': 'Ward',
  'شماره تخت': 'Bed #',
  'خود بیمار': 'Patient',
  'همراه (همسر/والدین/فرزند)': 'Family Member (Spouse/Parent/Child)',
  'همراه بیمار': 'Patient Companion',
  'کادر اورژانس (EMS)': 'EMS Personnel',
  'پرونده ارجاعی': 'Referral Medical Record',
  'آقا': 'Male',
  'مرد': 'Male',
  'خانم': 'Female',
  'زن': 'Female',
  'مجرد': 'Single',
  'متأهل': 'Married',
  'متاهل': 'Married',
  'مطلقه / همسر فوت‌شده': 'Divorced / Widowed',
  'اورژانس جراحی': 'Surgical ED',
  'بخش جراحی عمومی ۱': 'General Surgery Ward 1',
  'بخش جراحی عمومی ۲': 'General Surgery Ward 2',
  'بخش جراحی زنان': 'Women Surgery Ward',
  'بخش تروما': 'Trauma Ward',
  'ICU جراحی': 'Surgical ICU (SICU)',
  'سایر / تایپ دستی...': 'Other / Custom...',
  'منظم (Regular)': 'Regular',
  'نامنظم (Irregular)': 'Irregular',
  'یائسه (Menopause)': 'Menopause',
  'ندارد': 'None',
  'خفیف': 'Mild',
  'شدید': 'Severe',
  'زایمان طبیعی (NVD)': 'Normal Vaginal Delivery (NVD)',
  'سزارین (C/S)': 'Cesarean Section (C/S)',
  'سقط (Abortion)': 'Abortion',
  'خاموش / غیرفعال': 'Inactive / None',
  'هرگز (Never)': 'Never',
  'مصرف فعلی (Current)': 'Current',
  'ترک کرده (Former)': 'Former',

  // Admission Pathways & Spatial Patterns & Pain Modifiers
  'مراجعه با علامت حاد / اورژانس': 'Acute / Emergency Presentation',
  'ارجاع از درمانگاه با نامه استاد / بستری الکتیو': 'Clinic Attending Referral / Elective Admission',
  'مراجعه به دنبال عمل جراحی اخیر / عوارض پس از عمل': 'Recent Post-Op Presentation / Complication',
  'لوکالیزه (تک‌ناحیه‌ای یا چندناحیه‌ای)': 'Localized (Single or Multi-region)',
  'ژنرالیزه با ارجحیت در ناحیه خاص': 'Generalized with Focal Predominance',
  'شروع لوکالیزه و سپس ژنرالیزه شدن': 'Initially Localized, Progressing to Generalized',
  'شروع منتشر/ژنرالیزه در شکم و سپس لوکالیزه شدن در ناحیه خاص (الگوی کلاسیک آپاندیسیت و...)': 'Diffuse Onset Migrating/Localizing to Focal Region (Classic Appendicitis Pattern)',
  'پریکوردیال / سمت چپ قفسه سینه': 'Precordial / Left Anterior Chest',
  'سمت راست قفسه سینه': 'Right Anterior Chest',
  'مصرف غذای چرب / غذا خوردن': 'Fatty Meals / Eating',
  'حرکت، سرفه و دم عمیق': 'Movement, Coughing & Deep Inspiration',
  'گرسنگی / ناشتایی': 'Fasting / Hunger',
  'استراحت و بی‌حرکتی': 'Rest & Immobility',
  'مصرف مسکن / ضدالتهاب': 'Analgesics / NSAIDs',
  'استفراغ کردن': 'Vomiting',
  'دفع گاز یا مدفوع': 'Passing Flatus or Stool',
  'مصرف آنتی‌اسید یا غذا': 'Antacids or Food Intake',
  'راست / چپ...': 'Right / Left...',
  'کمربندی / مهره‌ای...': 'Band-like / Vertebral...',
  'جزئیات...': 'Details...',

  // Functional, Mass & Trauma Schema Options
  'خونریزی گوارشی فوقانی (هماتمز / ملنا)': 'Upper GI Bleeding (Hematemesis / Melena)',
  'خونریزی گوارشی تحتانی (هماتوشزی / رکتوراژی)': 'Lower GI Bleeding (Hematochezia / Rectorrhagia)',
  'علائم فشاری موضعی (دیسفاژی، دیسپنه، خشونت صدا، تریسموس یا بی‌حسی)': 'Local Compressive Symptoms (Dysphagia, Dyspnea, Hoarseness, Trismus or Numbness)',
  'سابقه توده مشابه در سایر نقاط یا عود پس از جراحی قبلی': 'Similar Mass Elsewhere or Recurrence After Prior Surgery',
  'حساسیت خفیف در لمس یا فشار': 'Mild Tenderness on Palpation',
  'دردناک شدن اخیر': 'Recently Painful',
  'تنگی نفس حاد یا درد قفسه سینه پس از تروما': 'Acute Post-Traumatic Dyspnea or Chest Pain',
  'هماتوری یا خونریزی گوارشی پس از تروما': 'Post-Traumatic Hematuria or GI Bleeding',
  'اختلال حس یا حرکت در اندام آسیب‌دیده': 'Sensory or Motor Deficit in Injured Limb',
  'سوختگی حرارتی (شعله / مایعات داغ Scald / انفجار)': 'Thermal Burn (Flame / Scald / Blast)',
  'خودروی شخصی / همراهان': 'Private Vehicle / Family',

  // HPI Basic Symptoms & Unlockable Modules & Hints
  'مدت و شدت...': 'Duration and severity...',
  'مداوم یا متناوب...': 'Constant or intermittent...',
  'تعداد دفعات، محتویات (غذایی/صفراوی/خونی)، تسکین درد پس از آن...': 'Frequency, contents (bilious/bloody/food), post-emetic relief...',
  'درجه، زمانبندی...': 'Grade, timing...',
  'تناوب و شدت...': 'Frequency and severity...',
  'توضیحات، همزمانی با درد یا افت فشار...': 'Details, concurrence with pain or hypotension...',
  'از چند ساعت/روز قبل...': 'Duration in hours/days...',
  'قوام، دفعات، خونی یا آبکی...': 'Consistency, frequency, bloody or watery...',
  'باز کردن ماژول: علائم صفراوی و کلستاز (زردی، خارش، ادرار چای‌رنگ، مدفوع آکولیک)': 'Open Module: Hepatobiliary & Cholestasis (Jaundice, Pruritus, Dark Urine, Acholic Stool)',
  'سیر پیشرونده یا نوسانی...': 'Progressive or fluctuating course...',
  'شدت و زمان تشدید...': 'Severity and timing...',
  'از چند روز قبل...': 'Since how many days ago...',
  'مدت زمان...': 'Duration...',
  'باز کردن ماژول: عوارض محل عمل جراحی اخیر و درن (درد/سفتی محل درن، ترشح، باز شدن بخیه)': 'Open Module: Post-Op & Drain Complications (Induration, Discharge, Dehiscence)',
  'درد و سفتی (Induration) در محل درن یا خط بخیه': 'Pain & Induration at Drain or Incision Site',
  'ناحیه درن و فاصله زمانی از عمل...': 'Drain site and time elapsed since surgery...',
  'تغییر حجم یا ماهیت ترشحات درن': 'Change in Drain Output Volume or Character',
  'حجم ۲۴ ساعته به cc و ماهیت: سروزی/هموراژیک/چرکی/صفراوی...': '24h volume (cc) & character (serous/bloody/purulent/bilious)...',
  'انسداد، نشت از کنار درن یا خروج ناخواسته درن': 'Drain Occlusion, Peri-tubular Leakage or Dislodgement',
  'میزان نشت یا انسداد...': 'Extent of leakage or occlusion...',
  'قرمزی، گرمی، ترشح یا باز شدن (Dehiscence) خط بخیه': 'Incisional Erythema, Warmth, Discharge or Dehiscence',
  'ترشح، باز شدن لبه‌ها...': 'Discharge, wound edge separation...',
  'باز کردن ماژول: علائم خونریزی گوارشی و آنورکتال (هماتمز، ملنا، هماتوشزی، دیسفاژی)': 'Open Module: GI Bleeding & Anorectal (Hematemesis, Melena, Hematochezia, Dysphagia)',
  'هماتمز (استفراغ خونی یا Coffee-ground)': 'Hematemesis (Bloody or Coffee-ground Emesis)',
  'حجم و دفعات...': 'Volume and frequency...',
  'دفعات و حجم...': 'Frequency and volume...',
  'هماتوشزی / رکتوراژی (خون روشن از رکتوم)': 'Hematochezia / Rectorrhagia (Bright Red Blood per Rectum)',
  'مخلوط با مدفوع یا قطره‌ای پس از دفع...': 'Mixed with stool or post-defecation dripping...',
  'دیسفاژی یا ادینوفاژی (اختلال یا درد بلع)': 'Dysphagia or Odynophagia',
  'به جامدات یا مایعات...': 'To solids or liquids...',
  'زورپیچ (Tenesmus) یا درد حین اجابت مزاج': 'Tenesmus or Defecation Pain',
  'شدت درد...': 'Pain severity...',
  'باز کردن ماژول: علائم توده، فتق، پستان و تیروئید (جا رفتن توده، تغییرات پوست، خشونت صدا)': 'Open Module: Mass, Hernia, Breast & Thyroid (Reducibility, Skin Changes, Hoarseness)',
  'روش جااندازی...': 'Reduction method...',
  'از چند ساعت قبل...': 'Hours since onset...',
  'علائم ایسکمی...': 'Signs of ischemia...',
  'ترشح از نیپل یا فرورفتگی نوک پستان': 'Nipple Discharge or Inversion',
  'خونی/سروزی، یکطرفه/دوطرفه...': 'Bloody/serous, unilateral/bilateral...',
  'محل در پستان...': 'Quadrant / clock-face position...',
  'باز کردن ماژول: علائم ادراری و لگنی (دیزوری، هماچوری، احتباس/کاهش جریان ادرار)': 'Open Module: Urinary & Pelvic Symptoms (Dysuria, Hematuria, Retention)',
  'تغییر رنگ ادرار...': 'Urine color change...',
  'هماچوری (تغییر رنگ خونی ادرار)': 'Hematuria (Gross Blood in Urine)',
  'لخته، ابتدا یا کل ادرار...': 'Clots, initial or terminal/total stream...',
  'احتباس، تاخیر در شروع یا کاهش جریان ادرار': 'Urinary Retention, Hesitancy or Weak Stream',
  'سابقه سوندگذاری...': 'Prior catheterization history...',
  'ترشح/خونریزی غیرطبیعی واژینال یا تاخیر پریود (در خانم‌ها)': 'Abnormal Vaginal Discharge/Bleeding or Missed Period',
  'تاریخ LMP...': 'LMP date...',

  // PMH, PSH, DH, AH, FH Categories & Items
  'نارسایی آدرنال / سندرم کوشینگ / مصرف مزمن کورتون': 'Adrenal Insufficiency / Cushing Syndrome / Chronic Corticosteroid Use',
  'سابقه پریکاردیت یا اندوکاردیت عفونی': 'History of Pericarditis or Infective Endocarditis',
  'آدنوم هیپوفیز / پرولاکتینوما / آکرومگالی': 'Pituitary Adenoma / Prolactinoma / Acromegaly',
  'سابقه پنوموتوراکس خودبه‌خودی یا چست‌تیوب': 'History of Spontaneous Pneumothorax or Chest Tube',
  'ترومبوفیلی ارثی / فاکتور ۵ لیدن / آنتی‌فسفولیپید': 'Hereditary Thrombophilia / Factor V Leiden / Antiphospholipid Syndrome',
  '۲. داروهای قلبی، فشار خون، ضدآریتمی و چربی خون': '2. Cardiovascular, Antihypertensive, Antiarrhythmic & Lipid Drugs',
  '۳. داروهای دیابت، انسولین‌ها، تیروئید، کورتون‌ها و هورمونی': '3. Antidiabetics, Insulins, Thyroid, Corticosteroids & Hormonal Drugs',
  '۴. داروهای گوارشی، کبدی و ضدتهوع': '4. Gastrointestinal, Hepatobiliary & Antiemetic Drugs',
  '۵. مسکن‌ها (NSAIDs و اپیوئیدها)، روماتولوژی و سرکوب‌کننده ایمنی': '5. Analgesics (NSAIDs & Opioids), Rheumatology & Immunosuppressants',
  '۶. تنفسی، اورولوژی، اعصاب و روان و مکمل‌ها': '6. Respiratory, Urologic, Neuropsychiatric & Supplements',
  'مادر': 'Mother',
  'پدر': 'Father',
  'برادر': 'Brother',
  'خواهر': 'Sister',
  'درجه ۲': '2nd-Degree Relative',
  'پنیسیلین و بتالاکتام‌ها': 'Penicillins & Beta-Lactams',
  'نوع واکنش: کهیر، آنژیوادم، آنافیلاکسی...': 'Reaction: urticaria, angioedema, anaphylaxis...',
  'سفالوسپورین‌ها': 'Cephalosporins',
  'نوع واکنش...': 'Reaction type...',
  'سابقه پیش‌درمانی با هیدروکورتیزون...': 'Prior premedication with hydrocortisone...',
  'حساسیت تماسی یا تنفسی...': 'Contact or respiratory reaction...',
  'داروهای بیهوشی / شل‌کننده عضلانی': 'Anesthetic Agents / Neuromuscular Blockers',
  'هیپرترمی بدخیم یا آپنه طولانی...': 'Malignant hyperthermia or prolonged apnea...',
  'مواد غذایی (کیوی/گوجه/مغزیجات)': 'Food Allergens (Kiwi / Tomato / Tree Nuts)',
  'سرطان و گوارش': 'GI Oncology',
  'سرطان و زنان': 'Gynecologic / Breast Oncology',
  'سرطان و غدد': 'Endocrine Oncology',
  'سرطان و اورولوژی': 'Urologic Oncology',
  'سرطان عمومی': 'General Oncology',
  'قلبی-عروقی': 'Cardiovascular',
  'غدد': 'Endocrine',
  'اعصاب': 'Neurology',
  'گوارش': 'Gastrointestinal',
  'سرطان ارثی': 'Hereditary Cancer Syndromes',
  'خون': 'Hematology',
  'گوارش و کلیه': 'GI & Renal',
  'ژنتیک و روماتولوژی': 'Genetics & Rheumatology',
  'خون ارثی': 'Hereditary Hematology',
  'سنگ کیسه صفرا یا سنگ کلیه مکرر در خانواده': 'Familial Recurrent Cholelithiasis or Nephrolithiasis',
  'تالاسمی مینور/ماژور یا هموفیلی در خانواده': 'Familial Thalassemia Minor/Major or Hemophilia',
  'کانسر کولورکتال در بستگان درجه یک': 'Colorectal Cancer in First-Degree Relatives',
  'نسبت فامیلی و سن بروز...': 'Relationship and age at onset...',
  'کانسر معده یا مری': 'Gastric or Esophageal Cancer',
  'نسبت و سن بروز...': 'Relationship and age at onset...',
  'تعداد افراد مبتلا در خانواده...': 'Number of affected relatives...',
  'کانسر مدولاری/پاپیلاری تیروئید یا سندروم MEN': 'Medullary/Papillary Thyroid Cancer or MEN Syndrome',
  'نوع بدخیمی...': 'Malignancy subtype...',
  'بیماری ایسکمیک قلبی زودرس (مرد <55، زن <65)': 'Premature Ischemic Heart Disease (M <55, F <65)',
  'نسبت...': 'Relationship...',
  'دیابت شیرین و پرفشاری خون خانوادگی': 'Familial Diabetes Mellitus & Hypertension',
  'نسبت فامیلی...': 'Family relationship...',
  'اختلالات ترومبوفیلی، DVT مکرر یا خونریزی ارثی': 'Hereditary Thrombophilia, Recurrent DVT or Bleeding Disorder',
  'سابقه آمبولی در خانواده...': 'Family history of embolism...',

  // Physical Examination (PE Mandatory Pillars, Unlockable Modules & Comprehensive 12-System Baselines)
  'ظاهر Ill یا Toxic': 'Ill or Toxic-Appearing',
  'بیقراری، تعریق...': 'Agitation, diaphoresis...',
  'شدت رنگ‌پریدگی...': 'Degree of pallor...',
  'شدت زردی...': 'Degree of icterus...',
  'سمع ریه دوطرفه شفاف و بدون صدای اضافی': 'Bilateral Clear Breath Sounds without Adventitious Sounds',
  'صداهای غیرطبیعی ریه (کراکل / ویز / کاهش صدا)': 'Abnormal Breath Sounds (Crackles / Wheezes / Decreased Sounds)',
  'سمت راست/چپ، قاعده...': 'Right/left side, lung base...',
  'سمع قلب: S1 و S2 نرمال و منظم بدون سوفل': 'Heart Auscultation: Normal Regular S1 & S2 without Murmur',
  'سوفل قلبی یا ریتم نامنظم': 'Cardiac Murmur or Irregular Rhythm',
  'گرید و کانون سمع...': 'Grade and auscultation focus...',
  'ژنرالیزه یا موضعی...': 'Generalized or localized...',
  'نوع برش (میدلاین/مک‌برنی/کوشر/فان‌اشتیل) و نام عمل...': 'Incision type (Midline/McBurney/Kocher/Pfannenstiel) & surgery...',
  'اکیموز جدار شکم (علامت کولن یا گری‌ترنر)': 'Abdominal Wall Ecchymosis (Cullen or Grey Turner Sign)',
  'دور ناف یا پهلوها...': 'Periumbilical or flanks...',
  'برجستگی یا فتق واضح در مشاهده جدار شکم': 'Visible Bulge or Hernia on Abdominal Wall Inspection',
  'محل و سایز...': 'Location and size...',
  'محل بروئی...': 'Bruit location...',
  'میزان مایع آزاد...': 'Estimated ascites volume...',
  'سمت راست یا چپ...': 'Right or left side...',
  'نواحی دقیق (مثلاً RLQ، اپی‌گاستر)...': 'Exact quadrants (e.g. RLQ, Epigastric)...',
  'محل دقیق...': 'Exact location...',
  'ارادی/غیرارادی، لوکالیزه یا ژنرالیزه...': 'Voluntary/involuntary, localized or generalized...',
  'سانتیمتر زیر لبه دنده...': 'cm below costal margin...',
  'تون اسفنکتر نرمال، بدون توده، دستکش آغشته به مدفوع طبیعی': 'Normal Sphincter Tone, No Mass, Normal Brown Stool on Glove',
  'مشاهده ملنا یا خون روشن روی انگشت دستکش': 'Melena or Bright Red Blood on Examining Finger',
  'آمپول رکتوم خالی یا ایمپکشن مدفوعی': 'Empty Rectal Vault or Fecal Impaction',
  'لمس توده، فیشر، فیستول یا هموروئید': 'Palpable Rectal Mass, Fissure, Fistula or Hemorrhoids',
  'فاصله از Anal verge، ساعت، تندرنس...': 'Distance from anal verge, clock position, tenderness...',
  'معاینه پستان و آگزیلا دوطرفه طبیعی، بدون توده یا ترشح': 'Normal Bilateral Breast & Axillary Exam, No Mass or Discharge',
  'توده قابل لمس در پستان': 'Palpable Breast Mass',
  'سمت، ساعت، فاصله از آرئول، ابعاد cm، قوام، تحرک...': 'Side, clock position, distance from areola, size (cm), mobility...',
  'لنفادنوپاتی آگزیلاری قابل لمس': 'Palpable Axillary Lymphadenopathy',
  'سمت، تعداد، سایز، متحرک یا فیکس...': 'Side, count, size, mobile vs fixed...',
  'فرورفتگی نوک پستان، کشیدگی یا نمای پوست‌پرتقالی': 'Nipple Inversion, Skin Tethering or Peau d’orange',
  'موضع...': 'Location...',
  'تیروئید بدون بزرگی، بدون ندول لمس‌پذیر و متحرک با بلع': 'Non-enlarged Thyroid, No Palpable Nodules, Mobile with Swallowing',
  'گواتر منتشر یا ندول قابل لمس تیروئید': 'Diffuse Goiter or Palpable Thyroid Nodule',
  'لوب راست/چپ/ایستموس، ابعاد به cm، قوام...': 'Right/left lobe or isthmus, size (cm), consistency...',
  'سطح لول گردنی، سایز cm، متحرک یا فیکس...': 'Cervical level, size (cm), mobile vs fixed...',
  'کانال‌های اینگوئینال دوطرفه بدون بالج یا فتق لمس‌پذیر': 'Bilateral Inguinal Canals Intact without Bulge or Palpable Hernia',
  'فتق اینگوئینال (مستقیم یا غیرمستقیم)': 'Inguinal Hernia (Direct or Indirect)',
  'سمت راست یا چپ، قابل جااندازی (Reducible) یا گیرکرده...': 'Right/left, reducible vs incarcerated...',
  'فتق فمورال، نافی یا اپی‌گاستریک': 'Femoral, Umbilical or Epigastric Hernia',
  'محل و سایز نقص فاشیا به cm...': 'Location and fascial defect size (cm)...',
  'فتق انسزیونال در محل اسکار جراحی قبلی': 'Incisional Hernia at Prior Surgical Scar',
  'ابعاد نقص فاشیا به cm...': 'Fascial defect dimensions (cm)...',
  'خط بخیه تمیز، خشک و بدون ترشح یا اریتم': 'Clean, Dry, Intact Suture Line without Erythema or Discharge',
  'اریتم، گرمی، ترشح یا باز شدن (Dehiscence) لبه‌های بخیه': 'Wound Erythema, Warmth, Discharge or Dehiscence',
  'وسعت اریتم، ماهیت ترشح...': 'Extent of erythema, discharge character...',
  'درن جراحی فیکس، فعال و دارای کارکرد مناسب': 'Surgical Drain Secured, Patent and Functioning Properly',
  'نشت ترشح از اطراف درن، جابه‌جایی یا اریتم محل ورود درن': 'Peri-drain Leakage, Dislodgement or Exit-Site Erythema',
  'توضیحات نشت یا انسداد...': 'Details of leakage or blockage...',

  // PE Comprehensive 12-System Normal Baselines & Pure-Persian Items
  'هوشیار، با جهت‌یابی کامل (Oriented ×3)، بدون دیسترس حاد تنفسی یا درد بارز، پرفیوژن محیطی مناسب و هیدراتاسیون نرمال.': 'Alert and fully oriented (Oriented x3), in no acute respiratory distress or overt pain, with adequate peripheral perfusion and normal hydration.',
  'شکم متقارن، فاقد دیستانسیون بارز، بدون اسکار جراحی قبلی، بدون ایکموز یا اتساع وریدی، ناف در وضعیت طبیعی و بدون ضایعه جدار.': 'Abdomen symmetrical, non-distended, without prior surgical scars, ecchymosis, or venous dilation; umbilicus midline and abdominal wall intact.',
  'صداهای روده‌ای نرمال (Normoactive Bowel Sounds: ~5–30/min)، بدون صدای متالیک یا راش روده، فاقد بروئی عروقی آئورت یا رنال.': 'Normoactive bowel sounds (~5–30/min) in all quadrants, without metallic rushes or aortic/renal vascular bruits.',
  'تیمپانیسم عمومی نرمال در تمامی رباع‌ها، فاقد ماتیته جابه‌جاشونده (No Shifting Dullness)، تندرنس دق منفی و فاقد CVA Tenderness.': 'Normal tympany across all four quadrants, no shifting dullness, negative percussion tenderness, and no CVA tenderness.',
  'شکم نرم، فاقد تندرنس سطحی یا عمقی، ریباند منفی، بدون گاردینگ ارادی یا غیرارادی (No Guarding/Rigidity)، علائم مورفی و مک‌برنی منفی، بدون توده قابل لمس یا فتق جدار.': 'Abdomen soft, non-tender to superficial and deep palpation, negative rebound, no voluntary or involuntary guarding/rigidity, negative Murphy and McBurney signs, and no palpable masses or abdominal wall hernias.',
  'سر نرموسفال بدون تروما، ملتحمه فاقد رنگ‌پریدگی، اسکلرا آنیکتریک، مردمک‌ها متقارن و واکنش به نور طبیعی (PERRLA)، مخاط دهان مرطوب، بدون دیستنشن ورید ژوگولار (No JVD)، تراشه در خط وسط، تیروئید بدون بزرگی، ندول یا تندرنس، فاقد لنفادنوپاتی سرویکال یا سوپراکلاویکولار.': 'Normocephalic and atraumatic, pink conjunctivae, anicteric sclerae, pupils equal and reactive to light (PERRLA), moist oral mucosa, no JVD, midline trachea, non-enlarged non-tender thyroid without nodules, and no cervical or supraclavicular lymphadenopathy.',
  'قفسه سینه متقارن، حرکات تنفسی دوطرفه مناسب بدون رترکشن اینترکوستال، دق ریه‌ها در تمام فیلدها رزونانت، سمع ریه دوطرفه پاک با صداهای وزیکولار طبیعی، فاقد رال (Crackles)، ویزینگ یا استریدور.': 'Symmetric thorax with normal bilateral chest expansion and no intercostal retractions, resonant to percussion throughout, clear bilateral vesicular breath sounds without crackles, wheezes, or stridor.',
  'لمس PMI در فضای بین‌دنده‌ای پنجم خط میدکلاویکولار، صدای S1 و S2 نرمال و منظم، بدون سوفل قلبی سیستولیک یا دیاستولیک، فاقد گالوپ S3/S4، نبض‌های محیطی (رادیال، دورسالیس پدیس، تیبیالیس خلفی) دوطرفه پر و قرینه (2+)، پرشدگی مویرگی کمتر از ۲ ثانیه، بدون ادم گوده‌گذار و شواهد DVT منفی.': 'PMI palpable at 5th ICS midclavicular line, normal regular S1 and S2 without murmurs or S3/S4 gallops, full symmetric 2+ peripheral pulses (radial, dorsalis pedis, posterior tibial), capillary refill < 2 sec, no pitting edema, and no signs of DVT.',
  'پستان‌ها دوطرفه متقارن، فاقد فرورفتگی پوست یا نمای پوست‌پرتقالی (No Dimpling/Peau d’orange)، نیپل‌ها سالم بدون انحراف یا ترشح، لمس هر چهار ربع و دم اسپنس فاقد هرگونه توده، ندولاریته غالب یا تندرنس، لنفادنوپاتی آگزیلاری لمس نمی‌شود.': 'Bilateral symmetric breasts without skin dimpling or peau d’orange, intact nipples without retraction or discharge, no palpable masses or tenderness across all four quadrants and tail of Spence, and no palpable axillary lymphadenopathy.',
  'مشاهده پری‌آنال طبیعی بدون فیشر، شقاق، فیستول، هموروئید ترومبوزه یا آبسه، تون اسفنکتر مقعد طبیعی، لمس جدار کانال آنال و رکتوم فاقد توده یا خون، پروستات با ابعاد نرمال و فاقد ندول سفت، نمونه مدفوع روی دستکش با رنگ طبیعی، معاینه ژنیتالیا نرمال.': 'Normal perianal inspection without fissure, fistula, thrombosed hemorrhoids, or abscess; normal anal sphincter tone, smooth rectal vault without palpable mass or blood, normal-sized smooth prostate, normal brown stool on glove, and normal external genitalia.',
  'هوشیاری کامل (GCS 15/15, Oriented ×3)، اعصاب کرانیال II تا XII سالم و قرینه (به‌ویژه عدم فلج فاسیال یا خشونت صدا)، قدرت عضلانی هر چهار اندام کامل (Motor Power 5/5)، حس لمس سطحی و درد دوطرفه قرینه، رفلکس‌های تاندونی عمقی نرمال (DTR 2+)، علامت بابنسکی منفی (پلانتار فلکسور دوطرفه)، بدون علائم تحریک مننژ (گردن نرم، بدون کرنیگ/برودزینسکی).': 'Alert and oriented x3 (GCS 15/15), cranial nerves II–XII intact and symmetric, 5/5 motor strength in all four extremities, intact symmetric light touch and pinprick sensation, symmetric 2+ deep tendon reflexes, downgoing plantar reflexes (negative Babinski), and supple neck without meningeal signs.',
  'دامنه حرکتی مفاصل محیطی و ستون فقرات کامل و بدون درد (Full ROM)، فاقد تورم، افیوژن یا اریتم مفصلی، بدون دفورمیتی یا کوتاهی اندام، تندرنس خط وسط مهره‌ها منفی، تست SLR دوطرفه منفی.': 'Full painless range of motion across peripheral joints and spine, no joint swelling, effusion, erythema, or limb deformity/shortening, no midline vertebral tenderness, and negative bilateral straight-leg raise (SLR).',
  'پوزیشن بیمار (مثلاً پوزیشن طاق‌باز، بی‌حرکت، نشسته به جلو)': 'Patient Posture (e.g. Supine, Lying Still, Leaning Forward)',
  'سر نرموسفال و بدون دفورمیتی یا هماتوم': 'Normocephalic Head without Deformity or Hematoma',
  'مخاط دهان و زبان مرطوب و بدون ضایعه': 'Moist Oral Mucosa and Tongue without Lesions',
  'معاینه تیروئید: بزرگی، ندول، قوام، حرکت با بلع': 'Thyroid Exam: Enlargement, Nodules, Consistency, Mobility on Swallowing',
  'دق ریه: رزونانس طبیعی / ماتیته (افیوژن) / هایپررزونانس (پنوموتوراکس)': 'Lung Percussion: Normal Resonance / Dullness (Effusion) / Hyperresonance (Pneumothorax)',
  'صداهای قلبی S1 و S2 طبیعی و ریتمیک': 'Normal Rhythmic S1 & S2 Heart Sounds',
  'سوفل قلبی: سیستولیک/دیاستولیک، گرید و کانون سمع': 'Cardiac Murmur: Systolic/Diastolic, Grade & Auscultatory Focus',
  'لمس ربع‌های پستان و دم اسپنس (توده، ساعت، ابعاد، قوام، تحرک)': 'Palpation of Breast Quadrants & Tail of Spence (Mass, Clock Position, Size, Mobility)',
  'مشاهده پری‌آنال: فیشر، فیستول، هموروئید خارجی، آبسه، سینوس پیلونیدال': 'Perianal Inspection: Fissure, Fistula, External Hemorrhoids, Abscess, Pilonidal Sinus',
  'لمس دیواره‌های رکتوم: توده، پولیپ، فاصله از Anal Verge': 'Rectal Wall Palpation: Mass, Polyp, Distance from Anal Verge',
  'معاینه پروستات (Prostate: سایز، شیار میانی، قوام، ندول سفت)': 'Prostate Exam (Size, Median Sulcus, Consistency, Firm Nodule)',
  'نمونه مدفوع روی دستکش: طبیعی / ملنا / خون روشن / آمپول خالی': 'Stool on Examining Glove: Normal / Melena / Bright Blood / Empty Vault',
  'معاینه بیضه‌ها و اسکروتوم (تورشن، اپیدیدیمیت، هیدروسل، واریکوسل)': 'Scrotal & Testicular Exam (Torsion, Epididymitis, Hydrocele, Varicocele)',
  'رفلکس‌های تاندونی عمقی (DTR 2+ قرینه)': 'Deep Tendon Reflexes (Symmetric 2+ DTR)',
  'علائم تحریک مننژ (سفتی گردن، نشانه کرنیگ، نشانه برودزینسکی)': 'Meningeal Signs (Nuchal Rigidity, Kernig & Brudzinski Signs)',

  // Paraclinic Modalities, QuickTags & Lab Panels
  'هماتولوژی تکمیلی': 'Extended Hematology',
  'بیوشیمی و الکترولیت': 'Biochemistry & Electrolytes',
  'قلبی و ترومبوز': 'Cardiac, Thrombosis & Sepsis',
  'غدد و ویتامین‌ها': 'Endocrine, Iron & Vitamins',
  'تومورمارکرها': 'Tumor Markers',
  'ویروسی و عفونی': 'Viral Serology & Cultures',
  'انعقادی و نشانگرهای التهابی': 'Coagulation & Inflammatory Markers',
  'بیوشیمی، کلیوی و الکترولیت‌ها': 'Biochemistry, Renal & Electrolytes',
  'کبدی، صفراوی و آنزیم‌های پانکراس': 'Liver Function & Pancreatic Enzymes',
  'هورمونی و تومورمارکرها': 'Endocrine & Tumor Markers',
  'سونوگرافی eFAST (تروما)': 'eFAST Ultrasound (Trauma)',
  'سونوگرافی اورژانس eFAST (تروما و بررسی مایع آزاد/پنوموتوراکس)': 'Emergency eFAST Ultrasound (Free Fluid & Pneumothorax)',
  'eFAST کاملاً منفی از نظر مایع آزاد شکمی، پریکارد و پنوموتوراکس': 'Negative eFAST (No Intraperitoneal/Pericardial Free Fluid or Pneumothorax)',
  'میزان مایع (کم/متوسط/زیاد)...': 'Fluid amount (trace/moderate/large)...',
  'میزان مایع...': 'Fluid volume...',
  'کلاپس دیاستولیک RV...': 'RV diastolic collapse...',
  'شواهد پنوموتوراکس یا هموتوراکس در بررسی قفسه سینه': 'Thoracic Window Positive for Pneumothorax or Hemothorax',
  'تعداد و حداکثر سایز به mm...': 'Stone count and max diameter (mm)...',
  'شواهد لجن...': 'Biliary sludge details...',
  'افزایش ضخامت جدار کیسه صفرا': 'Gallbladder Wall Thickening',
  'ضخامت به mm (مثلاً 5mm) و مایع دور کیسه...': 'Wall thickness (mm) and pericholecystic fluid...',
  'علامت مورفی سونوگرافیک مثبت': 'Positive Sonographic Murphy Sign',
  'قطر CBD به mm و وجود سنگ داخل آن...': 'CBD diameter (mm) and choledocholithiasis...',
  'قطر CBD و مجاری داخل کبدی طبیعی': 'Normal CBD Caliber and Intrahepatic Bile Ducts',
  'قطر CBD به mm...': 'CBD diameter (mm)...',
  'لوپ بلایند و غیرقابل کمپرس آپاندیس': 'Non-compressible Blind-ending Appendiceal Loop',
  'قطر آپاندیس به mm، آپاندیکولیت، Fat stranding...': 'Appendix diameter (mm), appendicolith, periappendiceal fat stranding...',
  'مایع آزاد در حفره شکم یا لگن': 'Free Fluid in Peritoneal Cavity or Pelvis',
  'نقص فاشیا و فتق در سونوگرافی سطحی': 'Fascial Defect & Hernia on Superficial Ultrasound',
  'سایز دهانه فتق به mm و محتویات (امنتوم/لوپ روده)...': 'Neck diameter (mm) and contents (omentum/bowel loop)...',
  'ندول تیروئید': 'Thyroid Nodule',
  'لوب، ابعاد به mm و کلاس TI-RADS...': 'Lobe, dimensions (mm) and TI-RADS category...',
  'ضایعه پستان یا آگزیلا': 'Breast or Axillary Lesion',
  'سمت، ساعت، ابعاد و کلاس BI-RADS...': 'Side, clock position, size and BI-RADS category...',
  'التهاب و Fat Stranding موضعی': 'Focal Inflammation & Fat Stranding',
  'اطراف آپاندیس / پانکراس / کیسه صفرا / دیورتیکول...': 'Periappendiceal / Peripancreatic / Pericholecystic / Peridiverticular...',
  'محل و حجم هوا...': 'Location and volume of free air...',
  'دیلاتاسیون لوپ‌های روده و سطح مایع-هوا': 'Dilated Bowel Loops with Air-Fluid Levels',
  'روده باریک یا کولون، محل Transition point...': 'Small bowel vs colon, transition point location...',
  'ضخامت نامنظم جدار یا توده فضاگیر گوارشی': 'Irregular Mural Thickening or GI Mass Lesion',
  'محل آناتومیک و ابعاد...': 'Anatomic site and dimensions...',
  'کلکسیون، آبسه یا مایع آزاد': 'Fluid Collection, Abscess or Ascites',
  'محل و ابعاد به mm...': 'Location and dimensions (mm)...',
  'لنفادنوپاتی یا ضایعات متاستاتیک کبد/ریه': 'Lymphadenopathy or Hepatic/Pulmonary Metastases',
  'تعداد و محل...': 'Count and location...',
  'محل سنگ یا تنگی در CBD/CHD...': 'Stone or stricture site in CBD/CHD...',
  'ابعاد و لایه‌های عضلانی درگیر...': 'Dimensions and invaded muscular layers...',
  'توده تخمدان، کیست شکلاتی یا فیبروم...': 'Ovarian mass, endometrioma or fibroid...',
  'کلاس پارک، اسفنکتر درگیر...': 'Parks classification, sphincter involvement...',
  'ضایعه کبدی، پانکراس یا متاستاز': 'Hepatic, Pancreatic or Metastatic Lesion',
  'تعداد، سگمان کبد یا محل در پانکراس...': 'Count, hepatic segment or pancreatic site...',
  'هوای آزاد زیر دیافراگم در CXR ایستاده': 'Subdiaphragmatic Free Air on Upright CXR',
  'یکطرفه یا دوطرفه...': 'Unilateral or bilateral...',
  'سطوح متعدد مایع-هوا (Air-Fluid Levels) در AXR ایستاده': 'Multiple Air-Fluid Levels on Upright AXR',
  'تعداد سطوح...': 'Number of levels...',
  'دیلاتاسیون لوپ‌های روده در AXR خوابیده': 'Dilated Bowel Loops on Supine AXR',
  'مرکزی یا محیطی...': 'Central vs peripheral...',
  'وضعیت گاز در آمپول رکتوم': 'Rectal Vault Gas Status',
  'موجود است / فاقد گاز...': 'Present / Paucity of rectal gas...',
  'CXR: فیلدهای ریوی پاک، زاویه دنده‌ای-فرنیک باز، سایه قلبی طبیعی': 'CXR: Clear Lung Fields, Sharp Costophrenic Angles, Normal Cardiac Silhouette',
  'اولسر پپتیک معده یا دئودنوم': 'Gastric or Duodenal Peptic Ulcer',
  'محل زخم، سایز و کلاس Forrest...': 'Ulcer site, size and Forrest class...',
  'ضایعه توده‌ای، اولسراتیو یا تنگی مری/معده': 'Esophagogastric Mass, Ulcerative Lesion or Stricture',
  'فاصله از دندان‌های پیشین و درصد انسداد...': 'Distance from incisors and luminal narrowing (%)...',
  'واریس مری/فوندوس یا گاستریت اروزویو': 'Esophageal/Fundic Varices or Erosive Gastritis',
  'گرید واریس و شواهد خونریزی فعال...': 'Varix grade and active bleeding stigmata...',
  'کولونوسکوپی': 'Colonoscopy',
  'توده شکننده یا انسدادی در رکتوم/کولون': 'Friable or Obstructing Colorectal Mass',
  'فاصله از Anal verge (به cm) و وضعیت عبور اسکوپ...': 'Distance from anal verge (cm) and scope traversability...',
  'پولیپ‌های کولورکتال': 'Colorectal Polyps',
  'تعداد، محل و سایز...': 'Count, location and size...',
  'دیورتیکولوز، کولیت یا هموروئید داخلی': 'Diverticulosis, Colitis or Internal Hemorrhoids',
  'محل و شدت...': 'Location and severity...',
  'لارنگوسکوپی': 'Laryngoscopy',
  'حرکت طناب‌های صوتی حقیقی (TVC) دوطرفه طبیعی و قرینه': 'Normal Symmetric Bilateral True Vocal Cord (TVC) Mobility',
  'فلج یا کاهش حرکت طناب صوتی': 'Vocal Cord Paresis or Paralysis',
  'سمت راست یا چپ، وضعیت راه هوایی...': 'Right or left side, airway patency...',
  'پاتولوژی / FNA': 'Pathology / FNA',
  'گرید تمایز (Well/Mod/Poorly differentiated)...': 'Differentiation grade (Well/Mod/Poorly)...',
  'نتیجه FNA تیروئید (Bethesda System)': 'Thyroid FNA Cytology (Bethesda System)',
  'کلاس Bethesda (I تا VI) و نوع سلول (مثلاً PTC)...': 'Bethesda class (I–VI) and cell type (e.g. PTC)...',
  'نتیجه Core Needle Biopsy پستان': 'Breast Core Needle Biopsy Result',
  'نوع تومور (IDC/ILC) و وضعیت ER/PR/HER2/Ki67...': 'Histologic type (IDC/ILC) & ER/PR/HER2/Ki67...',
  'پاتولوژی خوش‌خیم / التهابی': 'Benign / Inflammatory Histopathology',
  'تشخیص دقیق گزارش پاتولوژی...': 'Exact histopathologic diagnosis...',

  // SOAP Progress Note Capsules, Options & Focused Daily PE (Bug 8 & Bug 9)
  'رو به بهبود': 'Improving',
  'ثابت / بدون تغییر': 'Stable / Unchanged',
  'تشدید علائم / بدتر شدن': 'Worsening / Deteriorating',
  'بدون درد / کنترل شده': 'Pain-Free / Well Controlled',
  'درد خفیف در محل عمل': 'Mild Incisional Pain',
  'درد متوسط تا شدید': 'Moderate-to-Severe Pain',
  'NPO (ناشتا)': 'NPO (Nil Per Os)',
  'مایعات صاف (Clear Liquid)': 'Clear Liquid Diet',
  'مایعات کامل / سوپ': 'Full Liquid / Soup Diet',
  'رژیم معمولی / تحمل کامل': 'Regular Diet / Well Tolerated',
  'عدم تحمل PO': 'PO Intolerance',
  'CBR (استراحت مطلق)': 'Complete Bed Rest (CBR)',
  'نشستن لبه تخت (OOB)': 'Out of Bed to Chair (OOB)',
  'راه رفتن با کمک': 'Assisted Ambulation',
  'راه رفتن مستقل (Ambulatory)': 'Independent Ambulation',
  'کافی (>0.5 cc/kg/hr)': 'Adequate (>0.5 mL/kg/hr)',
  'الیگوری': 'Oliguria',
  'آنوری': 'Anuria',
  'دارای سوند فولی': 'Foley Catheter in Place',
  'پایدار (Stable)': 'Hemodynamically Stable',
  'نیازمند مایع‌درمانی': 'Fluid Resuscitation Required',
  'تحت وازوپرسور': 'Vasopressor Dependent',
  'سروزی (Serous)': 'Serous',
  'سروزانگوئینوس (Serosanguinous)': 'Serosanguinous',
  'خونی (Bloody/Hemorrhagic)': 'Bloody / Hemorrhagic',
  'صفراوی (Bilious)': 'Bilious',
  'چرکی (Purulent)': 'Purulent',
  'فکال / روده‌ای (Enteric)': 'Feculent / Enteric',
  // SOAP Focused Daily PE 5-row capsules
  'هوشیار و Oriented (GCS=15)': 'Alert & Oriented (GCS 15)',
  'همودینامیک پایدار': 'Hemodynamically Stable',
  'بدون تب (Afebrile)': 'Afebrile',
  'ظاهر Ill / Toxic': 'Ill / Toxic-Appearing',
  'سمع ریه دوطرفه شفاف': 'Clear Bilateral Breath Sounds',
  'کراکل / کاهش صدا در قاعده ریه': 'Basilar Crackles / Decreased Breath Sounds',
  'سمع قلب نرمال (S1, S2 منظم)': 'Normal Heart Sounds (Regular S1, S2)',
  'تاکیکاردی': 'Tachycardia',
  'شکم نرم و بدون دیستانسیون': 'Abdomen Soft & Non-Distended',
  'دیستانسیون شکمی': 'Abdominal Distension',
  'صداهای روده‌ای برقرار (Normoactive BS)': 'Normoactive Bowel Sounds',
  'کاهش/سکوت صداهای روده‌ای (Ileus)': 'Hypoactive / Absent Bowel Sounds (Ileus)',
  'تندرنس خفیف محدود به محل برش عمل': 'Mild Tenderness Limited to Incision Site',
  'ریباند یا گاردینگ': 'Rebound or Guarding',
  'پانسمان تمیز و خشک (CDI)': 'Clean, Dry & Intact Dressing (CDI)',
  'اریتم / ترشح زخم': 'Wound Erythema / Discharge',
  'کشیدن کامل بخیه‌ها': 'Complete Suture Removal',
  'کشیدن یک‌درمیان بخیه‌ها': 'Alternate Suture Removal',
  'باز کردن بخیه جهت درناژ': 'Suture Opening for Wound Drainage',
  'اندام‌ها گرم، بدون ادم و بدون تندرنس ساق (DVT منفی)': 'Extremities Warm, No Edema or Calf Tenderness (Negative DVT)',
  'ادم یا تندرنس یک‌طرفه ساق پا': 'Unilateral Calf Edema or Tenderness',
  // Legacy SOAP wound capsules
  'پانسمان تمیز و خشک (Clean, Dry, Intact)': 'Clean, Dry & Intact Dressing (CDI)',
  'ترشح سروزی خفیف': 'Mild Serous Drainage',
  'اریتم و گرمی اطراف زخم': 'Peri-wound Erythema & Warmth',
  'ترشح چرکی (SSI)': 'Purulent Discharge (SSI)',
  'باز شدن سطحی/عمقی زخم (Dehiscence)': 'Wound Dehiscence',
  'هماتوم / سروما': 'Hematoma / Seroma',
  // SOAP Assessment & Plan pills
  'پایدار و رو به بهبود': 'Stable & Improving',
  'نیازمند پایش دقیق (Close Observation)': 'Requires Close Observation',
  'بدحال / بحرانی (Critical)': 'Critically Ill',
  'آماده ترخیص': 'Ready for Discharge',
  'ادامه رژیم فعلی / NPO': 'Continue Current Diet / NPO',
  'پیشرفت رژیم غذایی (Diet Advancement)': 'Advance Diet as Tolerated',
  'تجویز سرم‌تراپی نگهدارنده': 'Continue Maintenance IV Fluids',
  'ادامه آنتی‌بیوتیک و مسکن فعلی': 'Continue Current Antibiotics & Analgesics',
  'تعویض پانسمان روزانه با سرم شستشو': 'Daily Sterile Saline Wound Dressing Change',
  'پروفیلاکسی DVT و تشویق به راه رفتن': 'DVT Prophylaxis & Encourage Early Ambulation',
  'کشیدن سوند فولی / درن جراحی': 'Discontinue Foley Catheter / Surgical Drain',
  'درخواست آزمایش کنترل صبح فردا (CBC, Cr, Lytes)': 'Order Morning Labs (CBC, Cr, Electrolytes)',
  'مشاوره داخلی / قلب / بیهوشی': 'Internal Medicine / Cardiology / Anesthesia Consult',
  'ترخیص با آموزش علائم هشدار و نسخه': 'Discharge Home with Red-Flag Precautions & Prescriptions',

  // ATLS Trauma Mode Capsules & Options (Bug 8 & Bug 9)
  'آمبولانس اورژانس ۱۱۵ (EMS)': 'EMS Ambulance (115)',
  'خودروی شخصی': 'Private Vehicle',
  'انتقال از مرکز دیگر': 'Inter-facility Transfer',
  'امداد هوایی': 'Air Ambulance / HEMS',
  'تصادف خودرو (MVC)': 'Motor Vehicle Collision (MVC)',
  'تصادف موتورسیکلت (MCC)': 'Motorcycle Collision (MCC)',
  'عابر پیاده با خودرو': 'Pedestrian Struck by Vehicle',
  'سقوط از ارتفاع (Fall)': 'Fall from Height',
  'چاقو / جسم تیز (Stab Wound)': 'Penetrating Stab Wound',
  'گلوله / سلاح گرم (GSW)': 'Gunshot Wound (GSW)',
  'ترومای بلانت / ضرب‌وشتم': 'Blunt Assault / Trauma',
  'سوختگی حرارتی / شیمیایی': 'Thermal / Chemical Burn',
  'انفجار (Blast Injury)': 'Blast Injury',
  'کولار گردنی و تخته پشتی': 'Cervical Collar & Long Backboard',
  'اکسیژن‌تراپی': 'Supplemental Oxygen',
  'رگ‌گیری و سرم‌تراپی': 'IV Access & Crystalloid Infusion',
  'پانسمان فشاری / تورنیکت': 'Pressure Dressing / Tourniquet',
  'لوله‌گذاری تراشه (Intubation)': 'Prehospital Endotracheal Intubation',
  'اقدام خاصی نشده': 'No Prehospital Intervention',
  'باز و پایدار — صحبت می‌کند (Patent, C-Spine Collar Fixed)': 'Patent & Stable Airway — Speaking Clearly (C-Spine Immobilized)',
  'باز با مانور / ایروی دهانی — نیازمند ساکشن و پایش': 'Maintained with Airway Adjunct / Suctioning & Close Monitoring',
  'استریدور، صدای خشن یا جسم خارجی در راه هوایی': 'Stridor, Hoarseness or Airway Foreign Body',
  'تهدید راه هوایی / GCS ≤ 8 — اینتوباسیون اورژانس انجام شد': 'Compromised Airway / GCS ≤ 8 — Emergent Intubation Performed',
  'سمع دوطرفه شفاف و قرینه، تراشه در خط وسط (Clear Bilateral)': 'Clear & Equal Bilateral Breath Sounds, Midline Trachea',
  'کاهش صدای تنفسی یک‌طرفه (مشکوک به همو/پنوموتوراکس)': 'Unilateral Decreased Breath Sounds (Suspected Hemo/Pneumothorax)',
  'پنوموتوراکس فشارنده — دکمپرسیون سوزنی و Chest Tube انجام شد': 'Tension Pneumothorax — Needle Decompression & Tube Thoracostomy Performed',
  'آمفیزم زیرجلدی در جدار قفسه سینه / گردن': 'Subcutaneous Emphysema of Chest Wall / Neck',
  'قفسه سینه شناور / تنفس پارادوکس (Flail Chest)': 'Flail Chest / Paradoxical Chest Wall Motion',
  'همودینامیک پایدار، CRT < 2s و نبض‌های محیطی پر': 'Hemodynamically Stable, CRT < 2s & Full Peripheral Pulses',
  'علائم شوک و بی‌ثباتی همودینامیک (تاکی‌کاردی، افت فشار خون)': 'Signs of Hemorrhagic Shock / Instability (Tachycardia, Hypotension)',
  'خونریزی فعال خارجی — کنترل با فشار مستقیم / تورنیکت': 'Active External Hemorrhage — Controlled with Direct Pressure / Tourniquet',
  'خونریزی فعال خارجی با فوران عروقی': 'Active Pulsatile Arterial Hemorrhage',
  '۲ خط وریدی قطور (14–16G) + شروع احیای مایعات / خون': 'Two Large-Bore IVs (14–16G) + Warm Crystalloid / Blood Resuscitation Initiated',
  'هوشیار و Oriented (GCS 15/15)، مردمک‌ها قرینه و راکتیو (PERRLA)': 'Alert & Oriented (GCS 15/15), Pupils Equal & Reactive (PERRLA)',
  'کاهش سطح هوشیاری / آژیتاسیون پس از تروما': 'Altered Mental Status / Post-Traumatic Agitation',
  'آنیزوکوریا / مردمک دیلاته یا غیرواکنشی': 'Anisocoria / Unilateral Dilated or Non-reactive Pupil',
  'نقص فوکال عصبی یا پلژی اندام‌ها': 'Focal Neurologic Deficit or Extremity Plegia',
  'بیمار کاملاً برهنه معاینه شد و با پتوی گرم پوشانده شد (Prevent Hypothermia)': 'Full Exposure Completed & Warmed Blankets Applied (Normothermia Maintained)',
  'هیپوترمی بارز در بدو ورود — گرم‌سازی فعال شروع شد': 'Hypothermia on Arrival — Active Rewarming Initiated',
  'فاقد حساسیت دارویی (NKDA)': 'No Known Drug Allergies (NKDA)',
  'بدون مصرف دارو': 'No Regular Medications',
  'بدون مصرف آنتی‌کوآگولانت': 'No Anticoagulant / Antiplatelet Use',
  'فاقد بیماری زمینه‌ای': 'No Significant Past Medical History',
  'بیش از ۶ ساعت قبل': '> 6 Hours Prior to Arrival',
  'نرموسفال، بدون هماتوم یا شکستگی صورت، بدون Battle/Raccoon Sign': 'Normocephalic, No Scalp Hematoma, Facial Instability, Battle or Raccoon Signs',
  'لاسراسیون / هماتوم اسکالپ یا صورت': 'Scalp or Facial Laceration / Hematoma',
  'اتوره / رینوره یا ایکموز پری‌اوربیتال/ماستوئید (شکستگی قاعده جمجمه)': 'Otorrhea/Rhinorrhea or Raccoon Eyes/Battle Sign (Basilar Skull Fracture Signs)',
  'بدون تندرنس خط وسط گردن، بدون JVD یا انحراف تراشه (کولار بسته)': 'No Midline C-Spine Tenderness, JVD or Tracheal Deviation (Collar Intact)',
  'تندرنس مهره‌های گردنی (C-Spine Tenderness)': 'Midline Cervical Spine Tenderness',
  'هماتوم گردنی یا آمفیزم زیرجلدی گردن': 'Cervical Hematoma or Subcutaneous Emphysema',
  'جدار قفسه سینه پایدار، بدون تندرنس دنده‌ای یا کرپیتوس، قلب و ریه نرمال': 'Stable Chest Wall, No Rib Tenderness or Crepitus, Normal Cardiopulmonary Exam',
  'تندرنس دنده‌ها / اکیموز کمربند ایمنی (Seatbelt Sign)': 'Rib Tenderness / Thoracic Seatbelt Sign',
  'کرپیتوس دنده‌ای یا زخم قفسه سینه': 'Rib Crepitus or Thoracic Wound',
  'شکم نرم، بدون تندرنس یا گاردینگ، لگن در معاینه پایدار (Pelvis Stable)': 'Abdomen Soft, Non-tender without Guarding; Pelvis Stable to Compression',
  'تندرنس / گاردینگ شکمی یا Seatbelt Sign شکم': 'Abdominal Tenderness / Guarding or Abdominal Seatbelt Sign',
  'ناپایداری یا درد حلقه لگنی (Pelvic Binder بسته شد)': 'Pelvic Ring Pain or Instability (Pelvic Binder Applied)',
  'خون در مئاتوس ادراری / هماتوم پرینه': 'Blood at Urethral Meatus / Perineal Hematoma',
  'Log-roll با حفظ محور ستون فقرات: بدون تندرنس مهره‌ای، Step-off یا زخم پشت، تون اسفنکتر نرمال': 'Inline Log-Roll: No Thoracolumbar Tenderness, Step-Off or Posterior Wounds; Normal Rectal Tone',
  'تندرنس خط وسط توراکولومبار یا Step-off مهره‌ای': 'Midline Thoracolumbar Tenderness or Vertebral Step-Off',
  'زخم یا اکیموز در ناحیه پشت / فلانک': 'Posterior / Flank Wound or Ecchymosis',
  'اندام‌ها بدون دفورمیتی یا تورم، نبض‌های دیستال ۲+ قرینه، حس و حرکت سالم': 'Extremities without Deformity or Swelling, 2+ Symmetric Distal Pulses, Intact Sensorimotor Exam',
  'دفورمیتی / تندرنس یا محدودیت حرکت مشکوک به شکستگی': 'Limb Deformity / Tenderness Suspected for Fracture',
  'کاهش/فقدان نبض دیستال یا علائم سندرم کمپارتمان': 'Diminished/Absent Distal Pulse or Compartment Syndrome Signs',
  'بریدگی / پارگی (Laceration)': 'Laceration',
  'زخم نافذ چاقو (Stab Wound)': 'Stab Wound',
  'مدخل/مخرج گلوله (GSW)': 'GSW Entry / Exit Wound',
  'خراشیدگی / ساییدگی (Abrasion)': 'Abrasion',
  'له‌شدگی / هماتوم (Contusion)': 'Contusion / Hematoma',
  'آپوتاسیون / کنده‌شدگی (Avulsion)': 'Avulsion / Amputation',
  'شکستگی باز (Open Fracture)': 'Open Fracture',
  'تغییر شکل شکستگی بسته': 'Closed Fracture Deformity',
  'سوختگی موضعی': 'Localized Burn',
  'کنترل‌شده / بدون خونریزی فعال': 'Controlled / No Active Bleeding',
  'خونریزی وریدی فعال': 'Active Venous Bleeding',
  'خونریزی شریانی جهنده': 'Pulsatile Arterial Bleeding',
  'هماتوم پیش‌رونده (Expanding)': 'Expanding Hematoma',
  'سالم (نبض، حس و حرکت نرمال)': 'Intact (Normal Pulse, Motor & Sensation)',
  'اختلال حسی دیستال': 'Distal Sensory Deficit',
  'اختلال حرکتی / تاندونی': 'Motor / Tendon Deficit',
  'کاهش یا فقدان نبض دیستال (ایسکمی)': 'Diminished or Absent Distal Pulse (Ischemia)',
  'درجه ۱ (سطحی / اریتم)': '1st Degree (Superficial / Erythema)',
  'درجه ۲ سطحی (تاول و دردناک)': 'Superficial 2nd Degree (Partial-Thickness / Blisters)',
  'درجه ۲ عمقی': 'Deep 2nd Degree (Deep Partial-Thickness)',
  'درجه ۳ (تمام ضخامت / چرمی بدون درد)': '3rd Degree (Full-Thickness / Leathery Eschar)',
  'درجه ۴ (درگیری عضله/استخوان)': '4th Degree (Deep Muscle / Bone Involvement)',
  'درجه ۴ (درگیری استخوان و عضله عمقی)': '4th Degree (Deep Muscle & Bone Involvement)',
  'منفی (Negative — بدون مایع آزاد)': 'Negative (No Free Fluid or Pneumothorax)',
  'مثبت (Positive — مایع آزاد / پنوموتوراکس)': 'Positive (Free Fluid / Pneumothorax Detected)',
  'مبهم / نیازمند تکرار یا CT': 'Equivocal / Repeat eFAST or CT Indicated',
  'انجام نشده': 'Not Performed',
  'RUQ (فضای موریسون)': 'RUQ (Morison Pouch)',
  'LUQ (اطراف طحال)': 'LUQ (Perisplenic / Splenorenal)',
  'پریکارد (Subxiphoid)': 'Pericardial (Subxiphoid)',
  'لگن (Suprapubic)': 'Pelvic (Suprapubic / Pouch of Douglas)',
  'پلور راست (پنومو/هموتوراکس)': 'Right Pleural (Pneumo/Hemothorax)',
  'پلور چپ (پنومو/هموتوراکس)': 'Left Pleural (Pneumo/Hemothorax)',
  'پایش مداوم علائم حیاتی و مانیتورینگ قلبی': 'Continuous Vital Signs & Cardiac Monitoring',
  'دو رگ قطور محیطی + احیا با کریستالوئید گرم': 'Two Large-Bore IVs + Warm Crystalloid Resuscitation',
  'رزرو و کراس‌مچ خون (Packed RBC / FFP)': 'Type & Crossmatch Blood Products (pRBC / FFP)',
  'تزریق واکسن کزاز (Td / Tetabulin) و آنتی‌بیوتیک پروفیلاکسی': 'Tetanus Prophylaxis (Td / TIG) & Prophylactic IV Antibiotics',
  'شستشو، دبریدمان و سوچور اولیه زخم‌ها': 'Wound Irrigation, Debridement & Primary Closure',
  'آتل‌گیری و بی‌حرکت‌سازی اندام (Splinting)': 'Extremity Splinting & Immobilization',
  'تعبیه سوند فولی (پس از رد آسیب مجرا) و NGT': 'Foley Catheter (After Urethral Clearance) & NGT Placement',
  'درخواست گرافی تروما (CXR, Pelvis) و CT Scan': 'Trauma Series Radiographs (CXR, Pelvis) & CT Scan',
  'مشاوره جراحی اعصاب / ارتوپدی / عروق': 'Neurosurgery / Orthopedics / Vascular Surgery Consult',
  'انتقال اورژانس به اتاق عمل (OR)': 'Emergent Transfer to Operating Room (OR)',

  // Exact HTML data-val / data-plan / data-uo-status & default clinical strings
  'بهبود کلی علائم نسبت به دیروز': 'Overall Clinical Improvement Compared to Yesterday',
  'بدون تغییر بارز / وضعیت مشابه دیروز': 'Clinically Stationary / Unchanged Compared to Yesterday',
  'بدتر شدن علائم یا شکایت جدید': 'Clinical Deterioration or New Symptom Onset',
  'درد خفیف و کنترل‌شده با مسکن در محل عمل': 'Mild Incisional Pain Well Controlled with Analgesics',
  'درد متوسط تا شدید نیازمند دوز اضافی آنالژزیک': 'Moderate-to-Severe Pain Requiring Breakthrough Analgesia',
  'فاقد هرگونه درد و آرام (Pain-free)': 'Pain-Free and Comfortable',
  'تحمل خوب مایعات صاف (Clear Liquids Tolerated)': 'Tolerating Clear Liquid Diet Well',
  'NPO کامل و بدون تحمل خوراکی': 'Strict NPO',
  'تحمل رژیم غذایی معمولی بدون تهوع (Regular Diet Tolerated)': 'Tolerating Regular Diet without Nausea',
  'تغذیه از طریق لوله معده (NGT Feeding Tolerated)': 'Tolerating Enteral NGT Feeding',
  'خارج شدن از تخت و راه رفتن در بخش (Out of Bed / Ambulating)': 'Out of Bed and Ambulating in Ward',
  'نشستن لبه تخت (Dangling at bedside)': 'Sitting at Edge of Bed (Dangling)',
  'استراحت مطلق در تخت (CBR / Bedridden)': 'Complete Bed Rest (CBR)',
  'همودینامیک پایدار (Stable)': 'Hemodynamically Stable',
  'ناپایدار / نیازمند وازوپرسور (Unstable)': 'Hemodynamically Unstable / Vasopressor-Dependent',
  'دفع ادرار طبیعی و کافی (بدون فولی)': 'Adequate Spontaneous Voiding (No Foley)',
  'سوند فولی برقرار — ادرار شفاف': 'Foley Catheter Patent — Clear Urine',
  'الیگوری (کاهش برون‌ده ادراری < 400cc)': 'Oliguria (24h Urine Output < 400 mL)',
  'آنوری / فاقد برون‌ده ادراری (Anuria / No Urine Output)': 'Anuria / Absent Urine Output',
  'بیمار ESRD تحت همودیالیز (فاقد دیورز پایه)': 'Known ESRD on Maintenance Hemodialysis (Baseline Anuric)',
  'در سیر بهبودی پایدار پس از عمل (Improving / Uneventful Recovery)': 'Improving on an Uneventful Post-Operative Recovery Course',
  'وضعیت پایدار، نیازمند ادامه پایش و تکمیل ورکاپ (Stable / Ongoing Workup)': 'Clinically Stable, Ongoing Inpatient Monitoring & Workup',
  'نیازمند بررسی از نظر بروز عارضه یا ناپایداری (Complicated / Guarded)': 'Guarded Clinical Status — Evaluation for Potential Complication Required',
  'ادامه درمان، داروها و اقدامات طبق نظر و دستورات استاد / متخصص محترم بخش': 'Continue Management, Medications & Orders per Attending Surgeon',
  'کشیدن درن / فولی / NGT طبق نظر رزیدنت/استاد محترم': 'Discontinue Drain / Foley / NGT per Surgical Team Order',
  'پیگیری مشاوره‌ها و آزمایش‌های درخواست‌شده': 'Follow Up Pending Consultations & Laboratory Studies',
  'ادامه NPO و سرم‌تراپی نگهدارنده': 'Maintain NPO & Maintenance IV Crystalloids',
  'شروع رژیم مایعات صاف (Clear Liquid Diet)': 'Initiate Clear Liquid Diet',
  'پیشرفت رژیم به نرم / معمولی (Advance Diet as Tolerated)': 'Advance Diet to Soft / Regular as Tolerated',
  'کاهش یا قطع سرم (D/C IV Fluids / Heparin Lock)': 'Taper / Discontinue IV Fluids (Saline Lock)',
  'تعویض پانسمان روزانه و شستشوی زخم': 'Daily Sterile Wound Dressing Change & Irrigation',
  'خارج کردن سوند فولی (D/C Foley Catheter)': 'Discontinue Foley Catheter',
  'خارج کردن لوله معده (D/C NGT)': 'Discontinue Nasogastric Tube (NGT)',
  'خارج کردن درن جراحی (D/C Drain)': 'Remove Surgical Drain',
  'ادامه پایش دقیق بیلان I/O و دبی درن': 'Continue Strict 24h I/O Balance & Drain Output Monitoring',
  'ادامه آنتی‌بیوتیک‌تراپی فعلی': 'Continue Current IV Antibiotic Regimen',
  'قطع آنتی‌بیوتیک پروفیلاکسی پس از عمل': 'Discontinue Post-Operative Prophylactic Antibiotics',
  'کنترل درد با مسکن (Apotel / NSAID / Opioid PRN)': 'Multimodal Analgesia (IV Acetaminophen / NSAID / Opioid PRN)',
  'ازسرگیری داروهای زمینه‌ای قلبی/فشارخون/دیابت بیمار': 'Resume Home Cardiovascular / Antihypertensive / Diabetic Medications',
  'ادامه پروفیلاکسی ترومبوآمبولی (هپارین/انوکساپارین/جوراب واریس)': 'Continue VTE Prophylaxis (Heparin / Enoxaparin / Compression Stockings)',
  'ادامه پروفیلاکسی زخم استرس (پنتوپرازول)': 'Continue Stress Ulcer Prophylaxis (Pantoprazole)',
  'تشویق به راه رفتن زودهنگام در بخش (Early Ambulation) و فیزیوتراپی تنفسی': 'Encourage Early Ambulation & Incentive Spirometry',
  'چک مجدد CBC و الکترولیت‌ها فردا صبح': 'Recheck Morning CBC & Serum Electrolytes',
  'پیگیری جواب پاتولوژی، کشت و تصویربرداری': 'Follow Up Pending Pathology, Cultures & Imaging Reports',
  'انجام مشاوره تخصصی': 'Request Specialty Consultation',
  'ادامه بستری و مراقبت در بخش جراحی': 'Continue Inpatient Surgical Ward Care & Monitoring',
  'آماده‌سازی جهت انتقال به اتاق عمل (Pre-Op Prep)': 'Pre-Operative Preparation for Transfer to OR',
  'قابل ترخیص در صورت تداوم پایداری با آموزش علائم هشدار و نسخه سرپایی': 'Candidate for Discharge if Stable with Red-Flag Precautions & Outpatient Prescriptions',
  'اورژانس ۱۱۵ (EMS)': 'EMS Ambulance (115)',
  'مراجعه شخصی (Walk-in)': 'Walk-in / Private Vehicle',
  'اعزام از مرکز دیگر (Inter-facility Transfer)': 'Inter-facility Transfer',
  'چاقوخوردگی و جسم تیز (Stab Wound)': 'Penetrating Stab / Sharp Object Wound',
  'اصابت گلوله یا ساچمه (GSW / Shotgun)': 'Gunshot / Shotgun Wound (GSW)',
  'تصادف خودرو/موتور/عابر (MVA/MCA/Pedestrian)': 'Motor Vehicle / Motorcycle / Pedestrian Collision',
  'سقوط از ارتفاع (Fall from Height)': 'Fall from Height',
  'نزاع و ترومای بلانت (Assault / Blunt Trauma)': 'Assault / Blunt Trauma',
  'سوختگی (حرارتی/شیمیایی/الکتریکی)': 'Burn Injury (Thermal / Chemical / Electrical)',
  'فیکس گردن با کلار سخت (Hard Collar)': 'Rigid Cervical Collar Immobilization',
  'اینتوباسیون پیش‌بیمارستانی (Pre-hospital Intubation)': 'Pre-hospital Endotracheal Intubation',
  'پانسمان فشاری / کنترل خونریزی': 'Pressure Dressing / Hemorrhage Control',
  'سرم‌تراپی (IV Access & Fluids)': 'Pre-hospital IV Access & Fluids',
  'آتل‌بندی اندام (Splinting)': 'Extremity Splinting',
  'راه هوایی باز و بیمار قادر به تکلم (Patent & Speaking)': 'Airway Patent & Patient Speaking Clearly',
  'تنفس صدادار / استریدور / خون و ترشح در دهان (نیازمند ساکشن)': 'Noisy Breathing / Stridor / Oropharyngeal Blood or Secretions (Suction Required)',
  'اینتوبه (ETT در محل، تهویه مکانیکی برقرار)': 'Endotracheally Intubated (ETT Secured, Mechanical Ventilation)',
  'کلار گردنی سخت (Hard Collar) فیکس شده': 'Rigid Cervical Collar Secured in Place',
  'حرکات قفسه سینه قرینه و سمع دوطرفه شفاف (Clear Bilateral BS)': 'Symmetric Chest Wall Expansion & Clear Bilateral Breath Sounds',
  'کاهش یا عدم سمع صدا در همی‌توراکس راست': 'Decreased / Absent Breath Sounds over Right Hemithorax',
  'کاهش یا عدم سمع صدا در همی‌توراکس چپ': 'Decreased / Absent Breath Sounds over Left Hemithorax',
  'آمفیزم زیرجلدی (Subcutaneous Emphysema)': 'Subcutaneous Emphysema',
  'انحراف تراشه (Tracheal Deviation)': 'Tracheal Deviation',
  'دیسترس تنفسی و تاکی‌پنه': 'Respiratory Distress & Tachypnea',
  'همودینامیک پایدار (Hemodynamically Stable)': 'Hemodynamically Stable',
  'تاکیکاردی / افت فشار و شوک هموراژیک': 'Tachycardia / Hypotension & Hemorrhagic Shock',
  'نبض‌های مرکزی و محیطی پر و قرینه': 'Full & Symmetric Central and Peripheral Pulses',
  'خونریزی فعال خارجی (کنترل‌شده با پانسمان فشاری/تورنیکه)': 'Active External Hemorrhage (Controlled with Pressure Dressing / Tourniquet)',
  'لگن در معاینه پایدار (Pelvic Ring Stable)': 'Pelvic Ring Stable on Compression',
  'لگن ناپایدار — بستن Pelvic Binder انجام شد': 'Unstable Pelvic Ring — Pelvic Binder Applied',
  'مردمک‌ها قرینه و راکتیو به نور (PERRLA)': 'Pupils Equal, Round & Reactive to Light (PERRLA)',
  'آنیزوکوری (Anisocoria)': 'Anisocoria',
  'بدون نقص عصبی فوکال (No Focal Deficit)': 'No Focal Neurologic Deficit',
  'نقص عصبی فوکال یا پاراپلژی/کوادری‌پلژی': 'Focal Neurologic Deficit or Paraplegia / Quadriplegia',
  'برهنه‌سازی کامل و بررسی پشت (Log-roll) انجام شد؛ بدون تندرنس ستون فقرات': 'Full Exposure & Inline Log-Roll Performed; No Spinal Tenderness',
  'تندرنس یا Step-off در لمس ستون فقرات پشتی/کمری (+)': 'Thoracolumbar Midline Tenderness or Step-Off (+)',
  'جلوگیری از هیپوترمی (پتو گرم و مایعات گرم)': 'Hypothermia Prevention (Warm Blankets & Warmed Fluids)',
  'حساسیت دارویی یا غذایی شناخته‌شده‌ای ندارد (NKDA)': 'No Known Drug or Food Allergies (NKDA)',
  'عدم مصرف داروی خاص یا ضدانعقاد': 'No Regular Medications or Anticoagulants',
  'بدون سابقه بیماری زمینه‌ای یا جراحی قبلی': 'No Significant Past Medical or Surgical History',
  'نیازمند بررسی و تزریق پروفیلاکسی کزاز (Tetanus Toxoid / TIG در صورت اندیکاسیون)': 'Evaluate & Administer Tetanus Prophylaxis (Td / TIG if Indicated)',
  'درجه ۲ سطحی / عمقی (Partial Thickness - II)': '2nd Degree Superficial/Deep (Partial Thickness - II)',
  'درجه ۱ (Superficial - I)': '1st Degree (Superficial - I)',
  'درجه ۳ تمام‌ضخامت (Full Thickness - III)': '3rd Degree (Full Thickness - III)',
  'ترکیبی درجه ۲ و ۳ (Mixed II & III)': 'Mixed 2nd & 3rd Degree Burn',
  'eFAST منفی (فاقد مایع آزاد در پریکارد، موریسون، اسپلنورنال و لگن؛ بدون پنوموتوراکس)': 'Negative eFAST (No Pericardial, Morison, Splenorenal or Pelvic Free Fluid; No Pneumothorax)',
  'eFAST مثبت از نظر مایع آزاد (Free Fluid +)': 'Positive eFAST for Intraperitoneal / Pericardial Free Fluid (+)',
  'eFAST مثبت از نظر پنوموتوراکس / هموتوراکس': 'Positive Thoracic eFAST for Pneumothorax / Hemothorax (+)',
  'تعبیه ۲ رگ محیطی مناسب و سرم‌تراپی ایزوتونیک (Ringer / NS)': 'Two Large-Bore Peripheral IVs & Isotonic Crystalloid Resuscitation (LR / NS)',
  'تعبیه چست‌تیوب (Tube Thoracostomy)': 'Tube Thoracostomy (Chest Tube Placement)',
  'لوله‌گذاری معده (NGT / OGT)': 'Gastric Decompression (NGT / OGT)',
  'تعبیه سوند فولی و پایش برون‌ده ادراری': 'Foley Catheterization & Hourly Urine Output Monitoring',
  'رزرو و تزریق خون (Packed RBC / FFP)': 'Type, Crossmatch & Transfuse Blood Products (pRBC / FFP)',
  'شستشو، دبریدمان و سوچور اولیه زخم در اورژانس': 'Wound Irrigation, Debridement & Primary Suture Repair in ED',
  'تزریق آنتی‌بیوتیک پروفیلاکسی و واکسن/ایمونوگلوبولین کزاز': 'Prophylactic IV Antibiotics & Tetanus Toxoid / Immunoglobulin',
  'درخواست مشاوره‌های تخصصی (جراحی اعصاب، ارتوپدی، ارولوژی)': 'Specialty Trauma Consultations (Neurosurgery, Orthopedics, Urology)',
  'انتقال فوری به اتاق عمل (Emergent Transfer to OR)': 'Emergent Transfer to Operating Room (OR)',
  'بستری تحت نظر جهت پایش سریال معاینه و هموگلوبین (Serial Exam & Hb)': 'Inpatient Observation for Serial Abdominal Exams & Serial Hb',

  // SOAP 5-Row Focused Daily PE Capsules (data-pe-val) & Drain / Legacy Defaults
  'هوشیار و Oriented (GCS=15)': 'Alert & Oriented (GCS=15)',
  'همودینامیک پایدار': 'Hemodynamically Stable',
  'بدون تب (Afebrile)': 'Afebrile',
  'ظاهر Ill / Toxic': 'Ill / Toxic Appearance',
  'سمع ریه دوطرفه شفاف': 'Lungs Clear to Auscultation Bilaterally',
  'کراکل / کاهش صدا در قاعده ریه': 'Basilar Crackles / Decreased Breath Sounds',
  'سمع قلب نرمال (S1, S2 منظم)': 'Normal Heart Sounds (Regular S1, S2)',
  'تاکیکاردی': 'Tachycardia',
  'شکم نرم و بدون دیستانسیون': 'Abdomen Soft & Non-Distended',
  'دیستانسیون شکمی': 'Abdominal Distension',
  'صداهای روده‌ای برقرار (Normoactive BS)': 'Normoactive Bowel Sounds Present',
  'کاهش/سکوت صداهای روده‌ای (Ileus)': 'Hypoactive / Absent Bowel Sounds (Ileus)',
  'تندرنس خفیف محدود به محل برش عمل': 'Mild Tenderness Localized to Surgical Incision',
  'ریباند یا گاردینگ': 'Rebound Tenderness or Guarding',
  'پانسمان تمیز و خشک (CDI)': 'Clean, Dry & Intact Dressing (CDI)',
  'اریتم / ترشح زخم': 'Wound Erythema / Discharge',
  'کشیدن کامل بخیه‌ها': 'Complete Suture / Staple Removal Performed',
  'کشیدن یک‌درمیان بخیه‌ها': 'Alternate Suture / Staple Removal Performed',
  'باز کردن بخیه جهت درناژ': 'Incision Partially Opened for Bedside Drainage',
  'اندام‌ها گرم، بدون ادم و بدون تندرنس ساق (DVT منفی)': 'Extremities Warm, No Edema or Calf Tenderness (DVT Negative)',
  'ادم یا تندرنس یک‌طرفه ساق پا': 'Unilateral Calf Swelling / Tenderness (Suspected DVT)',
  'سروزی (Serous)': 'Serous',
  'سروزانگوئینو (Serosanguinous)': 'Serosanguinous',
  'خونی (Bloody / Sanguinous)': 'Bloody / Sanguinous',
  'صفراوی (Bilious)': 'Bilious',
  'چرکی / کدر (Purulent / Turbid)': 'Purulent / Turbid',
  'سروزی': 'Serous',
  'سروزانگوئینو': 'Serosanguinous',
  'خونی': 'Sanguinous',
  'صفراوی': 'Bilious',
  'چرکی': 'Purulent',
  'جراحی': 'Surgical',
  'هوشیار، بدون دیسترس حاد، سمع قلب و ریه شفاف': 'Alert, No Acute Distress, Lungs Clear & Heart Regular',
  'شکم نرم، بدون دیستانسیون یا پریتونیت': 'Abdomen Soft, Non-Distended, No Peritoneal Signs',
  'پانسمان تمیز و خشک (Clean, Dry & Intact)': 'Clean, Dry & Intact Dressing (CDI)',

  // ATLS Head-to-Toe Secondary Survey Capsules (data-atls-sec-region) & eFAST Windows
  'نرموسفال، بدون دفرمیتی یا شکستگی استخوانی': 'Normocephalic, Atraumatic, No Bony Step-Off',
  'بدون اتوره، رینوره یا Battle/Raccoon Sign': 'No Otorrhea, Rhinorrhea, Battle or Raccoon Signs',
  'لاسراسیون یا هماتوم اسکالپ و صورت': 'Scalp / Facial Laceration or Hematoma',
  'علائم شکستگی قاعده جمجمه یا فک و صورت': 'Suspected Basilar Skull or Maxillofacial Fracture',
  'تراشه در خط وسط، بدون JVD یا هماتوم در حال گسترش': 'Trachea Midline, No JVD or Expanding Hematoma',
  'بدون تندرنس خط وسط گردن (تحت کلار گردنی)': 'No Midline C-Spine Tenderness (In Cervical Collar)',
  'تندرنس خط وسط مهره‌های گردنی (+)': 'Midline Cervical Spine Tenderness (+)',
  'هماتوم گردنی یا زخم نافذ Zone I-III': 'Cervical Hematoma or Penetrating Zone I-III Injury',
  'سمع دوطرفه شفاف، بدون تندرنس یا کرپیتاسیون دنده‌ای': 'Clear Bilateral Breath Sounds, No Rib Tenderness or Crepitus',
  'صداهای قلبی واضح و طبیعی (بدون مافل بودن)': 'Crisp Normal Heart Sounds (No Muffling)',
  'تندرنس دنده‌ای / کرپیتاسیون / اکیموز جدار سینه': 'Rib Tenderness / Crepitus / Chest Wall Ecchymosis',
  'حرکت متناقض قفسه سینه (Flail Chest)': 'Paradoxical Chest Wall Motion (Flail Segment)',
  'شکم نرم، بدون دیستانسیون، بدون تندرنس و گاردینگ': 'Abdomen Soft, Non-Distended, Non-Tender, No Guarding',
  'حلقه لگن پایدار و بدون تندرنس': 'Pelvic Ring Stable & Non-Tender',
  'علامت کمربند ایمنی (Seatbelt Sign) یا اکیموز جدار شکم': 'Abdominal Seatbelt Sign / Abdominal Wall Ecchymosis',
  'تندرنس شکمی / ریباند / گاردینگ (پریتونیت ترومایی)': 'Abdominal Tenderness / Rebound / Guarding (Traumatic Peritonitis)',
  'بدون خون در مئاتوس، بدون هماتوم پرینه/اسکروتوم': 'No Blood at Urethral Meatus, No Perineal/Scrotal Hematoma',
  'تون اسفنکتر مقعدی طبیعی و بدون خون روشن در DRE': 'Normal Anal Sphincter Tone, No Gross Blood on DRE',
  'خون در مئاتوس ادراری یا هماتوم پرینه (ممنوعیت فولی)': 'Blood at Urethral Meatus / Perineal Hematoma (Foley Contraindicated)',
  'کاهش تون اسفنکتر یا خون روشن در DRE': 'Decreased Sphincter Tone or Gross Blood on DRE',
  'بدون دفرمیتی واضح اندام‌ها، کمپارتمان‌ها نرم': 'No Gross Limb Deformity, Soft Compartments',
  'نبض‌های دیستال پر و قرینه، حس و حرکت دیستال برقرار (Intact Distal NV)': 'Full Symmetric Distal Pulses, Intact Distal Motor & Sensory Function',
  'دفرمیتی، تورم یا شکستگی باز/بسته اندام': 'Limb Deformity, Swelling, or Open/Closed Fracture',
  'کاهش/فقدان نبض دیستال یا شک به سندرم کمپارتمان': 'Diminished/Absent Distal Pulse or Suspected Compartment Syndrome',
  "مایع آزاد در بن‌بست موریسون (RUQ / Morrison's Pouch +)": "Free Fluid in Morison's Pouch (RUQ +)",
  'مایع آزاد در فضای اسپلنورنال (LUQ / Splenorenal +)': 'Free Fluid in Splenorenal Recess (LUQ +)',
  'مایع آزاد در لگن / کلدوساک (Pelvic / Suprapubic +)': 'Free Fluid in Pelvis / Pouch of Douglas (Suprapubic +)',
  'افیوژن پریکارد (Pericardial Effusion +)': 'Pericardial Effusion (+)',
  'عدم لغزش پلور در قفسه سینه (Absent Lung Sliding)': 'Absent Pleural Lung Sliding (Pneumothorax +)'
};

function stripPersianResidual(text) {
  if (!text || !/[\u0600-\u06FF]/.test(text)) return text;
  let cleaned = text
    .replace(/[\u0600-\u06FF\u200C]+/g, ' ')
    .replace(/\s*[،؛]\s*/g, ', ')
    .replace(/(?:\s*[-—–/:,+]\s*)+$/g, '')
    .replace(/^(?:\s*[-—–/:,+]\s*)+/g, '')
    .replace(/\(\s*[-—–/:,+]*\s*\)/g, '')
    .replace(/\(\s*([-—–/:,+])\s*/g, '(')
    .replace(/\s*([-—–/:,+])\s*\)/g, ')')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
  cleaned = cleaned.replace(/^[,.\-—–/:\s]+|[,.\-—–/:\s]+$/g, '').trim();
  return cleaned;
}

export function tBrands(rawBrands) {
  const str = String(rawBrands || '').trim();
  if (!str) return '';
  if (getCurrentLang() !== 'en') return str;
  if (!/[\u0600-\u06FF]/.test(str)) return str;
  const parts = str.split(/[,،]/).map((p) => stripPersianResidual(p)).filter(Boolean);
  return parts.join(', ');
}

export function tLabel(rawLabel, explicitEn = '') {
  const lang = getCurrentLang();
  if (lang !== 'en') {
    if (typeof rawLabel === 'object' && rawLabel !== null) {
      return rawLabel.fa || rawLabel.labelFa || rawLabel.label || rawLabel.id || '';
    }
    return rawLabel || '';
  }

  // English requested
  if (explicitEn && typeof explicitEn === 'string' && explicitEn.trim()) {
    return explicitEn.trim();
  }
  if (!rawLabel) return '';

  if (typeof rawLabel === 'object' && rawLabel !== null) {
    if (rawLabel.en) return rawLabel.en.trim();
    if (rawLabel.labelEn) return rawLabel.labelEn.trim();
    if (rawLabel.code) return rawLabel.code.trim();
    rawLabel = rawLabel.label || rawLabel.id || '';
  }

  const str = String(rawLabel).trim();
  if (DIRECT_FA_TO_EN_MAP[str]) {
    return DIRECT_FA_TO_EN_MAP[str];
  }

  // Already pure English/Latin (no Persian letters \u0600-\u06FF)
  if (!/[\u0600-\u06FF]/.test(str)) {
    return str;
  }

  // Case A: Starts with Latin/English before '(' — e.g. "Daily (روزانه)", "RUQ (فوقانی راست)", "Calcium (Ca - کلسیم سرم)"
  const firstParenIdx = str.indexOf('(');
  if (firstParenIdx > 0) {
    const prefix = str.slice(0, firstParenIdx).trim();
    if (/[A-Za-z]/.test(prefix) && !/[\u0600-\u06FF]/.test(prefix)) {
      const rest = str.slice(firstParenIdx);
      const innerMatch = rest.match(/^\(([^)]*)\)(.*)$/);
      if (innerMatch) {
        const cleanInner = stripPersianResidual(innerMatch[1]);
        const cleanTail = stripPersianResidual(innerMatch[2]);
        let out = prefix;
        if (cleanInner && /[A-Za-z0-9]/.test(cleanInner)) {
          out += ` (${cleanInner})`;
        }
        if (cleanTail && /[A-Za-z0-9]/.test(cleanTail)) {
          out += ` ${cleanTail}`;
        }
        return out.trim();
      }
      return prefix;
    }
  }

  // Case B: Parentheses contain Latin/English text — e.g. "تب (Fever)" -> "Fever", "تندرنس حین دق (Percussion Tenderness - نشانه پریتونیت)" -> "Percussion Tenderness"
  const parenMatches = [...str.matchAll(/\(([^)]*[A-Za-z][^)]*)\)/g)];
  if (parenMatches.length > 0) {
    const cleanedCandidates = parenMatches
      .map((m) => stripPersianResidual(m[1]))
      .filter((c) => c && /[A-Za-z]/.test(c));
    if (cleanedCandidates.length > 0) {
      return cleanedCandidates.join(' / ');
    }
  }

  // Case C: Slash-separated bilingual string — e.g. "بخش / Ward" -> "Ward"
  if (str.includes('/')) {
    const parts = str.split('/');
    for (const part of parts) {
      if (/[A-Za-z]/.test(part) && !/[\u0600-\u06FF]/.test(part)) {
        return part.trim();
      }
    }
  }

  // Case D: Stripped of any parentheses -> check map again
  const stripped = str.replace(/\([^)]*\)/g, '').trim();
  if (DIRECT_FA_TO_EN_MAP[stripped]) {
    return DIRECT_FA_TO_EN_MAP[stripped];
  }

  // Case E: Mixed Persian + English without parentheses -> strip Persian residual if meaningful English remains
  if (/[A-Za-z]{2,}/.test(str)) {
    const cleaned = stripPersianResidual(str);
    if (cleaned && /[A-Za-z]{2,}/.test(cleaned)) {
      return cleaned;
    }
  }

  return str;
}

export const CLINICAL_PRESENTATION_ARCHETYPES = [
  {
    id: 'pain_archetype',
    labelFa: 'درد یا ناراحتی (شکم، قفسه سینه، سر و گردن، کمر و اندام)',
    labelEn: 'Pain or Discomfort (Abdominal, Thoracic, HEENT, Extremities)',
    icon: 'zap',
    badge: 'OLDCARTS'
  },
  {
    id: 'mass_lesion_archetype',
    labelFa: 'توده، کیست، تورم یا ضایعه (پستان، پوست سر، فک، تیروئید، فتق)',
    labelEn: 'Mass, Cyst, Swelling or Lesion (Breast, Scalp, Mandible, Thyroid, Hernia)',
    icon: 'circle-dot',
    badge: 'Mass & Lesion'
  },
  {
    id: 'trauma_burn_archetype',
    labelFa: 'تروما، جراحت نافذ (چاقو/گلوله)، تصادف و سوختگی',
    labelEn: 'Trauma, Penetrating Wound (Stab/GSW), MVA & Burns',
    icon: 'alert-triangle',
    badge: 'ATLS Trauma'
  },
  {
    id: 'functional_bleeding_archetype',
    labelFa: 'شکایات عملکردی، خونریزی گوارشی، زردی یا تنگی نفس',
    labelEn: 'Functional, Dyspnea, GI Bleed, Painless Jaundice, Obstipation',
    icon: 'droplet',
    badge: 'Functional & Bleeding'
  },
  {
    id: 'elective_asymptomatic_archetype',
    labelFa: 'بستری الکتیو بی‌علامت / جراحی برنامه‌ریزی‌شده',
    labelEn: 'Elective / Asymptomatic Referral for Planned Surgery',
    icon: 'clipboard',
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
  { id: 'sym_cold_sweats', label: 'عرق سرد (Cold Sweats / Clammy Diaphoresis)', detailHint: 'توضیحات، همزمانی با درد یا افت فشار...' },
  { id: 'inability_pass_gas', label: 'عدم دفع گاز (Inability to pass flatus / Obstipation)', detailHint: 'از چند ساعت/روز قبل...' },
  { id: 'diarrhea', label: 'اسهال (Diarrhea)', detailHint: 'قوام، دفعات، خونی یا آبکی...' }
];

export const HPI_UNLOCKABLE_MODULES = [
  {
    id: 'mod_cholestasis',
    buttonLabel: 'باز کردن ماژول: علائم صفراوی و کلستاز (زردی، خارش، ادرار چای‌رنگ، مدفوع آکولیک)',
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
    buttonLabel: 'باز کردن ماژول: عوارض محل عمل جراحی اخیر و درن (درد/سفتی محل درن، ترشح، باز شدن بخیه)',
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
    buttonLabel: 'باز کردن ماژول: علائم خونریزی گوارشی و آنورکتال (هماتمز، ملنا، هماتوشزی، دیسفاژی)',
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
    buttonLabel: 'باز کردن ماژول: علائم توده، فتق، پستان و تیروئید (جا رفتن توده، تغییرات پوست، خشونت صدا)',
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
    buttonLabel: 'باز کردن ماژول: علائم ادراری و لگنی (دیزوری، هماچوری، احتباس/کاهش جریان ادرار)',
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
  { id: 'sym_fever', aliases: 'تب حرارت بالا داغی بدن پیرکسی fever pyrexia', label: 'تب (Fever / Pyrexia)', category: 'عمومی (Constitutional)', keywords: 'داغی بدن حرارت' },
  { id: 'sym_chills', aliases: 'لرز لرز تکانی سرما chills rigors', label: 'لرز و لرز تکانی (Chills / Rigors)', category: 'عمومی (Constitutional)', keywords: 'سرما لرزش' },
  { id: 'sym_night_sweats', aliases: 'تعریق شبانه عرق شبانه night sweats diaphoresis', label: 'تعریق شبانه (Night Sweats / Diaphoresis)', category: 'عمومی (Constitutional)', keywords: 'عرق شبانه خیس شدن' },
  { id: 'sym_cold_sweats', aliases: 'عرق سرد تعریق سرد خیس عرق شدن شوک سمپاتیک cold sweats clammy diaphoresis', label: 'عرق سرد (Cold Sweats / Clammy Diaphoresis)', category: 'عمومی (Constitutional)', keywords: 'عرق سرد شوک درد شدید' },
  { id: 'sym_dry_mouth_thirst', aliases: 'خشکی دهان عطش شدید تشنگی کم آبی دهیدراتاسیون dry mouth thirst polydipsia dehydration', label: 'خشکی دهان و عطش شدید (Severe Thirst / Dry Mouth — Dehydration)', category: 'عمومی (Constitutional)', keywords: 'تشنگی خشکی مخاط دهیدراتاسیون' },
  { id: 'sym_weight_loss', aliases: 'کاهش وزن لاغری کاشکسی weight loss', label: 'کاهش وزن ناخواسته (Unintentional Weight Loss)', category: 'عمومی (Constitutional)', keywords: 'لاغری کاشکسی' },
  { id: 'sym_weight_gain', label: 'افزایش وزن اخیر (Weight Gain)', category: 'عمومی (Constitutional)', keywords: 'چاقی ورم' },
  { id: 'sym_anorexia', aliases: 'انورکسی آنورکسی کم اشتهایی بیاشتهایی غذا نخوردن anorexia loss of appetite', label: 'بیاشتهایی و کاهش اشتها (Anorexia / Loss of Appetite)', category: 'عمومی (Constitutional)', keywords: 'غذا نخوردن میل' },
  { id: 'sym_fatigue', label: 'ضعف، بیحالی و خستگی مفرط (Fatigue / Malaise / Lethargy)', category: 'عمومی (Constitutional)', keywords: 'سستی کرختی' },
  { id: 'sym_insomnia', label: 'بیخوابی یا اختلال خواب (Insomnia / Sleep Disturbance)', category: 'عمومی (Constitutional)', keywords: 'بیداری شبانه' },

  // ۲. گوارش فوقانی و تحتانی (Gastrointestinal)
  { id: 'sym_nausea', aliases: 'تهوع دل اشوب حالت تهوع nausea', label: 'تهوع (Nausea)', category: 'گوارش (GI)', keywords: 'حالت بهم خوردگی دل آشوب' },
  { id: 'sym_vomiting', aliases: 'استفراغ بالا اوردن قی emesis vomiting', label: 'استفراغ (Vomiting / Emesis)', category: 'گوارش (GI)', keywords: 'بالا آوردن استفراغ غذایی' },
  { id: 'sym_bilious_vomiting', aliases: 'استفراغ صفراوی زرد اب تلخ bilious vomiting', label: 'استفراغ صفراوی سبز/زرد (Bilious Vomiting)', category: 'گوارش (GI)', keywords: 'تلخ زردآب' },
  { id: 'sym_fecaloid_vomiting', label: 'استفراغ فکالوئید بدبو (Feculent Vomiting)', category: 'گوارش (GI)', keywords: 'انسداد روده' },
  { id: 'sym_hematemesis', aliases: 'هماتمز بالا اوردن خون کافی گراند hematemesis coffee ground استفراغ خونی قهوه ای', label: 'هماتمز / استفراغ خونی یا قهوهای (Hematemesis / Coffee-ground Emesis)', category: 'گوارش (GI)', keywords: 'خون بالا آوردن' },
  { id: 'sym_dysphagia_solids', aliases: 'دیسفاژی گیر کردن غذا لقمه جامد بلع dysphagia solids', label: 'دیسفاژی به جامدات (Dysphagia to Solids)', category: 'گوارش (GI)', keywords: 'گیر کردن لقمه بلع' },
  { id: 'sym_dysphagia_liquids', aliases: 'دیسفاژی مایعات گیر کردن اب قورت دادن dysphagia liquids', label: 'دیسفاژی به مایعات (Dysphagia to Liquids)', category: 'گوارش (GI)', keywords: 'مشکل قورت دادن آب' },
  { id: 'sym_odynophagia', aliases: 'ادینوفاژی اودینوفاژی درد قورت دادن درد بلع odynophagia', label: 'ادینوفاژی / بلع دردناک (Odynophagia)', category: 'گوارش (GI)', keywords: 'درد قورت دادن' },
  { id: 'sym_globus', label: 'احساس توده در گلو (Globus Pharyngeus)', category: 'گوارش (GI)', keywords: 'بغض گیر کردن گلو' },
  { id: 'sym_heartburn', label: 'سوزش سردل و ریفلاکس اسید (Pyrosis / Heartburn / Regurgitation)', category: 'گوارش (GI)', keywords: 'ترش کردن اسید معده' },
  { id: 'sym_early_satiety', label: 'سیری زودرس (Early Satiety)', category: 'گوارش (GI)', keywords: 'پر شدن سریع معده' },
  { id: 'sym_dyspepsia_bloating', label: 'سوءهاضمه، نفخ و سنگینی سر دل (Dyspepsia / Bloating / Fullness)', category: 'گوارش (GI)', keywords: 'باد شکم گاز' },
  { id: 'sym_hiccups', label: 'سکسکه مداوم (Intractable Hiccups / Singultus)', category: 'گوارش (GI)', keywords: 'تحریک دیافراگم' },
  { id: 'sym_constipation', aliases: 'یبوست کار نکردن شکم سفتی مدفوع constipation', label: 'یبوست (Constipation)', category: 'گوارش (GI)', keywords: 'سفتی مدفوع کار نکردن شکم' },
  { id: 'sym_obstipation', aliases: 'ابسپتیپاسیون ابستیپیشن انسداد شکم عدم دفع گاز و مدفوع obstipation', label: 'عدم دفع گاز و مدفوع (Obstipation)', category: 'گوارش (GI)', keywords: 'انسداد کامل بسته شدن شکم' },
  { id: 'sym_inability_flatus', aliases: 'عدم دفع گاز باد شکم inability flatus', label: 'عدم دفع گاز (Inability to Pass Flatus)', category: 'گوارش (GI)', keywords: 'باد شکم' },
  { id: 'sym_diarrhea_watery', aliases: 'اسهال ابکی شکم روش روان بودن شکم diarrhea', label: 'اسهال آبکی (Watery Diarrhea)', category: 'گوارش (GI)', keywords: 'شل بودن شکم' },
  { id: 'sym_dysentery', aliases: 'اسهال خونی بلغمی دیسانتری dysentery', label: 'اسهال خونی و موکوسی (Bloody/Mucoid Diarrhea / Dysentery)', category: 'گوارش (GI)', keywords: 'اسهال بلغمی خونی' },
  { id: 'sym_steatorrhea', label: 'استئاتوره / مدفوع چرب و بدبو (Steatorrhea)', category: 'گوارش (GI)', keywords: 'سوءجذب چربی' },
  { id: 'sym_stool_caliber', label: 'تغییر کالیبر و باریک شدن مدفوع (Decreased Stool Caliber / Pencil-thin)', category: 'گوارش (GI)', keywords: 'مدفوع نواری' },
  { id: 'sym_melena', aliases: 'ملنا مدفوع سیاه قیری بدبو melena خونریزی معده اثنی عشر', label: 'ملنا / مدفوع قیری و سیاه (Melena)', category: 'گوارش (GI)', keywords: 'مدفوع سیاه خونریزی فوقانی' },
  { id: 'sym_hematochezia', aliases: 'هماتوشزی رکتوراژی خونریزی مقعدی دفع خون روشن hematochezia rectorrhagia', label: 'هماتوشزی / رکتوراژی / دفع خون روشن (Hematochezia / Rectorrhagia)', category: 'گوارش (GI)', keywords: 'خونریزی مقعدی' },
  { id: 'sym_tenesmus', aliases: 'زورپیچ تنسموس احساس دفع ناکامل tenesmus', label: 'زورپیچ و احساس دفع ناکامل (Tenesmus)', category: 'گوارش (GI)', keywords: 'پیچش مقعد' },
  { id: 'sym_proctalgia', label: 'درد مقعدی حین یا پس از دفع (Proctalgia / Anal Pain / Dyschezia)', category: 'گوارش (GI)', keywords: 'شقاق فیشر هموروئید' },
  { id: 'sym_perianal_discharge_itch', label: 'ترشح یا خارش ناحیه پریآنال (Perianal Discharge / Pruritus Ani)', category: 'گوارش (GI)', keywords: 'فیستول آبسه مقعد' },
  { id: 'sym_fecal_incontinence', label: 'بیاختیاری مدفوع یا گاز (Fecal Incontinence)', category: 'گوارش (GI)', keywords: 'اسفنکتر' },

  // ۳. کبد، مجاری صفراوی و پانکراس (Hepatobiliary & Pancreatic)
  { id: 'sym_jaundice', aliases: 'ایکتر ایکتریک یرقان زرد شدن چشم و پوست icterus jaundice hyperbilirubinemia', label: 'زردی پوست و اسکلرا (Jaundice / Icterus)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'یرقان زرد شدن چشم' },
  { id: 'sym_cholestatic_pruritus', aliases: 'پروریتوس خارش پوست pruritus itching کلستاز', label: 'خارش پوستی کلستاتیک (Cholestatic Pruritus)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'خارش بدن زردی' },
  { id: 'sym_dark_urine', aliases: 'ادرار چایرنگ ادرار تیره بیلی روبین dark urine', label: 'تیره یا چایرنگ شدن ادرار (Dark / Tea-colored Urine)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'بیلی روبین ادرار پررنگ' },
  { id: 'sym_acholic_stool', aliases: 'مدفوع بیرنگ مدفوع گچی سفید acholic clay colored stool', label: 'سفید یا بیرنگ شدن مدفوع (Acholic / Clay-colored Stool)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'مدفوع گچی انسداد صفرا' },
  { id: 'sym_abd_distension_ascites', label: 'اتساع شکم و آسیت (Abdominal Distension / Ascites)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'آب آوردن شکم بزرگی شکم' },

  // ۴. قلب و عروق و عروق محیطی (Cardiovascular & Vascular)
  { id: 'sym_chest_pain_angina', label: 'درد یا فشار قفسه سینه فعالیتی (Exertional Chest Pain / Angina)', category: 'قلب و عروق (Cardiovascular)', keywords: 'سنگینی سینه آنژین قلبی' },
  { id: 'sym_palpitation', label: 'تپش قلب (Palpitations)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ضربان تند نامنظم قلب' },
  { id: 'sym_doe', aliases: 'دیسپنه فعالیتی تنگی نفس فعالیت پله کم اوردن نفس dyspnea on exertion doe', label: 'تنگی نفس فعالیتی (Dyspnea on Exertion - DOE)', category: 'قلب و عروق (Cardiovascular)', keywords: 'کم آوردن نفس راه رفتن پله' },
  { id: 'sym_orthopnea', aliases: 'ارتوپنه تنگی نفس خوابیده بالشت زیر سر orthopnea', label: 'ارتوپنه / تنگی نفس در حالت درازکش (Orthopnea)', category: 'قلب و عروق (Cardiovascular)', keywords: 'چند بالش زیر سر' },
  { id: 'sym_pnd', aliases: 'پی ان دی تنگی نفس شبانه حمله شبانه خفگی pnd', label: 'تنگی نفس حملهای شبانه (Paroxysmal Nocturnal Dyspnea - PND)', category: 'قلب و عروق (Cardiovascular)', keywords: 'پریدن از خواب با خفگی' },
  { id: 'sym_syncope', aliases: 'سنکوپ بیهوش شدن سیاهی رفتن چشم syncope fainting غش کردن', label: 'سنکوپ / غش کردن و کاهش گذرای هوشیاری (Syncope)', category: 'قلب و عروق (Cardiovascular)', keywords: 'بیهوش شدن افتادن' },
  { id: 'sym_presyncope', aliases: 'پیش سنکوپ سیاهی رفتن چشم سبکی سر presyncope lightheadedness', label: 'پیشسنکوپ و سیاهی رفتن چشم (Presyncope / Lightheadedness)', category: 'قلب و عروق (Cardiovascular)', keywords: 'سرگیجه ارتواستاتیک' },
  { id: 'sym_lower_edema', label: 'ادم و ورم اندام تحتانی (Bilateral/Unilateral Lower Extremity Edema)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ورم پا قوزک' },
  { id: 'sym_claudication', label: 'لنگش متناوب عروقی (Intermittent Claudication)', category: 'قلب و عروق (Cardiovascular)', keywords: 'درد ساق پا موقع راه رفتن ایسکمی' },
  { id: 'sym_rest_limb_pain', label: 'درد استراحت و سردی/سیانوز اندام (Ischemic Rest Pain / Cyanosis)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ایسکمی حاد اندام آمبولی' },

  // ۵. دستگاه تنفسی و توراکس (Respiratory & Thoracic)
  { id: 'sym_dyspnea_rest', aliases: 'دیسپنه دیسپنه نفس تنگی کم آوردن نفس dyspnea sob تنگی نفس استراحت', label: 'تنگی نفس در حال استراحت (Resting Dyspnea / Shortness of Breath)', category: 'تنفسی (Respiratory)', keywords: 'نفس تنگی حاد' },
  { id: 'sym_cough_dry', label: 'سرفه خشک (Dry / Non-productive Cough)', category: 'تنفسی (Respiratory)', keywords: 'سرفه بدون خلط' },
  { id: 'sym_cough_productive', label: 'سرفه خلطدار (Productive Cough / Sputum)', category: 'تنفسی (Respiratory)', keywords: 'خلط چرکی سبز زرد' },
  { id: 'sym_hemoptysis', label: 'هموپتزی / دفع خلط خونی (Hemoptysis)', category: 'تنفسی (Respiratory)', keywords: 'سرفه خونی ریه' },
  { id: 'sym_pleuritic_pain', label: 'درد قفسه سینه پلورتیک با دم عمیق (Pleuritic Chest Pain)', category: 'تنفسی (Respiratory)', keywords: 'درد تیرکشنده با نفس کشیدن آمبولی' },
  { id: 'sym_wheezing_stridor', label: 'خسخس سینه یا استریدور (Wheezing / Stridor)', category: 'تنفسی (Respiratory)', keywords: 'صدای سوت ریه انسداد راه هوایی' },

  // ۶. کلیه و مجاری ادراری و تناسلی آقایان (Genitourinary & Urology)
  { id: 'sym_dysuria', aliases: 'دیزوری دیس اوری درد ادرار سوزش ادرار dysuria', label: 'سوزش ادرار (Dysuria)', category: 'ادراری و تناسلی (GU)', keywords: 'درد موقع ادرار عفونت' },
  { id: 'sym_frequency', label: 'تکرر ادرار (Urinary Frequency)', category: 'ادراری و تناسلی (GU)', keywords: 'زیاد دستشویی رفتن' },
  { id: 'sym_urgency', label: 'فوریت ادراری (Urinary Urgency)', category: 'ادراری و تناسلی (GU)', keywords: 'عجله در دفع ادرار' },
  { id: 'sym_nocturia', label: 'نوکتوری / بیدار شدن شبانه برای ادرار (Nocturia)', category: 'ادراری و تناسلی (GU)', keywords: 'ادرار شبانه پروستات' },
  { id: 'sym_hematuria_gross', aliases: 'هماچوری هماتوری ادرار خونی دفع لخته خون در ادرار hematuria', label: 'هماچوری واضح یا دفع لخته در ادرار (Gross Hematuria / Clots)', category: 'ادراری و تناسلی (GU)', keywords: 'ادرار خونی قرمز' },
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
  { id: 'sym_breast_mass', aliases: 'توده پستان غده سینه توده سینه کیست سینه breast mass', label: 'لمس توده در پستان یا زیربغل (Palpable Breast / Axillary Mass)', category: 'پستان و پوست (Breast & Skin)', keywords: 'غده سینه کیست سینه' },
  { id: 'sym_mastalgia', label: 'درد پستان (Mastalgia / Mastodynia)', category: 'پستان و پوست (Breast & Skin)', keywords: 'درد سینه سیکلیک' },
  { id: 'sym_nipple_discharge', aliases: 'ترشح نیپل ترشح نوک سینه گالاکتوره nipple discharge', label: 'ترشح از نوک پستان - خونی/سروزی/شیری (Nipple Discharge / Galactorrhea)', category: 'پستان و پوست (Breast & Skin)', keywords: 'ترشح نیپل پاژه' },
  { id: 'sym_nipple_retraction_peau', label: 'فرورفتگی نیپل، کشیدگی پوست یا نمای پوستپرتقالی (Nipple Inversion / Skin Dimpling / Peau d’orange)', category: 'پستان و پوست (Breast & Skin)', keywords: 'تغییر پوست سینه' },
  { id: 'sym_skin_ulcer_abscess', label: 'زخم مزمن، آبسه، سلولیت یا ترشح چرکی پوست (Cutaneous Ulcer / Abscess / Cellulitis)', category: 'پستان و پوست (Breast & Skin)', keywords: 'جوش چرکی دمل پای دیابتی' },
  { id: 'sym_skin_rash_erythema', label: 'بثورات جلدی، کهیر یا اریتم (Skin Rash / Urticaria / Erythema)', category: 'پستان و پوست (Breast & Skin)', keywords: 'حساسیت پوستی قرمزی' },
  { id: 'sym_ecchymosis_petechiae', label: 'کبودی آسان، اکیموز یا پتشی و پورپورا (Easy Bruising / Ecchymosis / Petechiae)', category: 'پستان و پوست (Breast & Skin)', keywords: 'خونمردگی پلاکت' },

  // ۹. سر، صورت، فک، چشم، گوش، حلق و گردن (HEENT, Maxillofacial & Neck)
  { id: 'sym_headache', aliases: 'سردرد میگرن درد سر cephalgia headache', label: 'سردرد (Headache / Cephalgia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'میگرن درد سر' },
  { id: 'sym_facial_jaw_swelling', label: 'توده یا تورم فک، صورت، مندیبل یا غدد بزاقی (Maxillofacial / Mandibular / Parotid Mass)', category: 'سر و گردن (HEENT & Neck)', keywords: 'پاروتید زاویه فک کیست سر' },
  { id: 'sym_trismus', label: 'محدودیت باز کردن دهان / تریسموس (Trismus)', category: 'سر و گردن (HEENT & Neck)', keywords: 'قفل شدن فک آبسه دندانی' },
  { id: 'sym_neck_thyroid_mass', label: 'توده گردنی، بزرگی تیروئید یا گواتر (Neck Mass / Goiter / Thyroid Nodule)', category: 'سر و گردن (HEENT & Neck)', keywords: 'ندول تیروئید غده لنفاوی گردن' },
  { id: 'sym_hoarseness', aliases: 'دیسفونی گرفتگی صدا دورگه شدن صدا خشونت صدا hoarseness dysphonia عصب راجعه', label: 'خشونت یا تغییر صدا (Hoarseness / Dysphonia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'گرفتگی صدا عصب راجعه حنجره' },
  { id: 'sym_blurred_vision_diplopia', label: 'تاری دید، کاهش بینایی یا دوبینی (Blurred Vision / Visual Loss / Diplopia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'چشم دیدن' },
  { id: 'sym_vertigo_tinnitus', label: 'سرگیجه چرخشی حقیقی یا وزوز گوش (True Vertigo / Tinnitus / Otalgia)', category: 'سر و گردن (HEENT & Neck)', keywords: 'گوش درد تعادل' },
  { id: 'sym_epistaxis_gingival', aliases: 'خوندماغ خونریزی بینی خونریزی لثه epistaxis', label: 'خوندماغ یا خونریزی لثه (Epistaxis / Gingival Bleeding)', category: 'سر و گردن (HEENT & Neck)', keywords: 'خونریزی بینی' },

  // ۱۰. مغز و اعصاب و عضلانی-اسکلتی (Neurology & Musculoskeletal)
  { id: 'sym_loc_confusion', aliases: 'کاهش هوشیاری گیجی دلیریوم خواب الودگی LOC altered mental status', label: 'کاهش سطح هوشیاری، گیجی یا دلیریوم (Altered Mental Status / Confusion / LOC)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'خواب آلودگی کما فراموشی' },
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
  { id: 'sym_anxiety_depression_agitation', label: 'اضطراب شدید، بیقراری یا خلق افسرده (Anxiety / Agitation / Depressed Mood)', category: 'غدد و خون (Endo & Heme)', keywords: 'اعصاب استرس پانیک' },
  { id: 'sym_postprandial_fullness', aliases: 'سنگینی سردل پری شکم بعد غذا نفخ بعد از غذا postprandial fullness', label: 'احساس پری و سنگینی سردل پس از غذا (Postprandial Fullness)', category: 'گوارش (GI)', keywords: 'سنگینی معده بعد از غذا' },
  { id: 'sym_belching_eructation', aliases: 'آروغ زدن مکرر اروغ باد گلو eructation belching', label: 'آروغ زدن مکرر (Frequent Belching / Eructation)', category: 'گوارش (GI)', keywords: 'باد گلو آروغ' },
  { id: 'sym_halitosis_bitter_taste', aliases: 'بوی بد دهان تلخی دهان طعم تلخ دهان halitosis bitter taste', label: 'بوی بد دهان یا طعم تلخ دهان (Halitosis / Bitter Taste)', category: 'گوارش (GI)', keywords: 'تلخی دهان ریفلاکس صفرا' },
  { id: 'sym_scleral_icterus', aliases: 'زردی سفیدی چشم زردی چشم اسکلرا ایکتریک scleral icterus', label: 'زردی سفیدی چشم (Scleral Icterus)', category: 'کبد و صفرا (Hepatobiliary)', keywords: 'زردی چشم یرقان' },
  { id: 'sym_pulsatile_abd_mass', aliases: 'تپش در شکم ضربان در شکم توده ضربان دار شکم انوریسم آئورت pulsatile abdominal mass aaa', label: 'احساس تپش یا ضربان در شکم (Pulsatile Abdominal Sensation)', category: 'قلب و عروق (Cardiovascular)', keywords: 'ضربان شکم آنوریسم آئورت' },
  { id: 'sym_cold_pale_extremity', aliases: 'سردی اندام رنگ پریدگی دست و پا ایسکمی اندام cold pale extremity', label: 'سردی و رنگ‌پریدگی اندام‌ها (Cold & Pale Extremities)', category: 'قلب و عروق (Cardiovascular)', keywords: 'سردی پا دست ایسکمی شریانی' },
  { id: 'sym_perioral_numbness', aliases: 'خواب رفتگی دور دهان مورمور شدن دور لب و انگشتان هیپوکلسمی تتانی پس از تیروئیدکتومی perioral numbness paresthesia hypocalcemia', label: 'خواب‌رفتگی و مورمور شدن دور دهان یا انگشتان (Perioral / Digital Paresthesia — شک به هیپوکلسمی پس از تیروئیدکتومی)', category: 'اعصاب و عضلانی (Neuro & MSK)', keywords: 'گزگز دور لب و دست کلسیم پایین تیروئید' },
  { id: 'sym_incomplete_voiding', aliases: 'عدم تخلیه کامل مثانه احتباس ادرار گیر کردن ادرار incomplete bladder emptying urinary retention', label: 'احتباس ادرار یا احساس عدم تخلیه کامل مثانه (Incomplete Bladder Emptying / Urinary Retention)', category: 'ادراری و تناسلی (GU)', keywords: 'تخلیه ناکامل ادرار مثانه' }
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
    catId: 'dh_antibiotics_surgical',
    id: 'dh_antibiotics_surgical',
    catTitle: '۷. آنتی‌بیوتیک‌های پروفیلاکسی و درمانی جراحی (Surgical & Systemic Antibiotics)',
    title: '۷. آنتی‌بیوتیک‌های پروفیلاکسی و درمانی جراحی (Surgical & Systemic Antibiotics)',
    drugs: [
      { id: 'drg_cefazolin', label: 'سفازولین (Cefazolin)', brands: 'Kefzol سفازول', defaultDose: '1g IV', aliases: 'سفازلین سفازولین cefazolin kefzol پروفیلاکسی جراحی' },
      { id: 'drg_ceftriaxone', label: 'سفتریاکسون (Ceftriaxone)', brands: 'Rocephin روسفین', defaultDose: '1g IV', aliases: 'سفتریاکسن روسفین سفتریاکسون ceftriaxone سفالوسپورین' },
      { id: 'drg_cefotaxime', label: 'سفوتاکسیم (Cefotaxime)', brands: 'Claforan کلافوران', defaultDose: '1g IV', aliases: 'سفوتاکسیم کلافوران cefotaxime claforan' },
      { id: 'drg_ceftazidime', label: 'سفتازیدیم (Ceftazidime)', brands: 'Fortum فورتوم', defaultDose: '1g IV', aliases: 'سفتازیدیم فورتوم ceftazidime fortum' },
      { id: 'drg_cefepime', label: 'سفپیم (Cefepime)', brands: 'Maxipime ماکسیپیم', defaultDose: '1g IV', aliases: 'سفپیم ماکسیپیم cefepime maxipime' },
      { id: 'drg_cephalexin', label: 'سفالکسین (Cephalexin)', brands: 'Keflex کفلکس', defaultDose: '500mg PO', aliases: 'سفالکسین کفلکس cephalexin keflex' },
      { id: 'drg_cefixime', label: 'سفیکسیم (Cefixime)', brands: 'Suprax سوپراکس, لوپراکس', defaultDose: '400mg PO', aliases: 'سفیکسیم سوپراکس لوپراکس cefixime suprax' },
      { id: 'drg_metronidazole', label: 'مترونیدازول (Metronidazole - Flagyl)', brands: 'Flagyl فلاجیل', defaultDose: '500mg IV', aliases: 'مترونیدازل فلاجیل متوکسی flagyl metronidazole بی هوازی' },
      { id: 'drg_ciprofloxacin', label: 'سیپروفلوکساسین (Ciprofloxacin)', brands: 'Ciprobay سیپروبای', defaultDose: '500mg PO', aliases: 'سیپرو سیپروفلوکساسین ciprofloxacin cipro کینولون' },
      { id: 'drg_levofloxacin', label: 'لووفلوکساسین (Levofloxacin - Tavanic)', brands: 'Tavanic تاوانیک', defaultDose: '500mg PO', aliases: 'لووفلوکساسین تاوانیک levofloxacin tavanic' },
      { id: 'drg_ofloxacin', label: 'اوفلوکساسین (Ofloxacin)', brands: 'Tarivid تاریوید', defaultDose: '200mg PO', aliases: 'اوفلوکساسین تاریوید ofloxacin tarivid' },
      { id: 'drg_meropenem', label: 'مروپنم (Meropenem)', brands: 'Meronem مرونم', defaultDose: '1g IV', highAlert: true, aliases: 'مروپنم مرونم meropenem meronem کارباپنم' },
      { id: 'drg_imipenem', label: 'ایمی‌پنم (Imipenem-Cilastatin)', brands: 'Tienam تینام', defaultDose: '500mg IV', highAlert: true, aliases: 'ایمیپنم تینام imipenem tienam کارباپنم' },
      { id: 'drg_vancomycin', label: 'وانکومایسین (Vancomycin)', brands: 'Vancocin وانکوسین', defaultDose: '1g IV', highAlert: true, aliases: 'ونکومایسین وانکومایسین vancomycin vanco ضد mrsa' },
      { id: 'drg_clindamycin', label: 'کلیندامایسین (Clindamycin)', brands: 'Dalacin دالاسین', defaultDose: '600mg IV', aliases: 'کلیندامایسین کلیندا clindamycin dalacin' },
      { id: 'drg_piperacillin_tazobactam', label: 'پیپراسیلین-تازوباکتام (Piperacillin-Tazobactam - Tazocin)', brands: 'Tazocin تازوسین, پیپتاز', defaultDose: '4.5g IV', highAlert: true, aliases: 'تازوسین پیپتاز پیپراسیلین piperacillin tazobactam tazocin سودومونا' },
      { id: 'drg_amoxicillin', label: 'آموکسی‌سیلین (Amoxicillin)', brands: 'Amoxil فاراموکس', defaultDose: '500mg PO', aliases: 'اموکسی سیلین آموکسیسیلین amoxicillin amoxil' },
      { id: 'drg_co_amoxiclav', label: 'کوآموکسیکلاو (Co-Amoxiclav - Augmentin)', brands: 'Augmentin آگمنتین, فارمنتین', defaultDose: '625mg PO', aliases: 'اموکسی کلاو کواموکسی کلاو co amoxiclav augmentin' },
      { id: 'drg_ampicillin_sulbactam', label: 'آمپی‌سیلین-سولباکتام (Ampicillin-Sulbactam)', brands: 'Unasyn اوناسین', defaultDose: '1.5g IV', aliases: 'امپی سیلین سولباکتام اوناسین ampicillin sulbactam unasyn' },
      { id: 'drg_azithromycin', label: 'آزیترومایسین (Azithromycin)', brands: 'Zithromax زیتروماکس', defaultDose: '250mg PO', aliases: 'ازیترومایسین زیتروماکس azithromycin zithromax' },
      { id: 'drg_clarithromycin', label: 'کلاریترومایسین (Clarithromycin)', brands: 'Klacid کلاسید', defaultDose: '500mg PO', aliases: 'کلاریترومایسین کلاسید clarithromycin klacid' },
      { id: 'drg_erythromycin', label: 'اریترومایسین (Erythromycin)', brands: 'Erythromycin', defaultDose: '400mg PO', aliases: 'اریترومایسین erythromycin' },
      { id: 'drg_doxycycline', label: 'داکسی‌سایکلین (Doxycycline)', brands: 'Vibramycin ویبرامایسین', defaultDose: '100mg PO', aliases: 'داکسی سایکلین داکسیسایکلین doxycycline vibramycin' },
      { id: 'drg_gentamicin', label: 'جنتامایسین (Gentamicin)', brands: 'Garamycin گارامایسین', defaultDose: '80mg IV', aliases: 'جنتامایسین گارامایسین gentamicin' },
      { id: 'drg_amikacin', label: 'آمیکاسین (Amikacin)', brands: 'Amikin آمیکین', defaultDose: '500mg IV', aliases: 'امیکاسین آمیکاسین amikacin' },
      { id: 'drg_co_trimoxazole', label: 'کوتریموکسازول (Co-Trimoxazole)', brands: 'Bactrim باکتریم, سپترین', defaultDose: '480mg PO', aliases: 'کوتریموکسازول باکتریم سپترین co trimoxazole bactrim tmp smx' },
      { id: 'drg_nitrofurantoin', label: 'نیتروفورانتوئین (Nitrofurantoin)', brands: 'Macrobid ماکروبید', defaultDose: '100mg PO', aliases: 'نیتروفورانتوئین فورادانتین nitrofurantoin' },
      { id: 'drg_rifaximin', label: 'ریفاکسیمین (Rifaximin)', brands: 'Xifaxan زیفاکسان, نورمیکس', defaultDose: '200mg PO', aliases: 'ریفاکسیمین نورمیکس زیفاکسان rifaximin normix' },
      { id: 'drg_fluconazole', label: 'فلوکونازول (Fluconazole)', brands: 'Diflucan دیفلوکان', defaultDose: '150mg PO', aliases: 'فلوکونازول دیفلوکان ضد قارچ fluconazole diflucan' },
      { id: 'drg_aciclovir', label: 'آسیکلوویر (Aciclovir)', brands: 'Zovirax زوویراکس', defaultDose: '400mg PO', aliases: 'اسیکلوویر آسیکلوویر زوویراکس aciclovir acyclovir' }
    ]
  },
  {
    catId: 'dh_anticoag_antiplatelet',
    catTitle: '۱. ضدپلاکت‌ها و ضدانعقادها (داروهای پرخطر جراحی - High-Alert)',
    drugs: [
      { id: 'drg_asa', aliases: 'اسپرین آشپرین اشپرین آ.اس.آ آ اس آ asa aspirin 80 100 325 antiplatelet', label: 'آسپرین (Aspirin - ASA)', brands: 'Aspirin 80mg, 100mg, 325mg', defaultDose: '80mg', highAlert: true },
      { id: 'drg_clopidogrel', aliases: 'پلاویکس پلاوکس اسویکس زیلیت کلوپیدگرل clopidogrel plavix osvix zyllt', label: 'کلوپیدوگرل (Clopidogrel)', brands: 'Plavix پلاویکس, Osvix اسویکس, Zyllt زیلیت', defaultDose: '75mg', highAlert: true },
      { id: 'drg_ticagrelor', aliases: 'بریلینتا تیکاگرلور ticagrelor brilinta', label: 'تیکاگرلور (Ticagrelor)', brands: 'Brilinta بریلینتا, Ticarel', defaultDose: '90mg', highAlert: true },
      { id: 'drg_prasugrel', label: 'پرازوگرل (Prasugrel)', brands: 'Effient افینت', defaultDose: '10mg', highAlert: true, aliases: 'پرازوگرل افینت prasugrel effient' },
      { id: 'drg_cilostazol', label: 'سیلوستازول (Cilostazol)', brands: 'Pletaal پلتال', defaultDose: '100mg', highAlert: true, aliases: 'سیلوستازول پلتال cilostazol pletaal' },
      { id: 'drg_warfarin', aliases: 'کومادین وارفارین warfarin coumadin ضدانعقاد', label: 'وارفارین (Warfarin)', brands: 'Coumadin کومادین', defaultDose: '5mg', highAlert: true },
      { id: 'drg_rivaroxaban', aliases: 'زارلتو زارالتو ایکسارلتو ریوارکسابان rivaroxaban xarelto نوآک doac', label: 'ریواروکسابان (Rivaroxaban)', brands: 'Xarelto زارلتو, ایکسارلتو, ریواکسان', defaultDose: '20mg', highAlert: true },
      { id: 'drg_apixaban', aliases: 'الیکوئیس اپیکسابان apixaban eliquis', label: 'آپیکسابان (Apixaban)', brands: 'Eliquis الیکوئیس, آپیکسابان', defaultDose: '5mg', highAlert: true },
      { id: 'drg_dabigatran', aliases: 'پراداکسا دابیگاتران dabigatran pradaxa', label: 'دابیگاتران (Dabigatran)', brands: 'Pradaxa پراداکسا', defaultDose: '150mg', highAlert: true },
      { id: 'drg_enoxaparin', aliases: 'کلکسan کلکسان انکساپارین انوکساپارین هپارین زیرجلدی enoxaparin clexane lmwh', label: 'انوکساپارین (Enoxaparin)', brands: 'Clexane کلکسان', defaultDose: '40mg SC', highAlert: true },
      { id: 'drg_heparin', aliases: 'هپارین heparin ufh هپارین وریدی', label: 'هپارین (Unfractionated Heparin)', brands: 'Heparin', defaultDose: '5000 IU SC', highAlert: true }
    ]
  },
  {
    catId: 'dh_cardiovascular_htn',
    catTitle: '۲. داروهای قلبی، فشار خون، ضدآریتمی و چربی خون',
    drugs: [
      { id: 'drg_losartan', aliases: 'لوزارتان پوزارکس لوزار cozaar losartan ار بی arb', label: 'لوزارتان (Losartan)', brands: 'پوزارکس, Cozaar', defaultDose: '25mg' },
      { id: 'drg_valsartan', aliases: 'والزارتان دیووان والزومیکس valsartan diovan', label: 'والزارتان (Valsartan)', brands: 'Diovan دیووان, والزومیکس', defaultDose: '80mg' },
      { id: 'drg_telmisartan', label: 'تلمیزارتان (Telmisartan)', brands: 'Micardis میکاردس', defaultDose: '40mg', aliases: 'تلمیزارتان میکاردس telmisartan micardis' },
      { id: 'drg_captopril', label: 'کاپتوپریل (Captopril)', brands: 'Capoten کاپوتن', defaultDose: '25mg', aliases: 'کاپتوپریل کاپوتن captopril' },
      { id: 'drg_enalapril', label: 'انالاپریل (Enalapril)', brands: 'Renitec رنیتک', defaultDose: '5mg', aliases: 'انالاپریل رنیتک enalapril' },
      { id: 'drg_lisinopril', label: 'لیزینوپریل (Lisinopril)', brands: 'Zestril زستریل', defaultDose: '10mg', aliases: 'لیزینوپریل زستریل lisinopril' },
      { id: 'drg_amlodipine', aliases: 'املودیپین املوپرس نورواسک amlodipine norvasc ccb', label: 'آملودیپین (Amlodipine)', brands: 'Norvasc نورواسک, آملوپرس', defaultDose: '5mg' },
      { id: 'drg_nifedipine', label: 'نیفدیپین (Nifedipine)', brands: 'Adalat آدالات', defaultDose: '10mg', aliases: 'نیفدیپین آدالات nifedipine adalat' },
      { id: 'drg_diltiazem', label: 'دیلتیازم (Diltiazem)', brands: 'Cardizem کاردیزم', defaultDose: '60mg', aliases: 'دیلتیازم کاردیزم diltiazem' },
      { id: 'drg_verapamil', label: 'وراپامیل (Verapamil)', brands: 'Isoptin ایزوپتین', defaultDose: '40mg', aliases: 'وراپامیل ایزوپتین verapamil isoptin' },
      { id: 'drg_metoprolol', aliases: 'متورال مترال بتالوک امتا متپرولول metoprolol metoral betaloc بتابلاکر', label: 'متوپرولول (Metoprolol)', brands: 'Metoral متورال, Betaloc بتالوک, امتا', defaultDose: '50mg' },
      { id: 'drg_bisoprolol', aliases: 'کونکور کنکور بیزپرولول زباکور bisoprolol concor', label: 'بیزوپرولول (Bisoprolol)', brands: 'Concor کونکور, زباکور', defaultDose: '5mg' },
      { id: 'drg_carvedilol', aliases: 'کوریول کارودیلول carvedilol coryol', label: 'کارودیلول (Carvedilol)', brands: 'Coryol کوریول', defaultDose: '6.25mg' },
      { id: 'drg_propranolol', aliases: 'پرانول ایندرال پروپرانولول propranolol inderal', label: 'پروپرانولول (Propranolol)', brands: 'Inderal ایندرال, پرانول', defaultDose: '20mg' },
      { id: 'drg_atenolol', label: 'آتنولول (Atenolol)', brands: 'Tenormin تنورمین', defaultDose: '50mg', aliases: 'اتنولول آتنولول atenolol tenormin' },
      { id: 'drg_nebivolol', label: 'نبیوولول (Nebivolol)', brands: 'Nebilet نبیلت', defaultDose: '5mg', aliases: 'نبیوولول نبیلت nebivolol nebilet' },
      { id: 'drg_furosemide', aliases: 'فروزماید فورزماید لازیکس لاسیکس furosemide lasix دیورتیک', label: 'فوروزماید (Furosemide)', brands: 'Lasix لازیکس', defaultDose: '40mg' },
      { id: 'drg_hydrochlorothiazide', label: 'هیدروکلروتیازید (Hydrochlorothiazide - HCTZ)', brands: 'HCT', defaultDose: '25mg', aliases: 'هیدروکلروتیازید تیازید hctz hydrochlorothiazide' },
      { id: 'drg_indapamide', label: 'اینداپامید (Indapamide)', brands: 'Natrilix ناتریلیکس', defaultDose: '1.5mg', aliases: 'اینداپامید ناتریلیکس indapamide natrilix' },
      { id: 'drg_spironolactone', aliases: 'اسپیرنولاکتون آلداکتون الداکتون spironolactone aldactone', label: 'اسپیرونولاکتون (Spironolactone)', brands: 'Aldactone آلداکتون', defaultDose: '25mg' },
      { id: 'drg_eplerenone', label: 'اپلرنون (Eplerenone)', brands: 'Inspra اینسپرا', defaultDose: '25mg', aliases: 'اپلرنون اینسپرا eplerenone inspra' },
      { id: 'drg_sacubitril_valsartan', label: 'ساکوبیتریل-والزارتان (Sacubitril-Valsartan - Entresto)', brands: 'Entresto انترستو, ویمپتو', defaultDose: '50mg', aliases: 'انترستو ویمپتو ساکوبیتریل entresto sacubitril' },
      { id: 'drg_digoxin', label: 'دیگوکسین (Digoxin)', brands: 'Lanoxin لانوکسین', defaultDose: '0.25mg', aliases: 'دیگوکسین لانوکسین digoxin lanoxin' },
      { id: 'drg_amiodarone', label: 'آمیودارون (Amiodarone)', brands: 'Cordarone کردارون', defaultDose: '200mg', aliases: 'امیودارون آمیودارون کردارون amiodarone cordarone' },
      { id: 'drg_flecainide', label: 'فلکاینید (Flecainide)', brands: 'Tambocor تامبوکور', defaultDose: '100mg', aliases: 'فلکاینید flecainide' },
      { id: 'drg_propafenone', label: 'پروپافنون (Propafenone)', brands: 'Rytmonorm ریتمونورم', defaultDose: '150mg', aliases: 'پروپافنون ریتمونورم propafenone rytmonorm' },
      { id: 'drg_nitroglycerin', label: 'نیتروگلیسیرین (Nitroglycerin - TNG)', brands: 'Nitrocontin نیتروکانتین, Sustac', defaultDose: '2.6mg', aliases: 'نیتروگلیسیرین نیتروکانتین قرص زیرزبانی tng nitroglycerin nitrocontin' },
      { id: 'drg_isosorbide_dinitrate', label: 'ایزوسورباید دی‌نیترات (Isosorbide Dinitrate)', brands: 'Isordil ایزوردیل', defaultDose: '10mg', aliases: 'ایزوسورباید ایزوردیل isosorbide dinitrate isordil' },
      { id: 'drg_isosorbide_mononitrate', label: 'ایزوسورباید منونیترات (Isosorbide Mononitrate)', brands: 'Imdur ایمدور', defaultDose: '40mg', aliases: 'ایزوسورباید منونیترات ایمدور isosorbide mononitrate imdur' },
      { id: 'drg_atorvastatin', aliases: 'اتورواستاتین لیپیتور چربی خون atorvastatin lipitor', label: 'آتورواستاتین (Atorvastatin)', brands: 'Lipitor لیپیتور', defaultDose: '20mg' },
      { id: 'drg_rosuvastatin', aliases: 'رزوواستاتین کرستور روپیکسون rosuvastatin crestor', label: 'رزوواستاتین (Rosuvastatin)', brands: 'Crestor کرستور, روپیکسون', defaultDose: '10mg' },
      { id: 'drg_simvastatin', label: 'سیمواستاتین (Simvastatin)', brands: 'Zocor زوکور', defaultDose: '20mg', aliases: 'سیمواستاتین زوکور simvastatin zocor' },
      { id: 'drg_ezetimibe', label: 'ازتیمیب (Ezetimibe)', brands: 'Ezetrol ازترول', defaultDose: '10mg', aliases: 'ازتیمیب ازترول ezetimibe ezetrol' },
      { id: 'drg_fenofibrate', label: 'فنوفیبرات (Fenofibrate)', brands: 'Lipanthyl لیپانتیل', defaultDose: '200mg', aliases: 'فنوفیبرات لیپانتیل fenofibrate lipanthyl' },
      { id: 'drg_gemfibrozil', label: 'جم‌فیبروزیل (Gemfibrozil)', brands: 'Lopid لوپید', defaultDose: '300mg', aliases: 'جم فیبروزیل جمفیبروزیل gemfibrozil lopid' },
      { id: 'drg_prazosin', label: 'پرازوسین (Prazosin)', brands: 'Minipress مینی‌پرس', defaultDose: '1mg', aliases: 'پرازوسین مینی پرس prazosin minipress' },
      { id: 'drg_clonidine', label: 'کلونیدین (Clonidine)', brands: 'Catapres کاتاپرس', defaultDose: '0.2mg', aliases: 'کلونیدین کاتاپرس clonidine catapres' },
      { id: 'drg_hydralazine', label: 'هیدرالازین (Hydralazine)', brands: 'Apresoline آپرسولین', defaultDose: '25mg', aliases: 'هیدرالازین hydralazine' }
    ]
  },
  {
    catId: 'dh_diabetes_endocrine_steroid',
    catTitle: '۳. داروهای دیابت، انسولین‌ها، تیروئید، کورتون‌ها و هورمونی',
    drugs: [
      { id: 'drg_metformin', aliases: 'متفورمین گلوکوفاژ قند دیابت metformin glucophage', label: 'متفورمین (Metformin)', brands: 'Glucophage گلوکوفاژ', defaultDose: '500mg', highAlert: true },
      { id: 'drg_gliclazide', label: 'گلیکلازید (Gliclazide)', brands: 'Diamicron دیامیکرون', defaultDose: '80mg', aliases: 'گلیکلازید دیامیکرون gliclazide diamicron' },
      { id: 'drg_glibenclamide', aliases: 'گلی بن کلامید دائونیل glibenclamide daonil', label: 'گلی‌بن‌کلامید (Glibenclamide - Glyburide)', brands: 'Daonil دائونیل', defaultDose: '5mg' },
      { id: 'drg_glimepiride', label: 'گلیمپراید (Glimepiride)', brands: 'Amaryl آماریل', defaultDose: '2mg', aliases: 'گلیمپراید آماریل glimepiride amaryl' },
      { id: 'drg_repaglinide', label: 'رپاگلینید (Repaglinide)', brands: 'Novonorm نوونورم', defaultDose: '1mg', aliases: 'رپاگلینید نوونورم repaglinide novonorm' },
      { id: 'drg_pioglitazone', label: 'پیوگلیتازون (Pioglitazone)', brands: 'Actos آکتوس', defaultDose: '15mg', aliases: 'پیوگلیتازون آکتوس pioglitazone actos' },
      { id: 'drg_sitagliptin', aliases: 'سیتاگلیپتین جانوویا زیپتین زیپمت sitagliptin januvia ziptin', label: 'سیتاگلیپتین (Sitagliptin)', brands: 'Januvia جانوویا, Ziptin زیپتین, زیپمت', defaultDose: '50mg' },
      { id: 'drg_linagliptin', label: 'لیناگلیپتین (Linagliptin)', brands: 'Trajenta تراجنتا, گلورنتا, لینامکس', defaultDose: '5mg', aliases: 'لیناگلیپتین تراجنتا گلورنتا linagliptin trajenta' },
      { id: 'drg_empagliflozin', aliases: 'امپاگلیفلوزین جاردیانس گلوریپا سینجاردی empagliflozin jardiance sglt2', label: 'امپاگلیفلوزین (Empagliflozin)', brands: 'Jardiance جاردیانس, گلوریپا, سینجاردی', defaultDose: '10mg', highAlert: true },
      { id: 'drg_dapagliflozin', label: 'داپاگلیفلوزین (Dapagliflozin)', brands: 'Forxiga فورکسیگا', defaultDose: '10mg', highAlert: true, aliases: 'داپاگلیفلوزین فورکسیگا dapagliflozin forxiga' },
      { id: 'drg_acarbose', label: 'آکاربوز (Acarbose)', brands: 'Glucobay گلوکوبای', defaultDose: '50mg', aliases: 'اکاربوز آکاربوز acarbose glucobay' },
      { id: 'drg_liraglutide', label: 'لیراگلوتاید (Liraglutide)', brands: 'Victoza ویکتوزا, ملیتود', defaultDose: '0.6mg SC', aliases: 'لیراگلوتاید ویکتوزا ملیتود liraglutide victoza' },
      { id: 'drg_semaglutide', label: 'سماگلوتاید (Semaglutide)', brands: 'Ozempic اوزمپیک', defaultDose: '0.5mg SC', aliases: 'سماگلوتاید اوزمپیک semaglutide ozempic' },
      { id: 'drg_ins_glargine', aliases: 'لانتوس توجئو انسولین پایه گلارژین lantus toujeo insulin', label: 'انسولین گلارژین (Insulin Glargine - Lantus)', brands: 'Lantus لانتوس, Toujeo توجئو, Basalin', defaultDose: 'Units SC', highAlert: true },
      { id: 'drg_ins_aspart', aliases: 'نووراپید نوومیکس انسولین قلمی aspart novorapid', label: 'انسولین آسپارت (Insulin Aspart - NovoRapid)', brands: 'NovoRapid نووراپید, NovoMix نوومیکس', defaultDose: 'Units SC', highAlert: true },
      { id: 'drg_ins_nph', label: 'انسولین NPH (Isophane Insulin)', brands: 'Insulatard اینسولاتارد', defaultDose: 'Units SC', highAlert: true, aliases: 'انسولین شیری ان پی اچ nph insulin' },
      { id: 'drg_ins_regular', label: 'انسولین رگولار (Regular Insulin)', brands: 'Humulin R هومولین', defaultDose: 'Units SC', highAlert: true, aliases: 'انسولین آبکی رگولار regular insulin' },
      { id: 'drg_levothyroxine', aliases: 'لووتیروکسین یوتیروکس تیروئید کم کار levothyroxine euthyrox', label: 'لووتیروکسین (Levothyroxine)', brands: 'Euthyrox یوتیروکس', defaultDose: '100mcg' },
      { id: 'drg_methimazole', aliases: 'متیمازول تاپازول تیروئید پرکار methimazole tapazole', label: 'متیمازول (Methimazole)', brands: 'Tapazole تاپازول', defaultDose: '5mg' },
      { id: 'drg_carbimazole', label: 'کاربیمازول (Carbimazole)', brands: 'Neo-Mercazole', defaultDose: '5mg', aliases: 'کاربیمازول carbimazole' },
      { id: 'drg_ptu', label: 'پروپیل‌تیواوراسیل (Propylthiouracil - PTU)', brands: 'PTU', defaultDose: '50mg', aliases: 'پروپیل تیواوراسیل ptu propylthiouracil' },
      { id: 'drg_prednisolone', aliases: 'پردنیزولون کورتون استروئید نیزولون prednisolone nisolone', label: 'پردنیزولون (Prednisolone)', brands: 'Nisolone نیزولون', defaultDose: '5mg', highAlert: true },
      { id: 'drg_dexamethasone', aliases: 'دگزامتازون دگزا کورتون دکادرون dexamethasone decadron', label: 'دگزامتازون (Dexamethasone)', brands: 'Decadron دکادرون', defaultDose: '4mg', highAlert: true },
      { id: 'drg_hydrocortisone', aliases: 'هیدروکورتیزون سولوکورتف کورتون hydrocortisone solu cortef', label: 'هیدروکورتیزون (Hydrocortisone)', brands: 'Solu-Cortef سولوکورتف', defaultDose: '100mg IV', highAlert: true },
      { id: 'drg_methylprednisolone', label: 'متیل‌پردنیزولون (Methylprednisolone)', brands: 'Solu-Medrol سولومدرول', defaultDose: '40mg IV', highAlert: true, aliases: 'متیل پردنیزولون سولومدرول methylprednisolone solu medrol' },
      { id: 'drg_cabergoline', label: 'کابرگولین (Cabergoline)', brands: 'Dostinex داستینکس', defaultDose: '0.5mg', aliases: 'کابرگولین داستینکس cabergoline dostinex' },
      { id: 'drg_bromocriptine', label: 'بروموکریپتین (Bromocriptine)', brands: 'Parlodel پارلودل', defaultDose: '2.5mg', aliases: 'بروموکریپتین پارلودل bromocriptine parlodel' },
      { id: 'drg_alendronate', label: 'آلندرونیت (Alendronate)', brands: 'Fosamax فوزامکس, استئوفوس', defaultDose: '70mg Weekly', aliases: 'الندرونیت آلندرونات فوزامکس پوکی استخوان alendronate fosamax' },
      { id: 'drg_calcitriol', label: 'کلسیتریول (Calcitriol - Rocaltrol)', brands: 'Rocaltrol روکالترول', defaultDose: '0.25mcg', aliases: 'کلسیتریول روکالترول calcitriol rocaltrol' },
      { id: 'drg_ocp', label: 'قرص ضدبارداری ترکیبی (OCP - LD - HD)', brands: 'Yasmin یاسمین, Yaz یاز, مارولون', defaultDose: 'Daily', aliases: 'قرص ضد بارداری ال دی اچ دی یاسمین یاز ocp ld hd yasmin' },
      { id: 'drg_dydrogesterone', label: 'دیدروژسترون (Dydrogesterone - Duphaston)', brands: 'Duphaston دوفاستون', defaultDose: '10mg', aliases: 'دوفاستون دیدروژسترون duphaston dydrogesterone' },
      { id: 'drg_medroxyprogesterone', label: 'مدروکسی‌پروژسترون (Medroxyprogesterone)', brands: 'Provera پروورا', defaultDose: '5mg', aliases: 'مدروکسی پروژسترون پروورا medroxyprogesterone provera' }
    ]
  },
  {
    catId: 'dh_gastrointestinal',
    catTitle: '۴. داروهای گوارشی، کبدی و ضدتهوع',
    drugs: [
      { id: 'drg_pantoprazole', aliases: 'پنتاپرازول پنتوپرازول نولپازا نلپازا پنتوزول معده pantoprazole nolpaza controloc', label: 'پنتوپرازول (Pantoprazole - Nolpaza)', brands: 'Nolpaza نولپازا, پنتوزول, Controloc', defaultDose: '40mg' },
      { id: 'drg_omeprazole', aliases: 'امپرازول لوسک omeprazole losec', label: 'امپرازول (Omeprazole)', brands: 'Losec لوسک', defaultDose: '20mg' },
      { id: 'drg_esomeprazole', aliases: 'اسومپرازول نکسیوم اسوپرکس esomeprazole nexium', label: 'اس‌امپرازول (Esomeprazole - Nexium)', brands: 'Nexium نکسیوم, اسوپرکس', defaultDose: '40mg' },
      { id: 'drg_lansoprazole', label: 'لنسوپرازول (Lansoprazole)', brands: 'Prevacid پرواسید', defaultDose: '30mg', aliases: 'لنسوپرازول lansoprazole prevacid' },
      { id: 'drg_rabeprazole', label: 'رابپرازول (Rabeprazole)', brands: 'Pariet پاریت', defaultDose: '20mg', aliases: 'رابپرازول پاریت rabeprazole pariet' },
      { id: 'drg_famotidine', aliases: 'فاموتیدین پپسید famotidine pepcid', label: 'فاموتیدین (Famotidine)', brands: 'Pepcid پپسید', defaultDose: '40mg' },
      { id: 'drg_cimetidine', label: 'سایمتیدین (Cimetidine)', brands: 'Tagamet تاگامت', defaultDose: '200mg', aliases: 'سایمتیدین تاگامت cimetidine tagamet' },
      { id: 'drg_sucralfate', label: 'سوکرالفیت (Sucralfate)', brands: 'Carafate کارافیت', defaultDose: '1g', aliases: 'سوکرالفیت sucralfate' },
      { id: 'drg_aluminum_mgs', label: 'شربت آلومینیوم ام‌جی‌اس (Aluminum MgS)', brands: 'Al-Mg-S', defaultDose: '10ml', aliases: 'الومینیوم ام جی اس شربت معده انتی اسید aluminum mgs antacid' },
      { id: 'drg_ondansetron', aliases: 'اونداسترون انداسترون دمیترون زوفران ضد تهوع ondansetron zofran demitron', label: 'اندانسترون (Ondansetron - Demitron)', brands: 'Zofran زوفران, دمیترون', defaultDose: '4mg' },
      { id: 'drg_metoclopramide', aliases: 'پلازیل متوکلوپرامید metoclopramide plasil', label: 'متوکلوپرامید (Metoclopramide - Plasil)', brands: 'Plasil پلازیل', defaultDose: '10mg' },
      { id: 'drg_domperidone', label: 'دومپریدون (Domperidone - Motilium)', brands: 'Motilium موتیلیوم', defaultDose: '10mg', aliases: 'دومپریدون موتیلیوم domperidone motilium' },
      { id: 'drg_hyoscine', label: 'هیوسین (Hyoscine - Buscopan)', brands: 'Buscopan بوسکوپان', defaultDose: '10mg', aliases: 'هیوسین بوسکوپان دل پیچه hyoscine buscopan' },
      { id: 'drg_dicyclomine', label: 'دی‌سیکلومین (Dicyclomine)', brands: 'Bentyl بنتیل', defaultDose: '10mg', aliases: 'دی سیکلومین دیسیکلومین dicyclomine' },
      { id: 'drg_clidinium_c', label: 'کلیدینیوم سی (Chlordiazepoxide-Clidinium)', brands: 'Librax لیبراکس', defaultDose: '1 Tab', aliases: 'کلیدینیوم سی لیبراکس clidinium chlordiazepoxide librax' },
      { id: 'drg_mebeverine', label: 'مبورین (Mebeverine - Colofac)', brands: 'Colofac کولوفک', defaultDose: '135mg', aliases: 'مبورین کولوفک mebeverine colofac' },
      { id: 'drg_dimethicone', label: 'دایمتیکون (Dimethicone)', brands: 'Simethicone سایمتیکون', defaultDose: '40mg', aliases: 'دایمتیکون سایمتیکون ضد نفخ dimethicone simethicone' },
      { id: 'drg_bismuth', label: 'بیسموت ساب‌سیترات (Bismuth)', brands: 'De-Nol دی‌نول', defaultDose: '120mg', aliases: 'بیسموت bismuth' },
      { id: 'drg_lactulose', label: 'لاکتولوز (Lactulose)', brands: 'Duphalac دوفالاک', defaultDose: '15ml', aliases: 'شربت لاکتولوز ملین lactulose duphalac' },
      { id: 'drg_peg_pidrolax', label: 'پودر پیدرولاکس - پلی‌اتیلن گلیکول (PEG - Pidrolax)', brands: 'Pidrolax پیدرولاکس', defaultDose: '1 Sachet', aliases: 'پیدرولاکس پگ پلی اتیلن گلیکول pidrolax peg' },
      { id: 'drg_bisacodyl', label: 'بیزاکودیل (Bisacodyl)', brands: 'Dulcolax دولکولاکس', defaultDose: '5mg', aliases: 'بیزاکودیل دولکولاکس شیاف بیزاکودیل bisacodyl dulcolax' },
      { id: 'drg_senna', label: 'سنا - سی‌لاکس (Senna - C-Lax)', brands: 'C-Lax سی‌لاکس, سنالین', defaultDose: '1 Tab', aliases: 'سنا سی لاکس سیلاکس senna clax' },
      { id: 'drg_loperamide', label: 'لوپرامید (Loperamide)', brands: 'Imodium ایمودیوم', defaultDose: '2mg', aliases: 'لوپرامید ایمودیوم ضد اسهال loperamide imodium' },
      { id: 'drg_diphenoxylate', label: 'دیفنوکسیلات (Diphenoxylate)', brands: 'Lomotil لوموتیل', defaultDose: '2.5mg', aliases: 'دیفنوکسیلات لوموتیل diphenoxylate lomotil' },
      { id: 'drg_mesalazine', label: 'مزالازین (Mesalazine - Pentasa - Asacol)', brands: 'Pentasa پنتاسا, Asacol آساکول', defaultDose: '500mg', aliases: 'مزالازین پنتاسا آساکول mesalazine pentasa asacol' },
      { id: 'drg_sulfasalazine', label: 'سولفاسالازین (Sulfasalazine)', brands: 'Azulfidine آزولفیدین', defaultDose: '500mg', aliases: 'سولفاسالازین sulfasalazine' },
      { id: 'drg_ursodeoxycholic', label: 'اورسودئوکسی‌کولیک اسید (UDCA - Ursobil)', brands: 'Ursobil اورسوبیل, Ursofalk اورسوفالک', defaultDose: '300mg', aliases: 'اورسوبیل اورسوفالک اورسودئوکسی کولیک اسید udca ursobil ursofalk' }
    ]
  },
  {
    catId: 'dh_analgesics_rheum_immuno',
    catTitle: '۵. مسکن‌ها (NSAIDs و اپیوئیدها)، روماتولوژی و سرکوب‌کننده ایمنی',
    drugs: [
      { id: 'drg_acetaminophen', label: 'استامینوفن (Acetaminophen)', brands: 'Tylenol تایلنول, پاراستامول', defaultDose: '500mg', aliases: 'استامینوفن ساده پاراستامول تایلنول acetaminophen paracetamol tylenol' },
      { id: 'drg_apotel', label: 'آپوتل - استامینوفن تزریقی (IV Apotel)', brands: 'Apotel آپوتل', defaultDose: '1g IV', aliases: 'اپوتل آپوتل استامینوفن وریدی تزریقی apotel iv acetaminophen' },
      { id: 'drg_acetaminophen_codeine', label: 'استامینوفن کدئین (Acetaminophen Codeine)', brands: 'آکسار, استامینوفن کدئین', defaultDose: '300/20mg', aliases: 'استامینوفن کدئین دار کدئین acetaminophen codeine' },
      { id: 'drg_novafen', label: 'نووافن (Novafen)', brands: 'Novafen نووافن', defaultDose: '1 Cap', aliases: 'نووافن نوافن novafen' },
      { id: 'drg_ibuprofen', label: 'ژلوفن - ایبوپروفن (Ibuprofen - Gelofen)', brands: 'Gelofen ژلوفن, Advil ادویل', defaultDose: '400mg', aliases: 'ژلوفن ایبوپروفن بروفن ادویل ibuprofen gelofen advil' },
      { id: 'drg_naproxen', label: 'ناپروکسن (Naproxen)', brands: 'Aleve آلیو', defaultDose: '250mg', aliases: 'ناپروکسن naproxen aleve' },
      { id: 'drg_diclofenac', aliases: 'دیکلوفناک ولتارن الفن ایکس ال شیاف diclofenac voltaren', label: 'دیکلوفناک سدیم (Diclofenac)', brands: 'Voltaren ولتارن, آلفن ایکس ال', defaultDose: '50mg' },
      { id: 'drg_celecoxib', aliases: 'سلکوکسیب سلبرکس مسکن celecoxib celebrex nsaid', label: 'سلکوکسیب (Celecoxib - Celebrex)', brands: 'Celebrex سلبرکس', defaultDose: '200mg' },
      { id: 'drg_meloxicam', label: 'ملوکسیکام (Meloxicam)', brands: 'Mobic موبیک', defaultDose: '15mg', aliases: 'ملوکسیکام موبیک meloxicam mobic' },
      { id: 'drg_piroxicam', label: 'پیروکسیکام (Piroxicam)', brands: 'Feldene فلدن', defaultDose: '10mg', aliases: 'پیروکسیکام فلدن piroxicam feldene' },
      { id: 'drg_mefenamic_acid', label: 'مفنامیک اسید (Mefenamic Acid)', brands: 'Ponstan پونستان', defaultDose: '250mg', aliases: 'مفنامیک اسید پونستان mefenamic acid ponstan' },
      { id: 'drg_indomethacin', label: 'ایندومتاسین (Indomethacin)', brands: 'Indocin ایندوسین', defaultDose: '25mg', aliases: 'ایندومتاسین شیاف ایندومتاسین indomethacin' },
      { id: 'drg_ketorolac', aliases: 'کترولاک کتورلاک کترلاک ketorolac toradol مسکن تزریقی آمپول', label: 'کتورولاک (Ketorolac)', brands: 'Toradol تورادول', defaultDose: '30mg IV' },
      { id: 'drg_morphine', label: 'مورفین (Morphine Sulfate)', brands: 'Morphine مورفین', defaultDose: '5mg IV', highAlert: true, aliases: 'مورفین مرفین مورقین آمپول مورفین morphine sulfate' },
      { id: 'drg_pethidine', label: 'پتیدین - مپریدین (Pethidine - Meperidine)', brands: 'Demerol دمرول', defaultDose: '25mg IV', highAlert: true, aliases: 'پتیدین مپریدین دمرول pethidine meperidine demerol' },
      { id: 'drg_fentanyl', label: 'فنتانیل (Fentanyl)', brands: 'Durogesic دوروژزیک', defaultDose: '50mcg IV', highAlert: true, aliases: 'فنتانیل چسب فنتانیل fentanyl' },
      { id: 'drg_tramadol', label: 'ترامادول (Tramadol)', brands: 'Ultram اولترام, بایومادول', defaultDose: '50mg', highAlert: true, aliases: 'ترامادول بایومادول tramadol ultram' },
      { id: 'drg_methadone', label: 'متادون (Methadone)', brands: 'Dolophine دولوفین', defaultDose: '5mg', highAlert: true, aliases: 'متادون شربت متادون قرص متادون methadone' },
      { id: 'drg_buprenorphine', label: 'بوپرنورفین (Buprenorphine)', brands: 'Subutex سابوتکس, B2', defaultDose: '2mg SL', highAlert: true, aliases: 'بوپرنورفین ب2 بی تو سابوتکس buprenorphine subutex' },
      { id: 'drg_allopurinol', label: 'آلوپورینول (Allopurinol)', brands: 'Zyloric زایلوریک', defaultDose: '100mg', aliases: 'الوپورینول آلوپورینول نقرس اسید اوریک allopurinol zyloric' },
      { id: 'drg_febuxostat', label: 'فبوکسوستات (Febuxostat)', brands: 'Adenuric آدنوریک, فبوکسوریک', defaultDose: '80mg', aliases: 'فبوکسوستات آدنوریک febuxostat adenuric' },
      { id: 'drg_colchicine', label: 'کلشی‌سین (Colchicine)', brands: 'Colcrys, موداکول', defaultDose: '1mg', aliases: 'کلشی سین کلشیسین نقرس تب مدیترانه ای colchicine' },
      { id: 'drg_methotrexate', label: 'متوترکسات (Methotrexate)', brands: 'Rheumatrex, ابترکسات', defaultDose: '7.5mg Weekly', highAlert: true, aliases: 'متوترکسات ام تی ایکس mtx methotrexate' },
      { id: 'drg_azathioprine', label: 'آزاتیوپرین (Azathioprine)', brands: 'Imuran ایموران', defaultDose: '50mg', highAlert: true, aliases: 'ازاتیوپرین آزاتیوپرین ایموران azathioprine imuran' },
      { id: 'drg_hydroxychloroquine', label: 'هیدروکسی‌کلروکین (Hydroxychloroquine)', brands: 'Plaquenil پلاكونیل', defaultDose: '200mg', aliases: 'هیدروکسی کلروکین پلاكونیل hydroxychloroquine plaquenil' },
      { id: 'drg_cyclosporine', label: 'سیکلوسپورین (Cyclosporine)', brands: 'Sandimmune ساندیمون, Neoral نئورال', defaultDose: '100mg', highAlert: true, aliases: 'سیکلوسپورین نئورال ساندیمون cyclosporine neoral' },
      { id: 'drg_tacrolimus', label: 'تاکرولیموس (Tacrolimus)', brands: 'Prograf پروگراف', defaultDose: '1mg', highAlert: true, aliases: 'تاکرولیموس پروگراف پیوند tacrolimus prograf' },
      { id: 'drg_mycophenolate', label: 'مایکوفنولات موفتیل (Mycophenolate - CellCept)', brands: 'CellCept سل‌سپت, Myfortic مایفورتیک', defaultDose: '500mg', highAlert: true, aliases: 'مایکوفنولات سل سپت سلسپت مایفورتیک mycophenolate cellcept' },
      { id: 'drg_tamoxifen', label: 'تاموکسیفن (Tamoxifen)', brands: 'Nolvadex نولوادکس', defaultDose: '20mg', aliases: 'تاموکسیفن نولوادکس tamoxifen nolvadex' },
      { id: 'drg_letrozole', label: 'لتروزول (Letrozole)', brands: 'Femara فمارا', defaultDose: '2.5mg', aliases: 'لتروزول فمارا letrozole femara' }
    ]
  },
  {
    catId: 'dh_respiratory_uro_neuro_psych_abx',
    catTitle: '۶. تنفسی، اورولوژی، اعصاب و روان و مکمل‌ها',
    drugs: [
      { id: 'drg_gabapentin', label: 'گاباپنتین (Gabapentin)', brands: 'Neurontin نورونتین', defaultDose: '300mg', aliases: 'گاباپنتین نورونتین gabapentin neurontin' },
      { id: 'drg_pregabalin', label: 'پرگابالین (Pregabalin - Lyrica)', brands: 'Lyrica لیریکا, گاباپور', defaultDose: '75mg', aliases: 'پرگابالین لیریکا pregabalin lyrica' },
      { id: 'drg_levetiracetam', label: 'لوه‌تیراستام (Levetiracetam - Keppra)', brands: 'Keppra کپرا, لووهبل', defaultDose: '500mg', aliases: 'لوه تیراستام کپرا ضد تشنج levetiracetam keppra' },
      { id: 'drg_sodium_valproate', label: 'والپروات سدیم (Sodium Valproate - Depakine)', brands: 'Depakine دپاکین, رهاکین', defaultDose: '500mg', aliases: 'والپروات سدیم دپاکین رهاکین valproate depakine' },
      { id: 'drg_carbamazepine', label: 'کاربامازپین (Carbamazepine)', brands: 'Tegretol تگرتول', defaultDose: '200mg', aliases: 'کاربامازپین تگرتول carbamazepine tegretol' },
      { id: 'drg_phenytoin', label: 'فنی‌توئین (Phenytoin)', brands: 'Dilantin دیلانتین', defaultDose: '100mg', aliases: 'فنی توئین دیلانتین phenytoin dilantin' },
      { id: 'drg_lamotrigine', label: 'لاموتریژین (Lamotrigine)', brands: 'Lamictal لامیکتال', defaultDose: '50mg', aliases: 'لاموتریژین لامیکتال lamotrigine lamictal' },
      { id: 'drg_topiramate', label: 'توپیرامات (Topiramate)', brands: 'Topamax توپاماکس', defaultDose: '50mg', aliases: 'توپیرامات توپاماکس topiramate topamax' },
      { id: 'drg_levodopa_carbidopa', label: 'لوودوپا-کاربیدوپا (Levodopa-Carbidopa)', brands: 'Sinemet سینمت, Madopar مادوپار', defaultDose: '100/25mg', aliases: 'لوودوپا کاربیدوپا سینمت مادوپار پارکینسون levodopa carbidopa sinemet' },
      { id: 'drg_pramipexole', label: 'پرامی‌پکسول (Pramipexole)', brands: 'Sifrol سیفرول', defaultDose: '0.18mg', aliases: 'پرامی پکسول سیفرول pramipexole sifrol' },
      { id: 'drg_donepezil', label: 'دونپزیل (Donepezil)', brands: 'Aricept آریسپت, یاسپرا', defaultDose: '10mg', aliases: 'دونپزیل آریسپت آلزایمر donepezil aricept' },
      { id: 'drg_memantine', label: 'ممانتین (Memantine)', brands: 'Ebixa ابیکسا', defaultDose: '10mg', aliases: 'ممانتین ابیکسا memantine ebixa' },
      { id: 'drg_sertraline', label: 'سرترالین (Sertraline - Asentra)', brands: 'Zoloft زولوفت, Asentra آسنترا', defaultDose: '50mg', aliases: 'سرترالین آسنترا زولوفت sertraline asentra zoloft' },
      { id: 'drg_fluoxetine', label: 'فلوکستین (Fluoxetine)', brands: 'Prozac پروزاک', defaultDose: '20mg', aliases: 'فلوکستین پروزاک fluoxetine prozac' },
      { id: 'drg_citalopram', label: 'سیتالوپرام (Citalopram)', brands: 'Celexa سلکسا', defaultDose: '20mg', aliases: 'سیتالوپرام citalopram' },
      { id: 'drg_escitalopram', label: 'اس‌سیتالوپرام (Escitalopram - Lexapro)', brands: 'Lexapro لکساپرو, لگزاتال, ازیپم', defaultDose: '10mg', aliases: 'اس سیتالوپرام لگزاتال ازیپم لکساپرو escitalopram lexapro' },
      { id: 'drg_venlafaxine', label: 'ونلافاکسین (Venlafaxine)', brands: 'Effexor افکسور, آلوینتا', defaultDose: '75mg', aliases: 'ونلافاکسین افکسور آلوینتا venlafaxine effexor' },
      { id: 'drg_duloxetine', label: 'دولوکستین (Duloxetine - Cymbalta)', brands: 'Cymbalta سیمبالتا', defaultDose: '30mg', aliases: 'دولوکستین سیمبالتا duloxetine cymbalta' },
      { id: 'drg_amitriptyline', label: 'آمیتریپتیلین (Amitriptyline)', brands: 'Elavil الاویل', defaultDose: '25mg', aliases: 'امیتریپتیلین آمیتریپتیلین amitriptyline' },
      { id: 'drg_nortriptyline', label: 'نورتریپتیلین (Nortriptyline)', brands: 'Pamelor پاملور', defaultDose: '10mg', aliases: 'نورتریپتیلین nortriptyline' },
      { id: 'drg_alprazolam', label: 'آلپرازولام (Alprazolam - Xanax)', brands: 'Xanax زاناکس', defaultDose: '0.5mg', aliases: 'الپرازولام آلپرازولام زاناکس alprazolam xanax' },
      { id: 'drg_clonazepam', label: 'کلونازپام (Clonazepam)', brands: 'Rivotril ریووتریل', defaultDose: '1mg', aliases: 'کلونازپام ریووتریل clonazepam rivotril' },
      { id: 'drg_lorazepam', label: 'لورازپام (Lorazepam)', brands: 'Ativan آتیوان', defaultDose: '1mg', aliases: 'لورازپام آتیوان lorazepam ativan' },
      { id: 'drg_diazepam', label: 'دیازپام (Diazepam)', brands: 'Valium والیوم', defaultDose: '5mg', aliases: 'دیازپام والیوم diazepam valium' },
      { id: 'drg_zolpidem', label: 'زولپیدم (Zolpidem)', brands: 'Stilnox استیلنوکس, Ambien', defaultDose: '10mg', aliases: 'زولپیدم استیلنوکس خواب آور zolpidem stilnox' },
      { id: 'drg_quetiapine', label: 'کوئتیاپین (Quetiapine - Seroquel)', brands: 'Seroquel سروکوئل, کوئنتیاکس', defaultDose: '25mg', aliases: 'کوئتیاپین سروکوئل کوئنتیاکس quetiapine seroquel' },
      { id: 'drg_olanzapine', label: 'اولانزاپین (Olanzapine)', brands: 'Zyprexa زیپرکسا', defaultDose: '5mg', aliases: 'اولانزاپین زیپرکسا olanzapine zyprexa' },
      { id: 'drg_risperidone', label: 'ریسپریدون (Risperidone)', brands: 'Risperdal ریسپردال', defaultDose: '2mg', aliases: 'ریسپریدون ریسپردال risperidone risperdal' },
      { id: 'drg_haloperidol', label: 'هالوپریدول (Haloperidol)', brands: 'Haldol هالدول', defaultDose: '5mg', aliases: 'هالوپریدول هالدول haloperidol haldol' },
      { id: 'drg_tamsulosin', aliases: 'تامسولوسین امنیک پروستات tamsulosin omnic', label: 'تامسولوسین (Tamsulosin - Omnic)', brands: 'Omnic امنیک, تامسوژن', defaultDose: '0.4mg' },
      { id: 'drg_terazosin', label: 'ترازوسین (Terazosin)', brands: 'Hytrin هایترین', defaultDose: '2mg', aliases: 'ترازوسین هایترین پروستات terazosin hytrin' },
      { id: 'drg_finasteride', label: 'فیناستراید (Finasteride)', brands: 'Proscar پروسکار, Propecia', defaultDose: '5mg', aliases: 'فیناستراید پروسکار پروستات finasteride proscar' },
      { id: 'drg_solifenacin', label: 'سولیفناسین (Solifenacin - Vesicare)', brands: 'Vesicare وزیکر', defaultDose: '5mg', aliases: 'سولیفناسین وزیکر solifenacin vesicare' },
      { id: 'drg_oxybutynin', label: 'اکسی‌بوتینین (Oxybutynin)', brands: 'Ditropan دیتروپان', defaultDose: '5mg', aliases: 'اکسی بوتینین oxybutynin' },
      { id: 'drg_sildenafil', label: 'سیلدنافیل (Sildenafil)', brands: 'Viagra ویاگرا', defaultDose: '50mg', aliases: 'سیلدنافیل ویاگرا sildenafil viagra' },
      { id: 'drg_tadalafil', label: 'تادالافیل (Tadalafil)', brands: 'Cialis سیالیس', defaultDose: '20mg', aliases: 'تادالافیل سیالیس tadalafil cialis' },
      { id: 'drg_salbutamol', aliases: 'سالبوتامول ونتولین اسپری ابی salbutamol ventolin', label: 'سالبوتامول (Salbutamol - Ventolin)', brands: 'Ventolin ونتولین', defaultDose: '2 Puffs PRN' },
      { id: 'drg_ipratropium', label: 'ایپراتروپیوم بروماید (Ipratropium - Atrovent)', brands: 'Atrovent آتروونت', defaultDose: '2 Puffs', aliases: 'ایپراتروپیوم آتروونت اسپری اتروونت ipratropium atrovent' },
      { id: 'drg_tiotropium', label: 'تیوتروپیوم (Tiotropium - Spiriva)', brands: 'Spiriva اسپیریوا, کپسی‌هالر', defaultDose: '1 Cap Inhaled', aliases: 'تیوتروپیوم اسپیریوا کپسی هالر tiotropium spiriva' },
      { id: 'drg_symbicort', label: 'سیمبیکورت - بودزوناید-فورموترول (Symbicort)', brands: 'Symbicort سیمبیکورت, بودوفورم', defaultDose: '1-2 Puffs BD', aliases: 'سیمبیکورت بودزوناید فورموترول بودوفورم symbicort budesonide formoterol' },
      { id: 'drg_seretide', label: 'سرتاید - فلوتیکازون-سالمترول (Seretide)', brands: 'Seretide سرتاید', defaultDose: '1-2 Puffs BD', aliases: 'سرتاید فلوتیکازون سالمترول seretide fluticasone salmeterol' },
      { id: 'drg_montelukast', label: 'مونته‌لوکاست (Montelukast)', brands: 'Singulair سینگولر, ایرکاست', defaultDose: '10mg', aliases: 'مونته لوکاست سینگولر ایرکاست montelukast singulair' },
      { id: 'drg_theophylline', label: 'تئوفیلین (Theophylline)', brands: 'Theodur تئودور', defaultDose: '200mg', aliases: 'تئوفیلین آمینوفیلین theophylline' },
      { id: 'drg_acetylcysteine', label: 'استیل‌سیستئین (NAC)', brands: 'ACC قرص جوشان', defaultDose: '600mg', aliases: 'استیل سیستئین ان استیل سیستئین قرص جوشان خلط آور nac acetylcysteine' },
      { id: 'drg_cetirizine', label: 'ستیریزین (Cetirizine)', brands: 'Zyrtec زیرتک, لتیزن', defaultDose: '10mg', aliases: 'ستیریزین زیرتک لتیزن حساسیت cetirizine zyrtec' },
      { id: 'drg_fexofenadine', label: 'فکسوفنادین (Fexofenadine - Telfast)', brands: 'Telfast تلفست', defaultDose: '180mg', aliases: 'فکسوفنادین تلفست fexofenadine telfast' },
      { id: 'drg_loratadine', label: 'لوراتادین (Loratadine)', brands: 'Claritin کلاریتین', defaultDose: '10mg', aliases: 'لوراتادین کلاریتین loratadine claritin' },
      { id: 'drg_hydroxyzine', label: 'هیدروکسی‌زین (Hydroxyzine)', brands: 'Atarax آتاراکس', defaultDose: '25mg', aliases: 'هیدروکسی زین آتاراکس خارش hydroxyzine atarax' },
      { id: 'drg_ferrous_sulfate', label: 'فروس سولفات - قرص آهن (Ferrous Sulfate)', brands: 'Ferfolic فرفولیک, Fefol فیفول', defaultDose: 'Daily', aliases: 'فروس سولفات قرص اهن فرفولیک فیفول ferrous sulfate iron' },
      { id: 'drg_folic_acid', label: 'فولیک اسید (Folic Acid)', brands: 'Folic Acid 1mg, 5mg', defaultDose: '1mg Daily', aliases: 'فولیک اسید اسید فولیک folic acid' },
      { id: 'drg_calcium_d', label: 'کلسیم-ویتامین D (Calcium-D)', brands: 'CalciCare کلسی‌کر, استئوکر', defaultDose: 'Daily', aliases: 'کلسیم دی کلسی کر استئوکر calcium vitamin d' },
      { id: 'drg_vitamin_d3', label: 'ویتامین D3 (Cholecalciferol)', brands: 'Pearl Vit D3 50000 IU', defaultDose: '50000 IU Monthly', aliases: 'ویتامین دی پرل ویتامین دی vitamin d3 cholecalciferol' },
      { id: 'drg_vitamin_b12', label: 'ویتامین B12 (Cyanocobalamin)', brands: 'Neurobion نوروبیون', defaultDose: '1000mcg', aliases: 'ویتامین ب12 نوروبیون سیانوکوبالامین vitamin b12 neurobion' }
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

export const ROS_SYSTEM_META = [
  { id: 'constitutional', group: '۱. علائم عمومی (Constitutional Symptoms)', en: 'Constitutional Symptoms' },
  { id: 'skin_hair_nails', group: '۲. پوست، مو و ناخن‌ها (Skin, Hair & Nails)', en: 'Skin, Hair & Nails' },
  { id: 'head_eyes_ent', group: '۳. سر، چشم، گوش، حلق و بینی (Head, Eyes & ENT)', en: 'Head, Eyes & ENT' },
  { id: 'breast', group: '۴. پستان و ضمائم (Breast & Axilla)', en: 'Breast & Axilla' },
  { id: 'respiratory', group: '۵. دستگاه تنفسی (Respiratory System)', en: 'Respiratory System' },
  { id: 'cardiovascular_vascular', group: '۶. دستگاه قلبی و عروقی (Cardiovascular & Vascular)', en: 'Cardiovascular & Vascular' },
  { id: 'gastrointestinal_hepatobiliary', group: '۷. گوارش، کبد و صفرا (Gastrointestinal & Hepatobiliary)', en: 'Gastrointestinal & Hepatobiliary' },
  { id: 'urinary_renal', group: '۸. کلیه و مجاری ادراری (Urinary & Renal)', en: 'Urinary & Renal' },
  { id: 'male_reproductive', group: '۹. دستگاه تناسلی مردان (Male Reproductive)', en: 'Male Reproductive' },
  { id: 'female_reproductive_obgyn', group: '۱۰. دستگاه تناسلی زنان و مامایی (Female Reproductive & OB/GYN)', en: 'Female Reproductive & OB/GYN' },
  { id: 'musculoskeletal', group: '۱۱. اسکلتی-عضلانی و مفاصل (Musculoskeletal & Joints)', en: 'Musculoskeletal & Joints' },
  { id: 'neurological', group: '۱۲. دستگاه عصبی (Neurological System)', en: 'Neurological System' },
  { id: 'endocrine_hematologic_allergic', group: '۱۳. غدد، خون و آلرژی (Endocrine, Hematologic & Allergic)', en: 'Endocrine, Hematologic & Allergic' },
  { id: 'psychiatric', group: '۱۴. اعصاب و روان (Psychiatric & Mental Health)', en: 'Psychiatric & Mental Health' }
];

export const ROS_GROUPS_BILINGUAL = ROS_SYSTEM_META.map(meta => ({
  id: `ros_${meta.id}`,
  systemKey: meta.id,
  group: meta.group,
  en: meta.en,
  items: MASTER_ROS_BANK.filter(it => it.system === meta.id).map(it => ({
    ...it,
    label: it.fa && it.en ? `${it.fa} (${it.en})` : (it.fa || it.en)
  }))
}));

export const PE_SYSTEMS_CONFIG = [
  { id: 'general_appearance', title: '۱. ظاهر عمومی، هوشیاری و وضعیت تغذیه (General Appearance & Mental Status)', en: 'General Appearance & Mental Status' },
  { id: 'skin_hair_nails', title: '۲. پوست، مو و ناخن‌ها (Integumentary, Skin, Hair & Nails)', en: 'Integumentary, Skin, Hair & Nails' },
  { id: 'heent_neck_thyroid', title: '۳. سر، چشم، گوش، حلق و بینی، گردن و تیروئید (HEENT, Neck & Thyroid)', en: 'HEENT, Neck & Thyroid' },
  { id: 'thorax_lungs', title: '۴. قفسه سینه و ریه‌ها (Thorax & Lungs)', en: 'Thorax & Lungs' },
  { id: 'cardiovascular_peripheral_vascular', title: '۵. قلب، عروق و نبض‌های محیطی (Cardiovascular & Peripheral Vascular)', en: 'Cardiovascular & Peripheral Vascular' },
  { id: 'abdomen_4_pillars', title: '۶. ارکان چهارگانه معاینه شکم (Abdomen - 4 Pillars of Exam)', en: 'Abdomen - 4 Pillars of Core Exam' },
  { id: 'breast_axilla', title: '۷. پستان و آگزیلا (Breast & Axillary Lymph Nodes)', en: 'Breast & Axillary Lymph Nodes' },
  { id: 'inguinal_hernia_genitourinary_dre', title: '۸. کانال اینگوینال، فتق‌ها، ارولوژی و DRE (Inguinal Orifices, GU & DRE)', en: 'Inguinal Orifices, GU & DRE' },
  { id: 'musculoskeletal_spine', title: '۹. دستگاه اسکلتی-عضلانی، ستون فقرات و مفاصل (Musculoskeletal, Spine & Joints)', en: 'Musculoskeletal, Spine & Joints' },
  { id: 'neurological', title: '۱۰. معاینه دقیق عصبی و رفلکس‌ها (Neurological Examination)', en: 'Neurological Examination' },
  { id: 'surgical_wound_drain_stoma', title: '۱۱. محل برش جراحی، زخم، درن‌ها و استومی (Surgical Wound, Drains & Stoma)', en: 'Surgical Wound, Drains & Stoma' },
  { id: 'trauma_atls_signs', title: '۱۲. نشانه‌های ترومای حاد و ATLS (Acute Trauma & ATLS Signs)', en: 'Acute Trauma & ATLS Signs' }
];

export const PE_SUBGROUP_TITLES = {
  general_inspection: { fa: 'مشاهده عمومی و دیسترس', en: 'General Inspection & Distress' },
  mental_status: { fa: 'سطح هوشیاری و جهت‌یابی', en: 'Mental Status & Orientation' },
  nutrition_hydration: { fa: 'وضعیت تغذیه و هیدراتاسیون', en: 'Nutrition & Hydration' },
  posture: { fa: 'پوزیشن و پوسچر بیمار', en: 'Posture & Body Positioning' },
  inspection: { fa: 'مشاهده و ارزیابی ظاهری', en: 'Inspection & Appearance' },
  primary_lesions: { fa: 'ضایعات اولیه پوستی', en: 'Primary Skin Lesions' },
  secondary_lesions: { fa: 'ضایعات ثانویه پوستی', en: 'Secondary Skin Lesions' },
  vascular_lesions: { fa: 'ضایعات عروقی و پورپورا', en: 'Vascular Lesions & Purpura' },
  palpation: { fa: 'لمس، قوام و دما', en: 'Palpation, Consistency & Temp' },
  perfusion: { fa: 'پرفیوژن و پرشدگی مویرگی', en: 'Perfusion & Capillary Refill' },
  nails: { fa: 'ناخن‌ها', en: 'Nails' },
  hair: { fa: 'مو و ضمائم', en: 'Hair' },
  head: { fa: 'سر و جمجمه', en: 'Head & Skull' },
  eyes_pupils: { fa: 'چشم‌ها و مردمک‌ها', en: 'Eyes & Pupils' },
  eyes_fundus: { fa: 'فوندوسکوپی', en: 'Fundoscopy' },
  ears: { fa: 'گوش‌ها و اتوسکوپی', en: 'Ears & Otoscopy' },
  nose: { fa: 'بینی و رینوسکوپی', en: 'Nose & Rhinoscopy' },
  oral_pharynx: { fa: 'دهان و حلق', en: 'Oral Cavity & Pharynx' },
  neck: { fa: 'گردن و عروق ژوگولار', en: 'Neck & JVP' },
  thyroid: { fa: 'غده تیروئید', en: 'Thyroid Gland' },
  lymph_nodes: { fa: 'غدد لنفاوی', en: 'Lymph Nodes' },
  percussion: { fa: 'دق', en: 'Percussion' },
  auscultation: { fa: 'سمع', en: 'Auscultation' },
  special_voice_tests: { fa: 'تست‌های انتقال صوت و تندرنس', en: 'Vocal Resonance & Palpation' },
  precordium: { fa: 'پره‌کوردیوم و ضربه نوک قلب', en: 'Precordium & PMI' },
  peripheral_pulses: { fa: 'نبض‌های محیطی', en: 'Peripheral Pulses' },
  edema_venous: { fa: 'ادم محیطی و عروق وریدی', en: 'Peripheral Edema & Veins' },
  dvt_assessment: { fa: 'بررسی DVT و ترومبوفلبیت', en: 'DVT Assessment' },
  special_maneuvers: { fa: 'مانورهای تشخیصی ویژه', en: 'Special Diagnostic Maneuvers' },
  palpation_special_signs: { fa: 'لمس شکم و نشانه‌های پریتونیت', en: 'Palpation & Peritoneal Signs' },
  axilla: { fa: 'آگزیلا و لنفادنوپاتی', en: 'Axilla & Lymph Nodes' },
  inguinal_hernia: { fa: 'کانال اینگوینال و فتق‌ها', en: 'Inguinal Orifices & Hernia' },
  genital_exam: { fa: 'معاینه دستگاه تناسلی', en: 'External Genitalia' },
  scrotum_testes: { fa: 'اسکروتوم و بیضه‌ها', en: 'Scrotum & Testes' },
  dre: { fa: 'معاینه انگشتی رکتوم (DRE)', en: 'Digital Rectal Exam (DRE)' },
  gait_posture: { fa: 'گام‌برداری و راستای ستون فقرات', en: 'Gait & Spinal Alignment' },
  spine: { fa: 'ستون فقرات و تندرنس مهره‌ای', en: 'Spine & Vertebral Tenderness' },
  range_of_motion: { fa: 'دامنه حرکتی مفاصل', en: 'Range of Motion (ROM)' },
  joint_inspection: { fa: 'مشاهده و لمس مفاصل', en: 'Joint Inspection & Palpation' },
  consciousness_gcs: { fa: 'سطح هوشیاری و GCS', en: 'Consciousness & GCS' },
  cranial_nerves: { fa: 'اعصاب مغزی (CN I-XII)', en: 'Cranial Nerves (CN I-XII)' },
  motor: { fa: 'سیستم حرکتی و قدرت عضلانی', en: 'Motor System & Tone' },
  sensory: { fa: 'سیستم حسی', en: 'Sensory System' },
  reflexes: { fa: 'رفلکس‌های وتری عمقی (DTR)', en: 'Deep Tendon Reflexes (DTR)' },
  cerebellar: { fa: 'مخچه و تعادل', en: 'Cerebellar Function & Ataxia' },
  meningeal: { fa: 'علائم تحریکی مننژ', en: 'Meningeal Signs' },
  incision_wound: { fa: 'محل انسزیون و وضعیت زخم', en: 'Incision & Wound Status' },
  wound_complications: { fa: 'عوارض زخم (دهیسنس، عفونت)', en: 'Wound Complications' },
  dressing: { fa: 'پانسمان', en: 'Dressing Status' },
  drains: { fa: 'درن‌های جراحی و ترشحات', en: 'Surgical Drains & Output' },
  stoma: { fa: 'استومی جراحی (کلستومی/ایلئوستومی)', en: 'Surgical Stoma' },
  head_face: { fa: 'سر و صورت در تروما', en: 'Head & Maxillofacial Trauma' },
  chest: { fa: 'قفسه سینه در تروما', en: 'Thoracic Trauma' },
  abdomen_pelvis: { fa: 'شکم و لگن در تروما', en: 'Abdominal & Pelvic Trauma' },
  extremities: { fa: 'اندام‌ها و عروق در تروما', en: 'Extremities & Vascular Trauma' }
};

export const PE_MANDATORY_PILLARS = PE_SYSTEMS_CONFIG.map(cfg => ({
  id: `pe_sys_${cfg.id}`,
  systemKey: cfg.id,
  title: cfg.title,
  en: cfg.en,
  items: MASTER_PE_BANK.filter(it => it.system === cfg.id).map(it => ({
    ...it,
    label: it.fa && it.en ? `${it.fa} (${it.en})` : (it.fa || it.en)
  }))
}));

export const PE_UNLOCKABLE_MODULES = [
  {
    id: 'exam_dre',
    buttonLabel: 'افزودن معاینه رکتال و آنورکتال (Digital Rectal Exam - TR / DRE)',
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
    buttonLabel: 'افزودن معاینه اختصاصی پستان و آگزیلا (Breast & Axillary Exam)',
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
    buttonLabel: 'افزودن معاینه اختصاصی تیروئید و لنفادنوپاتی گردن (Thyroid & Cervical Exam)',
    title: 'معاینه اختصاصی تیروئید و لنفادنوپاتی گردن (Thyroid & Cervical Exam)',
    items: [
      { id: 'pe_thyroid_normal', label: 'تیروئید بدون بزرگی، بدون ندول لمس‌پذیر و متحرک با بلع', detailHint: '' },
      { id: 'pe_thyroid_nodule_goiter', label: 'گواتر منتشر یا ندول قابل لمس تیروئید', detailHint: 'لوب راست/چپ/ایستموس، ابعاد به cm، قوام...' },
      { id: 'pe_cervical_lap_detailed', label: 'لنفادنوپاتی گردنی یا سوپراکلاویکولار (Cervical / Virchow LAP)', detailHint: 'سطح لول گردنی، سایز cm، متحرک یا فیکس...' }
    ]
  },
  {
    id: 'exam_hernia',
    buttonLabel: 'افزودن معاینه اختصاصی کانال اینگوئینال و فتق‌ها (Hernia & Groin Exam)',
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
    buttonLabel: 'افزودن بررسی محل درن، زخم و پورت‌های جراحی (Post-Op Wound & Drain Inspection)',
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
    { id: 'migratory_shifting', label: 'تغییر محل / مهاجرت درد (Shifting Pain)' },
    { id: 'generalized_to_localized', label: 'شروع منتشر/ژنرالیزه در شکم و سپس لوکالیزه شدن در ناحیه خاص (الگوی کلاسیک آپاندیسیت و...)' }
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

// ==========================================================================
// v0.8-Omnisearch: Hidden Extended PMH Database (80+ Conditions for Fuzzy Search)
// ==========================================================================
export const HIDDEN_EXTENDED_PMH_DATABASE = [
  // کبد و گوارش
  { id: 'pmh_cirrhosis', label: 'سیروز کبدی (Liver Cirrhosis)', category: 'کبد و گوارش (GI & Liver)', aliases: 'سیروز کبد نارسایی کبد استسقاء اسیت cirrhosis', hiddenInDefaultTree: true },
  { id: 'pmh_nafld', label: 'کبد چرب غیرالکلی (NAFLD / MASLD)', category: 'کبد و گوارش (GI & Liver)', aliases: 'کبد چرب گرید ۱ ۲ ۳ استئاتوز کبدی fatty liver', hiddenInDefaultTree: true },
  { id: 'pmh_hbv', label: 'هپاتیت B مزمن (Chronic Hepatitis B - HBV)', category: 'کبد و گوارش (GI & Liver)', aliases: 'هپاتیت بی hbsag hbv hepatitis', hiddenInDefaultTree: true },
  { id: 'pmh_hcv', label: 'هپاتیت C مزمن (Chronic Hepatitis C - HCV)', category: 'کبد و گوارش (GI & Liver)', aliases: 'هپاتیت سی hcv hepatitis', hiddenInDefaultTree: true },
  { id: 'pmh_autoimmune_hep', label: 'هپاتیت اتوایمیون (Autoimmune Hepatitis)', category: 'کبد و گوارش (GI & Liver)', aliases: 'هپاتیت خودایمنی aih autoimmune', hiddenInDefaultTree: true },
  { id: 'pmh_psc', label: 'کلانژیت اسکلروزان اولیه (Primary Sclerosing Cholangitis - PSC)', category: 'کبد و گوارش (GI & Liver)', aliases: 'پی اس سی مجاری صفراوی psc cholangitis', hiddenInDefaultTree: true },
  { id: 'pmh_wilson', label: 'بیماری ویلسون (Wilson Disease)', category: 'کبد و گوارش (GI & Liver)', aliases: 'مس ویلسون حلقه کایزر ویلسن wilson', hiddenInDefaultTree: true },
  { id: 'pmh_hemochromatosis', label: 'هموکروماتوز (Hemochromatosis)', category: 'کبد و گوارش (GI & Liver)', aliases: 'رسوب اهن هموکروماتوزیس hemochromatosis', hiddenInDefaultTree: true },
  { id: 'pmh_achalasia', label: 'آشالازی مری (Achalasia)', category: 'کبد و گوارش (GI & Liver)', aliases: 'اشالازی تنگی مری دیسفاژی بلع اسپاسم achalasia', hiddenInDefaultTree: true },
  { id: 'pmh_barrett', label: 'مری بارت (Barrett Esophagus)', category: 'کبد و گوارش (GI & Liver)', aliases: 'بارت مری متاپلازی ریفلاکس اسید barrett', hiddenInDefaultTree: true },
  { id: 'pmh_hiatal_hernia', label: 'فتق هیاتال (Hiatal Hernia)', category: 'کبد و گوارش (GI & Liver)', aliases: 'هرنی هیاتال فتق دیافراگم hiatal hernia', hiddenInDefaultTree: true },
  { id: 'pmh_celiac', label: 'بیماری سلیاک (Celiac Disease)', category: 'کبد و گوارش (GI & Liver)', aliases: 'حساسیت گلوتن سلیاک celiac sprue', hiddenInDefaultTree: true },
  { id: 'pmh_crohn', label: 'بیماری کرون (Crohn Disease)', category: 'کبد و گوارش (GI & Liver)', aliases: 'کرون ای بی دی التهاب روده crohn ibd', hiddenInDefaultTree: true },
  { id: 'pmh_uc', label: 'کولیت اولسراتیو (Ulcerative Colitis - UC)', category: 'کبد و گوارش (GI & Liver)', aliases: 'کولیت اولسروز یو سی اسهال خونی ulcerative colitis', hiddenInDefaultTree: true },
  { id: 'pmh_chronic_pancreatitis', label: 'سابقه پانکراتیت مزمن یا حاد (Chronic / Recurrent Pancreatitis)', category: 'کبد و گوارش (GI & Liver)', aliases: 'پانکراتیت التهاب لوزالمعده pancreatitis', hiddenInDefaultTree: true },
  { id: 'pmh_diverticular_disease', label: 'دیورتیکولوز / دیورتیکولیت کولون (Diverticular Disease)', category: 'کبد و گوارش (GI & Liver)', aliases: 'دیورتیکول دیورتیکولیت شکم درد diverticulitis', hiddenInDefaultTree: true },
  { id: 'pmh_ibs', label: 'سندرم روده تحریک‌پذیر (IBS)', category: 'کبد و گوارش (GI & Liver)', aliases: 'ای بی اس روده عصبی کولیت عصبی ibs', hiddenInDefaultTree: true },
  { id: 'pmh_fap', label: 'پولیپوز آدنوماتوز فامیلیال (FAP)', category: 'کبد و گوارش (GI & Liver)', aliases: 'پولیپ روده فپ fap lynch polyposis', hiddenInDefaultTree: true },

  // قلب و عروق
  { id: 'pmh_prior_mi', label: 'سابقه سکته قلبی (Prior Myocardial Infarction - MI)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'سکته قلب ام ای انفارکتوس prior mi heart attack', hiddenInDefaultTree: true },
  { id: 'pmh_afib', label: 'فیبریلاسیون دهلیزی یا فلاتر (Atrial Fibrillation / Flutter)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'ای اف فیبریلاسیون دهلیزی ضربان نامنظم afib flutter', hiddenInDefaultTree: true },
  { id: 'pmh_svt', label: 'تاکیکاردی فوق بطنی (SVT / Paroxysmal Tachycardia)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'اس وی تی تپش قلب شدید حمله ای svt', hiddenInDefaultTree: true },
  { id: 'pmh_valvular_ms_mr', label: 'تنگی یا نارسایی دریچه میترال (Mitral Stenosis / Regurgitation)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'دریچه میترال نارسایی روماتیسمی ms mr mitral', hiddenInDefaultTree: true },
  { id: 'pmh_valvular_as_ar', label: 'تنگی یا نارسایی دریچه آئورت (Aortic Stenosis / Regurgitation)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'تنگی دریچه ائورت سوفل as ar aortic', hiddenInDefaultTree: true },
  { id: 'pmh_cardiomyopathy', label: 'کاردیومیوپاتی اتساعی یا هیپرتروفیک (DCM / HCM)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'کاردیومیوپاتی نارسایی قلبی بزرگی قلب dcm hcm', hiddenInDefaultTree: true },
  { id: 'pmh_pericarditis_endocarditis', label: 'سابقه پریکاردیت یا اندوکاردیت عفونی', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'التهاب پرده قلب عفونت دریچه pericarditis endocarditis', hiddenInDefaultTree: true },
  { id: 'pmh_aaa', label: 'آنوریسم آئورت شکمی یا سینه‌ای (Aortic Aneurysm - AAA/TAA)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'انوریسم ائورت گشادی رگ اصلی aaa taa', hiddenInDefaultTree: true },
  { id: 'pmh_varicose_veins', label: 'واریس شدید و نارسایی مزمن وریدی (CVI / Varicose Veins)', category: 'قلبی-عروقی (Cardiovascular)', aliases: 'واریس پا نارسایی ورید ساق varicose', hiddenInDefaultTree: true },

  // غدد و متابولیک
  { id: 'pmh_dm_type1', label: 'دیابت ملیتوس تیپ ۱ (Type 1 DM - وابسته به انسولین)', category: 'غدد و متابولیک (Endocrine)', aliases: 'قند جوانی دیابت یک type 1 dm iddm', hiddenInDefaultTree: true },
  { id: 'pmh_dm_type2', label: 'دیابت ملیتوس تیپ ۲ (Type 2 DM - غیر وابسته به انسولین)', category: 'غدد و متابولیک (Endocrine)', aliases: 'دیابت دو قند خون بزرگسالی niddm dm2', hiddenInDefaultTree: true },
  { id: 'pmh_thyroid_nodule', label: 'ندول یا گره تیروئید (Thyroid Nodule / MNG)', category: 'غدد و متابولیک (Endocrine)', aliases: 'گره تیروئید ندول گردن گواتر ندولار thyroid nodule', hiddenInDefaultTree: true },
  { id: 'pmh_hyperparathyroidism', label: 'هیپرپاراتیروئیدیسم (Hyperparathyroidism)', category: 'غدد و متابولیک (Endocrine)', aliases: 'پاراتیروئید کلسیم بالا adenoma parathyroid', hiddenInDefaultTree: true },
  { id: 'pmh_addison', label: 'نارسایی غده فوق کلیه / آدیسون (Adrenal Insufficiency / Addison)', category: 'غدد و متابولیک (Endocrine)', aliases: 'ادیسون کمبود کورتون ضعف ادرنال addison', hiddenInDefaultTree: true },
  { id: 'pmh_cushing', label: 'سندرم یا بیماری کوشینگ (Cushing Syndrome / Disease)', category: 'غدد و متابولیک (Endocrine)', aliases: 'کوشینگ کورتون بالا صورت ماه گونه cushing', hiddenInDefaultTree: true },
  { id: 'pmh_pheochromocytoma', label: 'فئوکروموسیتوم (Pheochromocytoma)', category: 'غدد و متابولیک (Endocrine)', aliases: 'فئو فئوکروموسیتوما تومور ادرنال تپش فشار حمله ای pheo', hiddenInDefaultTree: true },
  { id: 'pmh_prolactinoma_pituitary', label: 'آدنوم هیپوفیز / پرولاکتینوما / آکرومگالی', category: 'غدد و متابولیک (Endocrine)', aliases: 'تومور هیپوفیز پرولاکتین pituitary prolactinoma', hiddenInDefaultTree: true },
  { id: 'pmh_pcos', label: 'سندرم تخمدان پلی‌کیستیک (PCOS / تنبلی تخمدان)', category: 'غدد و متابولیک (Endocrine)', aliases: 'تنبلی تخمدان کیست تخمدان هیرسوتیسم pcos', hiddenInDefaultTree: true },
  { id: 'pmh_gout', label: 'نقرس و اسید اوریک بالا (Gout / Hyperuricemia)', category: 'غدد و متابولیک (Endocrine)', aliases: 'نقرس درد شست پا اسیداوریک gout uric acid', hiddenInDefaultTree: true },

  // کلیه و مجاری ادراری
  { id: 'pmh_renal_transplant', label: 'سابقه پیوند کلیه (Renal Transplant Recipient)', category: 'کلیه و مجاری ادراری (Renal & Urologic)', aliases: 'پیوند کلیه کلیه پیوندی ایمونوساپرسیو renal transplant', hiddenInDefaultTree: true },
  { id: 'pmh_adpkd', label: 'کلیه پلی‌کیستیک اتوزوم غالب (ADPKD)', category: 'کلیه و مجاری ادراری (Renal & Urologic)', aliases: 'کیست های کلیه ارثی پلی کیستیک adpkd', hiddenInDefaultTree: true },
  { id: 'pmh_glomerulonephritis_nephrotic', label: 'سندرم نفروتیک یا گلومرولونفریت (Glomerulonephritis)', category: 'کلیه و مجاری ادراری (Renal & Urologic)', aliases: 'دفع پروتئین ادرار نفروتیک ورم nephrotic', hiddenInDefaultTree: true },
  { id: 'pmh_urethral_stricture', label: 'تنگی مجرای ادرار (Urethral Stricture)', category: 'کلیه و مجاری ادراری (Renal & Urologic)', aliases: 'تنگی ادرار باریک شدن ادرار یورتروتومی stricture', hiddenInDefaultTree: true },

  // ریه و تنفس
  { id: 'pmh_bronchiectasis', label: 'برونشکتازی (Bronchiectasis)', category: 'ریوی و تنفسی (Respiratory)', aliases: 'خلط زیاد برونشکتازی عفونت مکرر ریه bronchiectasis', hiddenInDefaultTree: true },
  { id: 'pmh_pulmonary_fibrosis', label: 'فیبروز ریوی / بیماری بینابینی ریه (IPF / ILD)', category: 'ریوی و تنفسی (Respiratory)', aliases: 'فیبروز ریه بافت اسکار ریه اکسیژن ild ipf', hiddenInDefaultTree: true },
  { id: 'pmh_sarcoidosis', label: 'سارکوئیدوز (Sarcoidosis)', category: 'ریوی و تنفسی (Respiratory)', aliases: 'سارکوئیدوز گره لنفاوی هیلار sarcoidosis', hiddenInDefaultTree: true },
  { id: 'pmh_pah', label: 'پرفشاری شریان ریوی (Pulmonary Arterial Hypertension - PAH)', category: 'ریوی و تنفسی (Respiratory)', aliases: 'فشار ریه بالا فشار پولمونر pah', hiddenInDefaultTree: true },
  { id: 'pmh_pneumothorax_history', label: 'سابقه پنوموتوراکس خودبه‌خودی یا چست‌تیوب', category: 'ریوی و تنفسی (Respiratory)', aliases: 'هوای قفسه سینه کلاپس ریه چست تیوب pneumothorax', hiddenInDefaultTree: true },

  // خون، انکولوژی و روماتولوژی
  { id: 'pmh_sickle_cell', label: 'کم‌خونی داسی‌شکل (Sickle Cell Disease / Trait)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'سل داسی بحران داسی شکل sickle cell', hiddenInDefaultTree: true },
  { id: 'pmh_leukemia_lymphoma', label: 'سابقه لنفوم یا لوسمی (Leukemia / Lymphoma / Myeloma)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'سرطان خون لنفوم هوچکین غیرهوچکین لوسمی leukemia lymphoma myeloma', hiddenInDefaultTree: true },
  { id: 'pmh_thrombophilia_factor_v', label: 'ترومبوفیلی ارثی / فاکتور ۵ لیدن / آنتی‌فسفولیپید', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'لخته ارثی فاکتور ۵ لیدن کمبود پروتئین ترومبوفیلی thrombophilia apla', hiddenInDefaultTree: true },
  { id: 'pmh_sle', label: 'لوپوس اریتماتوز سیستمیک (Systemic Lupus Erythematosus - SLE)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'لوپوس بثورات پروانه ای مفصل انا sle lupus', hiddenInDefaultTree: true },
  { id: 'pmh_ra', label: 'آرتریت روماتوئید (Rheumatoid Arthritis - RA)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'روماتیسم مفصلی ورم مفاصل دست صبحگاهی ra', hiddenInDefaultTree: true },
  { id: 'pmh_behcet', label: 'بیماری بهجت (Behcet Disease)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'بهجت افت دهان زخم تناسلی یووئیت behcet', hiddenInDefaultTree: true },
  { id: 'pmh_scleroderma', label: 'اسکلرودرمی / اسکلروز سیستمیک (Systemic Sclerosis)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'سفتی پوست رینود اسکلرودرمی scleroderma', hiddenInDefaultTree: true },
  { id: 'pmh_ankylosing_spondylitis', label: 'اسپوندیلیت آنکیلوزان (Ankylosing Spondylitis - AS)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'رماتیسم ستون فقرات کمردرد صبحگاهی as hla b27', hiddenInDefaultTree: true },
  { id: 'pmh_fmf', label: 'تب مدیترانه‌ای فامیلی (Familial Mediterranean Fever - FMF)', category: 'خون و انکولوژی (Heme, Onc & Rheum)', aliases: 'اف ام اف تب مدیترانه ای درد شکم کولشیسین حملات fmf peritonitis', hiddenInDefaultTree: true },

  // اعصاب و روان و عفونی
  { id: 'pmh_ms', label: 'ام‌اس / مولتیپل اسکلروزیس (Multiple Sclerosis - MS)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'ام اس پلاک مغزی تاری دید ضعف ms', hiddenInDefaultTree: true },
  { id: 'pmh_myasthenia_gravis', label: 'میاستنی گراویس (Myasthenia Gravis - MG)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'میاستنی افتادگی پلک ضعف عضلانی مستینون mg myasthenia', hiddenInDefaultTree: true },
  { id: 'pmh_parkinson', label: 'بیماری پارکینسون (Parkinson Disease)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'لرزش دست کندی حرکت پارکینسون parkinson', hiddenInDefaultTree: true },
  { id: 'pmh_dementia_alzheimer', label: 'آلزایمر / دمانس (Dementia / Alzheimer)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'فراموشی دمانس الزایمر شناخت alzheimer dementia', hiddenInDefaultTree: true },
  { id: 'pmh_chronic_migraine', label: 'میگرن مزمن (Chronic Migraine)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'میگرن سردرد یکطرفه تهوع فوتوفوبیا migraine', hiddenInDefaultTree: true },
  { id: 'pmh_peripheral_neuropathy', label: 'نوروپاتی محیطی (Peripheral Neuropathy)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'گزگز پا بیحسی پای دیابتی خواب رفتن neuropathy', hiddenInDefaultTree: true },
  { id: 'pmh_bipolar_schizo', label: 'اختلال دوقطبی یا اسکیزوفرنی (Bipolar / Schizophrenia)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'دوقطبی شیدایی افسردگی سایکوز جنون bipolar schizophrenia', hiddenInDefaultTree: true },
  { id: 'pmh_brucellosis_history', label: 'سابقه تب مالت (Prior Brucellosis)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'بروسلوز تب مالت لبنیات محلی brucellosis wright', hiddenInDefaultTree: true },
  { id: 'pmh_hydatid_cyst_history', label: 'سابقه کیست هیداتید کبدی یا ریوی (Echinococcosis)', category: 'اعصاب و روان (Neurology & Psych)', aliases: 'کیست هیداتیک سگ اکینوکوکوس hydatid cyst', hiddenInDefaultTree: true },

  // جراحی‌های قبلی و برداشت ارگان‌ها (Prior Surgeries & Ectomies)
  { id: 'psh_nephrectomy', label: 'سابقه نفروکتومی / تک‌کلیه بودن (Prior Nephrectomy / Solitary Kidney)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'نفروکتومی برداشتن کلیه تک کلیه جراحی کلیه nephrectomy solitary kidney', hiddenInDefaultTree: true },
  { id: 'psh_cholecystectomy', label: 'سابقه کوله‌سیستکتومی / برداشتن کیسه صفرا (Prior Cholecystectomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'کوله سیستکتومی عمل کیسه صفرا لاپاراسکوپی صفرا cholecystectomy', hiddenInDefaultTree: true },
  { id: 'psh_appendectomy', label: 'سابقه آپاندکتومی (Prior Appendectomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'اپاندکتومی عمل آپاندیس appendectomy', hiddenInDefaultTree: true },
  { id: 'psh_splenectomy', label: 'سابقه اسپلنکتومی / برداشتن طحال (Prior Splenectomy / Asplenia)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'اسپلنکتومی برداشتن طحال تروما طحال splenectomy asplenia', hiddenInDefaultTree: true },
  { id: 'psh_thyroidectomy', label: 'سابقه تیروئیدکتومی توتال یا ساب‌توتال (Prior Thyroidectomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'تیروئیدکتومی عمل تیروئید برداشتن تیروئید thyroidectomy', hiddenInDefaultTree: true },
  { id: 'psh_mastectomy', label: 'سابقه ماستکتومی یا جراحی حفظ پستان (Prior Mastectomy / BCS)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'ماستکتومی برداشتن سینه پستان mastectomy lumpectomy bcs', hiddenInDefaultTree: true },
  { id: 'psh_hysterectomy', label: 'سابقه هیسترکتومی / برداشتن رحم و تخمدان (Prior Hysterectomy / TAH-BSO)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'هیسترکتومی برداشتن رحم تخمدان اووفورکتومی hysterectomy oophorectomy tah bso', hiddenInDefaultTree: true },
  { id: 'psh_cesarean', label: 'سابقه سزارین قبلی (Prior Cesarean Section - C/S)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'سزارین زایمان جراحی c section cesarean', hiddenInDefaultTree: true },
  { id: 'psh_bariatric', label: 'سابقه جراحی باریاتریک — اسلیو معده یا بای‌پس معده (Prior Sleeve Gastrectomy / Gastric Bypass)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'اسلیو معده بای پس معده جراحی لاغری گاسترکتومی sleeve bypass bariatric', hiddenInDefaultTree: true },
  { id: 'psh_gastrectomy', label: 'سابقه گاسترکتومی یا جراحی زخم معده (Prior Gastrectomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'گاسترکتومی برداشتن معده جراحی زخم معده gastrectomy', hiddenInDefaultTree: true },
  { id: 'psh_colectomy_ostomy', label: 'سابقه کولکتومی / رزکسیون روده یا تعبیه استومی (Prior Colectomy / Bowel Resection / Ostomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'کولکتومی برداشتن روده ایلئوستومی کولوستومی colectomy ostomy', hiddenInDefaultTree: true },
  { id: 'psh_herniorrhaphy', label: 'سابقه هرنیورافی / ترمیم فتق اینگوئینال، نافی یا انسزیونال (Prior Herniorrhaphy / Mesh Repair)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'هرنیورافی عمل فتق مش گذاری herniorrhaphy hernia repair', hiddenInDefaultTree: true },
  { id: 'psh_laparotomy', label: 'سابقه لاپاراتومی اکسپلوراتور قبلی (Prior Exploratory Laparotomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'لاپاراتومی باز کردن شکم laparotomy', hiddenInDefaultTree: true },
  { id: 'psh_anorectal_pilonidal', label: 'سابقه جراحی هموروئید، فیشر، فیستول یا سینوس پیلونیدال (Prior Anorectal / Pilonidal Surgery)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'هموروئیدکتومی فیشر فیستول سینوس پیلونیدال کیست مویی hemorrhoidectomy pilonidal', hiddenInDefaultTree: true },
  { id: 'psh_prostatectomy_turp', label: 'سابقه پروستاتکتومی یا TURP (Prior Prostatectomy / TURP)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'پروستاتکتومی عمل پروستات تراشیدن پروستات turp prostatectomy', hiddenInDefaultTree: true },
  { id: 'psh_orchiectomy_varicocelectomy', label: 'سابقه اورکیکتومی یا واریکوسلکتومی (Prior Orchiectomy / Varicocelectomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'اورکیکتومی برداشتن بیضه واریکوسلکتومی عمل واریکوسل orchiectomy varicocelectomy', hiddenInDefaultTree: true },
  { id: 'psh_laminectomy_spinal', label: 'سابقه لامینکتومی یا جراحی دیسک و ستون فقرات (Prior Laminectomy / Spinal Fusion)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'لامینکتومی عمل دیسک کمر پلاتین کمر ستون فقرات laminectomy spinal fusion', hiddenInDefaultTree: true },
  { id: 'psh_arthroplasty_tka_tha', label: 'سابقه تعویض مفصل زانو یا ران (Prior TKA / THA Arthroplasty)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'تعویض مفصل زانو تعویض مفصل ران لگن آرتروپلاستی tka tha arthroplasty', hiddenInDefaultTree: true },
  { id: 'psh_craniotomy_shunt', label: 'سابقه کرانیوتومی یا شنت مغزی (Prior Craniotomy / VP Shunt)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'کرانیوتومی جراحی مغز شنت مغزی craniotomy vp shunt', hiddenInDefaultTree: true },
  { id: 'psh_thoracotomy_chest_tube', label: 'سابقه توراکوتومی یا تعبیه چست‌تیوب (Prior Thoracotomy / Chest Tube)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'توراکوتومی جراحی قفسه سینه چست تیوب thoracotomy chest tube', hiddenInDefaultTree: true },
  { id: 'psh_tracheostomy', label: 'سابقه تراکئوستومی (Prior Tracheostomy)', category: 'سوابق جراحی و برداشت ارگان (PSH / Ectomies)', aliases: 'تراکئوستومی لوله گردن tracheostomy', hiddenInDefaultTree: true }
];

// ==========================================================================
// Master Surgical Procedures Bank for PSH Search (28 core surgical procedures)
// ==========================================================================
export const MASTER_PSH_SURGERIES_BANK = [
  // جراحی عمومی (General Surgery)
  { id: 'psh_appendectomy', label: 'آپاندکتومی (Appendectomy)', en: 'Appendectomy', category: 'General' },
  { id: 'psh_cholecystectomy', label: 'کوله سیستکتومی (Cholecystectomy - Open/Lap)', en: 'Cholecystectomy', category: 'General' },
  { id: 'psh_hernia_repair', label: 'ترمیم هرنی (Herniorrhaphy / Hernioplasty)', en: 'Hernia Repair', category: 'General' },
  { id: 'psh_mastectomy', label: 'ماستکتومی / لامپکتومی پستان (Mastectomy / Lumpectomy)', en: 'Mastectomy', category: 'General' },
  { id: 'psh_splenectomy', label: 'اسپلنکتومی (طحال‌برداری)', en: 'Splenectomy', category: 'General' },
  { id: 'psh_thyroidectomy', label: 'تیروئیدکتومی (Thyroidectomy)', en: 'Thyroidectomy', category: 'General' },
  { id: 'psh_hemorrhoidectomy', label: 'هموروئیدکتومی / فیشرکتومی', en: 'Hemorrhoidectomy', category: 'General' },
  { id: 'psh_laparotomy', label: 'لاپاراتومی تجسسی (Exploratory Laparotomy)', en: 'Exploratory Laparotomy', category: 'General' },
  { id: 'psh_bariatric', label: 'جراحی چاقی (اسلیو / بای‌پس معده)', en: 'Bariatric Surgery (Sleeve/Bypass)', category: 'General' },
  
  // ارتوپدی (Orthopedics)
  { id: 'psh_tka', label: 'تعویض مفصل زانو (TKA)', en: 'Total Knee Arthroplasty', category: 'Ortho' },
  { id: 'psh_tha', label: 'تعویض مفصل ران (THA)', en: 'Total Hip Arthroplasty', category: 'Ortho' },
  { id: 'psh_orif', label: 'جااندازی باز و تثبیت شکستگی (ORIF)', en: 'Open Reduction Internal Fixation (ORIF)', category: 'Ortho' },
  { id: 'psh_arthroscopy', label: 'آرتروسکوپی زانو / شانه (ترمیم مینیسک/ACL)', en: 'Arthroscopy (ACL/Meniscus)', category: 'Ortho' },
  { id: 'psh_carpal_tunnel', label: 'آزادسازی تونل کارپ (CTS Release)', en: 'Carpal Tunnel Release', category: 'Ortho' },
  
  // ارولوژی (Urology)
  { id: 'psh_turp', label: 'تراشیدن پروستات از راه مجرا (TURP)', en: 'Transurethral Resection of Prostate (TURP)', category: 'Urology' },
  { id: 'psh_turt', label: 'رزکسیون تومور مثانه (TURB/TURT)', en: 'Transurethral Resection of Bladder Tumor', category: 'Urology' },
  { id: 'psh_pcnl', label: 'سنگ‌شکنی کلیه (PCNL / TUL / ESWL)', en: 'PCNL / Ureteroscopy (TUL)', category: 'Urology' },
  { id: 'psh_varicocele', label: 'واریکوسلکتومی (Varicocelectomy)', en: 'Varicocelectomy', category: 'Urology' },
  { id: 'psh_nephrectomy', label: 'نفرکتومی (برداشتن کلیه)', en: 'Nephrectomy', category: 'Urology' },
  
  // گوش و حلق و بینی و سر و گردن (ENT & Head/Neck)
  { id: 'psh_tonsillectomy', label: 'لوزه‌برداری (Tonsillectomy / Adenoidectomy)', en: 'Tonsillectomy', category: 'ENT' },
  { id: 'psh_rhinoplasty', label: 'رینوپلاستی / سپتوپلاستی', en: 'Septorhinoplasty', category: 'ENT' },
  { id: 'psh_tympanoplasty', label: 'تمپانوپلاستی / ماستوئیدکتومی', en: 'Tympanoplasty / Mastoidectomy', category: 'ENT' },
  
  // جراحی اعصاب و ستون فقرات (Neurosurgery & Spine)
  { id: 'psh_discectomy', label: 'جراحی دیسک کمر / گردن (Discectomy / Laminectomy)', en: 'Lumbar/Cervical Discectomy', category: 'Neurosurgery' },
  { id: 'psh_craniotomy', label: 'کرانیوتومی (تخلیه هماتوم یا تومور مغزی)', en: 'Craniotomy (Hematoma/Tumor)', category: 'Neurosurgery' },
  
  // زنان و زایمان (Gynecology & Obstetrics)
  { id: 'psh_cesarean', label: 'سزارین (C-Section)', en: 'Cesarean Delivery (C-Section)', category: 'OB/GYN' },
  { id: 'psh_hysterectomy', label: 'هیسترکتومی (رحم‌برداری - TAH/VH)', en: 'Hysterectomy (TAH/VH)', category: 'OB/GYN' },
  { id: 'psh_oophorectomy', label: 'اووفورکتومی / کیست تخمدان', en: 'Oophorectomy / Ovarian Cystectomy', category: 'OB/GYN' },
  { id: 'psh_dnc', label: 'کورتاژ تخلیه‌ای / تشخیصی (D&C)', en: 'Dilation & Curettage (D&C)', category: 'OB/GYN' },
  { id: 'psh_tubal_ligation', label: 'بستن لوله‌ها (TL)', en: 'Tubal Ligation', category: 'OB/GYN' }
];

export const PSH_SURGICAL_PROCEDURES_BANK = MASTER_PSH_SURGERIES_BANK;

// ==========================================================================
// v0.8-Omnisearch: Family History Hereditary & Cancer Database (FH)
// ==========================================================================
export const FH_CANCER_HEREDITARY_DATABASE = [
  { id: 'fh_colorectal_cancer', label: 'کانسر کولون و رکتوم (Colorectal Cancer - CRC)', category: 'سرطان و گوارش', aliases: 'سرطان روده بزرگ کلون رکتوم پولیپ crc' },
  { id: 'fh_gastric_cancer', label: 'کانسر معده (Gastric Cancer)', category: 'سرطان و گوارش', aliases: 'سرطان معده تومور معده gastric ca' },
  { id: 'fh_esophageal_cancer', label: 'کانسر مری (Esophageal Cancer)', category: 'سرطان و گوارش', aliases: 'سرطان مری دیسفاژی بلع esophageal' },
  { id: 'fh_breast_cancer', label: 'کانسر پستان (Breast Cancer - BRCA)', category: 'سرطان و زنان', aliases: 'سرطان سینه پستان غده برکا brca breast' },
  { id: 'fh_ovarian_uterine_cancer', label: 'کانسر تخمدان یا رحم (Ovarian / Uterine Cancer)', category: 'سرطان و زنان', aliases: 'سرطان تخمدان رحم اندومتر ovarian' },
  { id: 'fh_thyroid_men_cancer', label: 'کانسر تیروئید و سندرم‌های MEN (Thyroid / MEN 2)', category: 'سرطان و غدد', aliases: 'سرطان تیروئید مدولاری من men thyroid mtc' },
  { id: 'fh_pancreatic_cancer', label: 'کانسر پانکراس یا مجاری صفراوی (Pancreatic Cancer)', category: 'سرطان و گوارش', aliases: 'سرطان لوزالمعده پانکراس صفرا pancreatic' },
  { id: 'fh_prostate_bladder_cancer', label: 'کانسر پروستات یا مثانه (Prostate / Bladder Ca)', category: 'سرطان و اورولوژی', aliases: 'سرطان پروستات مثانه هماچوری prostate bladder' },
  { id: 'fh_lung_brain_cancer', label: 'کانسر ریه یا تومور مغزی (Lung / Brain Malignancy)', category: 'سرطان عمومی', aliases: 'سرطان ریه تومور مغز گلیوما lung brain' },
  { id: 'fh_premature_cad_mi', label: 'بیماری زودرس عروق کرونر و سکته قلبی (Premature CAD / Early MI)', category: 'قلبی-عروقی', aliases: 'سکته قلبی زودرس پدر مادر جوان فنر قلب cad mi' },
  { id: 'fh_sudden_cardiac_death', label: 'مرگ ناگهانی قلبی در جوانی (Sudden Cardiac Death - SCD)', category: 'قلبی-عروقی', aliases: 'ایست قلبی ناگهانی فوت ناگهانی لانگ کیوتی scd' },
  { id: 'fh_hypertension', label: 'پرفشاری خون اساسی خانوادگی (Essential HTN)', category: 'قلبی-عروقی', aliases: 'فشار خون فامیلی ارثی htn' },
  { id: 'fh_diabetes', label: 'دیابت ملیتوس تیپ ۱ یا ۲ (Familial Diabetes Mellitus)', category: 'غدد', aliases: 'قند ارثی دیابت خانوادگی dm' },
  { id: 'fh_early_stroke', label: 'سکته مغزی در سنین پایین (Early Stroke / CVA)', category: 'اعصاب', aliases: 'سکته مغزی فلج زودرس cva stroke' },
  { id: 'fh_ibd', label: 'بیماری التهابی روده در خانواده (Familial IBD - Crohn/UC)', category: 'گوارش', aliases: 'کرون کولیت روده فامیلی ibd' },
  { id: 'fh_fap_lynch', label: 'پولیپوز ارثی یا سندرم لینچ (FAP / Lynch Syndrome)', category: 'سرطان ارثی', aliases: 'لینچ فپ پولیپوز فامیلیال lynch fap' },
  { id: 'fh_thrombophilia_dvt_pte', label: 'ترومبوفیلی ارثی و لخته مکرر (Familial DVT / PTE)', category: 'خون', aliases: 'لخته خون خانوادگی امبولی ترومبوز dvt pte' },
  { id: 'fh_gallstones_kidney_stones', label: 'سنگ کیسه صفرا یا سنگ کلیه مکرر در خانواده', category: 'گوارش و کلیه', aliases: 'سنگ صفرا سنگ کلیه فامیلی stones' },
  { id: 'fh_fmf', label: 'تب مدیترانه‌ای فامیلی (Familial Mediterranean Fever - FMF)', category: 'ژنتیک و روماتولوژی', aliases: 'اف ام اف تب روماتیسم درد شکم دوره ای fmf' },
  { id: 'fh_thalassemia_hemophilia', label: 'تالاسمی مینور/ماژور یا هموفیلی در خانواده', category: 'خون ارثی', aliases: 'تالاسمی هموفیلی فاویسم خونریزی ارثی thalassemia' }
];

// ==========================================================================
// v0.8-Omnisearch: Extended Labs Database (Over 60 Supplementary Labs)
// ==========================================================================
export const EXTENDED_LAB_DATABASE = [
  // هماتولوژی تکمیلی
  { id: 'lab_hct', label: 'Hct (Hematocrit)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '40 - 52', aliases: 'هماتوکریت غلظت خون hct' },
  { id: 'lab_mcv', label: 'MCV (Mean Corpuscular Volume)', category: 'هماتولوژی تکمیلی', unit: 'fL', normalRange: '80 - 100', aliases: 'ام سی وی حجم متوسط گلبول قرمز mcv' },
  { id: 'lab_mch', label: 'MCH', category: 'هماتولوژی تکمیلی', unit: 'pg', normalRange: '27 - 33', aliases: 'ام سی اچ mch' },
  { id: 'lab_mchc', label: 'MCHC', category: 'هماتولوژی تکمیلی', unit: 'g/dL', normalRange: '32 - 36', aliases: 'ام سی اچ سی mchc' },
  { id: 'lab_rdw', label: 'RDW (Red Cell Distribution Width)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '11.5 - 14.5', aliases: 'پراکندگی گلبول قرمز rdw' },
  { id: 'lab_neutrophils_pct', label: 'Neutrophils (%)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '50 - 70', aliases: 'نوتروفیل درصد شیفت به چپ neut' },
  { id: 'lab_lymphocytes_pct', label: 'Lymphocytes (%)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '20 - 40', aliases: 'لنفوسیت درصد lymph' },
  { id: 'lab_eosinophils_pct', label: 'Eosinophils (%)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '1 - 4', aliases: 'ائوزینوفیل حساسیت انگل eos' },
  { id: 'lab_retic', label: 'Reticulocyte Count (%)', category: 'هماتولوژی تکمیلی', unit: '%', normalRange: '0.5 - 2.5', aliases: 'رتیک رتیکولوسیت مغز استخوان retic' },

  // بیوشیمی و الکترولیت تکمیلی
  { id: 'lab_calcium', label: 'Calcium (Ca - کلسیم سرم)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '8.5 - 10.5', aliases: 'کلسیم سرم پاراتیروئید ca calcium' },
  { id: 'lab_magnesium', label: 'Magnesium (Mg - منیزیم سرم)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '1.7 - 2.4', aliases: 'منیزیم سرم mg magnesium' },
  { id: 'lab_phosphorus', label: 'Phosphorus (P - فسفر سرم)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '2.5 - 4.5', aliases: 'فسفر سرم p phosphorus' },
  { id: 'lab_uric_acid', label: 'Uric Acid (اسید اوریک)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '3.5 - 7.2', aliases: 'اسید اوریک نقرس uric acid' },
  { id: 'lab_albumin', label: 'Albumin (آلبومین سرم)', category: 'بیوشیمی و الکترولیت', unit: 'g/dL', normalRange: '3.5 - 5.2', aliases: 'البومین سرم سوءتغذیه کبد albumin' },
  { id: 'lab_total_protein', label: 'Total Protein (پروتئین توتال)', category: 'بیوشیمی و الکترولیت', unit: 'g/dL', normalRange: '6.4 - 8.3', aliases: 'پروتئین کل total protein' },
  { id: 'lab_ldh', label: 'LDH (Lactate Dehydrogenase)', category: 'بیوشیمی و الکترولیت', unit: 'U/L', normalRange: '140 - 280', aliases: 'ال دی اچ تخریب بافتی ایسکمی روده ldh' },
  { id: 'lab_cpk', label: 'CPK / CK (Creatine Kinase)', category: 'بیوشیمی و الکترولیت', unit: 'U/L', normalRange: '30 - 200', aliases: 'سی پی کی کراتین کیناز رابدومیولیز عضلانی cpk ck' },
  { id: 'lab_cholesterol', label: 'Total Cholesterol (کلسترول کل)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '< 200', aliases: 'کلسترول چربی cholesterol' },
  { id: 'lab_triglycerides', label: 'Triglycerides (TG - تری‌گلیسرید)', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '< 150', aliases: 'تری گلیسیرید تی جی tg پانکراتیت' },
  { id: 'lab_hdl', label: 'HDL Cholesterol', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '> 40', aliases: 'چربی خوب hdl' },
  { id: 'lab_ldl', label: 'LDL Cholesterol', category: 'بیوشیمی و الکترولیت', unit: 'mg/dL', normalRange: '< 100', aliases: 'چربی بد ldl' },
  { id: 'lab_ammonia', label: 'Ammonia (آمونیاک سرم)', category: 'بیوشیمی و الکترولیت', unit: 'µmol/L', normalRange: '15 - 45', aliases: 'امونیاک کبد انسفالوپاتی سیروز ammonia' },

  // قلبی، ترومبوز و سپسیس
  { id: 'lab_troponin_i', label: 'Troponin I / hs-Troponin (تروپونین)', category: 'قلبی و ترومبوز', unit: 'ng/mL', normalRange: '< 0.04', aliases: 'تروپونین ای سکته قلبی میوکاردیت troponin' },
  { id: 'lab_ck_mb', label: 'CK-MB', category: 'قلبی و ترومبوز', unit: 'ng/mL', normalRange: '< 5', aliases: 'سی کی ام بی انزیم قلبی ck mb' },
  { id: 'lab_bnp', label: 'NT-proBNP / BNP', category: 'قلبی و ترومبوز', unit: 'pg/mL', normalRange: '< 125', aliases: 'بی ان پی نارسایی قلبی bnp ntp robnp' },
  { id: 'lab_d_dimer', label: 'D-Dimer (دی‌دایمر)', category: 'قلبی و ترومبوز', unit: 'µg/mL FEU', normalRange: '< 0.5', aliases: 'دیدایمر دی دایمر لخته امبولی ریه dvt pte d dimer' },
  { id: 'lab_procalcitonin', label: 'Procalcitonin (پروکلسیتونین - PCT)', category: 'قلبی و ترومبوز', unit: 'ng/mL', normalRange: '< 0.1', aliases: 'پروکلسیتونین سپسیس عفونت شدید pct procalcitonin' },
  { id: 'lab_lactate', label: 'Lactate (اسید لاکتیک / لاکتات)', category: 'قلبی و ترومبوز', unit: 'mmol/L', normalRange: '0.5 - 2.0', aliases: 'لاکتات اسیدوز لاکتیک پرفیوژن ایسکمی مزانتر lactate' },
  { id: 'lab_fibrinogen', label: 'Fibrinogen (فیبرینوژن)', category: 'قلبی و ترومبوز', unit: 'mg/dL', normalRange: '200 - 400', aliases: 'فیبرینوژن انعقاد خون dic fibrinogen' },

  // گازهای خونی شریانی و وریدی (VBG / ABG)
  { id: 'lab_vbg_ph', label: 'pH (VBG / ABG)', category: 'گازهای خونی (VBG/ABG)', unit: '', normalRange: '7.35 - 7.45', aliases: 'پی اچ اسیدوز الکالوز گاز خون ph' },
  { id: 'lab_vbg_pco2', label: 'PCO2 (فشار دی‌اکسید کربن)', category: 'گازهای خونی (VBG/ABG)', unit: 'mmHg', normalRange: '35 - 45', aliases: 'پی سی او دو تهویه تنفسی pco2' },
  { id: 'lab_vbg_po2', label: 'PO2 (فشار اکسیژن)', category: 'گازهای خونی (VBG/ABG)', unit: 'mmHg', normalRange: '80 - 100', aliases: 'پی او دو اکسیژناسیون po2' },
  { id: 'lab_vbg_hco3', label: 'HCO3 (بی‌کربنات)', category: 'گازهای خونی (VBG/ABG)', unit: 'mEq/L', normalRange: '22 - 26', aliases: 'بیکربنات باز قلیا اسیدوز متابولیک hco3' },
  { id: 'lab_vbg_be', label: 'Base Excess (BE - باز اضافی)', category: 'گازهای خونی (VBG/ABG)', unit: 'mEq/L', normalRange: '-2 to +2', aliases: 'بیس اکسس بیس دفیسیت base excess be' },
  { id: 'lab_vbg_o2sat', label: 'O2 Saturation (اشباع اکسیژن گاز خون)', category: 'گازهای خونی (VBG/ABG)', unit: '%', normalRange: '95 - 100', aliases: 'اشباع اکسیژن وریدی شریانی o2 sat' },

  // غدد، آهن و ویتامین‌ها
  { id: 'lab_tsh', label: 'TSH (تیروئید تروپین)', category: 'غدد و ویتامین‌ها', unit: 'µIU/mL', normalRange: '0.4 - 4.5', aliases: 'تی اس اچ تیروئید کم کاری پرکاری tsh' },
  { id: 'lab_free_t4', label: 'Free T4 (تیروکسین آزاد)', category: 'غدد و ویتامین‌ها', unit: 'ng/dL', normalRange: '0.8 - 1.8', aliases: 'اف تی فور تی ۴ آزاد free t4' },
  { id: 'lab_free_t3', label: 'Free T3 (تری‌یدوتیرونین آزاد)', category: 'غدد و ویتامین‌ها', unit: 'pg/mL', normalRange: '2.3 - 4.2', aliases: 'اف تی تری تی ۳ آزاد free t3' },
  { id: 'lab_hba1c', label: 'HbA1c (هموگلوبین گلیکوزیله)', category: 'غدد و ویتامین‌ها', unit: '%', normalRange: '< 5.7', aliases: 'هموگلوبین ای وان سی قند سه ماهه hba1c a1c' },
  { id: 'lab_bhcg', label: 'β-hCG (تست بارداری بتا تیتر)', category: 'غدد و ویتامین‌ها', unit: 'mIU/mL', normalRange: '< 5 (Negative)', aliases: 'بتا بارداری حاملگی خارج رحمی حامله bhcg beta hcg' },
  { id: 'lab_ferritin', label: 'Ferritin (فریتین ذخیره آهن)', category: 'غدد و ویتامین‌ها', unit: 'ng/mL', normalRange: '30 - 300', aliases: 'فریتین اهن فقر اهن ferritin' },
  { id: 'lab_serum_iron', label: 'Serum Iron (آهن سرم)', category: 'غدد و ویتامین‌ها', unit: 'µg/dL', normalRange: '60 - 170', aliases: 'اهن سرم iron' },
  { id: 'lab_tibc', label: 'TIBC (ظرفیت تام اتصال آهن)', category: 'غدد و ویتامین‌ها', unit: 'µg/dL', normalRange: '250 - 450', aliases: 'تی ای بی سی ظرفیت اهن tibc' },
  { id: 'lab_vitamin_d3', label: '25-OH Vitamin D3', category: 'غدد و ویتامین‌ها', unit: 'ng/mL', normalRange: '30 - 100', aliases: 'ویتامین دی ۳ پوکی استخوان vit d3' },
  { id: 'lab_vitamin_b12', label: 'Vitamin B12 (کوبالامین)', category: 'غدد و ویتامین‌ها', unit: 'pg/mL', normalRange: '200 - 900', aliases: 'ویتامین ب ۱۲ ب۱۲ کم خونی b12' },
  { id: 'lab_cortisol', label: 'Serum Cortisol (کورتیزول ساعت ۸ صبح)', category: 'غدد و ویتامین‌ها', unit: 'µg/dL', normalRange: '6 - 23', aliases: 'کورتیزول ادرنال کوشینگ ادیسون cortisol' },
  { id: 'lab_pth', label: 'PTH (هورمون پاراتیروئید)', category: 'غدد و ویتامین‌ها', unit: 'pg/mL', normalRange: '15 - 65', aliases: 'پی تی اچ پاراتورمون کلسیم pth' },

  // تومورمارکرها و پاتولوژی سرولوژی
  { id: 'lab_cea', label: 'CEA (Carcinoembryonic Antigen)', category: 'تومورمارکرها', unit: 'ng/mL', normalRange: '< 3.0 (< 5 in smokers)', aliases: 'سی ای ای مارکر کانسر روده بزرگ کولورکتال معده cea' },
  { id: 'lab_ca19_9', label: 'CA 19-9 (مارکر پانکراس و صفرا)', category: 'تومورمارکرها', unit: 'U/mL', normalRange: '< 37', aliases: 'سی ای ۱۹ ۹ کانسر پانکراس لوزالمعده مجاری صفرا ca19 9' },
  { id: 'lab_afp', label: 'AFP (Alpha-Fetoprotein - آلفافتوپروتئین)', category: 'تومورمارکرها', unit: 'ng/mL', normalRange: '< 10', aliases: 'الفا فتوپروتئین سرطان کبد hcc بیضه afp' },
  { id: 'lab_ca125', label: 'CA-125 (مارکر تخمدان و پریتونئوم)', category: 'تومورمارکرها', unit: 'U/mL', normalRange: '< 35', aliases: 'سی ای ۱۲۵ سرطان تخمدان ca 125' },
  { id: 'lab_ca15_3', label: 'CA 15-3 (مارکر پستان)', category: 'تومورمارکرها', unit: 'U/mL', normalRange: '< 30', aliases: 'سی ای ۱۵ ۳ سرطان سینه پستان ca15 3' },
  { id: 'lab_psa', label: 'PSA Total (آنتی‌ژن اختصاصی پروستات)', category: 'تومورمارکرها', unit: 'ng/mL', normalRange: '< 4.0', aliases: 'پی اس ای پروستات psa total' },
  { id: 'lab_calcitonin', label: 'Calcitonin (کلسی‌تونین)', category: 'تومورمارکرها', unit: 'pg/mL', normalRange: '< 10', aliases: 'کلسیتونین سرطان مدولاری تیروئید calcitonin mtc' },
  { id: 'lab_thyroglobulin', label: 'Thyroglobulin (TG تیروگلوبولین)', category: 'تومورمارکرها', unit: 'ng/mL', normalRange: '1.4 - 78', aliases: 'تیروگلوبولین مارکر تیروئید پاپیلاری thyroglobulin tg' },

  // ویروسی و عفونی قبل عمل
  { id: 'lab_hbs_ag', label: 'HBsAg (آنتی‌ژن سطحی هپاتیت B)', category: 'ویروسی و عفونی', unit: '', normalRange: 'Negative', aliases: 'هپاتیت بی اچ بی اس hbsag hbv' },
  { id: 'lab_hcv_ab', label: 'HCV Ab (آنتی‌بادی هپاتیت C)', category: 'ویروسی و عفونی', unit: '', normalRange: 'Negative', aliases: 'هپاتیت سی hcv ab' },
  { id: 'lab_hiv_ab', label: 'HIV 1/2 Ab & p24 Ag (ایدز)', category: 'ویروسی و عفونی', unit: '', normalRange: 'Negative', aliases: 'ایدز اچ ای وی hiv' },
  { id: 'lab_wright', label: 'Wright & 2ME (تست رایت تب مالت)', category: 'ویروسی و عفونی', unit: 'Titer', normalRange: 'Negative / < 1:80', aliases: 'رایت رایت کومبس تب مالت بروسلوز wright 2me' },
  { id: 'lab_blood_culture', label: 'Blood Culture (کشت خون دو بستر)', category: 'ویروسی و عفونی', unit: '', normalRange: 'No growth', aliases: 'کشت خون باکتری سپسیس بستر blood culture' },

  // آنالیز و کشت ادرار (U/A & U/C)
  { id: 'lab_ua_wbc', label: 'U/A WBC (گلبول سفید ادرار)', category: 'آنالیز ادرار (U/A & U/C)', unit: '/HPF', normalRange: '0 - 4', aliases: 'دبلیو بی سی ادرار پیوری عفونت ادراری ua wbc' },
  { id: 'lab_ua_rbc', label: 'U/A RBC (گلبول قرمز ادرار)', category: 'آنالیز ادرار (U/A & U/C)', unit: '/HPF', normalRange: '0 - 3', aliases: 'ار بی سی ادرار هماچوری میکروسکوپی ua rbc' },
  { id: 'lab_ua_bacteria_nitrite', label: 'U/A Bacteria & Nitrite', category: 'آنالیز ادرار (U/A & U/C)', unit: '', normalRange: 'Negative', aliases: 'باکتری ادرار نیتریت عفونت مثبت ua nitrite' },
  { id: 'lab_urine_culture', label: 'Urine Culture (U/C - کشت ادرار)', category: 'آنالیز ادرار (U/A & U/C)', unit: 'CFU/mL', normalRange: 'No growth / < 10,000', aliases: 'کشت ادرار انتی بیوگرام یو سی uc urine culture' }
];

// Combine all PMH items for schema search
export const ALL_MASTER_PMH_ITEMS = [
  ...MASTER_PMH_CATEGORIES.flatMap(cat => 
    (cat.items || []).map(it => ({ ...it, category: cat.catTitle || cat.title, catId: cat.catId || cat.id }))
  ),
  ...HIDDEN_EXTENDED_PMH_DATABASE
];

// ==========================================================================
// v0.8-Omnisearch: Comprehensive 12-System Physical Examination Schema (PE)
// ==========================================================================
export const PE_COMPREHENSIVE_SYSTEMS = [
  {
    id: 'pe_sys_general',
    title: '۱. ظاهر عمومی و هوشیاری (General Appearance & Vitals)',
    isPrioritySurgical: true,
    normalBaseline: 'هوشیار، با جهت‌یابی کامل (Oriented ×3)، بدون دیسترس حاد تنفسی یا درد بارز، پرفیوژن محیطی مناسب و هیدراتاسیون نرمال.',
    items: [
      { id: 'pe_gen_conscious', label: 'سطح هوشیاری و جهت‌یابی (Oriented ×3)', aliases: 'هوشیار زمان مکان شخص gcs' },
      { id: 'pe_gen_distress', label: 'دیسترس حاد تنفسی یا درد (Acute Distress)', aliases: 'دیسترس تنگی نفس درد شدید بیقراری' },
      { id: 'pe_gen_toxic', label: 'ظاهر توکسیک یا بدحال (Toxic / Ill-appearing)', aliases: 'توکسیک بدحال سپسیس شوک' },
      { id: 'pe_gen_hydration', label: 'وضعیت هیدراتاسیون و تورگور پوستی (Hydration)', aliases: 'دهیدراتاسیون کم ابی خشکی مخاط' },
      { id: 'pe_gen_position', label: 'پوزیشن بیمار (مثلاً پوزیشن طاق‌باز، بی‌حرکت، نشسته به جلو)', aliases: 'پوزیشن بیحرکتی پریتونیت لترال' }
    ]
  },
  {
    id: 'pe_sys_abdomen_inspection',
    title: '۲-۱. مشاهده شکم (Abdominal Inspection)',
    isPrioritySurgical: true,
    normalBaseline: 'شکم متقارن، فاقد دیستانسیون بارز، بدون اسکار جراحی قبلی، بدون ایکموز یا اتساع وریدی، ناف در وضعیت طبیعی و بدون ضایعه جدار.',
    items: [
      { id: 'pe_ab_symmetry', label: 'تقارن شکم (Abdominal Symmetry)', aliases: 'تقارن شکم غیرمتقارن برجستگی یکطرفه' },
      { id: 'pe_ab_distension', label: 'اتساع یا برجستگی شکم (Distension)', aliases: 'اتساع بزرگی شکم بادکردگی نفخ distension' },
      { id: 'pe_ab_scars', label: 'اسکار جراحی قبلی (Surgical Scars - کوخر، مک‌برنی، میدلاین، لاپاراسکوپی...)', aliases: 'اسکار جای عمل برش جراحی کوخر میدلاین مک برنی' },
      { id: 'pe_ab_stoma_drain', label: 'محل استومی یا درن جراحی (Stoma / Drain Site)', aliases: 'استومی کلستومی ایلئوستومی درن ترشح' },
      { id: 'pe_ab_ecchymosis', label: 'اکیموز جدار شکم (Cullen / Grey Turner Signs)', aliases: 'کالن گری ترنر خونمردگی دور ناف پهلو پانکراتیت' }
    ]
  },
  {
    id: 'pe_sys_abdomen_auscultation',
    title: '۲-۲. سمع شکم (Abdominal Auscultation)',
    isPrioritySurgical: true,
    normalBaseline: 'صداهای روده‌ای نرمال (Normoactive Bowel Sounds: ~5–30/min)، بدون صدای متالیک یا راش روده، فاقد بروئی عروقی آئورت یا رنال.',
    items: [
      { id: 'pe_ab_bs_normal', label: 'صداهای روده‌ای نرمال (Normoactive BS)', aliases: 'صداهای روده طبیعی نرمواکتیو' },
      { id: 'pe_ab_bs_hyperactive', label: 'صداهای روده‌ای بیش‌فعال یا راش متالیک (Hyperactive / Metallic Tinkling)', aliases: 'صدای بلند روده متالیک انسداد بوربوریگموس' },
      { id: 'pe_ab_bs_hypoactive_silent', label: 'صداهای روده‌ای کاهش‌یافته یا ساکت (Hypoactive / Silent Abdomen - ایلئوس/پریتونیت)', aliases: 'سکوت شکم ایلئوس فلج روده بدون صدا' },
      { id: 'pe_ab_bruits', label: 'بروئی عروقی (Vascular Bruits - آئورت / شریان رنال)', aliases: 'برویی صدای عروقی تنگی شریان رنال انوریسم' }
    ]
  },
  {
    id: 'pe_sys_abdomen_percussion',
    title: '۲-۳. دق شکم (Abdominal Percussion)',
    isPrioritySurgical: true,
    normalBaseline: 'تیمپانیسم عمومی نرمال در تمامی رباع‌ها، فاقد ماتیته جابه‌جاشونده (No Shifting Dullness)، تندرنس دق منفی و فاقد CVA Tenderness.',
    items: [
      { id: 'pe_ab_tympany', label: 'تیمپانیسم طبیعی شکم (Normal Tympany)', aliases: 'تیمپان دق طبل مانند نرمال' },
      { id: 'pe_ab_shifting_dullness', label: 'ماتیته جابه‌جاشونده / آسیت (Shifting Dullness / Fluid Wave)', aliases: 'شیفتینگ دالنس اسیت مایع شکم موج اب' },
      { id: 'pe_ab_hyperresonance', label: 'هایپررزونانس ناشی از گاز شدید (Hyperresonance)', aliases: 'رزونانس گاز شدید انسداد ولولوس' },
      { id: 'pe_ab_percussion_tenderness', label: 'تندرنس حین دق (Percussion Tenderness - نشانه پریتونیت)', aliases: 'درد با دق پریتونیت تحریک صفاق' },
      { id: 'pe_ab_cva_tenderness', label: 'تندرنس زاویه دنده‌ای-مهره‌ای (CVA Tenderness - پیلونفریت/سنگ کلیه)', aliases: 'سی وی ای تندرنس پهلو کلیه کوستوورتب رال' }
    ]
  },
  {
    id: 'pe_sys_abdomen_palpation',
    title: '۲-۴. لمس شکم و مانورهای جراحی (Palpation & Surgical Signs)',
    isPrioritySurgical: true,
    normalBaseline: 'شکم نرم، فاقد تندرنس سطحی یا عمقی، ریباند منفی، بدون گاردینگ ارادی یا غیرارادی (No Guarding/Rigidity)، علائم مورفی و مک‌برنی منفی، بدون توده قابل لمس یا فتق جدار.',
    items: [
      { id: 'pe_ab_soft_nontender', label: 'شکم کاملاً نرم و بدون درد (Soft & Non-tender)', aliases: 'نرم بدون درد نرمال' },
      { id: 'pe_ab_tenderness', label: 'تندرنس موضعی یا منتشر (Tenderness: RLQ, RUQ, LLQ, LUQ, Epigastric, Suprapubic)', aliases: 'تندرنس درد با لمس درد ربع تحتانی راست اپی گاستر' },
      { id: 'pe_ab_rebound', label: 'ریباند تندرنس (Rebound Tenderness - بلومبرگ)', aliases: 'ریباند برداشتن ناگهانی دست پریتونیت بلومبرگ' },
      { id: 'pe_ab_guarding_rigidity', label: 'گاردینگ عضلانی یا شکم تخته‌ای (Guarding / Involuntary Rigidity)', aliases: 'گاردینگ سفتی شکم تخته ای ریجیدیتی انقباض عضلانی' },
      { id: 'pe_ab_murphy', label: 'علامت مورفی مثبت (Murphy’s Sign - کوله‌سیستیت حاد)', aliases: 'مورفی درد کیسه صفرا دم عمیق کوله سیستیت' },
      { id: 'pe_ab_mcburney_rovsing', label: 'نقطه مک‌برنی و علامت روزینگ (McBurney / Rovsing Signs - آپاندیسیت)', aliases: 'مک برنی روزینگ درد با فشار چپ اپاندیسیت' },
      { id: 'pe_ab_psoas_obturator', label: 'علائم پسواس و ابتوراتور (Psoas & Obturator Signs)', aliases: 'پسواس ابتوراتور کشش ران درد لگنی' },
      { id: 'pe_ab_palpable_mass', label: 'توده یا پلاسترون قابل لمس (Palpable Mass / Plastron)', aliases: 'توده قابل لمس ابسه پلاسترون تومور' },
      { id: 'pe_ab_organomegaly', label: 'هپاتومگالی یا اسپلنومگالی (Hepatomegaly / Splenomegaly)', aliases: 'بزرگی کبد بزرگی طحال لبه کبد ارگانومگالی' },
      { id: 'pe_ab_hernia_orifices', label: 'فتق نافی، اینگوئینال یا فمورال (Hernia Orifices)', aliases: 'فتق ناف هرنی اینگوینال فمورال هرنی اینسیژنال' }
    ]
  },
  {
    id: 'pe_sys_heent',
    title: '۴. سر، چشم، گوش، حلق و گردن و تیروئید (HEENT & Neck/Thyroid)',
    normalBaseline: 'سر نرموسفال بدون تروما، ملتحمه فاقد رنگ‌پریدگی، اسکلرا آنیکتریک، مردمک‌ها متقارن و واکنش به نور طبیعی (PERRLA)، مخاط دهان مرطوب، بدون دیستنشن ورید ژوگولار (No JVD)، تراشه در خط وسط، تیروئید بدون بزرگی، ندول یا تندرنس، فاقد لنفادنوپاتی سرویکال یا سوپراکلاویکولار.',
    items: [
      { id: 'pe_heent_normocephalic', label: 'سر نرموسفال و بدون دفورمیتی یا هماتوم', aliases: 'نرموسفال سر بدون ضربه' },
      { id: 'pe_heent_conjunctiva', label: 'ملتحمه صورتی / رنگ‌پریده (Pale Conjunctiva - کم‌خونی)', aliases: 'ملتحمه کم خونی رنگ پریده pale' },
      { id: 'pe_heent_sclera', label: 'اسکلرا زرد / ایکتریک (Scleral Icterus - یرقان)', aliases: 'اسکلرا زردی چشم ایکتریک icterus' },
      { id: 'pe_heent_pupils', label: 'مردمک‌ها متقارن و واکنشی به نور (PERRLA)', aliases: 'مردمک پاسخ به نور انیزوکوریا perrla' },
      { id: 'pe_heent_mucosa', label: 'مخاط دهان و زبان مرطوب و بدون ضایعه', aliases: 'مخاط دهان زبان افت خشکی' },
      { id: 'pe_heent_jvd', label: 'برجستگی ورید ژوگولار (JVD / Elevated JVP)', aliases: 'جی وی دی ورید ژوگولار پرفشاری ورید مرکزی' },
      { id: 'pe_heent_trachea', label: 'تراشه در خط وسط (Midline Trachea)', aliases: 'تراشه انحراف نای پنوموتوراکس' },
      { id: 'pe_heent_thyroid', label: 'معاینه تیروئید: بزرگی، ندول، قوام، حرکت با بلع', aliases: 'تیروئید گواتر ندول گردن لمس تیروئید بلع' },
      { id: 'pe_heent_lymph', label: 'لنفادنوپاتی گردنی یا سوپراکلاویکولار (Cervical / Virchow LN)', aliases: 'غده لنفاوی گردن ویرشو سوپراکلاویکولار' }
    ]
  },
  {
    id: 'pe_sys_thorax_respiratory',
    title: '۵. قفسه سینه و دستگاه تنفسی (Thorax & Respiratory)',
    normalBaseline: 'قفسه سینه متقارن، حرکات تنفسی دوطرفه مناسب بدون رترکشن اینترکوستال، دق ریه‌ها در تمام فیلدها رزونانت، سمع ریه دوطرفه پاک با صداهای وزیکولار طبیعی، فاقد رال (Crackles)، ویزینگ یا استریدور.',
    items: [
      { id: 'pe_resp_expansion', label: 'تقارن و اتساع دیواره قفسه سینه (Chest Expansion)', aliases: 'تقارن قفسه سینه حرکات تنفسی' },
      { id: 'pe_resp_fremitus', label: 'فرمتوس لمسی (Tactile Fremitus)', aliases: 'فرمتوس لمسی لرزش صوتی fremitus' },
      { id: 'pe_resp_percussion', label: 'دق ریه: رزونانس طبیعی / ماتیته (افیوژن) / هایپررزونانس (پنوموتوراکس)', aliases: 'دق ریه مات ماتیته افیوژن هایپررزونانس' },
      { id: 'pe_resp_vesicular', label: 'صداهای وزیکولار طبیعی دوطرفه (Clear Vesicular Sounds)', aliases: 'سمع ریه پاک وزیکولار طبیعی' },
      { id: 'pe_resp_crackles', label: 'کراکل / رال در سمع قاعده ریه‌ها (Crackles / Rales - ادم/پنومونی)', aliases: 'رال کراکل صدای ترشح پنومونی ادم ریه' },
      { id: 'pe_resp_wheezing', label: 'ویزینگ یا رونکای منتشر/موضعی (Wheezing / Rhonchi)', aliases: 'ویزینگ صدای سوت ریه اسم اسپاسم برونش' },
      { id: 'pe_resp_stridor', label: 'استریدور راه هوایی فوقانی (Inspiratory Stridor)', aliases: 'استریدور انسداد حنجره خروسک' }
    ]
  },
  {
    id: 'pe_sys_cardiovascular',
    title: '۶. قلب و عروق محیطی (Cardiovascular & Peripheral Vascular)',
    normalBaseline: 'لمس PMI در فضای بین‌دنده‌ای پنجم خط میدکلاویکولار، صدای S1 و S2 نرمال و منظم، بدون سوفل قلبی سیستولیک یا دیاستولیک، فاقد گالوپ S3/S4، نبض‌های محیطی (رادیال، دورسالیس پدیس، تیبیالیس خلفی) دوطرفه پر و قرینه (2+)، پرشدگی مویرگی کمتر از ۲ ثانیه، بدون ادم گوده‌گذار و شواهد DVT منفی.',
    items: [
      { id: 'pe_cv_pmi', label: 'محل و شدت لمس ضربه نوک قلب (PMI)', aliases: 'پ ام ای ضربه اپکس نوک قلب pmi' },
      { id: 'pe_cv_s1_s2', label: 'صداهای قلبی S1 و S2 طبیعی و ریتمیک', aliases: 'صدای اول و دوم قلب ریتم منظم' },
      { id: 'pe_cv_gallop', label: 'صداهای اضافه گالوپ S3 یا S4 (Gallop Rhythm)', aliases: 'گالوپ اس سه اس چهار نارسایی قلب' },
      { id: 'pe_cv_murmur', label: 'سوفل قلبی: سیستولیک/دیاستولیک، گرید و کانون سمع', aliases: 'سوفل صدای اضافی دریچه تنگی میترال ائورت' },
      { id: 'pe_cv_pulses', label: 'نبض‌های محیطی قرینه و پر (Peripheral Pulses: Radial, Femoral, DP, PT 2+)', aliases: 'نبض پا نبض مچ دست دورسالیس پدیس تیبیال رادیال' },
      { id: 'pe_cv_crt', label: 'پرشدگی مویرگی (Capillary Refill Time < 2 sec)', aliases: 'پرشدگی مویرگی crt ناخن پرفیوژن' },
      { id: 'pe_cv_edema', label: 'ادم گوده‌گذار اندام تحتانی (Pitting Edema 1+ to 4+)', aliases: 'ورم پا ادم گوده گذار قوزک پا pitting' },
      { id: 'pe_cv_dvt_signs', label: 'شواهد ترومبوز ورید عمقی (DVT Signs - تورم/گرمی/تندرنس ساق، علامت هومانز)', aliases: 'دی وی تی لخته پا تورم یکطرفه گرمی ساق هومانز' }
    ]
  },
  {
    id: 'pe_sys_breast_axillae',
    title: '۷. پستان و آگزیلا (Breast & Axillae Exam)',
    normalBaseline: 'پستان‌ها دوطرفه متقارن، فاقد فرورفتگی پوست یا نمای پوست‌پرتقالی (No Dimpling/Peau d’orange)، نیپل‌ها سالم بدون انحراف یا ترشح، لمس هر چهار ربع و دم اسپنس فاقد هرگونه توده، ندولاریته غالب یا تندرنس، لنفادنوپاتی آگزیلاری لمس نمی‌شود.',
    items: [
      { id: 'pe_br_symmetry', label: 'تقارن و کانتور دو پستان (Symmetry & Contour)', aliases: 'تقارن سینه ها برجستگی تغییر شکل' },
      { id: 'pe_br_skin', label: 'تغییرات پوستی (Dimpling, Erythema, Peau d’orange)', aliases: 'پوست پرتقالی کشیدگی پوست قرمزی پستان' },
      { id: 'pe_br_nipple', label: 'وضعیت نیپل و ترشح (Nipple Retraction / Discharge)', aliases: 'فرو رفتگی نیپل ترشح خونی سروزی نوک سینه' },
      { id: 'pe_br_palpation', label: 'لمس ربع‌های پستان و دم اسپنس (توده، ساعت، ابعاد، قوام، تحرک)', aliases: 'توده پستان ساعت ابعاد قوام متحرک ثابت' },
      { id: 'pe_br_axillary_ln', label: 'لنفادنوپاتی آگزیلاری (Axillary Lymphadenopathy)', aliases: 'غده لنفاوی زیربغل اگزیلا لمس غده' }
    ]
  },
  {
    id: 'pe_sys_anorectal_gu',
    title: '۸. معاینه رکتال و ادراری-تناسلی (Anorectal / DRE & GU)',
    normalBaseline: 'مشاهده پری‌آنال طبیعی بدون فیشر، شقاق، فیستول، هموروئید ترومبوزه یا آبسه، تون اسفنکتر مقعد طبیعی، لمس جدار کانال آنال و رکتوم فاقد توده یا خون، پروستات با ابعاد نرمال و فاقد ندول سفت، نمونه مدفوع روی دستکش با رنگ طبیعی، معاینه ژنیتالیا نرمال.',
    items: [
      { id: 'pe_re_inspection', label: 'مشاهده پری‌آنال: فیشر، فیستول، هموروئید خارجی، آبسه، سینوس پیلونیدال', aliases: 'مشاهده مقعد فیشر شقاق بواسیر هموروئید ابسه' },
      { id: 'pe_re_tone', label: 'تون اسفنکتر مقعد (Sphincter Tone - نرمال / کاهش‌یافته)', aliases: 'تون اسفنکتر شلی بی اختیاری' },
      { id: 'pe_re_walls', label: 'لمس دیواره‌های رکتوم: توده، پولیپ، فاصله از Anal Verge', aliases: 'توده رکتوم لمس رکتال توش رکتال dre' },
      { id: 'pe_re_prostate', label: 'معاینه پروستات (Prostate: سایز، شیار میانی، قوام، ندول سفت)', aliases: 'پروستات بزرگی پروستات ندول سفت شیار میانی' },
      { id: 'pe_re_stool_glove', label: 'نمونه مدفوع روی دستکش: طبیعی / ملنا / خون روشن / آمپول خالی', aliases: 'نمونه دستکش مدفوع ملنا خون روشن رکتوم خالی' },
      { id: 'pe_gu_scrotum_testes', label: 'معاینه بیضه‌ها و اسکروتوم (تورشن، اپیدیدیمیت، هیدروسل، واریکوسل)', aliases: 'بیضه اسکروتوم تورشن پیچش هیدروسل واریکوسل' }
    ]
  },
  {
    id: 'pe_sys_neurological',
    title: '۹. معاینه عصبی تخصصی (Comprehensive Neurological Exam)',
    normalBaseline: 'هوشیاری کامل (GCS 15/15, Oriented ×3)، اعصاب کرانیال II تا XII سالم و قرینه (به‌ویژه عدم فلج فاسیال یا خشونت صدا)، قدرت عضلانی هر چهار اندام کامل (Motor Power 5/5)، حس لمس سطحی و درد دوطرفه قرینه، رفلکس‌های تاندونی عمقی نرمال (DTR 2+)، علامت بابنسکی منفی (پلانتار فلکسور دوطرفه)، بدون علائم تحریک مننژ (گردن نرم، بدون کرنیگ/برودزینسکی).',
    items: [
      { id: 'pe_neuro_gcs', label: 'سطح هوشیاری و امتیاز GCS (E4V5M6 = 15/15)', aliases: 'جی سی اس گلاسکو سطح هوشیاری gcs' },
      { id: 'pe_neuro_cranial_nerves', label: 'اعصاب کرانیال (CN I–XII - عصب فاسیال VII، راجعه حنجره، منتال)', aliases: 'اعصاب کرانیال زوج های مغزی فاسیال راجعه عصب صورت' },
      { id: 'pe_neuro_motor', label: 'قدرت عضلانی اندام‌های فوقانی و تحتانی (Motor Power 5/5)', aliases: 'قدرت عضلانی پارزی همی پلژی فلج نیرو اندام' },
      { id: 'pe_neuro_sensory', label: 'حس لمس، درد و حس وضعیت (Sensory Exam)', aliases: 'حس لمس درد گزگز نوروپاتی حسی' },
      { id: 'pe_neuro_dtr', label: 'رفلکس‌های تاندونی عمقی (DTR 2+ قرینه)', aliases: 'رفلکس تاندونی پاتلار اشیل بای سپس dtr' },
      { id: 'pe_neuro_babinski', label: 'علامت بابنسکی / رفلکس پلانتار (Babinski Sign - اکستنسور / فلکسور)', aliases: 'بابنسکی پلانتار رفلکس انگشت شست' },
      { id: 'pe_neuro_cerebellar', label: 'تست‌های مخچه‌ای و تعادل (Finger-to-Nose, Romberg, Gait)', aliases: 'تست تعادل رامبرگ انگشت به بینی راه رفتن آتاکسی' },
      { id: 'pe_neuro_meningeal', label: 'علائم تحریک مننژ (سفتی گردن، نشانه کرنیگ، نشانه برودزینسکی)', aliases: 'سفتی گردن کرنیگ برودزینسکی مننژیت تحریک صفاق' }
    ]
  },
  {
    id: 'pe_sys_msk_spine',
    title: '۱۰. معاینه عضلانی-اسکلتی و ستون فقرات (Musculoskeletal & Spine)',
    normalBaseline: 'دامنه حرکتی مفاصل محیطی و ستون فقرات کامل و بدون درد (Full ROM)، فاقد تورم، افیوژن یا اریتم مفصلی، بدون دفورمیتی یا کوتاهی اندام، تندرنس خط وسط مهره‌ها منفی، تست SLR دوطرفه منفی.',
    items: [
      { id: 'pe_msk_rom', label: 'دامنه حرکتی کامل مفاصل بدون درد (Full ROM)', aliases: 'دامنه حرکتی مفصل زانو شانه ران rom' },
      { id: 'pe_msk_swelling', label: 'تورم، افیوژن یا گرمی مفاصل (Joint Swelling / Effusion)', aliases: 'ورم مفصل اب اوردن زانو افیوژن ارتریت' },
      { id: 'pe_msk_deformity', label: 'دفورمیتی، شکستگی مشکوک یا کوتاهی اندام (Deformity / Shortening)', aliases: 'دفورمیتی بدشکلی شکستگی استخوان کوتاهی پا' },
      { id: 'pe_msk_spine_tenderness', label: 'تندرنس مهره‌ای یا پاراورتبرال (Spine Tenderness)', aliases: 'درد مهره ستون فقرات تندرنس کمری گردنی' },
      { id: 'pe_msk_slr', label: 'تست بالا آوردن پای مستقیم (Straight Leg Raise - SLR Test)', aliases: 'اس ال ار سیاتیک دیسک کمر slr' }
    ]
  }
];
