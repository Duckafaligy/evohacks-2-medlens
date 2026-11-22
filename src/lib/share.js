// Share a plan in the URL hash (#plan=...). Nothing leaves the device until the link is shared.

const toB64url = (bytes) => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

/** encodePlan(plan) -> base64url string of its JSON (UTF-8 safe, so 中文 works). */
export const encodePlan = (plan) => toB64url(new TextEncoder().encode(JSON.stringify(plan)));

/** decodePlan('#plan=abc' | 'plan=abc' | 'abc') -> plan object, or null if invalid. */
export function decodePlan(hash) {
  try {
    const s = String(hash || '').replace(/^#/, '').replace(/^plan=/, '');
    if (!s) return null;
    return JSON.parse(new TextDecoder().decode(fromB64url(s)));
  } catch {
    return null;
  }
}

/** planFromHash() -> plan from window.location.hash (#plan=...) or null. */
export function planFromHash() {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/plan=([A-Za-z0-9_-]+)/);
  return m ? decodePlan(m[1]) : null;
}

/** shareUrl(plan) -> full link to this page with the plan in the hash. */
export const shareUrl = (plan) => `${window.location.origin}${window.location.pathname}#plan=${encodePlan(plan)}`;
