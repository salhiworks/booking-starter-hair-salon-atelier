import type { Ref } from 'react';
import { Check, Hourglass, MapPin } from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  isDifferentTimeZone,
  type BookingConfirmation,
  type Business,
  type Service,
} from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { ContactLinks } from '../components/Notice';
import { formatDuration, formatPrice, timeRange, timeZoneLabel } from '../lib/format';
import { StepHeading } from './parts';

/**
 * Only ever rendered after verifyBooking() returned { ok: true }. `pending` is
 * a request the salon still confirms or declines; `confirmed` is booked. The
 * slip the visitor filled in becomes their ticket, with the reference.
 */
export function Confirmation({
  confirmation,
  service,
  business,
  email,
  headingRef,
  onClose,
  onStartOver,
}: {
  confirmation: BookingConfirmation;
  service: Service | null;
  business: Business;
  /** The address the visitor typed (the code went there). */
  email: string;
  headingRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onStartOver: () => void;
}) {
  const pending = confirmation.status === 'pending';
  const { locale, contact, name } = business;
  const { timezone } = confirmation;
  const zone = timeZoneLabel(timezone, locale);

  // A request keeps its time until holdExpiresAt while the salon decides (INTEGRATION.md §6).
  // Not worth saying when the hold simply lasts until the appointment itself.
  const { holdExpiresAt } = confirmation;
  const heldUntil =
    pending && holdExpiresAt && Date.parse(holdExpiresAt) < Date.parse(confirmation.startsAt)
      ? formatDateTime(holdExpiresAt, timezone, locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }) + (isDifferentTimeZone(timezone) ? ` (${zone})` : '')
      : null;

  const ticket = (
    <aside className="slip ticket" aria-label="Your appointment">
      <p className="kicker slip__kicker">{pending ? 'Requested' : 'Booked'}</p>
      <p className="slip__name">{confirmation.serviceName}</p>
      {service ? (
        <p className="slip__meta">
          {formatDuration(service.durationMinutes)} · {formatPrice(service, locale)}
        </p>
      ) : null}
      <div className="perf" aria-hidden="true" />
      <div className="slip__date">
        <span className="slip__numeral">{formatDate(confirmation.date, locale, { day: 'numeric' })}</span>
        <span className="slip__when">
          <span className="slip__dow">{formatDate(confirmation.date, locale, { weekday: 'long' })}</span>
          <span className="slip__month">{formatDate(confirmation.date, locale, { month: 'long', year: 'numeric' })}</span>
        </span>
      </div>
      <p className="slip__time tabular">{timeRange(confirmation.startsAt, confirmation.endsAt, timezone, locale)}</p>
      <p className="slip__zone">{zone}</p>
      <div className="perf" aria-hidden="true" />
      <p className="ticket__ref">
        <span>Reference</span>
        <b>{confirmation.reference}</b>
      </p>
    </aside>
  );

  return (
    <div className="step step--done">
      <div className="bk-layout bk-layout--form bk-layout--done">
        {ticket}
        <div className="bk-card result">
          <span className={`result__mark ${pending ? 'result__mark--pending' : 'result__mark--confirmed'}`}>
            <Icon icon={pending ? Hourglass : Check} size={26} weight={pending ? 1.2 : 1.6} />
          </span>
          <StepHeading ref={headingRef} step="done" ending={pending ? 'shortly.' : 'booked.'}>
            {pending ? "Request received — we'll confirm your appointment" : "You're"}
          </StepHeading>
          <p className="result__lede">
            {__BOOKING_DEMO__ ? (
              // Live Demo build only: no email exists to promise.
              pending ? (
                <>
                  This is a demo, so no email is sent. Your request is waiting in the demo dashboard — open it to confirm
                  or decline it as the salon owner.
                </>
              ) : (
                <>This is a demo, so no email is sent. Your appointment is in the demo dashboard.</>
              )
            ) : pending ? (
              <>
                {name} will email you{email ? <> at <b>{email}</b></> : null} once they confirm or decline it
                {heldUntil ? <>; your time is held for you until {heldUntil}</> : null}. Keep your reference handy.
              </>
            ) : (
              <>
                A confirmation is on its way{email ? <> to <b>{email}</b></> : null}. See you on{' '}
                {formatDate(confirmation.date, locale, { weekday: 'long' })}.
              </>
            )}
          </p>
          {contact.address ? (
            <p className="result__where">
              <Icon icon={MapPin} size={16} />
              {contact.address}
            </p>
          ) : null}
          <div className="result__contact">
            <p>Need to change something? Get in touch and mention your reference:</p>
            <ContactLinks contact={contact} />
          </div>
          <div className="result__acts">
            {__BOOKING_DEMO__ ? (
              <a className="btn btn--ink" href="/admin/#bookings">
                Open the demo dashboard
              </a>
            ) : null}
            <button type="button" className={__BOOKING_DEMO__ ? 'text-link text-link--target' : 'btn btn--ink'} onClick={onClose}>
              Back to {name}
            </button>
            <button type="button" className="text-link text-link--target" onClick={onStartOver}>
              Book another appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
