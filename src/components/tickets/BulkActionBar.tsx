'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSelectedTickets, optimisticClaim, rollbackClaim, updateSingleTicket } from '@/store/slices/ticketsSlice';
import { incrementAgentCount } from '@/store/slices/statsSlice';
import { api } from '@/lib/api/client';
import { TicketStatus } from '@/lib/api/types';
import { CheckSquare, Hand, PlayCircle, CheckCircle, X, Loader2 } from 'lucide-react';

export function BulkActionBar() {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((state) => state.tickets.selectedTicketIds);
  const tickets = useAppSelector((state) => state.tickets.items);
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    successCount: number;
    failedCount: number;
    details: string[];
  } | null>(null);

  if (selectedIds.length === 0) return null;

  const selectedTickets = tickets.filter((t) => selectedIds.includes(t.id));

  // Bulk Claim
  const handleBulkClaim = async () => {
    setIsProcessing(true);
    setResultSummary(null);

    let successCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    for (const ticket of selectedTickets) {
      const prevAgent = ticket.assigned_to;
      const prevStatus = ticket.status;

      // Optimistic update
      dispatch(optimisticClaim({ ticketId: ticket.id, agentId: currentAgentId }));

      try {
        await api.claimTicket(ticket.id, currentAgentId);
        dispatch(incrementAgentCount(currentAgentId));
        successCount++;
        details.push(`✓ ${ticket.external_id}: Claimed successfully`);
      } catch (err: unknown) {
        // Rollback only failed ones!
        dispatch(
          rollbackClaim({
            ticketId: ticket.id,
            previousAssignedTo: prevAgent,
            previousStatus: prevStatus,
          })
        );
        failedCount++;
        const msg = err instanceof Error ? err.message : 'Claim conflict';
        details.push(`✗ ${ticket.external_id}: Failed (${msg})`);
      }
    }

    setIsProcessing(false);
    setResultSummary({ successCount, failedCount, details });
    dispatch(clearSelectedTickets());
  };

  // Bulk Status change (e.g. resolve)
  const handleBulkStatus = async (newStatus: TicketStatus) => {
    setIsProcessing(true);
    setResultSummary(null);

    let successCount = 0;
    let failedCount = 0;
    const details: string[] = [];

    for (const ticket of selectedTickets) {
      try {
        const updated = await api.updateStatus(ticket.id, newStatus);
        dispatch(updateSingleTicket(updated));
        successCount++;
        details.push(`✓ ${ticket.external_id}: Status moved to ${newStatus}`);
      } catch (err: unknown) {
        failedCount++;
        const msg = err instanceof Error ? err.message : 'Invalid transition';
        details.push(`✗ ${ticket.external_id}: ${msg}`);
      }
    }

    setIsProcessing(false);
    setResultSummary({ successCount, failedCount, details });
    dispatch(clearSelectedTickets());
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-sm">
            {selectedIds.length} ticket{selectedIds.length > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Claim All */}
          <button
            onClick={handleBulkClaim}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hand className="w-3.5 h-3.5" />}
            <span>Claim All</span>
          </button>

          {/* Mark In Progress */}
          <button
            onClick={() => handleBulkStatus('in_progress')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>In Progress</span>
          </button>

          {/* Mark Resolved */}
          <button
            onClick={() => handleBulkStatus('resolved')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Resolve</span>
          </button>

          {/* Dismiss selection */}
          <button
            onClick={() => dispatch(clearSelectedTickets())}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cancel selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results details drawer if bulk action completed */}
      {resultSummary && (
        <div className="mt-3 pt-3 border-t border-slate-700 text-xs space-y-1 max-h-36 overflow-y-auto">
          <div className="font-semibold text-slate-300">
            Results: {resultSummary.successCount} succeeded, {resultSummary.failedCount} failed
          </div>
          {resultSummary.details.map((line, idx) => (
            <div
              key={idx}
              className={line.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
