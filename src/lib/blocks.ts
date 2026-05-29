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
import Spacer from "../components/blocks/Spacer.astro";
import CenteredHero from "../components/blocks/CenteredHero.astro";
import CinematicHero from "../components/blocks/CinematicHero.astro";
import BentoGrid from "../components/blocks/BentoGrid.astro";
import PricingTable from "../components/blocks/PricingTable.astro";
import Newsletter from "../components/blocks/Newsletter.astro";
import Timeline from "../components/blocks/Timeline.astro";
import BigQuote from "../components/blocks/BigQuote.astro";
import VideoEmbed from "../components/blocks/VideoEmbed.astro";
import NumberedSteps from "../components/blocks/NumberedSteps.astro";
import FeatureGrid from "../components/blocks/FeatureGrid.astro";

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
  spacer: {
    component: Spacer,
    label: "Spacer",
    category: "Structure",
    kind: "preset",
    defaults: { height: "120px" },
    fields: [
      { name: "height", label: "Height (CSS units)", type: "text", hint: "e.g. 80px, 12vh, 6rem", default: "120px" },
    ],
  },
  "centered-hero": {
    component: CenteredHero,
    label: "Centered Hero",
    category: "Hero",
    kind: "preset",
    defaults: {
      eyebrow: "Eyebrow",
      headline: "A confident, centered statement.",
      sub: "Two-line subhead expanding on the headline.",
      ctaLabel: "Primary CTA",
      ctaHref: "#",
      secondaryLabel: "Secondary",
      secondaryHref: "#",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "sub", label: "Subhead", type: "textarea" },
      { name: "ctaLabel", label: "Primary CTA label", type: "text" },
      { name: "ctaHref", label: "Primary CTA URL", type: "url" },
      { name: "secondaryLabel", label: "Secondary CTA label", type: "text" },
      { name: "secondaryHref", label: "Secondary CTA URL", type: "url" },
    ],
  },
  "cinematic-hero": {
    component: CinematicHero,
    label: "Cinematic Hero",
    category: "Hero",
    kind: "preset",
    defaults: {
      eyebrow: "",
      headline: "A cinematic moment.",
      sub: "Background-aware — set the block's style.bgImage in the Style tab.",
      ctaLabel: "Get started",
      ctaHref: "#",
      align: "bottom",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline", type: "textarea" },
      { name: "sub", label: "Subhead", type: "textarea" },
      { name: "ctaLabel", label: "CTA label", type: "text" },
      { name: "ctaHref", label: "CTA URL", type: "url" },
      { name: "align", label: "Content alignment", type: "select", options: ["bottom", "left", "center"], default: "bottom" },
    ],
  },
  bento: {
    component: BentoGrid,
    label: "Bento Grid",
    category: "Content",
    kind: "preset",
    defaults: {
      heading: "What we do.",
      tiles: [
        { title: "Design", body: "Brand systems, identity, and editorial design.", span: "2" },
        { title: "Build", body: "Custom Astro and React apps.", span: "1" },
        { title: "Ship", body: "Production deploys, CI, and monitoring.", span: "1" },
        { title: "Care", body: "30 days of post-launch support included.", span: "2" },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "tiles", label: "Tiles", type: "list",
        itemFields: [
          { name: "title", label: "Title", type: "text" },
          { name: "body", label: "Body", type: "textarea" },
          { name: "image", label: "Background image", type: "image" },
          { name: "span", label: "Column span", type: "select", options: ["1", "2", "3"], default: "1" },
        ],
      },
    ],
  },
  "pricing-table": {
    component: PricingTable,
    label: "Pricing Table",
    category: "Marketing",
    kind: "preset",
    defaults: {
      heading: "Simple pricing.",
      tiers: [
        { name: "Starter", price: "$3k", period: "project", description: "For small landing pages.", features: ["3 pages", "Astro + Tailwind", "30-day support"], ctaLabel: "Start small", ctaHref: "#" },
        { name: "Studio", price: "$10k", period: "project", description: "Full marketing site builds.", features: ["10 pages", "Custom design", "CMS setup", "30-day support"], ctaLabel: "Book the studio", ctaHref: "#", featured: true },
        { name: "Custom", price: "Let's talk", description: "Apps, ecom, complex builds.", features: ["Discovery first", "Quoted to scope", "Long-term partnership"], ctaLabel: "Book a call", ctaHref: "#" },
      ],
    },
    fields: [
      { name: "heading", label: "Section heading", type: "text" },
      {
        name: "tiers", label: "Tiers", type: "list",
        itemFields: [
          { name: "name", label: "Tier name", type: "text" },
          { name: "price", label: "Price", type: "text" },
          { name: "period", label: "Period (per month, project…)", type: "text" },
          { name: "description", label: "Short description", type: "textarea" },
          { name: "features", label: "Features", type: "list", itemFields: [{ name: "_", label: "Feature", type: "text" }] },
          { name: "ctaLabel", label: "Button label", type: "text" },
          { name: "ctaHref", label: "Button URL", type: "url" },
          { name: "featured", label: "Highlighted as 'Most popular'", type: "boolean" },
        ],
      },
    ],
  },
  newsletter: {
    component: Newsletter,
    label: "Newsletter Signup",
    category: "Marketing",
    kind: "preset",
    defaults: {
      eyebrow: "Newsletter",
      heading: "Stay in the loop.",
      sub: "One short note a month. No spam, no nonsense.",
      placeholder: "you@yourdomain.com",
      buttonLabel: "Subscribe",
      formAction: "",
      note: "Unsubscribe whenever.",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "sub", label: "Subhead", type: "textarea" },
      { name: "placeholder", label: "Input placeholder", type: "text" },
      { name: "buttonLabel", label: "Button label", type: "text" },
      { name: "formAction", label: "Form action URL (POST)", type: "url" },
      { name: "note", label: "Footnote", type: "text" },
    ],
  },
  timeline: {
    component: Timeline,
    label: "Timeline",
    category: "Content",
    kind: "preset",
    defaults: {
      heading: "Our story.",
      items: [
        { date: "2024", title: "First commit.", body: "We start with a domain and a sketch on a napkin." },
        { date: "2025", title: "Public beta.", body: "Real users, real bugs, real feedback. We move fast." },
        { date: "2026", title: "v1.0 ships.", body: "A version we're proud of, sent to the world." },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "items", label: "Events", type: "list",
        itemFields: [
          { name: "date", label: "Date / period", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "body", label: "Body", type: "textarea" },
        ],
      },
    ],
  },
  "big-quote": {
    component: BigQuote,
    label: "Big Quote",
    category: "Social proof",
    kind: "preset",
    defaults: {
      quote: "The best work I've seen in years.",
      attribution: "Jane Customer",
      attributionTitle: "CEO, Acme Co.",
      image: "",
    },
    fields: [
      { name: "quote", label: "Quote", type: "textarea" },
      { name: "attribution", label: "Person", type: "text" },
      { name: "attributionTitle", label: "Title / company", type: "text" },
      { name: "image", label: "Avatar image", type: "image" },
    ],
  },
  "video-embed": {
    component: VideoEmbed,
    label: "Video Embed",
    category: "Media",
    kind: "preset",
    defaults: {
      heading: "",
      sub: "",
      embedUrl: "",
      aspect: "16/9",
    },
    fields: [
      { name: "heading", label: "Heading (optional)", type: "text" },
      { name: "sub", label: "Subhead (optional)", type: "textarea" },
      { name: "embedUrl", label: "YouTube or Vimeo URL", type: "url" },
      { name: "aspect", label: "Aspect ratio", type: "select", options: ["16/9", "4/3", "1/1", "9/16"], default: "16/9" },
    ],
  },
  "numbered-steps": {
    component: NumberedSteps,
    label: "Numbered Steps",
    category: "Content",
    kind: "preset",
    defaults: {
      heading: "How it works.",
      steps: [
        { title: "Tell us about it.", body: "A short call. We learn what you're building." },
        { title: "Get a quote.", body: "Fixed price, fixed timeline, written within 24 hours." },
        { title: "We build.", body: "Weekly demos. Direct line for anything in between." },
        { title: "Ship + stay close.", body: "30 days of post-launch support included." },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "steps", label: "Steps", type: "list",
        itemFields: [
          { name: "title", label: "Title", type: "text" },
          { name: "body", label: "Body", type: "textarea" },
        ],
      },
    ],
  },
  "feature-grid": {
    component: FeatureGrid,
    label: "Feature Grid",
    category: "Content",
    kind: "preset",
    defaults: {
      heading: "Built to last.",
      intro: "A short paragraph introducing the feature set.",
      columns: 3,
      features: [
        { icon: "◆", title: "Solid foundation", body: "Decisions that compound." },
        { icon: "✦", title: "Beautiful by default", body: "Editorial typography, careful spacing." },
        { icon: "◇", title: "Fast forever", body: "Static-first, server-rendered when needed." },
        { icon: "✶", title: "Accessible", body: "Keyboard, screen reader, contrast — handled." },
        { icon: "◉", title: "Maintainable", body: "Clean code, good docs, no lock-in." },
        { icon: "✺", title: "Yours to keep", body: "Hand-off all source on day one." },
      ],
    },
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "columns", label: "Columns", type: "select", options: ["2", "3", "4"], default: "3" },
      {
        name: "features", label: "Features", type: "list",
        itemFields: [
          { name: "icon", label: "Icon / glyph", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "body", label: "Body", type: "textarea" },
        ],
      },
    ],
  },
};

