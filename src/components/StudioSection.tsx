import { plateLabel, useContent } from '../lib/content';
import { useSectionNumber } from '../lib/sections';
import { PhotoFrame } from './PhotoFrame';

/** The blush band: the salon, its photos and how a visit goes, step by step. Words and photos: dashboard → Website. */
export function StudioSection() {
  const { values } = useContent();
  const number = useSectionNumber('studio');
  const steps = values['studio.steps'];
  const photo = values['studio.photo'];
  const detail = values['studio.detailPhoto'];
  const quote = values['studio.quote'].replace(/^[\s“”"]+|[\s“”"]+$/g, '');
  return (
    <section id="studio" className="section studio" aria-labelledby="studio-title">
      <div className="wrap">
        <div className={photo ? 'studio__top' : 'studio__top studio__top--text'}>
          <div className="studio__text">
            <p className="sec-label">
              <span className="sec-no">{number}</span>
              {values['studio.eyebrow'] ? <span className="kicker">{values['studio.eyebrow']}</span> : null}
            </p>
            <h2 id="studio-title" className="display sec-title">
              {values['studio.title']}
            </h2>
            {values['studio.intro'] ? <p className="sec-intro studio__intro">{values['studio.intro']}</p> : null}
          </div>
          {photo ? (
            <PhotoFrame
              className="studio__wide plate--hover"
              image={photo}
              plate={plateLabel(values, 'studio.photo')}
              sizes="(min-width: 60em) 54vw, 100vw"
            />
          ) : null}
        </div>

        <div className={detail ? 'studio__mid' : 'studio__mid studio__mid--text'}>
          {detail ? (
            <PhotoFrame
              className="studio__detail plate--arch plate--hover"
              image={detail}
              plate={plateLabel(values, 'studio.detailPhoto')}
              sizes="(min-width: 60em) 30vw, (min-width: 40em) 50vw, 80vw"
            />
          ) : null}
          <div className="studio__right">
            {quote ? (
              <figure className="pull">
                <blockquote>
                  <p>{quote}</p>
                </blockquote>
                {values['studio.quoteBy'] ? (
                  <figcaption>
                    <cite>{values['studio.quoteBy']}</cite>
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
          </div>
        </div>

        {steps.length > 0 ? (
          <div className="steps">
            <h3 className="steps__title kicker">{values['studio.stepsTitle']}</h3>
            <ol className={`steps__list steps__list--${Math.min(steps.length, 4)}`}>
              {steps.map((step, index) => (
                <li className="steps__item" key={`${index}-${step.title}`}>
                  <span className="steps__n" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h4 className="steps__name">{step.title}</h4>
                  {step.body ? <p className="steps__body">{step.body}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
