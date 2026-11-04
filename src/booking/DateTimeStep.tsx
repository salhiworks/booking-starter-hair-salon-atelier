import { useState, type ReactNode, type Ref } from 'react';
import { ArrowRight, CalendarDays, CloudOff, Globe, Phone, Rows3 } from 'lucide-react';
import {
  addDays,
  addMonths,
  formatDate,
  formatTime,
  isDifferentTimeZone,
  monthOf,
  nextAvailableDay,
  startOfWeek,
  type Availability,
  type AvailabilityDay,
  type Business,
  type PartOfDay,
  type Service,
  type Slot,
  type Weekday,
} from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { formatDuration, formatPrice, relativeDay, telHref, timeZoneLabel } from '../lib/format';
import type { Load } from '../lib/load';
import { Legend, MonthCalendar, MonthTitle, PageButtons, WeekStrip, type CalendarProps } from './Calendar';
import { monthForWeek } from './flowState';
import { StepHeading } from './parts';
import { TimesPane } from './TimesPane';

/**
 * Step 2: the day and the time on one screen. Desktop: the slip, the month
 * and the day's times side by side. Phones: a week strip (the month on
 * demand), the times, and the choice + Continue in a bar at the bottom.
 * Every day status and time comes from getAvailability(), one month per call.
 */
