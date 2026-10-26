import { describe, it, expect } from 'vitest';
import ticketsReducer, {
  optimisticClaim,
  rollbackClaim,
  addNewIncomingTickets,
  flushPendingNewTickets,
} from '@/store/slices/ticketsSlice';
import filtersReducer, { setFilter, resetFilters } from '@/store/slices/filtersSlice';
import statsReducer, { incrementAgentCount, decrementToReviewCount } from '@/store/slices/statsSlice';
import { Ticket } from '@/lib/api/types';

describe('Redux State Management & Optimistic Updates', () => {
  const sampleTicket: Ticket = {
    id: 't-100',
    external_id: 'T-100',
    customer_id: 'C-01',
    customer_plan: 'pro',
    subject: 'Cannot login',
    body: 'Password reset fails',
    attachment_url: null,
    created_at: '2026-10-15T10:00:00Z',
    updated_at: '2026-10-15T10:00:00Z',
    status: 'open',
    assigned_to: null,
    category: 'account_access',
    priority: 'P1',
    summary: 'Login issue',
    triage_decision: 'auto_accept',
    review_reason: null,
  };

  it('performs instant optimistic claim update on tickets slice', () => {
    const initialState = {
      items: [{ ...sampleTicket }],
      total: 1,
      page: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      pendingNewTickets: [],
      selectedTicketIds: [],
    };

    const nextState = ticketsReducer(
      initialState,
      optimisticClaim({ ticketId: 't-100', agentId: 'agent-1' })
    );

    expect(nextState.items[0].assigned_to).toBe('agent-1');
    expect(nextState.items[0].status).toBe('in_progress');
  });

  it('rolls back optimistic claim if server responds with error or 409 conflict', () => {
    const claimedState = {
      items: [{ ...sampleTicket, assigned_to: 'agent-1', status: 'in_progress' as const }],
      total: 1,
      page: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      pendingNewTickets: [],
      selectedTicketIds: [],
    };

    const rolledBackState = ticketsReducer(
      claimedState,
      rollbackClaim({
        ticketId: 't-100',
        previousAssignedTo: null,
        previousStatus: 'open',
      })
    );

    expect(rolledBackState.items[0].assigned_to).toBeNull();
    expect(rolledBackState.items[0].status).toBe('open');
  });

  it('stages incoming live tickets in pending banner to prevent screen jump', () => {
    const initialState = {
      items: [{ ...sampleTicket }],
      total: 1,
      page: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      pendingNewTickets: [],
      selectedTicketIds: [],
    };

    const newTicket: Ticket = { ...sampleTicket, id: 't-999', external_id: 'T-999' };

    // When background poll arrives, stages in pendingNewTickets
    const staged = ticketsReducer(initialState, addNewIncomingTickets([newTicket]));
    expect(staged.items.length).toBe(1); // List items do NOT jump!
    expect(staged.pendingNewTickets.length).toBe(1);

    // When agent clicks "Show new tickets", flushed to the top of list
    const flushed = ticketsReducer(staged, flushPendingNewTickets());
    expect(flushed.items.length).toBe(2);
    expect(flushed.items[0].id).toBe('t-999');
    expect(flushed.pendingNewTickets.length).toBe(0);
  });

  it('filters slice correctly updates and resets', () => {
    let state = filtersReducer(undefined, setFilter({ key: 'priority', value: 'P0' }));
    expect(state.priority).toBe('P0');

    state = filtersReducer(state, setFilter({ key: 'status', value: 'open' }));
    expect(state.status).toBe('open');

    state = filtersReducer(state, resetFilters());
    expect(state.priority).toBe('all');
    expect(state.status).toBe('all');
  });

  it('stats slice correctly maintains header counts', () => {
    let state = statsReducer(undefined, incrementAgentCount('agent-2'));
    expect(state.agentTicketCounts['agent-2']).toBe(1);

    state = statsReducer(state, decrementToReviewCount());
    expect(state.toReviewCount).toBe(0);
  });
});
