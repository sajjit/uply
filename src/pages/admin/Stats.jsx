import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminStats() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.fetchAdminStats().then(({ data }) => setStats(data));
  }, []);

  if (!stats) {
    return <div className="uply-mono" style={{ color: '#8A938A', padding: 20 }}>{t('loading')}</div>;
  }

  return (
    <div>
      <SectionHeader title="Statistiques" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 16, flex: 1 }}>
          <div className="uply-display" style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalOrders}</div>
          <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginTop: 2 }}>COMMANDES TOTALES</div>
        </div>
        <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 16, flex: 1 }}>
          <div className="uply-display" style={{ fontSize: 28, fontWeight: 700, color: '#1FB9D6' }}>{stats.ordersThisMonth}</div>
          <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginTop: 2 }}>CE MOIS-CI</div>
        </div>
      </div>

      <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 10 }}>PRODUITS LES PLUS COMMANDÉS</div>
      {stats.topProducts.length === 0 ? (
        <div style={{ color: '#8A938A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} /> Pas encore de données
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stats.topProducts.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10 }}>
              <div className="uply-mono" style={{ fontSize: 12, color: '#8A938A', width: 18 }}>#{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
              <div className="uply-mono" style={{ fontSize: 11, color: '#1FB9D6' }}>{p.count}×</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
