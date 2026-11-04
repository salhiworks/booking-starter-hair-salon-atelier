import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRight, CalendarX2, Check, Clock, CloudOff, DoorClosed, RefreshCw } from 'lucide-react';
import {
  formatDate,
  formatTime,
  groupSlotsByPartOfDay,
  nextAvailableDay,
  partOfDay,
  type AvailabilityDay,
  type Business,
  type EngineError,
  type PartOfDay,
  type Service,
  type Slot,
} from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { ContactLinks } from '../components/Notice';
import { readErrorCopy } from '../lib/messages';
import { timeZoneLabel } from '../lib/format';
import { TimeText } from './parts';

const PART_LABEL: Record<PartOfDay, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export interface TimesPaneProps {
  business: Business;
  service: Service;
  phone: boolean;
  date: string | null;
  /** The chosen day as the server described it; undefined while its month loads. */
  day: AvailabilityDay | undefined;
  /** Every day loaded so far (for "next available"). */
  days: AvailabilityDay[];
  error: EngineError | null;
  slot: Slot | null;
  partHint: PartOfDay | null;
  taken: Slot | null;
  notice: ReactNode;
  month: string;
  canNextMonth: boolean;
  onChooseSlot: (slot: Slot, date?: string) => void;
  onChooseDay: (date: string) => void;
  onContinue: () => void;
  onNextMonth: () => void;
  onRetry: () => void;
  onServiceGone: () => void;
}

