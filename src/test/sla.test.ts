import { describe, it, expect } from 'vitest';
import { calculateSla, parseTicketDate, formatDuration } from '@/lib/utils/sla';

describe('SLA Deadline & Countdown Calculations', () => {
  it('correctly calculates P0 deadline (1 hour)', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    // 30 minutes in -> 30 mins left (50% left -> on track)
    const now = new Date('2026-10-15T10:30:00Z');
    const result = calculateSla(base.toISOString(), 'P0', 'open', now);

    expect(result.status).toBe('on_track');
    expect(result.isOverdue).toBe(false);
    expect(result.remainingMs).toBe(30 * 60 * 1000);
    expect(result.formattedCountdown).toBe('30m 00s');
  });

  it('correctly identifies "at_risk" when less than 20% of time remains', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    // P0 total duration = 60 mins. 20% is 12 mins.
    // At 50 minutes in, 10 mins remain (< 20%) -> at_risk!
    const now = new Date('2026-10-15T10:50:00Z');
    const result = calculateSla(base.toISOString(), 'P0', 'open', now);

    expect(result.status).toBe('at_risk');
    expect(result.isOverdue).toBe(false);
    expect(result.formattedCountdown).toBe('10m 00s');
  });

  it('correctly identifies "late" when deadline has passed', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    // At 75 minutes in, 15 minutes overdue -> late!
    const now = new Date('2026-10-15T11:15:00Z');
    const result = calculateSla(base.toISOString(), 'P0', 'open', now);

    expect(result.status).toBe('late');
    expect(result.isOverdue).toBe(true);
    expect(result.formattedCountdown).toBe('-15m 00s');
  });

  it('handles P1 (4 hours), P2 (24 hours), P3 (72 hours)', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    const now = new Date('2026-10-15T10:00:00Z');

    const p1 = calculateSla(base.toISOString(), 'P1', 'open', now);
    expect(p1.remainingMs).toBe(4 * 3600 * 1000);

    const p2 = calculateSla(base.toISOString(), 'P2', 'open', now);
    expect(p2.remainingMs).toBe(24 * 3600 * 1000);

    const p3 = calculateSla(base.toISOString(), 'P3', 'open', now);
    expect(p3.remainingMs).toBe(72 * 3600 * 1000);
  });

  it('stops counting for resolved or closed tickets', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    const now = new Date('2026-10-15T15:00:00Z'); // Past P0 deadline

    const resolved = calculateSla(base.toISOString(), 'P0', 'resolved', now);
    expect(resolved.status).toBe('completed');
    expect(resolved.formattedCountdown).toBe('Completed');

    const closed = calculateSla(base.toISOString(), 'P0', 'closed', now);
    expect(closed.status).toBe('completed');
  });

  it('handles tricky test case T-2007 (non-standard date format without T and Z)', () => {
    const dateStr = '2026-09-20 11:30:00';
    const parsed = parseTicketDate(dateStr);
    expect(isNaN(parsed.getTime())).toBe(false);
    expect(parsed.toISOString()).toBe('2026-09-20T11:30:00.000Z');
  });

  it('handles tricky test case T-2008 (future ticket creation)', () => {
    const futureDate = '2027-01-01T00:00:00Z';
    const now = new Date('2026-10-15T10:00:00Z');
    const result = calculateSla(futureDate, 'P3', 'open', now);

    expect(result.status).toBe('future');
    expect(result.isOverdue).toBe(false);
  });
});
