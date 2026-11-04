import { createContext, useContext } from 'react';
import type { Availability, Business, OpeningTimes, Service } from '@profitstudio/booking-engine';
import type { Load } from './load';

/** Business info + services, loaded once from the engine and shared by every section. */
export interface SiteData {
  business: Load<Business>;
  services: Load<Service[]>;
  /**
   * Today and the next 13 days from getOpeningTimes(): the weekly hours minus
   * every closure, whole-day and partial — what "Open now" is computed from.
   * Null until the business (its time zone) is known. An error (e.g.
   * SCHEMA_INCOMPATIBLE on a database older than 2.0.0-alpha.10) means: use
   * the weekly hours, corrected by the outlook's closed days.
   */
  openingTimes: Load<OpeningTimes> | null;
  /**
   * The next two weeks for the first service on the menu, straight from
   * getAvailability(): the next free time the booking call to action mentions
   * (and closed days when opening times are unavailable). Loaded only once
   * asked for (`wantOutlook`); null until then, or when there are no services.
   */
  outlook: Load<Availability> | null;
  wantOutlook: () => void;
  reloadBusiness: () => void;
  reloadServices: () => void;
}

export const SiteDataContext = createContext<SiteData | null>(null);

export function useSiteData(): SiteData {
  const value = useContext(SiteDataContext);
  if (!value) throw new Error('useSiteData() must be used inside <SiteDataProvider>.');
  return value;
}

/** Days the outlook and the opening times cover, starting today. */
export const OUTLOOK_DAYS = 14;
