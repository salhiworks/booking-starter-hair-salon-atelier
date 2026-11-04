import {
  addDays,
  monthOf,
  partOfDay,
  startOfWeek,
  type BookingConfirmation,
  type EngineError,
  type PartOfDay,
  type PendingVerification,
  type Slot,
  type Weekday,
} from '@profitstudio/booking-engine';

export type Step = 'service' | 'datetime' | 'details' | 'verify' | 'done';

export const STEPS: ReadonlyArray<{ id: Step; label: string }> = [
  { id: 'service', label: 'Service' },
  { id: 'datetime', label: 'Date & time' },
  { id: 'details', label: 'Your details' },
  { id: 'verify', label: 'Verify email' },
  { id: 'done', label: 'Done' },
];

export function stepIndex(step: Step): number {
  return STEPS.findIndex((s) => s.id === step);
}

/** "Step 2 of 5". */
export function stepKicker(step: Step): string {
  return `Step ${stepIndex(step) + 1} of ${STEPS.length}`;
}

export interface FlowNotice {
  tone: 'warning' | 'info';
  text: string;
}

export interface FlowState {
  step: Step;
  serviceId: string | null;
  /** The month the calendar shows, "YYYY-MM": one getAvailability call per month. */
  month: string;
  /** First day of the week the phone's week strip shows. */
  weekStart: string;
  date: string | null;
  /** Exactly as getAvailability() returned it; startsAt goes back unchanged. */
  slot: Slot | null;
  /** The part of the day to show when no time is chosen (after a time was taken or released). */
  partHint: PartOfDay | null;
  /** A time that was just taken by someone else: shown struck through in its place. */
  taken: Slot | null;
  /**
   * requestBooking() succeeded: the time is held while the client enters the
   * emailed code. Component state only — never localStorage or the URL
   * (INTEGRATION.md §6); after a reload the client simply requests again.
   */
  verification: PendingVerification | null;
  notice: FlowNotice | null;
  confirmation: BookingConfirmation | null;
  /** Bumped to fetch availability again (e.g. after a time was taken). */
  availabilityRun: number;
}

export type FlowAction =
  | { type: 'chooseService'; serviceId: string; today: string; weekStartsOn: Weekday }
  | { type: 'chooseDay'; date: string; weekStartsOn: Weekday }
  | { type: 'chooseSlot'; slot: Slot }
  | { type: 'continue' }
  | { type: 'back'; step: 'service' | 'datetime' | 'details' }
  | { type: 'showMonth'; month: string; weekStart: string }
  | { type: 'showWeek'; weekStart: string; month: string }
  | { type: 'retryAvailability' }
  | { type: 'requested'; verification: PendingVerification }
  /** Back to the times with fresh availability; the open request was released (cancelBookingRequest). */
  | { type: 'chooseAnotherTime' }
  | { type: 'slotGone'; text: string; taken: boolean }
  | { type: 'serviceGone'; text: string }
  | { type: 'booked'; confirmation: BookingConfirmation }
  | { type: 'startOver'; today: string; weekStartsOn: Weekday };

export function initialFlow(today: string, weekStartsOn: Weekday = 1): FlowState {
  return {
    step: 'service',
    serviceId: null,
    month: monthOf(today),
    weekStart: startOfWeek(today, weekStartsOn),
    date: null,
    slot: null,
    partHint: null,
    taken: null,
    verification: null,
    notice: null,
    confirmation: null,
    availabilityRun: 0,
  };
}

const hintFrom = (slot: Slot | null): PartOfDay | null => (slot ? partOfDay(slot.time) : null);

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'chooseService':
      return {
        ...initialFlow(action.today, action.weekStartsOn),
        step: 'datetime',
        serviceId: action.serviceId,
        availabilityRun: state.availabilityRun + 1,
      };
    case 'chooseDay':
      if (action.date === state.date) return state;
      return {
        ...state,
        date: action.date,
        // The calendar follows the chosen day (e.g. a week strip running into the next month).
        month: monthOf(action.date),
        weekStart: startOfWeek(action.date, action.weekStartsOn),
        slot: null,
        partHint: null,
        taken: null,
        notice: null,
      };
    case 'chooseSlot':
      return { ...state, slot: action.slot, partHint: null, taken: null, notice: null };
    case 'continue':
      return state.slot ? { ...state, step: 'details', notice: null } : state;
    case 'back':
      return { ...state, step: action.step, verification: null, notice: null };
    case 'showMonth':
      return { ...state, month: action.month, weekStart: action.weekStart };
    case 'showWeek':
      return { ...state, weekStart: action.weekStart, month: action.month };
    case 'retryAvailability':
      return { ...state, availabilityRun: state.availabilityRun + 1 };
    case 'requested':
      return { ...state, step: 'verify', verification: action.verification, notice: null };
    case 'chooseAnotherTime':
      return {
        ...state,
        step: 'datetime',
        slot: null,
        partHint: hintFrom(state.slot),
        taken: null,
        verification: null,
        notice: null,
        availabilityRun: state.availabilityRun + 1,
      };
    case 'slotGone':
      return {
        ...state,
        step: 'datetime',
        slot: null,
        partHint: hintFrom(state.slot),
        taken: action.taken ? state.slot : null,
        verification: null,
        notice: { tone: 'warning', text: action.text },
        availabilityRun: state.availabilityRun + 1,
      };
    case 'serviceGone':
      return {
        ...state,
        step: 'service',
        serviceId: null,
        date: null,
        slot: null,
        partHint: null,
        taken: null,
        verification: null,
        notice: { tone: 'warning', text: action.text },
      };
    case 'booked':
      return { ...state, step: 'done', verification: null, confirmation: action.confirmation, notice: null };
    case 'startOver':
      return { ...initialFlow(action.today, action.weekStartsOn), availabilityRun: state.availabilityRun + 1 };
  }
}

/** The month a week strip belongs to: the current one while the week touches it, else the week's own. */
export function monthForWeek(weekStart: string, current: string): string {
  const end = addDays(weekStart, 6);
  if (monthOf(weekStart) === current || monthOf(end) === current) return current;
  return monthOf(weekStart > `${current}-31` ? weekStart : end);
}

/** The code step's own state: what was typed, what went wrong, and the "Send a new code" timer. */
export interface CodeState {
  /** Digits only. */
  value: string;
  /** Shown under the input: a wrong or incomplete code. */
  fieldError: string | null;
  /** Counts field errors, so the same message is announced again. */
  fieldErrorCount: number;
  /** A problem that is not about the typed digits, shown next to the control that caused it. */
  problem: { error: EngineError; from: 'verify' | 'resend' } | null;
  verifying: boolean;
  resending: boolean;
  /** Epoch ms after which "Send a new code" may be used. */
  resendAt: number;
  /** New codes still allowed (from requestBooking, then each resend); 0 hides "Send a new code". */
  resendsLeft: number;
  /** Quiet status line after "Send a new code". */
  note: string | null;
}

/** A fresh code step for requestBooking()'s answer (or an empty one before any request). */
export function freshCodeState(request?: Pick<PendingVerification, 'resendAfterSeconds' | 'resendsLeft'>): CodeState {
  return {
    value: '',
    fieldError: null,
    fieldErrorCount: 0,
    problem: null,
    verifying: false,
    resending: false,
    resendAt: Date.now() + (request?.resendAfterSeconds ?? 0) * 1000,
    resendsLeft: request?.resendsLeft ?? 0,
    note: null,
  };
}
