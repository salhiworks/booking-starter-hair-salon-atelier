import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Menu, Phone, X } from 'lucide-react';
import { useBooking } from '../lib/booking';
import { useContent } from '../lib/content';
import { goToSection, useModalDialog } from '../lib/dialog';
import { telHref } from '../lib/format';
import { SECTION_NAMES, useSectionNumber, useSections, type SectionId } from '../lib/sections';
import { useSiteData } from '../lib/siteData';
import { SITE } from '../site.config';
import { useTodayStatus } from '../lib/today';
import { Icon } from './Icon';
import { StatusLine } from './StatusLine';

/**
 * The owner's logo (dashboard → Website → Brand), else the business name set
 * in the dashboard, typeset with the design's copper italic "&".
 */
export function Wordmark({ className = '' }: { className?: string }) {
  const { values } = useContent();
  const { business } = useSiteData();
  const name = business.state === 'ready' ? business.data.name : SITE.name;
  const logo = values['brand.logo'];
  if (logo) {
    return (
      <img
        className={`wordmark-logo ${className}`.trim()}
        src={logo.src}
        alt={logo.alt || name}
        width={logo.width}
        height={logo.height}
      />
    );
  }
  const [first, ...rest] = name.split(' & ');
  return (
    <span className={`wordmark ${className}`.trim()}>
      {rest.length ? (
        <>
          {first} <em className="wordmark__amp">&amp;</em> {rest.join(' & ')}
        </>
      ) : (
        name
      )}
    </span>
  );
}

const NAV: SectionId[] = ['services', 'studio', 'team', 'visit'];
const NAV_LABELS: Partial<Record<SectionId, string>> = { services: 'Services' };

/** A "Book an appointment" link that opens the booking view (optionally with a service chosen). */
export function BookLink({
  className = 'btn btn--ink',
  serviceId,
  children,
  onBeforeOpen,
}: {
  className?: string;
  serviceId?: string;
  children: ReactNode;
  onBeforeOpen?: () => void;
}) {
  const booking = useBooking();
  return (
    <a
      className={className}
      href="#book"
      onClick={(event) => {
        event.preventDefault();
        onBeforeOpen?.();
        booking.open(serviceId);
      }}
    >
      {children}
    </a>
  );
}

export function SiteHeader() {
  const sections = useSections();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__home" href="#top" aria-label={`${SITE.name} — back to the top`}>
          <Wordmark />
        </a>
        <nav className="site-nav" aria-label="Sections">
          <ul>
            {NAV.filter((id) => sections.includes(id)).map((id) => (
              <li key={id}>
                <a href={`#${id}`}>{NAV_LABELS[id] ?? SECTION_NAMES[id]}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <BookLink className="btn btn--ink btn--small site-header__book">
            <span>
              Book<span className="site-header__book-long"> an appointment</span>
            </span>
            <Icon icon={ArrowRight} size={18} className="icon--forward" />
          </BookLink>
          <button
            type="button"
            className="menu-button"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Icon icon={Menu} size={22} />
            <span className="visually-hidden">Menu</span>
          </button>
        </div>
      </div>
      <SiteMenu open={menuOpen} onClose={closeMenu} />
    </header>
  );
}

/** Phones and small tablets: the sections as a contents page, with today's hours and the Book action. */
function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, open, onClose);
  const sections = useSections();
  const { business } = useSiteData();
  const data = business.state === 'ready' ? business.data : null;
  const status = useTodayStatus();

  return (
    <dialog ref={ref} className="menu-sheet" aria-label="Menu">
      <div className="menu-sheet__top">
        <Wordmark />
        <button type="button" className="menu-sheet__close" onClick={onClose}>
          <Icon icon={X} size={22} />
          <span className="visually-hidden">Close the menu</span>
        </button>
      </div>
      <nav aria-label="Sections">
        <ol className="menu-sheet__list">
          {sections.map((id) => (
            <MenuItem key={id} id={id} onPick={onClose} />
          ))}
        </ol>
      </nav>
      <div className="menu-sheet__foot">
        {status ? <StatusLine status={status} /> : null}
        {data?.contact.address ? <p className="menu-sheet__addr">{data.contact.address}</p> : null}
        {data?.contact.phone ? (
          <a className="menu-sheet__phone" href={telHref(data.contact.phone)}>
            <Icon icon={Phone} size={16} />
            {data.contact.phone}
          </a>
        ) : null}
        <BookLink className="btn btn--ink btn--block" onBeforeOpen={onClose}>
          Book an appointment
          <Icon icon={ArrowRight} size={18} className="icon--forward" />
        </BookLink>
      </div>
    </dialog>
  );
}

function MenuItem({ id, onPick }: { id: SectionId; onPick: () => void }) {
  const number = useSectionNumber(id);
  return (
    <li>
      <a
        href={`#${id}`}
        onClick={(event) => {
          event.preventDefault();
          onPick();
          // After the layer has closed and focus has come back to the page.
          requestAnimationFrame(() => goToSection(id));
        }}
      >
        <span className="menu-sheet__no" aria-hidden="true">
          {number}
        </span>
        {SECTION_NAMES[id]}
      </a>
    </li>
  );
}
