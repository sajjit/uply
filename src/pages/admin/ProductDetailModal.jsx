import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import * as api from '../../lib/api';
import { PrimaryButton, inputStyle, fmtDate } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProductDetailModal({ product, onClose }) {
  const { t } = useLanguage();
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [linkedSupplierIds, setLinkedSupplierIds] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [product.id]);

  async function load() {
    setLoading(true);
    const [{ data: suppliers }, { data: linked }, { data: history }] = await Promise.all([
      api.fetchSuppliers(),
      api.fetchProductSuppliers(product.id),
      api.fetchPriceHistory(product.id),
    ]);
    setAllSuppliers(suppliers);
    setLinkedSupplierIds((linked || []).map((s) => s.id));
    setPriceHistory(history);
    setLoading(false);
  }

  async function toggleSupplier(supplierId) {
    const next = linkedSupplierIds.includes(supplierId)
      ? linkedSupplierIds.filter((id) => id !== supplierId)
      : [...linkedSupplierIds, supplierId];
    setLinkedSupplierIds(next);
    setSaving(true);
    await api.setProductSuppliers(product.id, next);
    setSaving(false);
  }

  async function addNewSupplier() {
    if (!newSupplierName.trim()) return;
    const { data } = await api.createSupplier(newSupplierName.trim());
    setNewSupplierName('');
    if (data) {
      setAllSuppliers((prev) => [...prev, data]);
      await toggleSupplier(data.id);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,29,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="uply-display" style={{ fontSize: 18, fontWeight: 700 }}>{product.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4 }}><X size={18} /></button>
        </div>
        <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 18 }}>
          {t('currentPrice')}: {product.price}€ · {product.unit}
        </div>

        {loading ? (
          <div className="uply-mono" style={{ color: '#8A938A', fontSize: 12 }}>{t('loading')}</div>
        ) : (
          <>
            <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{t('suppliersSection')}</div>
            {allSuppliers.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8A938A', marginBottom: 10 }}>{t('noSuppliersYet')}</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {allSuppliers.map((s) => {
                  const linked = linkedSupplierIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSupplier(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '6px 10px', borderRadius: 20,
                        border: '1.5px solid ' + (linked ? '#0D0F0D' : '#CBD3CB'),
                        background: linked ? '#0D0F0D' : '#fff', color: linked ? '#fff' : '#0D0F0D', fontWeight: 600,
                      }}
                    >
                      {linked && <Check size={12} />} {s.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <input
                placeholder={t('newSupplierPlaceholder')}
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && addNewSupplier()}
              />
              <button onClick={addNewSupplier} style={{ background: '#0D0F0D', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                <Plus size={14} />
              </button>
            </div>

            <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{t('priceHistorySection')}</div>
            {priceHistory.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8A938A' }}>{t('noPriceHistory')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {priceHistory.map((h) => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f0eee8' }}>
                    <span className="uply-mono" style={{ color: '#8A938A' }}>{fmtDate(h.recorded_at)}</span>
                    <span style={{ fontWeight: 600 }}>{h.price}€</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
