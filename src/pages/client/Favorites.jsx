import React from 'react';
import { Heart } from 'lucide-react';
import { TopBar, EmptyState, Stepper } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Favorites({ products, favorites, cart, setQty, onToggleFav, onBack }) {
  const { t } = useLanguage();
  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div>
      <TopBar title={t('myFavorites')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
        {favProducts.length === 0 ? (
          <EmptyState icon={<Heart size={32} />} title={t('noFavoritesYet')} body={t('noFavoritesDesc')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favProducts.map((p) => {
              const outOfStock = p.in_stock === false;
              return (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid ' + (outOfStock ? '#e5b8a8' : '#E1E6E1'), borderRadius: 8, padding: 12, opacity: outOfStock ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 28, width: 40, textAlign: 'center' }}>{p.photo}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                        {outOfStock && (
                          <span className="uply-mono" style={{ fontSize: 9, background: '#C0392B', color: '#fff', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                            🔴 {t('outOfStock')}
                          </span>
                        )}
                      </div>
                      <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{p.category} · {p.unit} · {(p.price || 0).toFixed(2)} €</div>
                    </div>
                    <button onClick={() => onToggleFav(p.id)} style={{ background: 'none', border: 'none', padding: 4, color: '#1FB9D6' }}>
                      <Heart size={18} fill="#1FB9D6" />
                    </button>
                  </div>
                  {!outOfStock && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <Stepper value={cart[p.id]?.qty || 0} onChange={(v) => setQty(p.id, v)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
