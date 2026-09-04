'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SpecSheet from '@/components/SpecSheet';
import EarlyAccess from '@/components/EarlyAccess';
import Footer from '@/components/Footer';
import { heroes } from '@/content/site';
import { useIsMobile, usePrefersReducedMotion } from '@/lib/useMediaQuery';

// WebGL has no business running on the server, and the three.js bundle should
// not sit in the critical path for the copy.
const HoneycombMap = dynamic(() => import('@/components/HoneycombMap'), {
  ssr: false,
});

export default function Page() {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroOne = useRef<HTMLElement>(null);
  const heroTwo = useRef<HTMLElement>(null);

  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Per-section scroll progress. Each hero is taller than the viewport, so
  // `start start -> end start` is exactly the runway that hero occupies.
  const { scrollYProgress: first } = useScroll({
    target: heroOne,
    offset: ['start start', 'end start'],
  });
  const { scrollYProgress: second } = useScroll({
    target: heroTwo,
    offset: ['start start', 'end start'],
  });
  const { scrollYProgress: stage } = useScroll({
    target: stageRef,
    offset: ['start start', 'end start'],
  });

  // Sawtooth: dolly in across hero 1, snap back, dolly in across hero 2.
  // HoneycombMap damps this inside useFrame, so the snap reads as a fast
  // pull-back rather than a cut, and no React render happens per scroll tick.
  // Switch on `a` rather than `b`: at the exact section boundary both hero 2's
  // progress and the previous test would read 0, pinning the comb at full zoom.
  const dolly = useTransform<number, number>([first, second], ([a, b]) =>
    a >= 1 ? b : a,
  );

  // The comb belongs to the heroes only; it clears out before the spec sheet.
  const opacity = useTransform(stage, [0, 0.9, 0.99], [1, 1, 0]);
  const [live, setLive] = useState(true);
  useMotionValueEvent(opacity, 'change', (value) => {
    const next = value > 0.02;
    setLive((current) => (current === next ? current : next));
  });

  return (
    <>
      <Navbar />

      <motion.div
        aria-hidden="true"
        style={{ opacity }}
        className="pointer-events-none fixed left-0 top-[9vh] z-0 h-[40vh] w-full md:left-auto md:right-0 md:top-0 md:h-screen md:w-1/2"
      >
        {mounted && (
          <HoneycombMap
            progress={dolly}
            active={live}
            cols={isMobile ? 8 : 15}
            rows={isMobile ? 8 : 15}
            fills={!isMobile && !reduced}
            className="h-full w-full"
          />
        )}
      </motion.div>

      <main className="relative z-10">
        <div ref={stageRef}>
          <HeroSection ref={heroOne} {...heroes[0]} />
          <HeroSection ref={heroTwo} {...heroes[1]} typeDelay={200} />
        </div>

        <div className="relative bg-ink">
          <SpecSheet />
          <EarlyAccess />
          <Footer />
        </div>
      </main>
    </>
  );
}
