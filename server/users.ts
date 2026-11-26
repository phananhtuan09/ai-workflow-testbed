import { Router } from 'express';
import type { User } from '../shared/types';
import { requireAuth, requireRole } from './auth';
import { getDb } from './db';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('admin'));

// Options for the activity page's user filter.
usersRouter.get('/', (_req, res) => {
  const users: User[] = getDb().users.map(({ id, username, displayName, role }) => ({ id, username, displayName, role }));
  res.json(users);
});
