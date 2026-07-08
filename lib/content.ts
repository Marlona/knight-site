/**
 * Single source of truth for all site copy and data.
 * Sections render this data — swapping assets or copy never touches components.
 *
 * TODO client-confirm: stats values, project case studies, testimonial
 * attributions, and footer contact details are tasteful placeholders awaiting
 * Andrea's real numbers/links. See README "Content TODOs".
 */

export const site = {
  person: "Andrea Knight",
  studio: "Knight & Ember",
  tagline: "Designing Spaces That Inspire. Managing Properties That Perform.",
  description:
    "Knight & Ember is the hospitality-focused design studio of Andrea Knight — luxury interior design, property management, Airbnb co-hosting, and short-term rental strategy that turns ordinary properties into destinations people remember.",
  url: "https://knightandember.com",
};

export type Chapter = {
  index: string;
  title: string;
  sequence: "visionary" | "designer" | "host" | "operator";
};

export const chapters: Record<string, Chapter> = {
  visionary: { index: "01", title: "The Visionary", sequence: "visionary" },
  designer: { index: "02", title: "The Designer", sequence: "designer" },
  host: { index: "03", title: "The Host", sequence: "host" },
  operator: { index: "04", title: "The Operator", sequence: "operator" },
};

export const hero = {
  chapter: chapters.visionary,
  headline: ["Designing Spaces", "That Inspire.", "Managing Properties", "That Perform."],
  services: [
    "Interior Design",
    "Property Management",
    "Airbnb Co-Hosting",
    "Short-Term Rental Strategy",
  ],
  scrollCue: "Scroll to begin the tour",
};

export type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

// TODO client-confirm: occupancy % and years of experience are placeholders.
export const stats: Stat[] = [
  { value: 100, suffix: "+", label: "Rooms Designed" },
  { value: 50, suffix: "+", label: "Properties Managed" },
  { value: 1000, suffix: "+", label: "Happy Guests" },
  { value: 4.95, decimals: 2, suffix: "★", label: "Average Rating" },
  { value: 94, suffix: "%", label: "Occupancy" },
  { value: 8, suffix: "+", label: "Years Experience" },
];

export const about = {
  chapter: chapters.designer,
  lines: [
    "Every room tells a story.",
    "Great design creates unforgettable experiences.",
    "Beautiful spaces should also perform.",
  ],
  bio: "I help homeowners and investors transform ordinary spaces into beautiful, profitable properties that guests remember. Every project begins with the people who will use it and the story the space is meant to tell — then creativity, functionality, and business insight deliver environments that are both beautiful and purposeful.",
  signature: "Andrea Knight — Founder, Knight & Ember",
};

export type Service = {
  index: string;
  title: string;
  intro: string;
  items: string[];
};

export const services: Service[] = [
  {
    index: "01",
    title: "Interior Design",
    intro: "Elevated interiors rooted in how a space should feel — not just how it looks.",
    items: [
      "Luxury residential interiors",
      "Space planning",
      "Furniture selection",
      "Color palettes",
      "Renovations",
      "Styling",
    ],
  },
  {
    index: "02",
    title: "Property Management",
    intro: "Calm, systemized operations that protect your asset and your time.",
    items: [
      "Day-to-day operations",
      "Maintenance coordination",
      "Vendor management",
      "Owner reporting",
      "Tenant communication",
    ],
  },
  {
    index: "03",
    title: "Airbnb Co-Hosting",
    intro: "Five-star guest experiences, engineered end to end.",
    items: [
      "Guest messaging",
      "Cleaning coordination",
      "Listing optimization",
      "Dynamic pricing",
      "Calendar management",
      "Five-star guest experience",
    ],
  },
  {
    index: "04",
    title: "Short-Term Rental Consulting",
    intro: "From acquisition to automation — launch properties built to perform.",
    items: [
      "Investment strategy",
      "Property launch",
      "Revenue optimization",
      "Furnishing guidance",
      "Automation systems",
      "Operational setup",
    ],
  },
];

export const hostInterlude = {
  chapter: chapters.host,
  kicker: "Hospitality, choreographed",
  line: "Five-star stays, engineered.",
  copy: "Lights on. Doors unlocked. Welcome basket waiting. Every arrival is staged like an opening scene.",
};

