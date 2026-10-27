'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { Inbox, ShieldAlert, Zap, UserCheck, ArrowUpRight } from 'lucide-react';

export function TicketStatsSummary() {
  const total = useAppSelector((state) => state.tickets.total);
  const items = useAppSelector((state) => state.tickets.items);
  const toReviewCount = useAppSelector((state) => state.stats.toReviewCount);
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);
  const agentTicketCounts = useAppSelector((state) => state.stats.agentTicketCounts);

  const myTicketsCount = agentTicketCounts[currentAgentId] || 0;
  const criticalCount = items.filter((t) => t.priority === 'P0' || t.priority === 'P1').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      {/* 1. Total Queue Card (Cyan) */}
      <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md border border-cyan-500/20 dark:border-cyan-500/20 shadow-sm flex items-center justify-between group hover:border-cyan-500/40 transition-all">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
            Total Queue
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {total.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Real-time live tickets
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
          <Inbox className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Critical & High Urgency (Crimson / Rose) */}
      <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/20 shadow-sm flex items-center justify-between group hover:border-rose-500/40 transition-all">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Urgent (P0 / P1)
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {criticalCount}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Strict &lt;4h SLA targets
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* 3. AI Review Queue (Amber / Orange) */}
      <Link
        href="/review"
        className="p-3 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md border border-amber-500/25 dark:border-amber-500/25 shadow-sm flex items-center justify-between group hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
        title="Click to view AI Review Queue"
      >
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Needs AI Review
            </span>
            <ArrowUpRight className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {toReviewCount}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Flagged for agent check
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </Link>

      {/* 4. Active Claimed Tickets (Violet / Purple) */}
      <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md border border-violet-500/20 dark:border-violet-500/20 shadow-sm flex items-center justify-between group hover:border-violet-500/40 transition-all">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
            My Claimed
          </span>
          <span className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400">
            {myTicketsCount}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Assigned to {currentAgentId}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
