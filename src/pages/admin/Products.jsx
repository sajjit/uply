import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Package, Info, Check, X } from 'lucide-react';
import * as api from '../../lib/api';
import { SectionHeader, inputStyle } from '../../components/shared';
import { useLanguage } from '../../i18n/LanguageContext';
import ImportInvoiceModal from './ImportInvoiceModal';
import ProductDetailModal from './ProductDetailModal';

export default function AdminProducts({ restaurants, products, suppliers, categories, onChange }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', restaurant_id: restaurants[0]?.id || '', brand: '', category: '', unit: '', supplier: '', price: '', photo: '📦' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showImport, setShowImport] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Default the "new product" category/supplier to the first entry once
  // those lists have loaded, instead of leaving the <select> blank/mismatched.
  useEffect(() => {
    if (!form.category && categories && categories.length > 0) {
      setForm((prev) => (prev.category ? prev : { ...prev, category: categories[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    if (!form.supplier && suppliers && suppliers.length > 0) {
      setForm((prev) => (prev.supplier ? prev : { ...prev, supplier: suppliers[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await api.createCategory(newCategoryName.trim());
    setNewCategoryName('');
    onChange();
  }

  function startEditCategory(c) {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
  }

  async function saveCategoryEdit() {
    if (!editingCategoryName.trim()) return;
    await api.updateCategory(editingCategoryId, editingCategoryName.trim());
    setEditingCategoryId(null);
    onChange();
  }

  async function removeCategory(c) {
    if (!window.confirm(t('confirmDeleteCategory'))) return;
    await api.deleteCategory(c.id);
    onChange();
  }

  // Trim + case-insensitive dedupe so near-duplicates from old free-text entry
  // (e.g. "Kg" vs "kg", "Unité" vs "Unité ") collapse into one suggestion.
  function dedupeTrimmed(values) {
    const map = new Map();
    for (const raw of values) {
      const v = (raw || '').trim();
      if (v && !map.has(v.toLowerCase())) map.set(v.toLowerCase(), v);
    }
    return Array.from(map.values());
  }

  const unitOptions = dedupeTrimmed(products.map((p) => p.unit));

  async function addProduct() {
    if (!form.name.trim() || !form.restaurant_id) return;
    await api.createProduct({ ...form, price: parseFloat(form.price) || 0, active: true, in_stock: true });
    setForm({ ...form, name: '', brand: '', category: '', unit: '', supplier: '', price: '' });
    onChange();
  }

  async function toggleActive(id, current) {
    await api.toggleProductActive(id, !current);
    onChange();
  }

  async function toggleStock(id, current) {
    await api.toggleProductStock(id, current === false ? true : false);
    onChange();
  }

  function startEdit(p) {
    setEditing(p.id);
    setEditForm({ name: p.name, brand: p.brand, category: p.category, unit: p.unit, supplier: p.supplier, price: p.price });
  }

  async function saveEdit() {
    await api.updateProduct(editing, { ...editForm, price: parseFloat(editForm.price) || 0 });
    setEditing(null);
    onChange();
  }

  async function removeProduct(id) {
    if (!window.confirm(t('confirmDeleteProduct'))) return;
    await api.deleteProduct(id);
    onChange();
  }

  return (
    <div>
      <SectionHeader title={t('manageProducts')} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: '1 1 260px', background: '#fff', border: '1.5px solid #0D0F0D', borderRadius: 8, padding: 14 }}>
          <div className="uply-mono" style={{ fontSize: 11, marginBottom: 10, color: '#576257' }}>{t('newProduct')}</div>
          <div className="uply-form-grid" style={{ marginBottom: 8 }}>
            <input placeholder={t('productNameShort')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <select value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })} style={inputStyle}>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input placeholder={t('brand')} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} style={inputStyle} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {(categories || []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input placeholder={t('unit')} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle} list="unit-options" />
            <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} style={inputStyle}>
              {(suppliers || []).length === 0 && <option value="">{t('noSuppliersYet')}</option>}
              {(suppliers || []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <input placeholder={t('price')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={addProduct} style={{ width: '100%', background: '#1FB9D6', color: '#fff', border: 'none', borderRadius: 6, padding: 10, fontWeight: 600 }}>
            + {t('addProduct')}
          </button>
          <button
            type="button"
            onClick={() => setShowCategoryManager((v) => !v)}
            style={{ width: '100%', background: 'none', border: 'none', color: '#576257', fontSize: 11, marginTop: 8, padding: 4, textDecoration: 'underline' }}
          >
            {showCategoryManager ? t('hideCategoryManager') : t('manageCategoriesLink')}
          </button>
          {showCategoryManager && (
            <div style={{ marginTop: 8, borderTop: '1px solid #E1E6E1', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  placeholder={t('newCategoryPlaceholder')}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addCategory} style={{ background: '#0D0F0D', color: '#fff', border: 'none', borderRadius: 6, padding: '0 14px', fontWeight: 600, fontSize: 12 }}>
                  + {t('add')}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(categories || []).map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F7F9F7', border: '1px solid #E1E6E1', borderRadius: 6, padding: '5px 8px' }}>
                    {editingCategoryId === c.id ? (
                      <>
                        <input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: 12 }}
                        />
                        <button onClick={saveCategoryEdit} style={{ background: 'none', border: 'none', color: '#5A9C3E', padding: 4 }}><Check size={14} /></button>
                        <button onClick={() => setEditingCategoryId(null)} style={{ background: 'none', border: 'none', color: '#8A938A', padding: 4 }}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 12 }}>{c.name}</span>
                        <button onClick={() => startEditCategory(c)} style={{ background: 'none', border: 'none', color: '#0D0F0D', padding: 4 }}><Pencil size={12} /></button>
                        <button onClick={() => removeCategory(c)} style={{ background: 'none', border: 'none', color: '#C0392B', padding: 4 }}><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <datalist id="unit-options">
            {unitOptions.map((u) => <option key={u} value={u} />)}
          </datalist>
        </div>
        <button
          onClick={() => setShowImport(true)}
          style={{ flex: '0 1 110px', minWidth: 110, background: '#fff', border: '1.5px dashed #8A938A', borderRadius: 8, padding: 10, color: '#576257', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}
        >
          <span style={{ fontSize: 20 }}>📄</span> {t('importInvoice')}
        </button>
      </div>

      {showImport && (
        <ImportInvoiceModal
          restaurants={restaurants}
          products={products}
          categories={categories}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); onChange(); }}
        />
      )}

      {(() => {
        const r = restaurants.find((x) => x.id === form.restaurant_id);
        const ps = products.filter((p) => p.restaurant_id === form.restaurant_id);
        if (!r) return null;
        return (
          <div style={{ marginBottom: 18 }}>
            <div className="uply-mono" style={{ fontSize: 11, color: '#576257', marginBottom: 8 }}>{r.name.toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ps.map((p) => {
                const isEditing = editing === p.id;
                const outOfStock = p.in_stock === false;
                if (isEditing) {
                  return (
                    <div key={p.id} style={{ background: '#EFFBE3', border: '1.5px solid #C9A227', borderRadius: 8, padding: 12 }}>
                      <div className="uply-form-grid" style={{ marginBottom: 8 }}>
                        <input placeholder={t('productNameShort')} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                        <input placeholder={t('brand')} value={editForm.brand || ''} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} style={inputStyle} />
                        <select value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                          {editForm.category && !(categories || []).some((c) => c.name === editForm.category) && (
                            <option value={editForm.category}>{editForm.category} ({t('legacyCategoryTag')})</option>
                          )}
                          {(categories || []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <input placeholder={t('unit')} value={editForm.unit || ''} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} style={inputStyle} list="unit-options" />
                        <select value={editForm.supplier || ''} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} style={inputStyle}>
                          {editForm.supplier && !(suppliers || []).some((s) => s.name === editForm.supplier) && (
                            <option value={editForm.supplier}>{editForm.supplier} ({t('legacyCategoryTag')})</option>
                          )}
                          {(suppliers || []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <input placeholder={t('price')} type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={saveEdit} style={{ flex: 1, background: '#5A9C3E', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, fontWeight: 600 }}>{t('save')}</button>
                        <button onClick={() => setEditing(null)} style={{ flex: 1, background: '#fff', border: '1px solid #CBD3CB', borderRadius: 6, padding: 8, fontSize: 12 }}>{t('cancel')}</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E1E6E1', borderRadius: 8, padding: 10, opacity: p.active ? 1 : 0.45 }}>
                    <div style={{ fontSize: 20 }}>{p.photo}</div>
                    <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                        {p.brand && <span className="uply-mono" style={{ fontSize: 10, color: '#576257' }}>({p.brand})</span>}
                        {outOfStock && <span className="uply-mono" style={{ fontSize: 9, background: '#C0392B', color: '#fff', padding: '2px 5px', borderRadius: 3, fontWeight: 700 }}>{t('outOfStock')}</span>}
                      </div>
                      <div className="uply-mono" style={{ fontSize: 10, color: '#8A938A' }}>{p.category} · {p.unit} · {p.price}€ · {p.supplier}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetailProduct(p)} title={t('viewDetails')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#0D0F0D' }}><Info size={13} /></button>
                      <button onClick={() => startEdit(p)} title={t('edit')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#0D0F0D' }}><Pencil size={13} /></button>
                      <button onClick={() => toggleStock(p.id, p.in_stock)} title="Rupture" style={{ background: outOfStock ? '#C0392B' : 'none', border: '1px solid ' + (outOfStock ? '#C0392B' : '#CBD3CB'), borderRadius: 4, padding: 6, color: outOfStock ? '#fff' : '#0D0F0D' }}><Package size={13} /></button>
                      <button onClick={() => toggleActive(p.id, p.active)} style={{ fontSize: 10, border: '1px solid #0D0F0D', background: p.active ? '#0D0F0D' : '#fff', color: p.active ? '#fff' : '#0D0F0D', borderRadius: 4, padding: '5px 7px' }}>
                        {p.active ? t('active') : t('inactive')}
                      </button>
                      <button onClick={() => removeProduct(p.id)} title={t('delete')} style={{ background: 'none', border: '1px solid #CBD3CB', borderRadius: 4, padding: 6, color: '#C0392B' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}
