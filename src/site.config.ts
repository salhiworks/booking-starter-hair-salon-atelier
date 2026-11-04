/**
 * This website's identity — the ONE place for its name, where it is and its
 * time zone. Everything the owner manages (services, prices, hours, contact
 * details, text and photos) lives in the dashboard at /admin/, not here.
 *
 * Read by the header and footer (before the dashboard's business name has
 * loaded) and by preview mode (`npm run dev` without Supabase).
 */
export const SITE = {
  /** The business name. The dashboard's Business page overrides it once connected. */
  name: 'Copper & Comb',
  /** IANA time zone of the business (preview mode and first paint). */
  timezone: 'America/Los_Angeles',
  /** Shown in preview mode only, until the owner sets the real address in the dashboard. */
  previewAddress: '123 SE Example St, Portland, OR',
};
