import { supabase } from '../supabaseClient';
import { notifyRestaurant, notifyAdmins } from './notifications';
import { generatePurchaseOrderPdf } from '../pdf/generatePdf';
import { buildDeliveryRecapMessage } from '../logic/deliveryRecap';
import { computeAdminStats } from '../logic/adminStats';

/* ============================================================
   Orders & order items
   ============================================================ */

export async function fetchOrders(restaurantId = null) {
  // order_items has no natural sequence column (uuid primary key), so without
  // an explicit order the rows can come back in a different position after
  // any update to the row (Postgres doesn't guarantee physical row order) —
  // that showed up as an item's line "jumping" position whenever its
  // delivered qty was changed. Ordering by created_at keeps it stable.
  let query = supabase
    .from('orders')
    .select('*, order_items(*, products(supplier_ref))')
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'order_items', ascending: true })
    .order('id', { referencedTable: 'order_items', ascending: true });
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
    supplier_ref: it.supplierRef || null,
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

/**
 * Lets a client edit their own order while it's still "En attente" — replaces
 * the item list and updates the general comment. RLS only allows this while
 * the order hasn't moved to "En préparation" yet (see migration-v21), so a
 * write attempted after the admin locks it in simply fails silently there.
 */
export async function updateOrderItems(orderId, items, comment, restaurantName) {
  const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId);
  if (deleteError) return { error: deleteError };

  const orderItems = items.map((it) => ({
    order_id: orderId,
    product_id: it.productId,
    name: it.name,
    unit: it.unit,
    qty: it.qty,
    comment: it.comment || '',
    unit_price: it.unitPrice || 0,
    supplier_ref: it.supplierRef || null,
  }));
  const { error: insertError } = orderItems.length
    ? await supabase.from('order_items').insert(orderItems)
    : { error: null };
  if (insertError) return { error: insertError };

  const { error: commentError } = await supabase.from('orders').update({ comment }).eq('id', orderId);
  if (!commentError) {
    await notifyAdmins(`${restaurantName || 'Un restaurant'} a modifié sa commande.`);
  }
  return { error: commentError };
}

// Best-effort email alert (via the notify-order Edge Function / Resend) —
// never blocks order creation if it fails. Attaches the bon de commande PDF
// so the admin has it immediately without opening the app.
async function notifyOrderEmail(order, restaurantName, items) {
  try {
    const pdfBlob = await generatePurchaseOrderPdf({ ...order, order_items: items }, { name: restaurantName });
    const pdfBase64 = await blobToBase64(pdfBlob);
    await supabase.functions.invoke('notify-order', {
      body: { orderId: order.id, pdfBase64 },
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
    if (status === 'Livrée') {
      await notifyRestaurant(restaurantId, await buildDeliveryRecap(orderId));
    } else {
      const messages = {
        'En préparation': 'Votre commande est en préparation.',
        'En livraison': 'Votre commande est en cours de livraison.',
      };
      if (messages[status]) await notifyRestaurant(restaurantId, messages[status]);
    }
  }
  return { error };
}

// Fetches the delivered order's items and formats the recap message sent to
// the restaurant (the actual formatting logic lives in logic/deliveryRecap.js
// so it can be unit tested without a database round trip).
async function buildDeliveryRecap(orderId) {
  const { data: items } = await supabase
    .from('order_items')
    .select('name, qty, unit, prepared, delivered_qty')
    .eq('order_id', orderId);
  return buildDeliveryRecapMessage(items);
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  return { error };
}

export async function setOrderItemPrepared(itemId, prepared) {
  const { error } = await supabase.from('order_items').update({ prepared }).eq('id', itemId);
  return { error };
}

export async function setOrderItemDeliveredQty(itemId, deliveredQty) {
  const { error } = await supabase.from('order_items').update({ delivered_qty: deliveredQty }).eq('id', itemId);
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

  return { data: computeAdminStats(orderItems, orders, restaurants), error: null };
}
