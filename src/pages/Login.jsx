import React, { useState } from 'react';
import { GlobalStyle, PrimaryButton, TextField } from '../components/shared';
import { LanguageToggle } from '../components/shared/TopBar';
import { useLanguage } from '../i18n/LanguageContext';
import logoImage from '../assets/logo.jpeg';

export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await onLogin(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="uply-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalStyle />

      {/* Dark hero section matching the logo's native background */}
      <div style={{ background: '#0D0F0D', padding: '36px 20px 44px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <LanguageToggle />
        </div>
        <img src={logoImage} alt="Uply" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <form onSubmit={submit} style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 22 }}>
            <TextField label={t('emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@restaurant.fr" required />
            <TextField label={t('passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>{t('loginError')}</div>}
            <PrimaryButton type="submit" onClick={submit} disabled={busy}>
              {busy ? t('loggingIn') : t('loginButton')}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
