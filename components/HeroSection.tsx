'use client';

import { forwardRef, useCallback, useRef, type MutableRefObject } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Typewriter from './Typewriter';

export interface HeroSectionProps {
  id: string;
  /** Datasheet marker, e.g. "01 / FUEL". */
  index: string;
  headline: string;
  subhead: string;
  cta: string;
  ctaHref: string;
  /** Typing starts later on the second hero so it does not race the first. */
  typeDelay?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * One full-viewport hero. Taller than the viewport on purpose: the extra
 * height is the scroll runway the honeycomb camera dolly animates across.
 */
const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(function HeroSection(
  { id, index, headline, subhead, cta, ctaHref, typeDelay = 140 },
  ref,
) {
  const local = useRef<HTMLElement | null>(null);

  // The section ref is needed twice: once by the page (to drive the honeycomb
  // dolly) and once here.
  const attach = useCallback(
    (node: HTMLElement | null) => {
      local.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  const { scrollYProgress } = useScroll({
    target: local,
    offset: ['start start', 'end start'],
  });

  // The copy is pinned for the first ~100vh of the section (sticky child), so
  // it stays readable for a full screen of scrolling while the comb dollies in.
  // Then it retires: the navbar is fixed and transparent, and copy scrolling
  // under it would collide with the wordmark and the white CTA.
  const opacity = useTransform(scrollYProgress, [0, 0.38, 0.53], [1, 1, 0]);
  const lift = useTransform(scrollYProgress, [0.38, 0.53], [0, -32]);

  return (
    <section
      id={id}
      ref={attach}
      className="relative min-h-[160vh] w-full"
    >
      <div className="sticky top-0 flex h-screen w-full items-start pt-[50vh] md:items-center md:pt-0">
        <motion.div
          style={{ opacity, y: lift }}
          className="w-full px-5 md:w-1/2 md:px-10"
        >
          <div className="max-w-copy">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.5 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mb-6 font-mono text-[10px] uppercase tracking-widest text-amber md:mb-8 md:text-xs"
            >
              {index}
            </motion.p>

            <Typewriter
              as="h1"
              text={headline}
              delay={typeDelay}
              className="font-mono text-[2rem] font-normal leading-[1.1] tracking-tight text-bone sm:text-4xl md:text-5xl lg:text-[3.4rem]"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
              className="mt-7 max-w-[46ch] font-mono text-sm leading-relaxed text-bone/60 md:mt-9 md:text-[0.95rem]"
            >
              {subhead}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.75, ease: EASE }}
              className="mt-10 md:mt-12"
            >
              <a
                href={ctaHref}
                className="inline-block border border-bone bg-bone px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors duration-120 hover:bg-ink hover:text-bone md:text-xs"
              >
                {cta}
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default HeroSection;
