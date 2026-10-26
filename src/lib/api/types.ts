export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3' | string;

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketCategory =
  | 'account_access'
  | 'billing'
  | 'bug'
  | 'feature_request'
  | 'other'
  | string;

export type CustomerPlan = 'free' | 'pro' | 'enterprise' | string;

export type TriageDecision = 'auto_accept' | 'manual_review' | string;

export interface Agent {
  id: string;
  name: string;
  avatar: string;
}

export const AGENTS: Agent[] = [
  { id: 'agent-1', name: 'Priya', avatar: '👩🏽' },
  { id: 'agent-2', name: 'Rahul', avatar: '👨🏽' },
  { id: 'agent-3', name: 'Meera', avatar: '👩🏻' },
];

export interface Ticket {
  id: string;
  external_id: string;
  customer_id: string;
  customer_plan: CustomerPlan;
  subject: string;
  body: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  status: TicketStatus;
  assigned_to: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  ai_priority?: TicketPriority;
  summary: string | null;
  triage_decision: TriageDecision;
  review_reason: string | null;
}

export interface TicketFilterState {
  status: string;
  priority: string;
  category: string;
  triage_decision: string;
  search: string;
}

export interface PaginatedTicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TicketUpdatesResponse {
  updates: Ticket[];
  timestamp: string;
  stats: {
    totalTickets: number;
    toReviewCount: number;
    agentTicketCounts: Record<string, number>;
  };
}

export interface ClaimTicketPayload {
  agent_id: string;
}

export interface UpdateStatusPayload {
  status: TicketStatus;
}

export interface TriageTicketPayload {
  category: string;
  priority: string;
  reason: string;
}
