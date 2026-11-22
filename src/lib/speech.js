export const SPEECH_LANGS = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN' };

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let notify = () => {}; // onState of the current utterance

/**
 * speak(text, 'es', { rate, onState }) — reads text aloud in the caregiver language.
 * onState('speaking' | 'paused' | 'idle'). Returns the utterance (or null if unsupported).
 */
export function speak(text, lang = 'en', { rate = 0.9, onState } = {}) {
  if (!canSpeak() || !text) return null;
  const code = SPEECH_LANGS[lang] || lang;
  const synth = window.speechSynthesis;
  synth.cancel();
  notify('idle');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = code;
  u.rate = rate; // a little slower: easier for older listeners
  const voices = synth.getVoices();
  u.voice = voices.find((v) => v.lang === code)
    || voices.find((v) => v.lang?.toLowerCase().startsWith(code.slice(0, 2).toLowerCase()))
    || null;
  const cb = onState || (() => {});
  notify = cb;
  u.onstart = () => cb('speaking');
  u.onend = u.onerror = () => { cb('idle'); if (notify === cb) notify = () => {}; };
  synth.speak(u);
  return u;
}

export function pause() {
  if (canSpeak() && window.speechSynthesis.speaking) { window.speechSynthesis.pause(); notify('paused'); }
}

export function resume() {
  if (canSpeak() && window.speechSynthesis.paused) { window.speechSynthesis.resume(); notify('speaking'); }
}

export function stop() {
  if (canSpeak()) window.speechSynthesis.cancel();
  notify('idle');
}
