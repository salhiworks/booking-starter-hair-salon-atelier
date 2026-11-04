import { defaultMessage, type EngineError, type Result } from '@profitstudio/booking-engine';

/** UI state for one engine read. */
export type Load<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error'; error: EngineError };

export function toLoad<T>(result: Result<T>): Load<T> {
  return result.ok ? { state: 'ready', data: result.data } : { state: 'error', error: result.error };
}

/**
 * Engine calls resolve to a Result and never throw for expected failures.
 * This only guards against the unexpected, so the UI always gets a Result.
 */
export async function settle<T>(call: Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await call;
  } catch {
    return { ok: false, error: { code: 'UNKNOWN', message: defaultMessage('UNKNOWN') } };
  }
}
