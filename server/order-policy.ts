import type { Order, User } from '../shared/types';

// Owners may cancel their own drafts; admins may cancel any draft.
export function canCancel(user: User, order: Order): boolean {
  return order.status === 'draft' && user.role === 'admin' || order.ownerId === user.id;
}
