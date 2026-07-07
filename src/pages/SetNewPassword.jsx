import React, { useState } from 'react';
import { GlobalStyle, PrimaryButton, TextField } from '../components/shared';
import { useLanguage } from '../i18n/LanguageContext';
import * as api from '../lib/api';
import logoImage from '../assets/logo.jpeg';

/**
 * Shown in two situations:
 *  - forced: profile.must_reset_password is true (admin-created account, first login)
 *  - recovery: user followed a "forgot password" email link
 * Both end the same way: set a new password, clear the forced flag if any, continue.
 */
export default function SetNewPassword({ profileId, forced, onDone }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordsDontMatch'));
      return;
    }
    setBusy(true);
    const { error: updateError } = await api.updatePassword(password);
    if (updateError) {
      setBusy(false);
      setError(updateError);
      return;
    }
    if (profileId) await api.clearMustResetPassword(profileId);
    setBusy(false);
    onDone();
  }

  return (
    <div className="uply-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalStyle />
      <div style={{ background: '#0D0F0D', padding: '36px 20px 44px', display: 'flex', justifyContent: 'center' }}>
        <img src={logoImage} alt="Uply" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {forced && (
            <div style={{ fontSize: 13, color: '#576257', marginBottom: 14, textAlign: 'center' }}>
              {t('forcedResetNotice')}
            </div>
          )}
          <form onSubmit={submit} style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 10, padding: 22 }}>
            <TextField label={t('newPasswordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <TextField label={t('confirmPasswordLabel')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
            {error && <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>{error}</div>}
            <PrimaryButton type="submit" onClick={submit} disabled={busy}>
              {busy ? t('saving') : t('setNewPasswordButton')}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
