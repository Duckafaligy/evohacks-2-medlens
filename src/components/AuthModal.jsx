import { useState } from 'react';
import { useApp } from './ctx.js';
import { Button, Modal } from './ui.jsx';
import { isConfigured, signIn } from '../lib/auth.js';

export default function AuthModal({ open, onClose }) {
  const { tr } = useApp();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const ready = isConfigured();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await signIn(email);
      setMsg(tr('checkEmail'));
    } catch {
      setMsg(tr('accountsSoon'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tr('saveToAccount')}>
      <p className="text-body text-ink-2">{ready ? tr('saveExplain') : tr('accountsSoon')}</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-small font-semibold" htmlFor="auth-email">{tr('email')}</label>
        <input id="auth-email" type="email" required disabled={!ready} value={email} onChange={(e) => setEmail(e.target.value)}
          className="btn w-full rounded-md border border-control bg-surface px-4 text-body disabled:bg-canvas" />
        <Button type="submit" disabled={!ready} className="w-full">{tr('sendLink')}</Button>
        {msg && <p role="status" className="text-small text-ink-2">{msg}</p>}
      </form>
    </Modal>
  );
}
