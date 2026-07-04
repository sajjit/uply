import React, { useState } from 'react';
import * as api from '../../lib/api';
import { SectionHeader } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminRestaurants({ restaurants, products, users, onChange }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    await api.createRestaurant(name.trim());
    setName('');
    setBusy(false);
    onChange();
  }

  async function remove(id) {
    await api.deleteRestaurant(id);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {restaurants.map((r) => {
          const productsCount = products.filter((p) => p.restaurant_id === r.id).length;
          const usersCount = users.filter((u) => u.restaurant_id === r.id).length;
          return (
            <div key={r.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{productsCount} produits · {usersCount} utilisateurs</div>
              </div>
              <button onClick={() => remove(r.id)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 12 }}>{t('delete')}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
