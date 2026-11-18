import type { OrderInput, OrderItemInput } from './types';

export const MAX_NAME_LENGTH = 100;
export const MAX_DISCOUNT_PERCENT = 50;
export const MAX_PRICE_CENTS = 100_000_000;
export const MAX_ITEMS = 20;
export const MAX_ITEM_NAME_LENGTH = 80;
export const MAX_QUANTITY = 999;

export type OrderFieldErrors = Record<string, string>;

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY;
}

export function itemSubtotalCents(item: Pick<OrderItemInput, 'quantity' | 'unitPriceCents'>): number {
  return item.quantity * item.unitPriceCents;
}

export function itemsSubtotalCents(items: Pick<OrderItemInput, 'quantity' | 'unitPriceCents'>[]): number {
  return items.reduce((sum, item) => sum + itemSubtotalCents(item), 0);
}

// Error values are i18n keys so the client can translate server errors too.
export function validateOrderInput(input: OrderInput): OrderFieldErrors {
  const errors: OrderFieldErrors = {};
  const name = input.name.trim();

  if (name.length === 0) {
    errors.name = 'validation.nameRequired';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = 'validation.nameTooLong';
  }

  if (
    !Number.isInteger(input.discountPercent) ||
    input.discountPercent < 0 ||
    input.discountPercent > MAX_DISCOUNT_PERCENT
  ) {
    errors.discountPercent = 'validation.discountRange';
  }

  if (input.items.length === 0) {
    errors.items = 'validation.itemsRequired';
  } else if (input.items.length > MAX_ITEMS) {
    errors.items = 'validation.itemsTooMany';
  }

  input.items.forEach((item, index) => {
    const itemName = item.name.trim();
    if (itemName.length === 0) {
      errors[`items.${index}.name`] = 'validation.nameRequired';
    } else if (itemName.length > MAX_ITEM_NAME_LENGTH) {
      errors[`items.${index}.name`] = 'validation.itemNameTooLong';
    }
    if (!isValidQuantity(item.quantity)) {
      errors[`items.${index}.quantity`] = 'validation.quantityRange';
    }
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents <= 0) {
      errors[`items.${index}.unitPriceCents`] = 'validation.pricePositive';
    } else if (item.unitPriceCents > MAX_PRICE_CENTS) {
      errors[`items.${index}.unitPriceCents`] = 'validation.priceTooHigh';
    }
  });

  if (!errors.items && itemsSubtotalCents(input.items) > MAX_PRICE_CENTS) {
    errors.items = 'validation.priceTooHigh';
  }

  return errors;
}

export function orderTotalCents(order: { priceCents: number; discountPercent: number }): number {
  return Math.round((order.priceCents * (100 - order.discountPercent)) / 100);
}
