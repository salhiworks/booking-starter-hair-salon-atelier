# Hair Salon "Atelier" Starter — project rules for Claude Code

Public website for a hair salon, shipped as **Copper & Comb** (a fictional salon
in Portland, Oregon) for the owner to make their own. Its identity lives in
`src/site.config.ts`; `CUSTOMIZE.md` is the prompt that personalizes it.
Vite + React + TypeScript, plain CSS, one HTML page (sections + an in-page
booking flow) plus the packaged admin dashboard at `/admin/`.

Booking runs on **@profitstudio/booking-engine 2.0.0-beta.3** (exact version;
see `booking-engine.lock.json`). Read these before touching booking code — they
win over anything else on technical points:

- `BOOKING_ENGINE.md` (project rules, written by `booking-engine init`)
- `node_modules/@profitstudio/booking-engine/docs/INTEGRATION.md` (the contract)
- `node_modules/@profitstudio/booking-engine/dist/*.d.ts` (the API)

## The Live Demo layer — leave it alone

- `src/demo/` is the public Live Demo's in-browser engine and sample data. Only
  `npm run dev:demo` / `npm run build:demo` use it (`vite --mode demo` defines
  `__BOOKING_DEMO__`); in every other build it is compiled out, sample photos
  included. Never read, edit or "fix" it while customizing the website.
- Keep the `__BOOKING_DEMO__ ? … : …` branches as they are: the demo wording
  (no email is sent) must stay true in the demo, and the real wording in production.
- `src/demo/engine/` is vendored from the Niche Pack workspace — edit it there.
- `src/admin-main.tsx` passes `emailDelivery={__BOOKING_DEMO__ ? 'none' : undefined}`:
  only the demo's dashboard says no email is sent. Never set it on a real site.

## Engine boundaries (from BOOKING_ENGINE.md)

Always:

- Get booking data only through the ONE engine instance in `src/lib/engine.ts`.
- Show the slots `getAvailability()` returns; send `slot.startsAt` back unchanged.
- Show dates and times in the business time zone (`business.timezone`).
- Handle `ok: false` on every engine call (error table in INTEGRATION.md §7).
- Book in two steps: `requestBooking()` holds the time and emails a 6-digit code,
  then `verifyBooking({ requestId, code })`. Offer "Send a new code"
  (`resendVerificationCode()`) and "Choose another time" (`cancelBookingRequest()`,
  then reload availability). `createBooking()` is closed (`VERIFICATION_REQUIRED`).
- Show success only when `verifyBooking()` returned `ok: true`, and say whether it is
  a request (`pending`, the salon confirms) or `confirmed`.
- When `business.policies.onlineBookingEnabled` is false, show contact details instead of the flow.
- Keep the packaged admin dashboard on `/admin/` (`admin/index.html` → `src/admin-main.tsx`).

Never:

- Edit `supabase/migrations/*_booking_engine_*.sql`, `supabase/functions/booking-mailer/`,
  `booking-engine.lock.json` or `node_modules`.
- Query booking tables, call `booking_*` RPCs, or import `@supabase/supabase-js` for booking data.
- Put a Supabase secret / service_role key or an email provider key (Resend `re_…`) in a
  `VITE_` variable, in source code, in the site's `.env` files or in Git.
  Only the publishable key (`sb_publishable_…`) belongs in `.env.local`.
- Send booking emails from the website or add an email service: the engine sends them.
- Compute availability in the browser, skip the code step or fake a confirmation
  (preview mode saves nothing and sends no email).
- Keep `requestId` anywhere but component state (no localStorage, no URL).
- Rebuild or fork the admin dashboard. Brand it only through the `--pbe-*` CSS
  variables in `src/admin-theme.css`.

**A new booking feature (payments, SMS, staff calendars, deposits…) needs a new
engine version, not custom database code in this project.** Upgrade with
`npm install @profitstudio/booking-engine@<exact version>` + `npx booking-engine sync`
(INTEGRATION.md §13). If something seems to need a database change, stop and say so.

## Data that must come from the engine — never hard-code it

