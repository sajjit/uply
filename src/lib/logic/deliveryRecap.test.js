import { describe, it, expect } from 'vitest';
import { buildDeliveryRecapMessage } from './deliveryRecap';

describe('buildDeliveryRecapMessage', () => {
  it('returns just the base message when there are no items', () => {
    expect(buildDeliveryRecapMessage([])).toBe('Votre commande est livrée.');
    expect(buildDeliveryRecapMessage(null)).toBe('Votre commande est livrée.');
  });

  it('lists delivered items using the ordered quantity when delivered_qty is not set', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Tomates', qty: 5, unit: 'kg', prepared: true, delivered_qty: null },
    ]);
    expect(msg).toContain('✅ Livré : Tomates (5 kg)');
    expect(msg).not.toContain('Quantité modifiée');
    expect(msg).not.toContain('En rupture');
  });

  it('flags a quantity change only when delivered_qty differs from the ordered qty', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Oignons', qty: 10, unit: 'kg', prepared: true, delivered_qty: 7 },
    ]);
    expect(msg).toContain('✅ Livré : Oignons (7 kg)');
    expect(msg).toContain('✏️ Quantité modifiée : Oignons (commandé 10, livré 7)');
  });

  it('does not flag a quantity change when delivered_qty equals the ordered qty', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Carottes', qty: 3, unit: 'kg', prepared: true, delivered_qty: 3 },
    ]);
    expect(msg).not.toContain('Quantité modifiée');
  });

  it('lists unprepared items as out of stock, separate from delivered items', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Salade', qty: 2, unit: 'kg', prepared: false, delivered_qty: null },
    ]);
    expect(msg).toContain('❌ En rupture : Salade');
    expect(msg).not.toContain('✅ Livré');
  });

  it('handles a mixed order: delivered as-is, quantity changed, and out of stock together', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Pommes', qty: 4, unit: 'kg', prepared: true, delivered_qty: null },
      { name: 'Poires', qty: 6, unit: 'kg', prepared: true, delivered_qty: 4 },
      { name: 'Fraises', qty: 1, unit: 'kg', prepared: false, delivered_qty: null },
    ]);
    expect(msg).toContain('✅ Livré : Pommes (4 kg), Poires (4 kg)');
    expect(msg).toContain('✏️ Quantité modifiée : Poires (commandé 6, livré 4)');
    expect(msg).toContain('❌ En rupture : Fraises');
  });

  it('treats delivered_qty of 0 as a real change, not a missing value', () => {
    const msg = buildDeliveryRecapMessage([
      { name: 'Citrons', qty: 2, unit: 'kg', prepared: true, delivered_qty: 0 },
    ]);
    expect(msg).toContain('✏️ Quantité modifiée : Citrons (commandé 2, livré 0)');
    expect(msg).toContain('✅ Livré : Citrons (0 kg)');
  });
});
