// VENDORED from booking-niche-packs/shared/demo-engine — edit it there, then run scripts/sync-shared.mjs.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DemoEngine } from './createDemoEngine';
import './demoBar.css';

/**
 * The Live Demo's one piece of chrome: a slim strip above the website and the
 * dashboard. It says once, plainly, that this is a demo whose changes stay in
 * this browser, offers the one jump that matters (website ↔ dashboard) and a
 * Reset. In the page flow — never floating — so it covers nothing.
 */
function DemoBar({ engine, page }: { engine: DemoEngine; page: 'site' | 'admin' }) {
  const [booked, setBooked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onBooked = (e: Event) => setBooked((e as CustomEvent<{ reference: string }>).detail.reference);
    window.addEventListener('booking-demo:booked', onBooked);
    return () => window.removeEventListener('booking-demo:booked', onBooked);
  }, []);

  const reset = () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    engine.resetDemo();
    window.location.assign(page === 'admin' ? '/admin/' : '/');
  };

  const message = booked ? (
    <>
      <strong>Request {booked} is in the dashboard.</strong>{' '}
      <span className="bdemo-long">Open it to confirm it as the owner.</span>
    </>
  ) : page === 'site' ? (
    <>
      <strong>Live demo</strong>
      <span className="bdemo-long"> — book a time, then manage it in the dashboard. Nothing is sent; changes stay in this browser.</span>
    </>
  ) : (
    <>
      <strong>Demo dashboard</strong>
      <span className="bdemo-long"> — sample data. Nothing is sent; changes stay in this browser.</span>
    </>
  );

  return (
    <div className="bdemo" role="region" aria-label="Live demo">
      <span className="bdemo-dot" aria-hidden="true" />
      <p className="bdemo-text">{message}</p>
      <div className="bdemo-actions">
        {page === 'site' ? (
          <a className={`bdemo-btn${booked ? ' bdemo-btn--primary' : ''}`} href="/admin/#bookings">
            Open dashboard
          </a>
        ) : (
          <a className="bdemo-btn" href="/">
            View website
          </a>
        )}
        <button type="button" className="bdemo-btn bdemo-btn--quiet" onClick={reset} aria-live="polite">
          {confirming ? 'Reset everything?' : 'Reset demo'}
        </button>
      </div>
    </div>
  );
}

/** Put the strip at the top of the page, outside the app's own root. */
export function mountDemoBar(engine: DemoEngine, page: 'site' | 'admin'): void {
  if (typeof document === 'undefined' || document.getElementById('booking-demo-bar')) return;
  const host = document.createElement('div');
  host.id = 'booking-demo-bar';
  document.body.prepend(host);
  createRoot(host).render(<DemoBar engine={engine} page={page} />);
}
