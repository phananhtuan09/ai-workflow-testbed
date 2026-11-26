import path from 'node:path';
import express from 'express';
import { authRouter, clearSessions, loadUser } from './auth';
import { config } from './config';
import { resetDb } from './db';
import { notesRouter } from './notes';
import { ordersRouter } from './orders';

const app = express();

app.use(express.json());
app.use(loadUser);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/orders/:id/notes', notesRouter);
app.use('/api/orders', ordersRouter);

if (config.testMode) {
  app.post('/api/test/reset', (_req, res) => {
    resetDb();
    clearSessions();
    res.status(204).end();
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'errors.notFound' });
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
