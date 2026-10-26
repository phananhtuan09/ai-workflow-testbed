import { randomBytes } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Role, User } from '../shared/types';
import { getDb } from './db';
import { verifyPassword } from './passwords';

const SESSION_COOKIE = 'sid';
const sessions = new Map<string, number>();

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

function toPublicUser({ id, username, displayName, role }: User): User {
  return { id, username, displayName, role };
}

function readSessionId(req: Request): string | undefined {
  const cookies = req.headers.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === SESSION_COOKIE) return value;
  }
  return undefined;
}

export function loadUser(req: Request, _res: Response, next: NextFunction): void {
  const sessionId = readSessionId(req);
  const userId = sessionId ? sessions.get(sessionId) : undefined;
  const user = getDb().users.find((candidate) => candidate.id === userId);
  if (user) req.user = toPublicUser(user);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'errors.unauthenticated' });
    return;
  }
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'errors.forbidden' });
      return;
    }
    next();
  };
}

export function clearSessions(): void {
  sessions.clear();
}

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const user = getDb().users.find((candidate) => candidate.username === username);
  if (!user || !password || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'errors.invalidCredentials' });
    return;
  }
  const sessionId = randomBytes(24).toString('hex');
  sessions.set(sessionId, user.id);
  res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json(toPublicUser(user));
});

authRouter.post('/logout', (req, res) => {
  const sessionId = readSessionId(req);
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});
