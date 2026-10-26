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

interface TicketTableRowProps {
  ticket: Ticket;
  isSelected: boolean;
}

function TicketTableRowComponent({ ticket, isSelected }: TicketTableRowProps) {
  const dispatch = useAppDispatch();
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);

  // Quick claim button right from the table row
  const handleQuickClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousAssignedTo = ticket.assigned_to;
    const previousStatus = ticket.status;

    // Optimistic UI update
    dispatch(optimisticClaim({ ticketId: ticket.id, agentId: currentAgentId }));
    dispatch(incrementAgentCount(currentAgentId));

    try {
      await api.claimTicket(ticket.id, currentAgentId);
    } catch (err: unknown) {
      // Revert optimistic update
      dispatch(
        rollbackClaim({
          ticketId: ticket.id,
          previousAssignedTo,
          previousStatus,
        })
      );
      const msg = err instanceof Error ? err.message : 'Claim failed';
      alert(`Could not claim ticket: ${msg}`);
    }
  };

  const formattedDate = new Date(ticket.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <tr
      className={`border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
      }`}
    >
      {/* Checkbox for bulk actions */}
      <td className="w-10 px-3 py-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => dispatch(toggleSelectTicket(ticket.id))}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
          aria-label={`Select ticket ${ticket.external_id}`}
        />
      </td>

      {/* Ticket ID & Subject */}
      <td className="px-3 py-3 max-w-[280px]">
        <Link href={`/tickets/${ticket.id}`} className="group block">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">
              {ticket.external_id}
            </span>
            {ticket.triage_decision === 'manual_review' && (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Needs manual review" />
            )}
          </div>
          <div
            className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[260px]"
            title={ticket.subject || '(No subject)'}
          >
            {ticket.subject || <span className="italic text-slate-400">(No subject)</span>}
          </div>
        </Link>
      </td>

      {/* Plan */}
      <td className="px-3 py-3 whitespace-nowrap">
        <PlanBadge plan={ticket.customer_plan} />
      </td>

      {/* Category */}
      <td className="px-3 py-3 whitespace-nowrap">
        <CategoryBadge category={ticket.category} />
      </td>

      {/* Priority */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={ticket.priority} />
          {ticket.ai_priority && ticket.ai_priority !== ticket.priority && (
            <span
              className="text-[10px] text-amber-600 dark:text-amber-400 font-mono"
              title={`AI suggested ${ticket.ai_priority}`}
            >
              (AI: {ticket.ai_priority})
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <StatusBadge status={ticket.status} />
      </td>

      {/* Agent */}
      <td className="px-3 py-3 whitespace-nowrap text-xs">
        {ticket.assigned_to ? (
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{ticket.assigned_to}</span>
          </span>
        ) : (
          <button
            onClick={handleQuickClaim}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
            title="Claim this ticket now"
          >
            <Hand className="w-3 h-3" />
            <span>Claim</span>
          </button>
        )}
      </td>

      {/* Created At */}
      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
        {formattedDate}
      </td>

      {/* SLA Countdown */}
      <td className="px-3 py-3 whitespace-nowrap">
        <SlaCountdown
          createdAt={ticket.created_at}
          priority={ticket.priority}
          ticketStatus={ticket.status}
        />
      </td>
    </tr>
  );
}

// React.memo ensures that when one ticket is claimed or updated, other rows do NOT redraw!
export const TicketTableRow = React.memo(TicketTableRowComponent, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.ticket.id === next.ticket.id &&
    prev.ticket.status === next.ticket.status &&
    prev.ticket.assigned_to === next.ticket.assigned_to &&
    prev.ticket.priority === next.ticket.priority &&
    prev.ticket.category === next.ticket.category &&
    prev.ticket.subject === next.ticket.subject &&
    prev.ticket.updated_at === next.ticket.updated_at
  );
});
