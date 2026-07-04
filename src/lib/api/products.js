import { supabase } from '../supabaseClient';

/* ============================================================
   Products, suppliers, and price history
   ============================================================ */

export async function fetchProducts(restaurantId = null) {
  let query = supabase.from('products').select('*').order('category').order('name');
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  return { data: data || [], error };
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

/* ---------- Suppliers (many-to-many with products) ---------- */

export async function fetchSuppliers(restaurantId = null) {
  let query = supabase.from('suppliers').select('*').order('name');
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  return { data: data || [], error };
}

export async function createSupplier(restaurantId, name) {
  const { data, error } = await supabase.from('suppliers').insert({ restaurant_id: restaurantId, name }).select().single();
  return { data, error };
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
