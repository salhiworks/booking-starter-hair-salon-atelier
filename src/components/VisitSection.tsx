import { Mail, MapPin, Phone, RefreshCw } from 'lucide-react';
import { isDifferentTimeZone, todayInTimeZone, weekdayOf } from '@profitstudio/booking-engine';
import { plateLabel, useContent } from '../lib/content';
import { WEEKDAYS, formatInterval, hoursByWeekday, mapsHref, telHref, timeZoneLabel, weekdayName } from '../lib/format';
import { readErrorCopy } from '../lib/messages';
import { useSectionNumber } from '../lib/sections';
import { useSiteData } from '../lib/siteData';
import { useTodayStatus } from '../lib/today';
import { Icon } from './Icon';
import { Notice } from './Notice';
import { PhotoFrame } from './PhotoFrame';
import { StatusLine } from './StatusLine';

/** Opening hours and contact details — all from engine.getBusiness(). */
export function VisitSection() {
  const { values } = useContent();
  const photo = values['visit.photo'];
  const number = useSectionNumber('visit');
  const { business, reloadBusiness } = useSiteData();
  const status = useTodayStatus();

  let body;
  if (business.state === 'loading') {
    body = (
      <p className="loading-line" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Loading opening hours…
      </p>
    );
  } else if (business.state === 'error') {
    const copy = readErrorCopy(business.error, 'Our opening hours and contact details', 'info');
    body = (
      <Notice
        tone={copy.retry ? 'error' : 'info'}
        title={copy.title}
        actions={
          copy.retry ? (
            <button type="button" className="btn btn--quiet btn--small" onClick={reloadBusiness}>
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
    const { timezone, locale, openingHours, contact } = business.data;
    const byDay = hoursByWeekday(openingHours);
    const todayWeekday = weekdayOf(todayInTimeZone(timezone));
    const [street, ...city] = (contact.address ?? '').split(/,\s*/);
    body = (
      <>
        {contact.address ? (
          <address className="visit__addr">
            {street}
            {city.length ? (
              <>
                <br />
                {city.join(', ')}
              </>
            ) : null}
          </address>
        ) : null}
        {status ? <StatusLine status={status} /> : null}
        <dl className="hours">
          {WEEKDAYS.map((day) => {
            const intervals = byDay.get(day) ?? [];
            const isToday = day === todayWeekday;
            return (
              <div className={`hours__row${isToday ? ' is-today' : ''}${intervals.length ? '' : ' is-closed'}`} key={day}>
                <dt>
                  {weekdayName(day, locale)}
                  {isToday ? <span className="hours__today">Today</span> : null}
                </dt>
                <dd className="tabular">
                  {intervals.length ? intervals.map((i) => formatInterval(i, locale, true)).join(', ') : 'Closed'}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="visit__fine">
          {isDifferentTimeZone(timezone) ? `Hours are in ${timeZoneLabel(timezone, locale)}. ` : ''}
          These are the regular hours; closures show in today's status and when you book online.
        </p>
        <ul className="visit__contact">
          {contact.phone ? (
            <li>
              <a href={telHref(contact.phone)}>
                <Icon icon={Phone} size={16} />
                {contact.phone}
              </a>
            </li>
          ) : null}
          {contact.email ? (
            <li>
              <a href={`mailto:${contact.email}`}>
                <Icon icon={Mail} size={16} />
                {contact.email}
              </a>
            </li>
          ) : null}
          {contact.address ? (
            <li>
              <a href={mapsHref(contact.address)}>
                <Icon icon={MapPin} size={16} />
                Get directions
              </a>
            </li>
          ) : null}
        </ul>
      </>
    );
  }

  return (
    <section id="visit" className="section visit" aria-labelledby="visit-title">
      <div className={photo ? 'wrap visit__grid' : 'wrap visit__grid visit__grid--text'}>
        {photo ? (
          <PhotoFrame
            className="visit__plate plate--hover"
            image={photo}
            plate={plateLabel(values, 'visit.photo')}
            sizes="(min-width: 60em) 55vw, 100vw"
          />
        ) : null}
        <div className="visit__info">
          <p className="sec-label">
            <span className="sec-no">{number}</span>
            <span className="kicker">Visit</span>
          </p>
          <h2 id="visit-title" className="display sec-title">
            Come by
          </h2>
          {body}
        </div>
      </div>
    </section>
  );
}
