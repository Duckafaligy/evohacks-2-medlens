import { useEffect, useState } from 'react';
import { Logo } from './ui.jsx';
import { GITHUB } from '../data/links.js';
import { SECTIONS, scrollToSection } from '../home/scroll.js';

export const GithubIcon = ({ className = 'size-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
  </svg>
);

/** Homepage island nav: full-width at the top, tightens into a floating rounded bar on scroll. */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => { window.removeEventListener('scroll', on); io.disconnect(); };
  }, []);

  return (
    <div className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-[var(--ease-calm)] ${scrolled ? 'px-3 pt-3' : 'px-0 pt-0'}`}>
      <nav aria-label="Homepage"
        className={`mx-auto flex items-center justify-between gap-4 border transition-all duration-300 ease-[var(--ease-calm)] ${
          scrolled ? 'h-14 max-w-4xl rounded-lg border-line bg-surface/90 px-4 shadow-lg backdrop-blur-md' : 'h-16 max-w-6xl border-transparent bg-transparent px-4 md:px-6'}`}>
        <a href="#/" aria-label="MedLens home" onClick={() => window.scrollTo({ top: 0 })}><Logo className={scrolled ? 'text-lead' : ''} /></a>
        <div className="hidden items-center gap-1 md:flex">
          {SECTIONS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => scrollToSection(id)} aria-current={active === id ? 'true' : undefined}
              className={`rounded-md px-3 py-2 text-small transition-colors ${active === id ? 'bg-primary-soft font-semibold text-primary' : 'text-ink-2 hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" className="hidden rounded-md p-2 text-ink-2 hover:bg-canvas sm:block"><GithubIcon /></a>
          <a href="#/app/today" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-small font-semibold text-white hover:bg-primary/90">Open MedLens</a>
        </div>
      </nav>
    </div>
  );
}
