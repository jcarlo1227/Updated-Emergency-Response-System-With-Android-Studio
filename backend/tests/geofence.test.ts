import { describe, it, expect } from 'vitest';
import { isInsideTanza, tanzaScope } from '../src/shared/utils/tanza.js';

describe('Tanza geofence', () => {
  it('returns true for a coordinate inside Tanza', () => {
    // Amaya barangay — clearly inside
    expect(isInsideTanza(120.885, 14.355)).toBe(true);
  });

  it('returns false for a coordinate outside Tanza (Manila)', () => {
    expect(isInsideTanza(120.98, 14.60)).toBe(false);
  });

  it('returns false for a coordinate outside Tanza (far south)', () => {
    expect(isInsideTanza(120.50, 14.00)).toBe(false);
  });

  it('tanzaScope sets outsideScopeFlag=false when inside', () => {
    const result = tanzaScope(120.885, 14.355);
    expect(result.isInsideTanza).toBe(true);
    expect(result.outsideScopeFlag).toBe(false);
  });

  it('tanzaScope sets outsideScopeFlag=true when outside', () => {
    const result = tanzaScope(121.5, 14.6);
    expect(result.isInsideTanza).toBe(false);
    expect(result.outsideScopeFlag).toBe(true);
  });
});
