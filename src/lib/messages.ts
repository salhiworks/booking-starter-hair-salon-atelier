import type { EngineError } from '@profitstudio/booking-engine';

/**
 * The site's own wording for engine error codes (INTEGRATION.md §7).
 * `message` from the engine is safe English, but these keep one voice.
 */
export interface NoticeCopy {
  title: string;
  body: string;
  /** Offer a "Try again" button. */
  retry: boolean;
  /** Show the salon's phone/email (from getBusiness) as a way forward. */
  contact: boolean;
}

/**
 * A read failed: services, business info or availability. `context` picks the
 * wording: "booking" uses INTEGRATION.md's phrases for the booking flow,
 * "info" suits the menu and the hours/contact section.
 */
export function readErrorCopy(error: EngineError, subject: string, context: 'booking' | 'info' = 'booking'): NoticeCopy {
  switch (error.code) {
    case 'NOT_CONFIGURED':
      return context === 'booking'
        ? {
            title: 'Online booking is not available yet',
            body: 'Please call or visit the salon to make an appointment in the meantime.',
            retry: false,
            contact: true,
          }
        : {
            title: `${subject} will appear here soon`,
            body: 'Please call or visit the salon in the meantime.',
            retry: false,
            contact: true,
          };
    case 'SCHEMA_MISSING':
    case 'SCHEMA_INCOMPATIBLE':
      return context === 'booking'
        ? {
            title: 'Online booking is temporarily unavailable',
            body: 'Please try again later, or call or email the salon.',
            retry: false,
            contact: true,
          }
        : {
            title: 'Temporarily unavailable',
            body: `${subject} can't be shown right now. Please try again later, or call or email the salon.`,
            retry: false,
            contact: true,
          };
    case 'NETWORK':
      return {
        title: "We couldn't reach the booking system",
        body: 'Check your connection, then try again.',
        retry: true,
        contact: false,
      };
    case 'RATE_LIMITED':
      return {
        title: 'Too many requests',
        body: 'Please wait a moment and try again, or call or email the salon.',
        retry: true,
        contact: true,
      };
    case 'SERVICE_UNAVAILABLE':
      return {
        title: "This service can't be booked online right now",
        body: 'Please choose another service, or call or email the salon.',
        retry: false,
        contact: true,
      };
    default:
      return {
        title: `${subject} didn't load`,
        body: 'Something went wrong on our side. Please try again.',
        retry: true,
        contact: false,
      };
  }
}

/**
 * requestBooking() failed in a way that is not fixed in place (field errors,
 * a taken time, a withdrawn service and online booking being switched off
 * are handled by the flow itself).
 */
export function bookingErrorCopy(error: EngineError): NoticeCopy {
  switch (error.code) {
    case 'PREVIEW_MODE':
      return {
        title: 'Preview: nothing was saved',
        body: 'This site is running on sample data, so no appointment was made and the salon has not been notified. Once the booking system is connected, this button sends a real request.',
        retry: false,
        contact: false,
      };
    case 'BOOKING_DISABLED':
      return {
        title: 'Online booking is closed right now',
        body: 'Your appointment was not booked. Please call or email the salon to make it.',
        retry: false,
        contact: true,
      };
    case 'NOT_CONFIGURED':
      return {
        title: 'Online booking is not available yet',
        body: 'Your appointment was not booked. Please call or email the salon to make it.',
        retry: false,
        contact: true,
      };
    case 'SCHEMA_MISSING':
    case 'SCHEMA_INCOMPATIBLE':
      return {
        title: 'Online booking is temporarily unavailable',
        body: 'Your appointment was not booked. Please call or email the salon, or try again later.',
        retry: false,
        contact: true,
      };
    case 'RATE_LIMITED':
      return {
        title: 'Too many appointment requests',
        body: 'Your appointment was not booked. Please call or email the salon and we will sort it out.',
        retry: false,
        contact: true,
      };
    case 'NETWORK':
      return {
        title: "We couldn't reach the booking system",
        body: 'Your appointment was not booked yet. Check your connection, then try again — your details are still filled in.',
        retry: true,
        contact: false,
      };
    case 'INVALID_INPUT':
      return {
        title: 'Please check your details',
        body: error.message,
        retry: false,
        contact: false,
      };
    default:
      return {
        title: 'Your appointment was not booked',
        body: 'Something went wrong on our side. Please try again, or call or email the salon.',
        retry: true,
        contact: true,
      };
  }
}

/**
 * Outcomes at the code step that end the request (INTEGRATION.md §7–§8): the
 * flow goes back to the time step and reloads availability. Returns the
 * notice for that step, or null when the request is still open.
 */
