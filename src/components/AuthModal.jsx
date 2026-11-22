import { useState } from 'react';
import { useApp } from './ctx.js';
import { Button, Modal } from './ui.jsx';
import { signIn, signUp } from '../lib/auth.js';

export default function AuthModal({ open, onClose }) {
  const { tr } = useApp();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', error: false });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setMsg({ text: tr('passwordMin'), error: true });
    setBusy(true);
    setMsg({ text: '', error: false });
    try {
      if (mode === 'signup') {
        const res = await signUp(email, password);
        if (res?.needsConfirm) setMsg({ text: tr('checkEmailConfirm'), error: false });
        else onClose();
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      setMsg({ text: err?.message || tr('authFailed'), error: true });
    } finally {
      setBusy(false);
    }
  };

  const input = 'btn w-full rounded-md border border-control bg-surface px-4 text-body';
  return (
    <Modal open={open} onClose={onClose} title={tr(mode === 'signup' ? 'createAccount' : 'signIn')}>
      <p className="text-ink-2">{tr('saveExplain')}</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-small font-semibold" htmlFor="auth-email">{tr('email')}</label>
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        <label className="block text-small font-semibold" htmlFor="auth-pass">{tr('password')}</label>
        <input id="auth-pass" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className={input} />
        <Button type="submit" disabled={busy} className="w-full">{tr(mode === 'signup' ? 'createAccount' : 'signIn')}</Button>
        {msg.text && <p role={msg.error ? 'alert' : 'status'} className={`text-small ${msg.error ? 'text-danger' : 'text-safe'}`}>{msg.text}</p>}
      </form>
      <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMsg({ text: '', error: false }); }}
        className="mt-4 text-small font-semibold text-primary hover:underline">
        {tr(mode === 'signup' ? 'haveAccount' : 'noAccount')}
      </button>
    </Modal>
  );
}
