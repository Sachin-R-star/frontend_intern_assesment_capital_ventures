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
    <div className="sticky top-16 z-30 mb-2 flex justify-center">
      <button
        onClick={() => dispatch(flushPendingNewTickets())}
        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-md shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        <span>{label} — click to show</span>
        <ArrowUp className="w-3.5 h-3.5 ml-0.5" />
      </button>
    </div>
  );
}
