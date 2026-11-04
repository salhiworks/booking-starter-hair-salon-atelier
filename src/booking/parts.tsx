import type { ReactNode, Ref } from 'react';
import { ArrowLeft, Check, CircleAlert, X } from 'lucide-react';
import type { Business } from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { Wordmark } from '../components/SiteHeader';
import { timeParts } from '../lib/format';
import { STEPS, stepIndex, stepKicker, type Step } from './flowState';

/**
 * A step's title. It receives focus when the step opens (INTEGRATION.md §8);
 * `ending` is set in copper italic, like the site's headlines.
 */
export function StepHeading({
  ref,
  step,
  children,
  ending,
  aside,
}: {
  ref?: Ref<HTMLHeadingElement>;
  step: Step;
  children: ReactNode;
  ending?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="step-head">
      <div className="step-head__main">
        <p className="step-head__kicker kicker">
          {stepKicker(step)} · {STEPS[stepIndex(step)]!.label}
        </p>
        <h2 ref={ref} tabIndex={-1} className="display step-head__title" data-step-heading="">
          {children}
          {ending ? (
            <>
              {' '}
              <em>{ending}</em>
            </>
          ) : null}
        </h2>
      </div>
      {aside ? <div className="step-head__aside">{aside}</div> : null}
    </div>
  );
}

/** A time as the server's instant, in the business zone: "1:30" with a smaller "PM". */
export function TimeText({ instant, business }: { instant: string; business: Business }) {
  const { clock, period } = timeParts(instant, business.timezone, business.locale);
  return (
    <span className="time tabular">
      {clock}
      {period ? <span className="ampm">{period}</span> : null}
    </span>
  );
}

/**
 * A labelled form field: label, the control, then its hint or error.
 * `announce` makes the error a live alert — for a field the visitor is still
 * typing in when the answer arrives (the code); `errorKey` re-announces a
 * repeated message.
 */
export function Field({
  id,
  label,
  optional,
  hint,
  error,
  errorKey,
  announce,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  errorKey?: number;
  announce?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={['field', error ? 'field--error' : null, className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional ? <span className="field__optional">optional</span> : null}
      </label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`} role={announce ? 'alert' : undefined} key={errorKey}>
          <Icon icon={CircleAlert} size={16} />
          <span>{error}</span>
        </p>
      ) : null}
      {hint && !error ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The booking view's header: the salon, the route through the steps
 * (desktop) or a five-segment bar (phones), a way back and Close.
 */
export function BookingHeader({
  business,
  step,
  onBack,
  onClose,
}: {
  business: Business;
  step: Step;
  onBack: (() => void) | null;
  onClose: () => void;
}) {
  const current = stepIndex(step);
  const next = STEPS[current + 1];
  return (
    <header className="bv-head">
      <div className="bv-head__bar">
        <div className="bv-head__start">
          {onBack ? (
            <button type="button" className="bv-icon bv-head__back" onClick={onBack}>
              <Icon icon={ArrowLeft} size={22} />
              <span className="visually-hidden">Back to {STEPS[current - 1]!.label.toLowerCase()}</span>
            </button>
          ) : null}
          <span className="bv-head__brand">
            <Wordmark />
            <span className="visually-hidden"> — {business.name}, booking</span>
          </span>
        </div>
        <ol className="route" aria-label="Steps to book an appointment">
          {STEPS.map((s, index) => {
            const state = index < current ? 'is-done' : index === current ? 'is-current' : '';
            return (
              <li key={s.id} className={`route__step ${state}`.trim()} aria-current={index === current ? 'step' : undefined}>
                <span className="route__mark" aria-hidden="true">
                  {index < current ? <Icon icon={Check} size={13} weight={1.8} /> : index + 1}
                </span>
                <span className="route__label">{s.label}</span>
                {index < current ? <span className="visually-hidden"> (done)</span> : null}
              </li>
            );
          })}
        </ol>
        <button type="button" className="bv-icon bv-head__close" onClick={onClose}>
          <Icon icon={X} size={22} />
          <span className="bv-head__close-label">Close</span>
          <span className="visually-hidden"> the booking</span>
        </button>
      </div>
      <div className="bv-progress">
        <div className="bv-progress__bars" aria-hidden="true">
          {STEPS.map((s, index) => (
            <i key={s.id} className={index < current ? 'is-done' : index === current ? 'is-current' : ''} />
          ))}
        </div>
        <p>
          {stepKicker(step)} · <b>{STEPS[current]!.label}</b>
          {next && step !== 'verify' ? <span className="bv-progress__next"> · Next: {next.label.toLowerCase()}</span> : null}
        </p>
      </div>
    </header>
  );
}
