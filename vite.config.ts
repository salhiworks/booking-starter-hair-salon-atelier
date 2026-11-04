import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { publishedSiteContent } from '@profitstudio/booking-engine/vite';
import { siteContent } from './src/content/site.ts';

// Multi-page build: the public website (index.html) and the packaged
// Booking Engine dashboard (admin/index.html → /admin/). See INTEGRATION.md §4.
//
// publishedSiteContent bakes the owner's PUBLISHED content into index.html:
// the title and description search engines and link previews read, and a
// snapshot for the first paint (INTEGRATION.md §15). With a backend
// configured but unreachable the build fails, so the host keeps the live site.
export default defineConfig(({ mode }) => ({
  // The public Live Demo build (`--mode demo`): src/lib/engine.ts swaps in the
  // in-browser demo engine (src/demo/). Every other build leaves it out.
  define: { __BOOKING_DEMO__: JSON.stringify(mode === 'demo') },
  plugins: [
    // …and keeps the demo's sample data and photos out of it too: outside demo
    // mode, src/demo/config resolves to an empty module.
    {
      name: 'booking-demo-config-off',
      enforce: 'pre',
      resolveId: (id) => (mode !== 'demo' && /\/demo\/config(\.ts)?$/.test(id) ? '\0booking-demo-off' : null),
      load: (id) => (id === '\0booking-demo-off' ? 'export const demoConfig = undefined;' : null),
    },
    react(),
    publishedSiteContent({
      schema: siteContent,
      env: loadEnv(mode, process.cwd(), 'VITE_'),
      meta: (values) => ({ title: values['seo.title'], description: values['seo.description'] }),
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
      },
    },
  },
}));