export function DateTimeStep({
  business,
  service,
  phone,
  month,
  weekStart,
  weekStartsOn,
  today,
  lastBookable,
  monthLoad,
  dayMap,
  date,
  slot,
  partHint,
  taken,
  notice,
  slip,
  headingRef,
  onChooseDay,
  onChooseSlot,
  onContinue,
  onShowMonth,
  onShowWeek,
  onRetry,
  onChangeService,
  onServiceGone,
}: {
  business: Business;
  service: Service;
  phone: boolean;
  month: string;
  weekStart: string;
  weekStartsOn: Weekday;
  today: string;
  lastBookable: string;
  monthLoad: Load<Availability>;
  dayMap: Map<string, AvailabilityDay>;
  date: string | null;
  slot: Slot | null;
  partHint: PartOfDay | null;
  taken: Slot | null;
  notice: ReactNode;
  slip: ReactNode;
  headingRef: Ref<HTMLHeadingElement>;
  onChooseDay: (date: string) => void;
  onChooseSlot: (slot: Slot, date?: string) => void;
  onContinue: () => void;
  onShowMonth: (month: string, weekStart: string) => void;
  onShowWeek: (weekStart: string, month: string) => void;
  onRetry: () => void;
  onChangeService: () => void;
  onServiceGone: () => void;
}) {
  const { locale, timezone, contact } = business;
  const zone = timeZoneLabel(timezone, locale);
  const [monthOpen, setMonthOpen] = useState(false);
  const loading = monthLoad.state === 'loading';
  const error = monthLoad.state === 'error' ? monthLoad.error : null;
  const day = date ? dayMap.get(date) : undefined;
  const days = [...dayMap.values()];

  const showMonth = (m: string) =>
    onShowMonth(m, startOfWeek(m === monthOf(today) ? today : `${m}-01`, weekStartsOn));
  const calendarProps: CalendarProps = {
    business,
    month,
    weekStartsOn,
    today,
    lastBookable,
    dayMap,
    loading,
    selected: date,
    onChoose: (d) => {
      onChooseDay(d);
      // Phones: picking from the month folds it back to the week, leaving room for the times.
      if (phone) setMonthOpen(false);
    },
    onShowMonth: showMonth,
  };

  // The visible month did not load while the chosen day's times are on screen:
  // say so under the calendar (the times pane explains it when it has nothing to show).
  const monthError =
    error && day ? (
      <p className="cal__error" role="alert">
        <Icon icon={CloudOff} size={16} />
        <span>Couldn't load the open days of {formatDate(`${month}-01`, locale, { month: 'long' })}.</span>
        <button type="button" className="text-link" onClick={onRetry}>
          Try again
        </button>
      </p>
    ) : null;

  // "Soonest": the first open time in what is already loaded.
  const soonestDay = nextAvailableDay(days.filter((d) => d.date >= today));
  const soonest = soonestDay?.slots[0] ?? null;
  const soonestShown = soonest && soonest.startsAt !== slot?.startsAt;
  const soonestLine = soonestShown ? (
    <p className="soonest">
      <span>
        Soonest: <b>{`${relativeDay(soonestDay!.date, timezone, locale)}, ${formatTime(soonest.startsAt, timezone, locale)}`}</b>
      </span>
      <button type="button" className="text-link text-link--target" onClick={() => onChooseSlot(soonest, soonestDay!.date)}>
        Choose it<span className="visually-hidden">: {formatDate(soonestDay!.date, locale)}, {formatTime(soonest.startsAt, timezone, locale)}</span>
        <Icon icon={ArrowRight} size={16} />
      </button>
    </p>
  ) : null;

  const times = (
    <TimesPane
      business={business}
      service={service}
      phone={phone}
      date={date}
      day={day}
      days={days}
      error={error}
      slot={slot}
      partHint={partHint}
      taken={taken}
      notice={notice}
      month={month}
      canNextMonth={month < monthOf(lastBookable)}
      onChooseSlot={onChooseSlot}
      onChooseDay={onChooseDay}
      onContinue={onContinue}
      onNextMonth={() => showMonth(addMonths(month, 1))}
      onRetry={onRetry}
      onServiceGone={onServiceGone}
    />
  );

  const zoneNote = (
    <p className="step-head__note">
      <Icon icon={Globe} size={16} />
      <span>
        All times are {zone} — the salon's local time.
        {isDifferentTimeZone(timezone) ? ' Your device is set to another time zone.' : ''}
      </span>
    </p>
  );

  if (phone) {
    return (
      <div className="step step--datetime">
        <StepHeading ref={headingRef} step="datetime" ending="come in?">
          When would you like to
        </StepHeading>
        <p className="svc-line">
          <span>
            <b>{service.name}</b> · {formatDuration(service.durationMinutes)} · {formatPrice(service, locale)}
          </span>
          <button type="button" className="text-link text-link--target" onClick={onChangeService}>
            Change<span className="visually-hidden"> the service</span>
          </button>
        </p>
        <section className="m-cal" aria-label="Choose a day">
          <div className="m-cal__head">
            {/* The week's month (its middle day decides when a week spans two). */}
            <MonthTitle month={monthOpen ? month : monthOf(addDays(weekStart, 3))} locale={locale} id="m-cal-title" />
            {monthOpen ? (
              <PageButtons
                label={[
                  `Previous month, ${formatDate(`${addMonths(month, -1)}-01`, locale, { month: 'long', year: 'numeric' })}`,
                  `Next month, ${formatDate(`${addMonths(month, 1)}-01`, locale, { month: 'long', year: 'numeric' })}`,
                ]}
                canPrev={month > monthOf(today)}
                canNext={month < monthOf(lastBookable)}
                onPrev={() => showMonth(addMonths(month, -1))}
                onNext={() => showMonth(addMonths(month, 1))}
              />
            ) : null}
            <button
              type="button"
              className="month-toggle"
              aria-expanded={monthOpen}
              onClick={() => setMonthOpen((open) => !open)}
            >
              <Icon icon={monthOpen ? Rows3 : CalendarDays} size={16} />
              <span className="month-toggle__label">{monthOpen ? 'Week' : 'Month'}</span>
              <span className="visually-hidden">{monthOpen ? ' view' : ' view: show the whole month'}</span>
            </button>
          </div>
          {monthOpen ? (
            <MonthCalendar {...calendarProps} titleId="m-cal-title" showHead={false} />
          ) : (
            <WeekStrip
              {...calendarProps}
              weekStart={weekStart}
              onShowWeek={(ws) => onShowWeek(ws, monthForWeek(ws, month))}
            />
          )}
          {monthError}
          {soonestLine}
        </section>
        <section className="m-times" aria-labelledby="times-title">
          {times}
        </section>
        <p className="bk-note">
          <Icon icon={Globe} size={15} />
          <span>
            All times are {zone} — the salon's local time.
            {isDifferentTimeZone(timezone) ? ' Your device is set to another time zone.' : ''}
          </span>
        </p>
        {slot && date ? (
          <div className="m-bar surface-dark">
            <p className="m-bar__text">
              <b>
                {formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                {formatTime(slot.startsAt, timezone, locale)}
              </b>
              <span>
                {service.name} · {formatPrice(service, locale)}
                <span className="m-bar__zone"> · {zone}</span>
              </span>
            </p>
            <button type="button" className="btn btn--ink m-bar__go" onClick={onContinue}>
              Continue
              <Icon icon={ArrowRight} size={18} className="icon--forward" />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="step step--datetime">
      <StepHeading ref={headingRef} step="datetime" ending="come in?" aside={zoneNote}>
        When would you like to
      </StepHeading>
      <div className="bk-layout bk-layout--times">
        {slip}
        <div className="bk-panel">
          <section className="bk-panel__cal" aria-label="Choose a day">
            <MonthCalendar {...calendarProps} titleId="cal-title" />
            {monthError}
            <Legend />
            {soonestLine}
          </section>
          <section className="bk-panel__times" aria-label="Choose a time">
            {times}
          </section>
        </div>
      </div>
      <div className="bk-foot">
        {contact.phone ? (
          <p>
            Prefer to talk it through?{' '}
            <a className="text-link" href={telHref(contact.phone)}>
              <Icon icon={Phone} size={15} />
              {contact.phone}
            </a>
          </p>
        ) : (
          <span />
        )}
        {contact.email ? (
          <p>
            Questions before you book?{' '}
            <a className="text-link" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