Services, prices (`formatMoney`, "from" when `priceFrom`, "Price on request" when
`priceCents` is null), durations, service photos, opening hours and closures,
the address, phone, email, availability and confirmations. The owner edits all
of it in `/admin/`. `listServices` / `getBusiness` / `getOpeningTimes` are
loaded once in `src/lib/SiteDataProvider.tsx` and read with `useSiteData()`.

## Service photos (optional, the owner's)

Each service may carry a photo: `service.image` from `listServices()` —
`{ url, alt, width, height }` or null (none is the normal case; never required
to create or book a service). The owner adds, replaces and removes them in
`/admin/` → Services. The site shows them only in "The menu"
(`src/components/ServicesSection.tsx`), in its own Atelier style (arched frames):

- Wide screens with a pointer (`(min-width: 960px) and (hover: hover)`): one
  arched 4:5 plate under the menu's header shows the service pointed at or tabbed to
  (the first pictured service in menu order until then), captioned "NAME
  duration · price"; each pictured service has a small mark at the start of
  its dot leader, rosewood while its photo is shown. The photo on screen stays
  until the next has loaded, which then fades in (no fade with reduced motion).
- Phones, tablets and touch screens: a sideways, scroll-snapping row of arched
  4:5 plates above the menu, captioned with the service names only — duration, price
  and Book appear once, in the menu below.
- No photos: neither exists; the menu is the plain typeset menu. One photo: one
  plate. Frames are fixed (`aspect-ratio`, `object-fit: cover`, lazy), so any
  upload keeps the layout. `alt` is the owner's description; empty means the
  photo only illustrates the service named beside it (`alt=""`).
- Never hard-code, hot-link or invent a service photo. The four sample photos
  are seed data in `sample-data/service-photos/` that the preview/setup uploads
  to Storage (see `PHOTOS.md`); they are not site assets. The booking flow does
  not show service photos (its service step stays a quick list).

The preview block in `src/lib/engine.ts` (name, `timezone: 'America/Los_Angeles'`,
a placeholder Portland address) only feeds **preview mode**; it is not the real
business data. Keep the timezone override: without it, preview uses the
developer's own device time zone.

## Where things live

| What | Where |
|---|---|
| Design tokens (palette, type scale, grid, motion, surface roles) — one file | `src/styles/tokens.css` |
| Reset, type roles (`.display`, `.kicker`), buttons, links, notices, photo plates | `src/styles/base.css` |
| Page sections (header + phone menu, hero, menu, studio, team, kind words, FAQ, visit, call to action, footer) | `src/styles/site.css` |
| Booking sheet (centred sheet / phone sheet, header + route, appointment card, month calendar, week strip, pill times, forms, code, ticket; "The Mirror finish" block at the end) | `src/styles/booking.css` |
| Icons: Lucide only, one optical stroke | `src/components/Icon.tsx` |
| Photos in fixed frames, captions from their descriptions, page-turn reveal | `src/components/PhotoFrame.tsx` |
| Page sections | `src/components/*.tsx`, assembled in `src/App.tsx` (section numbers I–VI: `src/lib/sections.ts`) |
| Every "Book" action → the booking view at `#book` (history, Esc, Close) | `src/lib/booking.ts`, `src/App.tsx`, `src/lib/dialog.ts` |
| Booking view (a modal `<dialog>`) and what it shows instead of the flow | `src/booking/BookingView.tsx` |
| Booking flow | `src/booking/` — `BookingFlow.tsx` (state + engine calls), `flowState.ts` (steps + reducer), `ServiceStep`, `DateTimeStep` (+ `Calendar`, `TimesPane`), `DetailsStep`, `CodeStep` (the emailed code), `Confirmation`, `Slip` |
| The booking call to action / "online booking is off" notice (`#book`) | `src/booking/BookingSection.tsx` |
| Today's status ("Open now until …", partial-day closures included) from `getOpeningTimes` (today + 13 days), turning over each minute; without it (older database, error) weekly hours minus the days `getAvailability` reports closed | `src/lib/today.ts` (`useTodayStatus`), `src/components/StatusLine.tsx`, loaded in `src/lib/SiteDataProvider.tsx` |
| Next free time (the 14-day `getAvailability` outlook, read only when the booking call to action nears the screen) | `src/lib/today.ts` (`nextFreeTime`), `src/booking/BookingSection.tsx` |
| Service photos in the menu (plate beside it / row of plates) | `src/components/ServicesSection.tsx` |
| What the owner can edit in `/admin/` → Website (fields, defaults, limits) | `src/content/site.ts` — read with `useContent()` (`src/lib/content.ts`) |
| Published content: loading, brand colours/heading style, title/description | `src/lib/SiteContentProvider.tsx`, `src/lib/content.ts` |
| Build-time snapshot + search title/description | `publishedSiteContent()` (from `@profitstudio/booking-engine/vite`) in `vite.config.ts` |
| Menu grouping (Cuts / Color / Styling & treatments, by name keywords) | `src/lib/serviceGroups.ts` |
| Error-code → wording | `src/lib/messages.ts` |
| Admin brand colours | `src/admin-theme.css` |

