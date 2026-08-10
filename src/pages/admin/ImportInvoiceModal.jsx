import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import * as api from '../../lib/api';
import { PrimaryButton, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ImportInvoiceModal({ restaurants, products, categories, onClose, onDone }) {
  const { t } = useLanguage();
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id || '');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const defaultCategory = categories?.[0]?.name || '';
  const [rows, setRows] = useState([{ name: '', category: defaultCategory, unit: 'kg', price: '', supplierRef: '' }]);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  function updateRow(i, field, value) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: '', category: defaultCategory, unit: 'kg', price: '', supplierRef: '' }]);
  }

  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function existingMatch(name) {
    const restaurantProducts = products.filter((p) => p.restaurant_id === restaurantId);
    return restaurantProducts.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  function goToReview() {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0 || !restaurantId) return;
    setReviewing(true);
  }

  async function finalize(decisions) {
    setBusy(true);
    const validRows = rows.filter((r) => r.name.trim());
    for (const r of validRows) {
      const match = existingMatch(r.name);
      const decision = decisions[r.name] || 'create';
      if (match && decision === 'update') {
        await api.updateProduct(match.id, {
          category: r.category.trim() || match.category,
          unit: r.unit.trim() || match.unit,
          supplier: supplier.trim() || match.supplier,
          supplier_ref: r.supplierRef.trim() || match.supplier_ref,
          price: r.price ? parseFloat(r.price) : match.price,
        });
      } else if (match && decision === 'ignore') {
        continue;
      } else {
        await api.createProduct({
          restaurant_id: restaurantId,
          name: r.name.trim(),
          category: r.category.trim() || 'Non classé',
          unit: r.unit.trim() || 'unité',
          supplier: supplier.trim() || '—',
          supplier_ref: r.supplierRef.trim() || null,
          price: parseFloat(r.price) || 0,
          photo: '📦',
          active: true,
          in_stock: true,
        });
      }
    }
    setBusy(false);
    onDone();
  }

  if (reviewing) {
    return (
      <ImportReviewStep
        rows={rows.filter((r) => r.name.trim())}
        existingMatch={existingMatch}
        onBack={() => setReviewing(false)}
        onConfirm={finalize}
        busy={busy}
      />
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,29,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="uply-display" style={{ fontSize: 18, fontWeight: 700 }}>{t('importInvoiceTitle')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: '#576257', marginBottom: 16 }}>{t('importInvoiceDesc')}</div>

        <div className="uply-form-grid" style={{ marginBottom: 8 }}>
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} style={inputStyle}>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input placeholder={t('supplier')} value={supplier} onChange={(e) => setSupplier(e.target.value)} style={inputStyle} />
        </div>
        <input
          placeholder={t('invoiceNumberOptional')}
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          style={{ ...inputStyle, width: '100%', marginBottom: 14 }}
        />

        <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{t('invoiceLineItems')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <input placeholder={t('productNameShort')} value={row.name} onChange={(e) => updateRow(i, 'name', e.target.value)} style={{ ...inputStyle, flex: '2 1 140px' }} />
              <select value={row.category} onChange={(e) => updateRow(i, 'category', e.target.value)} style={{ ...inputStyle, flex: '1 1 90px' }}>
                {(categories || []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input placeholder={t('unit')} value={row.unit} onChange={(e) => updateRow(i, 'unit', e.target.value)} style={{ ...inputStyle, flex: '0 1 60px' }} />
              <input placeholder={t('price')} type="number" value={row.price} onChange={(e) => updateRow(i, 'price', e.target.value)} style={{ ...inputStyle, flex: '0 1 70px' }} />
              <input placeholder={t('supplierRef')} value={row.supplierRef} onChange={(e) => updateRow(i, 'supplierRef', e.target.value)} style={{ ...inputStyle, flex: '1 1 90px' }} />
              <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#C0392B', padding: 4, flexShrink: 0 }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button onClick={addRow} style={{ width: '100%', background: 'none', border: '1.5px dashed #8A938A', borderRadius: 6, padding: 10, color: '#576257', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={14} /> {t('addLine')}
        </button>

        <PrimaryButton onClick={goToReview}>{t('continue')}</PrimaryButton>
      </div>
    </div>
  );
}

function ImportReviewStep({ rows, existingMatch, onBack, onConfirm, busy }) {
  const { t } = useLanguage();
  const [decisions, setDecisions] = useState(() => {
    const initial = {};
    for (const r of rows) {
      initial[r.name] = existingMatch(r.name) ? 'update' : 'create';
    }
    return initial;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,29,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="uply-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t('reviewTitle')}</div>
        <div style={{ fontSize: 12, color: '#576257', marginBottom: 16 }}>{t('reviewDesc')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {rows.map((r, i) => {
            const match = existingMatch(r.name);
            return (
              <div key={i} style={{ background: '#fff', border: '1.5px solid ' + (match ? '#C9A227' : '#E1E6E1'), borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                {match ? (
                  <>
                    <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A', marginBottom: 8 }}>
                      ⚠️ {t('alreadyExists')} ({match.price}€)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { id: 'update', label: t('update') },
                        { id: 'ignore', label: t('ignore') },
                        { id: 'create', label: t('createNew') },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setDecisions((prev) => ({ ...prev, [r.name]: opt.id }))}
                          style={{
                            flex: 1, fontSize: 10, padding: '6px 4px', borderRadius: 4, fontWeight: 600,
                            border: '1.5px solid ' + (decisions[r.name] === opt.id ? '#0D0F0D' : '#E1E6E1'),
                            background: decisions[r.name] === opt.id ? '#0D0F0D' : '#fff',
                            color: decisions[r.name] === opt.id ? '#fff' : '#0D0F0D',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="uply-mono" style={{ fontSize: 10, color: '#5A9C3E' }}>✓ {t('newProductTag')}</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onBack} style={{ flex: 1, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 12, fontSize: 13 }}>{t('back')}</button>
          <div style={{ flex: 2 }}>
            <PrimaryButton onClick={() => onConfirm(decisions)} disabled={busy}>
              {busy ? t('importing') : t('confirmImport')}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
