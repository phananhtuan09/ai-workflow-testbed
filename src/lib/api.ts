import type { ApiErrorBody, OrderInput, OrderItem, OrderSummaryWithOwner, OrderWithOwner, User } from '../../shared/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.error);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, { error: 'errors.network' });
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => ({ error: 'errors.unknown' }));
  if (!response.ok) throw new ApiError(response.status, body as ApiErrorBody);
  return body as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
  listOrders: () => request<OrderSummaryWithOwner[]>('/orders'),
  getOrder: (id: number) => request<OrderWithOwner>(`/orders/${id}`),
  createOrder: (input: OrderInput) =>
    request<OrderWithOwner>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  updateOrder: (id: number, input: OrderInput) =>
    request<OrderWithOwner>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  confirmOrder: (id: number) => request<OrderWithOwner>(`/orders/${id}/confirm`, { method: 'POST' }),
  deleteOrder: (id: number) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  listItems: (id: number) => request<OrderItem[]>(`/orders/${id}/items`),
  updateItemQuantity: (id: number, itemId: number, quantity: number) =>
    request<OrderWithOwner>(`/orders/${id}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
};
