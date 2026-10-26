'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeAgentFromStorage } from '@/store/slices/agentSlice';
import { setStats } from '@/store/slices/statsSlice';
import { addNewIncomingTickets, updateSingleTicket } from '@/store/slices/ticketsSlice';
import { api } from '@/lib/api/client';

function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const lastSynced = useAppSelector((state) => state.stats.lastSyncedTimestamp);

  // Initialize selected agent from localStorage on mount
  useEffect(() => {
    dispatch(initializeAgentFromStorage());
  }, [dispatch]);

  // Periodic polling for live updates every 7 seconds
  useEffect(() => {
    let isSubscribed = true;

    const poll = async () => {
      try {
        const response = await api.getUpdates(lastSynced || undefined);
        if (!isSubscribed) return;

        // Update header counts
        dispatch(
          setStats({
            toReviewCount: response.stats.toReviewCount,
            agentTicketCounts: response.stats.agentTicketCounts,
            timestamp: response.timestamp,
          })
        );

        if (response.updates && response.updates.length > 0) {
          // Identify brand new tickets vs updated existing tickets
          response.updates.forEach((ticket) => {
            dispatch(updateSingleTicket(ticket));
          });

          // Also check for new tickets created since last poll
          const brandNew = response.updates.filter(
            (t) => lastSynced && new Date(t.created_at).getTime() > new Date(lastSynced).getTime()
          );
          if (brandNew.length > 0) {
            dispatch(addNewIncomingTickets(brandNew));
          }
        }
      } catch {
        // Silently ignore background poll errors (handled gracefully)
      }
    };

    // Initial fetch of counters immediately
    poll();

    // 7 second interval for live updates
    const interval = setInterval(poll, 7000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [dispatch, lastSynced]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppLifecycleManager>{children}</AppLifecycleManager>
    </Provider>
  );
}
