/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
/** True only in a Live Demo build (`vite --mode demo`). */
declare const __BOOKING_DEMO__: boolean;
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
