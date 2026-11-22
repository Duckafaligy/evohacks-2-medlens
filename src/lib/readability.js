// Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59

// Abbreviations are read letter by letter ("BID" = B-I-D = 3 syllables, "mg" = 2).
const isAbbrev = (w) => (w.length >= 2 && w.length <= 5 && w === w.toUpperCase() && /[A-Z]/.test(w)) || !/[aeiouy]/i.test(w);

export function syllables(word) {
  const raw = word.replace(/[^A-Za-z0-9]/g, '');
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Math.min(raw.length + 1, 4); // "25" ~ twenty-five
  if (/\d/.test(raw) || isAbbrev(raw)) return raw.replace(/\d/g, '').length || 1; // q8h, BID, mg
  let w = raw.toLowerCase();
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]) // silent endings
    .replace(/^y/, '');
  return w.match(/[aeiouy]+/g)?.length || 1;
}

/** fkGrade(text) -> grade level (number, 1 decimal). Each line or .!? ends a sentence. */
export function fkGrade(text) {
  const sentences = (text || '').split(/[.!?]+(?=\s|$)|\n+/).map((s) => s.trim()).filter((s) => /[A-Za-z0-9]/.test(s));
  const words = sentences.flatMap((s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)));
  if (!words.length) return 0;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (syl / words.length) - 15.59;
  return Math.round(grade * 10) / 10;
}
