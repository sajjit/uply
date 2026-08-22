import { describe, it, expect } from 'vitest';
import { computeAdminStats } from './adminStats';

describe('computeAdminStats', () => {
  it('handles completely empty input without throwing', () => {
    const result = computeAdminStats([], [], []);
    expect(result).toEqual({
      totalOrders: 0,
      ordersThisMonth: 0,
      topProducts: [],
      ordersByRestaurant: [],
      spendBySupplier: [],
    });
  });

  it('handles null inputs the same as empty arrays', () => {
    const result = computeAdminStats(null, null, null);
    expect(result.totalOrders).toBe(0);
    expect(result.topProducts).toEqual([]);
  });

  it('counts product occurrences and returns only the top 5, sorted descending', () => {
    const orderItems = [
      ...Array(3).fill({ name: 'Tomates' }),
      ...Array(6).fill({ name: 'Oignons' }),
      ...Array(1).fill({ name: 'Ail' }),
      ...Array(2).fill({ name: 'Carottes' }),
      ...Array(4).fill({ name: 'Poireaux' }),
      ...Array(5).fill({ name: 'Salade' }),
    ];
    const { topProducts } = computeAdminStats(orderItems, [], []);
    expect(topProducts).toHaveLength(5);
    expect(topProducts[0]).toEqual({ name: 'Oignons', count: 6 });
    expect(topProducts).not.toContainEqual(expect.objectContaining({ name: 'Ail' }));
  });

  it('sums spend per supplier and falls back to "Non renseigné" when supplier is missing', () => {
    const orderItems = [
      { name: 'A', qty: 2, unit_price: 10, products: { supplier: 'Fournisseur X' } },
      { name: 'B', qty: 1, unit_price: 5, products: { supplier: 'Fournisseur X' } },
      { name: 'C', qty: 3, unit_price: 2, products: null },
    ];
    const { spendBySupplier } = computeAdminStats(orderItems, [], []);
    expect(spendBySupplier).toEqual([
      { supplier: 'Fournisseur X', total: 25 },
      { supplier: 'Non renseigné', total: 6 },
    ]);
  });

  it('treats a missing qty or unit_price as 0 rather than producing NaN', () => {
    const orderItems = [{ name: 'A', products: { supplier: 'X' } }];
    const { spendBySupplier } = computeAdminStats(orderItems, [], []);
    expect(spendBySupplier).toEqual([{ supplier: 'X', total: 0 }]);
  });

  it('counts orders by restaurant name and falls back to "—" for an unknown restaurant', () => {
    const restaurants = [{ id: 'r1', name: 'Chez Pierre' }];
    const orders = [
      { restaurant_id: 'r1', created_at: '2026-01-01' },
      { restaurant_id: 'r1', created_at: '2026-01-02' },
      { restaurant_id: 'unknown-id', created_at: '2026-01-03' },
    ];
    const { ordersByRestaurant, totalOrders } = computeAdminStats([], orders, restaurants);
    expect(totalOrders).toBe(3);
    expect(ordersByRestaurant).toEqual([
      { name: 'Chez Pierre', count: 2 },
      { name: '—', count: 1 },
    ]);
  });

  it('counts only orders created in the injected "now" month/year as "this month"', () => {
    const orders = [
      { restaurant_id: 'r1', created_at: '2026-03-15' },
      { restaurant_id: 'r1', created_at: '2026-03-01' },
      { restaurant_id: 'r1', created_at: '2026-02-28' },
      { restaurant_id: 'r1', created_at: '2025-03-15' },
    ];
    const { ordersThisMonth } = computeAdminStats([], orders, [], new Date('2026-03-20'));
    expect(ordersThisMonth).toBe(2);
  });
});
