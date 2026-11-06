# Hair Salon Booking Website — "Atelier" Starter

A finished, premium booking website for a hair salon, ready to make your own
with Claude Code and publish on Hostinger. It ships as **Copper & Comb**, a
fictional salon in Portland, Oregon:

- a one-page beauty-editorial website (services and prices, the studio, stylists,
  reviews, FAQ, opening hours, map link) that works from 320 px phones up;
- online booking — service, calendar, time, details and an emailed 6-digit code;
- the owner dashboard at `/admin/` — appointments, requests to confirm,
  services and prices, opening hours and closures, email health, and the
  website's own text, photos and colours.

Booking runs on [`@profitstudio/booking-engine`](https://www.npmjs.com/package/@profitstudio/booking-engine)
**2.0.0-beta.3** (pinned) with your own Supabase project and Resend for email.

## 1. Try it (no accounts needed)

```bash
npm install
npm run dev:demo   # the full Live Demo: book, then manage it at /admin/
npm run dev        # preview mode: the website with sample times, nothing saved
```

In the Live Demo everything stays in your browser — nothing is sent anywhere.

## 2. Make it yours with Claude Code

Open this folder in a Claude Code session and paste the prompt in
[`CUSTOMIZE.md`](CUSTOMIZE.md), filled in with your business. Claude edits a
short list of files (name, city, words, colours) — the booking system, the
dashboard and the layout stay as they are, so it is quick and cheap.

Services, prices, opening hours and contact details are **not** code: you set
them in the dashboard once the booking backend is connected.

## 3. Connect real bookings

You need a free Supabase project and a Resend account for booking emails.

```bash
cp .env.example .env.local    # your Supabase Project URL + Publishable key
npx supabase@2 login          # once, in your own terminal
npx booking-engine connect --admin you@example.com
```

`connect` links the project, sets up the database and the booking-email
function, and tells you exactly what is left for you to do (your dashboard
login and the two email secrets). Full steps: the Profit Studio
guide *Build a Premium Booking Website with Claude Code*, Step 3, or
`node_modules/@profitstudio/booking-engine/docs/INTEGRATION.md` §11.

Never put a Supabase **Secret** key or your Resend API key in `.env.local`, in a
prompt or in Hostinger — the Resend key lives only in Supabase's Edge Function
secrets.

## 4. Publish on Hostinger

Push this project to a private GitHub repository, then in Hostinger create a
**Web App** from it (Websites → Create site → Web App → Import Git Repository):

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` (never `build:demo`) |
| Output directory | `dist` |
| Node.js | 22 or newer |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (public values only) |

`dist/` contains the website and `dist/admin/` the dashboard. Every push to
`main` redeploys.

## What is in this folder

| | |
|---|---|
| `src/site.config.ts` | The business name, time zone and preview address |
| `src/content/site.ts` | Everything the owner can edit in the dashboard → Website, with its default text and photos |
| `src/styles/tokens.css` | The design's colours, type and spacing (one file) |
| `DESIGN.md` | The visual system ("The Mirror"): type, colour and contrast, composition, the booking sheet |
| `src/components/`, `src/booking/` | The website and its booking flow |
| `admin/` + `src/admin-main.tsx` | The packaged dashboard, mounted at `/admin/` |
| `src/demo/` | The Live Demo's in-browser engine and sample data — used only by `dev:demo` / `build:demo`; a normal build contains none of it |
| `supabase/` | The engine's database migrations and email function (managed by `npx booking-engine`; do not edit) |
| `CLAUDE.md`, `BOOKING_ENGINE.md` | Rules Claude Code follows in this project |
| `PHOTOS.md` | Where every photo came from (5 Pexels photos, 2 AI-generated) and the rules they follow |

## Commands

```bash
npm run dev          # preview mode (sample data) until .env.local exists
npm run dev:demo     # the Live Demo (in-browser data, dashboard included)
npm run build        # production build → dist/
npm run build:demo   # the public Live Demo build → dist/ (never deploy this as your site)
npx booking-engine doctor             # checks versions, engine files and keys
npx booking-engine doctor --dist dist # after a build: also scans the output for secrets
```

## Licence

The code is MIT-licensed — see [`LICENSE`](LICENSE) (Copyright (c) 2026 Youssef
Es-salhi). Photographs and other third-party assets keep their own terms, listed
file by file in [`ASSETS.md`](ASSETS.md).
