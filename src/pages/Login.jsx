import React, { useState } from 'react';
import { GlobalStyle, PrimaryButton, TextField } from '../components/shared';
import { LanguageToggle } from '../components/shared/TopBar';
import { useLanguage } from '../i18n/LanguageContext';
import * as api from '../lib/api';
import logoImage from '../assets/logo.jpeg';

export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await onLogin(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  async function submitReset(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    await api.requestPasswordReset(email);
    setBusy(false);
    setResetSent(true);
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
          {mode === 'login' ? (
            <form onSubmit={submit} style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 22 }}>
              <TextField label={t('emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@restaurant.fr" required />
              <TextField label={t('passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              {error && <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>{t('loginError')}</div>}
              <PrimaryButton type="submit" onClick={submit} disabled={busy}>
                {busy ? t('loggingIn') : t('loginButton')}
              </PrimaryButton>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setResetSent(false); }}
                style={{ width: '100%', background: 'none', border: 'none', color: '#576257', fontSize: 12, marginTop: 14, padding: 4, textAlign: 'center' }}
              >
                {t('forgotPasswordLink')}
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 22 }}>
              {resetSent ? (
                <div style={{ fontSize: 13, color: '#576257', marginBottom: 16, textAlign: 'center' }}>
                  {t('resetEmailSentNotice')}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#576257', marginBottom: 14 }}>{t('forgotPasswordDesc')}</div>
                  <TextField label={t('emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@restaurant.fr" required />
                  <PrimaryButton type="submit" onClick={submitReset} disabled={busy}>
                    {busy ? t('sending') : t('sendResetLinkButton')}
                  </PrimaryButton>
                </>
              )}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ width: '100%', background: 'none', border: 'none', color: '#576257', fontSize: 12, marginTop: 14, padding: 4, textAlign: 'center' }}
              >
                {t('backToLogin')}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <a href="/politique-de-confidentialite.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#8A938A' }}>
              {t('privacyPolicyLink')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
