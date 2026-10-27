'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Ticket } from '@/lib/api/types';
import { api } from '@/lib/api/client';
import { useAppDispatch } from '@/store/hooks';
import { updateSingleTicket } from '@/store/slices/ticketsSlice';
import { decrementToReviewCount } from '@/store/slices/statsSlice';
import { PriorityBadge, PlanBadge, CategoryBadge } from '@/components/common/Badge';
import { SafeHtml } from '@/components/common/SafeHtml';
import {
  ShieldAlert,
  CheckCircle,
  Edit3,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function AIReviewQueuePage() {
  const dispatch = useAppDispatch();
  const [reviewTickets, setReviewTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active ticket being edited / overridden
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<string>('');
  const [overridePriority, setOverridePriority] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tickets that require manual review
  const loadReviewQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTickets({
        triage_decision: 'manual_review',
        limit: 100,
      });
      setReviewTickets(res.tickets);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load review queue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewQueue();
  }, [loadReviewQueue]);

  // Handle: Accept AI recommendation as-is
  const handleAcceptAi = async (ticket: Ticket) => {
    try {
      setIsSubmitting(true);
      const updated = await api.triageTicket(ticket.id, {
        category: ticket.category,
        priority: ticket.priority,
        reason: 'Confirmed and accepted by human agent.',
      });

      // Handled ticket leaves the queue straight away!
      setReviewTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      dispatch(updateSingleTicket(updated));
      dispatch(decrementToReviewCount());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept AI triage';
      alert(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open override drawer / form
  const startOverride = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setOverrideCategory(ticket.category);
    setOverridePriority(ticket.priority);
    setOverrideReason('');
    setFormError(null);
  };

  // Submit override
  const handleOverrideSubmit = async (ticket: Ticket) => {
    setFormError(null);

    // Validation 1: Reason must be at least 10 characters
    if (!overrideReason || overrideReason.trim().length < 10) {
      setFormError('Reason must be at least 10 characters explaining your change.');
      return;
    }

    // Validation 2: Enterprise tickets must always stay at least P1 (P0 or P1)
    if (
      ticket.customer_plan === 'enterprise' &&
      (overridePriority === 'P2' || overridePriority === 'P3' || overridePriority === 'P5')
    ) {
      setFormError(
        'Enterprise Rule Violation: Enterprise plan tickets must always stay at least P1 (P0 or P1). You cannot set P2 or P3.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.triageTicket(ticket.id, {
        category: overrideCategory,
        priority: overridePriority,
        reason: overrideReason.trim(),
      });

      // Handled ticket leaves queue immediately
      setReviewTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      dispatch(updateSingleTicket(updated));
      dispatch(decrementToReviewCount());
      setEditingTicketId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Triage submission failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Triage Review Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review tickets where the automated classifier requested human oversight before routing.
          </p>
        </div>

        <button
          onClick={loadReviewQueue}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Loading */}
      {loading && reviewTickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Checking for tickets awaiting review...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={loadReviewQueue} className="text-xs font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && reviewTickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            All Caught Up!
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mb-4">
            There are currently no tickets requiring human verification in the review queue.
          </p>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition-colors"
          >
            <span>Go to All Tickets</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* List of Review Tickets */}
      <div className="space-y-3">
        {reviewTickets.map((ticket) => {
          const isEditing = editingTicketId === ticket.id;

          return (
            <div
              key={ticket.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {ticket.external_id}
                  </Link>
                  <PlanBadge plan={ticket.customer_plan} />
                  <CategoryBadge category={ticket.category} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-slate-400 font-mono">
                    Customer: {ticket.customer_id}
                  </span>
                </div>

                {ticket.review_reason && (
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium mr-1.5">Flag Reason:</span>
                    <span className="font-mono text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-semibold">
                      {ticket.review_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Subject & Summary */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white" dir="auto">
                  {ticket.subject || <span className="italic text-slate-400">(No subject)</span>}
                </h3>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-500 block mb-1">AI Generated Summary:</span>
                  <SafeHtml html={ticket.summary} fallbackText="(Summary not available or flagged)" />
                </div>
              </div>

              {/* Action Buttons: Accept vs Override */}
              {!isEditing ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                  >
                    View Full Customer Message →
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Override Button */}
                    <button
                      onClick={() => startOverride(ticket)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change Category / Priority</span>
                    </button>

                    {/* Accept AI Button */}
                    <button
                      onClick={() => handleAcceptAi(ticket)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Accept AI Answer</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Override Form */
                <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Override AI Classification
                  </h4>

                  {/* Form Error Banner */}
                  {formError && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200 dark:border-rose-900 text-xs font-medium">
                      ⚠️ {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        New Category
                      </label>
                      <select
                        value={overrideCategory}
                        onChange={(e) => setOverrideCategory(e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                      >
                        <option value="account_access">Account Access</option>
                        <option value="billing">Billing</option>
                        <option value="bug">Bug</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        New Priority{' '}
                        {ticket.customer_plan === 'enterprise' && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                            (Enterprise: P0 or P1 only)
                          </span>
                        )}
                      </label>
                      <select
                        value={overridePriority}
                        onChange={(e) => setOverridePriority(e.target.value)}
                        className="w-full text-xs py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                      >
                        <option value="P0">P0 (Critical - 1h)</option>
                        <option value="P1">P1 (High - 4h)</option>
                        <option value="P2">P2 (Medium - 24h)</option>
                        <option value="P3">P3 (Low - 72h)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reason Textarea (Minimum 10 chars) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Written Reason for Change <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          overrideReason.trim().length >= 10
                            ? 'text-emerald-600 font-semibold'
                            : 'text-amber-600'
                        }`}
                      >
                        {overrideReason.trim().length} / 10 characters min
                      </span>
                    </div>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      placeholder="Explain why you are changing the category or priority..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingTicketId(null)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleOverrideSubmit(ticket)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm"
                    >
                      {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save and Remove from Queue</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
