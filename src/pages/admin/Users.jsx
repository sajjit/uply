import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, inputStyle, PrimaryButton } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminUsers({ restaurants, users, onChange }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', restaurantId: restaurants[0]?.id || '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', restaurantId: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

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

  function startEdit(u) {
    setEditing(u.id);
    setEditForm({ name: u.name || '', restaurantId: u.restaurant_id || '' });
  }

  async function saveEdit() {
    await api.updateUser(editing, { name: editForm.name.trim() || null, restaurant_id: editForm.restaurantId || null });
    setEditing(null);
    onChange();
  }

  async function removeUser(u) {
    if (!window.confirm(t('confirmDeleteUser'))) return;
    setDeletingId(u.id);
    setDeleteError(null);
    const { error } = await api.deleteUser(u.id);
    setDeletingId(null);
    if (error) {
      setDeleteError(error);
    } else {
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
      {deleteError && (
        <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, marginBottom: 10, background: '#FDECEA', color: '#C0392B', border: '1px solid #C0392B' }}>
          {t('userDeleteError')} {deleteError}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {users.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8A938A', padding: '12px 0' }}>Aucun utilisateur client pour le moment.</div>
        ) : users.map((u) => {
          const r = restaurants.find((x) => x.id === u.restaurant_id);
          if (editing === u.id) {
            return (
              <div key={u.id} style={{ background: '#EFFBE3', border: '1.5px solid #C9A227', borderRadius: 8, padding: 12 }}>
                <div className="uply-form-grid" style={{ marginBottom: 8 }}>
                  <input placeholder={t('userName')} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                  <select value={editForm.restaurantId} onChange={(e) => setEditForm({ ...editForm, restaurantId: e.target.value })} style={inputStyle}>
                    <option value="">{t('unassigned')}</option>
                    {restaurants.map((res) => <option key={res.id} value={res.id}>{res.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveEdit} style={{ flex: 1, background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('save')}</button>
                  <button onClick={() => setEditing(null)} style={{ flex: 1, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 12 }}>{t('cancel')}</button>
                </div>
              </div>
            );
          }
          return (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || u.email}</div>
                <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>
                  {u.email}{u.must_reset_password ? ` · ${t('invitePending')}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="uply-mono" style={{ fontSize: 11, color: '#576257' }}>{r?.name || t('unassigned')}</span>
                <button onClick={() => startEdit(u)} title={t('edit')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#0D0F0D' }}><Pencil size={13} /></button>
                <button onClick={() => removeUser(u)} disabled={deletingId === u.id} title={t('delete')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#C0392B' }}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
