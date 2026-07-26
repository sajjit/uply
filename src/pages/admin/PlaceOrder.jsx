import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, EmptyState, PrimaryButton, Stepper, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Lets the admin place an order on a restaurant's behalf — e.g. taking an
 * order in person on-site and entering it directly, without the restaurant
 * needing to use the app themselves for that order.
 */
export default function AdminPlaceOrder({ restaurants, products, categories, profile, onChange }) {
  const { t } = useLanguage();
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id || '');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [cart, setCart] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  function setQty(productId, qty) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  const restaurantProducts = products.filter((p) => p.restaurant_id === restaurantId && p.active && p.in_stock !== false);
  // Source options from the fixed category list (not raw product.category
  // strings) so this can't show near-duplicates from old free-text data —
  // only categories that actually have a product here are offered.
  const categoryOptions = [
    'Toutes',
    ...(categories || []).map((c) => c.name).filter((name) => restaurantProducts.some((p) => p.category === name)),
  ];
  const byCategory = restaurantProducts.filter((p) => category === 'Toutes' || p.category === category);
  const filtered = search.trim()
    ? byCategory.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : byCategory;

  const items = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((i) => i.product);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * (i.product.price || 0), 0);

  async function submit() {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    const orderItems = items.map((i) => ({
      productId: i.product.id, name: i.product.name, qty: i.qty, unit: i.product.unit, unitPrice: i.product.price || 0,
    }));
    setSubmitting(true);
    const { error } = await api.createOrder(restaurantId, orderItems, profile.id, comment, restaurant?.name, true);
    setSubmitting(false);
    if (!error) {
      setCart({});
      setComment('');
      setConfirmation(restaurant?.name);
      onChange();
    }
  }

  return (
    <div>
      <SectionHeader title={t('placeOrderForRestaurant')} />

      {confirmation && (
        <div style={{ background: '#EAF7EC', border: '1px solid #5A9C3E', color: '#5A9C3E', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          {t('orderPlacedFor', { restaurant: confirmation })}
        </div>
      )}

      <select value={restaurantId} onChange={(e) => { setRestaurantId(e.target.value); setCart({}); setCategory('Toutes'); }} style={{ ...inputStyle, width: '100%', marginBottom: 10 }}>
        {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#8A938A' }} />
        <input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 14 }}
        />
      </div>

      <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 16 }}>
        {categoryOptions.map((c) => (
          <option key={c} value={c}>{c === 'Toutes' ? t('allCategories') : c}</option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search size={32} />} title={t('noProductsFound')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 20 }}>{p.photo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>{p.category} · {p.unit} · {(p.price || 0).toFixed(2)} €</div>
              </div>
              <Stepper value={cart[p.id] || 0} onChange={(v) => setQty(p.id, v)} />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 14 }}>
          <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 10 }}>{t('generalComment')}</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('generalCommentPlaceholder')}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 13, minHeight: 50, fontFamily: 'inherit', resize: 'vertical', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="uply-mono" style={{ fontSize: 12, color: '#576257' }}>{t('itemCount', { count: itemCount })}</span>
            <span className="uply-display" style={{ fontSize: 18, fontWeight: 700 }}>{t('total')} : {total.toFixed(2)} €</span>
          </div>
          <PrimaryButton onClick={submit} disabled={submitting}>
            <Check size={16} /> {submitting ? t('sending') : t('placeOrder')}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
