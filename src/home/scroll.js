export const SECTIONS = [['how', 'How it works'], ['features', 'Features'], ['who', 'Who it’s for'], ['faq', 'FAQ']];

/** Scroll to a homepage section without touching the #/ route. */
export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: reduce ? 'auto' : 'smooth' });
}
