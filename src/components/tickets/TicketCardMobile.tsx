'use client';

import React from 'react';
import Link from 'next/link';
import { Ticket } from '@/lib/api/types';
import { PriorityBadge, StatusBadge, PlanBadge, CategoryBadge } from '@/components/common/Badge';
import { SlaCountdown } from './SlaCountdown';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSelectTicket, optimisticClaim, rollbackClaim } from '@/store/slices/ticketsSlice';
import { incrementAgentCount } from '@/store/slices/statsSlice';
import { api } from '@/lib/api/client';
import { Hand, User } from 'lucide-react';

interface TicketCardMobileProps {
  ticket: Ticket;
  isSelected: boolean;
}

function TicketCardMobileComponent({ ticket, isSelected }: TicketCardMobileProps) {
  const dispatch = useAppDispatch();
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);

  const handleQuickClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousAssignedTo = ticket.assigned_to;
    const previousStatus = ticket.status;

    dispatch(optimisticClaim({ ticketId: ticket.id, agentId: currentAgentId }));
    dispatch(incrementAgentCount(currentAgentId));

    try {
      await api.claimTicket(ticket.id, currentAgentId);
    } catch (err: unknown) {
      dispatch(
        rollbackClaim({
          ticketId: ticket.id,
          previousAssignedTo,
          previousStatus,
        })
      );
      const msg = err instanceof Error ? err.message : 'Claim failed';
      alert(`Could not claim: ${msg}`);
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isSelected
          ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => dispatch(toggleSelectTicket(ticket.id))}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
          />
          <Link href={`/tickets/${ticket.id}`} className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {ticket.external_id}
          </Link>
          <PlanBadge plan={ticket.customer_plan} />
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <Link href={`/tickets/${ticket.id}`} className="block group mb-2.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
          {ticket.subject || <span className="italic text-slate-400">(No subject)</span>}
        </h3>
      </Link>

      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
        <PriorityBadge priority={ticket.priority} />
        <CategoryBadge category={ticket.category} />
        {ticket.triage_decision === 'manual_review' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
            Needs Review
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          {ticket.assigned_to ? (
            <span className="flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5" />
              <span>{ticket.assigned_to}</span>
            </span>
          ) : (
            <button
              onClick={handleQuickClaim}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-[11px]"
            >
              <Hand className="w-3 h-3" />
              <span>Claim</span>
            </button>
          )}
        </div>

        <SlaCountdown
          createdAt={ticket.created_at}
          priority={ticket.priority}
          ticketStatus={ticket.status}
        />
      </div>
    </div>
  );
}

export const TicketCardMobile = React.memo(TicketCardMobileComponent);
