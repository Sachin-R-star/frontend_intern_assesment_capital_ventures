'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { AgentSelector } from './AgentSelector';
import { Inbox, Sparkles, ShieldAlert, Menu, X } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);
  const toReviewCount = useAppSelector((state) => state.stats.toReviewCount);
  const agentTicketCounts = useAppSelector((state) => state.stats.agentTicketCounts);

  const myTicketsCount = agentTicketCounts[currentAgentId] || 0;

  const isTicketsActive = pathname === '/' || pathname.startsWith('/tickets');
  const isReviewActive = pathname.startsWith('/review');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/tickets" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg leading-tight">
                  Freeflow
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Support Desk
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/tickets"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isTicketsActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>All Tickets</span>
              </Link>

              <Link
                href="/review"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isReviewActive
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>AI Review Queue</span>
                {toReviewCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                    {toReviewCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Right Section: Counters & Agent Selector */}
          <div className="hidden sm:flex items-center gap-3">
            {/* My Tickets counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-xs font-medium text-indigo-900 dark:text-indigo-200"
              title="Tickets assigned to you and currently active"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>My tickets:</span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {myTicketsCount}
              </span>
            </div>

            {/* To Review counter */}
            <Link
              href="/review"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
              title="Tickets flagged for manual review"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>To review:</span>
              <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                {toReviewCount}
              </span>
            </Link>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Agent picker */}
            <AgentSelector />
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-2">
            <AgentSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-2">
            <Link
              href="/tickets"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                isTicketsActive
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                <span>All Tickets</span>
              </div>
            </Link>

            <Link
              href="/review"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                isReviewActive
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>AI Review Queue</span>
              </div>
              {toReviewCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                  {toReviewCount}
                </span>
              )}
            </Link>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs px-2">
              <span className="text-slate-500">My active tickets:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{myTicketsCount}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
