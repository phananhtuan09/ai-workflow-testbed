export type Role = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: Role;
}

export type OrderStatus = 'draft' | 'confirmed';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: number;
  ownerId: number;
  name: string;
  // Sum of quantity × unit price over the order's items.
  priceCents: number;
  discountPercent: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export type OrderSummary = Omit<Order, 'items'>;

export interface OrderWithOwner extends Order {
  ownerName: string;
}

export interface OrderSummaryWithOwner extends OrderSummary {
  ownerName: string;
}

export type OrderItemInput = Omit<OrderItem, 'id'>;

export interface OrderInput {
  name: string;
  discountPercent: number;
  items: OrderItemInput[];
}

export interface ApiErrorBody {
  error: string;
  // Keys are input fields: `name`, `discountPercent`, `items`, or `items.<index>.<field>`.
  fields?: Record<string, string>;
}
