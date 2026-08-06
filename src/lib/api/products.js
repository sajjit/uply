import { supabase } from '../supabaseClient';
import { notifyAdmins } from './notifications';

/* ============================================================
   Products, suppliers, and price history
   ============================================================ */

export async function fetchProducts(restaurantId = null) {
  let query = supabase.from('products').select('*').order('category').order('name');
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Lets a client add a product straight to their own restaurant's catalog
 * (no admin approval needed) — the admin still gets notified so they can set
 * a real price/category/supplier, since it's created as a placeholder.
 */
export async function selfAddProduct(restaurantId, name, comment, restaurantName) {
  const { data, error } = await createProduct({
    restaurant_id: restaurantId,
    name,
    category: 'Non classé',
    unit: 'unité',
    supplier: '—',
    price: 0,
    photo: '📦',
    active: true,
    in_stock: true,
  });
  if (!error) {
    const suffix = comment ? ` (${comment})` : '';
    await notifyAdmins(`${restaurantName || 'Un restaurant'} a ajouté un nouveau produit : ${name}${suffix} — pense à vérifier le prix et la catégorie.`);
  }
  return { data, error };
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  return { data, error };
}

export async function updateProduct(id, updates) {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  return { error };
}

export async function toggleProductActive(id, active) {
  const { error } = await supabase.from('products').update({ active }).eq('id', id);
  return { error };
}

export async function toggleProductStock(id, inStock) {
  const { error } = await supabase.from('products').update({ in_stock: inStock }).eq('id', id);
  return { error };
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error };
}

/* ---------- Suppliers (global list, many-to-many with restaurants and products) ---------- */

export async function fetchSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  return { data: data || [], error };
}

export async function createSupplier(supplier) {
  const payload = typeof supplier === 'string' ? { name: supplier } : supplier;
  const { data, error } = await supabase.from('suppliers').insert(payload).select().single();
  return { data, error };
}

export async function updateSupplier(id, updates) {
  const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
  return { error };
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  return { error };
}

export async function fetchProductSuppliers(productId) {
  const { data, error } = await supabase
    .from('product_suppliers')
    .select('supplier_id, suppliers(*)')
    .eq('product_id', productId);
  return { data: (data || []).map((row) => row.suppliers), error };
}

export async function setProductSuppliers(productId, supplierIds) {
  await supabase.from('product_suppliers').delete().eq('product_id', productId);
  if (supplierIds.length === 0) return { error: null };
  const rows = supplierIds.map((sid) => ({ product_id: productId, supplier_id: sid }));
  const { error } = await supabase.from('product_suppliers').insert(rows);
  return { error };
}

/* ---------- Restaurant <-> supplier links (many-to-many) ---------- */

export async function fetchRestaurantSuppliers() {
  const { data, error } = await supabase.from('restaurant_suppliers').select('restaurant_id, supplier_id');
  return { data: data || [], error };
}

export async function setRestaurantSuppliers(restaurantId, supplierIds) {
  await supabase.from('restaurant_suppliers').delete().eq('restaurant_id', restaurantId);
  if (supplierIds.length === 0) return { error: null };
  const rows = supplierIds.map((sid) => ({ restaurant_id: restaurantId, supplier_id: sid }));
  const { error } = await supabase.from('restaurant_suppliers').insert(rows);
  return { error };
}

/* ---------- Categories (fixed, admin-managed list) ---------- */

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  return { data: data || [], error };
}

export async function createCategory(name) {
  const { data, error } = await supabase.from('categories').insert({ name }).select().single();
  return { data, error };
}

export async function updateCategory(id, name) {
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  return { error };
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { error };
}

/* ---------- Price history ----------
   A database trigger automatically logs the OLD price to price_history
   whenever a product's price is updated — see migration-v3.sql. */

export async function fetchPriceHistory(productId) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: false });
  return { data: data || [], error };
}

/* ---------- Product requests (client-submitted "I can't find this" suggestions) ---------- */

export async function fetchProductRequests(restaurantId = null) {
  let query = supabase.from('product_requests').select('*').order('created_at', { ascending: false });
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  return { data: data || [], error };
}

export async function createProductRequest(restaurantId, name, comment, userId) {
  const { error } = await supabase.from('product_requests').insert({
    restaurant_id: restaurantId, name, comment, created_by: userId, status: 'En attente',
  });
  return { error };
}

export async function updateProductRequestStatus(requestId, status, requestData, notifyRestaurantFn) {
  const { error } = await supabase.from('product_requests').update({ status }).eq('id', requestId);
  if (!error && status === 'Validée' && requestData) {
    await createProduct({
      restaurant_id: requestData.restaurant_id,
      name: requestData.name,
      category: 'Non classé',
      unit: 'unité',
      supplier: '—',
      price: 0,
      photo: '📦',
      active: true,
      in_stock: true,
    });
    if (notifyRestaurantFn) {
      await notifyRestaurantFn(requestData.restaurant_id, `Nouveau produit validé : ${requestData.name}`);
    }
  }
  return { error };
}
