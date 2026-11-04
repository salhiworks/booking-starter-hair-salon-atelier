import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addDays,
  todayInTimeZone,
  type Availability,
  type Business,
  type OpeningTimes,
  type Service,
} from '@profitstudio/booking-engine';
import { engine } from './engine';
import { settle, toLoad, type Load } from './load';
import { OUTLOOK_DAYS, SiteDataContext, type SiteData } from './siteData';

const LOADING: Load<never> = { state: 'loading' };

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Load<Business>>({ state: 'loading' });
  const [services, setServices] = useState<Load<Service[]>>({ state: 'loading' });
  const [openingTimes, setOpeningTimes] = useState<{ key: string; load: Load<OpeningTimes> } | null>(null);
  const [outlook, setOutlook] = useState<{ key: string; load: Load<Availability> } | null>(null);
  const [outlookWanted, setOutlookWanted] = useState(false);
  const [businessRun, setBusinessRun] = useState(0);
  const [servicesRun, setServicesRun] = useState(0);

  useEffect(() => {
    let current = true;
    void settle(engine.getBusiness()).then((result) => {
      if (current) setBusiness(toLoad(result));
    });
    return () => {
      current = false;
    };
  }, [businessRun]);

  useEffect(() => {
    let current = true;
    void settle(engine.listServices()).then((result) => {
      if (current) setServices(toLoad(result));
    });
    return () => {
      current = false;
    };
  }, [servicesRun]);

  // Opening times: one read for today and the next 13 days, in the business time zone.
  const timezone = business.state === 'ready' ? business.data.timezone : null;
  const openingKey = timezone ? `${timezone}|${todayInTimeZone(timezone)}` : null;
  useEffect(() => {
    if (!openingKey || !timezone) return;
    let current = true;
    const from = todayInTimeZone(timezone);
    void settle(engine.getOpeningTimes({ from, to: addDays(from, OUTLOOK_DAYS - 1) })).then((result) => {
      if (current) setOpeningTimes({ key: openingKey, load: toLoad(result) });
    });
    return () => {
      current = false;
    };
  }, [openingKey, timezone]);
  const openingLoad: Load<OpeningTimes> | null = openingKey
    ? openingTimes && openingTimes.key === openingKey
      ? openingTimes.load
      : LOADING
    : null;

  // The outlook: one availability read for the first service on the menu, made
  // once something on the page asks for it (the next free time near the booking
  // call to action), or to know closed days when opening times are unavailable.
  const firstService = services.state === 'ready' ? (services.data[0]?.id ?? null) : null;
  const outlookNeeded = outlookWanted || openingLoad?.state === 'error';
  const outlookKey = timezone && firstService ? `${firstService}|${todayInTimeZone(timezone)}` : null;
  useEffect(() => {
    if (!outlookNeeded || !outlookKey || !timezone || !firstService) return;
    let current = true;
    const from = todayInTimeZone(timezone);
    void settle(engine.getAvailability({ serviceId: firstService, from, to: addDays(from, OUTLOOK_DAYS - 1) })).then((result) => {
      if (current) setOutlook({ key: outlookKey, load: toLoad(result) });
    });
    return () => {
      current = false;
    };
  }, [outlookNeeded, outlookKey, timezone, firstService]);
  const wantOutlook = useCallback(() => setOutlookWanted(true), []);

  // A reload keeps data that is already on screen until the fresh copy
  // arrives (so the booking flow never unmounts mid-way); after an error it
  // shows the loading state again.
  const reloadBusiness = useCallback(() => {
    setBusiness((prev) => (prev.state === 'ready' ? prev : { state: 'loading' }));
    setBusinessRun((run) => run + 1);
  }, []);

  const reloadServices = useCallback(() => {
    setServices((prev) => (prev.state === 'ready' ? prev : { state: 'loading' }));
    setServicesRun((run) => run + 1);
  }, []);

  const outlookLoad: Load<Availability> | null =
    outlookNeeded && outlookKey ? (outlook && outlook.key === outlookKey ? outlook.load : LOADING) : null;

  const value = useMemo<SiteData>(
    () => ({ business, services, openingTimes: openingLoad, outlook: outlookLoad, wantOutlook, reloadBusiness, reloadServices }),
    [business, services, openingLoad, outlookLoad, wantOutlook, reloadBusiness, reloadServices],
  );

  return <SiteDataContext value={value}>{children}</SiteDataContext>;
}
