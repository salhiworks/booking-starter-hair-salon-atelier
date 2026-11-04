import type { ReactNode, Ref } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { Business, Service } from '@profitstudio/booking-engine';
import { Icon } from '../components/Icon';
import { ContactLinks, Notice } from '../components/Notice';
import { formatDuration, priceParts } from '../lib/format';
import { groupServices } from '../lib/serviceGroups';
import { StepHeading } from './parts';

/** Step 1: the menu again, as choices. Services, prices and lengths are the engine's. */
export function ServiceStep({
  business,
  services,
  selectedId,
  headingRef,
  notice,
  onChoose,
}: {
  business: Business;
  services: Service[];
  selectedId: string | null;
  headingRef: Ref<HTMLHeadingElement>;
  notice: ReactNode;
  onChoose: (serviceId: string) => void;
}) {
  const { locale } = business;
  return (
    <div className="step step--service">
      <StepHeading
        ref={headingRef}
        step="service"
        ending="do for you?"
        aside={<p className="step-head__note">Prices are the salon's own. Nothing is paid online.</p>}
      >
        What can we
      </StepHeading>
      {notice}
      {services.length === 0 ? (
        <Notice title="No services can be booked online right now">
          <p>Please call or email the salon to make an appointment.</p>
          <ContactLinks contact={business.contact} />
        </Notice>
      ) : (
        <div className="pick-groups">
          {groupServices(services).map((group) => (
            <section className="pick-group" key={group.id} aria-labelledby={`pick-${group.id}`}>
              <h3 className="pick-group__title" id={`pick-${group.id}`}>
                {group.title}
              </h3>
              <ul className="pick-list">
                {group.services.map((service) => {
                  const price = priceParts(service, locale);
                  const selected = service.id === selectedId;
                  return (
                    <li key={service.id}>
                      <button type="button" className="pick" aria-pressed={selected} onClick={() => onChoose(service.id)}>
                        <span className="pick__line">
                          <span className="pick__name">{service.name}</span>
                          <span className="pick__leader" aria-hidden="true" />
                          <span className="pick__price">
                            {price.amount === null ? (
                              <i>on request</i>
                            ) : (
                              <>
                                {price.from ? <i>from </i> : null}
                                {price.amount}
                              </>
                            )}
                          </span>
                        </span>
                        <span className="pick__meta">
                          <span className="pick__dur">{formatDuration(service.durationMinutes)}</span>
                          {service.description ? <span className="pick__desc">{service.description}</span> : null}
                        </span>
                        <span className="pick__go" aria-hidden="true">
                          <Icon icon={selected ? Check : ArrowRight} size={18} weight={selected ? 1.6 : 1.2} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
