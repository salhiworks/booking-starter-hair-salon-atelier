# Copper & Comb — visual system ("Atelier · The Mirror")

## Concept

A beauty house, not a barbershop and not a magazine: porcelain and blush
surfaces, cocoa ink, one rosewood accent, and photographs framed like the
salon's own **arched mirrors**. Everything a client needs (what it costs, when
the salon is open, how to book) is calm, typeset and one tap away.

Signature: **the mirror**. The hero photo sits in a tall arch with a fine
rosewood outline arch standing just behind it, like a mirror frame, and
today's status ("Open now until 6:00 PM", from the engine) on a small card at
its foot. The same arch frames the menu's service photos, the studio detail
and the stylists. Other photos are soft rounded panes; nothing is a hard box.

The style keeps the starter id `hair-salon-atelier` and the name "Atelier".
It replaced the 2026-11-04 "editorial print magazine, espresso + copper"
design on 2026-11-06; booking logic, engine calls and owner fields are unchanged.

## Type

| Role | Face | Use |
|---|---|---|
| Display | Bodoni Moda (variable: opsz 6–96, wght 400–900, roman + italic) | Hero, section titles, service and stylist names, prices, numerals, quotes, step titles |
| Text / UI | Jost (variable, 400–700) | Paragraphs, buttons, fields, kickers (uppercase, 0.2em) |

Optical sizes are set per role (`font-variation-settings: 'opsz' …`): 96 for
the hero, 72 for section titles, 28–40 for names and prices, so hairlines stay
fine at large sizes and sturdy at small ones. The headline ending is set in
rosewood italic on its own line. The owner can switch headings to Jost
(Website → Brand → Heading style → `html[data-headings='sans']`); italic
endings stay in Bodoni. Both faces are self-hosted through Fontsource
(OFL-1.1, see `ASSETS.md`).

## Colour (`src/styles/tokens.css`)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f8f2ee` porcelain | The page |
| `--blush` | `#f1e4dd` | The studio band, the appointment card, hover |
| `--petal` | `#e9d7cf` | Frames waiting for a photo |
| `--card` | `#fffbf8` | Price card, step cards, FAQ, visit card, fields |
| `--ink` / `--ink-2` / `--ink-3` | `#2a1b1d` / `#5e4a4c` / `#735e5d` | Text |
| `--cocoa` | `#2e1c1e` | The booking band, the phone booking bar |
| `--cream` (+ `-2`, `-3`) | `#f7ebe6` | Text on cocoa |
| `--rose` | `#98463f` rosewood | Accent on light (owner: **brand.accentLight**) |
| `--rose-bright` | `#e7a99b` petal pink | Accent on cocoa (owner: **brand.accentDark**) |

Contrast (WCAG 2.x, defaults):

| Pair | Ratio |
|---|---|
| ink / paper | 14.9 : 1 |
| ink-2 / paper | 7.4 : 1 |
| ink-3 / paper · on blush | 5.4 : 1 · 4.8 : 1 |
| rose / paper · blush · card | 5.8 · 5.1 · 6.2 : 1 |
| white / rose (selected day and time, menu Book hover) | 6.4 : 1 |
| cream / cocoa | 13.8 : 1 |
| rose-bright / cocoa | 8.1 : 1 |
| line-ctl / paper (control outlines) | 3.2 : 1 |

The owner's colours are validated against the same surfaces in the dashboard
(`contrastWith` `#f8f2ee` and `#2e1c1e`, ≥ 4.5 : 1).

Dashboard (`src/admin-theme.css`, the only hook the engine offers): rosewood
`#98463f` with white text in Light (6.4 : 1); petal `#e7a99b` with `#1a0f10`
text in Dark (8.9 : 1 on the canvas).

## Shape, space, depth

- Radii: photo panes 28 px (22 px on phones); arches `999px 999px 28px 28px`
  (`--r-arch`); cards 22 px; fields 14 px; buttons, times and tags are pills.
- Sections pad 80 → 152 px (`--section-y`); 12-column grid, 64 px margins at 1440.
- The studio band and the booking band are inset, rounded panels (56 px radius
  on wide screens), so the page reads as a sequence of soft surfaces.
- Depth: one soft shadow for cards (`--shadow-soft`), one lift for the hero
  mirror and the booking sheet. No borders where a surface change will do.

## Composition

1. **Header**: sections on the left (small caps), the wordmark centred, Book
   on the right; blurred porcelain while it sticks. Phones: wordmark, Book, menu.
2. **Hero**: eyebrow, headline, lede, Book + "Services & prices", then Find us ·
   Call from the engine; the mirror on the right (after the words on phones).
3. **I. The menu**: intro and Book on the left with the service-photo arch
   (pointer screens) or a row of arches (touch); the menu as one porcelain price
   card — groups, dot leaders, Bodoni prices, a pill "Book" on every row.
4. **II. The studio**: a blush band — words and the wide photo, the arched
   detail beside the house quote, then "How an appointment goes" as numbered cards.
5. **III. The stylists**: centred arched cards. Sample profiles show hands at
   work (never a face), tagged "Sample photo"; real members show their portrait
   or initials.
6. **IV. Kind words**: quote cards, each tagged "Example" until the owner
   marks the quotes as real.
7. **V. Questions**: rounded accordion cards.
8. **VI. Visit**: the storefront pane and a card with the address, today's
   status, the week's hours (today highlighted) and contact links. In the
   Live Demo and preview a "Sample" tag says the business is fictional.
9. **Booking band**: cocoa, "Start with a *conversation.*", Book, the next free
   time (read only when the band nears the screen).
10. **Footer**: name, visit, hours, contact, explore; Staff login.

## The booking sheet

A modal `<dialog>` at `#book`. Wide screens: a centred, rounded sheet (at most
1180 × 1000 px) over the dimmed, softly blurred page. Phones: a full-height
sheet with rounded shoulders, a five-segment progress bar, and the chosen time
+ Continue in a cocoa bar at the thumb.

- Header: wordmark, the route (current step in rosewood, done steps ticked), Close.
- Service: groups as soft cards; a row warms to blush, its arrow fills rosewood.
- Date & time: the blush appointment card (notched like a ticket), the month
  calendar with rosewood dots (week strip + Month on phones), part-of-day tabs,
  times as pills. The chosen day and time fill rosewood; the chosen time
  unfolds into a small card: "✓ 10:45 AM until 11:45 AM" over Continue.
- Details, code and done keep the flow's wording and honesty rules (see
  `CLAUDE.md`); the done ticket carries the reference.

Flow, reducer and engine calls are the starter's own and unchanged by the
redesign — only styles, the sheet container and class names moved.

## Motion

- Hero: the photo settles, the mirror outline drifts into place, the words
  rise in a short stagger, the status card rises last.
- Plates below the fold fade up once when they enter the screen.
- Booking sheet: rises and scales in over a fading backdrop; steps rise; the
  chosen day and time animate in.
- Everything sits under `prefers-reduced-motion: no-preference`.

## Photography

Warm, soft window light; hair, hands at work and the room — never a face
presented as staff. Every frame keeps its shape with `object-fit: cover`, so
an owner's upload never breaks the layout. Sources: `PHOTOS.md`.
