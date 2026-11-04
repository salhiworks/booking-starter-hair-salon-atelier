import { useRef, type ReactNode } from 'react';
import type { SiteImage } from '@profitstudio/booking-engine';
import photos from '../content/photos.json';
import { usePlateReveal } from '../lib/plateReveal';

type Manifest = Record<string, { widths: number[]; width: number; height: number }>;
const LOCAL = /^\/photos\/([a-z-]+)-\d+\.webp$/;

/** The site's own photos come in AVIF + WebP at several widths (scripts/prepare-photos.mjs). */
function localSet(src: string) {
  const name = LOCAL.exec(src)?.[1];
  const entry = name ? (photos as Manifest)[name] : undefined;
  if (!name || !entry) return null;
  const set = (ext: string) => entry.widths.map((w) => `/photos/${name}-${w}.${ext} ${w}w`).join(', ');
  return { avif: set('avif'), webp: set('webp'), width: entry.width, height: entry.height };
}

/**
 * A photo in the frame the design reserves for it (the frame's size comes
 * from CSS, so the layout never shifts and any upload keeps the composition:
 * object-fit: cover). With a caption, the photo's description is shown under
 * it — so a replaced photo never keeps a wrong caption — and the image itself
 * is not described twice. Without a photo, `fallback` is typeset in the frame.
 */
export function PhotoFrame({
  image,
  className = '',
  sizes = '(min-width: 1024px) 40vw, 90vw',
  priority = false,
  badge,
  plate,
  fallback,
  reveal = true,
}: {
  image: SiteImage | null;
  className?: string;
  sizes?: string;
  /** The one image above the fold: loaded eagerly, first. */
  priority?: boolean;
  /** A small label on the photo, e.g. "Sample photo". */
  badge?: string;
  /** "Plate II" — shows the caption (the photo's description) under the photo. */
  plate?: string;
  /** Shown in the frame when there is no photo (initials, an ampersand). */
  fallback?: ReactNode;
  reveal?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  usePlateReveal(ref, reveal && !priority);
  const local = image ? localSet(image.src) : null;
  const captioned = Boolean(plate && image?.alt);

  let content: ReactNode = null;
  if (image) {
    const img = (
      <img
        src={image.src}
        srcSet={local?.webp}
        sizes={local ? sizes : undefined}
        // A caption below describes the photo; otherwise the image carries the description.
        alt={captioned ? '' : image.alt}
        width={image.width ?? local?.width}
        height={image.height ?? local?.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
      />
    );
    content = local ? (
      <picture>
        <source type="image/avif" srcSet={local.avif} sizes={sizes} />
        {img}
      </picture>
    ) : (
      img
    );
  } else if (fallback) {
    content = (
      <span className="plate__type" aria-hidden="true">
        {fallback}
      </span>
    );
  }

  return (
    <figure className={`plate ${className}`.trim()} ref={ref}>
      <div className="plate__frame">
        {content}
        {badge ? <span className="plate__badge">{badge}</span> : null}
      </div>
      {captioned ? (
        <figcaption className="plate__caption caption">
          <b>{plate}</b>
          {image!.alt}
        </figcaption>
      ) : null}
    </figure>
  );
}
