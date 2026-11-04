import { useEffect, useRef } from 'react';
import { ArrowRight, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Icon } from '../components/Icon';
import { ContactLinks, Notice } from '../components/Notice';
import { BookLink } from '../components/SiteHeader';
import { engine } from '../lib/engine';
import { readErrorCopy } from '../lib/messages';
import { useSiteData } from '../lib/siteData';
import { nextFreeTime } from '../lib/today';

/**
 * The booking call to action at the foot of the page (#book). The booking
 * itself opens as a full-screen view; while online booking is off this is
 * where every "Book" action leads: the contact details instead of a form.
 */
export function BookingSection() {
  const { business, services, outlook, wantOutlook, reloadBusiness, reloadServices } = useSiteData();
  const ref = useRef<HTMLElement>(null);
  // The next free time is read (getAvailability) only when this section comes near the screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      wantOutlook();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        wantOutlook();
        observer.disconnect();
      },
      { rootMargin: '0px 0px 1200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [wantOutlook]);
  const bookingOff = business.state === 'ready' && !business.data.policies.onlineBookingEnabled;
  const firstService = services.state === 'ready' ? services.data[0] : undefined;
  const next = business.state === 'ready' && !bookingOff ? nextFreeTime(business.data, outlook) : null;

  let body;
  if (engine.mode === 'unconfigured') {
    // Production build without a backend (INTEGRATION.md §5, "Modes").
    body = (
      <Notice title="Online booking is not available yet" className="cta__notice">
        <p>We're getting online booking ready. In the meantime, please call or visit the salon to make an appointment.</p>
      </Notice>
    );
  } else if (bookingOff) {
    // The owner has not switched online booking on yet, or has paused it (INTEGRATION.md §6–§7).
    const { contact } = business.data;
    const reachable = Boolean(contact.phone || contact.email);
    body = (
      <div className="cta__off">
        <p className="cta__off-title" tabIndex={-1} data-booking-off="">
          {reachable ? 'Book by phone or email for now' : "Online booking isn't open right now"}
        </p>
        <p className="cta__lede">
          Online booking isn't open at the moment.{' '}
          {reachable ? "Call or email the salon and we'll find you a time." : "Please visit the salon and we'll find you a time."}
        </p>
        <ContactLinks contact={contact} />
        <a className="text-link text-link--quiet" href="#visit">
          <Icon icon={MapPin} size={16} />
          Opening hours and directions
        </a>
      </div>
    );
  } else if (business.state === 'error' || services.state === 'error') {
    const error = business.state === 'error' ? business.error : services.state === 'error' ? services.error : null;
    const copy = readErrorCopy(error!, 'The appointment book');
    const retry = business.state === 'error' ? reloadBusiness : reloadServices;
    body = (
      <Notice
        className="cta__notice"
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
      </Notice>
    );
  } else {
    body = (
      <>
        <p className="cta__lede">Choose a service, a day and a time. We hold your time while you confirm your email.</p>
        <div className="cta__row">
          <BookLink className="btn btn--ink">
            Book an appointment
            <Icon icon={ArrowRight} size={18} className="icon--forward" />
          </BookLink>
        </div>
        {next && firstService ? (
          <p className="cta__next">
            <Icon icon={Clock} size={16} />
            <span>
              Next free time for {firstService.name}: <b>{next.label}</b>
            </span>
          </p>
        ) : null}
      </>
    );
  }

  return (
    <section id="book" className="section cta" aria-labelledby="book-title" ref={ref}>
      <div className="wrap cta__inner">
        <p className="kicker">Book online</p>
        <h2 id="book-title" className="display cta__title">
          Start with a <em>conversation.</em>
        </h2>
        {body}
      </div>
    </section>
  );
}
