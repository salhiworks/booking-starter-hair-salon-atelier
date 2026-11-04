import { Minus, Plus } from 'lucide-react';
import { useContent } from '../lib/content';
import { telHref } from '../lib/format';
import { useSectionNumber } from '../lib/sections';
import { useSiteData } from '../lib/siteData';
import { Icon } from './Icon';

/** Questions the owner answers in the dashboard (Website → Questions). Hidden when there are none. */
export function FaqSection() {
  const { values } = useContent();
  const { business } = useSiteData();
  const number = useSectionNumber('questions');
  const items = values['faq.items'];
  if (items.length === 0) return null;
  const contact = business.state === 'ready' ? business.data.contact : null;
  return (
    <section id="questions" className="section faq" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <header className="faq__head">
          <p className="sec-label">
            <span className="sec-no">{number}</span>
            <span className="kicker">Questions</span>
          </p>
          <h2 id="faq-title" className="display sec-title">
            {values['faq.title']}
          </h2>
          {contact?.phone || contact?.email ? (
            <p className="faq__aside">
              Something else? {contact.phone ? 'Call us on ' : 'Email us at '}
              <a className="text-link" href={contact.phone ? telHref(contact.phone) : `mailto:${contact.email}`}>
                {contact.phone ?? contact.email}
              </a>{' '}
              — we'd rather answer it before your visit.
            </p>
          ) : null}
        </header>
        <div className="faq__list">
          {items.map((item, index) => (
            <details className="faq__item" key={`${index}-${item.question}`} open={index === 0 ? true : undefined}>
              <summary>
                <span className="faq__q">{item.question}</span>
                <Icon icon={Plus} size={20} className="faq__plus" />
                <Icon icon={Minus} size={20} className="faq__minus" />
              </summary>
              <p className="faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
