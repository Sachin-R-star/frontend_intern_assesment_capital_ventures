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

  const since = searchParams.get('since') || undefined;
  const store = getTicketStore();
  const updates = store.getUpdatesSince(since);

  return NextResponse.json(updates);
}
