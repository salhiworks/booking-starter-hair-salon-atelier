# Photographs — provenance and rules

Every photograph in this starter is **AI-generated**, made for this project
on 2026-11-01 through the ElevenLabs image tools connected to the owner's
account (model: ByteDance Seedream 5 Pro, 2048×1152 masters). No stock photos,
no photos of real people, nothing hot-linked. The owner's ElevenLabs plan
governs commercial use of the outputs.

| File (`public/photos/…`) | Used for | Prompt (abridged) |
|---|---|---|
| `hero-*` | Hero plate (`hero.photo`) | Stylist cutting softly wavy brown hair, client from behind, warm late-afternoon window light; cropped to the hair and window — the hands and scissors are left out of frame |
| `studio-wide-*` | The studio spread's wide plate (`studio.photo`, 3:2) | Two cognac leather chairs, round brass mirrors, espresso wall, window light, no people |
| `color-bar-*` | The studio detail plate (`studio.detailPhoto`) | Copper and ceramic colour bowls with tint brushes on a walnut counter |
| `sample-color-*`, `sample-precision-*`, `sample-curls-*` | Sample stylist cards (`team.members[].portrait`) | Hands at work — colour, a precision cut, curls — **no faces** |
| `storefront-*` | Visit plate (`visit.photo`) | Espresso-painted shopfront on a tree-lined Portland street at golden hour, no signage |

Crops: each photo was cut from its 2048×1152 master for the frame it fills
and exported as AVIF + WebP at three widths. The studio photo is a wide
1728×1152 (3:2) plate keeping both chairs, the round mirrors and the window.
The masters and the crop script are not part of this starter; to use your own
photos, add variants in the same sizes under `public/photos/` or upload them in
the dashboard → Website.

Photographic direction: warm late-afternoon window light, 35 mm editorial,
shallow depth of field, natural colour in espresso, burnished copper and
cream — the palette of the site's design tokens.

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
