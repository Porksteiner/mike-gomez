/**
 * BLOCK REGISTRY — central map from block type → Astro component.
 *
 * Pages are composed in JSON (src/data/pages/*.json) as ordered lists of
 * blocks. The RenderBlocks component reads a block array and dispatches
 * each one to its registered component.
 *
 * Two block flavors:
 *
 *   - SINGLETON blocks (header, hero, footer, work, faq, contact, how-i-work,
 *     creation) — one instance per site, pull their content from their own
 *     data file (src/data/{name}.json). They ignore inline data.
 *
 *   - PRESET blocks (divider, marquee, stats, etc.) — multi-instance.
 *     Their content lives inline in the page JSON, under `data`.
 *
 * Each block also accepts:
 *   - `id`        — stable identifier used by Studio for selection / save
 *   - `effects`   — optional array of scroll-effect keys applied to the block
 */

import Header from "../components/Header.astro";
import Hero from "../components/Hero.astro";
import CreationOfAdam from "../components/CreationOfAdam.astro";
import Work from "../components/Work.astro";
import HowIWork from "../components/HowIWork.astro";
import FAQ from "../components/FAQ.astro";
import Contact from "../components/Contact.astro";
import Footer from "../components/Footer.astro";
import Divider from "../components/blocks/Divider.astro";
import Marquee from "../components/blocks/Marquee.astro";
import Stats from "../components/blocks/Stats.astro";
import CTA from "../components/blocks/CTA.astro";
import LogoCloud from "../components/blocks/LogoCloud.astro";
import ImageText from "../components/blocks/ImageText.astro";
import PullQuote from "../components/blocks/PullQuote.astro";
import Gallery from "../components/blocks/Gallery.astro";
import RichHero from "../components/blocks/RichHero.astro";

export type BlockKind = "singleton" | "preset";

export interface BlockMeta {
  /** Component to render */
  component: any;
  /** Human label shown in Studio sidebar */
  label: string;
  /** Studio category for grouping in the Add Block library */
  category:
    | "Structure"
    | "Hero"
    | "Content"
    | "Marketing"
    | "Media"
    | "Social proof";
  /** Singleton or preset (multi-instance) */
  kind: BlockKind;
  /** Default data shape for new instances (preset blocks only) */
  defaults?: Record<string, any>;
  /** Inspector field schema (preset blocks only) */
  fields?: InspectorField[];
}

export interface InspectorField {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "richtext"
    | "url"
    | "color"
    | "image"
    | "list"
    | "select"
    | "number"
    | "boolean";
  /** For select fields */
  options?: string[];
  /** For list fields — the per-item subfields */
  itemFields?: InspectorField[];
  /** Inline hint text in Studio */
  hint?: string;
  /** Default value */
  default?: any;
}

