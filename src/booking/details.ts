import type { FieldKey } from '../lib/messages';

export interface DetailsValues {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** INTEGRATION.md §6: notes are optional, at most 1000 characters. */
export const NOTES_MAX = 1000;

export const EMPTY_DETAILS: DetailsValues = { name: '', email: '', phone: '', notes: '' };

/** What is wrong with an email address, in words that say how to fix it. */
function emailProblem(email: string): string | null {
  if (!email.includes('@')) return 'An email address needs an @ — for example, name@example.com.';
  const [local, domain = ''] = email.split('@');
  if (!local || /\s/.test(email) || email.split('@').length > 2) return 'Please check your email address — for example, name@example.com.';
  if (!/\.[^\s.@]{2,}$/.test(domain)) return 'This email address is missing its ending — for example, name@example.com.';
  return null;
}

/** INTEGRATION.md §7: digits, spaces and + ( ) . / -, at least 5 digits, at most 40 characters. */
function phoneProblem(phone: string): string | null {
  if (!/^[\d\s+()./-]{1,40}$/.test(phone) || phone.replace(/\D/g, '').length < 5) {
    return 'Please enter a phone number with at least 5 digits, like +1 503 555 0123.';
  }
  return null;
}

/**
 * One field's quick check before calling the engine (the engine validates
 * everything again; its INVALID_INPUT `field` maps back onto the same
 * fields). `leaving` is the check on blur: an empty field is not an error yet.
 */
export function checkField(key: FieldKey, values: DetailsValues, requirePhone: boolean, leaving = false): string | undefined {
  const value = values[key].trim();
  switch (key) {
    case 'name':
      return !value && !leaving ? 'Please enter your name.' : undefined;
    case 'email':
      if (!value) return leaving ? undefined : 'Please enter your email address — your code goes there.';
      return emailProblem(value) ?? undefined;
    case 'phone':
      if (!value) return requirePhone && !leaving ? 'Please enter a phone number we can reach you on.' : undefined;
      return phoneProblem(value) ?? undefined;
    case 'notes':
      return values.notes.length > NOTES_MAX ? 'Please keep the note under 1,000 characters.' : undefined;
  }
}

/** Every field, as on Continue. */
export function checkDetails(values: DetailsValues, requirePhone: boolean): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of FIELD_ORDER) {
    const problem = checkField(key, values, requirePhone);
    if (problem) errors[key] = problem;
  }
  return errors;
}

/** Fields in form order, to focus the first one with an error. */
export const FIELD_ORDER: FieldKey[] = ['name', 'email', 'phone', 'notes'];

/** aria-describedby for an input rendered inside <Field>: its hint and/or its error. */
export function describedBy(id: string, hasHint: boolean, error?: string | null): string | undefined {
  const ids = [hasHint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
