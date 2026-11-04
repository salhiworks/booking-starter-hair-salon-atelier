import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  addDays,
  firstDayOfWeek,
  formatDate,
  formatTime,
  monthGrid,
  monthOf,
  nextAvailableDay,
  todayInTimeZone,
  type Availability,
  type AvailabilityDay,
  type Business,
  type EngineError,
  type PendingVerification,
  type Service,
  type Slot,
} from '@profitstudio/booking-engine';
import { Notice } from '../components/Notice';
import { engine } from '../lib/engine';
import { settle, toLoad, type Load } from '../lib/load';
import {
  codeFieldMessage,
  codeIncompleteMessage,
  fieldFromEngine,
  fieldMessage,
  requestEndedText,
  type FieldKey,
} from '../lib/messages';
import { PHONE_QUERY, useMediaQuery } from '../lib/useMediaQuery';
import { CodeStep } from './CodeStep';
import { Confirmation } from './Confirmation';
import { DateTimeStep } from './DateTimeStep';
import { DetailsStep } from './DetailsStep';
import { EMPTY_DETAILS, FIELD_ORDER, checkDetails, checkField, type DetailsValues, type FieldErrors } from './details';
import { flowReducer, freshCodeState, initialFlow, type CodeState, type FlowAction } from './flowState';
import { BookingHeader } from './parts';
import { ServiceStep } from './ServiceStep';
import { Slip } from './Slip';

/** A "Book" click on a service: open the flow with that service chosen. */
export interface BookingIntent {
  serviceId: string;
  nonce: number;
}

const LOADING: Load<never> = { state: 'loading' };

/**
 * Service → date & time → details → code → done. Every piece of data comes
 * from the engine; the flow only remembers what the visitor picked. Booking
 * takes two engine calls: requestBooking() holds the time and emails a code,
 * verifyBooking() with that code makes it real (INTEGRATION.md §2, §6).
 */
