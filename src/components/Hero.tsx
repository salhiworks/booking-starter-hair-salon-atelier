import { ArrowDown, ArrowRight } from 'lucide-react';
import { plateLabel, useContent } from '../lib/content';
import { mapsHref, telHref } from '../lib/format';
import { useSiteData } from '../lib/siteData';
import { useTodayStatus } from '../lib/today';
import { Icon } from './Icon';
import { PhotoFrame } from './PhotoFrame';
import { StatusLine } from './StatusLine';
import { BookLink } from './SiteHeader';

/** Keeps the last two words together ("week six."), as a typesetter would. */
const keepLastTogether = (text: string) => text.replace(/ (\S+)$/, ' $1');

/**
 * The headline steps down as the owner's text grows, so any title up to the
 * field limits sets in a few balanced lines and the Book action stays in the
 * first screen.
 */
function titleSize(length: number): 'xl' | 'l' | 'm' | 's' {
  if (length <= 40) return 'xl';
  if (length <= 58) return 'l';
  if (length <= 80) return 'm';
  return 's';
}

/** "2210 SE Division St, Portland, OR 97202" → street on one line, city on the next. */
function AddressLines({ address }: { address: string }) {
  const [street, ...rest] = address.split(/,\s*/);
  return (
    <>
      {street}
      {rest.length ? (
        <>
          <br />
          {rest.join(', ')}
        </>
      ) : null}
    </>
  );
}

/** Today · Find us · Call — from the engine (today's real hours, address, phone). */
function HeroFacts() {
  const { business } = useSiteData();
  const status = useTodayStatus();
  if (business.state !== 'ready') return <div className="hero__facts hero__facts--empty" aria-hidden="true" />;
  const { contact } = business.data;
  return (
    <dl className="hero__facts">
      {status ? (
        <div>
          <dt>Today</dt>
          <dd>
            <StatusLine status={status} as="span" />
          </dd>
        </div>
      ) : null}
      {contact.address ? (
        <div>
          <dt>Find us</dt>
          <dd>
            <a href={mapsHref(contact.address)}>
              <AddressLines address={contact.address} />
            </a>
          </dd>
        </div>
      ) : null}
      {contact.phone ? (
        <div>
          <dt>Call</dt>
          <dd>
            <a href={telHref(contact.phone)}>{contact.phone}</a>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** A spread: the photo plate on the left page, the type on the right (stacked on phones). */
export function Hero() {
  const { values } = useContent();
  const title = values['hero.title'];
  const ending = values['hero.titleEnding'];
  const photo = values['hero.photo'];
  const size = titleSize(title.length + ending.length);
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <PhotoFrame
        className={photo ? 'hero__plate' : 'hero__plate hero__plate--type'}
        image={photo}
        plate={plateLabel(values, 'hero.photo')}
        // The plate is 42% of the page beside the type, the full width when stacked.
        sizes="(min-width: 60em) 42vw, 100vw"
        priority
        fallback="&"
      />
      <div className="hero__page">
        <div className="hero__copy">
          {values['hero.eyebrow'] ? <p className="kicker hero__kicker">{values['hero.eyebrow']}</p> : null}
          <h1 id="hero-title" className={`display hero__title hero__title--${size}`}>
            {title}
            {ending ? (
              <>
                {' '}
                <em>{keepLastTogether(ending)}</em>
              </>
            ) : null}
          </h1>
          {values['hero.lede'] ? <p className="hero__lede">{values['hero.lede']}</p> : null}
          <div className="hero__actions">
            <BookLink className="btn btn--ink hero__book">
              {values['hero.cta']}
              <Icon icon={ArrowRight} size={18} className="icon--forward" />
            </BookLink>
            <a className="text-link" href="#services">
              {values['hero.secondary']}
              <Icon icon={ArrowDown} size={16} />
            </a>
          </div>
        </div>
        <HeroFacts />
      </div>
    </section>
  );
}
