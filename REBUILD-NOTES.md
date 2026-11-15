# mikegomez.dev — rebuild notes (2026-06-01)

Rebuilt on **The Sauce** `starter-astro` template (`D:\Projects\_sauce`, `D:\Projects\starter-astro`).

## Motion signature — chosen per brand (updated)

The hero's signature is **kinetic typography**: a masked line-by-line reveal of the headline ("Honest work. / Real software. / Built with care. / Shipped on time.") + a **hand-drawn underline** under "Built with care." Chosen via the brand→motion selector (`D:\Projects\_sauce\03d-MOTION-SELECTOR.md`).

The WebGL **space-fold was removed** — it's spectacle, and spectacle fights this brand's *honest, calm, no-hype, built-with-care* positioning. The words are the hero; the backdrop is the warm plaster texture + a soft gold ambient, not an animated effect. Tier-1 motion (Lenis, authored reveals, magnetic CTAs, cursor) stays. All reduced-motion-safe. (`src/motion/spacefold.ts` remains in the repo but unused — safe to delete.)

## Backup
The previous version (JSON block engine + Decap CMS + custom `/studio` visual editor) is backed up at:
**`D:\Vanta-backup-2026-06-01`** — 155 files, 169.9 MB (`node_modules`/`.astro`/`dist` excluded).
Nothing was deleted from this repo; the old implementation files remain but are no longer used by the build.

## What changed
- **Stack:** Astro 6.4.2 + **native CSS tokens** (Tailwind removed — it breaks on Astro 6's rolldown Vite, and the system is native CSS now). Added `lenis`, `gsap`, `ogl`, `@astrojs/sitemap`.
- **New structure** (The Sauce foundation):
  - `src/layouts/BaseLayout.astro` — full SEO head (`Seo.astro`) + skip-link + `<main>` + `<ClientRouter>` + reveal failsafe.
  - `src/components/Header.astro` / `Footer.astro` — rewritten (MG monogram, availability pill, **real mobile nav**; footer keeps the Colossians verse in Cinzel + the GOMEZ wordmark).
  - `src/components/sections/` — Hero, Manifesto, Approach, Work, Faq, Contact.
  - `src/motion/site.ts` (Tier-1: Lenis + authored reveals + custom cursor + magnetic + mobile nav) and `src/motion/spacefold.ts` (the OGL "space-folds" WebGL hero, tuned to the desert-gold palette). Both reduced-motion-safe + code-split.
  - `src/lib/seo.ts`, `src/styles/global.css` (your desert-gold tokens + Cinzel + plaster texture).
- **Content preserved & still data-driven:** sections read your existing `src/data/*.json` (settings, hero, howiwork, footer, faq), and Work pulls from your `src/content/projects/*.md` collection via `getCollection`. Editing those files still updates the site.
- **SEO:** `site` = https://mikegomez.dev; canonical + OG + Twitter + Person JSON-LD; sitemap + robots.

## Legacy (unused, still present — safe to delete when ready)
No longer in the build graph; kept for safety (also in the backup):
- `src/components/blocks/`, `src/components/RenderBlocks.astro`, `src/lib/blocks.ts`
- old section components in `src/components/*.astro` (the pre-rebuild Hero, Capabilities, Work, FAQ, etc.)
- `public/studio/` (visual editor), `public/admin/` (Decap CMS)
- `src/data/pages/home.json` + unused data files (now, testimonials, creation)

Say the word and I'll purge these for a clean tree.

## Run / build
- Dev: `npm --prefix D:\Vanta run dev` (or preview server **"vanta"** → http://localhost:4321)
- Build: `npm --prefix D:\Vanta run build` → `dist/` (verified clean)

## TODO
- Branded `og.png` (OG currently points to `/projects/baitiq-marketing.png` as a placeholder).
- Decide: re-integrate or delete the old CMS/studio legacy files.
- The full cinematic motion (scroll-driven fold, Lenis smooth scroll) only shows with normal motion settings — the current OS/browser has reduce-motion on, so you're seeing the graceful static path.
