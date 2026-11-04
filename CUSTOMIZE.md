# Make this starter yours — the Claude Code prompt

Fill in the four lines at the top, then paste the whole prompt into a Claude
Code session opened in this folder. It changes identity and words only, so it
finishes in one short session.

```text
Customize this hair salon starter for my business.

Business name: <YOUR BUSINESS NAME>
City and region: <CITY, REGION>
Time zone (IANA): <e.g. America/Chicago>
Personality, in a few words: <e.g. calm and natural, or bold and modern>

Follow CLAUDE.md (already loaded in this session — no need to open it again).
Open and change only these files; don't explore the rest of the project:
1. src/site.config.ts — name, timezone, and a fictional previewAddress in my city.
2. index.html and admin/index.html — the business name, city and description in
   <title>, the meta description, and any og tags or <noscript> text.
   Also the name in public/favicon.svg's <title>, if it has one.
3. src/content/site.ts — rewrite every DEFAULT text for my business: the hero
   line above the headline, headline, introduction, the studio section, FAQ
   answers and the search title and description. Keep field ids, types, limits
   and photos. Keep the sample stylists and example reviews labelled as samples.
4. Only if the current palette clearly doesn't fit my personality (otherwise skip
   this step and don't open these files): src/styles/tokens.css and
   src/admin-theme.css — adjust the palette, keeping every contrast ratio noted in tokens.css.
   If you change it, also update the same colours in index.html (theme-color),
   public/favicon.svg and the colour defaults in src/content/site.ts, and the
   colour table in DESIGN.md (if this project has one).

Do not change the layout, the booking flow, src/lib/engine.ts, src/demo/,
supabase/, booking-engine.lock.json or package.json. Do not invent services,
prices, opening hours, awards, reviews, staff or details of the premises you
cannot know — services, prices and hours are set in the dashboard. When done, run npm run build and fix any error,
then show me the result with npm run dev.
```

## After the prompt

- Replace the photos when you have your own: see `PHOTOS.md` for every frame
  and its size. Or upload them later in the dashboard → Website.
- Connect real bookings: README.md, step 3.
