import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

function StatCard({ value, label, accent }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 16, flex: 1 }}>
      <div className="uply-display" style={{ fontSize: 28, fontWeight: 700, color: accent || '#0D0F0D' }}>{value}</div>
      <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function AdminHome({ restaurants, products, orders, requests }) {
  const { t } = useLanguage();
  const pendingOrders = orders.filter((o) => o.status !== 'Livrée').length;
  const pendingRequests = requests.filter((r) => r.status === 'En attente').length;

  return (
    <div>
      <div className="uply-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{t('overview')}</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard value={restaurants.length} label={t('statRestaurants')} />
        <StatCard value={products.filter((p) => p.active).length} label={t('statActiveProducts')} />
        <StatCard value={pendingOrders} label={t('statOrdersInProgress')} accent="#1FB9D6" />
        <StatCard value={pendingRequests} label={t('statRequestsToReview')} accent="#C9A227" />
      </div>
      <div style={{ fontSize: 13, color: '#576257' }}>{t('useTabsHint')}</div>
    </div>
  );
}
