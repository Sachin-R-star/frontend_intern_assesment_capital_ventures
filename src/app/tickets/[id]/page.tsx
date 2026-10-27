'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, TicketStatus } from '@/lib/api/types';
import { api } from '@/lib/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSingleTicket, optimisticClaim, rollbackClaim } from '@/store/slices/ticketsSlice';
import { incrementAgentCount } from '@/store/slices/statsSlice';
import { PriorityBadge, StatusBadge, PlanBadge, CategoryBadge, DecisionBadge } from '@/components/common/Badge';
import { SafeHtml } from '@/components/common/SafeHtml';
import { SlaCountdown } from '@/components/tickets/SlaCountdown';
import { validateAttachmentUrl } from '@/lib/utils/sanitize';
import {
  ArrowLeft,
  Hand,
  Sparkles,
  Paperclip,
  ShieldAlert,
  User,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

function TicketDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debouncing / preventing duplicate concurrent requests on fast double clicks
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRetriaging, setIsRetriaging] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Load ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTicketById(id);
      setTicket(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ticket not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Periodic polling to update ticket state if another agent claims it while viewing!
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await api.getTicketById(id);
        setTicket((prev) => {
          if (!prev) return fresh;
          // Check if another agent claimed it
          if (fresh.assigned_to && fresh.assigned_to !== prev.assigned_to) {
            setToastMessage({
              type: 'error',
              text: `Notice: This ticket was just assigned to ${fresh.assigned_to}.`,
            });
          }
          return fresh;
        });
      } catch {
        // Silently skip background poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Optimistic Claim
  const handleClaim = async () => {
    if (isClaiming || !ticket) return;
    setIsClaiming(true);

    const prevAssignedTo = ticket.assigned_to;
    const prevStatus = ticket.status;

    // Instant optimistic update on screen
    const optimisticallyUpdated: Ticket = {
      ...ticket,
      assigned_to: currentAgentId,
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
    };
    setTicket(optimisticallyUpdated);
    dispatch(optimisticClaim({ ticketId: ticket.id, agentId: currentAgentId }));

    try {
      const serverTicket = await api.claimTicket(ticket.id, currentAgentId);
      setTicket(serverTicket);
      dispatch(updateSingleTicket(serverTicket));
      dispatch(incrementAgentCount(currentAgentId));
      setToastMessage({ type: 'success', text: 'You claimed this ticket successfully.' });
    } catch (err: unknown) {
      // Revert optimistic change
      const reverted: Ticket = {
        ...ticket,
        assigned_to: prevAssignedTo,
        status: prevStatus,
      };
      setTicket(reverted);
      dispatch(
        rollbackClaim({
          ticketId: ticket.id,
          previousAssignedTo: prevAssignedTo,
          previousStatus: prevStatus,
        })
      );
      const msg = err instanceof Error ? err.message : 'Claim conflict occurred';
      setToastMessage({ type: 'error', text: `Claim failed: ${msg}` });
    } finally {
      setIsClaiming(false);
    }
  };

  // Status transition with double-click guard
  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (isUpdatingStatus || !ticket) return;
    setIsUpdatingStatus(true);

    try {
      const updated = await api.updateStatus(ticket.id, nextStatus);
      setTicket(updated);
      dispatch(updateSingleTicket(updated));
      setToastMessage({ type: 'success', text: `Ticket moved to ${nextStatus}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setToastMessage({ type: 'error', text: `Error updating status: ${msg}` });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Re-run AI triage
  const handleRetriage = async () => {
    if (isRetriaging || !ticket) return;
    setIsRetriaging(true);

    try {
      const updated = await api.retriageTicket(ticket.id);
      setTicket(updated);
      dispatch(updateSingleTicket(updated));
      setToastMessage({ type: 'success', text: 'AI re-analysis completed successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Re-triage failed';
      setToastMessage({ type: 'error', text: `AI Service Error: ${msg}` });
    } finally {
      setIsRetriaging(false);
    }
  };

  // Calculate allowed next status transitions:
  // open -> in_progress
  // in_progress -> resolved
  // resolved -> open
  // closed -> open
  const allowedNextStatuses: {
    status: TicketStatus;
    label: string;
    icon: React.ReactNode;
    className: string;
  }[] = [];
  if (ticket) {
    if (ticket.status === 'open') {
      allowedNextStatuses.push({
        status: 'in_progress',
        label: 'Mark In Progress',
        icon: <PlayCircle className="w-4 h-4 text-white" />,
        className:
          'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-blue-500/25',
      });
    } else if (ticket.status === 'in_progress') {
      allowedNextStatuses.push({
        status: 'resolved',
        label: 'Mark Resolved',
        icon: <CheckCircle className="w-4 h-4 text-white" />,
        className:
          'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25',
      });
    } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
      allowedNextStatuses.push({
        status: 'open',
        label: 'Reopen Ticket',
        icon: <RotateCcw className="w-4 h-4 text-white" />,
        className:
          'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-500/25',
      });
    }
  }

  // 1. Loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading ticket details...</p>
      </div>
    );
  }

  // 2. 404 Not Found Page
  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Ticket Not Found
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          The ticket with ID <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 font-mono">{id}</code> could not be found. It may have been deleted or never existed.
        </p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to All Tickets</span>
        </Link>
      </div>
    );
  }

  const attachmentSafety = validateAttachmentUrl(ticket.attachment_url);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-md animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-900'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ticket Desk</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Claim Button */}
          {ticket.assigned_to !== currentAgentId && (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-violet-500/25 transition-all"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hand className="w-4 h-4" />}
              <span>{ticket.assigned_to ? `Take Over from ${ticket.assigned_to}` : 'Claim Ticket'}</span>
            </button>
          )}

          {/* Re-run AI Triage Button */}
          <button
            onClick={handleRetriage}
            disabled={isRetriaging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-amber-500/40 shadow-sm transition-all"
            title="Re-run AI classifier using server-side secret key"
          >
            {isRetriaging ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
            <span>Re-run AI</span>
          </button>
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 shadow-sm space-y-4">
        {/* Ticket Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-2 py-0.5 rounded-md">
                {ticket.external_id}
              </span>
              <PlanBadge plan={ticket.customer_plan} />
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words" dir="auto">
              {ticket.subject || <span className="italic text-slate-400">(No subject provided)</span>}
            </h1>
          </div>

          {/* SLA Countdown & Created Time */}
          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span>SLA Status:</span>
              <SlaCountdown
                createdAt={ticket.created_at}
                priority={ticket.priority}
                ticketStatus={ticket.status}
              />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer & Assignment Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Customer ID</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {ticket.customer_id}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Customer Plan</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
              {ticket.customer_plan}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assigned Agent</span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
              <User className="w-3.5 h-3.5 text-violet-500" />
              <span>{ticket.assigned_to ? (
                <span className="text-violet-600 dark:text-violet-300 font-bold">{ticket.assigned_to}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic">Unassigned</span>
              )}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Current Status</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
              {ticket.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Customer Body (Rich HTML sanitized safely!) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Customer Message Body
          </h2>
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 min-h-[100px]">
            <SafeHtml html={ticket.body} fallbackText="(The customer did not provide a message body.)" />
          </div>
        </div>

        {/* Attachment Section with URL Protocol Security Defense */}
        {ticket.attachment_url && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Attachment
            </h2>
            {attachmentSafety.isSafe && attachmentSafety.sanitizedUrl ? (
              <a
                href={attachmentSafety.sanitizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200 dark:border-violet-800 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                <span className="truncate max-w-md">{attachmentSafety.sanitizedUrl}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-900 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Security Alert: </span>
                  {attachmentSafety.warning} (Target: <code className="bg-rose-100 dark:bg-rose-900 px-1 rounded">{ticket.attachment_url}</code>)
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Triage Analysis Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                AI Triage Analysis
              </h3>
            </div>
            <DecisionBadge decision={ticket.triage_decision} reason={ticket.review_reason} />
          </div>

          <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            <div>
              <span className="font-semibold text-slate-500">Summary: </span>
              <SafeHtml html={ticket.summary} fallbackText="(No automated summary generated)" className="inline" />
            </div>

            {ticket.review_reason && (
              <div>
                <span className="font-semibold text-slate-500">Triage Flag Reason: </span>
                <span className="font-mono bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
                  {ticket.review_reason}
                </span>
              </div>
            )}

            {/* Display discrepancy if final priority differs from AI suggested priority */}
            {ticket.ai_priority && ticket.ai_priority !== ticket.priority && (
              <div className="mt-2 p-2.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Priority Adjustment Notice:</strong> The AI model initially recommended priority{' '}
                <span className="font-mono font-bold">{ticket.ai_priority}</span>, but the final priority was set to{' '}
                <span className="font-mono font-bold">{ticket.priority}</span> ({ticket.review_reason === 'rule_adjusted' ? 'Enforced by Enterprise Customer SLA Policy' : 'Overridden during review'}).
              </div>
            )}
          </div>
        </div>

        {/* Allowed Next Status Transitions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Allowed workflow transitions from <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.status}</span>:
          </div>

          <div className="flex items-center gap-2">
            {allowedNextStatuses.map((step) => (
              <button
                key={step.status}
                onClick={() => handleStatusChange(step.status)}
                disabled={isUpdatingStatus}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${step.className}`}
              >
                {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : step.icon}
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading ticket details...</p>
        </div>
      }
    >
      <TicketDetailContent paramsPromise={params} />
    </React.Suspense>
  );
}
