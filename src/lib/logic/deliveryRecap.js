/**
 * Builds a text summary of what was actually delivered vs. ordered, based on
 * the prepared/delivered_qty state set on the admin's prep checklist —
 * delivered items, out-of-stock ones, and any quantity changes.
 *
 * Extracted from orders.js (buildDeliveryRecap) so the formatting logic can
 * be tested without a database round trip.
 */
export function buildDeliveryRecapMessage(items) {
  const rows = items || [];
  const delivered = rows.filter((i) => i.prepared);
  const outOfStock = rows.filter((i) => !i.prepared);
  const changed = delivered.filter((i) => i.delivered_qty != null && i.delivered_qty !== i.qty);

  let msg = 'Votre commande est livrée.';
  if (delivered.length) {
    msg += `\n✅ Livré : ${delivered.map((i) => `${i.name} (${i.delivered_qty ?? i.qty} ${i.unit || ''})`).join(', ')}`;
  }
  if (changed.length) {
    msg += `\n✏️ Quantité modifiée : ${changed.map((i) => `${i.name} (commandé ${i.qty}, livré ${i.delivered_qty})`).join(', ')}`;
  }
  if (outOfStock.length) {
    msg += `\n❌ En rupture : ${outOfStock.map((i) => i.name).join(', ')}`;
  }
  return msg;
}
