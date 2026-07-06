import React, { useState } from 'react';
import fuzzysort from 'fuzzysort';
import { Plus, Search, Heart } from 'lucide-react';
import { TopBar, EmptyState, PrimaryButton, Stepper } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Catalog({ products, cart, setQty, onBack, onCart, cartCount, onRequestProduct, favorites, onToggleFav, stats }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [quickFilter, setQuickFilter] = useState('all');
  const categories = ['Toutes', ...Array.from(new Set(products.map((p) => p.category)))];

  let base = products;
  if (quickFilter === 'favorites') {
    base = base.filter((p) => favorites.includes(p.id));
  } else if (quickFilter === 'mostOrdered') {
    base = base.filter((p) => stats[p.id]?.count > 0).sort((a, b) => (stats[b.id]?.count || 0) - (stats[a.id]?.count || 0));
  } else if (quickFilter === 'recent') {
    base = base.filter((p) => stats[p.id]?.lastDate).sort((a, b) => new Date(stats[b.id]?.lastDate) - new Date(stats[a.id]?.lastDate));
  }

  const byCategory = base.filter((p) => category === 'Toutes' || p.category === category);

  let filtered;
  if (search.trim()) {
    const results = fuzzysort.go(search, byCategory, { key: 'name', all: false });
    filtered = results.map((r) => r.obj);
  } else {
    filtered = byCategory;
  }

  if (quickFilter === 'all') {
    filtered = filtered.slice().sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }

  return (
    <div>
      <TopBar title={t('catalog')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#8A938A' }} />
          <input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
          {[
            { id: 'all', label: t('filterAll') },
            { id: 'favorites', label: '⭐ ' + t('filterFavorites') },
            { id: 'mostOrdered', label: '🔥 ' + t('filterMostOrdered') },
            { id: 'recent', label: '🕐 ' + t('filterRecent') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id)}
              style={{
                whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1.5px solid ' + (quickFilter === f.id ? '#0D0F0D' : '#CBD3CB'),
                background: quickFilter === f.id ? '#0D0F0D' : '#fff', color: quickFilter === f.id ? '#F7F9F7' : '#0D0F0D',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1.5px solid ' + (category === c ? '#0D0F0D' : '#CBD3CB'),
                background: category === c ? '#0D0F0D' : '#fff', color: category === c ? '#F7F9F7' : '#0D0F0D',
              }}
            >
              {c === 'Toutes' ? t('allCategories') : c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Search size={32} />} title={t('noProductsFound')} body={t('canSuggestProduct')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((p) => {
              const isFav = favorites.includes(p.id);
              const stat = stats[p.id];
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
                      {stat && (
                        <div className="uply-mono" style={{ fontSize: 10, color: '#C9A227', marginTop: 2 }}>
                          ⭐ {t('orderedTimes', { count: stat.count })}
                          {stat.lastQty ? ` · ${t('lastOrder')}: ${stat.lastQty} ${p.unit}` : ''}
                        </div>
                      )}
                    </div>
                    <button onClick={() => onToggleFav(p.id)} style={{ background: 'none', border: 'none', padding: 4, color: isFav ? '#1FB9D6' : '#CBD3CB' }}>
                      <Heart size={18} fill={isFav ? '#1FB9D6' : 'none'} />
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

        <button onClick={onRequestProduct} style={{ width: '100%', marginTop: 18, background: 'none', border: '1.5px dashed #8A938A', borderRadius: 8, padding: 14, color: '#576257', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={16} /> {t('cantFindProduct')}
        </button>
      </div>

      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 14, background: '#F7F9F7', borderTop: '1.5px solid #0D0F0D' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <PrimaryButton onClick={onCart}>{t('viewCart')} ({cartCount})</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