export type Project = {
  slug: string;
  name: string;
  location: string;
  type: string;
  description: string;
  result: string;
  image: string;
  imageBefore?: string;
};

// TODO client-confirm: sample case studies for layout — replace with Andrea's
// real projects, photography, and results before launch.
export const projects: Project[] = [
  {
    slug: "ember-suite",
    name: "The Ember Suite",
    location: "Atlanta, GA",
    type: "Luxury Short-Term Rental",
    description:
      "A dated duplex reimagined as a moody, amber-lit retreat with a chef's kitchen and spa bath.",
    result: "+82% nightly revenue after redesign",
    image: "/images/projects/ember-suite.webp",
    imageBefore: "/images/projects/ember-suite-before.webp",
  },
  {
    slug: "willow-vine",
    name: "Willow & Vine",
    location: "Nashville, TN",
    type: "Residential Interior",
    description:
      "A full-home redesign balancing timeless southern warmth with clean, modern lines.",
    result: "Featured neighborhood home tour",
    image: "/images/projects/willow-vine.webp",
    imageBefore: "/images/projects/willow-vine-before.webp",
  },
  {
    slug: "gathering-house",
    name: "The Gathering House",
    location: "Charlotte, NC",
    type: "Boutique Airbnb",
    description:
      "An entertainer's floor plan tuned for group stays — bunk suites, games lounge, long-table dining.",
    result: "96% occupancy in first season",
    image: "/images/projects/gathering-house.webp",
    imageBefore: "/images/projects/gathering-house-before.webp",
  },
  {
    slug: "maison-noir",
    name: "Maison Noir",
    location: "Savannah, GA",
    type: "Restaurant Concept",
    description:
      "Front-of-house concept and finishes for an intimate 40-seat dining room in the historic district.",
    result: "Opened at full reservations",
    image: "/images/projects/maison-noir.webp",
  },
  {
    slug: "canopy-loft",
    name: "The Canopy Loft",
    location: "Asheville, NC",
    type: "STR Transformation",
    description:
      "A dim attic loft opened into a light-wrapped canopy suite with treetop views.",
    result: "Airbnb Guest Favorite badge",
    image: "/images/projects/canopy-loft.webp",
    imageBefore: "/images/projects/canopy-loft-before.webp",
  },
  {
    slug: "hearth-haven",
    name: "Hearth & Haven",
    location: "Blue Ridge, GA",
    type: "Mountain Retreat",
    description:
      "A cabin refresh built around one oversized hearth moment and layered natural textures.",
    result: "Revenue doubled year-over-year",
    image: "/images/projects/hearth-haven.webp",
  },
];

export const transformation = {
  kicker: "Before / After",
  headline: "Drag to reveal the transformation.",
  before: { src: "/images/before-after/shell.webp", label: "Before — empty shell" },
  after: { src: "/images/before-after/staged.webp", label: "After — Knight & Ember" },
};

export type Testimonial = { quote: string; attribution: string };

// TODO client-confirm: attributions are placeholders.
export const testimonials: Testimonial[] = [
  {
    quote: "Our home feels like a five-star resort.",
    attribution: "Homeowner, Atlanta",
  },
  {
    quote: "Our Airbnb revenue doubled after the redesign.",
    attribution: "STR Investor, Nashville",
  },
  {
    quote: "The entire process was seamless.",
    attribution: "Property Owner, Charlotte",
  },
];

export const finalCta = {
  chapter: chapters.operator,
  headline: "Let's Transform Your Property.",
  copy: "Beautiful spaces, run like businesses. Tell me about your property and let's design what it could become.",
  primary: { label: "Schedule a Consultation", href: "mailto:hello@knightandember.com" }, // TODO client-confirm
  secondary: { label: "View My Portfolio", target: "#showcase" },
};

// TODO client-confirm: all links and contact details below are placeholders.
export const footer = {
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Pinterest", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Airbnb Profile", href: "#" },
  ],
  email: "hello@knightandember.com",
  phone: "+1 (000) 000-0000",
  copyright: `© ${new Date().getFullYear()} Knight & Ember. All rights reserved.`,
  mission:
    "Grounded by faith, resilience, and a genuine love for creating meaningful spaces.",
};
