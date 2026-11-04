import {
  addDays,
  formatDate,
  formatTime,
  nextAvailableDay,
  todayInTimeZone,
  weekdayOf,
  type Availability,
  type Business,
  type OpeningTimes,
  type Slot,
} from '@profitstudio/booking-engine';
import { useMinute } from './clock';
import { clockNow, formatClockFull, hoursByWeekday, relativeDay } from './format';
import type { Load } from './load';
import { useSiteData } from './siteData';

export interface TodayStatus {
  /** Open right now (a green mark is only ever shown for this). */
  open: boolean;
  /**
   * "Open now until 8:00 PM", "Opens today at 10:00 AM", "Closed now · reopens
   * today at 2:00 PM", "Closed today · opens Tuesday at 9:00 AM". Empty while pending.
   */
  text: string;
  /** Today's real hours are still loading: hold the line's place, say nothing yet. */
  pending?: boolean;
}

type Ranges = ReadonlyArray<{ start: string; end: string }>;

/**
 * Each business-local date's opening hours. From getOpeningTimes() when it
 * answered: the weekly hours minus every closure, whole-day and partial.
 * Dates outside its window, or no answer (a database older than
 * 2.0.0-alpha.10, an error): the weekly hours, minus the days getAvailability
 * reported as closed (the outlook) — as before opening times existed.
 */
function hoursOn(business: Business, openingTimes: Load<OpeningTimes> | null, outlook: Load<Availability> | null) {
  const byDay = hoursByWeekday(business.openingHours);
  const weekly = (date: string): Ranges => byDay.get(weekdayOf(date)) ?? [];
  if (openingTimes?.state === 'ready') {
    const { from, to, days } = openingTimes.data;
    const byDate = new Map(days.map((d) => [d.date, d.hours]));
    return (date: string): Ranges => (date >= from && date <= to ? (byDate.get(date) ?? []) : weekly(date));
  }
  const days = outlook?.state === 'ready' ? outlook.data.days : [];
  const closedOn = (date: string) => days.find((d) => d.date === date)?.status === 'closed';
  return (date: string): Ranges => (closedOn(date) ? [] : weekly(date));
}

const clock = (hhmm: string, locale: string) => (hhmm >= '24:00' ? 'midnight' : formatClockFull(hhmm, locale));

/**
 * Whether the salon is open now, from the real schedule (see hoursOn): open
 * until the end of the current opening; closed but opening later today
 * (before the first opening, between two, or after a closure for part of the
 * day); or closed for the rest of today, with the next opening day and time.
 * Display only — bookable times come from getAvailability().
 */
export function todayStatus(
  business: Business,
  openingTimes: Load<OpeningTimes> | null,
  outlook: Load<Availability> | null,
): TodayStatus | null {
  const { timezone, locale, openingHours } = business;
  if (openingHours.length === 0) return null;
  if (!openingTimes || openingTimes.state === 'loading') return { open: false, text: '', pending: true };
  const on = hoursOn(business, openingTimes, outlook);
  const today = todayInTimeZone(timezone);
  const now = clockNow(timezone);
  const todays = on(today);

  const current = todays.findIndex((r) => r.start <= now && now < r.end);
  if (current >= 0) {
    // Openings that meet ("9:00–12:00", "12:00–6:00") read as one.
    let end = todays[current]!.end;
    for (const next of todays.slice(current + 1)) {
      if (next.start !== end) break;
      end = next.end;
    }
    return { open: true, text: `Open now until ${clock(end, locale)}` };
  }
  const later = todays.find((r) => r.start > now);
  if (later) {
    const reopens = todays.some((r) => r.end <= now);
    return {
      open: false,
      text: reopens ? `Closed now · reopens today at ${clock(later.start, locale)}` : `Opens today at ${clock(later.start, locale)}`,
    };
  }

  const lead = todays.length ? 'Closed now' : 'Closed today';
  for (let ahead = 1; ahead <= 13; ahead++) {
    const date = addDays(today, ahead);
    const first = on(date)[0];
    if (!first) continue;
    const when = ahead === 1 ? 'tomorrow' : formatDate(date, locale, { weekday: 'long' });
    return { open: false, text: `${lead} · opens ${when} at ${clock(first.start, locale)}` };
  }
  return { open: false, text: lead };
}

/** Today's status for the page, turning over with the clock (see useMinute). */
export function useTodayStatus(): TodayStatus | null {
  const { business, openingTimes, outlook } = useSiteData();
  useMinute();
  return business.state === 'ready' ? todayStatus(business.data, openingTimes, outlook) : null;
}

/** The soonest bookable time in the outlook, as the server listed it. */
export function nextFreeTime(business: Business, outlook: Load<Availability> | null): { slot: Slot; label: string } | null {
  if (outlook?.state !== 'ready') return null;
  const day = nextAvailableDay(outlook.data.days);
  const slot = day?.slots[0];
  if (!day || !slot) return null;
  const { timezone, locale } = business;
  return { slot, label: `${relativeDay(day.date, timezone, locale)}, ${formatTime(slot.startsAt, timezone, locale)}` };
}
