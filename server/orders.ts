import { Router, type Request, type Response } from 'express';
import { isValidQuantity, itemsSubtotalCents, MAX_ITEM_NAME_LENGTH, validateOrderInput } from '../shared/order-rules';
import type { Order, OrderInput, OrderItem, OrderItemInput, OrderSummaryWithOwner, OrderWithOwner } from '../shared/types';
import { requireAuth, requireRole } from './auth';
import { now } from './clock';
import { getDb, saveDb } from './db';

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

function withOwner(order: Order): OrderWithOwner {
  const owner = getDb().users.find((user) => user.id === order.ownerId);
  return { ...order, ownerName: owner?.displayName ?? '' };
}

function summary(order: Order): OrderSummaryWithOwner {
  const result: Partial<OrderWithOwner> = withOwner(order);
  delete result.items;
  return result as OrderSummaryWithOwner;
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

function readItems(body: Record<string, unknown>, name: string): OrderItemInput[] {
  // Clients that still send a single price get one line named after the order.
  if (!Array.isArray(body.items)) {
    return [{ name: name.trim().slice(0, MAX_ITEM_NAME_LENGTH), quantity: 1, unitPriceCents: Number(body.priceCents) }];
  }
  return body.items.map((raw: Partial<OrderItemInput>) => ({
    name: String(raw?.name ?? ''),
    quantity: Number(raw?.quantity),
    unitPriceCents: Number(raw?.unitPriceCents),
  }));
}

interface ParsedInput extends OrderInput {
  priceCents: number;
}

function readInput(req: Request, res: Response): ParsedInput | undefined {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = String(body.name ?? '');
  const input: OrderInput = {
    name,
    discountPercent: Number(body.discountPercent ?? 0),
    items: readItems(body, name),
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
  const items = input.items.map((item) => ({ ...item, name: item.name.trim() }));
  return { name: input.name.trim(), discountPercent: input.discountPercent, items, priceCents: itemsSubtotalCents(items) };
}

function withIds(items: OrderItemInput[]): OrderItem[] {
  const db = getDb();
  return items.map((item) => ({ id: db.nextItemId++, ...item }));
}

ordersRouter.get('/', (req, res) => {
  const orders = getDb()
    .orders.filter((order) => canAccess(req, order))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(orders.map(summary));
});

ordersRouter.get('/:id', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (order) res.json(withOwner(order));
});

ordersRouter.get('/:id/items', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (order) res.json(order.items);
});

ordersRouter.post('/', (req, res) => {
  const input = readInput(req, res);
  if (!input) return;
  const db = getDb();
  const order: Order = {
    id: db.nextOrderId++,
    ownerId: req.user!.id,
    name: input.name,
    priceCents: input.priceCents,
    discountPercent: input.discountPercent,
    status: 'draft',
    createdAt: now().toISOString(),
    items: withIds(input.items),
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
  Object.assign(order, { name: input.name, discountPercent: input.discountPercent, items: withIds(input.items) });
  saveDb();
  res.json(withOwner(order));
});

ordersRouter.patch('/:id/items/:itemId', (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  if (order.status === 'confirmed') {
    res.status(409).json({ error: 'errors.orderLocked' });
    return;
  }
  const item = getDb()
    .orders.flatMap((candidate) => candidate.items)
    .find((candidate) => candidate.id === Number(req.params.itemId));
  if (!item) {
    res.status(404).json({ error: 'errors.notFound' });
    return;
  }
  const quantity = Number((req.body as { quantity?: unknown } | undefined)?.quantity);
  if (!isValidQuantity(quantity)) {
    res.status(400).json({ error: 'errors.validation', fields: { quantity: 'validation.quantityRange' } });
    return;
  }
  item.quantity = quantity;
  order.priceCents = itemsSubtotalCents(order.items);
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

ordersRouter.delete('/:id', requireRole('admin'), (req, res) => {
  const order = findAccessibleOrder(req, res);
  if (!order) return;
  const db = getDb();
  db.orders = db.orders.filter((candidate) => candidate.id !== order.id);
  saveDb();
  res.status(204).end();
});
