import { createBookingEngine, hairSalonPreset, type BookingEngine } from '@profitstudio/booking-engine';
import { createDemoEngine } from '../demo/engine';
import { demoConfig } from '../demo/config';
import { SITE } from '../site.config';

/**
 * The ONE booking engine instance for this project (public site + /admin/).
 * All services, prices, hours, contact details, availability and appointments
 * come through it. See BOOKING_ENGINE.md for the rules.
 */
const realEngine = (): BookingEngine => createBookingEngine({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  // Preview: fictional data while no backend is connected. Development only.
  allowPreview: import.meta.env.DEV,
  preview: {
    preset: hairSalonPreset,
    business: {
      // src/site.config.ts. Without the time zone, preview mode would use the
      // time zone of whatever computer runs the dev server.
      name: SITE.name,
      timezone: SITE.timezone,
      // Fictional placeholder; the owner sets the real address in /admin/.
      contact: { address: SITE.previewAddress },
    },
  },
});

/**
 * The public Live Demo (`npm run build:demo`) swaps in an in-browser engine with
 * sample data — no Supabase, no email. `__BOOKING_DEMO__` is a build-time
 * constant (vite.config.ts), so a normal build contains none of the demo code.
 */
export const engine: BookingEngine = __BOOKING_DEMO__ ? createDemoEngine(demoConfig) : realEngine();
