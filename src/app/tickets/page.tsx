'use client';

import React, { Suspense } from 'react';
import { TicketFilters } from '@/components/tickets/TicketFilters';
import { TicketTable } from '@/components/tickets/TicketTable';
import { NewTicketsBanner } from '@/components/tickets/NewTicketsBanner';
import { BulkActionBar } from '@/components/tickets/BulkActionBar';
import { Loader2 } from 'lucide-react';

export default function TicketsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
      {/* Page Title & Intro */}
      <div className="mb-3.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Support Tickets Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Monitor incoming customer issues, pick up tickets, verify AI triage recommendations, and track SLA deadlines.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        }
      >
        <TicketFilters />
        <NewTicketsBanner />
        <TicketTable />
        <BulkActionBar />
      </Suspense>
    </main>
  );
}
