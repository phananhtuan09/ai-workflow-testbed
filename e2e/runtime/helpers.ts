import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { OrderWithOwner } from '../../shared/types';
import { users } from '../fixtures';

export interface Check {
  id: string;
  source: string;
  expected: unknown;
  actual: unknown;
}

export interface Observations {
  actualPath: string;
  checks: Check[];
  cleanup: 'COMPLETE' | 'INCOMPLETE' | 'NOT_REQUIRED';
  [extra: string]: unknown;
}

export async function resetData(request: APIRequestContext): Promise<number> {
  const response = await request.post('/api/test/reset');
  return response.status();
}

export async function apiLogin(request: APIRequestContext, user: (typeof users)[keyof typeof users]) {
  const response = await request.post('/api/auth/login', {
    data: { username: user.username, password: user.password },
  });
  expect(response.status()).toBe(200);
}

export async function readOrders(request: APIRequestContext): Promise<OrderWithOwner[]> {
  const response = await request.get('/api/orders');
  expect(response.status()).toBe(200);
  return (await response.json()) as OrderWithOwner[];
}

export function requestRecord(method: string, route: string, response: APIResponse) {
  return { method, route, status: response.status() };
}

export async function attachObservations(observations: Observations) {
  await test.info().attach('runtime-observations', {
    body: Buffer.from(JSON.stringify(observations, null, 2)),
    contentType: 'application/json',
  });
  for (const check of observations.checks) {
    expect(check.actual, check.id).toEqual(check.expected);
  }
  expect(observations.cleanup, 'cleanup').not.toBe('INCOMPLETE');
}
