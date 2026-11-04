import {
  addDays,
  formatDate,
  formatMoney,
  formatTime,
  todayInTimeZone,
  type OpeningHoursInterval,
  type Service,
  type Weekday,
} from '@profitstudio/booking-engine';

/** A menu's way of saying how long: 45 → "45 min", 90 → "90 min", 120 → "2 hr", 150 → "2 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 120) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export interface PriceParts {
  /** True for a starting price ("from …"). */
  from: boolean;
  /** Formatted amount, or null when the price is on request. */
  amount: string | null;
}

export function priceParts(service: Pick<Service, 'priceCents' | 'priceFrom' | 'currency'>, locale?: string): PriceParts {
  if (service.priceCents === null) return { from: false, amount: null };
  return { from: service.priceFrom, amount: formatMoney(service.priceCents, service.currency, locale) };
}

/** One-line price: "$65", "from $85" or "Price on request". */
export function formatPrice(service: Pick<Service, 'priceCents' | 'priceFrom' | 'currency'>, locale?: string): string {
  const { from, amount } = priceParts(service, locale);
  if (amount === null) return 'Price on request';
  return from ? `from ${amount}` : amount;
}

/**
 * Display an opening-hours wall-clock value ("09:00", "17:30", "24:00") from
 * the engine. Pure formatting of a business-local label — no time zone maths.
 */
export function formatClock(hhmm: string, locale?: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm;
  if (hours >= 24) return 'midnight';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}

/** "9:00 AM" — always with minutes, for times set in a column. */
export function formatClockFull(hhmm: string, locale?: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm;
  if (hours >= 24) return 'midnight';
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, 0, 1, hours, minutes)),
  );
}

export function formatInterval(interval: OpeningHoursInterval, locale?: string, full = false): string {
  const clock = full ? formatClockFull : formatClock;
  return `${clock(interval.start, locale)} – ${clock(interval.end, locale)}`;
}

// 2024-01-01 was a Monday, so weekday n is that date + (n - 1) days.
const A_MONDAY = '2024-01-01';

/** ISO weekday (1 = Monday … 7 = Sunday) → "Monday" / "Mon" in the business locale. */
export function weekdayName(weekday: Weekday, locale?: string, style: 'long' | 'short' = 'long'): string {
  return formatDate(addDays(A_MONDAY, weekday - 1), locale, { weekday: style });
}

export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** The engine's opening hours grouped per weekday, earliest interval first. */
export function hoursByWeekday(hours: OpeningHoursInterval[]): Map<Weekday, OpeningHoursInterval[]> {
  const map = new Map<Weekday, OpeningHoursInterval[]>();
  for (const day of WEEKDAYS) map.set(day, []);
  for (const interval of hours) map.get(interval.weekday)?.push(interval);
  for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
  return map;
}

/**
 * The week in a few lines: weekdays with the same hours share a line —
 * "Tue, Wed, Fri · 9 AM – 6 PM", "Sun, Mon · Closed". Formatting only.
 */
export function compactHours(hours: OpeningHoursInterval[], locale?: string): string[] {
  const byDay = hoursByWeekday(hours);
  const lines = new Map<string, Weekday[]>();
  for (const day of WEEKDAYS) {
    const intervals = byDay.get(day) ?? [];
    const key = intervals.length ? intervals.map((i) => formatInterval(i, locale)).join(', ') : 'Closed';
    lines.set(key, [...(lines.get(key) ?? []), day]);
  }
  const ordered = [...lines.entries()].sort(([a], [b]) => Number(a === 'Closed') - Number(b === 'Closed'));
  return ordered.map(([key, days]) => `${days.map((d) => weekdayName(d, locale, 'short')).join(', ')} · ${key}`);
}

/** "Pacific Time" for "America/Los_Angeles"; falls back to the IANA name. */
export function timeZoneLabel(timezone: string, locale?: string): string {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone: timezone, timeZoneName: 'longGeneric' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    if (part?.value) return part.value;
  } catch {
    // Older browsers without "longGeneric": use the IANA name below.
  }
  return timezone.replace(/_/g, ' ');
}

/** "1:30" and " PM" of an instant in the business time zone, so the day period can be set smaller. */
export function timeParts(instant: string, timezone: string, locale?: string): { clock: string; period: string } {
  const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).formatToParts(
    new Date(instant),
  );
  const at = parts.findIndex((p) => p.type === 'dayPeriod');
  if (at < 0) return { clock: parts.map((p) => p.value).join(''), period: '' };
  // The space before "PM" travels with it; any text after it is kept too.
  const before = parts.slice(0, at);
  const lead = before.at(-1)?.type === 'literal' ? before.pop()!.value : '';
  return { clock: before.map((p) => p.value).join(''), period: `${lead}${parts.slice(at).map((p) => p.value).join('')}` };
}

/** "today" / "tomorrow" / "Tue, Nov 10" for a business-local date. */
export function relativeDay(date: string, timezone: string, locale?: string): string {
  const today = todayInTimeZone(timezone);
  if (date === today) return 'today';
  if (date === addDays(today, 1)) return 'tomorrow';
  return formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "1:30 PM – 2:30 PM" for a slot or a booking, in the business time zone. */
export function timeRange(startsAt: string, endsAt: string, timezone: string, locale?: string): string {
  return `${formatTime(startsAt, timezone, locale)} – ${formatTime(endsAt, timezone, locale)}`;
}

/** The business-local clock right now, "HH:MM" — to compare with opening hours. */
export function clockNow(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: timezone }).format(
    new Date(),
  );
}

/** Digits and "+" only, for tel: links. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Initials for a portrait placeholder: "Rosa Delgado" → "RD". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0]![0], words.at(-1)![0]] : [words[0]?.[0]];
  return letters.filter(Boolean).join('').toUpperCase();
}
