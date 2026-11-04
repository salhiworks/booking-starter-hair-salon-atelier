import { createContext, use } from 'react';

/** The numbered sections, in page order (the hero and the booking call to action are not numbered). */
export type SectionId = 'services' | 'studio' | 'team' | 'kind-words' | 'questions' | 'visit';

export const SECTION_NAMES: Record<SectionId, string> = {
  services: 'Services & prices',
  studio: 'The studio',
  team: 'Team',
  'kind-words': 'Kind words',
  questions: 'Questions',
  visit: 'Visit',
};

/** Which numbered sections are on the page: a section the owner emptied disappears and the numbers close up. */
export const SectionsContext = createContext<SectionId[]>([]);

export function useSections(): SectionId[] {
  return use(SectionsContext);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** "II." for the second section on the page. */
export function useSectionNumber(id: SectionId): string {
  const index = use(SectionsContext).indexOf(id);
  return index >= 0 ? `${ROMAN[index]}.` : '';
}
