import { FileText, ScanSearch } from 'lucide-react';
import { Modal } from '../components/ui.jsx';
import { GithubIcon } from '../components/SiteNav.jsx';
import { GITHUB, DOCS, YOUTUBE, DEVPOST, OPENFDA, PHOTO_CREDIT } from '../data/links.js';
import { scrollToSection } from './scroll.js';

const YoutubeIcon = ({ className = 'size-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);

const LEGAL = {
  privacy: ['Privacy', [
    'MedLens keeps your medicine list in your browser on this device. We do not sell or share it.',
    'Label photos are read on your device. Only medicine names are sent to the U.S. FDA’s openFDA service to look up label text.',
    'If you create an account, your list is stored with our database provider so only you can see it. You can sign out or remove medicines at any time.',
    'We do not use advertising or tracking cookies.',
  ]],
  terms: ['Terms', [
    'MedLens is a free student project built for EvoHacks II. It is provided as is, without warranty of any kind.',
    'Use it to understand your medicines, not to make treatment decisions on your own. Do not use it in an emergency.',
    'Drug label text comes from openFDA and belongs to its publishers. Photos are used under the Unsplash License.',
  ]],
  disclaimer: ['Disclaimer', [
    'MedLens is an educational aid. It is not medical advice and does not replace your pharmacist, nurse or doctor.',
    'Plain-language text and interaction alerts can be incomplete or wrong. Always follow the instructions from your care team and the label on your medicine.',
    'In an emergency, call 911 or your local emergency number.',
  ]],
};

export function LegalModal({ page, onClose }) {
  const doc = LEGAL[page];
  return (
    <Modal open={!!doc} onClose={onClose} title={doc?.[0] || ''}>
      <div className="space-y-3 text-ink-2">{doc?.[1].map((p) => <p key={p}>{p}</p>)}</div>
      <p className="mt-4 text-small text-ink-2">Last updated November 2026.</p>
    </Modal>
  );
}

const ext = { target: '_blank', rel: 'noopener noreferrer' };
const linkCls = 'inline-flex items-center gap-2 text-white/75 hover:text-white';

export default function SiteFooter() {
  const project = [
    [GITHUB, 'GitHub repo', GithubIcon],
    [DOCS, 'Project docs', FileText],
    [YOUTUBE, 'Demo video', YoutubeIcon],
    [DEVPOST, 'Devpost', FileText],
  ].filter(([url]) => url);
  return (
    <footer className="grad-ink px-4 pb-10 pt-16 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <span className="flex items-center gap-2.5 text-h3 font-semibold"><span className="grid size-9 place-items-center rounded-md bg-white text-primary" aria-hidden="true"><ScanSearch className="size-5" /></span>MedLens</span>
            <p className="mt-3 max-w-xs text-small text-white/75">Prescriptions in plain words, for seniors, caregivers and parents.</p>
            <a href="#/app/today" className="mt-5 inline-flex h-11 items-center rounded-md bg-white px-4 text-small font-semibold text-ink hover:bg-white/90">Open MedLens</a>
          </div>
          <nav aria-label="Product">
            <h2 className="text-small font-semibold">Product</h2>
            <ul className="mt-3 space-y-2 text-small">
              {[['today', 'Open app'], ['scan', 'Scan'], ['today', 'Today'], ['calendar', 'Calendar'], ['safety', 'Safety']].map(([v, l]) => (
                <li key={l}><a className={linkCls} href={`#/app/${v}`}>{l}</a></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Project">
            <h2 className="text-small font-semibold">Project</h2>
            <ul className="mt-3 space-y-2 text-small">
              {project.map(([url, l, Icon]) => <li key={l}><a className={linkCls} href={url} {...ext}><Icon className="size-4" aria-hidden="true" />{l}</a></li>)}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <h2 className="text-small font-semibold">Resources</h2>
            <ul className="mt-3 space-y-2 text-small">
              <li><a className={linkCls} href={OPENFDA} {...ext}>openFDA</a></li>
              <li><a className={linkCls} href="#/app/translate">Medical words A–Z</a></li>
              <li><button type="button" className={linkCls} onClick={() => scrollToSection('faq')}>FAQ</button></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2 className="text-small font-semibold">Legal</h2>
            <ul className="mt-3 space-y-2 text-small">
              {Object.entries(LEGAL).map(([k, [l]]) => <li key={k}><a className={linkCls} href={`#/legal/${k}`}>{l}</a></li>)}
            </ul>
          </nav>
        </div>
        <div className="mt-12 space-y-1 border-t border-white/15 pt-6 text-[13px] text-white/60">
          <p>Educational aid. Not medical advice. Always check with your pharmacist or doctor.</p>
          <p>Drug data: openFDA (U.S. FDA). {PHOTO_CREDIT}.</p>
          <p>© 2026 MedLens · Built for EvoHacks II</p>
        </div>
      </div>
    </footer>
  );
}
