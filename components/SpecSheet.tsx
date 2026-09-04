'use client';

import { motion } from 'framer-motion';
import { specSection } from '@/content/site';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function SpecSheet() {
  return (
    <section
      id="spec"
      className="w-full border-t border-hairline px-5 py-24 md:px-10 md:py-36 md:pr-[34vw]"
    >
      <div className="w-full">
        <div className="mb-10 flex items-baseline justify-between md:mb-16">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber md:text-xs">
            {specSection.index}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone/40 md:text-xs">
            {specSection.title}
          </p>
        </div>

        <dl className="w-full border-t border-hairline">
          {specSection.spec.map((row, index) => (
            <motion.div
              key={row.key}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
              className="flex flex-col gap-1 border-b border-hairline py-4 md:flex-row md:items-baseline md:gap-8 md:py-5"
            >
              <dt className="w-full shrink-0 font-mono text-[10px] uppercase tracking-widest text-bone/45 md:w-56 md:text-xs">
                {row.key}
              </dt>
              <dd className="font-mono text-sm text-bone md:text-base">
                {row.value}
              </dd>
            </motion.div>
          ))}
        </dl>

        {/* Legally required nutrition + allergen text goes here. */}
        <p className="mt-8 max-w-[70ch] font-mono text-[10px] leading-relaxed text-bone/35 md:mt-10 md:text-xs">
          {specSection.footnote}
        </p>
      </div>
    </section>
  );
}
