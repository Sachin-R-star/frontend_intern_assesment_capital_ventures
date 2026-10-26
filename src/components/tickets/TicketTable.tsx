'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  selectAllVisibleTickets,
  clearSelectedTickets,
} from '@/store/slices/ticketsSlice';
import { api } from '@/lib/api/client';
import { TicketTableRow } from './TicketTableRow';
import { TicketCardMobile } from './TicketCardMobile';
import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';

export function TicketTable() {
  const dispatch = useAppDispatch();
  const { items, total, page, hasMore, isLoading, isLoadingMore, error, selectedTicketIds } =
    useAppSelector((state) => state.tickets);
  const filters = useAppSelector((state) => state.filters);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial page or reload on filter changes
  const fetchTickets = useCallback(
    async (targetPage: number, replace: boolean = false) => {
      dispatch(fetchStart({ isInitial: replace }));
      try {
        const response = await api.getTickets({
          status: filters.status,
          priority: filters.priority,
          category: filters.category,
          triage_decision: filters.triage_decision,
          search: filters.search,
          page: targetPage,
          limit: 30, // 30 tickets per batch for fast network and render
        });

        dispatch(
          fetchSuccess({
            tickets: response.tickets,
            total: response.total,
            page: response.page,
            hasMore: response.hasMore,
            replace,
          })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load tickets';
        dispatch(fetchFailure(message));
      }
    },
    [dispatch, filters]
  );

  // Refetch when filters change (debounced search already handled in filtersSlice)
  useEffect(() => {
    fetchTickets(1, true);
  }, [fetchTickets]);

  // Infinite Scroll IntersectionObserver: loads next page when sentinel scrolls into view
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchTickets(page + 1, false);
        }
      },
      { rootMargin: '400px' } // Pre-fetch 400px before user reaches bottom
    );

    const sentinel = loadMoreSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, isLoading, isLoadingMore, page, fetchTickets]);

  const allVisibleSelected =
    items.length > 0 && items.every((t) => selectedTicketIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      dispatch(clearSelectedTickets());
    } else {
      dispatch(selectAllVisibleTickets());
    }
  };

  // 1. Initial Loading State
  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading ticket queue...
        </p>
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-950 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/70 flex items-center justify-center text-red-600 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          Server connection issue
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
        <button
          onClick={() => fetchTickets(1, true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          No tickets match your filters
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mb-4">
          Try clearing some filters or searching with a different keyword.
        </p>
        <button
          onClick={() => fetchTickets(1, true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total count and pagination indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{items.length}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{total}</strong> tickets
        </span>
        <span className="hidden sm:inline">Continuous scroll enabled</span>
      </div>

      {/* Desktop / Tablet Table View (hidden on mobile < 640px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    aria-label="Select all visible tickets"
                  />
                </th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Agent</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Deadline SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((ticket) => (
                <TicketTableRow
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicketIds.includes(ticket.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (shown only on mobile screens < md, optimized for 375px) */}
      <div className="md:hidden space-y-3">
        {items.map((ticket) => (
          <TicketCardMobile
            key={ticket.id}
            ticket={ticket}
            isSelected={selectedTicketIds.includes(ticket.id)}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Loading indicator */}
      <div ref={loadMoreSentinelRef} className="py-6 flex justify-center items-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 rounded-full shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more tickets...</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <span className="text-xs text-slate-400 italic">
            You have reached the end of the tickets list ({items.length} loaded).
          </span>
        )}
      </div>
    </div>
  );
}
