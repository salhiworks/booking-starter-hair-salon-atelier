import type { Service } from '@profitstudio/booking-engine';

/**
 * Website-side presentation only: the engine has no service categories, so the
 * menu groups the owner's services by keywords in their names. Services keep
 * the owner's display order inside each group, and groups appear in the order
 * their first service does. Anything unmatched lands in "Also on the menu".
 */
export interface ServiceGroup {
  id: 'cuts' | 'color' | 'styling' | 'more';
  title: string;
  blurb: string;
  services: Service[];
}

const RULES: Array<{ id: ServiceGroup['id']; title: string; blurb: string; test: RegExp }> = [
  {
    id: 'color',
    title: 'Color',
    blurb: 'From a root refresh to hand-painted light.',
    test: /colou?r|balayage|highlight|lowlight|gloss|toner|bleach|ombr|root/i,
  },
  {
    id: 'cuts',
    title: 'Cuts',
    blurb: 'Shaped for how your hair grows, not just how it leaves.',
    test: /cut|trim|fade|clipper|fringe|bang|shave|beard/i,
  },
  {
    id: 'styling',
    title: 'Styling & treatments',
    blurb: 'Blow-dries, finishing and a little repair.',
    test: /blow|style|styling|treatment|condition|mask|updo|braid|wave|curl|finish|scalp/i,
  },
];

const FALLBACK = { id: 'more' as const, title: 'Also on the menu', blurb: 'Everything else we offer.' };

export function groupServices(services: Service[]): ServiceGroup[] {
  const groups = new Map<ServiceGroup['id'], ServiceGroup>();
  for (const service of services) {
    const rule = RULES.find((r) => r.test.test(service.name)) ?? FALLBACK;
    let group = groups.get(rule.id);
    if (!group) {
      group = { id: rule.id, title: rule.title, blurb: rule.blurb, services: [] };
      groups.set(rule.id, group);
    }
    group.services.push(service);
  }
  return [...groups.values()];
}
