import { useEffect, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert, Hourglass, MailQuestionMark, Pencil, RefreshCw } from 'lucide-react';
import {
  formatDate,
  formatTime,
  type Business,
  type EngineErrorCode,
  type PendingVerification,
  type Slot,
} from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { ContactLinks, Notice } from '../components/Notice';
import { codeErrorCopy } from '../lib/messages';
import { describedBy } from './details';
import type { CodeState } from './flowState';
import { StepHeading } from './parts';

/** Digits only, at most `max` of them: "123 456" and "123-456" both become "123456". */
function digitsOnly(text: string, max: number): string {
  return text.replace(/\D/g, '').slice(0, max);
}

function toneFor(code: EngineErrorCode): 'preview' | 'info' | 'error' {
  if (code === 'PREVIEW_MODE') return 'preview';
  if (code === 'CONFLICT' || code === 'RESEND_LIMIT') return 'info';
  return 'error';
}

/** Whole seconds until `target` (epoch ms), re-rendering once a second while there is time left. */
function useSecondsUntil(target: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(() => {
      tick();
      if (Date.now() >= target) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [target]);
  return Math.max(0, Math.ceil((target - now) / 1000));
}

/**
 * Step 4: the 6-digit code emailed by requestBooking(). The time is held while
 * the client types it; verifyBooking() then turns the hold into a request or
 * a booking (INTEGRATION.md §6, §8). In preview nothing is sent or saved.
 *
 * One real input (#bk-code: numeric, one-time-code autofill, paste) drawn as
 * six cells; the cells only show what the input holds.
 */
export function CodeStep({
  business,
  verification,
  date,
  slot,
  code,
  slip,
  headingRef,
  codeRef,
  confirmRef,
  endedRef,
  onCodeChange,
  onVerify,
  onResend,
  onChooseAnotherTime,
  onChangeEmail,
}: {
  business: Business;
  verification: PendingVerification;
  /** The appointment's business-local date. */
  date: string;
  slot: Slot;
  code: CodeState;
  slip: ReactNode;
  headingRef: Ref<HTMLHeadingElement>;
  codeRef: RefObject<HTMLInputElement | null>;
  confirmRef: RefObject<HTMLButtonElement | null>;
  endedRef: Ref<HTMLParagraphElement>;
  onCodeChange: (digits: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onChooseAnotherTime: () => void;
  onChangeEmail: () => void;
}) {
  const { locale, timezone, contact, policies } = business;
  const { codeLength, email, delivery, expiresAt } = verification;
  const preview = delivery === 'preview';
  const until = formatTime(expiresAt, timezone, locale);
  const waitSeconds = useSecondsUntil(code.resendAt);
  const waiting = waitSeconds > 0;
  const { problem } = code;
  const copy = problem ? codeErrorCopy(problem.error, problem.from, until) : null;
  // The engine released the time (too many upcoming appointments): no code can help now.
  const ended = problem?.error.code === 'TOO_MANY_BOOKINGS';
  // RESEND_LIMIT is explained by its own notice below, so the quiet "no more codes" line steps aside.
  const limitNotice = problem?.error.code === 'RESEND_LIMIT';
  const half = Math.ceil(codeLength / 2);

  const problemNotice = (from: 'verify' | 'resend') =>
    copy && problem && problem.from === from ? (
      <Notice
        tone={toneFor(problem.error.code)}
        title={copy.title}
        actions={
          copy.retry ? (
            <button
              type="button"
              className="btn btn--quiet btn--small"
              onClick={from === 'verify' ? onVerify : onResend}
              disabled={code.verifying || code.resending}
            >
              <Icon icon={RefreshCw} size={16} />
              Try again
            </button>
          ) : null
        }
      >
        <p>{copy.body}</p>
        {copy.contact ? <ContactLinks contact={contact} /> : null}
      </Notice>
    ) : null;

  return (
    <div className="step step--verify">
      <StepHeading ref={headingRef} step="verify" ending={preview ? 'code.' : 'email.'}>
        {preview ? 'Enter a' : 'Check your'}
      </StepHeading>
      <div className="bk-layout bk-layout--form">
        {slip}
        <div className="bk-card">
          {preview ? (
            __BOOKING_DEMO__ ? (
              // Live Demo build only: the request is kept, in this browser, for the demo dashboard.
              <Notice tone="preview" title="Demo: no email was sent">
                <p>
                  Type any {codeLength} digits to continue. Your request stays in this browser and appears in the demo
                  dashboard.
                </p>
              </Notice>
            ) : (
              <Notice tone="preview" title="Preview: no email was sent">
                <p>
                  This site is running on sample data. Type any {codeLength} digits to try this step — nothing is saved
                  and the salon is not notified.
                </p>
              </Notice>
            )
          ) : ended ? null : (
            <p className="code-lede">
              We sent a {codeLength}-digit code to <strong>{email}</strong>. It works until {until}.
            </p>
          )}

          {ended && copy ? (
            <Notice tone="error" title={copy.title} titleRef={endedRef}>
              <p>{copy.body}</p>
              <ContactLinks contact={contact} />
            </Notice>
          ) : (
            <form
              className="code-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                onVerify();
              }}
            >
              <div className={`code${code.fieldError ? ' code--error' : ''}`}>
                <label className="field__label" htmlFor="bk-code">
                  {codeLength}-digit code
                </label>
                <div className="code__box">
                  <input
                    ref={codeRef}
                    id="bk-code"
                    name="code"
                    type="text"
                    className="code__input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    value={code.value}
                    // Digits only, at most six, on input and on paste (INTEGRATION.md §8). No
                    // maxlength: it would cut "123 456" to "123 45" before this handler sees it.
                    onChange={(e) => onCodeChange(digitsOnly(e.target.value, codeLength))}
                    onPaste={(e) => {
                      // A pasted code replaces what is there; spaces, dashes and words around it are dropped.
                      const digits = digitsOnly(e.clipboardData.getData('text'), codeLength);
                      if (!digits) return;
                      e.preventDefault();
                      onCodeChange(digits);
                    }}
                    aria-invalid={code.fieldError ? true : undefined}
                    aria-describedby={describedBy('bk-code', false, code.fieldError)}
                  />
                  <span className="code__cells" aria-hidden="true">
                    {Array.from({ length: codeLength }, (_, i) => (
                      <span key={i} className="code__group-cell">
                        {i === half ? <span className="code__dash" /> : null}
                        <span
                          className={`code__cell${code.value[i] ? ' is-filled' : ''}${
                            i === Math.min(code.value.length, codeLength - 1) ? ' is-next' : ''
                          }`}
                        >
                          {code.value[i] ?? ''}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
                {code.fieldError ? (
                  <p className="field__error" id="bk-code-error" role="alert" key={code.fieldErrorCount}>
                    <Icon icon={CircleAlert} size={16} />
                    <span>{code.fieldError}</span>
                  </p>
                ) : null}
              </div>

              {preview ? null : (
                // A real hold exists only for an emailed code.
                <p className="hold-row">
                  <Icon icon={Hourglass} size={17} />
                  <span>
                    We're holding{' '}
                    <b>
                      {formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                      {formatTime(slot.startsAt, timezone, locale)}
                    </b>{' '}
                    for you until {until}.
                  </span>
                </p>
              )}

              <div className="code-form__alert" role="alert">
                {problemNotice('verify')}
              </div>

              <ul className="help-rows">
                {code.resendsLeft === 0 ? (
                  limitNotice ? null : (
                    <li className="help-row">
                      <Icon icon={RefreshCw} size={17} />
                      <span>No more new codes can be sent for this request. The newest one works until {until}.</span>
                    </li>
                  )
                ) : (
                  <li className="help-row">
                    <Icon icon={RefreshCw} size={17} />
                    <span>Didn't get it?</span>
                    <span className="help-row__act">
                      <button
                        type="button"
                        className="text-link text-link--target"
                        aria-disabled={waiting || code.resending ? true : undefined}
                        aria-describedby={waiting ? 'bk-resend-wait' : undefined}
                        onClick={onResend}
                      >
                        {code.resending ? 'Sending a new code…' : 'Send a new code'}
                      </button>
                      {waiting ? (
                        <span className="help-row__wait tabular" id="bk-resend-wait">
                          in {waitSeconds} s
                        </span>
                      ) : null}
                    </span>
                  </li>
                )}
                <li className="help-row">
                  <Icon icon={Pencil} size={17} />
                  <span>Typo in your address?</span>
                  <span className="help-row__act">
                    <button type="button" className="text-link text-link--target" onClick={onChangeEmail}>
                      Change email
                    </button>
                  </span>
                </li>
                {preview ? null : (
                  <li className="help-row">
                    <Icon icon={MailQuestionMark} size={17} />
                    <span>No email after a minute? Check your spam or promotions folder.</span>
                  </li>
                )}
              </ul>
              <p className="code__note" role="status">
                {code.note ?? ''}
              </p>
              <div className="code-form__alert" role="alert">
                {problemNotice('resend')}
              </div>

              <p className="code-next">
                {policies.autoConfirm
                  ? 'Your appointment is confirmed as soon as the code checks out.'
                  : 'Once the code checks out, your request goes to the salon to confirm.'}
              </p>
              <div className="form-foot form-foot--code">
                <button type="button" className="text-link text-link--quiet text-link--target form-foot__back" onClick={onChooseAnotherTime}>
                  <Icon icon={ArrowLeft} size={16} />
                  Choose another time
                </button>
                <button ref={confirmRef} type="submit" className="btn btn--ink form-foot__go" disabled={code.verifying} aria-busy={code.verifying || undefined}>
                  {code.verifying ? 'Checking…' : policies.autoConfirm ? 'Verify and book' : 'Verify and send request'}
                  {code.verifying ? null : <Icon icon={ArrowRight} size={18} className="icon--forward" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

