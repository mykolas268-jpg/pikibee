import { NextResponse } from 'next/server';
import { CONSENT_VERSION } from '@/content/site';

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

interface ConsentRecord {
  email: string;
  /** Consent is only evidence if you can prove what was agreed and when. */
  consent: true;
  consentVersion: string;
  consentedAt: string;
  source: string;
}

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

  const body = (payload ?? {}) as Record<string, unknown>;

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || email.length > MAX_LENGTH || !EMAIL.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 },
    );
  }

  // Art. 6(1)(a) GDPR: no consent, no lawful basis, no storage. The client
  // cannot be trusted to have enforced the checkbox, so refuse here too.
  if (body.consent !== true) {
    return NextResponse.json(
      { ok: false, error: 'consent_required' },
      { status: 422 },
    );
  }

  const record: ConsentRecord = {
    email,
    consent: true,
    // Trust the server's own version string, not one the client sent.
    consentVersion: CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
    source: 'site:early-access',
  };

  // TODO: replace with the provider call, and persist `record` in full — the
  // consent metadata is the part that makes the address lawful to hold.
  //
  // Logging an address is acceptable for a stub. It is NOT acceptable once
  // this is public: server logs are not a mailing list, they are usually
  // retained longer than the notice promises, and they are copied to places
  // an erasure request will never reach. Drop this line when you wire the
  // provider.
  console.log('[waitlist] queued', {
    ...record,
    email: `${email.slice(0, 2)}***`,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
}
