import { describe, it, expect } from 'vitest';
import { findExistingProduct } from './productMatch';

const products = [
  { id: 'p1', restaurant_id: 'r1', name: 'Tomates' },
  { id: 'p2', restaurant_id: 'r1', name: ' Oignons Rouges ' },
  { id: 'p3', restaurant_id: 'r2', name: 'Tomates' },
];

describe('findExistingProduct', () => {
  it('finds an exact name match within the given restaurant', () => {
    expect(findExistingProduct(products, 'r1', 'Tomates')).toEqual(products[0]);
  });

  it('matches case-insensitively', () => {
    expect(findExistingProduct(products, 'r1', 'tomates')).toEqual(products[0]);
    expect(findExistingProduct(products, 'r1', 'TOMATES')).toEqual(products[0]);
  });

  it('matches ignoring leading/trailing whitespace on both sides', () => {
    expect(findExistingProduct(products, 'r1', '  oignons rouges  ')).toEqual(products[1]);
    expect(findExistingProduct(products, 'r1', 'Oignons Rouges')).toEqual(products[1]);
  });

  it('never matches a product belonging to a different restaurant', () => {
    // "Tomates" exists for r2, but we're checking against r1's product list scope
    expect(findExistingProduct(products, 'r1', 'Tomates')?.id).toBe('p1');
    expect(findExistingProduct(products, 'r2', 'Tomates')?.id).toBe('p3');
    expect(findExistingProduct(products, 'r3', 'Tomates')).toBeUndefined();
  });

  it('returns undefined when there is no match', () => {
    expect(findExistingProduct(products, 'r1', 'Courgettes')).toBeUndefined();
  });

  it('handles an empty or missing product list without throwing', () => {
    expect(findExistingProduct([], 'r1', 'Tomates')).toBeUndefined();
    expect(findExistingProduct(null, 'r1', 'Tomates')).toBeUndefined();
  });
});
