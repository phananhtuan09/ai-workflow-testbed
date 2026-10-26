import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, parseMoneyToCents } from './format';

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

describe('parseMoneyToCents', () => {
  it('converts a decimal amount to whole cents', () => {
    expect(parseMoneyToCents('19.99')).toBe(1999);
  });

  it('returns NaN for non-numeric input', () => {
    expect(parseMoneyToCents('abc')).toBeNaN();
  });
});
