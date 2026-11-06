import { defineSiteContent } from '@profitstudio/booking-engine';

/**
 * What the owner of Copper & Comb can change in the dashboard (/admin/ →
 * Website). The defaults below are the website's own copy: until the owner
 * publishes, visitors see exactly this.
 *
 * Services, prices, durations, opening hours, the address, phone and email are
 * NOT here: they come from the booking engine (dashboard → Services, Hours,
 * Business).
 *
 * To make something new editable: add a field here (id, type, label,
 * default), read it with useContent() where it is rendered, done — the
 * dashboard shows the field automatically (INTEGRATION.md, "Website content").
 */
export const siteContent = defineSiteContent({
  sections: [
    {
      id: 'hero',
      label: 'Hero',
      description: 'The first screen visitors see.',
      fields: [
        { type: 'text', id: 'hero.eyebrow', label: 'Line above the headline', default: 'Hair salon · Portland, Oregon', maxLength: 60 },
        {
          type: 'text',
          id: 'hero.title',
          label: 'Headline',
          default: "The cut you'll still love in",
          maxLength: 70,
          required: true,
          help: 'Shown very large — longer headlines are set a little smaller. The ending follows on its own line.',
        },
        {
          type: 'text',
          id: 'hero.titleEnding',
          label: 'Headline ending (italic)',
          default: 'week six.',
          maxLength: 30,
          help: 'Set on its own line, in the accent colour, in italic.',
        },
        {
          type: 'longText',
          id: 'hero.lede',
          label: 'Introduction',
          default:
            'Cuts, color and styling that start with a proper conversation — and a plan for how your hair grows out, not just how it looks leaving the chair.',
          maxLength: 280,
          rows: 3,
        },
        {
          type: 'image',
          id: 'hero.photo',
          label: 'Hero photo',
          default: { src: '/photos/hero-curls-960.webp', alt: 'Soft caramel curls, half up, finished at the mirror', width: 960, height: 1200 },
          aspectRatio: 4 / 5,
          help: 'Shown in an arched frame, like a salon mirror. An upright photo with soft light works best: hair, hands at work or the salon. The description is also its caption. Remove it to show an ampersand instead.',
        },
        { type: 'text', id: 'hero.cta', label: 'Booking button', default: 'Book an appointment', maxLength: 32, required: true },
        { type: 'text', id: 'hero.secondary', label: 'Link to the prices', default: 'Services & prices', maxLength: 32, required: true },
      ],
    },
    {
      id: 'studio',
      label: 'The studio',
      description: 'The soft band under the menu: your salon, two photos, a quote and how an appointment goes.',
      fields: [
        { type: 'text', id: 'studio.eyebrow', label: 'Small heading', default: 'The studio', maxLength: 60 },
        { type: 'text', id: 'studio.title', label: 'Heading', default: 'Unhurried where it matters.', maxLength: 70, required: true },
        {
          type: 'longText',
          id: 'studio.intro',
          label: 'Introduction',
          default:
            'A small salon on purpose: fewer clients at once, more time with each one, and stylists who would rather ask one more question than guess.',
          maxLength: 400,
          rows: 3,
        },
        {
          type: 'image',
          id: 'studio.photo',
          label: 'Main photo',
          default: { src: '/photos/studio-wide-1600.webp', alt: 'Two cognac chairs, round brass mirrors, late light', width: 1728, height: 1152 },
          aspectRatio: 3 / 2,
          help: 'A wide (landscape) photo fits best — for example the salon floor. The description is also its caption.',
        },
        {
          type: 'image',
          id: 'studio.detailPhoto',
          label: 'Detail photo',
          default: { src: '/photos/salon-arch-864.webp', alt: 'A chandelier and a tall arched mirror in a quiet salon', width: 864, height: 1152 },
          aspectRatio: 3 / 4,
          help: 'Shown in an arched frame. An upright photo works best: a corner of the salon, a mirror, the color bar. The description is also its caption.',
        },
        {
          type: 'text',
          id: 'studio.quote',
          label: 'Quote',
          default: "We'd rather you leave with hair you can live with than a blow-dry you can't repeat.",
          maxLength: 160,
        },
        { type: 'text', id: 'studio.quoteBy', label: 'Quote signature', default: 'The house rule', maxLength: 60 },
        { type: 'text', id: 'studio.stepsTitle', label: 'Steps heading', default: 'How an appointment goes', maxLength: 60 },
        {
          type: 'list',
          id: 'studio.steps',
          label: 'Steps',
          itemLabel: 'Step',
          maxItems: 6,
          fields: [
            { type: 'text', id: 'title', label: 'Step', default: '', maxLength: 40, required: true },
            { type: 'longText', id: 'body', label: 'What happens', default: '', maxLength: 240, rows: 2 },
          ],
          default: [
            {
              title: 'We talk first',
              body: 'We start at the mirror, not the sink: what you love, what bugs you, and how long you really spend on your hair in the morning.',
            },
            {
              title: 'We agree on the price',
              body: "If your service shows a “from” price, you'll hear the final number before we begin. No surprise add-ons.",
            },
            { title: 'We do the work', body: 'Cut, color or both, planned for the grow-out, so it still sits right in week six.' },
            { title: 'We show you how', body: 'A few minutes on styling it at home, with whatever you already own.' },
          ],
        },
      ],
    },
    {
      id: 'team',
      label: 'Stylists',
      description: 'Until you change them, the sample stylists are labelled as placeholders on the website.',
      fields: [
        { type: 'text', id: 'team.title', label: 'Heading', default: 'The stylists', maxLength: 70, required: true },
        {
          type: 'longText',
          id: 'team.intro',
          label: 'Introduction',
          default: "Have a favorite? Mention them in the notes when you book and we'll do our best to pair you up.",
          maxLength: 280,
          rows: 2,
        },
        {
          type: 'list',
          id: 'team.members',
          label: 'Stylists',
          itemLabel: 'Stylist',
          maxItems: 8,
          fields: [
            { type: 'text', id: 'name', label: 'Name', default: '', maxLength: 60, required: true },
            { type: 'text', id: 'role', label: 'Role', default: '', maxLength: 60 },
            { type: 'longText', id: 'bio', label: 'About them', default: '', maxLength: 400, rows: 3 },
            {
              type: 'image',
              id: 'portrait',
              label: 'Portrait',
              default: null,
              aspectRatio: 4 / 5,
              help: 'Shown in an arched frame. Upright, about 4 × 5, of the stylist themself (with their permission). Without one, their initials are shown.',
            },
          ],
          default: [
            {
              name: 'Rosa Delgado',
              role: 'Owner · Color',
              bio: 'Rosa opened the salon to be the place she wanted to sit in. Warm brunettes, soft grow-outs and grey blending that works with your natural shade are her favorite problems to solve.',
              portrait: null,
            },
            {
              name: 'Jun Park',
              role: 'Stylist · Precision cuts',
              bio: 'Jun cuts with the grow-out in mind, checks every line twice, and will tell you honestly when a fringe is a bad idea.',
              portrait: null,
            },
            {
              name: 'Mara Ellis',
              role: 'Stylist · Curls & texture',
              bio: 'Mara works with your curl pattern instead of against it, then shows you a ten-minute routine you will actually keep.',
              portrait: null,
            },
          ],
        },
      ],
    },
    {
      id: 'reviews',
      label: 'Kind words',
      description: 'Only publish real words from real clients, with their permission. Never invent reviews or ratings.',
      fields: [
        {
          type: 'toggle',
          id: 'reviews.real',
          label: 'These are real words from clients, shared with their permission',
          default: false,
          help: 'While this is off, the website labels the quotes as examples.',
        },
        { type: 'text', id: 'reviews.title', label: 'Heading', default: 'Kind words', maxLength: 70, required: true },
        {
          type: 'list',
          id: 'reviews.items',
          label: 'Quotes',
          itemLabel: 'Quote',
          maxItems: 6,
          fields: [
            { type: 'longText', id: 'quote', label: 'Quote', default: '', maxLength: 280, rows: 3, required: true },
            { type: 'text', id: 'detail', label: 'Who / what (e.g. “Ana · color”)', default: '', maxLength: 60 },
          ],
          default: [
            { quote: 'Six weeks later it still falls the way it did when I walked out.', detail: 'After a cut & style' },
            { quote: 'They told me the price before they started — and that was the price.', detail: 'After a full color' },
            { quote: 'I left knowing how to do it myself the next morning.', detail: 'After a blow-dry & style' },
          ],
        },
      ],
    },
    {
      id: 'faq',
      label: 'Questions',
      description: 'Short answers to what clients ask most. Remove every question to hide this part.',
      fields: [
        { type: 'text', id: 'faq.title', label: 'Heading', default: 'Good to know', maxLength: 70, required: true },
        {
          type: 'list',
          id: 'faq.items',
          label: 'Questions and answers',
          itemLabel: 'Question',
          maxItems: 10,
          fields: [
            { type: 'text', id: 'question', label: 'Question', default: '', maxLength: 120, required: true },
            { type: 'longText', id: 'answer', label: 'Answer', default: '', maxLength: 600, rows: 3, required: true },
          ],
          default: [
            {
              question: 'How does booking online work?',
              answer: 'Choose a service, a day and a time. We email you a 6-digit code to confirm it’s you, and hold the time while you enter it. It takes a few minutes, and no payment is taken.',
            },
            {
              question: 'What if I need to change my appointment?',
              answer: 'Call or email us as soon as you know (the details are at the bottom of this page) and we will find you another time.',
            },
            {
              question: 'How do you price color?',
              answer: 'Color prices start where the menu says “from”. We confirm the final price with you at the mirror before we begin — no surprises.',
            },
            {
              question: 'Do you work with curly and textured hair?',
              answer: 'Yes. Book a cut & style and mention your curls in the notes — we will make sure you get a stylist who loves them.',
            },
          ],
        },
      ],
    },
    {
      id: 'visit',
      label: 'Visit',
      description: 'Opening hours, address and phone come from Business and Hours & closures.',
      fields: [
        {
          type: 'image',
          id: 'visit.photo',
          label: 'Storefront photo',
          default: { src: '/photos/storefront-1600.webp', alt: 'The espresso-painted shopfront on a tree-lined street', width: 1728, height: 1152 },
          aspectRatio: 3 / 2,
          help: 'Helps first-time clients recognise the door. A wide photo from across the street works best. The description is also its caption.',
        },
      ],
    },
    {
      id: 'brand',
      label: 'Brand',
      description: 'Colours, headings and logo — always within the website’s own design.',
      fields: [
        {
          type: 'color',
          id: 'brand.accentLight',
          label: 'Accent on light backgrounds',
          default: '#98463f',
          contrastWith: '#f8f2ee',
          minContrast: 4.5,
          help: 'The italic headline endings, section numbers, durations, small labels and the menu’s Book buttons on the light background. Deeper shades read best.',
        },
        {
          type: 'color',
          id: 'brand.accentDark',
          label: 'Accent on dark backgrounds',
          default: '#e7a99b',
          contrastWith: '#2e1c1e',
          minContrast: 4.5,
          help: 'The same touches on the dark booking band at the foot of the page. Lighter shades read best.',
        },
        {
          type: 'choice',
          id: 'brand.headings',
          label: 'Heading style',
          default: 'serif',
          options: [
            { value: 'serif', label: 'Beauty editorial — Bodoni Moda', description: 'High-contrast serif headings, like a beauty magazine (the original design).' },
            { value: 'sans', label: 'Modern — Jost', description: 'Light geometric headings; the italic endings stay in the serif.' },
          ],
        },
        {
          type: 'image',
          id: 'brand.logo',
          label: 'Logo (optional)',
          default: null,
          help: 'Replaces the written name in the header, footer and booking pages, shown about 28 px tall. A wide logo on a transparent background works best.',
        },
      ],
    },
    {
      id: 'search',
      label: 'Search & sharing',
      description:
        'How the website appears in search results and link previews. The browser tab changes at once; search engines and link previews show the new text after the website is next deployed.',
      fields: [
        { type: 'text', id: 'seo.title', label: 'Page title', default: 'Copper & Comb · Hair salon in Portland, Oregon', maxLength: 70, required: true },
        {
          type: 'longText',
          id: 'seo.description',
          label: 'Description',
          default:
            'Copper & Comb is a neighborhood hair salon in Portland, Oregon. Cuts, color and styling — see services and prices and book an appointment online.',
          maxLength: 160,
          rows: 2,
          required: true,
        },
      ],
    },
  ],
});

export type SiteContent = typeof siteContent;
