import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import { TopBar, EmptyState, PrimaryButton, Stepper } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function QuickOrder({ products, stats, onBack, onConfirm }) {
  const { t } = useLanguage();

  const suggestions = products
    .filter((p) => p.in_stock !== false && stats[p.id]?.count > 0)
    .sort((a, b) => (stats[b.id]?.count || 0) - (stats[a.id]?.count || 0))
    .slice(0, 12);

  const [qtys, setQtys] = useState(() => {
    const initial = {};
    for (const p of suggestions) initial[p.id] = stats[p.id]?.lastQty || 1;
    return initial;
  });

  const selectedItems = suggestions
    .filter((p) => (qtys[p.id] || 0) > 0)
    .map((p) => ({ productId: p.id, qty: qtys[p.id] }));

  return (
    <div>
      <TopBar title={t('quickOrder')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', paddingBottom: 120 }}>
        <div style={{ fontSize: 13, color: '#576257', marginBottom: 16 }}>{t('quickOrderDesc')}</div>

        {suggestions.length === 0 ? (
          <EmptyState icon={<Zap size={32} />} title={t('noUsualOrderYet')} body={t('noUsualOrderDesc')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((p) => {
              const stat = stats[p.id];
              return (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{p.photo}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div className="uply-mono" style={{ fontSize: 10, color: '#C9A227' }}>
                        ⭐ {t('orderedTimes', { count: stat.count })}
                      </div>
                    </div>
                    <Stepper value={qtys[p.id] || 0} onChange={(v) => setQtys((prev) => ({ ...prev, [p.id]: v }))} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 14, background: '#F7F9F7', borderTop: '1.5px solid #0D0F0D' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <PrimaryButton onClick={() => onConfirm(selectedItems)}><Check size={16} /> {t('addToCartAndReview', { count: selectedItems.length })}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