Design language: "Atelier · The Mirror" — a beauty house on porcelain (full
system, contrast table and composition in `DESIGN.md`). Porcelain `#f8f2ee`,
blush `#f1e4dd`, petal `#e9d7cf`, card `#fffbf8`, cocoa ink `#2a1b1d` (and
`#5e4a4c`, `#735e5d`), one cocoa band `#2e1c1e` with cream `#f7ebe6`;
rosewood as the one accent: `--rose` (brand.accentLight, `#98463f`) on light
surfaces and `--rose-bright` (brand.accentDark, `#e7a99b`) on cocoa. The
signature is the salon mirror: large photos sit in arches (`.plate--arch`,
`--r-arch`), others in soft rounded panes; cards and pills, not boxes and
rules. Bodoni Moda (display, names, prices, numerals; optical sizes, real
italics; the headline ending is rosewood italic on its own line) + Jost (text
and interface), both self-hosted via @fontsource-variable. Numbered sections
I–VI, photo captions "No. 01…", a price card with dot leaders. Lucide icons
only. The look is this starter's own, not an engine template: customize the
words and palette, keep the system.

## Booking flow rules this site already follows — keep them

- A booking sheet (a modal `<dialog>` at `#book`, no path routes): centred and
  rounded over the dimmed page on wide screens, full height with rounded top
  corners on phones,
  opened by every "Book" action; Back, Esc and Close close it, and the flow
  keeps its state while closed. Opening it after a finished booking starts a new one.
