import { describe, expect, it } from 'vitest';
import { formatAge, formatDate, formatMoney, parseMoneyToCents } from './format';

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

describe('formatAge', () => {
  const now = Date.parse('2026-02-01T08:00:00.000Z');

  it('counts whole days since creation', () => {
    expect(formatAge('2026-01-05T09:00:00.000Z', 'en', now)).toBe('26 days ago');
  });

  it('uses words for today and yesterday', () => {
    expect(formatAge('2026-02-01T07:00:00.000Z', 'en', now)).toBe('today');
    expect(formatAge('2026-01-31T07:00:00.000Z', 'en', now)).toBe('yesterday');
  });

  it('follows the selected language', () => {
    expect(formatAge('2026-01-05T09:00:00.000Z', 'vi', now)).toBe('26 ngày trước');
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
