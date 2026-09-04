import Link from 'next/link';
import { footer } from '@/content/site';

const CLASS =
  'font-mono text-[10px] uppercase tracking-widest text-bone/40 transition-colors duration-120 hover:text-amber md:text-xs';

export default function Footer() {
  return (
    <footer className="w-full border-t border-hairline px-5 py-8 md:px-10 md:py-10">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] tracking-wide text-bone/40 md:text-xs">
          {footer.copyright}
        </p>
        <ul className="flex flex-wrap items-center gap-5 md:gap-7">
          {footer.links.map((link) => (
            <li key={link.label}>
              {link.href.startsWith('/') ? (
                <Link href={link.href} className={CLASS}>
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} className={CLASS}>
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
