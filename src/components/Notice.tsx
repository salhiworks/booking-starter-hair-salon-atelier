import type { ReactNode, Ref } from 'react';
import { CircleAlert, Eye, Info, Mail, Phone, TriangleAlert } from 'lucide-react';
import type { Business } from '@profitstudio/booking-engine';
import { telHref } from '../lib/format';
import { Icon } from './Icon';

const ICONS = { info: Info, warning: TriangleAlert, error: CircleAlert, preview: Eye } as const;

/** A short message with a way forward. Status is carried by the words and the icon, not the colour alone. */
export function Notice({
  tone = 'info',
  title,
  titleRef,
  children,
  actions,
  className,
}: {
  tone?: 'info' | 'warning' | 'error' | 'preview';
  title: ReactNode;
  /** Pass a ref to move focus to the title when the notice replaces what the visitor was using. */
  titleRef?: Ref<HTMLParagraphElement>;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`notice notice--${tone}${className ? ` ${className}` : ''}`}>
      <Icon icon={ICONS[tone]} size={18} />
      <p className="notice__title" ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
        {title}
      </p>
      {children ? <div className="notice__body">{children}</div> : null}
      {actions ? <div className="notice__actions">{actions}</div> : null}
    </div>
  );
}

/** Phone and email from the engine's business contact; renders nothing if neither is set. */
export function ContactLinks({ contact }: { contact: Business['contact'] | null }) {
  if (!contact || (!contact.phone && !contact.email)) return null;
  return (
    <ul className="contact-links">
      {contact.phone ? (
        <li>
          <a href={telHref(contact.phone)}>
            <Icon icon={Phone} size={16} />
            <span>Call {contact.phone}</span>
          </a>
        </li>
      ) : null}
      {contact.email ? (
        <li>
          <a href={`mailto:${contact.email}`}>
            <Icon icon={Mail} size={16} />
            <span>Email {contact.email}</span>
          </a>
        </li>
      ) : null}
    </ul>
  );
}
