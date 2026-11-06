import { useCallback } from 'react';
import { api } from '../lib/api';
import { useResource } from '../lib/useResource';

export function ItemCount({ orderId }: { orderId: number }) {
  const items = useResource(useCallback(() => api.listItems(orderId), [orderId]));
  if (items.status !== 'success') return <span aria-busy="true">…</span>;
  return <span data-testid="item-count">{items.data.length}</span>;
}
