import { useContent } from '../lib/content';
import { compactHours, mapsHref, telHref, timeZoneLabel } from '../lib/format';
import { useSiteData } from '../lib/siteData';
import { SITE } from '../site.config';
import { BookLink, Wordmark } from './SiteHeader';

// Read once when the page loads, not on every render.
const YEAR = new Date().getFullYear();

export function SiteFooter() {
  const { business } = useSiteData();
  const { values } = useContent();
  const data = business.state === 'ready' ? business.data : null;
  const [street, ...city] = (data?.contact.address ?? '').split(/,\s*/);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        <div className="site-footer__brand">
          <Wordmark className="wordmark--footer" />
          <p>{values['hero.eyebrow'] || 'Hair salon'}</p>
        </div>
        {data?.contact.address ? (
          <div className="site-footer__col">
            <h2>Visit</h2>
            <a href={mapsHref(data.contact.address)}>
              {street}
              {city.length ? (
                <>
                  <br />
                  {city.join(', ')}
                </>
              ) : null}
            </a>
          </div>
        ) : null}
        {data?.openingHours.length ? (
          <div className="site-footer__col">
            <h2>Hours</h2>
            {compactHours(data.openingHours, data.locale).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        {data?.contact.phone || data?.contact.email ? (
          <div className="site-footer__col">
            <h2>Contact</h2>
            {data.contact.phone ? <a href={telHref(data.contact.phone)}>{data.contact.phone}</a> : null}
            {data.contact.email ? <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a> : null}
          </div>
        ) : null}
        <nav className="site-footer__col" aria-label="Footer">
          <h2>Explore</h2>
          <a href="#services">Services &amp; prices</a>
          <a href="#studio">The studio</a>
          <BookLink className="site-footer__book">Book an appointment</BookLink>
        </nav>
      </div>
      <div className="wrap site-footer__base">
        <p>
          © {YEAR} {data?.name ?? SITE.name}
          {data ? ` · Times shown in ${timeZoneLabel(data.timezone, data.locale)}` : ''}
        </p>
        <a className="site-footer__staff" href="/admin/">
          Staff login
        </a>
      </div>
    </footer>
  );
}
