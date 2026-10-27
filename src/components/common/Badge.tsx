import React from 'react';

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toUpperCase();

  if (p === 'P0') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-rose-400"></span>
        P0
      </span>
    );
  }

  if (p === 'P1') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-amber-400"></span>
        P1
      </span>
    );
  }

  if (p === 'P2') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/35">
        P2
      </span>
    );
  }

  if (p === 'P3') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
        P3
      </span>
    );
  }

  // Non-standard priority (e.g. P5 from test cases)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
      {priority || 'Unknown'}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-cyan-400 animate-ping opacity-75"></span>
        Open
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.15)]">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-violet-400"></span>
        In Progress
      </span>
    );
  }

  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400"></span>
        Resolved
      </span>
    );
  }

  // Closed
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-500"></span>
      Closed
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const p = plan?.toLowerCase();

  if (p === 'enterprise') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
        ✨ Enterprise
      </span>
    );
  }

  if (p === 'pro') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
        ⚡ Pro
      </span>
    );
  }

  if (p === 'platinum') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-fuchsia-500/25 to-pink-500/25 text-fuchsia-300 border border-fuchsia-400/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]">
        💎 Platinum
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-medium tracking-wider bg-slate-800/90 text-slate-400 border border-slate-700/80">
      Free
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const c = category?.toLowerCase();
  const label = (category || 'other').replace(/_/g, ' ');

  if (c === 'billing' || c === 'urgent_billing') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        💰 {label}
      </span>
    );
  }

  if (c === 'feature_request') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize bg-purple-500/15 text-purple-300 border border-purple-500/30">
        💡 {label}
      </span>
    );
  }

  if (c === 'bug') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize bg-rose-500/15 text-rose-300 border border-rose-500/30">
        🐞 {label}
      </span>
    );
  }

  if (c === 'account_access') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize bg-teal-500/15 text-teal-300 border border-teal-500/30">
        🔑 {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize bg-slate-800 text-slate-300 border border-slate-700">
      📁 {label}
    </span>
  );
}

export function DecisionBadge({ decision, reason }: { decision: string; reason?: string | null }) {
  if (decision === 'manual_review') {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
        title={reason ? `Flagged: ${reason}` : 'Needs Human Review'}
      >
        ⚠️ Review Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      ✓ AI Accepted
    </span>
  );
}
