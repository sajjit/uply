import React from 'react';
import { Inbox } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, EmptyState } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminRequests({ requests, restaurants, onChange }) {
  const { t } = useLanguage();

  async function setStatus(req, status) {
    await api.updateProductRequestStatus(req.id, status, req, api.notifyRestaurant);
    onChange();
  }

  return (
    <div>
      <SectionHeader title={t('productRequests')} />
      {requests.length === 0 ? (
        <EmptyState icon={<Inbox size={32} />} title={t('noRequests')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map((r) => {
            const restaurant = restaurants.find((x) => x.id === r.restaurant_id);
            return (
              <div key={r.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <span className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>{restaurant?.name}</span>
                </div>
                {r.comment && <div style={{ fontSize: 12, color: '#576257', marginBottom: 10 }}>💬 {r.comment}</div>}
                {r.status === 'En attente' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setStatus(r, 'Validée')} style={{ flex: 1, background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('approve')}</button>
                    <button onClick={() => setStatus(r, 'Refusée')} style={{ flex: 1, background: 'none', border: '1px solid #C0392B', color: '#C0392B', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('decline')}</button>
                  </div>
                ) : (
                  <span className="uply-mono" style={{ fontSize: 11, color: r.status === 'Validée' ? '#5A9C3E' : '#C0392B' }}>{r.status}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
