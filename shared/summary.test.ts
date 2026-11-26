import { describe, expect, it } from 'vitest';
import { summarize } from './summary';

describe('summarize', () => {
  it('adds up the orders and counts them', () => {
    const summary = summarize([
      { priceCents: 2500, discountPercent: 0 },
      { priceCents: 1000, discountPercent: 0 },
    ]);
    expect(summary.totalSpentCents).toBe(3500);
    expect(summary.orderCount).toBe(2);
  });

  it('averages the discount to one decimal', () => {
    const summary = summarize([
      { priceCents: 1000, discountPercent: 10 },
      { priceCents: 1000, discountPercent: 0 },
      { priceCents: 1000, discountPercent: 15 },
    ]);
    expect(summary.averageDiscountPercent).toBe(8.3);
  });
});