- Service → Date & time → Your details → Verify email → Done (five steps; the
  route is in the view's header, a five-segment bar on phones). The blush
  appointment card (the slip, `Slip.tsx`) keeps
  service, length, price, day, time and time zone in view; at the code step it
  says until when the time is held (no "Change" there). On the date-and-time
  step it stands exactly as tall as the calendar beside it (`.bk-layout--times`:
  a subgrid, so a long list of times runs on below without stretching it).
- Date & time: one `getAvailability` call per visible month grid
  (`monthGrid(month, firstDayOfWeek(locale))`, ≤ 42 days), again on month
  change; loaded months are kept per service and reload. On entry the soonest
  day with times in the visible month is chosen (`nextAvailableDay`). Days show
  the server's status, at most one mark each: open (a rosewood dot), few left
  (`isFewLeft`: "2 left"), full (struck through, receding), closed (a quiet,
  lighter numeral, no mark), outside the window (faint, disabled); today has a
  ring, the chosen day is filled — never colour alone, and every day's
  accessible name says its date and state. Full and closed
  days can be chosen and say why, with the next available day's first times.
  Arrow keys / Page Up-Down / Home-End move through the calendar. Phones: a
  week strip with a Month toggle (`weekDates`), and a sticky bottom bar with
  the choice and Continue.
- Times grouped Morning (< 12:00) / Afternoon (< 17:00) / Evening by the
  server's `slot.time` (`groupSlotsByPartOfDay`), as tabs with counts; buttons
  show `formatTime(slot.startsAt, timezone, locale)`. Times are pills; the chosen
  one unfolds into a small card, "time until …" over Continue. "Soonest" offers the first time already loaded.
- Details submit is "Continue" ("Next, we'll email you a 6-digit code"):
  nothing is booked before the code. Fields are checked when left and on
  Continue; the engine's `INVALID_INPUT` `field` maps back onto them.
- Code step: one input `#bk-code` (`inputmode="numeric"`, `autocomplete="one-time-code"`;
  digits only, at most 6, on input and on paste — no plain `maxlength`, it would cut
  "123 456"), drawn as six cells; "Verify and send request" (or "Verify and book"
  with instant confirmation), "Send a new code" (active after `resendAfterSeconds`,
  hidden when `resendsLeft` — from `requestBooking`, then each resend — is 0),
  "Change email" and "Choose another time" (both await `cancelBookingRequest`
  first, so the same time can be picked again; the next request also waits for
  it), a spam-folder reminder and what is held until when.
  Preview (`delivery: 'preview'`) says no email was sent and any 6 digits work.
- Choosing another service's "Book" while a code step is open also cancels the request.
- Exact result wording: pending → "Request received — we'll confirm your
  appointment shortly." · confirmed → "You're booked." · always show `reference`
  (on the ticket). Online booking off (or `BOOKING_DISABLED`) → "Book by phone or
  email for now".
- `PREVIEW_MODE` → "Preview: nothing was saved" notice, never a success screen.
  `SLOT_UNAVAILABLE` → "… was just taken by someone else", fresh times with the
  taken one struck in place, details kept.
  `INVALID_INPUT` + `field` → mark that field, focus it, keep the form filled.
  `INVALID_CODE` → stay, "N tries left", focus + select the code.
  `CODE_EXPIRED` / `TOO_MANY_ATTEMPTS` / `SLOT_UNAVAILABLE` / `INVALID_INPUT` (`requestId`)
  at the code step → back to the times, availability reloaded, details kept.
  `RESEND_LIMIT` → stay on the code step: no more new codes, the last one still works.
  `TOO_MANY_BOOKINGS` → the time is released: contact details, no more code entry.
  `BOOKING_DISABLED` → the contact notice replaces the flow (focus moves to it).
- Focus moves to each new step's heading; errors are announced; submit is
  disabled while sending; times always say they are in the salon's time zone
  (and that the visitor's device is elsewhere when it is).
- Production builds without `VITE_` env vars run in `unconfigured` mode and show
  "Online booking is not available yet" — that is intended.

## Content rules

- Call customers "clients" and bookings "appointments".
- The sample stylists and the example quotes are **placeholders** and say so on
  the page ("Sample profiles", "Sample photo", "Example") until the owner sets
  their own in the dashboard. Never present example reviews as real, never
  invent awards, certifications, ratings or review counts; stylist photos are
  work, never a face presented as staff.
- Photos come from the owner's content (or the site's defaults, see
  `PHOTOS.md`) and always render in their fixed frame (`object-fit: cover`);
  a photo's description is also its caption. No hot-linked stock photos.
  Service photos are captioned with the service (name, duration, price) and
  carry the owner's description as their `alt` (see "Service photos").
- The Live Demo and preview mode show a fictional business: the Visit section
  says so ("Sample" tag: the address, phone and email are examples).
- One page only: in-page anchors (`#services`, `#book`, …), no client-side routes.

## Accessibility & quality bar

Responsive from 320 px; one visible `:focus-visible` ring (`--focus` per
surface); labels on every input; phone targets ≥ 44 px; every motion (plate
reveals, rises, the unfolding time) sits under `prefers-reduced-motion:
no-preference`; text contrast ≥ 4.5:1 on every surface (ratios are noted in
`tokens.css` — use `--accent-text`, which follows the surface, for small rosewood text).

## Commands

```bash
npm run dev                           # preview mode (sample data, banner) until .env.local exists
npm run dev:demo                      # the Live Demo: in-browser engine + dashboard, nothing sent
npm run build                         # tsc -b && vite build → dist/ (incl. dist/admin/index.html)
npm run build:demo                    # the public Live Demo build — never the production site
npx booking-engine doctor             # versions, engine files, env keys, source usage
npx booking-engine doctor --dist dist # after a build: also scans the output for secret keys
npm run lint                          # oxlint (skips the engine-owned supabase/functions/)
```

Connecting Supabase, creating the owner account, booking emails (§11 step 6 and
`docs/EMAIL-SETUP.md` in the package) and deploying are in INTEGRATION.md §11–12.
Online booking stays off (contact notice on the site) until a test email has been
delivered and the owner switches it on in `/admin/`. Do not create a Supabase
project, run `supabase` commands or write `.env.local` unless the owner asks.
