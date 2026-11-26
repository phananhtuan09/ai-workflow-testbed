import type { Order, OrderNote, User } from '../shared/types';
import { hashPassword } from './passwords';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Database {
  nextOrderId: number;
  nextNoteId: number;
  users: StoredUser[];
  orders: Order[];
  notes: OrderNote[];
}

// Fixed IDs and timestamps keep runs comparable across revisions.
export function seedDatabase(): Database {
  return {
    nextOrderId: 4,
    nextNoteId: 4,
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
      },
      {
        id: 2,
        ownerId: 2,
        name: 'Monitor arm',
        priceCents: 8_900,
        discountPercent: 10,
        status: 'draft',
        createdAt: '2026-01-06T10:30:00.000Z',
      },
      {
        id: 3,
        ownerId: 1,
        name: 'Office chair',
        priceCents: 32_000,
        discountPercent: 20,
        status: 'draft',
        createdAt: '2026-01-07T14:15:00.000Z',
      },
    ],
    notes: [
      {
        id: 1,
        orderId: 1,
        authorId: 2,
        body: 'Deliver to the **2nd floor** reception.\nCall 0901 234 567 on arrival.',
        createdAt: '2026-01-05T09:05:00.000Z',
      },
      {
        id: 2,
        orderId: 1,
        authorId: 1,
        body: 'Invoice sent to finance.',
        createdAt: '2026-01-05T11:20:00.000Z',
      },
      {
        id: 3,
        orderId: 3,
        authorId: 1,
        body: 'Waiting for the supplier quote.',
        createdAt: '2026-01-07T15:00:00.000Z',
      },
    ],
  };
}
