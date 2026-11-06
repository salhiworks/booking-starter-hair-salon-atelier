import { Globe, Lock, MapPin } from 'lucide-react';
import { formatDate, formatTime, type Business, type Service, type Slot } from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { formatDuration, formatPrice, timeRange, timeZoneLabel } from '../lib/format';
import type { Step } from './flowState';

/**
 * The reservation slip: the chosen service, its length and price, the day,
 * the time and the time zone stay in view while the visitor books. It fills
 * in as they choose. At the code step the time is held, so the slip says until
 * when and offers no "Change" — the step has "Choose another time". On phones
 * (`compact`) it is a one-line slip above the form.
 */
export function Slip({
  business,
  service,
  date,
  slot,
  step,
  heldUntil,
  compact,
  onChangeService,
  onChangeTime,
}: {
  business: Business;
  service: Service;
  date: string | null;
  slot: Slot | null;
  step: Step;
  /** requestBooking()'s `expiresAt`, only while a real hold exists (never in preview). */
  heldUntil: string | null;
  compact: boolean;
  onChangeService: () => void;
  onChangeTime: () => void;
}) {
  const { locale, timezone, contact } = business;
  const zone = timeZoneLabel(timezone, locale);
  const meta = `${formatDuration(service.durationMinutes)} · ${formatPrice(service, locale)}`;
  const held = heldUntil ? formatTime(heldUntil, timezone, locale) : null;

  if (compact) {
    return (
      <aside className="mini-slip" aria-label="Your appointment">
        <span className="mini-slip__day" aria-hidden="true">
          {date ? formatDate(date, locale, { day: 'numeric' }) : '—'}
        </span>
        <p className="mini-slip__text">
          <b>
            {date ? formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No day yet'}
            {slot ? ` · ${formatTime(slot.startsAt, timezone, locale)}` : ''}
          </b>
          <span>
            {step === 'verify'
              ? held
                ? `${service.name} · held for you until ${held}`
                : `${service.name} · ${zone}`
              : `${service.name} · ${meta} · ${zone}`}
          </span>
        </p>
        {step === 'details' ? (
          <button type="button" className="mini-slip__change" onClick={onChangeTime}>
            Change<span className="visually-hidden"> the day or time</span>
          </button>
        ) : step === 'verify' && held ? (
          <Icon icon={Lock} size={18} className="mini-slip__lock" />
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="slip" aria-label="Your appointment">
      <p className="kicker slip__kicker">Your appointment</p>
      <div className="slip__service">
        <p className="slip__name">{service.name}</p>
        {step === 'verify' ? null : (
          <button type="button" className="slip__change" onClick={onChangeService}>
            Change<span className="visually-hidden"> the service</span>
          </button>
        )}
      </div>
      <p className="slip__meta">{meta}</p>

      <div className="perf" aria-hidden="true" />

      {/* The day and time; when the slip stands as tall as the calendar, they sit centred here. */}
      <div className="slip__middle">
        {date ? (
          <div className="slip__date" key={date}>
            <span className="slip__numeral">{formatDate(date, locale, { day: 'numeric' })}</span>
            <span className="slip__when">
              <span className="slip__dow">{formatDate(date, locale, { weekday: 'long' })}</span>
              <span className="slip__month">{formatDate(date, locale, { month: 'long', year: 'numeric' })}</span>
            </span>
          </div>
        ) : (
          <p className="slip__empty">Choose a day</p>
        )}
        {slot ? (
          <p className="slip__time tabular" key={slot.startsAt}>
            {timeRange(slot.startsAt, slot.endsAt, timezone, locale)}
          </p>
        ) : date ? (
          <p className="slip__empty slip__empty--time">Choose a time</p>
        ) : null}
        <p className="slip__zone">
          <Icon icon={Globe} size={15} />
          {zone}
        </p>
        {step === 'details' && slot ? (
          <button type="button" className="slip__change slip__change--time" onClick={onChangeTime}>
            Change the day or time
          </button>
        ) : null}
      </div>

      <div className="perf" aria-hidden="true" />

      {contact.address ? (
        <p className="slip__line">
          <Icon icon={MapPin} size={16} />
          <span>{contact.address}</span>
        </p>
      ) : null}
      <p className="slip__line slip__line--hold">
        <Icon icon={Lock} size={16} />
        <span>
          {step === 'verify'
            ? held
              ? `Held for you until ${held} while you enter the code.`
              : __BOOKING_DEMO__
                ? 'Demo: this time is held for you while you enter the code.'
                : 'Preview: nothing is held or saved.'
            : 'Nothing to pay online. We hold your time while you confirm your email.'}
        </span>
      </p>
    </aside>
  );
}
