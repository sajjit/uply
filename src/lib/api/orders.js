import { supabase } from '../supabaseClient';
import { notifyRestaurant, notifyAdmins } from './notifications';
import { generatePurchaseOrderPdf } from '../pdf/generatePdf';

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

/**
 * @param {boolean} skipAdminNotify - true when the admin is placing this order
 * themselves (e.g. taking an order in person at a restaurant) — no point
 * notifying/emailing the admin about an order they just entered.
 */
export async function createOrder(restaurantId, items, userId, comment = '', restaurantName = '', skipAdminNotify = false) {
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
  if (!itemsError) {
    await notifyRestaurant(restaurantId, 'Votre commande a été validée.');
    if (!skipAdminNotify) {
      await notifyAdmins(`Nouvelle commande reçue de ${restaurantName || 'un restaurant'}.`);
      await notifyOrderEmail(order, restaurantName, items);
    }
  }
  return { error: itemsError, data: order };
}

// Best-effort email alert (via the notify-order Edge Function / Resend) —
// never blocks order creation if it fails. Attaches the bon de commande PDF
// so the admin has it immediately without opening the app.
async function notifyOrderEmail(order, restaurantName, items) {
  try {
    const itemsSummary = items.map((it) => `${it.name} (${it.qty} ${it.unit || ''})`).join('<br/>');
    const pdfBlob = await generatePurchaseOrderPdf({ ...order, order_items: items }, { name: restaurantName });
    const pdfBase64 = await blobToBase64(pdfBlob);
    await supabase.functions.invoke('notify-order', {
      body: { orderId: order.id, restaurantName, itemsSummary, pdfBase64 },
    });
  } catch {
    // ignore — email delivery is not critical to placing the order
  }
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function updateOrderStatus(orderId, status, restaurantId) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (!error && restaurantId) {
    const messages = {
      'En préparation': 'Votre commande est en préparation.',
      'En livraison': 'Votre commande est en cours de livraison.',
      'Livrée': 'Votre commande est livrée.',
    };
    if (messages[status]) await notifyRestaurant(restaurantId, messages[status]);
  }
  return { error };
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  return { error };
}

export async function setOrderItemPrepared(itemId, prepared) {
  const { error } = await supabase.from('order_items').update({ prepared }).eq('id', itemId);
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
    .select('product_id, name, qty, unit_price, orders!inner(restaurant_id, status, created_at), products(supplier)');

  const { data: orders } = await supabase.from('orders').select('id, restaurant_id, status, created_at');
  const { data: restaurants } = await supabase.from('restaurants').select('id, name');

  const productCounts = {};
  const supplierSpend = {};
  for (const it of orderItems || []) {
    if (it.name) productCounts[it.name] = (productCounts[it.name] || 0) + 1;
    const supplierName = it.products?.supplier || 'Non renseigné';
    const lineTotal = (it.qty || 0) * (it.unit_price || 0);
    supplierSpend[supplierName] = (supplierSpend[supplierName] || 0) + lineTotal;
  }
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const spendBySupplier = Object.entries(supplierSpend)
    .sort((a, b) => b[1] - a[1])
    .map(([supplier, total]) => ({ supplier, total }));

  const restaurantNames = {};
  for (const r of restaurants || []) restaurantNames[r.id] = r.name;
  const restaurantCounts = {};
  for (const o of orders || []) {
    const name = restaurantNames[o.restaurant_id] || '—';
    restaurantCounts[name] = (restaurantCounts[name] || 0) + 1;
  }
  const ordersByRestaurant = Object.entries(restaurantCounts)
    .sort((a, b) => b[1] - a[1])
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
      ordersByRestaurant,
      spendBySupplier,
    },
    error: null,
  };
}
