# Photographs — provenance and rules

The site's photographs come from two sources. Five are **licensed Pexels
photos** chosen for the "Mirror" design on 2026-11-06. Two are
**AI-generated** for this project on 2026-11-01. Every file is a processed
crop (AVIF + WebP at three widths). Nothing is hot-linked, and no unaltered
original ships in this starter.

## Pexels photos (Pexels License)

[Pexels License](https://www.pexels.com/license/): free to use and modify,
attribution not required (credited here anyway); unaltered copies may not be
sold or redistributed as stock. Each source page was checked on 2026-11-06
(License: Free). Downloaded from images.pexels.com at 2400 px wide; the working
copies stay outside this repository.

| Served as (`public/photos/…`) | Where | Source page | Photographer | Edits |
|---|---|---|---|---|
| `hero-curls-{480,720,960}` (4:5) | Hero mirror (`hero.photo`) | https://www.pexels.com/photo/woman-s-hairstyle-3065208/ | Engin Akyurt | Cropped from the top so a blurred person at the mirror behind the client is out of frame |
| `salon-arch-{400,640,864}` (3:4) | The studio, arched detail (`studio.detailPhoto`) | https://www.pexels.com/photo/empty-armchairs-in-the-room-7823407/ | Marina Chocobar | Cropped to 3:4 |
| `sample-color-{400,640,922}` (4:5) | Sample stylist card 1 | https://www.pexels.com/photo/woman-getting-her-hair-color-3993323/ | cottonbro studio | Tight crop on the hair and the gloved hand: the client's profile is out of frame |
| `sample-precision-{400,640,922}` (4:5) | Sample stylist card 2 | https://www.pexels.com/photo/a-person-holding-scissors-and-green-comb-7253877/ | cottonbro studio | Cropped to 4:5, hands only |
| `sample-curls-{400,640,922}` (4:5) | Sample stylist card 3 | https://www.pexels.com/photo/anonymous-woman-drying-hair-of-unrecognizable-black-man-7389084/ | John Diez | Cropped from the top: the client's face (lower edge) is out of frame |

The three sample-card photos show stylists and clients at work in other
salons. No face is visible, the cards are tagged "Sample photo", and the
section says "Sample profiles".

## AI-generated photos

Made through the ElevenLabs image tools connected to the owner's account
(model: ByteDance Seedream 5 Pro, 2048×1152 masters). No photos of real
people. The owner's ElevenLabs plan governs commercial use of the outputs.

| File (`public/photos/…`) | Used for | Prompt (abridged) |
|---|---|---|
| `studio-wide-*` | The studio's wide pane (`studio.photo`, 3:2) | Two cognac leather chairs, round brass mirrors, espresso wall, window light, no people |
| `storefront-*` | Visit pane (`visit.photo`) | Espresso-painted shopfront on a tree-lined Portland street at golden hour, no signage |

Each was cut from its 2048×1152 master and exported as AVIF + WebP at three
widths. The masters and the crop script are not part of this starter. To use
your own photos, add variants in the same sizes under `public/photos/` (and
`src/content/photos.json`), or upload them in the dashboard → Website.

Photographic direction for replacements: soft, warm light; hair, hands at work
and the room; never a face presented as staff. The design frames photos in
arches and rounded panes on porcelain and blush.

Rules this site follows:

- **No invented staff.** The stylist cards show hands and work, never a face;
  each photo is tagged “Sample photo” and the section says “Sample profiles”
  until the owner enters their real team in the dashboard (Website →
  Stylists), where they upload real portraits. A stylist without a portrait
  shows their initials, not someone else's photo.
- Every photo is a **default**: the owner replaces it in the dashboard. Each
  frame has a fixed shape and crops with `object-fit: cover`, so a replacement
  never breaks the layout.
- **Captions are the photos' descriptions** (the alt text the owner edits with
  the photo): a replaced photo never keeps a wrong caption.
- Delivery: AVIF + WebP at three widths with `src/content/photos.json`; the
  hero loads eagerly with high priority (and is preloaded in `index.html`),
  everything else lazily; every image has `width`/`height` (no layout shift).

## Sample service photos (seed data, not site assets)

Four sample **service photos**, AI-generated on 2026-11-02 through the
owner's ElevenLabs connector (model ByteDance Seedream 5 Pro, 2048×1152
masters, 16 variations in all, one chosen per service), cropped to 4:5 at
922×1152. They live in `sample-data/service-photos/` (with `manifest.json`:
service name, file, description) and are **not** part of the built site: the
preview/setup uploads them to Supabase Storage (`services/` folder) the way the
owner would and attaches each to its service. The owner replaces or removes
them in the dashboard (Services); a service without a photo is the normal case.

| File (`sample-data/service-photos/…`) | Attached to | Prompt (abridged) |
|---|---|---|
| `cut-and-style.jpg` | Cut & Style | Hands trimming damp, softly wavy chestnut hair with scissors and a comb |
| `blow-dry-and-style.jpg` | Blow-Dry & Style | A round brush drawn through glossy, freshly blow-dried brown hair |
| `balayage.jpg` | Balayage | Long caramel-and-honey balayage seen from behind, in a cognac leather chair |
| `deep-conditioning.jpg` | Deep Conditioning Treatment | Hands working a conditioning mask through damp hair at a wash basin |

All four: no faces, warm late-afternoon window light, espresso, copper and
cream, 35 mm editorial — the same direction as the photos above. Their
descriptions (in the manifest) become each photo's `alt`; on the page the
plates are captioned with the service's name, duration and price.
