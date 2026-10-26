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
  const label = count === 1 ? '1 new ticket arrived' : `${count} new tickets arrived`;

  return (
    <div className="sticky top-20 z-30 mb-4 flex justify-center animate-bounce">
      <button
        onClick={() => dispatch(flushPendingNewTickets())}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>{label} — click to show</span>
        <ArrowUp className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}