export function BookingFlow({
  business,
  services,
  open,
  intent,
  onIntentHandled,
  onServicesChanged,
  onBookingDisabled,
  onClose,
}: {
  business: Business;
  services: Service[];
  /** The booking view is on screen. */
  open: boolean;
  intent: BookingIntent | null;
  onIntentHandled: () => void;
  onServicesChanged: () => void;
  /** The engine answered BOOKING_DISABLED: show the contact details instead of the flow. */
  onBookingDisabled: () => void;
  onClose: () => void;
}) {
  const { timezone, policies, locale } = business;
  const weekStartsOn = firstDayOfWeek(locale);
  const today = todayInTimeZone(timezone);
  const lastBookable = addDays(today, policies.maxAdvanceDays);
  const [state, dispatch] = useReducer(flowReducer, today, (day) => initialFlow(day, weekStartsOn));
  const service = services.find((s) => s.id === state.serviceId) ?? null;
  const phone = useMediaQuery(PHONE_QUERY);

  // Focus: after a step change, the view scrolls to the top and the new step's heading takes focus.
  const flowRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const afterCommit = useRef<(() => void) | null>(null);
  useEffect(() => {
    const task = afterCommit.current;
    afterCommit.current = null;
    task?.();
  });

  const [details, setDetails] = useState<DetailsValues>(EMPTY_DETAILS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<EngineError | null>(null);
  const inFlight = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // The code step. requestId lives in the reducer state only (never stored or put in the URL).
  const [code, setCode] = useState<CodeState>(() => freshCodeState());
  const verifyInFlight = useRef(false);
  const resendInFlight = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const endedRef = useRef<HTMLParagraphElement>(null);
  // The request on screen, to drop answers that arrive after the visitor moved on.
  const openRequest = useRef<string | null>(null);
  useEffect(() => {
    openRequest.current = state.verification?.requestId ?? null;
  }, [state.verification]);
  // TOO_MANY_BOOKINGS: the engine deleted the request and released its time.
  const requestEnded = code.problem?.error.code === 'TOO_MANY_BOOKINGS';
  // A real hold (preview holds nothing) that is still in place.
  const heldUntil =
    state.step === 'verify' && state.verification?.delivery === 'email' && !requestEnded
      ? state.verification.expiresAt
      : null;

  // A hold being given back. The next availability fetch (and the next request)
  // waits for it, so the released time is offered again — to this visitor too.
  const releasing = useRef<Promise<unknown>>(Promise.resolve());

  /**
   * The visitor leaves the code step without a code: release the time at once
   * (cancelBookingRequest, INTEGRATION.md §6). Safe to call twice; the answer
   * changes nothing here — a hold that already ended simply ends.
   */
  function releaseHold(request: PendingVerification | null) {
    if (request) releasing.current = settle(engine.cancelBookingRequest(request.requestId));
  }

  /** Spoken after the visitor picks a day or a time (the step's heading keeps focus otherwise). */
  const [announcement, setAnnouncement] = useState('');

  function navigate(action: FlowAction) {
    setSubmitError(null);
    afterCommit.current = () => {
      flowRef.current?.closest('dialog')?.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
    };
    dispatch(action);
  }

  // "Book" on a service → this service, straight to the date and time.
  useEffect(() => {
    if (!intent) return;
    // Leaving an open code step for another service gives its held time back.
    const pending = openRequest.current;
    if (pending) releasing.current = settle(engine.cancelBookingRequest(pending));
    afterCommit.current = () => headingRef.current?.focus({ preventScroll: true });
    dispatch({ type: 'chooseService', serviceId: intent.serviceId, today: todayInTimeZone(timezone), weekStartsOn });
    onIntentHandled();
  }, [intent, timezone, weekStartsOn, onIntentHandled]);

  // Opening the view again after a booking starts a new one.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current && state.step === 'done' && !intent) {
      dispatch({ type: 'startOver', today: todayInTimeZone(timezone), weekStartsOn });
    }
    wasOpen.current = open;
  }, [open, state.step, intent, timezone, weekStartsOn]);

  // Availability, one month grid per request (≤ 42 days) — from the server, never computed here.
  // Loaded months are kept for this service and run, so going back to a month or a
  // week strip crossing into the next month shows data at once while it is fetched again.
  const runKey = state.serviceId ? `${state.serviceId}|${state.availabilityRun}` : null;
  const monthKey = runKey ? `${runKey}|${state.month}` : null;
  const [grids, setGrids] = useState<Record<string, Load<Availability>>>({});
  const liveRun = useRef(runKey);
  useEffect(() => {
    liveRun.current = runKey;
  });
  useEffect(() => {
    if (!monthKey || !runKey || !state.serviceId) return;
    const grid = monthGrid(state.month, weekStartsOn);
    const query = { serviceId: state.serviceId, from: grid.from, to: grid.to };
    void releasing.current
      .then(() => settle(engine.getAvailability(query)))
      .then((result) => {
        // An answer for a run that is over (a newer reload) is dropped.
        if (liveRun.current !== runKey) return;
        setGrids((prev) => {
          const kept = Object.fromEntries(Object.entries(prev).filter(([key]) => key.startsWith(`${runKey}|`)));
          return { ...kept, [monthKey]: toLoad(result) };
        });
      });
  }, [monthKey, runKey, state.serviceId, state.month, weekStartsOn]);

  const monthLoad: Load<Availability> = (monthKey && grids[monthKey]) || LOADING;
  // Every day loaded for this run, the visible month's own answer first.
  const dayMap = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();
    if (!runKey) return map;
    const loads = Object.entries(grids)
      .filter(([key]) => key.startsWith(`${runKey}|`))
      .sort(([a], [b]) => Number(b === monthKey) - Number(a === monthKey));
    for (const [, load] of loads) {
      if (load.state !== 'ready') continue;
      for (const day of load.data.days) if (!map.has(day.date)) map.set(day.date, day);
    }
    return map;
  }, [grids, runKey, monthKey]);

  // Entering the step with no day chosen: the soonest day with times in the visible month.
  useEffect(() => {
    if (state.step !== 'datetime' || state.date || monthLoad.state !== 'ready') return;
    const inMonth = monthLoad.data.days.filter((d) => monthOf(d.date) === state.month);
    const soonest = nextAvailableDay(inMonth);
    if (soonest) dispatch({ type: 'chooseDay', date: soonest.date, weekStartsOn });
  }, [state.step, state.date, state.month, monthLoad, weekStartsOn]);

  function chooseDay(date: string) {
    dispatch({ type: 'chooseDay', date, weekStartsOn });
    const day = dayMap.get(date);
    const count = day?.status === 'available' ? day.slots.length : 0;
    setAnnouncement(
      `${formatDate(date, locale)}: ${
        count ? `${count} open ${count === 1 ? 'time' : 'times'}` : day?.status === 'closed' ? 'closed' : 'no open times'
      }.`,
    );
  }

  function chooseSlot(slot: Slot, date?: string) {
    if (date && date !== state.date) dispatch({ type: 'chooseDay', date, weekStartsOn });
    dispatch({ type: 'chooseSlot', slot });
    // Chosen from a shortcut ("Soonest", next-available chips) that goes away: focus the chosen time.
    if (date) afterCommit.current = () => flowRef.current?.querySelector<HTMLElement>('button.slot[aria-pressed="true"]')?.focus();
    setAnnouncement(
      `${formatTime(slot.startsAt, timezone, locale)} selected${phone ? '' : ' — press Continue for your details'}.`,
    );
  }

  function changeField(key: FieldKey, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /** Leaving a field: say at once if what was typed cannot work (empty fields wait for Continue). */
  function blurField(key: FieldKey) {
    const problem = checkField(key, details, policies.requirePhone, true);
    if (problem) setFieldErrors((prev) => ({ ...prev, [key]: problem }));
  }

  function focusField(key: FieldKey) {
    const refs = { name: nameRef, email: emailRef, phone: phoneRef, notes: notesRef };
    afterCommit.current = () => refs[key].current?.focus();
  }

  /** Step 1 of booking: requestBooking() holds the time and emails the code. */
  async function submit() {
    if (!service || !state.slot || inFlight.current) return;

    const problems = checkDetails(details, policies.requirePhone);
    const firstProblem = FIELD_ORDER.find((key) => problems[key]);
    if (firstProblem) {
      setFieldErrors(problems);
      setSubmitError(null);
      focusField(firstProblem);
      return;
    }

    inFlight.current = true;
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    // A hold given back a moment ago (e.g. to correct the email) is released first.
    await releasing.current;
    const result = await settle(
      engine.requestBooking({
        serviceId: service.id,
        // Exactly the value getAvailability() returned — never rebuilt from a date and time.
        startsAt: state.slot.startsAt,
        customer: {
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim() || null,
        },
        notes: details.notes.trim() || null,
      }),
    );
    inFlight.current = false;
    setSubmitting(false);

    // Not booked yet: the time is held and a code is on its way (in preview, nothing was sent).
    if (result.ok) {
      setCode(freshCodeState(result.data));
      navigate({ type: 'requested', verification: result.data });
      return;
    }

    const { error } = result;
    const time = formatTime(state.slot.startsAt, timezone, locale);
    if (error.code === 'BOOKING_DISABLED') {
      onBookingDisabled();
      return;
    }
    if (error.code === 'INVALID_INPUT') {
      const key = fieldFromEngine(error.field);
      if (key) {
        setFieldErrors({ [key]: fieldMessage(key) });
        focusField(key);
        return;
      }
      if (error.field === 'startsAt') {
        navigate({
          type: 'slotGone',
          taken: false,
          text: `${time} is no longer offered. These times are still open — your details are kept.`,
        });
        return;
      }
      if (error.field === 'serviceId') {
        onServicesChanged();
        navigate({ type: 'serviceGone', text: "That service can't be booked online any more. Please choose another — your details are kept." });
        return;
      }
    }
    if (error.code === 'SLOT_UNAVAILABLE') {
      navigate({
        type: 'slotGone',
        taken: true,
        text: `${time} was just taken by someone else. These times are still open — your details are kept.`,
      });
      return;
    }
    if (error.code === 'SERVICE_UNAVAILABLE') {
      onServicesChanged();
      navigate({ type: 'serviceGone', text: "That service can't be booked online any more. Please choose another — your details are kept." });
      return;
    }

    // NOT_CONFIGURED, RATE_LIMITED, SCHEMA_*, NETWORK, UNKNOWN…
    setSubmitError(error);
    afterCommit.current = () => submitRef.current?.focus();
  }

  function changeCode(digits: string) {
    setCode((prev) => ({ ...prev, value: digits, fieldError: null }));
  }

  /** A wrong or incomplete code: say so under the input and put the cursor back in it. */
  function showCodeError(text: string) {
    setCode((prev) => ({ ...prev, fieldError: text, fieldErrorCount: prev.fieldErrorCount + 1, problem: null }));
    afterCommit.current = () => {
      codeRef.current?.focus();
      codeRef.current?.select();
    };
  }

  /** verifyBooking() or resendVerificationCode() said no (INTEGRATION.md §7–§8). */
  function codeFailed(error: EngineError, from: 'verify' | 'resend', codeLength: number) {
    if (error.code === 'BOOKING_DISABLED') {
      onBookingDisabled();
      return;
    }
    // The request is over: back to the times, freshly loaded.
    const ended = requestEndedText(error);
    if (ended) {
      navigate({ type: 'slotGone', taken: false, text: ended });
      return;
    }
    const fieldText = codeFieldMessage(error, codeLength);
    if (fieldText) {
      showCodeError(fieldText);
      return;
    }
    if (error.code === 'RESEND_TOO_SOON') {
      const seconds = error.retryAfterSeconds ?? 60;
      setCode((prev) => ({
        ...prev,
        resendAt: Date.now() + seconds * 1000,
        note: `Please wait ${seconds} seconds before asking for another code.`,
      }));
      return;
    }
    if (error.code === 'RESEND_LIMIT') {
      // The request stays open and its last code still works: keep the code step,
      // drop "Send a new code" and put the cursor back in the code field.
      setCode((prev) => ({ ...prev, resendsLeft: 0, problem: { error, from } }));
      afterCommit.current = () => codeRef.current?.focus();
      return;
    }
    // PREVIEW_MODE, TOO_MANY_BOOKINGS, RATE_LIMITED, NETWORK, NOT_CONFIGURED, SCHEMA_*, UNKNOWN…
    setCode((prev) => ({ ...prev, problem: { error, from } }));
    if (error.code === 'TOO_MANY_BOOKINGS') afterCommit.current = () => endedRef.current?.focus();
    else if (from === 'verify') afterCommit.current = () => confirmRef.current?.focus();
  }

  /** Step 2 of booking: the code turns the hold into a request (pending) or a booking (confirmed). */
  async function verify() {
    const request = state.verification;
    if (!request || verifyInFlight.current) return;
    const digits = code.value;
    if (digits.length !== request.codeLength) {
      showCodeError(codeIncompleteMessage(request.codeLength));
      return;
    }

    verifyInFlight.current = true;
    setCode((prev) => ({ ...prev, verifying: true, fieldError: null, problem: null }));
    const result = await settle(engine.verifyBooking({ requestId: request.requestId, code: digits }));
    verifyInFlight.current = false;
    setCode((prev) => ({ ...prev, verifying: false }));

    // The only way to the confirmation screen. A verified booking is real, so it is
    // shown even if the visitor clicked elsewhere while the answer was on its way.
    if (result.ok) {
      navigate({ type: 'booked', confirmation: result.data });
      return;
    }
    if (openRequest.current !== request.requestId) return;
    codeFailed(result.error, 'verify', request.codeLength);
  }

  /** A new code by email; the previous one stops working and the hold is not extended. */
  async function resend() {
    const request = state.verification;
    if (!request || resendInFlight.current || code.resendsLeft === 0 || Date.now() < code.resendAt) return;

    resendInFlight.current = true;
    setCode((prev) => ({ ...prev, resending: true, note: null, problem: null }));
    const result = await settle(engine.resendVerificationCode(request.requestId));
    resendInFlight.current = false;
    if (openRequest.current !== request.requestId) return;

    if (result.ok) {
      const { resendsLeft, resendAfterSeconds, delivery } = result.data;
      setCode((prev) => ({
        ...prev,
        value: '',
        fieldError: null,
        resending: false,
        resendsLeft,
        resendAt: Date.now() + resendAfterSeconds * 1000,
        note:
          delivery === 'preview'
            ? `Preview: no email was sent. Type any ${request.codeLength} digits.`
            : `A new code is on its way to ${request.email}. Use the newest one — the earlier code no longer works.`,
      }));
      afterCommit.current = () => codeRef.current?.focus();
      return;
    }
    setCode((prev) => ({ ...prev, resending: false }));
    codeFailed(result.error, 'resend', request.codeLength);
  }

  /**
   * Leaving the code step without a code — "Choose another time" or "Change
   * email": release the held time first. If the engine says the code was
   * already accepted (an earlier answer was lost on the way), show that
   * booking instead — never book twice (INTEGRATION.md §8).
   */
  async function leaveCodeStep(then: FlowAction) {
    const request = state.verification;
    const typed = code.value;
    if (request) {
      releaseHold(request);
      const released = (await releasing.current) as Awaited<ReturnType<typeof engine.cancelBookingRequest>>;
      if (!released.ok && released.error.field === 'already_verified' && typed.length === request.codeLength) {
        const booked = await settle(engine.verifyBooking({ requestId: request.requestId, code: typed }));
        if (booked.ok) {
          navigate({ type: 'booked', confirmation: booked.data });
          return;
        }
      }
    }
    navigate(then);
  }

  const notice = state.notice ? <Notice tone={state.notice.tone} title={state.notice.text} /> : null;
  const goBack = (step: 'service' | 'datetime' | 'details') => navigate({ type: 'back', step });
  const backAction: (() => void) | null =
    state.step === 'datetime'
      ? () => goBack('service')
      : state.step === 'details'
        ? () => goBack('datetime')
        : state.step === 'verify'
          ? () => void leaveCodeStep({ type: 'back', step: 'details' })
          : null;

  const slip =
    service && (state.step === 'datetime' || state.step === 'details' || state.step === 'verify') ? (
      <Slip
        business={business}
        service={service}
        date={state.date}
        slot={state.slot}
        step={state.step}
        heldUntil={heldUntil}
        compact={phone}
        onChangeService={() => goBack('service')}
        onChangeTime={() => goBack('datetime')}
      />
    ) : null;

  let panel;
  if (state.step === 'done' && state.confirmation) {
    panel = (
      <Confirmation
        confirmation={state.confirmation}
        service={service}
        business={business}
        email={details.email.trim()}
        headingRef={headingRef}
        onClose={onClose}
        onStartOver={() => navigate({ type: 'startOver', today: todayInTimeZone(timezone), weekStartsOn })}
      />
    );
  } else if (state.step === 'datetime' && service) {
    panel = (
      <DateTimeStep
        business={business}
        service={service}
        phone={phone}
        month={state.month}
        weekStart={state.weekStart}
        weekStartsOn={weekStartsOn}
        today={today}
        lastBookable={lastBookable}
        monthLoad={monthLoad}
        dayMap={dayMap}
        date={state.date}
        slot={state.slot}
        partHint={state.partHint}
        taken={state.taken}
        notice={notice}
        slip={slip}
        headingRef={headingRef}
        onChooseDay={chooseDay}
        onChooseSlot={chooseSlot}
        onContinue={() => navigate({ type: 'continue' })}
        onShowMonth={(month, weekStart) => dispatch({ type: 'showMonth', month, weekStart })}
        onShowWeek={(weekStart, month) => dispatch({ type: 'showWeek', weekStart, month })}
        onRetry={() => dispatch({ type: 'retryAvailability' })}
        onChangeService={() => goBack('service')}
        onServiceGone={() => {
          onServicesChanged();
          navigate({ type: 'serviceGone', text: "That service can't be booked online right now. Please choose another." });
        }}
      />
    );
  } else if (state.step === 'details' && service && state.slot) {
    panel = (
      <DetailsStep
        business={business}
        values={details}
        errors={fieldErrors}
        submitting={submitting}
        submitError={submitError}
        headingRef={headingRef}
        notice={notice}
        slip={slip}
        nameRef={nameRef}
        emailRef={emailRef}
        phoneRef={phoneRef}
        notesRef={notesRef}
        submitRef={submitRef}
        onChange={changeField}
        onBlurField={blurField}
        onSubmit={() => void submit()}
        onBack={() => goBack('datetime')}
      />
    );
  } else if (state.step === 'verify' && service && state.date && state.slot && state.verification) {
    panel = (
      <CodeStep
        business={business}
        verification={state.verification}
        date={state.date}
        slot={state.slot}
        code={code}
        slip={slip}
        headingRef={headingRef}
        codeRef={codeRef}
        confirmRef={confirmRef}
        endedRef={endedRef}
        onCodeChange={changeCode}
        onVerify={() => void verify()}
        onResend={() => void resend()}
        onChooseAnotherTime={() => void leaveCodeStep({ type: 'chooseAnotherTime' })}
        onChangeEmail={() => void leaveCodeStep({ type: 'back', step: 'details' })}
      />
    );
  } else {
    // Step 1 — also the fallback if the chosen service disappeared from the menu.
    const lost = state.step !== 'service' && !service;
    panel = (
      <ServiceStep
        business={business}
        services={services}
        selectedId={state.serviceId}
        headingRef={headingRef}
        notice={
          lost ? <Notice tone="warning" title="That service is no longer bookable online. Please choose another." /> : notice
        }
        onChoose={(serviceId) => navigate({ type: 'chooseService', serviceId, today: todayInTimeZone(timezone), weekStartsOn })}
      />
    );
  }

  return (
    <div className={`flow flow--${state.step}`} id="book-flow" ref={flowRef}>
      <BookingHeader business={business} step={state.step} onBack={backAction} onClose={onClose} />
      <div className="flow__body">
        {__BOOKING_DEMO__ ? (
          <p className="flow__preview">
            <span className="tag">Demo</span> Times come from the demo dashboard — nothing is emailed, and what you book
            stays in this browser.
          </p>
        ) : engine.mode === 'preview' ? (
          <p className="flow__preview">
            <span className="tag">Preview</span> Sample times only — nothing you enter here is saved or emailed.
          </p>
        ) : null}
        {panel}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {state.notice?.text ?? announcement}
      </p>
    </div>
  );
}
