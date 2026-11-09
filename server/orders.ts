import { Router, type Request, type Response } from 'express';
import { validateOrderInput } from '../shared/order-rules';
import type { Order, OrderInput, OrderWithOwner } from '../shared/types';
import { requireAuth, requireRole } from './auth';
import { canCancel } from './order-policy';
import { now } from './clock';
import { getDb, saveDb } from './db';

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

function withOwner(order: Order): OrderWithOwner {
  const owner = getDb().users.find((user) => user.id === order.ownerId);
  return { ...order, ownerName: owner?.displayName ?? '' };
}

function canAccess(req: Request, order: Order): boolean {
  return req.user!.role === 'admin' || order.ownerId === req.user!.id;
}

// Responds 404 for both missing and inaccessible orders so IDs do not leak.
function findAccessibleOrder(req: Request, res: Response): Order | undefined {
  const order = getDb().orders.find((candidate) => candidate.id === Number(req.params.id));
  if (!order || !canAccess(req, order)) {
    res.status(404).json({ error: 'errors.notFound' });
    return undefined;
  }
  return order;
}

function readInput(req: Request, res: Response): OrderInput | undefined {
  const body = req.body as Partial<OrderInput>;
  const input: OrderInput = {
    name: String(body.name ?? ''),
    priceCents: Number(body.priceCents),
    discountPercent: Number(body.discountPercent ?? 0),
  };
  const fields = validateOrderInput(input);
  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: 'errors.validation', fields });
    return undefined;
  }
  if (input.discountPercent > 0 && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'errors.discountAdminOnly' });
    return undefined;
  }
  return { ...input, name: input.name.trim() };
}

ordersRouter.get('/', (req, res) => {
  const orders = getDb()
    .orders.filter((order) => canAccess(req, order) && (req.user!.role === 'admin' || order.status !== 'cancelled'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(orders.map(withOwner));
});

ordersRouter.get('/:id', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (order) res.json(withOwner(order));
});

ordersRouter.post('/', (req, res) => {
  const input = readInput(req, res);
  if (!input) return;
  const db = getDb();
  const order: Order = {
    id: db.nextOrderId++,
    ownerId: req.user!.id,
    ...input,
    status: 'draft',
    createdAt: now().toISOString(),
  };
  db.orders.push(order);
  saveDb();
  res.status(201).json(withOwner(order));
});

ordersRouter.put('/:id', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  if (order.status === 'confirmed') {
    res.status(409).json({ error: 'errors.orderLocked' });
    return;
  }
  const input = readInput(req, res);
  if (!input) return;
  Object.assign(order, input);
  saveDb();
  res.json(withOwner(order));
});

ordersRouter.post('/:id/confirm', requireRole('admin'), (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  order.status = 'confirmed';
  saveDb();
  res.json(withOwner(order));
});

ordersRouter.post('/:id/cancel', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  if (!canCancel(req.user!, order)) {
    res.status(409).json({ error: 'errors.cancelNotAllowed' });
    return;
  }
  order.status = 'cancelled';
  saveDb();
  res.json(withOwner(order));
});

ordersRouter.delete('/:id', requireRole('admin'), (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  const db = getDb();
  db.orders = db.orders.filter((candidate) => candidate.id !== order.id);
  saveDb();
  res.status(204).end();
});
