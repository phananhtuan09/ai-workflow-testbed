import type { Locale } from '../i18n';

const localeTags: Record<Locale, string> = { en: 'en-US', vi: 'vi-VN' };

export function formatMoney(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTags[locale], { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatRelativeDay(iso: string, locale: Locale, now = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS);
  return new Intl.RelativeTimeFormat(localeTags[locale], { numeric: 'auto' }).format(-days, 'day');
}

export function parseMoneyToCents(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}
