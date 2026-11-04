import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BookingIntent } from './booking/BookingFlow';
import { BookingSection } from './booking/BookingSection';
import { BookingView } from './booking/BookingView';
import { FaqSection } from './components/FaqSection';
import { Hero } from './components/Hero';
import { PreviewBanner } from './components/PreviewBanner';
import { ReviewsSection } from './components/ReviewsSection';
import { ServicesSection } from './components/ServicesSection';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { StudioSection } from './components/StudioSection';
import { TeamSection } from './components/TeamSection';
import { VisitSection } from './components/VisitSection';
import { BOOK_HASH, BookingContext, type BookingLauncher } from './lib/booking';
import { useContent } from './lib/content';
import { engine } from './lib/engine';
import { SiteContentProvider } from './lib/SiteContentProvider';
import { SiteDataProvider } from './lib/SiteDataProvider';
import { useSiteData } from './lib/siteData';
import { SectionsContext, type SectionId } from './lib/sections';

/** One page: sections, plus the booking view over it at #book. No path routes. */
export function App() {
  return (
    <SiteDataProvider>
      <SiteContentProvider>
        <Page />
      </SiteContentProvider>
    </SiteDataProvider>
  );
}

const isBookingEntry = () => Boolean((history.state as { booking?: boolean } | null)?.booking);
const withoutHash = () => `${location.pathname}${location.search}`;

function Page() {
  const { business } = useSiteData();
  const { values } = useContent();
  // Arriving at /#book opens the view straight away.
  const [open, setOpen] = useState(() => location.hash === BOOK_HASH);
  const [intent, setIntent] = useState<BookingIntent | null>(null);

  // Online booking is known to be off (or there is no backend): "Book" leads to
  // the contact details in the #book section instead of an empty view.
  const bookingOff =
    engine.mode === 'unconfigured' || (business.state === 'ready' && !business.data.policies.onlineBookingEnabled);

  const showView = useCallback(() => {
    // One history entry for the view, so Back (or a phone's back gesture) closes it.
    if (!isBookingEntry()) history.pushState({ ...(history.state as object | null), booking: true }, '', BOOK_HASH);
    setOpen(true);
  }, []);

  const launcher = useMemo<BookingLauncher>(
    () => ({
      open: (serviceId) => {
        if (bookingOff) {
          const section = document.getElementById('book');
          section?.scrollIntoView({ block: 'start' });
          section?.querySelector<HTMLElement>('[data-booking-off]')?.focus({ preventScroll: true });
          return;
        }
        if (serviceId) setIntent({ serviceId, nonce: Date.now() });
        showView();
      },
    }),
    [bookingOff, showView],
  );

  const close = useCallback(() => {
    if (isBookingEntry()) history.back();
    else {
      history.replaceState(history.state, '', withoutHash());
      setOpen(false);
    }
  }, []);

  // Back / forward through the view's history entry; #book typed or linked.
  useEffect(() => {
    const sync = () => setOpen(isBookingEntry() || location.hash === BOOK_HASH);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // …and gets its own history entry, so Back returns to the page, not away from the site.
  useEffect(() => {
    if (location.hash !== BOOK_HASH || isBookingEntry()) return;
    history.replaceState(history.state, '', withoutHash());
    history.pushState({ booking: true }, '', BOOK_HASH);
  }, []);

  const clearIntent = useCallback(() => setIntent(null), []);

  // Section numbers (I–VI) follow the sections actually on the page.
  const sections = useMemo<SectionId[]>(() => {
    const list: SectionId[] = ['services', 'studio'];
    if (values['team.members'].length) list.push('team');
    if (values['reviews.items'].length) list.push('kind-words');
    if (values['faq.items'].length) list.push('questions');
    list.push('visit');
    return list;
  }, [values]);

  return (
    <BookingContext value={launcher}>
      <SectionsContext value={sections}>
        <div className="skip-links">
          <a className="skip-link" href="#main">
            Skip to content
          </a>
        </div>
        <PreviewBanner />
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          <Hero />
          <ServicesSection />
          <StudioSection />
          <TeamSection />
          <ReviewsSection />
          <FaqSection />
          <VisitSection />
          <BookingSection />
        </main>
        <SiteFooter />
        <BookingView open={open} onClose={close} intent={intent} onIntentHandled={clearIntent} />
      </SectionsContext>
    </BookingContext>
  );
}
