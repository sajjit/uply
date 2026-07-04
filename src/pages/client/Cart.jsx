import React from 'react';
import { Inbox, Check } from 'lucide-react';
import { TopBar, EmptyState, PrimaryButton, Stepper } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Cart({ cart, products, setQty, onBack, onSubmit, comment, setComment }) {
  const { t } = useLanguage();
  const items = Object.entries(cart)
    .map(([id, c]) => ({ product: products.find((p) => p.id === id), ...c }))
    .filter((i) => i.product);

  return (
    <div>
      <TopBar title={t('cart')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', paddingBottom: 160 }}>
        {items.length === 0 ? (
          <EmptyState icon={<Inbox size={32} />} title={t('emptyCart')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(({ product, qty, comment: itemComment }) => (
              <div key={product.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{product.photo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
                    <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{product.unit}</div>
                  </div>
                  <Stepper value={qty} onChange={(v) => setQty(product.id, v, itemComment)} />
                </div>
                <input
                  placeholder={t('commentOptional')}
                  value={itemComment}
                  onChange={(e) => setQty(product.id, qty, e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E1E6E1', borderRadius: 6, fontSize: 12 }}
                />
              </div>
            ))}
            <div style={{ marginTop: 6 }}>
              <div className="uply-mono" style={{ fontSize: 11, marginBottom: 5, color: '#576257' }}>{t('generalComment')}</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('generalCommentPlaceholder')}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD3CB', borderRadius: 6, fontSize: 13, minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 14, background: '#F7F9F7', borderTop: '1.5px solid #0D0F0D' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <PrimaryButton onClick={onSubmit}><Check size={16} /> {t('placeOrder')}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
