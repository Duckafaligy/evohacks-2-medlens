# MedLens

**Your prescription, in plain words.**

## The problem

Prescription labels and drug leaflets are written in medical jargon. "Take 1 tab PO BID PRN" means nothing to most people. Patients with low health literacy, older adults, people with low vision, and people who don't speak English as a first language are the most likely to take a medicine wrong.

## What it does

- Turns prescription jargon into plain, 6th-grade English
- Shows a daily pill timeline: Morning, Noon, Evening, Bedtime
- Pulls real warnings from the official FDA drug label data
- Read-aloud, large-text / high-contrast mode, and English / Español / Français / 中文
- 3 demo scenarios to try it instantly
- Printable fridge card and calendar (.ics) export

## How it works

- **OpenFDA** — warnings come from the free [OpenFDA drug label API](https://open.fda.gov/apis/drug/label/), called straight from the browser. No backend, no account, no data stored.
- **Web Speech API** — read-aloud uses the browser's built-in speech synthesis.
- Everything runs client-side; nothing you type leaves your device except the drug name sent to OpenFDA.

## Tech stack

React + Vite, Tailwind CSS v4, lucide-react icons. Deployed on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Build: `npm run build`

## Accessibility

- Large-text, high-contrast mode
- Read-aloud for every instruction
- Keyboard navigable, screen-reader labels
- Plain language throughout

## Disclaimer

**Not medical advice. Always confirm with your pharmacist or doctor.**

## Built for EvoHacks II

Built for EvoHacks II — Projects for Social Good.

MIT licensed. See [LICENSE](LICENSE).
