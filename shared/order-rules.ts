import type { OrderInput } from './types';

export const MAX_NAME_LENGTH = 100;
export const MAX_DISCOUNT_PERCENT = 50;
export const MAX_PRICE_CENTS = 100_000_000;

export type OrderFieldErrors = Partial<Record<keyof OrderInput, string>>;

// Error values are i18n keys so the client can translate server errors too.
export function validateOrderInput(input: OrderInput): OrderFieldErrors {
  const errors: OrderFieldErrors = {};
  const name = input.name.trim();

  if (name.length === 0) {
    errors.name = 'validation.nameRequired';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = 'validation.nameTooLong';
  }

  if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) {
    errors.priceCents = 'validation.pricePositive';
  } else if (input.priceCents > MAX_PRICE_CENTS) {
    errors.priceCents = 'validation.priceTooHigh';
  }

  if (
    !Number.isInteger(input.discountPercent) ||
    input.discountPercent < 0 ||
    input.discountPercent > MAX_DISCOUNT_PERCENT
  ) {
    errors.discountPercent = 'validation.discountRange';
  }

  return errors;
}

export function orderTotalCents(order: Pick<OrderInput, 'priceCents' | 'discountPercent'>): number {
  return Math.round((order.priceCents * (100 - order.discountPercent)) / 100);
}
