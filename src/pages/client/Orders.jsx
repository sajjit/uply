import React, { useState } from 'react';
import { ClipboardList, RotateCcw, Calendar } from 'lucide-react';
import { TopBar, EmptyState, StatusTab, fmtDate } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function OrdersList({ orders, onBack, onReorder }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(null);

  if (open) return <OrderDetail order={open} onBack={() => setOpen(null)} onReorder={onReorder} />;

  return (
    <div>
      <TopBar title={t('myOrders')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {orders.length === 0 ? (
          <EmptyState icon={<ClipboardList size={32} />} title={t('noOrdersYet')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((o) => (
              <div key={o.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 14 }}>
                <button onClick={() => setOpen(o)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A', marginBottom: 4 }}>{fmtDate(o.created_at)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{(o.order_items || []).length} {t('products')}</div>
                  </div>
                  <StatusTab status={o.status} />
                </button>
                <button onClick={() => onReorder(o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F7F9F7', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>
                  <RotateCcw size={13} /> {t('reorder')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack, onReorder }) {
  const { t } = useLanguage();
  return (
    <div>
      <TopBar title={t('orderDetail')} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <StatusTab status={order.status} />
            <span className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{fmtDate(order.created_at)}</span>
          </div>
          {order.delivery_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EAF7EC', border: '1px solid #5A9C3E', borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <Calendar size={16} color="#5A9C3E" />
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#5A9C3E' }}>{t('expectedDelivery')}</div>
                <div className="uply-mono" style={{ fontSize: 11 }}>
                  {new Date(order.delivery_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {order.delivery_window ? ` · ${order.delivery_window}` : ''}
                </div>
              </div>
            </div>
          )}
          {order.comment && (
            <div style={{ fontSize: 12, color: '#576257', background: '#F7F9F7', borderRadius: 6, padding: 10, marginBottom: 10 }}>
              💬 <strong>{t('generalCommentLabel')}</strong> {order.comment}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {(order.order_items || []).map((it) => (
            <div key={it.id} style={{ background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
                <span>{it.name}</span>
                <span className="uply-mono">{it.qty} {it.unit}</span>
              </div>
              {it.comment && <div style={{ fontSize: 12, color: '#8A938A', marginTop: 4 }}>💬 {it.comment}</div>}
            </div>
          ))}
        </div>
        <button onClick={() => onReorder(order)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0D0F0D', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontSize: 13, fontWeight: 600 }}>
          <RotateCcw size={15} /> {t('reorderThis')}
        </button>
      </div>
    </div>
  );
}
