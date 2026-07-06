import React, { useState } from 'react';
import { Pencil, Trash2, Phone, Mail, Clock, Truck } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const emptyForm = { name: '', phone: '', email: '', lead_time_days: '', delivery_days: '' };

function DaysPicker({ value, onChange }) {
  const selected = value ? value.split(',').filter(Boolean) : [];
  function toggle(day) {
    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day];
    onChange(next.join(','));
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          style={{
            fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 4,
            border: '1.5px solid ' + (selected.includes(day) ? '#0D0F0D' : '#CBD3CB'),
            background: selected.includes(day) ? '#0D0F0D' : '#fff',
            color: selected.includes(day) ? '#fff' : '#0D0F0D',
          }}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

export default function AdminSuppliers({ restaurants, suppliers, onChange }) {
  const { t } = useLanguage();
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id || '');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function add() {
    if (!form.name.trim() || !restaurantId) return;
    await api.createSupplier(restaurantId, {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days, 10) : null,
      delivery_days: form.delivery_days || null,
    });
    setForm(emptyForm);
    onChange();
  }

  function startEdit(s) {
    setEditing(s.id);
    setEditForm({
      name: s.name || '',
      phone: s.phone || '',
      email: s.email || '',
      lead_time_days: s.lead_time_days ?? '',
      delivery_days: s.delivery_days || '',
    });
  }

  async function saveEdit() {
    await api.updateSupplier(editing, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || null,
      email: editForm.email.trim() || null,
      lead_time_days: editForm.lead_time_days ? parseInt(editForm.lead_time_days, 10) : null,
      delivery_days: editForm.delivery_days || null,
    });
    setEditing(null);
    onChange();
  }

  async function remove(id) {
    if (!window.confirm(t('confirmDeleteSupplier'))) return;
    await api.deleteSupplier(id);
    onChange();
  }

  return (
    <div>
      <SectionHeader title={t('manageSuppliers')} />

      <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 14, marginBottom: 20 }}>
        <div className="uply-mono" style={{ fontSize: 11, marginBottom: 10, color: '#576257' }}>{t('newSupplier')}</div>
        <div className="uply-form-grid" style={{ marginBottom: 8 }}>
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} style={inputStyle}>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input placeholder={t('supplierNamePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder={t('supplierPhone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
          <input placeholder={t('supplierEmail')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <input placeholder={t('supplierLeadTime')} type="number" min="0" value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })} style={inputStyle} />
        </div>
        <div className="uply-mono" style={{ fontSize: 10, color: '#576257', marginBottom: 6 }}>{t('supplierDeliveryDays')}</div>
        <div style={{ marginBottom: 10 }}>
          <DaysPicker value={form.delivery_days} onChange={(v) => setForm({ ...form, delivery_days: v })} />
        </div>
        <button onClick={add} style={{ width: '100%', background: '#1FB9D6', color: '#fff', border: 'none', borderRadius: 6, padding: 10, fontWeight: 600 }}>
          + {t('addSupplier')}
        </button>
      </div>

      {restaurants.map((r) => {
        const rs = suppliers.filter((s) => s.restaurant_id === r.id);
        if (rs.length === 0) return null;
        return (
          <div key={r.id} style={{ marginBottom: 18 }}>
            <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{r.name.toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rs.map((s) => {
                const isEditing = editing === s.id;
                if (isEditing) {
                  return (
                    <div key={s.id} style={{ background: '#EFFBE3', border: '1.5px solid #C9A227', borderRadius: 8, padding: 12 }}>
                      <div className="uply-form-grid" style={{ marginBottom: 8 }}>
                        <input placeholder={t('supplierNamePlaceholder')} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                        <input placeholder={t('supplierPhone')} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                        <input placeholder={t('supplierEmail')} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                        <input placeholder={t('supplierLeadTime')} type="number" min="0" value={editForm.lead_time_days} onChange={(e) => setEditForm({ ...editForm, lead_time_days: e.target.value })} style={inputStyle} />
                      </div>
                      <div className="uply-mono" style={{ fontSize: 10, color: '#576257', marginBottom: 6 }}>{t('supplierDeliveryDays')}</div>
                      <div style={{ marginBottom: 10 }}>
                        <DaysPicker value={editForm.delivery_days} onChange={(v) => setEditForm({ ...editForm, delivery_days: v })} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={saveEdit} style={{ flex: 1, background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('save')}</button>
                        <button onClick={() => setEditing(null)} style={{ flex: 1, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 12 }}>{t('cancel')}</button>
                      </div>
                    </div>
                  );
                }
                const days = s.delivery_days ? s.delivery_days.split(',').filter(Boolean) : [];
                return (
                  <div key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10 }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.name}</div>
                      <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} /> {s.phone}</span>}
                        {s.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={10} /> {s.email}</span>}
                        {s.lead_time_days != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {t('leadTimeDays', { count: s.lead_time_days })}</span>}
                        {days.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Truck size={10} /> {days.join(', ')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(s)} title={t('edit')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#0D0F0D' }}><Pencil size={13} /></button>
                      <button onClick={() => remove(s.id)} title={t('delete')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#C0392B' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
