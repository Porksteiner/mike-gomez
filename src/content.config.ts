import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* ----------------------------------------------------------------- *
 *  Projects — one markdown file per project.
 *  Lives in src/content/projects/*.md
 *
 *  Image paths are strings (e.g. "/projects/baitiq-icon.png") so they
 *  resolve to public/projects/* — matches the existing convention and
 *  is what Sveltia CMS will upload into.
 * ----------------------------------------------------------------- */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    order: z.number(), // 1 = first on page, 2 = second, etc.
    roman: z.string(), // "I", "II", "III"
    year: z.string(), // "2026"
    tech: z.string(), // right-side stack chips — "iOS · React Native · OpenAI"
    titleSize: z.enum(["xl", "lg", "md"]).default("lg"), // controls headline scale
    description: z.string(), // main paragraph
    tail: z.string().optional(), // bone-colored tail of description — "Live on the iOS App Store."
    icon: z.string().optional(), // path to small app icon — "/projects/baitiq-icon.png"
    image: z.string(), // path to main screenshot — "/projects/baitiq-marketing.png"
    imageRotation: z.enum(["left", "right", "none"]).default("none"),
    pattern: z.enum(["grid", "dots", "none"]).default("grid"),
    badges: z
      .array(
        z.object({
          text: z.string(),
          kind: z.enum(["live", "stars", "note"]).default("note"),
        })
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
