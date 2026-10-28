import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, formatRelativeDay, parseMoneyToCents } from './format';

describe('formatMoney', () => {
  it('formats cents as US dollars', () => {
    expect(formatMoney(123456, 'en')).toBe('$1,234.56');
  });
});

describe('formatDate', () => {
  it('formats in UTC so output does not depend on the machine time zone', () => {
    expect(formatDate('2026-01-05T23:30:00.000Z', 'en')).toBe('Jan 5, 2026');
  });
});

describe('formatRelativeDay', () => {
  const now = Date.parse('2026-02-01T20:00:00.000Z');

  it('shows the number of days since the order was created', () => {
    expect(formatRelativeDay('2026-01-05T09:00:00.000Z', 'en', now)).toBe('27 days ago');
  });

  it('says today and yesterday for recent orders', () => {
    expect(formatRelativeDay('2026-02-01T07:00:00.000Z', 'en', now)).toBe('today');
    expect(formatRelativeDay('2026-01-31T19:00:00.000Z', 'en', now)).toBe('yesterday');
  });

  it('follows the selected language', () => {
    expect(formatRelativeDay('2026-01-31T19:00:00.000Z', 'vi', now)).toBe('Hôm qua');
  });
});

describe('parseMoneyToCents', () => {
  it('converts a decimal amount to whole cents', () => {
    expect(parseMoneyToCents('19.99')).toBe(1999);
  });

  it('returns NaN for non-numeric input', () => {
    expect(parseMoneyToCents('abc')).toBeNaN();
  });
});
