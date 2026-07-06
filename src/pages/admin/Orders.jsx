import React, { useState, useMemo } from 'react';
import { ClipboardList, Calendar, FileText, Download, Truck, Filter } from 'lucide-react';
import * as api from '../../lib/api';
import { generateInvoicePdf, generatePurchaseOrderPdf, generateDeliveryNotePdf, downloadPdf } from '../../lib/pdf/generatePdf';
import { SectionHeader, EmptyState, StatusTab, STATUS_FR_VALUES, fmtDate, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminOrders({ orders, restaurants, onChange }) {
  const { t } = useLanguage();
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ date: '', window: '' });
  const [sendingInvoice, setSendingInvoice] = useState(null);
  const [filterRestaurant, setFilterRestaurant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterRestaurant !== 'all' && o.restaurant_id !== filterRestaurant) return false;
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      const created = new Date(o.created_at);
      if (filterFrom && created < new Date(filterFrom)) return false;
      if (filterTo && created > new Date(filterTo + 'T23:59:59')) return false;
      return true;
    });
  }, [orders, filterRestaurant, filterStatus, filterFrom, filterTo]);

  async function setStatus(id, status, restaurantId) {
    await api.updateOrderStatus(id, status, restaurantId);
    onChange();
  }

  function startDelivery(o) {
    setEditingDelivery(o.id);
    setDeliveryForm({ date: o.delivery_date || '', window: o.delivery_window || '' });
  }

  async function saveDelivery() {
    await api.updateOrderDelivery(editingDelivery, deliveryForm.date || null, deliveryForm.window || null);
    setEditingDelivery(null);
    onChange();
  }

  async function sendInvoice(order, restaurant) {
    setSendingInvoice(order.id);
    try {
      const blob = await generateInvoicePdf(order, restaurant);
      await api.uploadInvoice(order.id, order.restaurant_id, blob);
      onChange();
    } finally {
      setSendingInvoice(null);
    }
  }

  async function downloadPurchaseOrder(order, restaurant) {
    const blob = await generatePurchaseOrderPdf(order, restaurant);
    downloadPdf(blob, `bon-de-commande-${order.id.slice(0, 8)}.pdf`);
    await api.markPurchaseOrderSent(order.id);
  }

  async function downloadDeliveryNote(order, restaurant) {
    const blob = await generateDeliveryNotePdf(order, restaurant);
    downloadPdf(blob, `bon-de-livraison-${order.id.slice(0, 8)}.pdf`);
  }

  return (
    <div>
      <SectionHeader title={t('allOrders')} />

      <div style={{ background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={12} /> {t('filters')}
        </div>
        <div className="uply-form-grid" style={{ marginBottom: 8 }}>
          <select value={filterRestaurant} onChange={(e) => setFilterRestaurant(e.target.value)} style={inputStyle}>
            <option value="all">{t('allRestaurants')}</option>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
            <option value="all">{t('allStatuses')}</option>
            {STATUS_FR_VALUES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={inputStyle} />
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState icon={<ClipboardList size={32} />} title={t('noOrders')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredOrders.map((o) => {
            const restaurant = restaurants.find((r) => r.id === o.restaurant_id);
            return (
              <div key={o.id} style={{ background: '#fff', border: '1.5px solid #E1E6E1', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{restaurant?.name}</div>
                    <div className="uply-mono" style={{ fontSize: 11, color: '#8A938A' }}>{fmtDate(o.created_at)}</div>
                  </div>
                  <StatusTab status={o.status} />
                </div>
                <div style={{ fontSize: 12, color: '#576257', marginBottom: 10 }}>
                  {(o.order_items || []).map((it) => `${it.name} (${it.qty} ${it.unit})`).join(', ')}
                </div>
                {o.comment && <div style={{ fontSize: 12, color: '#576257', marginBottom: 10, background: '#F7F9F7', padding: 8, borderRadius: 6 }}>💬 {o.comment}</div>}

                {editingDelivery === o.id ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                    <input type="date" value={deliveryForm.date} onChange={(e) => setDeliveryForm({ ...deliveryForm, date: e.target.value })} style={{ ...inputStyle, flex: '1 1 140px' }} />
                    <input placeholder={t('deliveryWindowPlaceholder')} value={deliveryForm.window} onChange={(e) => setDeliveryForm({ ...deliveryForm, window: e.target.value })} style={{ ...inputStyle, flex: '1 1 100px' }} />
                    <button onClick={saveDelivery} style={{ background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 10px', fontSize: 11, fontWeight: 600 }}>OK</button>
                  </div>
                ) : (
                  <button onClick={() => startDelivery(o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: '1px dashed #8A938A', borderRadius: 6, padding: 7, fontSize: 11, color: '#576257', marginBottom: 10 }}>
                    <Calendar size={12} />
                    {o.delivery_date
                      ? `${new Date(o.delivery_date).toLocaleDateString('fr-FR')}${o.delivery_window ? ' · ' + o.delivery_window : ''}`
                      : t('setDeliveryDate')}
                  </button>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {STATUS_FR_VALUES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatus(o.id, st, o.restaurant_id)}
                      style={{
                        flex: '1 1 70px', fontSize: 11, padding: '6px 4px', borderRadius: 4, fontWeight: 600,
                        border: '1.5px solid ' + (o.status === st ? '#0D0F0D' : '#E1E6E1'),
                        background: o.status === st ? '#0D0F0D' : '#fff',
                        color: o.status === st ? '#fff' : '#0D0F0D',
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    onClick={() => downloadPurchaseOrder(o, restaurant || {})}
                    style={{ flex: '1 1 130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 11, fontWeight: 600, color: '#0D0F0D' }}
                  >
                    <Download size={13} /> Bon de commande
                  </button>
                  <button
                    onClick={() => downloadDeliveryNote(o, restaurant || {})}
                    style={{ flex: '1 1 130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 11, fontWeight: 600, color: '#0D0F0D' }}
                  >
                    <Truck size={13} /> Bon de livraison
                  </button>
                  {o.status === 'Livrée' && (
                    <button
                      onClick={() => sendInvoice(o, restaurant || {})}
                      disabled={sendingInvoice === o.id}
                      style={{ flex: '1 1 130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: o.invoice_url ? '#5A9C3E' : '#1FB9D6', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 11, fontWeight: 600 }}
                    >
                      <FileText size={13} /> {sendingInvoice === o.id ? 'Envoi…' : o.invoice_url ? 'Facture envoyée ✓' : 'Envoyer la facture'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
