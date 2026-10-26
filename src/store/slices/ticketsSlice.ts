import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ticket, TicketStatus } from '@/lib/api/types';

interface TicketsState {
  items: Ticket[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pendingNewTickets: Ticket[];
  selectedTicketIds: string[];
}

const initialState: TicketsState = {
  items: [],
  total: 0,
  page: 1,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pendingNewTickets: [],
  selectedTicketIds: [],
};

export const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    fetchStart: (state, action: PayloadAction<{ isInitial: boolean }>) => {
      if (action.payload.isInitial) {
        state.isLoading = true;
        state.error = null;
      } else {
        state.isLoadingMore = true;
      }
    },
    fetchSuccess: (
      state,
      action: PayloadAction<{
        tickets: Ticket[];
        total: number;
        page: number;
        hasMore: boolean;
        replace: boolean;
      }>
    ) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = null;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.hasMore = action.payload.hasMore;

      if (action.payload.replace) {
        state.items = action.payload.tickets;
      } else {
        // Deduplicate to avoid showing the same ticket twice when scrolling
        const existingIds = new Set(state.items.map((t) => t.id));
        const newUnique = action.payload.tickets.filter((t) => !existingIds.has(t.id));
        state.items.push(...newUnique);
      }
    },
    fetchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = action.payload;
    },
    // Updates a ticket in place (e.g. from live updates or after an action)
    updateSingleTicket: (state, action: PayloadAction<Ticket>) => {
      const idx = state.items.findIndex(
        (t) => t.id === action.payload.id || t.external_id === action.payload.external_id
      );
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
    },
    // Optimistic Claim
    optimisticClaim: (
      state,
      action: PayloadAction<{ ticketId: string; agentId: string }>
    ) => {
      const ticket = state.items.find(
        (t) => t.id === action.payload.ticketId || t.external_id === action.payload.ticketId
      );
      if (ticket) {
        ticket.assigned_to = action.payload.agentId;
        if (ticket.status === 'open') {
          ticket.status = 'in_progress';
        }
      }
    },
    // Rollback Claim if server rejected
    rollbackClaim: (
      state,
      action: PayloadAction<{
        ticketId: string;
        previousAssignedTo: string | null;
        previousStatus: TicketStatus;
      }>
    ) => {
      const ticket = state.items.find(
        (t) => t.id === action.payload.ticketId || t.external_id === action.payload.ticketId
      );
      if (ticket) {
        ticket.assigned_to = action.payload.previousAssignedTo;
        ticket.status = action.payload.previousStatus;
      }
    },
    // Staging newly arrived tickets in a banner so the screen does not jump
    addNewIncomingTickets: (state, action: PayloadAction<Ticket[]>) => {
      const currentIds = new Set(state.items.map((t) => t.id));
      const pendingIds = new Set(state.pendingNewTickets.map((t) => t.id));

      const trulyNew = action.payload.filter(
        (t) => !currentIds.has(t.id) && !pendingIds.has(t.id)
      );

      if (trulyNew.length > 0) {
        state.pendingNewTickets.unshift(...trulyNew);
      }
    },
    // Agent clicks "N new tickets — show"
    flushPendingNewTickets: (state) => {
      if (state.pendingNewTickets.length > 0) {
        state.items.unshift(...state.pendingNewTickets);
        state.total += state.pendingNewTickets.length;
        state.pendingNewTickets = [];
      }
    },
    // Bulk actions selection
    toggleSelectTicket: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedTicketIds.includes(id)) {
        state.selectedTicketIds = state.selectedTicketIds.filter((item) => item !== id);
      } else {
        state.selectedTicketIds.push(id);
      }
    },
    selectAllVisibleTickets: (state) => {
      state.selectedTicketIds = state.items.map((t) => t.id);
    },
    clearSelectedTickets: (state) => {
      state.selectedTicketIds = [];
    },
  },
});

export const {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  updateSingleTicket,
  optimisticClaim,
  rollbackClaim,
  addNewIncomingTickets,
  flushPendingNewTickets,
  toggleSelectTicket,
  selectAllVisibleTickets,
  clearSelectedTickets,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