export function requestEndedText(error: EngineError): string | null {
  switch (error.code) {
    case 'CODE_EXPIRED':
      return 'That code has run out, so the time was released. Please choose a time again — your details are kept.';
    case 'TOO_MANY_ATTEMPTS':
      return 'Too many incorrect codes, so the time was released. Please choose a time again — your details are kept.';
    case 'SLOT_UNAVAILABLE':
      return 'That time can no longer be booked. Here is what is still open — your details are kept.';
    case 'INVALID_INPUT':
      return error.field === 'requestId'
        ? 'That request is no longer open. Please choose a time again — your details are kept.'
        : null;
    default:
      return null;
  }
}

/** Empty or not the right number of digits — checked in the browser first, then by the engine. */
export function codeIncompleteMessage(codeLength: number): string {
  return `Please enter the ${codeLength}-digit code from the email.`;
}

/** The message under the code input, or null when the problem is not the digits typed. */
export function codeFieldMessage(error: EngineError, codeLength: number): string | null {
  if (error.code === 'INVALID_INPUT' && error.field === 'code') return codeIncompleteMessage(codeLength);
  if (error.code !== 'INVALID_CODE') return null;
  const left = error.attemptsLeft;
  if (left === undefined || left <= 0) return "That code isn't right. Please check the email and try again.";
  return `That code isn't right. ${left === 1 ? '1 try' : `${left} tries`} left.`;
}

/**
 * verifyBooking() or resendVerificationCode() failed but the code step stays
 * open. `codeWorksUntil` is the hold's end, already formatted for display.
 */
export function codeErrorCopy(error: EngineError, action: 'verify' | 'resend', codeWorksUntil: string): NoticeCopy {
  const notDone = action === 'verify' ? 'Your appointment is not booked yet.' : 'No new code was sent.';
  switch (error.code) {
    case 'PREVIEW_MODE':
      return {
        title: 'Preview: nothing was saved',
        body: 'This site is running on sample data, so no appointment was made, no email was sent and the salon has not been notified. Once the booking system is connected, the code from the email confirms a real request.',
        retry: false,
        contact: false,
      };
    case 'TOO_MANY_BOOKINGS':
      return {
        title: "You've reached the limit for online appointments",
        body: 'This email address already has as many upcoming appointments as we can take online, so this one was not booked and the time was released. Please call or email the salon to book another.',
        retry: false,
        contact: true,
      };
    case 'NETWORK':
      return {
        title: "We couldn't reach the booking system",
        body: `${notDone} Check your connection, then try again.`,
        retry: true,
        contact: false,
      };
    case 'RESEND_LIMIT':
      // No more new codes, but the request stays open: the last code still works (INTEGRATION.md §7).
      return {
        title: 'No more new codes can be sent',
        body: `The code we already sent still works until ${codeWorksUntil}. If it hasn't arrived, please call or email the salon.`,
        retry: false,
        contact: true,
      };
    case 'RATE_LIMITED':
      return action === 'resend'
        ? {
            title: "We can't send another code right now",
            body: `The code we already sent still works until ${codeWorksUntil}. If it hasn't arrived, please call or email the salon.`,
            retry: false,
            contact: true,
          }
        : {
            title: 'Too many attempts',
            body: `${notDone} Please call or email the salon and we will sort it out.`,
            retry: false,
            contact: true,
          };
    case 'CONFLICT':
      // resendVerificationCode() on a request that was already verified — e.g.
      // the confirmation got lost on its way back. The same code shows it again.
      return {
        title: 'Your code was already accepted',
        body: 'Enter the same code again to see your appointment.',
        retry: false,
        contact: false,
      };
    case 'NOT_CONFIGURED':
      return {
        title: 'Online booking is not available yet',
        body: `${notDone} Please call or email the salon to make your appointment.`,
        retry: false,
        contact: true,
      };
    case 'SCHEMA_MISSING':
    case 'SCHEMA_INCOMPATIBLE':
      return {
        title: 'Online booking is temporarily unavailable',
        body: `${notDone} Please call or email the salon, or try again later.`,
        retry: false,
        contact: true,
      };
    default:
      return {
        title: action === 'verify' ? "We couldn't check your code" : "We couldn't send a new code",
        body: 'Something went wrong on our side. Please try again, or call or email the salon.',
        retry: true,
        contact: true,
      };
  }
}

export type FieldKey = 'name' | 'email' | 'phone' | 'notes';

/** Map the engine's `field` (e.g. "customer.email") to a form field. */
export function fieldFromEngine(field: string | undefined): FieldKey | null {
  switch (field) {
    case 'customer.name':
      return 'name';
    case 'customer.email':
      return 'email';
    case 'customer.phone':
      return 'phone';
    case 'notes':
      return 'notes';
    default:
      return null;
  }
}

const FIELD_MESSAGES: Record<FieldKey, string> = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email address, like name@example.com.',
  phone: 'Please enter a phone number we can reach you on.',
  notes: 'Please keep notes under 1,000 characters.',
};

export function fieldMessage(key: FieldKey): string {
  return FIELD_MESSAGES[key];
}
