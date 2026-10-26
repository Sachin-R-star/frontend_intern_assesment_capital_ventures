'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFilter, setAllFilters, resetFilters } from '@/store/slices/filtersSlice';
import { Search, Filter, RotateCcw } from 'lucide-react';

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(filters.search);

  // 1. Sync from URL to Redux on initial load or popstate
  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const category = searchParams.get('category') || 'all';
    const triage_decision = searchParams.get('triage_decision') || 'all';
    const search = searchParams.get('search') || '';

    dispatch(
      setAllFilters({
        status,
        priority,
        category,
        triage_decision,
        search,
      })
    );
    setSearchInput(search);
  }, [searchParams, dispatch]);

  // 2. Helper to push updated filters to URL
  const updateUrl = useCallback(
    (newFilters: Record<string, string>) => {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v && v !== 'all') {
          params.set(k, v);
        }
      });
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router, pathname]
  );

  // 3. Debounce search input (300ms) to avoid sending API request per keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilter({ key: 'search', value: searchInput }));
        updateUrl({
          ...filters,
          search: searchInput,
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, filters, dispatch, updateUrl]);

  const handleSelectChange = (key: 'status' | 'priority' | 'category' | 'triage_decision', value: string) => {
    dispatch(setFilter({ key, value }));
    updateUrl({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    dispatch(resetFilters());
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.triage_decision !== 'all' ||
    Boolean(filters.search);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-6 space-y-3">
      {/* Search Bar & Reset */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by ticket ID, subject or body contents..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full text-xs sm:text-sm py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className="w-full text-xs sm:text-sm py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="P0">P0 (Critical - 1h)</option>
            <option value="P1">P1 (High - 4h)</option>
            <option value="P2">P2 (Medium - 24h)</option>
            <option value="P3">P3 (Low - 72h)</option>
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleSelectChange('category', e.target.value)}
            className="w-full text-xs sm:text-sm py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="account_access">Account Access</option>
            <option value="billing">Billing</option>
            <option value="bug">Bug</option>
            <option value="feature_request">Feature Request</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* AI Decision */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            AI Triage
          </label>
          <select
            value={filters.triage_decision}
            onChange={(e) => handleSelectChange('triage_decision', e.target.value)}
            className="w-full text-xs sm:text-sm py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Decisions</option>
            <option value="auto_accept">Auto Accepted</option>
            <option value="manual_review">Manual Review Needed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
