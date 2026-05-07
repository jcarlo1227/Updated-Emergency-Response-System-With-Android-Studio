import { describe, it, expect } from 'vitest';
import { cn, fmt, fmtDate, truncate } from './utils';

describe('cn (class merging)', () => {
  it('merges two classes', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('resolves tailwind conflicts (later wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('base', false && 'no', undefined, null, '')).toBe('base');
  });
});

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('short', 40)).toBe('short');
  });

  it('truncates and appends ellipsis', () => {
    const long = 'a'.repeat(50);
    expect(truncate(long, 40)).toBe('a'.repeat(40) + '…');
  });

  it('uses default length of 40', () => {
    expect(truncate('a'.repeat(41))).toHaveLength(41); // 40 chars + '…' (1 Unicode char)
  });
});

describe('fmt (date formatter)', () => {
  it('returns — for undefined', () => {
    expect(fmt(undefined)).toBe('—');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    const result = fmt('2026-05-07T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });
});

describe('fmtDate', () => {
  it('returns — for undefined', () => {
    expect(fmtDate(undefined)).toBe('—');
  });

  it('formats a date string', () => {
    const result = fmtDate('2026-05-07T00:00:00Z');
    expect(result).toContain('2026');
  });
});
