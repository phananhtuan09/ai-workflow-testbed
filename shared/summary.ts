import type { Order, SpendingSummary } from './types';

export function summarize(orders: readonly Pick<Order, 'priceCents' | 'discountPercent'>[]): SpendingSummary {
  const totalSpentCents = orders.reduce((sum, order) => sum + order.priceCents, 0);
  const discountSum = orders.reduce((sum, order) => sum + order.discountPercent, 0);
  return {
    totalSpentCents,
    orderCount: orders.length,
    averageDiscountPercent: Math.round((discountSum / orders.length) * 10) / 10,
  };
}
