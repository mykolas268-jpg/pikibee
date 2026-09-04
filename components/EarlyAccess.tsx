'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Typewriter from './Typewriter';
import { earlyAccess } from '@/content/site';

type Status = 'idle' | 'sending' | 'done' | 'error';

// Deliberately loose: the server is the authority, this only catches typos.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EarlyAccess() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;

    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus('error');
      setMessage(earlyAccess.errors.invalid);
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage(earlyAccess.errors.consent);
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, consent: true }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage(earlyAccess.errors.failed);
    }
  }

  return (
    <section
      id="access"
      className="w-full border-t border-hairline px-5 py-24 md:px-10 md:py-36 md:pr-[34vw]"
    >
      <div className="w-full">
        <p className="mb-10 font-mono text-[10px] uppercase tracking-widest text-amber md:mb-16 md:text-xs">
          {earlyAccess.index}
        </p>

        <h2 className="max-w-copy font-mono text-2xl leading-tight tracking-tight text-bone md:text-4xl">
          {earlyAccess.title}
        </h2>
        <p className="mt-5 max-w-[46ch] font-mono text-sm leading-relaxed text-bone/55 md:text-[0.95rem]">
          {earlyAccess.body}
        </p>

        <div className="mt-10 md:mt-14">
          {status === 'done' ? (
            <Typewriter
              as="p"
              retype={false}
              speed={22}
              text={earlyAccess.success}
              className="font-mono text-sm text-amber md:text-base"
            />
          ) : (
            <form onSubmit={onSubmit} noValidate className="w-full max-w-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
                <label htmlFor="waitlist-email" className="sr-only">
                  {earlyAccess.placeholder}
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder={earlyAccess.placeholder}
                  className="w-full border border-bone bg-transparent px-4 py-3 font-mono text-sm text-bone outline-none transition-colors duration-120 placeholder:text-bone/30 focus:border-amber sm:flex-1"
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="border border-bone bg-bone px-8 py-3 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors duration-120 hover:bg-ink hover:text-bone disabled:cursor-not-allowed disabled:opacity-50 sm:border-l-0 md:text-xs"
                >
                  {status === 'sending' ? earlyAccess.submitting : earlyAccess.submit}
                </button>
              </div>

              {/*
                Unticked by default and never auto-checked: GDPR Art. 4(11)
                needs an affirmative action, and a pre-ticked box is not one.
              */}
              <label
                htmlFor="waitlist-consent"
                className="mt-6 flex cursor-pointer items-start gap-3"
              >
                <input
                  id="waitlist-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (status === 'error') setStatus('idle');
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center border border-bone/60 transition-colors duration-120 peer-checked:border-amber peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber"
                >
                  <span
                    className={`h-2 w-2 bg-amber transition-opacity duration-120 ${
                      consent ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </span>
                <span className="font-mono text-xs leading-relaxed text-bone/70">
                  {earlyAccess.consent.label}
                </span>
              </label>

              <p className="mt-4 max-w-[62ch] pl-7 font-mono text-[10px] leading-relaxed text-bone/40 md:text-[11px]">
                {earlyAccess.consent.detail}{' '}
                <Link
                  href={earlyAccess.consent.linkHref}
                  className="uppercase tracking-widest text-bone/60 underline underline-offset-4 transition-colors duration-120 hover:text-amber"
                >
                  {earlyAccess.consent.linkLabel}
                </Link>
              </p>
            </form>
          )}

          {status === 'error' && (
            <p
              role="alert"
              className="mt-4 font-mono text-xs text-amber md:text-sm"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
