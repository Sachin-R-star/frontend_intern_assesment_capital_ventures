import {
  Ticket,
  PaginatedTicketsResponse,
  TicketUpdatesResponse,
  TicketStatus,
  TicketFilterState,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    throw new ApiError(errorMsg, res.status);
  }

  return data as T;
}

export const api = {
  getTickets: (filters: Partial<TicketFilterState> & { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.triage_decision && filters.triage_decision !== 'all') params.set('triage_decision', filters.triage_decision);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());

    return request<PaginatedTicketsResponse>(`/api/tickets?${params.toString()}`);
  },

  getTicketById: (id: string) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}`);
  },

  claimTicket: (id: string, agentId: string) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/claim`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    });
  },

  updateStatus: (id: string, status: TicketStatus) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  triageTicket: (id: string, payload: { category: string; priority: string; reason: string }) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/triage`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  retriageTicket: (id: string) => {
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/retriage`, {
      method: 'POST',
    });
  },

  getUpdates: (since?: string) => {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return request<TicketUpdatesResponse>(`/api/tickets/updates${query}`);
  },
};
