'use client';

import React, { useState, useEffect } from 'react';
import { calculateSla, SlaInfo } from '@/lib/utils/sla';
import { TicketPriority, TicketStatus } from '@/lib/api/types';
import { AlertCircle, Clock, CheckCircle2, Flame } from 'lucide-react';

interface SlaCountdownProps {
  createdAt: string;
  priority: TicketPriority;
  ticketStatus?: TicketStatus;
}

export function SlaCountdown({ createdAt, priority, ticketStatus }: SlaCountdownProps) {
  const [sla, setSla] = useState<SlaInfo>(() =>
    calculateSla(createdAt, priority, ticketStatus, new Date())
  );

  useEffect(() => {
    if (ticketStatus === 'resolved' || ticketStatus === 'closed') {
      setSla(calculateSla(createdAt, priority, ticketStatus, new Date()));
      return;
    }

    const interval = setInterval(() => {
      setSla(calculateSla(createdAt, priority, ticketStatus, new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, priority, ticketStatus]);

  if (sla.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{sla.label}</span>
      </span>
    );
  }

  if (sla.status === 'late') {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-mono text-xs font-bold animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Late ({sla.formattedCountdown})</span>
      </div>
    );
  }

  if (sla.status === 'at_risk') {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)] font-mono text-xs font-bold">
        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
        <span>At Risk ({sla.formattedCountdown})</span>
      </div>
    );
  }

  if (sla.status === 'future') {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/35 font-mono text-xs">
        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>Future ({sla.formattedCountdown})</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-[0_0_6px_rgba(16,185,129,0.15)] font-mono text-xs font-medium">
      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>{sla.formattedCountdown}</span>
    </div>
  );
}
