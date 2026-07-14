import React, { useState } from 'react';
import * as api from '../../lib/api';
import { SectionHeader, inputStyle, PrimaryButton } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminUsers({ restaurants, users, onChange }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', restaurantId: restaurants[0]?.id || '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function inviteUser() {
    if (!form.email.trim() || !form.restaurantId) return;
    setBusy(true);
    setMessage(null);
    const { data, error } = await api.adminCreateUser(form.email.trim(), form.name.trim(), form.restaurantId);
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: t('userCreateError') + ' ' + error });
    } else {
      setMessage({ type: 'success', text: t('userInvited') });
      setForm({ name: '', email: '', restaurantId: restaurants[0]?.id || '' });
      onChange();
    }
  }

  return (
    <div>
      <SectionHeader title={t('users')} />
      <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div className="uply-mono" style={{ fontSize: 11, marginBottom: 12, color: '#576257' }}>
          {t('inviteUser').toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: '#576257', marginBottom: 12 }}>{t('inviteUserDesc')}</div>
        <div className="uply-form-grid" style={{ marginBottom: 8 }}>
          <input placeholder={t('userName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder={t('userEmail')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <select value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} style={inputStyle}>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {message && (
          <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, marginBottom: 10, background: message.type === 'success' ? '#EAF7EC' : '#FDECEA', color: message.type === 'success' ? '#5A9C3E' : '#C0392B', border: '1px solid ' + (message.type === 'success' ? '#5A9C3E' : '#C0392B') }}>
            {message.text}
          </div>
        )}
        <PrimaryButton onClick={inviteUser} disabled={busy || !form.email.trim()}>
          {busy ? t('sending') : '+ ' + t('inviteUser')}
        </PrimaryButton>
      </div>

      <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{t('existingUsers')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {users.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8A938A', padding: '12px 0' }}>Aucun utilisateur client pour le moment.</div>
        ) : users.map((u) => {
          const r = restaurants.find((x) => x.id === u.restaurant_id);
          return (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || u.email}</div>
                <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>
                  {u.email}{u.must_reset_password ? ` · ${t('invitePending')}` : ''}
                </div>
              </div>
              <span className="uply-mono" style={{ fontSize: 11, color: '#576257', alignSelf: 'center' }}>{r?.name || t('unassigned')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
