import { NextResponse } from 'next/server';

/**
 * Waitlist stub.
 *
 * TODO: wire to a real provider (Resend audience, Loops, Klaviyo, a DB table —
 * whatever ends up owning the list). Until then this validates, logs, and
 * returns 200 so the front end can be built and demoed against it.
 *
 * Nothing is persisted. Do not run a public launch on this route.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LENGTH = 254;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const email =
    typeof payload === 'object' &&
    payload !== null &&
    'email' in payload &&
    typeof (payload as { email: unknown }).email === 'string'
      ? (payload as { email: string }).email.trim().toLowerCase()
      : '';

  if (!email || email.length > MAX_LENGTH || !EMAIL.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 },
    );
  }

  // TODO: replace with the provider call. Logging an address is fine for a
  // stub; it is not fine once this is public — server logs are not a mailing
  // list and this is personal data.
  console.log('[waitlist] queued', email);

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
}
