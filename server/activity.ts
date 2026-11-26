import { Router } from 'express';
import { sortNewestFirst } from '../shared/activity';
import type { ActivityAction, ActivityEvent, ActivityEventWithActor, Order, User } from '../shared/types';
import { requireAuth } from './auth';
import { now } from './clock';
import { getDb } from './db';

// Appends an event; the caller saves the database together with the change it records.
export function recordActivity(order: Order, actor: User, action: ActivityAction): void {
  const db = getDb();
  db.activity.push({
    id: db.nextActivityId++,
    orderId: order.id,
    orderName: order.name,
    actorId: actor.id,
    action,
    at: now().toISOString(),
  });
}

export function withActor(event: ActivityEvent): ActivityEventWithActor {
  const actor = getDb().users.find((user) => user.id === event.actorId);
  return { ...event, actorName: actor?.displayName ?? '' };
}

export function orderActivity(orderId: number): ActivityEventWithActor[] {
  return sortNewestFirst(getDb().activity.filter((event) => event.orderId === orderId)).map(withActor);
}

export const activityRouter = Router();

activityRouter.use(requireAuth);

// Admin activity page: every event, optionally for one user.
activityRouter.get('/', (req, res) => {
  const userId = req.query.userId === undefined ? undefined : Number(req.query.userId);
  const events = getDb().activity.filter((event) => userId === undefined || event.actorId === userId);
  res.json(sortNewestFirst(events).map(withActor));
});
