import { describe, expect, it } from 'vitest';
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_ITEMS,
  MAX_NAME_LENGTH,
  itemsSubtotalCents,
  orderTotalCents,
  validateOrderInput,
} from './order-rules';

const line = { name: 'Desk lamp', quantity: 1, unitPriceCents: 2500 };
const valid = { name: 'Desk lamp', discountPercent: 10, items: [line] };

describe('validateOrderInput', () => {
  it('accepts a valid order', () => {
    expect(validateOrderInput(valid)).toEqual({});
  });

  it('rejects a blank name', () => {
    expect(validateOrderInput({ ...valid, name: '   ' }).name).toBe('validation.nameRequired');
  });

  it('accepts a name at the length limit and rejects one past it', () => {
    expect(validateOrderInput({ ...valid, name: 'a'.repeat(MAX_NAME_LENGTH) }).name).toBeUndefined();
    expect(validateOrderInput({ ...valid, name: 'a'.repeat(MAX_NAME_LENGTH + 1) }).name).toBe(
      'validation.nameTooLong',
    );
  });

  it('keeps the discount between 0 and 50 percent', () => {
    expect(validateOrderInput({ ...valid, discountPercent: 50 }).discountPercent).toBeUndefined();
    expect(validateOrderInput({ ...valid, discountPercent: 51 }).discountPercent).toBe('validation.discountRange');
    expect(validateOrderInput({ ...valid, discountPercent: -1 }).discountPercent).toBe('validation.discountRange');
  });

  it('requires between 1 and 20 lines', () => {
    expect(validateOrderInput({ ...valid, items: [] }).items).toBe('validation.itemsRequired');
    expect(validateOrderInput({ ...valid, items: Array(MAX_ITEMS).fill(line) }).items).toBeUndefined();
    expect(validateOrderInput({ ...valid, items: Array(MAX_ITEMS + 1).fill(line) }).items).toBe(
      'validation.itemsTooMany',
    );
  });

  it('checks each line', () => {
    const errors = validateOrderInput({
      ...valid,
      items: [
        { name: 'p'.repeat(MAX_ITEM_NAME_LENGTH + 1), quantity: 0, unitPriceCents: 10.5 },
        { name: 'Cable', quantity: 1000, unitPriceCents: 100 },
      ],
    });
    expect(errors).toEqual({
      'items.0.name': 'validation.itemNameTooLong',
      'items.0.quantity': 'validation.quantityRange',
      'items.0.unitPriceCents': 'validation.pricePositive',
      'items.1.quantity': 'validation.quantityRange',
    });
  });
});

describe('itemsSubtotalCents', () => {
  it('adds quantity times unit price over the lines', () => {
    expect(itemsSubtotalCents([{ quantity: 2, unitPriceCents: 1250 }, { quantity: 3, unitPriceCents: 100 }])).toBe(2800);
  });
});

describe('orderTotalCents', () => {
  it('applies the discount and rounds to whole cents', () => {
    expect(orderTotalCents({ priceCents: 999, discountPercent: 15 })).toBe(849);
    expect(orderTotalCents({ priceCents: 2000, discountPercent: 0 })).toBe(2000);
  });
});
