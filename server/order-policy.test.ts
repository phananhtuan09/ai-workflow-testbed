import { describe, expect, it } from 'vitest';
import type { Order, User } from '../shared/types';
import { canCancel } from './order-policy';

const alice: User = { id: 2, username: 'alice', displayName: 'Alice User', role: 'user' };
const bob: User = { id: 3, username: 'bob', displayName: 'Bob User', role: 'user' };
const admin: User = { id: 1, username: 'admin', displayName: 'Ada Admin', role: 'admin' };

const draft: Order = {
  id: 2,
  ownerId: 2,
  name: 'Monitor arm',
  priceCents: 8_900,
  discountPercent: 10,
  status: 'draft',
  createdAt: '2026-01-06T10:30:00.000Z',
};

describe('canCancel', () => {
  it('lets the owner cancel their draft', () => {
    expect(canCancel(alice, draft)).toBe(true);
  });

  it('lets an admin cancel any draft', () => {
    expect(canCancel(admin, draft)).toBe(true);
  });

  it('does not let another user cancel the order', () => {
    expect(canCancel(bob, draft)).toBe(false);
  });

  it('does not let an admin cancel a confirmed order', () => {
    expect(canCancel(admin, { ...draft, status: 'confirmed' })).toBe(false);
  });
});
