import { configureStore } from '@reduxjs/toolkit';
import agentReducer from './slices/agentSlice';
import filtersReducer from './slices/filtersSlice';
import ticketsReducer from './slices/ticketsSlice';
import statsReducer from './slices/statsSlice';

export const store = configureStore({
  reducer: {
    agent: agentReducer,
    filters: filtersReducer,
    tickets: ticketsReducer,
    stats: statsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
