import { hairSalonPreset } from '@profitstudio/booking-engine';
import type { DemoConfig } from './engine';
import cutAndStyle from '../../sample-data/service-photos/cut-and-style.jpg';
import blowDry from '../../sample-data/service-photos/blow-dry-and-style.jpg';
import balayage from '../../sample-data/service-photos/balayage.jpg';
import conditioning from '../../sample-data/service-photos/deep-conditioning.jpg';

/**
 * The public Live Demo's sample business (`npm run dev:demo` / `npm run build:demo`).
 * Only demo builds read this file. Customizing the real website? Leave src/demo/ alone.
 */
const photo = (url: string, alt: string) => ({ url, alt, width: 922, height: 1152 });

export const demoConfig: DemoConfig = {
  id: 'hair-salon-atelier',
  preset: hairSalonPreset,
  business: {
    name: 'Copper & Comb',
    timezone: 'America/Los_Angeles',
    email: 'hello@copperandcomb.example',
    phone: '+1 503 555 0142',
    address: '1200 SE Atelier Way, Portland, OR',
  },
  ownerEmail: 'owner@copperandcomb.example',
  referencePrefix: 'CC',
  sampleNotes: ['First visit — would like a consultation first.', 'Curly hair, please no thinning shears.', 'Running in from work — may be 5 minutes late.'],
  // The site caches published content under this key (createSiteContentStore's default).
  resetKeys: ['pbe-site-content'],
  servicePhotos: {
    'Cut & Style': photo(cutAndStyle, 'A stylist trims the ends of softly waved chestnut hair with scissors and a comb'),
    'Blow-Dry & Style': photo(blowDry, 'A round brush lifts glossy, freshly blow-dried brown hair'),
    Balayage: photo(balayage, 'Long hair with soft caramel and honey balayage, seen from behind'),
    'Deep Conditioning Treatment': photo(conditioning, 'Hands work a conditioning mask through damp hair at the wash basin'),
  },
  customers: [
    { name: 'Maya Okafor', email: 'maya.okafor@example.com', phone: '+1 503 555 0118' },
    { name: 'Daniel Reyes', email: 'daniel.reyes@example.com', phone: '+1 503 555 0127' },
    { name: 'Priya Natarajan', email: 'priya.n@example.com', phone: '+1 503 555 0133' },
    { name: 'Hannah Lindqvist', email: 'hannah.l@example.com', phone: '+1 503 555 0146' },
    { name: 'Theo Brennan', email: 'theo.brennan@example.com', phone: '+1 503 555 0151' },
    { name: 'Sofia Marchetti', email: 'sofia.m@example.com', phone: '+1 503 555 0164' },
    { name: 'Jordan Ellis', email: 'jordan.ellis@example.com', phone: '+1 503 555 0172' },
    { name: 'Aiko Tanaka', email: 'aiko.tanaka@example.com', phone: '+1 503 555 0189' },
    { name: 'Grace Whitfield', email: 'grace.w@example.com', phone: '+1 503 555 0193' },
    { name: 'Marcus Bell', email: 'marcus.bell@example.com', phone: '+1 503 555 0108' },
  ],
};
