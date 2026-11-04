import { useEffect, useRef, type RefObject } from 'react';

/** Keep the page behind still while any modal layer (booking view, menu) is open. */
function syncScrollLock() {
  document.documentElement.classList.toggle('is-locked', Boolean(document.querySelector('dialog[open]')));
}

/**
 * A native modal <dialog> driven by React state: showModal() makes the rest
 * of the page inert and puts the layer on top; Esc asks the owner to close
 * (so history and state stay in step); focus returns to whatever opened it.
 */
export function useModalDialog(ref: RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    syncScrollLock();
  }, [ref, open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const cancel = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', cancel);
    return () => dialog.removeEventListener('cancel', cancel);
  }, [ref]);

  // Unmounting with the layer open must not leave the page locked.
  useEffect(() => () => syncScrollLock(), []);
}

/** Scroll to an in-page section and give it focus, as following its link would. */
export function goToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  history.pushState(null, '', `#${id}`);
}
