import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import { brand, privacy } from '@/content/site';

export const metadata: Metadata = {
  title: `Privacy Notice — ${brand.name}`,
  description: 'How pikibee handles the email address you give to the waitlist.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-ink">
        <nav className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <Link href="/" aria-label={brand.name}>
            <Logo />
          </Link>
          <Link
            href="/"
            className="border border-bone bg-bone px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors duration-120 hover:bg-ink hover:text-bone md:px-5 md:text-xs"
          >
            {privacy.back}
          </Link>
        </nav>
      </header>

      <main className="relative z-10 min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pb-36 md:pt-44">
        <div className="mb-10 flex items-baseline justify-between md:mb-16">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber md:text-xs">
            {privacy.index}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40 md:text-xs">
            {privacy.updated}
          </p>
        </div>

        <h1 className="max-w-copy font-mono text-2xl leading-tight tracking-tight text-bone md:text-4xl">
          {privacy.title}
        </h1>
        <p className="mt-6 max-w-[62ch] font-mono text-sm leading-relaxed text-bone/60 md:text-[0.95rem]">
          {privacy.intro}
        </p>

        <dl className="mt-14 w-full border-t border-hairline md:mt-20">
          {privacy.sections.map((section) => (
            <div
              key={section.key}
              className="flex flex-col gap-2 border-b border-hairline py-5 md:flex-row md:gap-10 md:py-7"
            >
              <dt className="w-full shrink-0 font-mono text-[10px] uppercase tracking-widest text-bone/45 md:w-64 md:text-xs">
                {section.key}
              </dt>
              <dd className="max-w-[70ch] font-mono text-sm leading-relaxed text-bone/85 md:text-[0.95rem]">
                {section.body}
              </dd>
            </div>
          ))}
        </dl>
      </main>

      <div className="relative z-10 bg-ink">
        <Footer />
      </div>
    </>
  );
}
