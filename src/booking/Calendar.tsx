import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  daysInMonth,
  formatDate,
  isFewLeft,
  monthGrid,
  monthOf,
  startOfWeek,
  weekDates,
  type AvailabilityDay,
  type Business,
  type Weekday,
} from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';

/** How a day looks: from the server's status; `loading` until its month has arrived. */
type DayKind = 'open' | 'few' | 'full' | 'closed' | 'out' | 'loading';

function kindOf(day: AvailabilityDay | undefined, inRange: boolean): DayKind {
  if (!inRange) return 'out';
  if (!day) return 'loading';
  if (day.status === 'available') return isFewLeft(day) ? 'few' : 'open';
  if (day.status === 'full') return 'full';
  if (day.status === 'closed') return 'closed';
  return 'out';
}

function spoken(kind: DayKind, day: AvailabilityDay | undefined): string {
  switch (kind) {
    case 'open':
      return `${day!.slots.length} open times`;
    case 'few':
      return day!.slots.length === 1 ? '1 time left' : `${day!.slots.length} times left`;
    case 'full':
      return 'fully booked';
    case 'closed':
      return 'closed';
    case 'loading':
      return 'loading';
    case 'out':
      return 'not bookable';
  }
}

export interface CalendarProps {
  business: Business;
  /** "YYYY-MM" on screen. */
  month: string;
  weekStartsOn: Weekday;
  today: string;
  lastBookable: string;
  dayMap: Map<string, AvailabilityDay>;
  loading: boolean;
  selected: string | null;
  onChoose: (date: string) => void;
  onShowMonth: (month: string) => void;
}

/**
 * Keyboard movement shared by the month grid and the week strip: arrows by
 * day (up/down by week), Home/End to the week's ends, Page Up/Down by month.
 * Days outside the booking window are skipped; leaving the visible month
 * turns the page.
 */
function useDayKeys(props: CalendarProps, visible: string[], onTurn: (date: string) => void) {
  const { today, lastBookable, weekStartsOn } = props;
  const inRange = (date: string) => date >= today && date <= lastBookable;
  return (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    let target: string | null = null;
    let step = 1;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(date, -1);
        step = -1;
        break;
      case 'ArrowRight':
        target = addDays(date, 1);
        break;
      case 'ArrowUp':
        target = addDays(date, -7);
        step = -1;
        break;
      case 'ArrowDown':
        target = addDays(date, 7);
        break;
      case 'Home':
        target = startOfWeek(date, weekStartsOn);
        break;
      case 'End':
        target = addDays(startOfWeek(date, weekStartsOn), 6);
        step = -1;
        break;
      case 'PageUp':
      case 'PageDown': {
        const month = addMonths(monthOf(date), event.key === 'PageUp' ? -1 : 1);
        const day = Math.min(Number(date.slice(8)), daysInMonth(month));
        target = `${month}-${String(day).padStart(2, '0')}`;
        step = event.key === 'PageUp' ? -1 : 1;
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    // Skip what cannot be chosen, in the direction of travel; clamp to the window.
    if (target < today) target = today;
    if (target > lastBookable) target = lastBookable;
    for (let i = 0; i < 7 && !inRange(target); i++) target = addDays(target, step);
    if (!inRange(target) || target === date) return;
    if (visible.includes(target)) {
      document.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus();
    } else {
      onTurn(target);
    }
  };
}

function DayButton({
  date,
  props,
  label,
  tabbable,
  onKeyDown,
}: {
  date: string;
  props: CalendarProps;
  label?: string;
  tabbable: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: string) => void;
}) {
  const { business, today, lastBookable, dayMap, selected, onChoose } = props;
  const day = dayMap.get(date);
  const inRange = date >= today && date <= lastBookable;
  const kind = kindOf(day, inRange);
  const isToday = date === today;
  const isSelected = date === selected;
  const full = formatDate(date, business.locale, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <button
      type="button"
      className={`day day--${kind}${isToday ? ' day--today' : ''}${isSelected ? ' is-selected' : ''}`}
      data-date={date}
      data-status={day?.status ?? (inRange ? 'loading' : 'unavailable')}
      disabled={!inRange}
      tabIndex={tabbable ? 0 : -1}
      aria-pressed={inRange ? isSelected : undefined}
      aria-current={isToday ? 'date' : undefined}
      aria-label={`${isToday ? 'Today, ' : ''}${full}: ${spoken(kind, day)}`}
      onClick={() => onChoose(date)}
      onKeyDown={(event) => onKeyDown(event, date)}
    >
      {label ? <span className="day__dow">{label}</span> : null}
      <span className="day__n">{formatDate(date, business.locale, { day: 'numeric' })}</span>
      <span className="day__mark" aria-hidden="true">
        {kind === 'few' ? `${day!.slots.length} left` : null}
      </span>
    </button>
  );
}

/** Where Tab lands in a set of days: the chosen day, else today, else the first day that can be chosen. */
function tabTarget(dates: string[], props: CalendarProps): string | undefined {
  const inRange = (d: string) => d >= props.today && d <= props.lastBookable;
  if (props.selected && dates.includes(props.selected)) return props.selected;
  if (dates.includes(props.today)) return props.today;
  return dates.find(inRange);
}

/** Focus a day once it is on screen (after the month or week turned). */
function usePendingFocus(): (date: string) => void {
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    const button = document.querySelector<HTMLButtonElement>(`[data-date="${pending.current}"]`);
    if (button) {
      button.focus();
      pending.current = null;
    }
  });
  return (date) => {
    pending.current = date;
  };
}

