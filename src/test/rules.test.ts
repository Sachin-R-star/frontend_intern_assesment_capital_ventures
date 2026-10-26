import { describe, it, expect, beforeEach } from 'vitest';
import { TicketStore } from '@/lib/api/mockStore';

describe('Business Rules & State Machine Integrity', () => {
  let store: TicketStore;

  beforeEach(() => {
    store = new TicketStore();
  });

  it('allows valid status transitions: open -> in_progress -> resolved -> open', () => {
    // T-2001 starts as open
    const step1 = store.updateStatus('test-1', 'in_progress');
    expect(step1.status).toBe(200);
    expect(step1.ticket?.status).toBe('in_progress');

    const step2 = store.updateStatus('test-1', 'resolved');
    expect(step2.status).toBe(200);
    expect(step2.ticket?.status).toBe('resolved');

    const step3 = store.updateStatus('test-1', 'open');
    expect(step3.status).toBe(200);
    expect(step3.ticket?.status).toBe('open');
  });

  it('strictly rejects illegal status transitions (e.g. open directly to resolved)', () => {
    // test-1 is open, cannot jump directly to resolved
    const illegal = store.updateStatus('test-1', 'resolved');
    expect(illegal.status).toBe(400);
    expect(illegal.error).toContain('Invalid status transition');
  });

  it('enforces Enterprise Rule: cannot downgrade enterprise ticket to P2 or P3', () => {
    // test-1 is customer_plan: "enterprise"
    const result = store.triageTicket(
      'test-1',
      'account_access',
      'P3', // Illegal for enterprise!
      'Downgrading priority because it looks low impact.'
    );

    expect(result.status).toBe(422);
    expect(result.error).toContain('Enterprise rule violation');
  });

  it('allows enterprise ticket priority update to P0 or P1 with valid reason', () => {
    const result = store.triageTicket(
      'test-1',
      'account_access',
      'P1',
      'Confirmed high urgency for enterprise workspace SSO issue.'
    );

    expect(result.status).toBe(200);
    expect(result.ticket?.priority).toBe('P1');
    expect(result.ticket?.triage_decision).toBe('auto_accept');
  });

  it('rejects triage changes when reason is shorter than 10 characters', () => {
    const result = store.triageTicket(
      'test-3', // T-2003
      'bug',
      'P2',
      'Too short' // only 9 chars
    );

    expect(result.status).toBe(400);
    expect(result.error).toContain('at least 10 characters');
  });

  it('prevents claiming a ticket already assigned to another agent (returns 409)', () => {
    // Claim with agent-1 in test mode (no random race simulation)
    const claim1 = store.claimTicket('test-1', 'agent-1', true);
    expect(claim1.status).toBe(200);
    expect(claim1.ticket?.assigned_to).toBe('agent-1');

    // Attempt claim by agent-2 -> MUST return 409 Conflict
    const claim2 = store.claimTicket('test-1', 'agent-2', true);
    expect(claim2.status).toBe(409);
    expect(claim2.error).toContain('already claimed by agent-1');
  });
});
