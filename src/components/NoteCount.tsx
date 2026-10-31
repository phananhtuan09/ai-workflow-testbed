import { useCallback } from 'react';
import { api } from '../lib/api';
import { useResource } from '../lib/useResource';

export function NoteCount({ orderId }: { orderId: number }) {
  const notes = useResource(useCallback(() => api.listNotes(orderId), [orderId]));
  if (notes.status !== 'success') return null;
  return <span className="note-count">{notes.data.length}</span>;
}
