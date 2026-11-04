import { useContent } from '../lib/content';
import { useSectionNumber } from '../lib/sections';

/** The owner's quote without quotation marks of its own: the design sets them. */
const bare = (quote: string) => quote.replace(/^[\s“”"‘’']+|[\s“”"‘’']+$/g, '');

/**
 * Kind words from clients. While the owner has not marked them as real
 * (dashboard → Website → Kind words), every quote is tagged "Example" and the
 * section says so — never presented as real reviews.
 */
export function ReviewsSection() {
  const { values } = useContent();
  const number = useSectionNumber('kind-words');
  const items = values['reviews.items'];
  const real = values['reviews.real'];
  if (items.length === 0) return null;
  return (
    <section id="kind-words" className="section words" aria-labelledby="words-title">
      <div className="wrap">
        <header className="words__head">
          <div>
            <p className="sec-label">
              <span className="sec-no">{number}</span>
              <span className="kicker">From clients</span>
            </p>
            <h2 id="words-title" className="display sec-title">
              {values['reviews.title']}
            </h2>
          </div>
          {real ? null : <p className="words__note">These are examples, shown until the salon adds words from its own clients.</p>}
        </header>
        <ul className={`words__grid words__grid--${Math.min(items.length, 3)}`}>
          {items.map((review, index) => {
            const quote = bare(review.quote);
            return (
              <li key={`${index}-${quote.slice(0, 24)}`}>
                <figure className={quote.length > 140 ? 'word word--long' : 'word'}>
                  <blockquote>
                    <p>{quote}</p>
                  </blockquote>
                  {real && !review.detail ? null : (
                    <figcaption className="word__by">
                      {real ? null : <span className="tag">Example</span>}
                      {review.detail}
                    </figcaption>
                  )}
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
