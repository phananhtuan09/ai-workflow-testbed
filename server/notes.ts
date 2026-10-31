import { Router } from 'express';
import { validateNoteBody } from '../shared/note-rules';
import type { OrderNote, OrderNoteWithAuthor } from '../shared/types';
import { requireAuth } from './auth';
import { now } from './clock';
import { getDb, saveDb } from './db';
import { findAccessibleOrder } from './orders';

export const notesRouter = Router({ mergeParams: true });

notesRouter.use(requireAuth);

function withAuthor(note: OrderNote): OrderNoteWithAuthor {
  const author = getDb().users.find((user) => user.id === note.authorId);
  return { ...note, author };
}

notesRouter.get('/', (req, res) => {
  const orderId = Number((req.params as { id: string }).id);
  const notes = getDb()
    .notes.filter((note) => note.orderId === orderId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json(notes.map(withAuthor));
});

notesRouter.post('/', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  const body = String((req.body as { body?: unknown }).body ?? '');
  const error = validateNoteBody(body);
  if (error) {
    res.status(400).json({ error: 'errors.validation', fields: { body: error } });
    return;
  }
  const db = getDb();
  const note: OrderNote = {
    id: db.nextNoteId++,
    orderId: order.id,
    authorId: req.user!.id,
    body: body.trim(),
    createdAt: now().toISOString(),
  };
  db.notes.push(note);
  saveDb();
  res.status(201).json(withAuthor(note));
});

notesRouter.delete('/:noteId', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  const db = getDb();
  const note = db.notes.find(
    (candidate) => candidate.id === Number(req.params.noteId) && candidate.orderId === order.id,
  );
  if (!note) {
    res.status(404).json({ error: 'errors.notFound' });
    return;
  }
  if (note.authorId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'errors.forbidden' });
    return;
  }
  db.notes = db.notes.filter((candidate) => candidate.id !== note.id);
  saveDb();
  res.status(204).end();
});
