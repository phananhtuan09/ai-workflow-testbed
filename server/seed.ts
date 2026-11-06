import type { Order, User } from '../shared/types';
import { hashPassword } from './passwords';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Database {
  nextOrderId: number;
  nextItemId: number;
  users: StoredUser[];
  orders: Order[];
}

// Fixed IDs and timestamps keep runs comparable across revisions.
export function seedDatabase(): Database {
  return {
    nextOrderId: 4,
    nextItemId: 6,
    users: [
      { id: 1, username: 'admin', displayName: 'Ada Admin', role: 'admin', passwordHash: hashPassword('admin123') },
      { id: 2, username: 'alice', displayName: 'Alice User', role: 'user', passwordHash: hashPassword('alice123') },
      { id: 3, username: 'bob', displayName: 'Bob User', role: 'user', passwordHash: hashPassword('bob123') },
    ],
    orders: [
      {
        id: 1,
        ownerId: 2,
        name: 'Standing desk',
        priceCents: 45_000,
        discountPercent: 0,
        status: 'confirmed',
        createdAt: '2026-01-05T09:00:00.000Z',
        items: [
          { id: 1, name: 'Desk mat', quantity: 2, unitPriceCents: 3_500 },
          { id: 2, name: 'Standing desk frame', quantity: 1, unitPriceCents: 38_000 },
        ],
      },
      {
        id: 2,
        ownerId: 2,
        name: 'Monitor arm',
        priceCents: 8_900,
        discountPercent: 10,
        status: 'draft',
        createdAt: '2026-01-06T10:30:00.000Z',
        items: [{ id: 3, name: 'Monitor arm', quantity: 1, unitPriceCents: 8_900 }],
      },
      {
        id: 3,
        ownerId: 1,
        name: 'Office chair',
        priceCents: 32_000,
        discountPercent: 20,
        status: 'draft',
        createdAt: '2026-01-07T14:15:00.000Z',
        items: [
          { id: 4, name: 'Office chair', quantity: 1, unitPriceCents: 29_000 },
          { id: 5, name: 'Lumbar cushion', quantity: 2, unitPriceCents: 1_500 },
        ],
      },
    ],
  };
}
