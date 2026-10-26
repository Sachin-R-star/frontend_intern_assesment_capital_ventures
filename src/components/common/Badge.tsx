import React from 'react';

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (p === 'P0') {
    color = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900 font-bold animate-pulse';
  } else if (p === 'P1') {
    color = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900 font-semibold';
  } else if (p === 'P2') {
    color = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900';
  } else if (p === 'P3') {
    color = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900';
  } else {
    // Unknown or invalid like P5
    color = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900 font-mono';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${color}`}>
      {priority || 'Unknown'}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
  let label = status;

  if (status === 'open') {
    color = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800';
    label = 'Open';
  } else if (status === 'in_progress') {
    color = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 font-medium';
    label = 'In Progress';
  } else if (status === 'resolved') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    label = 'Resolved';
  } else if (status === 'closed') {
    color = 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    label = 'Closed';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
  const p = plan?.toLowerCase();

  if (p === 'enterprise') {
    color = 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 font-semibold';
  } else if (p === 'pro') {
    color = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
  } else if (p === 'platinum') {
    color = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800 font-medium';
  } else {
    color = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border ${color}`}>
      {plan || 'Free'}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const formatted = (category || 'other').replace(/_/g, ' ');
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
      {formatted}
    </span>
  );
}

export function DecisionBadge({ decision, reason }: { decision: string; reason?: string | null }) {
  if (decision === 'manual_review') {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
        title={reason ? `Flagged: ${reason}` : 'Needs Human Review'}
      >
        ⚠️ Review Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
      ✓ AI Accepted
    </span>
  );
}
