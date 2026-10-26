import { NextRequest, NextResponse } from 'next/server';
import { getTicketStore, simulateServerBehavior } from '@/lib/api/mockStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isTestMode =
    request.nextUrl.searchParams.get('test_mode') === 'true' ||
    request.headers.get('x-test-mode') === 'true';

  try {
    await simulateServerBehavior(isTestMode);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const store = getTicketStore();
  const ticket = store.getTicketById(id);

  if (!ticket) {
    return NextResponse.json({ error: `Ticket with ID '${id}' not found.` }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
