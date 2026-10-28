import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, orderTotalCents, validateOrderInput } from './order-rules';

const valid = { name: 'Desk lamp', priceCents: 2500, discountPercent: 10 };

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

  it('rejects zero, negative, and fractional prices', () => {
    for (const priceCents of [0, -1, 10.5]) {
      expect(validateOrderInput({ ...valid, priceCents }).priceCents).toBe('validation.pricePositive');
    }
  });

  it('keeps the discount between 0 and 50 percent', () => {
    expect(validateOrderInput({ ...valid, discountPercent: 50 }).discountPercent).toBeUndefined();
    expect(validateOrderInput({ ...valid, discountPercent: 51 }).discountPercent).toBe('validation.discountRange');
    expect(validateOrderInput({ ...valid, discountPercent: -1 }).discountPercent).toBe('validation.discountRange');
  });
});

describe('orderTotalCents', () => {
  it('applies the discount and rounds to whole cents', () => {
    expect(orderTotalCents({ priceCents: 999, discountPercent: 15 })).toBe(849);
    expect(orderTotalCents({ priceCents: 2000, discountPercent: 0 })).toBe(2000);
  });

  it('rounds half-cent totals to the nearest even cent', () => {
    expect(orderTotalCents({ priceCents: 1, discountPercent: 50 })).toBe(0);
    expect(orderTotalCents({ priceCents: 3, discountPercent: 50 })).toBe(2);
  });
});
