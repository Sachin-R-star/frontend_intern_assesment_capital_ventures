import { NextRequest, NextResponse } from 'next/server';
import { getTicketStore, simulateServerBehavior } from '@/lib/api/mockStore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isTestMode = searchParams.get('test_mode') === 'true' || request.headers.get('x-test-mode') === 'true';

  try {
    await simulateServerBehavior(isTestMode);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;
  const category = searchParams.get('category') || undefined;
  const triage_decision = searchParams.get('triage_decision') || searchParams.get('decision') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

  const store = getTicketStore();
  const result = store.getTickets({
    status,
    priority,
    category,
    triage_decision,
    search,
    page,
    limit,
  });

  return NextResponse.json(result);
}
