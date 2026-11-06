# Assets and their terms

The code in this repository is MIT-licensed (`LICENSE`). The assets below are
not: each keeps its own terms.

## Photographs — AI-generated (status: owner confirmation required)

Every photograph was generated for this project on 2026-11-01/02 through the
ElevenLabs image tools (model: ByteDance Seedream 5 Pro). No stock photos, no
photos of real people. Prompts and crops: `PHOTOS.md`.

| Files | Use |
|---|---|
| `public/photos/hero-{480,720,922}.{avif,webp}` | Hero plate |
| `public/photos/studio-wide-*.{avif,webp}` | The studio (wide plate) |
| `public/photos/color-bar-*.{avif,webp}` | The studio (detail plate) |
| `public/photos/sample-color-*`, `sample-precision-*`, `sample-curls-*` | Sample stylist cards (labelled "Sample photo" on the page) |
| `public/photos/storefront-*.{avif,webp}` | Visit plate |
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
| `@fontsource-variable/newsreader`, `@fontsource-variable/instrument-sans` | OFL-1.1 | Typefaces |
| `lucide-react` | ISC | Icons |

Fonts are bundled into your build by Vite; the SIL Open Font License 1.1 allows
that (keep the fonts' licence files in `node_modules` — no action needed).

## Original work (MIT, see LICENSE)

- `public/favicon.svg` — drawn in SVG for this starter.
- Every illustration that is code: the logo wordmark and every icon placement.
