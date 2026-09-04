'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { nav } from '@/content/site';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 pb-8"
        // Solid black behind the nav row, then a fade: a plain gradient let
        // section copy scrolling underneath bleed through the wordmark.
        style={{
          backgroundImage:
            'linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0) 100%)',
        }}
      >
        <nav className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? nav.menuClose : nav.menuOpen}
              className="group flex h-6 w-6 flex-col justify-center gap-[5px]"
            >
              <span
                className={`h-px w-6 bg-bone transition-transform duration-200 ${
                  open ? 'translate-y-[3px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-px w-6 bg-bone transition-transform duration-200 ${
                  open ? '-translate-y-[3px] -rotate-45' : ''
                }`}
              />
            </button>
            <Logo />
          </div>

          <a
            href="#access"
            className="border border-bone bg-bone px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors duration-120 hover:bg-ink hover:text-bone md:px-5 md:text-xs"
          >
            {nav.cta}
          </a>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="fixed inset-0 z-40 bg-ink"
          >
            <div className="flex h-full flex-col justify-center px-5 md:px-10">
              <ul className="space-y-1">
                {nav.links.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.06 * index,
                      ease: EASE,
                    }}
                  >
                    <a
                      href={link.href}
                      onClick={close}
                      className="block py-3 font-mono text-2xl uppercase tracking-widest text-bone transition-colors duration-120 hover:text-amber md:text-4xl"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
