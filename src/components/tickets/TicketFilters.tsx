'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFilter, setAllFilters, resetFilters } from '@/store/slices/filtersSlice';
import { Search, RotateCcw, Filter, Activity, Zap, Layers, Cpu } from 'lucide-react';

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

  const handleSelectChange = (
    key: 'status' | 'priority' | 'category' | 'triage_decision',
    value: string
  ) => {
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
    <div className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-3.5 shadow-sm mb-3 space-y-2.5 transition-all">
      {/* Search Bar & Reset */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 dark:text-violet-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tickets by ID (e.g. T-2001), subject, or message content..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-300 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-500" />
            <span>Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className={`w-full text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer transition-colors ${
              filters.status !== 'all'
                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/30 font-semibold'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="open">🔵 Open</option>
            <option value="in_progress">🟣 In Progress</option>
            <option value="resolved">🟢 Resolved</option>
            <option value="closed">⚪ Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Priority</span>
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className={`w-full text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer transition-colors ${
              filters.priority !== 'all'
                ? 'border-amber-500 dark:border-amber-400 bg-amber-50/40 dark:bg-amber-950/30 font-semibold'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="P0">🔴 P0 (Critical - 1h)</option>
            <option value="P1">🟠 P1 (High - 4h)</option>
            <option value="P2">🔵 P2 (Medium - 24h)</option>
            <option value="P3">🟢 P3 (Low - 72h)</option>
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-violet-500" />
            <span>Category</span>
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleSelectChange('category', e.target.value)}
            className={`w-full text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer transition-colors ${
              filters.category !== 'all'
                ? 'border-violet-500 dark:border-violet-400 bg-violet-50/40 dark:bg-violet-950/30 font-semibold'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="all">All Categories</option>
            <option value="account_access">🔑 Account Access</option>
            <option value="billing">💰 Billing</option>
            <option value="bug">🐞 Bug</option>
            <option value="feature_request">💡 Feature Request</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        {/* AI Triage Decision */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span>AI Triage</span>
          </label>
          <select
            value={filters.triage_decision}
            onChange={(e) => handleSelectChange('triage_decision', e.target.value)}
            className={`w-full text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer transition-colors ${
              filters.triage_decision !== 'all'
                ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value="all">All AI Decisions</option>
            <option value="auto_accept">✨ Auto-Accepted</option>
            <option value="manual_review">⚠️ Manual Review Needed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
