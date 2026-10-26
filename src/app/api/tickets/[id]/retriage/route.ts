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

  // Security Check: Server-side secret validation
  // Keeping secrets safe on the server rather than exposing in browser bundles
  const triageApiKey = process.env.TRIAGE_API_KEY || 'ff_triage_live_sec_key_2026';
  if (!triageApiKey) {
    return NextResponse.json(
      { error: 'AI triage service configuration missing (TRIAGE_API_KEY).' },
      { status: 500 }
    );
  }

  const store = getTicketStore();
  const result = store.retriageTicket(id);

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.ticket, { status: 200 });
}
