import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StatsState {
  toReviewCount: number;
  agentTicketCounts: Record<string, number>;
  lastSyncedTimestamp: string | null;
}

const initialState: StatsState = {
  toReviewCount: 0,
  agentTicketCounts: {
    'agent-1': 0,
    'agent-2': 0,
    'agent-3': 0,
  },
  lastSyncedTimestamp: null,
};

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats: (
      state,
      action: PayloadAction<{
        toReviewCount: number;
        agentTicketCounts: Record<string, number>;
        timestamp: string;
      }>
    ) => {
      state.toReviewCount = action.payload.toReviewCount;
      state.agentTicketCounts = {
        ...state.agentTicketCounts,
        ...action.payload.agentTicketCounts,
      };
      state.lastSyncedTimestamp = action.payload.timestamp;
    },
    incrementAgentCount: (state, action: PayloadAction<string>) => {
      const agentId = action.payload;
      state.agentTicketCounts[agentId] = (state.agentTicketCounts[agentId] || 0) + 1;
    },
    decrementAgentCount: (state, action: PayloadAction<string>) => {
      const agentId = action.payload;
      state.agentTicketCounts[agentId] = Math.max(0, (state.agentTicketCounts[agentId] || 0) - 1);
    },
    decrementToReviewCount: (state) => {
      state.toReviewCount = Math.max(0, state.toReviewCount - 1);
    },
    incrementToReviewCount: (state) => {
      state.toReviewCount += 1;
    },
  },
});

export const {
  setStats,
  incrementAgentCount,
  decrementAgentCount,
  decrementToReviewCount,
  incrementToReviewCount,
} = statsSlice.actions;

export default statsSlice.reducer;
