import { describe, expect, it, vi } from 'vitest';
import type { Order } from '../shared/types';
import { accountingPayload, sendToAccounting } from './accounting';

const order: Order = {
  id: 7,
  ownerId: 2,
  name: 'Desk lamp',
  priceCents: 2500,
  discountPercent: 10,
  status: 'confirmed',
  createdAt: '2026-01-05T09:00:00.000Z',
};

describe('accountingPayload', () => {
  it('sends the total after the discount', () => {
    const amount = order.priceCents * 0.9;
    expect(accountingPayload(order)).toEqual({ orderId: 7, name: 'Desk lamp', totalCents: amount });
  });
});

describe('sendToAccounting', () => {
  it('marks the order sent when the webhook accepts it', async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const result = await sendToAccounting(order, 'http://accounting.test/hook', send);
    expect(result.status).toBe('sent');
    expect(JSON.parse(send.mock.calls[0][1].body as string).totalCents).toBe(2250);
  });

  it('marks the order failed when the webhook answers an error', async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await sendToAccounting(order, 'http://accounting.test/hook', send)).status).toBe('failed');
  });

  it('marks the order failed when the webhook cannot be reached', async () => {
    const send = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await sendToAccounting(order, 'http://accounting.test/hook', send)).status).toBe('failed');
  });

  it('marks the order failed without a configured URL', async () => {
    const send = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await sendToAccounting(order, '', send)).status).toBe('failed');
    expect(send).not.toHaveBeenCalled();
  });
});
