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

/**
 * Version the consent wording. A consent record is only evidence if you can
 * say what the person actually agreed to, so bump this string whenever the
 * checkbox label or the notice below changes, and store it with the address.
 */
export const CONSENT_VERSION = '2026-09-04';

export const earlyAccess = {
  index: '04 / ACCESS',
  title: 'Early Access',
  body: 'One email when the first batch is ready. Nothing else.',
  placeholder: 'you@domain.com',
  submit: 'JOIN',
  submitting: 'SENDING',
  success: '// QUEUED. WE WRITE WHEN THE BATCH IS READY.',
  consent: {
    // Must stay unticked by default: GDPR Art. 4(11) requires an affirmative
    // action, and a pre-ticked box is not one.
    label: 'Send me one email when the first batch is ready.',
    detail:
      'We store your address for that one email and nothing else. No sharing, no profiling, no newsletter. Withdraw any time.',
    linkLabel: 'PRIVACY NOTICE',
    linkHref: '/privacy',
  },
  errors: {
    invalid: '// INVALID ADDRESS.',
    consent: '// TICK THE BOX TO CONTINUE.',
    failed: '// REQUEST FAILED. TRY AGAIN.',
  },
} as const;

export const footer = {
  copyright: '(c) 2026 pikibee. All rights reserved.',
  links: [
    // TODO: replace the first three with real destinations.
    { label: 'INSTAGRAM', href: '#' },
    { label: 'STRAVA', href: '#' },
    { label: 'CONTACT', href: '#' },
    { label: 'PRIVACY', href: '/privacy' },
  ],
} as const;

/**
 * Privacy notice for the waitlist.
 *
 * This is a working skeleton with the Art. 13 GDPR disclosures in place, not
 * legal advice and not signed off by anyone. The TODOs are the facts only you
 * can supply — they are not optional: a notice that cannot name its controller
 * does not satisfy Art. 13(1)(a).
 */
export const privacy = {
  index: '05 / PRIVACY',
  title: 'Privacy Notice',
  updated: `Version ${CONSENT_VERSION}`,
  intro:
    'This notice covers one thing: the email address you give us to be told when the first batch is ready. We run no other collection on this site — no analytics, no advertising pixels, no cookies beyond what the page needs to render.',
  sections: [
    {
      key: 'CONTROLLER',
      body: 'TODO — registered legal entity, address, and a contact address that a person actually reads. Required by Art. 13(1)(a) GDPR; the notice is incomplete without it.',
    },
    {
      key: 'WHAT WE COLLECT',
      body: 'Your email address. With it we store the moment you gave consent, the wording you agreed to, and the version of this notice in force at the time. Nothing else — no name, no location, no device fingerprint.',
    },
    {
      key: 'WHY',
      body: 'To send you one email announcing the first batch. That is the whole purpose. We do not use the address for anything else, and we do not build a profile from it.',
    },
    {
      key: 'LEGAL BASIS',
      body: 'Your consent, under Art. 6(1)(a) GDPR. You give it by ticking the box; nothing is pre-ticked. Withdrawing it is as easy as giving it, and withdrawal does not affect the lawfulness of anything done before.',
    },
    {
      key: 'WHO ELSE SEES IT',
      body: 'TODO — name the email provider once it is chosen, and confirm whether it stores data outside the EEA. If it does, name the transfer safeguard (Art. 46 GDPR). No other recipients.',
    },
    {
      key: 'HOW LONG',
      body: 'Until the launch email has been sent, or until you withdraw consent — whichever comes first. After that the address is deleted. TODO: confirm the retention window with whatever provider you pick, and make sure deletion actually propagates to it.',
    },
    {
      key: 'YOUR RIGHTS',
      body: 'Access, rectification, erasure, restriction, portability, objection, and withdrawal of consent at any time. Write to the contact address above and we act without undue delay. You can also complain to the Lithuanian supervisory authority, Valstybine duomenu apsaugos inspekcija (VDAI), ada.lt.',
    },
    {
      key: 'AUTOMATED DECISIONS',
      body: 'None. No profiling, no automated decision-making with legal or similarly significant effects.',
    },
    {
      key: 'IS IT REQUIRED',
      body: 'No. Giving us your address is voluntary. The only consequence of not giving it is that we cannot tell you when the batch is ready.',
    },
  ],
  back: 'BACK TO SITE',
} as const;

export type SpecRow = (typeof specSection.spec)[number];
export type Hero = (typeof heroes)[number];
