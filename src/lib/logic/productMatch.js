/**
 * Finds an existing product for the given restaurant whose name matches
 * (case-insensitive, trimmed) — powers the "this looks like a duplicate"
 * warning in the invoice import flow.
 *
 * Extracted from ImportInvoiceModal.jsx (existingMatch) so the matching
 * logic can be tested without rendering the component.
 */
export function findExistingProduct(products, restaurantId, name) {
  const normalized = name.trim().toLowerCase();
  return (products || []).find(
    (p) => p.restaurant_id === restaurantId && p.name.trim().toLowerCase() === normalized
  );
}
