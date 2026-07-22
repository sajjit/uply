import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminRestaurants({ restaurants, products, users, onChange }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ ownerName: '', address: '', phone: '' });
  const [error, setError] = useState(null);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const { error: err } = await api.createRestaurant(name.trim());
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName('');
    onChange();
  }

  async function remove(id) {
    await api.deleteRestaurant(id);
    onChange();
  }

  function startEdit(r) {
    setEditing(r.id);
    setEditForm({ ownerName: r.owner_name || '', address: r.address || '', phone: r.phone || '' });
  }

  async function saveEdit() {
    await api.updateRestaurant(editing, {
      owner_name: editForm.ownerName.trim() || null,
      address: editForm.address.trim() || null,
      phone: editForm.phone.trim() || null,
    });
    setEditing(null);
    onChange();
  }

  return (
    <div>
      <SectionHeader title={t('manageRestaurants')} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('restaurantNamePlaceholder')}
          style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 14 }}
        />
        <button onClick={add} disabled={busy} style={{ background: '#0D0F0D', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', fontWeight: 600 }}>
          + {t('create')}
        </button>
      </div>
      {error && (
        <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, marginBottom: 16, background: '#FDECEA', color: '#C0392B', border: '1px solid #C0392B' }}>
          {t('restaurantCreateError')} {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {restaurants.map((r) => {
          const productsCount = products.filter((p) => p.restaurant_id === r.id).length;
          const usersCount = users.filter((u) => u.restaurant_id === r.id).length;
          if (editing === r.id) {
            return (
              <div key={r.id} style={{ background: '#EFFBE3', border: '1.5px solid #C9A227', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{r.name}</div>
                <div className="uply-form-grid" style={{ marginBottom: 8 }}>
                  <input placeholder={t('restaurantOwnerName')} value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} style={inputStyle} />
                  <input placeholder={t('restaurantAddress')} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} style={inputStyle} />
                  <input placeholder={t('restaurantPhone')} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveEdit} style={{ flex: 1, background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('save')}</button>
                  <button onClick={() => setEditing(null)} style={{ flex: 1, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 12 }}>{t('cancel')}</button>
                </div>
              </div>
            );
          }
          return (
            <div key={r.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 12, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{productsCount} produits · {usersCount} utilisateurs</div>
                {r.owner_name && (
                  <div className="uply-mono" style={{ fontSize: 10, color: '#576257', marginTop: 2 }}>{t('ownerLabel')} {r.owner_name}</div>
                )}
                {(r.address || r.phone) && (
                  <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A', marginTop: 2 }}>
                    {r.address}{r.address && r.phone ? ' · ' : ''}{r.phone}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => startEdit(r)} title={t('edit')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#0D0F0D' }}><Pencil size={13} /></button>
                <button onClick={() => remove(r.id)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 12 }}>{t('delete')}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
