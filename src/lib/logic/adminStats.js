/**
 * Aggregates raw order/order-item/restaurant rows into the admin dashboard's
 * summary stats: total orders, orders this month, top 5 products, spend by
 * supplier, and order counts by restaurant.
 *
 * Extracted from orders.js (fetchAdminStats) so the aggregation logic can be
 * tested without a database round trip. `now` is injectable for testing
 * the "this month" filter deterministically.
 */
export function computeAdminStats(orderItems, orders, restaurants, now = new Date()) {
  const items = orderItems || [];
  const allOrders = orders || [];
  const allRestaurants = restaurants || [];

  const productCounts = {};
  const supplierSpend = {};
  for (const it of items) {
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
  for (const r of allRestaurants) restaurantNames[r.id] = r.name;
  const restaurantCounts = {};
  for (const o of allOrders) {
    const name = restaurantNames[o.restaurant_id] || '—';
    restaurantCounts[name] = (restaurantCounts[name] || 0) + 1;
  }
  const ordersByRestaurant = Object.entries(restaurantCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const thisMonth = allOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    totalOrders: allOrders.length,
    ordersThisMonth: thisMonth.length,
    topProducts,
    ordersByRestaurant,
    spendBySupplier,
  };
}
