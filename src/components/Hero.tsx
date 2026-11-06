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

/** Find us · Call — from the engine (address, phone); today's status sits on the mirror. */
function HeroFacts() {
  const { business } = useSiteData();
  if (business.state !== 'ready') return <div className="hero__facts hero__facts--empty" aria-hidden="true" />;
  const { contact } = business.data;
  return (
    <dl className="hero__facts">
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

/**
 * The first screen: the words on the porcelain page, the photo in an arched
 * frame like the salon's mirrors (a fine outline arch stands just behind it),
 * and today's status on a small card at the mirror's foot. Phones: the words,
 * Book, Find us · Call, then the mirror.
 */
export function Hero() {
  const { values } = useContent();
  const title = values['hero.title'];
  const ending = values['hero.titleEnding'];
  const photo = values['hero.photo'];
  const size = titleSize(title.length + ending.length);
  const status = useTodayStatus();
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
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
            <a className="text-link hero__prices" href="#services">
              {values['hero.secondary']}
              <Icon icon={ArrowDown} size={16} />
            </a>
          </div>
          <HeroFacts />
        </div>
        <div className="hero__visual">
          <span className="hero__mirror" aria-hidden="true" />
          <PhotoFrame
            className={photo ? 'hero__plate plate--arch' : 'hero__plate plate--arch hero__plate--type'}
            image={photo}
            plate={plateLabel(values, 'hero.photo')}
            // The arch is about 40% of the page beside the words, nearly the full width when stacked.
            sizes="(min-width: 60em) 40vw, 92vw"
            priority
            fallback="&"
          />
          {status ? (
            <p className="hero__today">
              <span className="hero__today-label">Today</span>
              <StatusLine status={status} as="span" />
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
