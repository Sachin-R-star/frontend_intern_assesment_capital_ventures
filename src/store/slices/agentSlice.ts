import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AgentState {
  currentAgentId: string;
}

const STORAGE_KEY = 'freeflow_selected_agent';

const getInitialAgentId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['agent-1', 'agent-2', 'agent-3'].includes(saved)) {
      return saved;
    }
  }
  return 'agent-1'; // Default: Priya
};

const initialState: AgentState = {
  currentAgentId: 'agent-1',
};

export const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setCurrentAgent: (state, action: PayloadAction<string>) => {
      state.currentAgentId = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, action.payload);
      }
    },
    initializeAgentFromStorage: (state) => {
      state.currentAgentId = getInitialAgentId();
    },
  },
});

export const { setCurrentAgent, initializeAgentFromStorage } = agentSlice.actions;
export default agentSlice.reducer;
