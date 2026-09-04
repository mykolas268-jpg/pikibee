# pikibee

Single-page marketing site for pikibee — honey-based endurance fuel.
Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · three.js.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint
```

Deploys as-is to Vercel (or any Node host: `npm run build && npm start`).
No environment variables are required yet.

## Where things live

| Path | What |
| --- | --- |
| `content/site.ts` | Every user-facing string, the spec table, and the footer links. A Lithuanian translation is a change to this file only. |
| `app/page.tsx` | Section assembly and the scroll wiring that drives the 3D camera. |
| `components/HoneycombMap.tsx` | The three.js scene. |
| `lib/honeycomb.ts` | Procedural lattice + geometry. Pure, seeded, no assets. |
| `components/Logo.tsx` | Text wordmark. Swap its contents for an `<svg>`; nothing else knows what the logo is. |
| `app/api/waitlist/route.ts` | Waitlist stub. Refuses anything without recorded consent. |
| `app/privacy/page.tsx` | Privacy notice, rendered from `privacy` in `content/site.ts`. |

## Email collection and consent

The waitlist runs on consent, not on a submit button:

- The checkbox is **unticked by default** and never auto-checked. GDPR
  Art. 4(11) needs an affirmative action; a pre-ticked box is not one.
- The API refuses `consent !== true` with 422, independently of the client.
- Each accepted signup produces a consent record — address, timestamp,
  `CONSENT_VERSION`, and source. The version string is what makes the record
  evidence: bump `CONSENT_VERSION` in `content/site.ts` whenever the checkbox
  label or the privacy notice changes.
- The stub logs a masked address only. Drop that log line entirely when you
  wire the provider.
- `/privacy` carries the Art. 13 disclosures and is linked from the form and
  the footer.

The notice is a working skeleton, not legal advice, and it is not finished
until the TODOs in `privacy` name your legal entity, your contact address, and
your email provider.

## Before this goes public

1. **`app/api/waitlist/route.ts` persists nothing.** It validates, logs a masked
   address and returns 200 — including the consent record, which is discarded.
   Wire a real provider and persist the record in full; an address without its
   consent record is not lawful to hold.
2. **Fill the TODOs in `privacy`** (`content/site.ts`): controller identity and
   contact, the email provider and any transfer outside the EEA, and the
   retention window. Art. 13(1)(a) is not satisfied by a notice that cannot
   name its controller.
3. **Every value in `specSection.spec` is a placeholder** and marked `todo: true`.
   Replace with audited figures from the final formulation.
4. **`specSection.footnote` is a stub.** The nutrition declaration and allergen
   statement are legally required (EU 1169/2011). Get the real text.
5. Footer links point at `#`.

## Notes on the 3D scene

- ~225 hexagonal prisms are built into **one** merged, non-indexed
  `BufferGeometry` with flat per-face colors baked into vertex attributes, plus
  one `EdgesGeometry` overlay. Two draw calls, not 450.
- There are no lights. Face shading is written into vertex colors from a fixed
  key direction at build time, so the render stays flat and blueprint-like while
  tops still read as distinct from walls.
- The scroll → camera link is a Framer Motion `MotionValue` read inside
  `useFrame`. Scrolling causes zero React re-renders.
- Mobile drops to an 8x8 lattice and disables the fill animation.
  `prefers-reduced-motion` also disables the fill animation, the idle drift and
  the typewriter.
- The comb never leaves the page. Over the tail of the heroes it hands over
  from the full stage to a docked corner framing and dims; the sections below
  reserve that corner. Framing is done **inside the scene** (`Frame` in
  `HoneycombMap`), not with a CSS transform on the canvas — scaling the canvas
  element makes R3F re-measure and reallocate its drawing buffer on every
  scroll frame.
- The render loop stops only when the tab is hidden.
