export type Role = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: Role;
}

export type OrderStatus = 'draft' | 'confirmed';

export interface Order {
  id: number;
  ownerId: number;
  name: string;
  priceCents: number;
  discountPercent: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderWithOwner extends Order {
  ownerName: string;
}

export interface OrderInput {
  name: string;
  priceCents: number;
  discountPercent: number;
}

export type ActivityAction = 'created' | 'edited' | 'confirmed' | 'deleted';

export interface ActivityEvent {
  id: number;
  orderId: number;
  // Kept on the event so the history still reads after the order is deleted.
  orderName: string;
  actorId: number;
  action: ActivityAction;
  at: string;
}

export interface ActivityEventWithActor extends ActivityEvent {
  actorName: string;
}

export interface ApiErrorBody {
  error: string;
  fields?: Partial<Record<keyof OrderInput, string>>;
}
