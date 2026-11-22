import { Modal } from '../components/ui.jsx';
import { GITHUB, DOCS, YOUTUBE, DEVPOST, OPENFDA } from '../data/links.js';
import { scrollToSection } from './scroll.js';

/* Footer ported from Paper "MedLens" › Homepage · Desktop › Footer (30Q-0) and Mobile (3OH-0). */
const Icon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
    {d.map((p) => <path key={p} d={p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>
);
const ICONS = {
  github: ['M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22'],
  doc: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6M16 13H8M16 17H8'],
  video: ['M22.5 6.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.6 2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.6z', 'M10 15l5-3-5-3z'],
  link: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
};

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
const linkCls = 'inline-flex items-center gap-2 text-[#C9D2E0] transition-colors hover:text-white';
const Col = ({ title, children }) => (
  <nav aria-label={title} className="flex flex-col gap-2.5 md:flex-1 md:gap-3">
    <h2 className="pb-1 font-semibold text-white">{title}</h2>
    <ul className="flex flex-col gap-2.5 md:gap-3 [&>li]:flex">{children}</ul>
  </nav>
);

export default function SiteFooter() {
  const project = [
    [GITHUB, 'GitHub repo', 'github'],
    [DOCS, 'Project docs', 'doc'],
    [YOUTUBE, 'Demo video', 'video'],
    [DEVPOST, 'Devpost', 'link'],
  ].filter(([url]) => url);
  return (
    <footer className="bg-ink pb-8 pt-12 text-[15px] leading-[18px] text-white md:pb-10 md:pt-20">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-4 md:gap-12 md:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:flex md:gap-12">
          <div className="col-span-2 flex flex-col gap-3 md:w-[320px] md:shrink-0 md:gap-4">
            <span className="flex items-center gap-2 text-[18px] font-semibold leading-[22px] md:text-[19px] md:leading-6">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-primary md:size-[30px] md:rounded-[8px]" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 44 44">
                  <circle cx="19" cy="19" r="13" fill="none" stroke="#FFFFFF" strokeWidth="5" />
                  <path d="M28.5 28.5L38 38" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M19 13v12M13 19h12" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
                </svg>
              </span>
              MedLens
            </span>
            <p className="leading-[22px] text-[#C9D2E0] md:leading-[23px]">
              Prescriptions in plain words<span className="hidden md:inline">, for seniors, caregivers and parents</span>.
            </p>
            <a href="#/app/today" className="hidden h-11 items-center self-start rounded-[10px] bg-white px-4 font-semibold text-ink transition-colors hover:bg-white/90 md:flex">Open MedLens</a>
          </div>
          <Col title="Product">
            {[['today', 'Open app'], ['scan', 'Scan'], ['today', 'Today'], ['calendar', 'Calendar'], ['safety', 'Safety']].map(([v, l]) => (
              <li key={l}><a className={linkCls} href={`#/app/${v}`}>{l}</a></li>
            ))}
          </Col>
          <Col title="Project">
            {project.map(([url, l, icon]) => <li key={l}><a className={linkCls} href={url} {...ext}><Icon d={ICONS[icon]} />{l}</a></li>)}
          </Col>
          <Col title="Resources">
            <li><a className={linkCls} href={OPENFDA} {...ext}>openFDA</a></li>
            <li><a className={linkCls} href="#/app/translate">Medical words A-Z</a></li>
            <li><button type="button" className={linkCls} onClick={() => scrollToSection('faq')}>FAQ</button></li>
          </Col>
          <Col title="Legal">
            {Object.entries(LEGAL).map(([k, [l]]) => <li key={k}><a className={linkCls} href={`#/legal/${k}`}>{l}</a></li>)}
          </Col>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#2B3A52] pt-5 text-[14px] md:gap-2.5 md:pt-6">
          <p className="leading-[21px] text-[#C9D2E0]">
            Educational aid. Not medical advice. Always check with your pharmacist or doctor.<br className="hidden md:inline" />{' '}
            Drug data: openFDA (U.S. FDA). Photos: Unsplash (Nappy, Towfiqu barbhuiya, Laurynas Me, Shutter Speed).
          </p>
          <p className="text-[#8C9AB2]">© 2026 MedLens · Built for EvoHacks II</p>
        </div>
      </div>
    </footer>
  );
}
