'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentAgent } from '@/store/slices/agentSlice';
import { AGENTS } from '@/lib/api/types';
import { UserCheck } from 'lucide-react';

export function AgentSelector() {
  const dispatch = useAppDispatch();
  const currentAgentId = useAppSelector((state) => state.agent.currentAgentId);

  const currentAgent = AGENTS.find((a) => a.id === currentAgentId) || AGENTS[0];

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="agent-picker" className="sr-only">
        Active Agent
      </label>
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-colors hover:border-indigo-400">
        <span className="text-base" role="img" aria-label="avatar">
          {currentAgent.avatar}
        </span>
        <select
          id="agent-picker"
          value={currentAgentId}
          onChange={(e) => dispatch(setCurrentAgent(e.target.value))}
          className="bg-transparent border-none pr-4 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
        >
          {AGENTS.map((agent) => (
            <option key={agent.id} value={agent.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
              {agent.name} ({agent.id})
            </option>
          ))}
        </select>
        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 -ml-3 pointer-events-none" />
      </div>
    </div>
  );
}
