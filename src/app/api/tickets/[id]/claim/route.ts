import { NextRequest, NextResponse } from 'next/server';
import { getTicketStore, simulateServerBehavior } from '@/lib/api/mockStore';

export async function POST(
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

  let body: { agent_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.agent_id) {
    return NextResponse.json({ error: 'Missing required field: agent_id.' }, { status: 400 });
  }

  const store = getTicketStore();
  const result = store.claimTicket(id, body.agent_id, isTestMode);

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.ticket, { status: 200 });
}
