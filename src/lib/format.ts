import type { Locale } from '../i18n';

const localeTags: Record<Locale, string> = { en: 'en-US', vi: 'vi-VN' };

// `trailingZeroDisplay` is not in the ES2022 lib types yet.
const moneyOptions: Intl.NumberFormatOptions & { trailingZeroDisplay?: 'auto' | 'stripIfInteger' } = {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
};

export function formatMoney(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], moneyOptions).format(cents / 100);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTags[locale], { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
}

export function parseMoneyToCents(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}
