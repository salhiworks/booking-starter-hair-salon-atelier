import type { ReactNode, Ref, RefObject } from 'react';
import { ArrowLeft, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import type { Business, EngineError } from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { ContactLinks, Notice } from '../components/Notice';
import { bookingErrorCopy, type FieldKey } from '../lib/messages';
import { NOTES_MAX, describedBy, type DetailsValues, type FieldErrors } from './details';
import { Field, StepHeading } from './parts';

/** Step 3: who is coming. Checked when a field is left, again on Continue, then by the engine. */
export function DetailsStep({
  business,
  values,
  errors,
  submitting,
  submitError,
  headingRef,
  notice,
  slip,
  nameRef,
  emailRef,
  phoneRef,
  notesRef,
  submitRef,
  onChange,
  onBlurField,
  onSubmit,
  onBack,
}: {
  business: Business;
  values: DetailsValues;
  errors: FieldErrors;
  submitting: boolean;
  submitError: EngineError | null;
  headingRef: Ref<HTMLHeadingElement>;
  notice: ReactNode;
  slip: ReactNode;
  nameRef: RefObject<HTMLInputElement | null>;
  emailRef: RefObject<HTMLInputElement | null>;
  phoneRef: RefObject<HTMLInputElement | null>;
  notesRef: RefObject<HTMLTextAreaElement | null>;
  submitRef: RefObject<HTMLButtonElement | null>;
  onChange: (key: FieldKey, value: string) => void;
  onBlurField: (key: FieldKey) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const { requirePhone } = business.policies;
  const copy = submitError ? bookingErrorCopy(submitError) : null;

  return (
    <div className="step step--details">
      <StepHeading ref={headingRef} step="details" ending="coming in?">
        Who's
      </StepHeading>
      <div className="bk-layout bk-layout--form">
        {slip}
        <div className="bk-card">
          {notice}
          <form
            className="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <p className="form__intro">All fields are needed unless marked optional.</p>
            <div className="form__grid">
              <Field id="bk-name" label="Full name" error={errors.name} className="field--full">
                <input
                  ref={nameRef}
                  id="bk-name"
                  name="name"
                  type="text"
                  className="input"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  onBlur={() => onBlurField('name')}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={describedBy('bk-name', false, errors.name)}
                />
              </Field>

              <Field id="bk-email" label="Email" hint="Your 6-digit code goes here." error={errors.email}>
                <input
                  ref={emailRef}
                  id="bk-email"
                  name="email"
                  type="email"
                  className="input"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  value={values.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  onBlur={() => onBlurField('email')}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={describedBy('bk-email', !errors.email, errors.email)}
                />
              </Field>

              <Field
                id="bk-phone"
                label="Phone"
                optional={!requirePhone}
                hint="Only used about this appointment."
                error={errors.phone}
              >
                <input
                  ref={phoneRef}
                  id="bk-phone"
                  name="phone"
                  type="tel"
                  className="input"
                  inputMode="tel"
                  autoComplete="tel"
                  required={requirePhone}
                  value={values.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  onBlur={() => onBlurField('phone')}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={describedBy('bk-phone', !errors.phone, errors.phone)}
                />
              </Field>

              <Field
                id="bk-notes"
                label="Note for the salon"
                optional
                hint="A stylist you'd like, a photo you'll bring, anything we should know."
                error={errors.notes}
                className="field--full"
              >
                <textarea
                  ref={notesRef}
                  id="bk-notes"
                  name="notes"
                  className="input input--area"
                  rows={3}
                  maxLength={NOTES_MAX}
                  value={values.notes}
                  onChange={(e) => onChange('notes', e.target.value)}
                  onBlur={() => onBlurField('notes')}
                  aria-invalid={errors.notes ? true : undefined}
                  aria-describedby={describedBy('bk-notes', !errors.notes, errors.notes)}
                />
                {values.notes.length > NOTES_MAX * 0.8 ? (
                  <p className="field__count" aria-live="polite">
                    {values.notes.length} / {NOTES_MAX}
                  </p>
                ) : null}
              </Field>
            </div>

            <div className="form__alert" role="alert">
              {copy && submitError ? (
                <Notice
                  tone={submitError.code === 'PREVIEW_MODE' ? 'preview' : 'error'}
                  title={copy.title}
                  actions={
                    copy.retry ? (
                      <button type="button" className="btn btn--quiet btn--small" onClick={onSubmit} disabled={submitting}>
                        <Icon icon={RefreshCw} size={16} />
                        Try again
                      </button>
                    ) : null
                  }
                >
                  <p>{copy.body}</p>
                  {copy.contact ? <ContactLinks contact={business.contact} /> : null}
                </Notice>
              ) : null}
            </div>

            <div className="form-foot">
              <button type="button" className="text-link text-link--quiet text-link--target form-foot__back" onClick={onBack}>
                <Icon icon={ArrowLeft} size={16} />
                Back<span className="visually-hidden"> to the date and time</span>
              </button>
              <p className="form-foot__next">
                <Icon icon={Mail} size={16} />
                {__BOOKING_DEMO__ ? 'Next, enter any 6-digit code — this demo sends no email.' : "Next, we'll email you a 6-digit code."}
              </p>
              {/* Nothing is booked yet: the next step asks for the emailed code. */}
              <button ref={submitRef} type="submit" className="btn btn--ink form-foot__go" disabled={submitting} aria-busy={submitting || undefined}>
                {submitting ? 'Sending your code…' : 'Continue'}
                {submitting ? null : <Icon icon={ArrowRight} size={18} className="icon--forward" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
