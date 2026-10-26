import { TicketPriority, TicketStatus } from '../api/types';

export const SLA_DURATIONS_MS: Record<string, number> = {
  P0: 1 * 60 * 60 * 1000,        // 1 hour
  P1: 4 * 60 * 60 * 1000,        // 4 hours
  P2: 24 * 60 * 60 * 1000,       // 24 hours
  P3: 72 * 60 * 60 * 1000,       // 72 hours
};

export type SlaStatus = 'late' | 'at_risk' | 'on_track' | 'completed' | 'future';

export interface SlaInfo {
  status: SlaStatus;
  label: string;
  deadlineDate: Date;
  remainingMs: number;
  formattedCountdown: string;
  percentRemaining: number;
  isOverdue: boolean;
}

/**
 * Robustly parses various date formats, including:
 * - ISO strings: 2026-09-20T09:15:00Z
 * - Space-separated strings: 2026-09-20 11:30:00
 * - Timezone offsets: 2026-09-21T08:45:00+05:30
 */
export function parseTicketDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  
  // Clean up space separator if not standard ISO
  let normalized = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }

  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) {
    // Fallback if parsing fails
    return new Date();
  }
  return parsed;
}

/**
 * Calculates the SLA deadline and status for a ticket
 */
export function calculateSla(
  createdAtStr: string,
  priority: TicketPriority,
  ticketStatus?: TicketStatus,
  now: Date = new Date()
): SlaInfo {
  const createdAt = parseTicketDate(createdAtStr);
  const durationMs = SLA_DURATIONS_MS[priority] ?? SLA_DURATIONS_MS.P3; // Fallback for invalid priority like P5
  const deadlineDate = new Date(createdAt.getTime() + durationMs);

  const remainingMs = deadlineDate.getTime() - now.getTime();
  const totalDuration = durationMs;
  const percentRemaining = Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100));

  // If ticket is already resolved or closed, SLA clock is effectively stopped
  if (ticketStatus === 'resolved' || ticketStatus === 'closed') {
    return {
      status: 'completed',
      label: ticketStatus === 'resolved' ? 'Resolved' : 'Closed',
      deadlineDate,
      remainingMs: Math.max(0, remainingMs),
      formattedCountdown: 'Completed',
      percentRemaining: 100,
      isOverdue: remainingMs < 0,
    };
  }

  // Future ticket edge case (e.g. T-2008)
  if (createdAt.getTime() > now.getTime()) {
    return {
      status: 'future',
      label: 'Scheduled',
      deadlineDate,
      remainingMs,
      formattedCountdown: formatDuration(remainingMs),
      percentRemaining: 100,
      isOverdue: false,
    };
  }

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    return {
      status: 'late',
      label: 'Late',
      deadlineDate,
      remainingMs,
      formattedCountdown: `-${formatDuration(overdueMs)}`,
      percentRemaining: 0,
      isOverdue: true,
    };
  }

  if (percentRemaining < 20) {
    return {
      status: 'at_risk',
      label: 'At Risk',
      deadlineDate,
      remainingMs,
      formattedCountdown: formatDuration(remainingMs),
      percentRemaining,
      isOverdue: false,
    };
  }

  return {
    status: 'on_track',
    label: 'On Track',
    deadlineDate,
    remainingMs,
    formattedCountdown: formatDuration(remainingMs),
    percentRemaining,
    isOverdue: false,
  };
}

/**
 * Formats milliseconds into concise human-readable countdown: e.g. "1h 24m 12s", "42m 05s", "12s"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
