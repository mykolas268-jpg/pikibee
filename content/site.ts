/**
 * Single source of truth for every user-facing string on the site.
 * A Lithuanian translation is a one-file change: copy this file, swap the
 * strings, keep the keys.
 *
 * Every claim lives here on purpose. Nothing in the components hardcodes copy.
 */

export const brand = {
  name: 'pikibee',
  /** The wordmark is split so the tail can be tinted amber. */
  wordmark: { head: 'piki', tail: 'bee' },
  tagline: 'Honey-based endurance fuel.',
  description:
    'Endurance fuel made from raw Lithuanian honey and electrolytes. Single apiary, small batches.',
} as const;

export const nav = {
  cta: 'GET EARLY ACCESS',
  menuOpen: 'MENU',
  menuClose: 'CLOSE',
  links: [
    { label: '01 / FUEL', href: '#fuel' },
    { label: '02 / SOURCE', href: '#source' },
    { label: '03 / SPEC', href: '#spec' },
    { label: '04 / ACCESS', href: '#access' },
  ],
} as const;

export const heroes = [
  {
    id: 'fuel',
    index: '01 / FUEL',
    headline: 'Fuel. Engineered by Bees.',
    subhead:
      'Raw Lithuanian honey, dosed with electrolytes. Fast carbohydrate in the glucose-fructose ratio nature already ships. No maltodextrin, no artificial flavor.',
    cta: 'GET EARLY ACCESS',
    ctaHref: '#access',
  },
  {
    id: 'source',
    index: '02 / SOURCE',
    headline: 'Foundational Fuel for Long Distance.',
    subhead:
      'One apiary. Small batches. Built for the last 40 km, when everything else stops going down.',
    cta: 'GET EARLY ACCESS',
    ctaHref: '#access',
  },
] as const;

export const specSection = {
  index: '03 / SPEC',
  title: 'Specification',
  /**
   * TODO: every value below is a PLACEHOLDER. Replace with the audited figures
   * from the final formulation before launch. Do not publish as-is.
   */
  spec: [
    { key: 'FORMAT', value: 'gel packet', todo: true },
    { key: 'VOLUME', value: '30 ml', todo: true },
    { key: 'CARBOHYDRATE', value: '25 g', todo: true },
    { key: 'SODIUM', value: '100 mg', todo: true },
    { key: 'CAFFEINE', value: '0 / 50 mg', todo: true },
    { key: 'SOURCE', value: 'Single apiary, Lithuania', todo: true },
    {
      key: 'INGREDIENTS',
      value: 'Honey, water, sodium chloride, potassium citrate',
      todo: true,
    },
  ],
  /**
   * TODO: legally required nutrition declaration and allergen statement.
   * Regulation (EU) No 1169/2011 applies. Leave the slot, fill the text.
   */
  footnote:
    'TODO — nutrition declaration and allergen statement. Values per serving, subject to final formulation.',
} as const;

export const earlyAccess = {
  index: '04 / ACCESS',
  title: 'Early Access',
  body: 'One email when the first batch is ready. Nothing else.',
  placeholder: 'you@domain.com',
  submit: 'JOIN',
  submitting: 'SENDING',
  success: '// QUEUED. WE WRITE WHEN THE BATCH IS READY.',
  errors: {
    invalid: '// INVALID ADDRESS.',
    failed: '// REQUEST FAILED. TRY AGAIN.',
  },
} as const;

export const footer = {
  copyright: '(c) 2026 pikibee. All rights reserved.',
  // TODO: replace with real destinations.
  links: [
    { label: 'INSTAGRAM', href: '#' },
    { label: 'STRAVA', href: '#' },
    { label: 'CONTACT', href: '#' },
  ],
} as const;

export type SpecRow = (typeof specSection.spec)[number];
export type Hero = (typeof heroes)[number];