function Skeleton({ heading, notice }: { heading: ReactNode; notice?: ReactNode }) {
  return (
    <div className="times times--loading" aria-busy="true">
      {heading}
      {notice ? <div className="times__notice">{notice}</div> : null}
      <p className="loading-line times__sub" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Finding open times…
      </p>
      <div className="seg seg--ghost" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <ul className="slots slots--ghost" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <span className="sk" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A day without times explains itself and points to the next one in the data already loaded. */
function DayState({
  props,
  heading,
  icon,
  title,
  body,
}: {
  props: TimesPaneProps;
  heading: ReactNode;
  icon: typeof CalendarX2;
  title: (next: AvailabilityDay | null) => ReactNode;
  body: string;
}) {
  const { business, days, date, canNextMonth, onChooseSlot, onChooseDay, onNextMonth, month } = props;
  const next = nextAvailableDay(days, date ?? undefined);
  const { locale } = business;
  return (
    <div className="times">
      {heading}
      <div className="times-state">
        <span className="times-state__icon">
          <Icon icon={icon} size={22} />
        </span>
        <p className="times-state__title">{title(next)}</p>
        <p className="times-state__body">{body}</p>
        {next ? (
          <div className="next-av">
            <p className="kicker next-av__kicker">
              {formatDate(next.date, locale, { weekday: 'long', month: 'long', day: 'numeric' })} · {next.slots.length}{' '}
              {next.slots.length === 1 ? 'time' : 'times'}
            </p>
            <ul className="chips">
              {next.slots.slice(0, 3).map((s) => (
                <li key={s.startsAt}>
                  <button type="button" className="chip" onClick={() => onChooseSlot(s, next.date)}>
                    <TimeText instant={s.startsAt} business={business} />
                    <span className="visually-hidden">, {formatDate(next.date, locale)}</span>
                  </button>
                </li>
              ))}
              {next.slots.length > 3 ? (
                <li>
                  <button
                    type="button"
                    className="chip chip--more"
                    onClick={() => {
                      onChooseDay(next.date);
                      // This notice goes away: keep the keyboard on the day just chosen.
                      requestAnimationFrame(() => document.querySelector<HTMLElement>(`button.day[data-date="${next.date}"]`)?.focus());
                    }}
                  >
                    + {next.slots.length - 3} more<span className="visually-hidden"> on {formatDate(next.date, locale)}</span>
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        ) : canNextMonth ? (
          <div className="next-av">
            <p className="next-av__none">Nothing else is open in the days shown.</p>
            <button type="button" className="text-link text-link--target" onClick={onNextMonth}>
              See {formatDate(`${nextMonthOf(month)}-01`, locale, { month: 'long' })}
              <Icon icon={ArrowRight} size={16} />
            </button>
          </div>
        ) : (
          <div className="next-av">
            <p className="next-av__none">Nothing else is open online for now — call or email us; we sometimes have a cancellation.</p>
            <ContactLinks contact={business.contact} />
          </div>
        )}
      </div>
    </div>
  );
}

function nextMonthOf(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/**
 * The chosen day's times, grouped Morning / Afternoon / Evening (by the
 * server's business-local `slot.time`). The chosen time unfolds into
 * "1:30 PM until 2:30 PM | Continue"; on phones, Continue waits in the bottom bar.
 */
export function TimesPane(props: TimesPaneProps) {
  const { business, service, phone, date, day, error, slot, partHint, taken, notice, onChooseSlot, onContinue } = props;
  const { locale, timezone } = business;
  const zone = timeZoneLabel(timezone, locale);
  const [picked, setPicked] = useState<{ date: string | null; part: PartOfDay } | null>(null);

  const heading = date ? (
    <h3 className="times__day" id="times-title">
      {formatDate(date, locale)}
    </h3>
  ) : null;

  if (!date) {
    // Nothing chosen and nothing to choose in this month (the step picks the soonest day otherwise).
    if (error) {
      return <LoadError props={props} heading={null} />;
    }
    return (
      <DayState
        props={props}
        heading={null}
        icon={CalendarX2}
        title={(next) =>
          next ? (
            <>
              Nothing left in {formatDate(`${props.month}-01`, locale, { month: 'long' })} — next available:{' '}
              <em>{formatDate(next.date, locale)}</em>
            </>
          ) : (
            `No open times left in ${formatDate(`${props.month}-01`, locale, { month: 'long' })}`
          )
        }
        body="The salon's calendar has nothing free in the rest of this month."
      />
    );
  }
  if (!day) {
    return error ? <LoadError props={props} heading={heading} /> : <Skeleton heading={heading} notice={notice} />;
  }
  if (day.status === 'closed') {
    return (
      <DayState
        props={props}
        heading={heading}
        icon={DoorClosed}
        title={() => 'Closed'}
        body={`The salon isn't taking appointments on ${formatDate(date, locale, { weekday: 'long', month: 'long', day: 'numeric' })}.`}
      />
    );
  }
  if (day.status !== 'available' || day.slots.length === 0) {
    return (
      <DayState
        props={props}
        heading={heading}
        icon={CalendarX2}
        title={(next) =>
          next ? (
            <>
              Fully booked — next available: <em>{formatDate(next.date, locale)}</em>
            </>
          ) : (
            'Fully booked'
          )
        }
        body={`Every ${service.name} time on ${formatDate(date, locale, { weekday: 'long' })} is taken.`}
      />
    );
  }

  const groups = groupSlotsByPartOfDay(day.slots);
  const withTimes = groups.filter((g) => g.slots.length > 0);
  const chosenPart = picked && picked.date === date ? picked.part : null;
  const current: PartOfDay =
    (chosenPart && groups.some((g) => g.part === chosenPart && g.slots.length) ? chosenPart : null) ??
    (slot && day.slots.some((s) => s.startsAt === slot.startsAt) ? partOfDay(slot.time) : null) ??
    (partHint && groups.some((g) => g.part === partHint && g.slots.length) ? partHint : null) ??
    withTimes[0]!.part;
  const shown = groups.find((g) => g.part === current)!.slots;
  // A time just taken by someone else stays in its place, struck through.
  const gone = taken && partOfDay(taken.time) === current && !day.slots.some((s) => s.startsAt === taken.startsAt) ? taken : null;
  const rows: Array<{ slot: Slot; gone: boolean }> = shown.map((s) => ({ slot: s, gone: false }));
  if (gone) {
    rows.push({ slot: gone, gone: true });
    rows.sort((a, b) => a.slot.startsAt.localeCompare(b.slot.startsAt));
  }

  const choosePart = (part: PartOfDay) => setPicked({ date, part });
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const order = withTimes.map((g) => g.part);
    const at = order.indexOf(current);
    const nextPart =
      event.key === 'Home'
        ? order[0]!
        : event.key === 'End'
          ? order.at(-1)!
          : order[(at + (event.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length]!;
    choosePart(nextPart);
    requestAnimationFrame(() => document.getElementById(`part-${nextPart}`)?.focus());
  };

  return (
    <div className="times">
      {heading}
      <p className="times__sub">
        <Icon icon={Clock} size={15} />
        {day.slots.length} open {day.slots.length === 1 ? 'time' : 'times'} · {zone}
      </p>
      {notice ? <div className="times__notice">{notice}</div> : null}
      <div className="seg" role="tablist" aria-label="Time of day">
        {groups.map((g) => {
          const active = g.part === current;
          const empty = g.slots.length === 0;
          return (
            <button
              key={g.part}
              type="button"
              role="tab"
              id={`part-${g.part}`}
              className="seg__opt"
              aria-selected={active}
              aria-controls="times-panel"
              aria-disabled={empty || undefined}
              tabIndex={active ? 0 : -1}
              onClick={() => !empty && choosePart(g.part)}
              onKeyDown={onTabKey}
            >
              {PART_LABEL[g.part]}
              <span className="seg__count">
                {empty ? <span aria-hidden="true">–</span> : g.slots.length}
                {empty ? <span className="visually-hidden">no times</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="slots-panel" role="tabpanel" id="times-panel" aria-labelledby={`part-${current}`} key={`${date}-${current}`}>
        <ul className="slots">
          {rows.map(({ slot: s, gone: isGone }) => {
            if (isGone) {
              return (
                <li key={s.startsAt} className="slots__gone">
                  <span className="slot-gone">
                    <s>
                      <TimeText instant={s.startsAt} business={business} />
                    </s>
                    <span className="slot-gone__tag">Taken</span>
                  </span>
                </li>
              );
            }
            const selected = slot?.startsAt === s.startsAt;
            // The chosen time unfolds in place: the same button stays (so focus stays on it),
            // and Continue appears right after it — the next Tab stop.
            const split = selected && !phone;
            return (
              <li key={s.startsAt} className={split ? 'slots__split' : undefined}>
                <div className={split ? 'split' : 'slot-row'} role={split ? 'group' : undefined} aria-label={split ? 'Your time' : undefined}>
                  <button
                    type="button"
                    className={split ? 'slot split__time' : 'slot'}
                    aria-pressed={selected}
                    onClick={() => onChooseSlot(s)}
                  >
                    {split ? <Icon icon={Check} size={16} weight={1.7} /> : null}
                    <TimeText instant={s.startsAt} business={business} />
                    {split ? <span className="split__end">until {formatTime(s.endsAt, timezone, locale)}</span> : null}
                  </button>
                  {split ? (
                    <button type="button" className="split__go" onClick={onContinue}>
                      Continue
                      <Icon icon={ArrowRight} size={18} className="icon--forward" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LoadError({ props, heading }: { props: TimesPaneProps; heading: ReactNode }) {
  const { business, error, onRetry, onServiceGone } = props;
  const copy = readErrorCopy(error!, 'Open times');
  const gone = error!.code === 'SERVICE_UNAVAILABLE';
  return (
    <div className="times">
      {heading}
      <div className="times-state times-state--error" role="alert">
        <span className="times-state__icon">
          <Icon icon={CloudOff} size={22} />
        </span>
        <p className="times-state__title">{error!.code === 'NETWORK' || copy.retry ? "Couldn't load times" : copy.title}</p>
        <p className="times-state__body">
          {copy.retry ? `${copy.body} Your service and day stay chosen.` : copy.body}
        </p>
        <div className="times-state__acts">
          {gone ? (
            <button type="button" className="btn btn--ink btn--small" onClick={onServiceGone}>
              Choose another service
            </button>
          ) : copy.retry ? (
            <button type="button" className="btn btn--ink btn--small" onClick={onRetry}>
              <Icon icon={RefreshCw} size={16} />
              Try again
            </button>
          ) : null}
        </div>
        {copy.contact ? <ContactLinks contact={business.contact} /> : null}
      </div>
    </div>
  );
}
