import { brand } from '@/content/site';

interface LogoProps {
  className?: string;
}

/**
 * Text wordmark. Swap the contents of this component for an <svg> when the
 * real mark exists — nothing else in the site knows what the logo is.
 */
export default function Logo({ className = '' }: LogoProps) {
  return (
    <span
      className={`select-none font-mono text-base lowercase tracking-tight text-bone ${className}`}
      aria-label={brand.name}
    >
      {brand.wordmark.head}
      <span className="text-amber">{brand.wordmark.tail}</span>
    </span>
  );
}
