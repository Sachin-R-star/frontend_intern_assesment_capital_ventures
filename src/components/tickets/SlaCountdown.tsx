'use client';

import React, { useState, useEffect } from 'react';
import { calculateSla, SlaInfo } from '@/lib/utils/sla';
import { TicketPriority, TicketStatus } from '@/lib/api/types';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

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
    // If ticket is already resolved or closed, clock doesn't need to tick every second
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
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>{sla.label}</span>
      </span>
    );
  }

  if (sla.status === 'late') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-900 font-mono text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
        <span>Late ({sla.formattedCountdown})</span>
      </div>
    );
  }

  if (sla.status === 'at_risk') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-900 font-mono text-xs font-semibold">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
        <span>At Risk ({sla.formattedCountdown})</span>
      </div>
    );
  }

  if (sla.status === 'future') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span>Future ({sla.formattedCountdown})</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-mono text-xs">
      <Clock className="w-3.5 h-3.5 text-emerald-600" />
      <span>{sla.formattedCountdown}</span>
    </div>
  );
}