/** Scroll effects available to wrap any block */
export const EFFECTS = {
  parallax: { label: "Parallax (content)", hint: "Block content drifts slower than scroll" },
  "bg-parallax": { label: "Parallax (background)", hint: "Background image drifts on scroll" },
  pin: { label: "Pin & scrub", hint: "Block pins to viewport while content scrolls" },
  staircase: { label: "Reveal staircase", hint: "Children fade in one at a time" },
  "fade-up": { label: "Fade up", hint: "Whole block translates and fades up on enter" },
  "zoom-in": { label: "Zoom in", hint: "Block scales up subtly on enter" },
  mask: { label: "Image mask reveal", hint: "Block clip-path opens from center" },
  counter: { label: "Number counter", hint: "Numeric values count up on enter" },
  tilt: { label: "Mouse tilt", hint: "Block rotates subtly toward the cursor" },
  glow: { label: "Soft glow", hint: "Subtle outer glow on hover" },
} as const;

export type EffectKey = keyof typeof EFFECTS;

export interface BlockStyle {
  /** Background color (CSS color or var()) */
  bgColor?: string;
  /** Background image URL (typically /uploads/x.jpg) */
  bgImage?: string;
  /** Background CSS color with alpha, layered over the image */
  bgOverlay?: string;
  /** Background-size */
  bgSize?: "cover" | "contain" | "auto" | string;
  /** Background-position */
  bgPosition?: string;
  /** Fixed background (parallax) */
  bgFixed?: boolean;
  /** Top padding override */
  padTop?: string;
  /** Bottom padding override */
  padBottom?: string;
  /** Text color override (CSS color) */
  textColor?: string;
  /** Minimum block height */
  minHeight?: string;
  /** Inner content alignment */
  align?: "left" | "center" | "right";
}

export interface DepthLayer {
  image: string;
  speed: number;     // 0..1 — 0 stuck, 1 normal scroll, 0.5 slow drift
  opacity?: number;
  blendMode?: string;
}

export interface BlockInstance {
  id: string;
  type: keyof typeof BLOCKS;
  data?: Record<string, any>;
  effects?: EffectKey[];
  style?: BlockStyle;
  depth?: { layers: DepthLayer[] };
  /** Temporarily hide from live site without deleting */
  hidden?: boolean;
}

export interface PageDoc {
  title?: string;
  blocks: BlockInstance[];
}
