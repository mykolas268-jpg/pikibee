'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/useMediaQuery';

interface TypewriterProps {
  text: string;
  /** ms per character */
  speed?: number;
  /** ms to wait after entering the viewport */
  delay?: number;
  className?: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  /** Retype every time the element re-enters the viewport. */
  retype?: boolean;
}

/**
 * Types its text out character by character when scrolled into view, with a
 * blinking block cursor parked at the end.
 *
 * The full string is always in the DOM (visually hidden) so screen readers and
 * crawlers get the headline, not a half-typed fragment.
 */
export default function Typewriter({
  text,
  speed = 26,
  delay = 120,
  className = '',
  as: Tag = 'span',
  retype = true,
}: TypewriterProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: !retype });
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      if (retype) setCount(0);
      return;
    }
    if (reduced) {
      setCount(text.length);
      return;
    }

    let frame = 0;
    let index = 0;
    let last = 0;
    let started = false;
    const startAt = performance.now() + delay;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now < startAt) return;
      if (!started) {
        started = true;
        last = now;
      }
      if (now - last < speed) return;
      const steps = Math.floor((now - last) / speed);
      last += steps * speed;
      index = Math.min(text.length, index + steps);
      setCount(index);
      if (index >= text.length) cancelAnimationFrame(frame);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, text, speed, delay, retype]);

  return (
    <Tag ref={ref as never} className={className}>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span
        aria-hidden="true"
        className="ml-[0.1em] inline-block h-[0.85em] w-[0.5em] translate-y-[0.06em] bg-amber align-baseline animate-blink"
      />
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
