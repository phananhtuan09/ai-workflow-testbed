import path from 'node:path';
import express from 'express';
import { activityRouter } from './activity';
import { authRouter, clearSessions, loadUser } from './auth';
import { config } from './config';
import { resetDb } from './db';
import { sendError } from './errors';
import { ordersRouter } from './orders';
import { usersRouter } from './users';

const app = express();

app.use(express.json());
app.use(loadUser);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/activity', activityRouter);
app.use('/api/users', usersRouter);

if (config.testMode) {
  app.post('/api/test/reset', (_req, res) => {
    resetDb();
    clearSessions();
    res.status(204).end();
  });
}

app.use('/api', (_req, res) => {
  sendError(res, 404, 'errors.notFound');
});

if (config.isProduction) {
  const distDir = path.resolve('dist');
  app.use(express.static(distDir));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`Order Desk API listening on http://localhost:${config.port}`);
});
