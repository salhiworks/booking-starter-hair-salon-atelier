import type { LucideIcon } from 'lucide-react';

/**
 * Lucide icons, drawn with one optical stroke at every size (about 1.2 px,
 * whatever the icon's size), in the colour of the text around them.
 * Decorative: every icon sits next to words that say the same thing.
 */
export function Icon({
  icon: Glyph,
  size = 18,
  weight = 1.2,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  /** Drawn stroke in px; heavier only for small marks such as a check. */
  weight?: number;
  className?: string;
}) {
  return (
    <Glyph
      className={className ? `icon ${className}` : 'icon'}
      size={size}
      strokeWidth={weight}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
    />
  );
}
