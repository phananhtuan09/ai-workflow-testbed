import { orderTotalCents } from '../shared/order-rules';
import type { AccountingSync, Order } from '../shared/types';
import { now } from './clock';
import { config } from './config';

export const ACCOUNTING_TIMEOUT_MS = 5000;

// The accounting system reads the order total from this field.
const AMOUNT_FIELD = 'totalCents';

export interface AccountingPayload {
  orderId: number;
  name: string;
  [AMOUNT_FIELD]: number;
}

export function accountingPayload(order: Order): AccountingPayload {
  return { orderId: order.id, name: order.name, [AMOUNT_FIELD]: orderTotalCents(order) };
}

type Send = (url: string, init: RequestInit) => Promise<Response>;

export async function sendToAccounting(
  order: Order,
  url: string = config.accountingWebhookUrl,
  send: Send = fetch,
): Promise<AccountingSync> {
  const attemptedAt = now().toISOString();
  if (!url) {
    console.error(`Accounting webhook is not configured; order ${order.id} was not sent`);
    return { status: 'failed', attemptedAt };
  }
  try {
    const response = await send(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountingPayload(order)),
      signal: AbortSignal.timeout(ACCOUNTING_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`Accounting webhook answered ${response.status} for order ${order.id}`);
      return { status: 'failed', attemptedAt };
    }
    return { status: 'sent', attemptedAt };
  } catch (error) {
    console.error(`Accounting webhook failed for order ${order.id}: ${(error as Error).message}`);
    return { status: 'failed', attemptedAt };
  }
}
