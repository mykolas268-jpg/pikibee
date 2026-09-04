'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SpecSheet from '@/components/SpecSheet';
import EarlyAccess from '@/components/EarlyAccess';
import Footer from '@/components/Footer';
import type { Frame } from '@/components/HoneycombMap';
import { heroes } from '@/content/site';
import { useIsMobile, usePrefersReducedMotion } from '@/lib/useMediaQuery';

// WebGL has no business running on the server, and the three.js bundle should
// not sit in the critical path for the copy.
const HoneycombMap = dynamic(() => import('@/components/HoneycombMap'), {
  ssr: false,
});

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

// Where the object sits, as fractions of its canvas. Desktop canvas is the
// right half of the viewport; mobile canvas is the whole viewport, with the
// comb framed into a band above the copy.
//
// The docked frame is generous: by then the comb has become the gel packet,
// and the packet is the product — it earns a proper look, not a watermark.
const FRAMES = {
  desktop: {
    home: { cx: 0.5, cy: 0.5, w: 1, h: 1 },
    docked: { cx: 0.7, cy: 0.72, w: 0.62, h: 0.5 },
  },
  mobile: {
    home: { cx: 0.5, cy: 0.28, w: 1, h: 0.4 },
    docked: { cx: 0.66, cy: 0.8, w: 0.56, h: 0.22 },
  },
} satisfies Record<string, { home: Frame; docked: Frame }>;

export default function Page() {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroOne = useRef<HTMLElement>(null);
  const heroTwo = useRef<HTMLElement>(null);
  const combRef = useRef<HTMLDivElement>(null);

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

  // The comb never leaves the page. Over the tail of the heroes it hands over
  // from the full stage to its docked corner — and, on the way, folds itself
  // into the gel packet. One value drives both.
  const dockAt = (progress: number) => clamp01((progress - 0.88) / 0.12);
  const dock = useTransform(stage, dockAt);

  // Sawtooth: dolly in across hero 1, snap back, dolly in across hero 2.
  // HoneycombMap damps this inside useFrame, so the snap reads as a fast
  // pull-back rather than a cut, and no React render happens per scroll tick.
  //
  // Switch on `a` rather than `b`: at the exact section boundary hero 2's
  // progress reads 0, and testing `b > 0` would pin the comb at full zoom.
  //
  // Unwinding by the dock matters: docking a comb still held at 2.45x would
  // park a cropped close-up in the corner instead of the whole plate.
  const dolly = useTransform<number, number>(
    [first, second, stage],
    ([a, b, s]) => (a >= 1 ? b : a) * (1 - dockAt(s)),
  );

  // Written straight onto the node: a CSS variable costs no React render.
  const applyDock = (value: number) =>
    combRef.current?.style.setProperty('--dock', value.toFixed(4));
  useMotionValueEvent(dock, 'change', applyDock);

  // `change` never fires for a reload that lands mid-page, so seed it once the
  // canvas node exists.
  useEffect(() => {
    if (mounted) applyDock(dock.get());
  });

  // Nothing is gated on scroll any more, so the only reason to stop drawing is
  // that nobody is looking at the tab.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const frames = isMobile ? FRAMES.mobile : FRAMES.desktop;

  return (
    <>
      <Navbar />

      <div
        ref={combRef}
        aria-hidden="true"
        className="comb-dock pointer-events-none fixed inset-0 z-0 md:left-auto md:right-0 md:w-1/2"
      >
        {mounted && (
          <HoneycombMap
            progress={dolly}
            dock={dock}
            home={frames.home}
            docked={frames.docked}
            active={visible}
            cols={isMobile ? 8 : 15}
            rows={isMobile ? 8 : 15}
            fills={!isMobile && !reduced}
            drift={!reduced}
            className="h-full w-full"
          />
        )}
      </div>

      <main className="relative z-10">
        <div ref={stageRef}>
          <HeroSection ref={heroOne} {...heroes[0]} />
          <HeroSection ref={heroTwo} {...heroes[1]} typeDelay={200} />
        </div>

        {/*
          No opaque backdrop here: the docked comb has to show through. The
          sections below reserve the corner it docks into.
        */}
        <div className="relative">
          <SpecSheet />
          <EarlyAccess />
          <Footer />
        </div>
      </main>
    </>
  );
}
