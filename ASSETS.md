# Assets and their terms

The code in this repository is MIT-licensed (`LICENSE`). The assets below are
not: each keeps its own terms.

## Photographs — Pexels (Pexels License)

Free to use and modify; unaltered copies may not be sold or redistributed as
stock. Only processed crops ship here. Sources and photographers: `PHOTOS.md`.

| Files | Use | Photographer |
|---|---|---|
| `public/photos/hero-curls-*.{avif,webp}` | Hero mirror | Engin Akyurt |
| `public/photos/salon-arch-*.{avif,webp}` | The studio (arched detail) | Marina Chocobar |
| `public/photos/sample-color-*`, `sample-precision-*` | Sample stylist cards (labelled "Sample photo") | cottonbro studio |
| `public/photos/sample-curls-*` | Sample stylist card (labelled "Sample photo") | John Diez |

## Photographs — AI-generated (status: owner confirmation required)

Generated for this project on 2026-11-01/02 through the ElevenLabs image tools
(model: ByteDance Seedream 5 Pro). No photos of real people. Prompts and crops:
`PHOTOS.md`.

| Files | Use |
|---|---|
| `public/photos/studio-wide-*.{avif,webp}` | The studio (wide pane) |
| `public/photos/storefront-*.{avif,webp}` | Visit pane |
| `sample-data/service-photos/{cut-and-style,blow-dry-and-style,balayage,deep-conditioning}.jpg` | Live Demo sample service photos only (never in a production build) |

**Rights.** ElevenLabs' Terms of Use (§1(c)) allow commercial use of the
Services only on a paid plan; its Image & Video terms (§3) leave rights in
Output to the main agreement (§4(c)(ii): "you retain all rights in and to your
Output") and (§1.3) make the third-party model provider's terms apply to its
output. **Before publishing, the owner confirms:** (1) the ElevenLabs account
was on a paid plan when these were generated, and (2) ByteDance's terms for
Seedream output permit redistribution in a free, public template. If either is
unconfirmed, replace these files (see the release report).

## Not in this repository (installed by `npm install`)

| Package | Licence | Notes |
|---|---|---|
| `@profitstudio/booking-engine` 2.0.0-beta.3 | MIT | The booking engine and the packaged dashboard |
| `react`, `react-dom` | MIT | |
| `@fontsource-variable/bodoni-moda`, `@fontsource-variable/jost` | OFL-1.1 | Typefaces |
| `lucide-react` | ISC | Icons |

Fonts are bundled into your build by Vite; the SIL Open Font License 1.1 allows
that (keep the fonts' licence files in `node_modules` — no action needed).

## Original work (MIT, see LICENSE)

- `public/favicon.svg` — drawn in SVG for this starter (an arched mirror).
- Every illustration that is code: the logo wordmark and every icon placement.
