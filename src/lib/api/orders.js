import { supabase } from '../supabaseClient';
import { notifyRestaurant } from './notifications';

/* ============================================================
   Orders & order items
   ============================================================ */

export async function fetchOrders(restaurantId = null) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  return { data: data || [], error };
}

export async function createOrder(restaurantId, items, userId, comment = '') {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ restaurant_id: restaurantId, status: 'En attente', created_by: userId, comment })
    .select()
    .single();
  if (orderError) return { error: orderError };

  const orderItems = items.map((it) => ({
    order_id: order.id,
    product_id: it.productId,
    name: it.name,
    unit: it.unit,
    qty: it.qty,
    comment: it.comment || '',
    unit_price: it.unitPrice || 0,
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  return { error: itemsError, data: order };
}

export async function updateOrderStatus(orderId, status, restaurantId) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (!error && restaurantId) {
    const messages = {
      'En préparation': 'Votre commande est en préparation.',
      'Livrée': 'Votre commande est livrée.',
    };
    if (messages[status]) await notifyRestaurant(restaurantId, messages[status]);
  }
  return { error };
}

export async function updateOrderDelivery(orderId, deliveryDate, deliveryWindow) {
  const { error } = await supabase
    .from('orders')
    .update({ delivery_date: deliveryDate, delivery_window: deliveryWindow })
    .eq('id', orderId);
  return { error };
}

/* ---------- Order statistics ("ordered X times", admin dashboard) ---------- */

export async function fetchOrderStats(restaurantId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, qty, order_id, orders!inner(restaurant_id, created_at)')
    .eq('orders.restaurant_id', restaurantId);
  if (error || !data) return { data: {}, error };

  const stats = {};
  for (const row of data) {
    if (!row.product_id) continue;
    if (!stats[row.product_id]) stats[row.product_id] = { count: 0, lastQty: null, lastDate: null };
    stats[row.product_id].count += 1;
    const orderDate = row.orders?.created_at;
    if (!stats[row.product_id].lastDate || new Date(orderDate) > new Date(stats[row.product_id].lastDate)) {
      stats[row.product_id].lastDate = orderDate;
      stats[row.product_id].lastQty = row.qty;
    }
  }
  return { data: stats, error: null };
}

export async function fetchAdminStats() {
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, name, qty, orders!inner(restaurant_id, status, created_at)');

  const { data: orders } = await supabase.from('orders').select('id, restaurant_id, status, created_at');

  const productCounts = {};
  for (const it of orderItems || []) {
    if (!it.name) continue;
    productCounts[it.name] = (productCounts[it.name] || 0) + 1;
  }
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const now = new Date();
  const thisMonth = (orders || []).filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    data: {
      totalOrders: (orders || []).length,
      ordersThisMonth: thisMonth.length,
      topProducts,
    },
    error: null,
  };
}
