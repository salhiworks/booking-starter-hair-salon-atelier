import type { TodayStatus } from '../lib/today';

/**
 * Today's status ("Open now until 6:00 PM" …) with its mark — green only while
 * open. While today's real hours are loading it holds its place and says
 * nothing it does not know yet.
 */
export function StatusLine({ status, as: Tag = 'p' }: { status: TodayStatus; as?: 'p' | 'span' }) {
  if (status.pending) {
    return (
      <Tag className="status-line status-line--pending">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="visually-hidden">Checking today's hours…</span>
      </Tag>
    );
  }
  return <Tag className={`status-line${status.open ? ' status-line--open' : ''}`}>{status.text}</Tag>;
}
