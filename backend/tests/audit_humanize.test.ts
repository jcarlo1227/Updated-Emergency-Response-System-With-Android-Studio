import { describe, it, expect } from 'vitest';
import { humanizeAudit } from '../src/modules/admin/audit.humanize.js';
import type { IAuditLog } from '../src/models/index.js';

function fixture(partial: Partial<IAuditLog> & { action: string; actorRole: IAuditLog['actorRole'] }): IAuditLog {
  return {
    actorRole: 'admin',
    createdAt: new Date('2026-05-07T00:00:00Z'),
    ...partial,
  } as IAuditLog;
}

describe('humanizeAudit', () => {
  it('classifies new emergency creation as warning under Emergency module', () => {
    const result = humanizeAudit(
      fixture({
        action: 'emergency.created',
        actorRole: 'user',
        actorName: 'Juan Dela Cruz',
        meta: { type: 'medical' },
      }),
    );
    expect(result.module).toBe('Emergency');
    expect(result.severity).toBe('warning');
    expect(result.description).toMatch(/User Juan Dela Cruz/);
    expect(result.description).toMatch(/medical/i);
  });

  it('escalates IoT keychain trigger to critical', () => {
    const result = humanizeAudit(
      fixture({
        action: 'emergency.iot_keychain_created',
        actorRole: 'user',
      }),
    );
    expect(result.severity).toBe('critical');
    expect(result.module).toBe('Emergency');
  });

  it('embeds rejection reason for ambulance request rejection', () => {
    const result = humanizeAudit(
      fixture({
        action: 'ambulance_request.rejected',
        actorRole: 'admin',
        actorName: 'Mark',
        meta: { reason: 'Outside coverage area' },
      }),
    );
    expect(result.severity).toBe('warning');
    expect(result.description).toMatch(/Outside coverage area/);
  });

  it('classifies ambulance unit deletion as warning', () => {
    const result = humanizeAudit(
      fixture({ action: 'ambulance_unit.deleted', actorRole: 'admin' }),
    );
    expect(result.module).toBe('Settings');
    expect(result.severity).toBe('warning');
  });

  it('falls back gracefully for unknown action keys', () => {
    const result = humanizeAudit(
      fixture({ action: 'something.weird.happened', actorRole: 'system', targetType: 'whatever' }),
    );
    expect(result.severity).toBe('info');
    expect(result.module).toBe('System');
    expect(result.description).toContain('something.weird.happened'.replace(/_/g, ' '));
  });

  it('preserves stored description if already set', () => {
    const result = humanizeAudit(
      fixture({
        action: 'emergency.created',
        actorRole: 'user',
        description: 'Custom override',
        module: 'Emergency',
        severity: 'info',
      }),
    );
    expect(result.description).toBe('Custom override');
    expect(result.severity).toBe('info');
  });
});
