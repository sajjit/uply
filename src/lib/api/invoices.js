import { supabase } from '../supabaseClient';
import { notifyRestaurant } from './notifications';

/* ============================================================
   Invoices & purchase orders (PDF storage + delivery)
   ============================================================ */

const BUCKET = 'invoices';

/**
 * Uploads a generated invoice PDF to Supabase Storage and links it to the order.
 * Path convention: invoices/{restaurant_id}/{order_id}.pdf
 * (the RLS policies in migration-v4.sql rely on this exact path shape)
 */
export async function uploadInvoice(orderId, restaurantId, pdfBlob) {
  const path = `${restaurantId}/${orderId}.pdf`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, pdfBlob, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (uploadError) return { error: uploadError };

  // Bucket is private, so we store the path (not a public URL) and generate
  // a fresh signed URL each time someone needs to view it (see getInvoiceUrl below).
  const invoiceNumber = `INV-${orderId.slice(0, 8).toUpperCase()}`;
  const { error: updateError } = await supabase
    .from('orders')
    .update({ invoice_url: path, invoice_number: invoiceNumber })
    .eq('id', orderId);

  if (!updateError) {
    await notifyRestaurant(restaurantId, 'Facture disponible.');
  }

  return { data: { path, invoiceNumber }, error: updateError };
}

/**
 * Generates a temporary signed URL (valid 1 hour) to view/download a private
 * invoice PDF. `storedPath` is what's saved in orders.invoice_url (e.g. "restaurantId/orderId.pdf").
 */
export async function getInvoiceUrl(storedPath) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storedPath, 60 * 60);
  if (error) return { url: null, error };
  return { url: data.signedUrl, error: null };
}

/** Marks an order as having had its purchase order sent (no storage needed — it's regenerated on demand). */
export async function markPurchaseOrderSent(orderId) {
  const { error } = await supabase.from('orders').update({ purchase_order_sent: true }).eq('id', orderId);
  return { error };
}

/** Fetches all orders for a restaurant that have an invoice attached — powers "Mes factures". */
export async function fetchInvoices(restaurantId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, invoice_number, invoice_url, status')
    .eq('restaurant_id', restaurantId)
    .not('invoice_url', 'is', null)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}