export const BLOCKS: Record<string, BlockMeta> = {
  /* ------- Singletons (pre-existing sections) ------- */
  header: {
    component: Header,
    label: "Site Header",
    category: "Structure",
    kind: "singleton",
  },
  hero: {
    component: Hero,
    label: "Hero (main)",
    category: "Hero",
    kind: "singleton",
  },
  creation: {
    component: CreationOfAdam,
    label: "Creation Moment",
    category: "Hero",
    kind: "singleton",
  },
  work: {
    component: Work,
    label: "Work / Projects",
    category: "Content",
    kind: "singleton",
  },
  "how-i-work": {
    component: HowIWork,
    label: "How I Work",
    category: "Content",
    kind: "singleton",
  },
  faq: {
    component: FAQ,
    label: "FAQ",
    category: "Content",
    kind: "singleton",
  },
  contact: {
    component: Contact,
    label: "Contact",
    category: "Marketing",
    kind: "singleton",
  },
  footer: {
    component: Footer,
    label: "Site Footer",
    category: "Structure",
    kind: "singleton",
  },

  /* ------- Presets (multi-instance) ------- */
  divider: {
    component: Divider,
    label: "Section Divider",
    category: "Structure",
    kind: "preset",
    defaults: { label: "Section break" },
    fields: [
      { name: "label", label: "Label", type: "text", default: "Section break" },
    ],
  },
  marquee: {
    component: Marquee,
    label: "Marquee Strip",
    category: "Content",
    kind: "preset",
    defaults: {
      words: ["DESIGN", "DEVELOPMENT", "DEPLOYMENT", "DELIGHT"],
      separator: "✦",
      speed: 40,
      direction: "left",
      style: "outline",
    },
    fields: [
      {
        name: "words",
        label: "Words",
        type: "list",
        itemFields: [{ name: "text", label: "Word", type: "text" }],
        hint: "Each word will be repeated across the marquee.",
      },
      { name: "separator", label: "Separator glyph", type: "text", default: "✦" },
      {
        name: "speed",
        label: "Speed (seconds for one loop)",
        type: "number",
        default: 40,
      },
      {
        name: "direction",
        label: "Direction",
        type: "select",
        options: ["left", "right"],
        default: "left",
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        options: ["solid", "outline", "gold", "gold-outline"],
        default: "outline",
      },
    ],
  },
  stats: {
    component: Stats,
    label: "Stats Row",
    category: "Marketing",
    kind: "preset",
    defaults: {
      heading: "By the numbers.",
      items: [
        { value: "12+", label: "Years shipping" },
        { value: "40", label: "Projects launched" },
        { value: "100%", label: "Hand-coded" },
        { value: "0", label: "Outsourced lines" },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "items",
        label: "Stats",
        type: "list",
        itemFields: [
          { name: "value", label: "Big number / value", type: "text" },
          { name: "label", label: "Small label", type: "text" },
        ],
      },
    ],
  },
  cta: {
    component: CTA,
    label: "Call to Action",
    category: "Marketing",
    kind: "preset",
    defaults: {
      eyebrow: "Ready to build?",
      headline: "Let's start with a 30-min call.",
      buttonLabel: "Book a call",
      buttonHref: "#contact",
      buttonStyle: "primary",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "buttonLabel", label: "Button label", type: "text" },
      { name: "buttonHref", label: "Button URL", type: "url" },
      {
        name: "buttonStyle",
        label: "Button style",
        type: "select",
        options: ["primary", "ghost", "gold"],
        default: "primary",
      },
    ],
  },
  "logo-cloud": {
    component: LogoCloud,
    label: "Logo Cloud",
    category: "Social proof",
    kind: "preset",
    defaults: {
      heading: "Trusted by",
      logos: [
        { label: "Acme Co.", href: "" },
        { label: "Stripe", href: "" },
        { label: "Linear", href: "" },
        { label: "Vercel", href: "" },
        { label: "Notion", href: "" },
      ],
    },
    fields: [
      { name: "heading", label: "Section heading", type: "text" },
      {
        name: "logos",
        label: "Logos / brands",
        type: "list",
        itemFields: [
          { name: "label", label: "Brand name", type: "text" },
          { name: "href", label: "Link (optional)", type: "url" },
        ],
      },
    ],
  },
  "image-text": {
    component: ImageText,
    label: "Image + Text",
    category: "Content",
    kind: "preset",
    defaults: {
      eyebrow: "Feature",
      heading: "A thoughtful headline.",
      body: "A short paragraph explaining the feature, the value, or the story.",
      image: "/projects/baitiq-marketing.png",
      side: "right",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "textarea" },
      { name: "body", label: "Body copy", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
      {
        name: "side",
        label: "Image side",
        type: "select",
        options: ["left", "right"],
        default: "right",
      },
    ],
  },
  "pull-quote": {
    component: PullQuote,
    label: "Pull Quote",
    category: "Content",
    kind: "preset",
    defaults: {
      quote: "Care in the work. Care in the conversation.",
      attribution: "",
    },
    fields: [
      { name: "quote", label: "Quote", type: "textarea" },
      { name: "attribution", label: "Attribution (optional)", type: "text" },
    ],
  },
  gallery: {
    component: Gallery,
    label: "Image Gallery",
    category: "Media",
    kind: "preset",
    defaults: {
      heading: "Selected work.",
      images: [
        { src: "/projects/baitiq-marketing.png", alt: "BaitIQ" },
        { src: "/projects/unlearn-marketing.png", alt: "Unlearn" },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "images",
        label: "Images",
        type: "list",
        itemFields: [
          { name: "src", label: "Image", type: "image" },
          { name: "alt", label: "Alt text", type: "text" },
        ],
      },
    ],
  },
  "rich-hero": {
    component: RichHero,
    label: "Rich Hero (preset)",
    category: "Hero",
    kind: "preset",
    defaults: {
      eyebrow: "Studio",
      headline: "A new beginning.",
      sub: "Two-line subhead introducing what this section is about.",
      ctaLabel: "Get started",
      ctaHref: "#",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "sub", label: "Subhead", type: "textarea" },
      { name: "ctaLabel", label: "CTA label", type: "text" },
      { name: "ctaHref", label: "CTA URL", type: "url" },
    ],
  },
};

/** Scroll effects available to wrap any block */
export const EFFECTS = {
  parallax: { label: "Parallax background", hint: "Background image drifts slower than scroll" },
  pin: { label: "Pin & scrub", hint: "Block pins to viewport while inner state scrubs" },
  staircase: { label: "Reveal staircase", hint: "Children fade in one at a time" },
  "fade-up": { label: "Fade up", hint: "Whole block translates and fades up on enter" },
  mask: { label: "Image mask reveal", hint: "Block image clips open as it enters" },
  counter: { label: "Number counter", hint: "Stat-style numbers count up on enter" },
} as const;

export type EffectKey = keyof typeof EFFECTS;

export interface BlockInstance {
  id: string;
  type: keyof typeof BLOCKS;
  data?: Record<string, any>;
  effects?: EffectKey[];
}

export interface PageDoc {
  title?: string;
  blocks: BlockInstance[];
}