export function MonthTitle({ month, locale, id }: { month: string; locale: string; id?: string }) {
  const first = `${month}-01`;
  return (
    <h3 className="cal__month" id={id}>
      {formatDate(first, locale, { month: 'long' })} <span>{formatDate(first, locale, { year: 'numeric' })}</span>
    </h3>
  );
}

export function PageButtons({
  label,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  label: [string, string];
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  // aria-disabled keeps focus on a button that reaches the end of the window.
  return (
    <div className="cal__nav">
      <button type="button" className="icon-btn" aria-disabled={!canPrev} onClick={() => canPrev && onPrev()}>
        <Icon icon={ChevronLeft} size={18} />
        <span className="visually-hidden">{label[0]}</span>
      </button>
      <button type="button" className="icon-btn" aria-disabled={!canNext} onClick={() => canNext && onNext()}>
        <Icon icon={ChevronRight} size={18} />
        <span className="visually-hidden">{label[1]}</span>
      </button>
    </div>
  );
}

/** The month on a hairline grid, serif numerals; every status from getAvailability(). */
export function MonthCalendar(props: CalendarProps & { titleId: string; showHead?: boolean }) {
  const { business, month, weekStartsOn, today, lastBookable, loading, onShowMonth, titleId, showHead = true } = props;
  const grid = monthGrid(month, weekStartsOn);
  const inMonth = grid.weeks.flat().filter((d) => monthOf(d) === month);
  const focusLater = usePendingFocus();
  const onKeyDown = useDayKeys(props, inMonth, (target) => {
    onShowMonth(monthOf(target));
    focusLater(target);
  });
  const tabbable = tabTarget(inMonth, props);
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const monthName = (m: string) => formatDate(`${m}-01`, business.locale, { month: 'long', year: 'numeric' });

  return (
    <div className="cal">
      {showHead ? (
        <div className="cal__head">
          <MonthTitle month={month} locale={business.locale} id={titleId} />
          <PageButtons
            label={[`Previous month, ${monthName(prev)}`, `Next month, ${monthName(next)}`]}
            canPrev={month > monthOf(today)}
            canNext={month < monthOf(lastBookable)}
            onPrev={() => onShowMonth(prev)}
            onNext={() => onShowMonth(next)}
          />
        </div>
      ) : null}
      <div className="cal__grid" role="grid" aria-labelledby={titleId} aria-busy={loading || undefined}>
        <div className="cal__row cal__row--head" role="row">
          {grid.weeks[0]!.map((date) => (
            <span className="cal__dow" role="columnheader" key={date} aria-label={formatDate(date, business.locale, { weekday: 'long' })}>
              {formatDate(date, business.locale, { weekday: 'short' })}
            </span>
          ))}
        </div>
        {grid.weeks.map((week) => (
          <div className="cal__row" role="row" key={week[0]}>
            {week.map((date) => (
              <span className="cal__cell" role="gridcell" key={date}>
                {monthOf(date) === month ? (
                  <DayButton date={date} props={props} tabbable={date === tabbable} onKeyDown={onKeyDown} />
                ) : null}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Phones: one week at a time, each day with its weekday; the month opens on demand. */
export function WeekStrip(props: CalendarProps & { weekStart: string; onShowWeek: (weekStart: string) => void }) {
  const { business, weekStartsOn, today, lastBookable, loading, weekStart, onShowWeek } = props;
  const dates = weekDates(weekStart, weekStartsOn);
  const focusLater = usePendingFocus();
  const onKeyDown = useDayKeys(props, dates, (target) => {
    onShowWeek(startOfWeek(target, weekStartsOn));
    focusLater(target);
  });
  const tabbable = tabTarget(dates, props);
  const short = { month: 'short', day: 'numeric' } as const;
  const range = `${formatDate(dates[0]!, business.locale, short)} – ${formatDate(dates[6]!, business.locale, short)}`;

  return (
    <div className="week">
      <div className="week__bar">
        <p className="week__range" aria-live="polite">
          <span className="visually-hidden">Week of </span>
          {range}
        </p>
        <PageButtons
          label={['Previous week', 'Next week']}
          canPrev={weekStart > startOfWeek(today, weekStartsOn)}
          canNext={addDays(weekStart, 7) <= lastBookable}
          onPrev={() => onShowWeek(addDays(weekStart, -7))}
          onNext={() => onShowWeek(addDays(weekStart, 7))}
        />
      </div>
      <div className="week__grid" role="grid" aria-label={`Week of ${range}`} aria-busy={loading || undefined}>
        <div className="week__row" role="row">
          {dates.map((date) => (
            <span className="cal__cell" role="gridcell" key={date}>
              <DayButton
                date={date}
                props={props}
                label={formatDate(date, business.locale, { weekday: 'short' })}
                tabbable={date === tabbable}
                onKeyDown={onKeyDown}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** What the marks mean (closed days have none: a quiet numeral). */
export function Legend() {
  return (
    <ul className="legend" aria-label="What the marks mean">
      <li>
        <i className="legend__dot" aria-hidden="true" />
        Open
      </li>
      <li>
        <i className="legend__few" aria-hidden="true">
          2 left
        </i>
        Few left
      </li>
      <li>
        <i className="legend__full" aria-hidden="true">
          20
        </i>
        Fully booked
      </li>
      <li>
        <i className="legend__closed" aria-hidden="true">
          9
        </i>
        Closed
      </li>
      <li>
        <i className="legend__today" aria-hidden="true" />
        Today
      </li>
    </ul>
  );
}
