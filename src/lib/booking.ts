import { createContext, use } from 'react';

/**
 * Every "Book" action on the page goes through this: it opens the booking
 * view (a focused full-screen layer over the page, at #book), optionally with
 * a service already chosen. While online booking is off it leads to the
 * contact details in the #book section instead.
 */
export interface BookingLauncher {
  open: (serviceId?: string) => void;
}

export const BookingContext = createContext<BookingLauncher>({ open: () => {} });

export function useBooking(): BookingLauncher {
  return use(BookingContext);
}

/** The address of the booking view: an in-page anchor, never a path route. */
export const BOOK_HASH = '#book';
