/**
 * Fuzzy, Phonetic & Typo-Tolerant Clinical Search Engine - Surg-Scribe v0.8-Omnisearch
 * Handles Persian/English normalization, phonetic skeletons, and Damerau-Levenshtein edit distance.
 */

/**
 * نرمال‌سازی عمیق و ساخت اسکلت آوایی فارسی برای تطبیق کلماتی مثل «کتورولاک» و «کترولاک»
 */
export function normalizeTextForSearch(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[يئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ') // حذف نیم‌فاصله
    .replace(/[\u064B-\u065F]/g, '') // حذف اعراب
    .replace(/[^a-z0-9آ-ی\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildPhoneticSkeleton(str) {
  const norm = normalizeTextForSearch(str);
  return norm
    .replace(/[صث]/g, 'س')
    .replace(/[ذضظ]/g, 'ز')
    .replace(/ط/g, 'ت')
    .replace(/ح/g, 'ه')
    .replace(/غ/g, 'ق')
    .replace(/(?<!^)[وا](?!$)/g, '') // حذف «و» و «ا» میانی برای یکسان شدن کتورولاک/کترولاک و فوروزماید/فروزماید
    .replace(/(.)\1+/g, '$1'); // حذف تکرار حروف
}

/**
 * محاسبه فاصله ویرایشی Damerau-Levenshtein برای تحمل غلط املایی کیبورد (مثلاً آشپرین به جای آسپرین)
 */
export function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // حذف
        matrix[i][j - 1] + 1,      // درج
        matrix[i - 1][j - 1] + cost // جایگزینی (مثل ش به جای س در آشپرین)
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost); // جابه‌جایی دو حرف مجاور
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * موتور جستجوی هوشمند با امتیازدهی (Exact > Phonetic > Fuzzy Typo-Tolerant)
 */
export function smartClinicalSearch(query, dataset, limit = 25) {
  const cleanQ = normalizeTextForSearch(query);
  if (!cleanQ) return [];
  const skelQ = buildPhoneticSkeleton(cleanQ);
  const queryTokens = cleanQ.split(' ').filter(Boolean);

  const scoredResults = [];

  for (const item of dataset) {
    // تجمیع عنوان اصلی + نام انگلیسی + نام تجاری + تگ‌های مخفی (aliases)
    const rawHaystack = [
      item.label || '',
      item.name || '',
      item.en || '',
      item.brands || '',
      item.aliases || '',
      item.keywords || '',
      item.category || ''
    ].join(' ');

    const normHaystack = normalizeTextForSearch(rawHaystack);
    const skelHaystack = buildPhoneticSkeleton(rawHaystack);
    const words = normHaystack.split(' ').filter((w) => w.length >= 2);
    const skelWords = skelHaystack.split(' ').filter((w) => w.length >= 2);

    let totalScore = 0;
    let matchedAllTokens = true;

    for (const token of queryTokens) {
      const tokenSkel = buildPhoneticSkeleton(token);
      let bestTokenScore = 0;

      // 1. تطبیق مستقیم زیررشته (برای تمام کلمات از جمله کلمات کوتاه کمتر از ۴ حرف)
      if (normHaystack.includes(token)) {
        bestTokenScore = normHaystack.startsWith(token) ? 100 : 85;
      }
      // برای کلمات کوتاه کمتر از ۴ حرف (مثل «زرد»)، فقط تطبیق زیررشته مجاز است تا «درد» یا «سرد» نیایند
      else if (token.length >= 4) {
        // 2. تطبیق اسکلت آوایی (مثلاً کترولاک == کتورولاک) با الزام یکسان بودن حرف اول
        if (tokenSkel.length >= 3 && skelHaystack.includes(tokenSkel) && words.some((w) => w[0] === token[0])) {
          bestTokenScore = 75;
        }
        // 3. تطبیق فازی ضدِ غلط املایی با شرط قطعی یکسان بودن حرف اول (w[0] === token[0])
        else {
          const maxAllowedDist = token.length >= 6 ? 2 : 1;
          for (const w of words) {
            if (w[0] !== token[0]) continue;
            const prefixW = w.slice(0, Math.min(w.length, token.length + 1));
            const dist = editDistance(token, prefixW);
            if (dist <= maxAllowedDist) {
              bestTokenScore = Math.max(bestTokenScore, 60 - dist * 15);
            }
          }
          // بررسی فاصله ویرایشی روی اسکلت آوایی برای کلمات بلند
          if (bestTokenScore === 0 && tokenSkel.length >= 4) {
            for (const sw of skelWords) {
              if (sw[0] !== tokenSkel[0]) continue;
              const prefixSw = sw.slice(0, Math.min(sw.length, tokenSkel.length + 1));
              const dist = editDistance(tokenSkel, prefixSw);
              if (dist <= 1) {
                bestTokenScore = Math.max(bestTokenScore, 50);
              }
            }
          }
        }
      }

      if (bestTokenScore === 0) {
        matchedAllTokens = false;
        break;
      }
      totalScore += bestTokenScore;
    }

    if (matchedAllTokens && totalScore > 0) {
      scoredResults.push({ item, score: totalScore });
    }
  }

  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
