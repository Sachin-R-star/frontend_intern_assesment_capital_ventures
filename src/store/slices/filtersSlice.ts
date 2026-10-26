import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TicketFilterState } from '@/lib/api/types';

const initialState: TicketFilterState = {
  status: 'all',
  priority: 'all',
  category: 'all',
  triage_decision: 'all',
  search: '',
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter: (
      state,
      action: PayloadAction<{ key: keyof TicketFilterState; value: string }>
    ) => {
      state[action.payload.key] = action.payload.value;
    },
    setAllFilters: (state, action: PayloadAction<Partial<TicketFilterState>>) => {
      return { ...state, ...action.payload };
    },
    resetFilters: () => {
      return initialState;
    },
  },
});

export const { setFilter, setAllFilters, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
