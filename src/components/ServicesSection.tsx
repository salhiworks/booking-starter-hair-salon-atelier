import { useRef, useState } from 'react';
import { ArrowRight, ImageIcon, RefreshCw } from 'lucide-react';
import type { Service, ServiceImage } from '@profitstudio/booking-engine';
import { useBooking } from '../lib/booking';
import { engine } from '../lib/engine';
import { formatDuration, formatPrice, priceParts } from '../lib/format';
import { readErrorCopy } from '../lib/messages';
import { usePlateReveal } from '../lib/plateReveal';
import { useSectionNumber } from '../lib/sections';
import { groupServices, type ServiceGroup } from '../lib/serviceGroups';
import { useSiteData } from '../lib/siteData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { Icon } from './Icon';
import { ContactLinks, Notice } from './Notice';
import { BookLink } from './SiteHeader';

/**
 * Where the service photos go: beside the menu, in one plate that follows the
 * pointer and the keyboard (wide screens with a mouse or trackpad), or as a
 * row of captioned plates above the menu (phones, tablets, touch screens).
 */
const PLATE_QUERY = '(min-width: 960px) and (hover: hover)';

/** The owner's optional photo of a service (dashboard → Services); most services may have none. */
const photoOf = (service: Service): ServiceImage | null => (service.image?.url ? service.image : null);

/** "60 min · $65", "90 min · from $85" — the plates' captions. */
const meta = (service: Service, locale?: string) => `${formatDuration(service.durationMinutes)} · ${formatPrice(service, locale)}`;

/** Two balanced columns, groups kept whole and in order (Cuts, Styling… | Color). */
function columns(groups: ServiceGroup[]): ServiceGroup[][] {
  const total = groups.reduce((n, g) => n + g.services.length, 0);
  const left: ServiceGroup[] = [];
  let count = 0;
  let i = 0;
  for (; i < groups.length && (left.length === 0 || count < total / 2); i++) {
    left.push(groups[i]!);
    count += groups[i]!.services.length;
  }
  return [left, groups.slice(i)];
}

function Price({ service, locale }: { service: Service; locale?: string }) {
  const price = priceParts(service, locale);
  if (price.amount === null) return <i className="menu-item__from">on request</i>;
  return (
    <>
      {price.from ? <i className="menu-item__from">from </i> : null}
      {price.amount}
    </>
  );
}

/**
 * Wide screens with a pointer: one plate beside the menu, showing the service
 * the visitor points at or tabs to (the first pictured one until then). The
 * photo on screen stays until the next one has arrived, which then fades in
 * over it — the plate never blanks. Photos already shown stay loaded.
 */
