import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MapPin, RefreshCw, X } from 'lucide-react';
import { Icon } from '../components/Icon';
import { ContactLinks, Notice } from '../components/Notice';
import { Wordmark } from '../components/SiteHeader';
import { useModalDialog } from '../lib/dialog';
import { engine } from '../lib/engine';
import { readErrorCopy } from '../lib/messages';
import { useSiteData } from '../lib/siteData';
import { BookingFlow, type BookingIntent } from './BookingFlow';

/**
 * The booking as a focused full-screen view over the page (a modal dialog at
 * #book): opened from every "Book" action, closed with Close, Esc or Back.
 * The flow stays mounted while closed, so closing it to check a price and
 * coming back keeps every choice — a held time included.
 */
export function BookingView({
  open,
  onClose,
  intent,
  onIntentHandled,
}: {
  open: boolean;
  onClose: () => void;
  intent: BookingIntent | null;
  onIntentHandled: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, open, onClose);

  // Opening: the current step's heading takes focus (INTEGRATION.md §8).
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollTo({ top: 0 });
      ref.current?.querySelector<HTMLElement>('[data-step-heading], [data-view-title]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <dialog ref={ref} className="bv" aria-label="Book an appointment">
      <BookingSurface open={open} onClose={onClose} intent={intent} onIntentHandled={onIntentHandled} />
    </dialog>
  );
}

/** What the view shows: the flow, or why there is none (no backend, booking off, an error, loading). */
function BookingSurface({
  open,
  onClose,
  intent,
  onIntentHandled,
}: {
  open: boolean;
  onClose: () => void;
  intent: BookingIntent | null;
  onIntentHandled: () => void;
}) {
  const { business, services, reloadBusiness, reloadServices } = useSiteData();
  // The engine answered BOOKING_DISABLED mid-booking: online booking was switched off meanwhile.
  const [switchedOff, setSwitchedOff] = useState(false);
  const offTitleRef = useRef<HTMLParagraphElement>(null);
  const bookingOff = business.state === 'ready' && (switchedOff || !business.data.policies.onlineBookingEnabled);

  // The notice just replaced the flow the visitor was using: put focus on it.
  useEffect(() => {
    if (switchedOff) offTitleRef.current?.focus();
  }, [switchedOff]);

  // A service chosen while booking is off leads nowhere: drop the request.
  useEffect(() => {
    if (bookingOff && intent) onIntentHandled();
  }, [bookingOff, intent, onIntentHandled]);

  if (business.state === 'ready' && services.state === 'ready' && engine.mode !== 'unconfigured' && !bookingOff) {
    return (
      <BookingFlow
        business={business.data}
        services={services.data}
        open={open}
        intent={intent}
        onIntentHandled={onIntentHandled}
        onServicesChanged={reloadServices}
        onBookingDisabled={() => {
          setSwitchedOff(true);
          reloadBusiness();
        }}
        onClose={onClose}
      />
    );
  }

  let body: ReactNode;
  if (engine.mode === 'unconfigured') {
    body = (
      <Notice title="Online booking is not available yet">
        <p>We're getting online booking ready. In the meantime, please call or visit the salon to make an appointment.</p>
      </Notice>
    );
  } else if (bookingOff && business.state === 'ready') {
    const { contact } = business.data;
    const reachable = Boolean(contact.phone || contact.email);
    body = (
      <Notice title={reachable ? 'Book by phone or email for now' : "Online booking isn't open right now"} titleRef={offTitleRef}>
        <p>
          {switchedOff
            ? 'Online booking was paused a moment ago, so your appointment was not booked. '
            : "Online booking isn't open at the moment. "}
          {reachable ? "Call or email the salon and we'll find you a time." : "Please visit the salon and we'll find you a time."}
        </p>
        <ContactLinks contact={contact} />
        {/* Following the link changes the address, which closes the view (App). */}
        <a className="text-link text-link--quiet" href="#visit">
          <Icon icon={MapPin} size={16} />
          Opening hours and directions
        </a>
      </Notice>
    );
  } else if (business.state === 'error' || services.state === 'error') {
    const error = business.state === 'error' ? business.error : services.state === 'error' ? services.error : null;
    const copy = readErrorCopy(error!, 'The appointment book');
    const retry = business.state === 'error' ? reloadBusiness : reloadServices;
    body = (
      <Notice
        tone={copy.retry ? 'error' : 'info'}
        title={copy.title}
        actions={
          copy.retry ? (
            <button type="button" className="btn btn--quiet btn--small" onClick={retry}>
              <Icon icon={RefreshCw} size={16} />
              Try again
            </button>
          ) : null
        }
      >
        <p>{copy.body}</p>
        {copy.contact && business.state === 'ready' ? <ContactLinks contact={business.data.contact} /> : null}
      </Notice>
    );
  } else {
    body = (
      <p className="loading-line" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Opening the appointment book…
      </p>
    );
  }

  return (
    <div className="flow flow--message">
      <header className="bv-head">
        <div className="bv-head__bar">
          <div className="bv-head__start">
            <span className="bv-head__brand">
              <Wordmark />
            </span>
          </div>
          <button type="button" className="bv-icon bv-head__close" onClick={onClose}>
            <Icon icon={X} size={22} />
            <span className="bv-head__close-label">Close</span>
            <span className="visually-hidden"> the booking</span>
          </button>
        </div>
      </header>
      <div className="flow__body flow__body--message">
        <h2 className="display step-head__title" tabIndex={-1} data-view-title="">
          Book an <em>appointment</em>
        </h2>
        {body}
      </div>
    </div>
  );
}
