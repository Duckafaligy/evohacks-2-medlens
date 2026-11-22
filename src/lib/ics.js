// RFC 5545 calendar: one daily repeating event per med per time slot.
export const SLOT_TIMES = { morning: '08:00', noon: '12:00', evening: '18:00', bedtime: '21:00' };

const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Fold lines longer than 75 octets (UTF-8), never splitting a character.
function fold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + b > limit) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const utcStamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/**
 * buildIcs(meds, { start: Date, times: {morning:'08:00',...}, lang: 'en' }) -> string
 * meds: [{ id?, name, dose, slots, plain: string | {en,es,fr,zh}, days? }]. PRN meds (no slots) are skipped.
 * Times are floating local time, so 08:00 means 8 AM wherever the phone is.
 */
export function buildIcs(meds, { start = new Date(), times = SLOT_TIMES, lang = 'en' } = {}) {
  const day = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}`;
  const stamp = utcStamp(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MedLens//Pill Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const med of meds) {
    const desc = typeof med.plain === 'string' ? med.plain : med.plain?.[lang] || med.plain?.en || '';
    for (const slot of med.slots || []) {
      const [h, m] = (times[slot] || SLOT_TIMES[slot]).split(':');
      const id = (med.id || med.name).toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const amt = med.dose || med.strength;
      const summary = `${med.name}${amt ? ' ' + amt : ''}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${id}-${slot}-${day}@medlens`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${day}T${h}${m}00`,
        'DURATION:PT15M',
        `RRULE:FREQ=DAILY${med.days ? `;COUNT=${med.days}` : ''}`,
        `SUMMARY:${esc(`Take ${summary}`)}`,
        `DESCRIPTION:${esc(desc)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:PT0M',
        `DESCRIPTION:${esc(`Time to take ${summary}`)}`,
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** downloadIcs(meds, opts) — browser only: saves medlens-schedule.ics */
export function downloadIcs(meds, opts) {
  const blob = new Blob([buildIcs(meds, opts)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'medlens-schedule.ics' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * googleCalendarUrl(med, slot, startDate = new Date(), { times, lang }) -> Google Calendar "add event" link.
 * Local (floating) time, daily repeat (COUNT=days for short courses), 15-minute event.
 */
export function googleCalendarUrl(med, slot, startDate = new Date(), { times = SLOT_TIMES, lang = 'en' } = {}) {
  const [h, m] = (times[slot] || SLOT_TIMES[slot] || '08:00').split(':').map(Number);
  const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), h, m);
  const e = new Date(s.getTime() + 15 * 60000);
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const details = typeof med.plain === 'string' ? med.plain : med.plain?.[lang] || med.plain?.en || '';
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Take ${med.name}${med.dose || med.strength ? ' ' + (med.dose || med.strength) : ''}`,
    dates: `${fmt(s)}/${fmt(e)}`,
    recur: `RRULE:FREQ=DAILY${med.days ? `;COUNT=${med.days}` : ''}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
