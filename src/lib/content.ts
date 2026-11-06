import { createContext, use } from 'react';
import { createSiteContentStore, readSiteContentSnapshot, type SiteContentState } from '@profitstudio/booking-engine';
import { siteContent, type SiteContent } from '../content/site';
import { engine } from './engine';

/**
 * The owner's website content (dashboard → Website), merged over the defaults
 * in src/content/site.ts. The first paint uses the copy baked into the page at
 * build time (vite.config.ts) or this browser's last copy; one request then
 * brings the current one. Text is rendered as text — never as HTML.
 */
export const contentStore = createSiteContentStore(engine, siteContent, { snapshot: readSiteContentSnapshot() });

export type Content = SiteContentState<SiteContent>;
type Values = Content['values'];

export const ContentContext = createContext<Content>(contentStore.initial());

export function useContent(): Content {
  return use(ContentContext);
}

/**
 * The owner's brand, mapped onto this design's own tokens (styles/tokens.css):
 * --rose is the accent on paper, --rose-bright the accent on espresso;
 * data-headings picks the heading face. Values are validated colours / known options.
 */
export function applyBrand(values: Values) {
  const root = document.documentElement;
  root.style.setProperty('--rose', values['brand.accentLight']);
  root.style.setProperty('--rose-bright', values['brand.accentDark']);
  root.dataset.headings = values['brand.headings'];
}

/** The browser tab follows at once; search engines and link previews follow the next build (vite.config.ts). */
export function applyMeta(values: Values) {
  document.title = values['seo.title'];
  for (const [selector, value] of [
    ['meta[name="description"]', values['seo.description']],
    ['meta[property="og:title"]', values['seo.title']],
    ['meta[property="og:description"]', values['seo.description']],
  ] as const) {
    document.querySelector(selector)?.setAttribute('content', value);
  }
}

const PLATES = ['hero.photo', 'studio.photo', 'studio.detailPhoto', 'visit.photo'] as const;
/** "No. 03": photos are numbered in page order, skipping any the owner removed. */
export function plateLabel(values: Values, id: (typeof PLATES)[number]): string {
  const shown = PLATES.filter((key) => values[key]);
  const index = shown.indexOf(id);
  return index < 0 ? '' : `No. ${String(index + 1).padStart(2, '0')}`;
}
