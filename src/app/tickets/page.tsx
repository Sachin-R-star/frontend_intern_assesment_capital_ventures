'use client';

import React, { Suspense } from 'react';
import { TicketFilters } from '@/components/tickets/TicketFilters';
import { TicketTable } from '@/components/tickets/TicketTable';
import { NewTicketsBanner } from '@/components/tickets/NewTicketsBanner';
import { BulkActionBar } from '@/components/tickets/BulkActionBar';
import { TicketStatsSummary } from '@/components/tickets/TicketStatsSummary';
import { Loader2, Radio } from 'lucide-react';

export default function TicketsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
      {/* Branded Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-violet-900 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-cyan-200 bg-clip-text text-transparent">
              Support Command Desk
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time ticket distribution, automated triage verification, and intelligent SLA countdown.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Mock Engine: 2,000+ Records
            </span>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        }
      >
        <TicketStatsSummary />
        <TicketFilters />
        <NewTicketsBanner />
        <TicketTable />
        <BulkActionBar />
      </Suspense>
    </main>
  );
}
