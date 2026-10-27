'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { flushPendingNewTickets } from '@/store/slices/ticketsSlice';
import { Sparkles, ArrowUp } from 'lucide-react';

export function NewTicketsBanner() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((state) => state.tickets.pendingNewTickets);

  if (!pending || pending.length === 0) return null;

  const count = pending.length;
  const label = count === 1 ? '1 new live ticket arrived' : `${count} new live tickets arrived`;

  return (
    <div className="sticky top-16 z-30 mb-2.5 flex justify-center animate-bounce">
      <button
        onClick={() => dispatch(flushPendingNewTickets())}
        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg shadow-violet-500/30 border border-violet-400/40 hover:shadow-violet-500/50 transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
        <span>{label} — click to view immediately</span>
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
