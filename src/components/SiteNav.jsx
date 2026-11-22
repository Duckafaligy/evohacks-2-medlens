import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { GITHUB } from '../data/links.js';
import { SECTIONS, scrollToSection } from '../home/scroll.js';

export const GithubIcon = ({ className = 'size-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22" />
  </svg>
);

/** Paper logo mark (magnifier + plus) on a cobalt tile. */
export const LogoMark = ({ size = 30 }) => (
  <span className="grid shrink-0 place-items-center rounded-[8px] bg-primary" style={{ width: size, height: size }} aria-hidden="true">
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 44 44">
      <circle cx="19" cy="19" r="13" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M28.5 28.5L38 38" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M19 13v12M13 19h12" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  </span>
);

/**
 * Homepage island nav — Paper "Island nav" (2NT-0) at the top, "Nav · scrolled" (1O4-0) after scrolling.
 * A blurred full-width backing appears on scroll so page content never shows around the island.
 */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = (id) => { setOpen(false); scrollToSection(id); };

  return (
    <div className={`fixed inset-x-0 top-0 z-40 px-4 pb-3 pt-4 transition-[background-color,backdrop-filter] duration-300 ${
      scrolled ? 'bg-white/75 backdrop-blur-md' : 'bg-transparent'}`}>
      <nav aria-label="Homepage"
        className={`mx-auto flex h-16 items-center rounded-[14px] border border-line bg-surface pl-5 pr-3 transition-[max-width,box-shadow] duration-300 ease-[var(--ease-calm)] ${
          scrolled ? 'max-w-[920px] shadow-[0_8px_24px_#0F1B2D14]' : 'max-w-[1152px] shadow-[0_4px_16px_#0F1B2D0D]'}`}>
        <div className="flex flex-1 items-center">
          <a href="#/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2" aria-label="MedLens home">
            <LogoMark />
            <span className="text-[19px] font-semibold leading-6 tracking-[-0.02em] text-black">MedLens</span>
          </a>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {SECTIONS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => go(id)}
              className="relative py-2 text-[16px] leading-5 text-[#2A3547] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[1.5px] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-black hover:after:scale-x-100">
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-3.5">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" className="hidden rounded-md p-1 text-ink-2 transition-colors hover:text-black sm:block"><GithubIcon className="size-[22px]" /></a>
          <a href="#/app/today" className="inline-flex h-11 items-center rounded-[10px] bg-primary px-[18px] text-[16px] font-semibold leading-5 text-white transition-colors hover:bg-[#143d8f]">
            <span className="hidden sm:inline">Open MedLens</span><span className="sm:hidden">Open</span>
          </a>
          <button type="button" className="rounded-md p-2 text-ink md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="pop mx-auto mt-2 max-w-[1152px] rounded-[14px] border border-line bg-surface p-2 shadow-[0_8px_24px_#0F1B2D14] md:hidden">
          {SECTIONS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => go(id)} className="block w-full rounded-[10px] px-4 py-3 text-left text-[17px] text-black hover:bg-canvas">{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