function MenuPlate({ shown, pictured, locale }: { shown: Service; pictured: Service[]; locale?: string }) {
  const ref = useRef<HTMLElement>(null);
  usePlateReveal(ref, true);
  const [asked, setAsked] = useState<string[]>([shown.id]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [layers, setLayers] = useState<{ top: string | null; under: string | null }>({ top: null, under: null });
  if (!asked.includes(shown.id)) setAsked([...asked, shown.id]);
  const shownPhoto = photoOf(shown)!;
  const top = loaded.includes(shownPhoto.url) ? shown.id : layers.top;
  if (top !== layers.top) setLayers({ top, under: layers.top });

  const byId = new Map(pictured.map((s) => [s.id, s]));
  const captioned = byId.get(layers.top ?? '') ?? shown;
  return (
    <figure className="menu-plate" ref={ref}>
      <div className="menu-plate__frame">
        {asked.map((id) => {
          const service = byId.get(id);
          const photo = service ? photoOf(service) : null;
          if (!photo) return null;
          const isTop = id === layers.top;
          return (
            <img
              key={photo.url}
              className={isTop ? 'is-top' : id === layers.under ? 'is-under' : undefined}
              src={photo.url}
              // The owner's description; empty when the photo only illustrates the service named below it.
              alt={isTop ? photo.alt : ''}
              aria-hidden={isTop ? undefined : true}
              width={photo.width ?? undefined}
              height={photo.height ?? undefined}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded((list) => (list.includes(photo.url) ? list : [...list, photo.url]))}
            />
          );
        })}
      </div>
      <figcaption className="caption menu-plate__caption">
        <b>{captioned.name}</b> <span className="menu-plate__meta">{meta(captioned, locale)}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Phones, tablets and touch screens: the pictured services as a row of plates
 * captioned with their names, scrolling sideways. Duration, price and Book
 * live once, in the menu just below — the plates only show the work.
 */
function MenuShots({ pictured }: { pictured: Service[] }) {
  return (
    <ul className="menu-shots" aria-label="Services in pictures">
      {pictured.map((service) => {
        const photo = photoOf(service)!;
        return (
          <li className="menu-shot" key={service.id}>
            <figure>
              <div className="menu-shot__frame">
                <img
                  src={photo.url}
                  alt={photo.alt}
                  width={photo.width ?? undefined}
                  height={photo.height ?? undefined}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="menu-shot__name">{service.name}</figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

/** The typeset menu: every service, price, duration and photo comes from engine.listServices(). */
export function ServicesSection() {
  const { services, business, reloadServices } = useSiteData();
  const booking = useBooking();
  const number = useSectionNumber('services');
  const data = business.state === 'ready' ? business.data : null;
  const bookingOn = engine.mode !== 'unconfigured' && (data?.policies.onlineBookingEnabled ?? true);
  const pointer = useMediaQuery(PLATE_QUERY);
  const [pointed, setPointed] = useState<string | null>(null);

  const groups = services.state === 'ready' ? groupServices(services.data) : [];
  // Menu order (groups, then the owner's order inside each); only services with a photo.
  const pictured = groups.flatMap((g) => g.services).filter((s) => photoOf(s));
  const shown = pictured.find((s) => s.id === pointed) ?? pictured[0] ?? null;
  const plate = pointer && shown ? shown : null;
  const point = (service: Service) => () => {
    if (plate && photoOf(service)) setPointed(service.id);
  };

  let body;
  if (services.state === 'loading') {
    body = (
      <p className="loading-line" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Loading the menu…
      </p>
    );
  } else if (services.state === 'error') {
    const copy = readErrorCopy(services.error, 'Our services and prices', 'info');
    body = (
      <Notice
        tone={copy.retry ? 'error' : 'info'}
        title={copy.title}
        actions={
          copy.retry ? (
            <button type="button" className="btn btn--quiet btn--small" onClick={reloadServices}>
              <Icon icon={RefreshCw} size={16} />
              Try again
            </button>
          ) : null
        }
      >
        <p>{copy.body}</p>
        {copy.contact ? <ContactLinks contact={data?.contact ?? null} /> : null}
      </Notice>
    );
  } else if (services.data.length === 0) {
    body = (
      <Notice title="The menu is being updated">
        <p>Please call or email the salon to ask about services and prices.</p>
        <ContactLinks contact={data?.contact ?? null} />
      </Notice>
    );
  } else {
    body = (
      <div className="menu__cols">
        {columns(groups).map((column, c) => (
          <div className="menu__col" key={c}>
            {column.map((group) => (
              <section className="menu-group" key={group.id} aria-labelledby={`menu-${group.id}`}>
                <h3 className="menu-group__title" id={`menu-${group.id}`}>
                  {group.title}
                  <span>
                    {group.services.every((s) => s.priceFrom)
                      ? 'priced from'
                      : `${group.services.length} ${group.services.length === 1 ? 'service' : 'services'}`}
                  </span>
                </h3>
                <ul className="menu-list">
                  {group.services.map((service) => {
                    // Beside the plate, a pictured service carries a small mark, copper while its photo is shown.
                    const cue = Boolean(plate && photoOf(service));
                    return (
                      <li
                        className={`menu-item${cue && plate?.id === service.id ? ' is-shown' : ''}`}
                        key={service.id}
                        onPointerEnter={point(service)}
                        onFocus={point(service)}
                      >
                        <div className="menu-item__line">
                          <h4 className="menu-item__name">{service.name}</h4>
                          <span className="menu-item__leader" aria-hidden="true">
                            {/* Set at the start of the leader, so it never takes room from the name. */}
                            {cue ? <Icon icon={ImageIcon} size={15} className="menu-item__cue" /> : null}
                          </span>
                          <p className="menu-item__price">
                            <Price service={service} locale={data?.locale} />
                          </p>
                        </div>
                        <div className="menu-item__detail">
                          <p className="menu-item__desc">
                            <span className="menu-item__dur">
                              <span className="visually-hidden">Takes </span>
                              {formatDuration(service.durationMinutes)}
                            </span>
                            {service.description ? <span className="visually-hidden">. </span> : null}
                            {service.description}
                          </p>
                          {bookingOn ? (
                            <button type="button" className="menu-item__book" onClick={() => booking.open(service.id)}>
                              Book<span className="visually-hidden"> {service.name}</span>
                              <Icon icon={ArrowRight} size={14} />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {c === 1 && bookingOn ? (
              <p className="menu__note">
                Booking online holds your time while you confirm your email — it takes a few steps, and nothing is paid
                online.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section id="services" className="section menu" aria-labelledby="services-title">
      <div className="wrap menu__grid">
        <header className={plate ? 'menu__head menu__head--plate' : pictured.length ? 'menu__head menu__head--row' : 'menu__head'}>
          <p className="sec-label">
            <span className="sec-no">{number}</span>
            <span className="kicker">Services &amp; prices</span>
          </p>
          <h2 id="services-title" className="display sec-title">
            The menu
          </h2>
          <p className="sec-intro">
            Every visit starts with a consultation. A “from” price depends on your hair's length and thickness — you'll
            hear the final number before we begin.
          </p>
          <BookLink className="btn btn--line menu__book">
            Book a service
            <Icon icon={ArrowRight} size={18} className="icon--forward" />
          </BookLink>
          {plate ? (
            <MenuPlate shown={plate} pictured={pictured} locale={data?.locale} />
          ) : pictured.length ? (
            <MenuShots pictured={pictured} />
          ) : null}
        </header>
        {body}
      </div>
    </section>
  );
}
