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
| `app/api/waitlist/route.ts` | Waitlist stub. |

## Before this goes public

1. **`app/api/waitlist/route.ts` persists nothing.** It validates, `console.log`s
   the address and returns 200. Wire a real provider before you point anyone at
   the form, and stop logging addresses — server logs are not a mailing list.
2. **Every value in `specSection.spec` is a placeholder** and marked `todo: true`.
   Replace with audited figures from the final formulation.
3. **`specSection.footnote` is a stub.** The nutrition declaration and allergen
   statement are legally required (EU 1169/2011). Get the real text.
4. Footer links point at `#`.

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
  `prefers-reduced-motion` also disables the fill animation and the typewriter.
