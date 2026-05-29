# Studio — Visual Editor

A vanilla-JS, browser-based visual editor that lives inside your Astro project.
Designed to be dropped into any Astro project that uses the same block /
data-file pattern.

> Use Chrome, Edge, or Brave. Studio relies on the
> [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API),
> which isn't yet shipped in Safari or Firefox.

---

## Quick start

```bash
npm run dev
# In Chrome / Edge / Brave:
open http://localhost:4321/studio/index.html
```

1. Click **Open project** in the top-right.
2. Pick the project root folder (this `Vanta` directory).
3. Grant read/write permission.
4. Studio loads `src/data/pages/home.json`, lists its blocks, and loads
   `localhost:4321/?studio=1` in the iframe.
5. Click any block in the preview → it's selected in the sidebar and editable in the right inspector.
6. Cmd/Ctrl+S → saves to disk → Astro HMR re-renders the iframe.

---

## What's where

```
public/studio/
├── index.html       — editor shell (top bar + sidebar + iframe + inspector)
├── studio.css       — editor chrome
├── app.js           — main editor app (vanilla JS, no framework)
├── inject.js        — runs inside the iframe; provides click-to-select
│                      and double-click inline editing
└── presets.json     — preset registry (mirrors src/lib/blocks.ts)

src/
├── lib/blocks.ts    — server-side block registry (type → Astro component)
├── components/blocks/
│   ├── Divider.astro
│   ├── Marquee.astro
│   ├── Stats.astro
│   ├── CTA.astro
│   ├── LogoCloud.astro
│   ├── ImageText.astro
│   ├── PullQuote.astro
│   ├── Gallery.astro
│   └── RichHero.astro
├── components/RenderBlocks.astro — generic block list renderer
└── data/
    ├── pages/home.json    — block composition for the home page
    ├── theme.json         — design tokens (colors, fonts)
    └── *.json             — per-section content (hero, footer, etc.)
```

---

## Adding a new preset

Five minutes per preset, once the system is in place:

**1. Build the Astro component** at `src/components/blocks/MyBlock.astro`:

```astro
---
interface Props {
  data?: { headline?: string };
  blockId?: string;
}
const { data = {}, blockId } = Astro.props;
---
<section data-block-id={blockId} data-block-type="my-block">
  <h2 data-edit="headline">{data.headline ?? "Default"}</h2>
</section>
```

`data-block-id` lets Studio find/select it. Each editable text uses `data-edit="field.name"`.

**2. Register it in `src/lib/blocks.ts`:**

```ts
import MyBlock from "../components/blocks/MyBlock.astro";

export const BLOCKS = {
  // ...
  "my-block": {
    component: MyBlock,
    label: "My Block",
    category: "Content",
    kind: "preset",
    defaults: { headline: "Default" },
    fields: [
      { name: "headline", label: "Headline", type: "text" }
    ],
  },
};
```

**3. Mirror it in `public/studio/presets.json`:**

```json
{
  "type": "my-block",
  "label": "My Block",
  "category": "Content",
  "kind": "preset",
  "icon": "star",
  "defaults": { "headline": "Default" },
  "fields": [{ "name": "headline", "label": "Headline", "type": "text" }]
}
```

That's it. The new block shows up in the Studio's "+ Add block" library, can be inserted into any page, and renders on the live site.

---

## Field types

The inspector renders a form based on the `fields` array of each preset:

| Type        | Renders as                              |
| ----------- | --------------------------------------- |
| `text`      | single-line input                       |
| `textarea`  | multi-line input                        |
| `url`       | URL input                               |
| `number`    | numeric input                           |
| `select`    | dropdown — requires `options: [...]`    |
| `boolean`   | toggle                                  |
| `image`     | path input (CMS image picker pending)   |
| `list`      | repeatable group — requires `itemFields`|

---

## Scroll effects

Apply any of these to any block via the page JSON `effects` array:

```json
{ "id": "stats-1", "type": "stats", "data": {...}, "effects": ["fade-up", "counter"] }
```

| Key          | What it does                                            |
| ------------ | ------------------------------------------------------- |
| `fade-up`    | Block fades + translates up on viewport enter           |
| `pin`        | Block becomes `position: sticky; top: 0`                |
| `staircase`  | Children fade in one at a time (stagger)                |
| `parallax`   | Block contents drift opposite the scroll                |
| `mask`       | Block clip-path opens from center                       |
| `counter`    | Stat-style `[data-stat-value]` elements count up        |

All effects respect `prefers-reduced-motion` and gracefully no-op.

---

## How saves persist

Studio uses the File System Access API to write directly to `src/data/`.
Cmd/Ctrl+S writes:

- `src/data/pages/{slug}.json` for the current page composition
- `src/data/theme.json` for theme tokens

Astro's dev server detects the file change and HMRs the iframe within ~50ms.

If you close Studio and reopen later, you'll need to grant folder permission
again (browser security — file handles aren't yet persistable across sessions
without extra work).

---

## Inline text editing

Any element rendered with `data-edit="fieldPath"` becomes inline-editable:

1. Double-click the element in the live preview
2. Edit the text in place
3. Press Enter (commit) or Esc (cancel)
4. Studio writes the value back into the block data and saves

Paths support nested data via dot/bracket notation:

```html
<span data-edit="items[2].label">Brighton</span>
```

…edits `block.data.items[2].label`.

---

## Pages tab

Lists every JSON file in `src/data/pages/`. Click to switch the iframe to that
page. New pages: click **+ New** (a future iteration will let you pick a
starting template; for now it creates an empty composition).

To actually render new pages at `/about`, `/work`, etc., you need a dynamic
route at `src/pages/[...slug].astro` (not included by default — keep it as
explicit `.astro` files for now if you want SEO/SSR control).

---

## Theme tab

Edits `src/data/theme.json` — palette colors, font stacks. Currently scaffolded;
to make changes live-affect the site, your `global.css` should read these via
CSS custom properties. The default Vanta `global.css` uses a `@theme {...}`
block; future iteration can stream theme.json edits → @theme variables.

---

## Production / deployment

Studio is a development-time tool. Don't ship `/studio/` to production users —
it doesn't enforce auth.

For end-client editing in production, the project also ships **Sveltia CMS** at
`/admin/index.html` — that has GitHub OAuth, runs against the deployed repo,
and edits the exact same data files. See `CMS.md` for setup.

The two editors live side-by-side intentionally:

| Studio (`/studio/`)             | Sveltia (`/admin/`)                |
| ------------------------------- | ---------------------------------- |
| Local dev only                  | Production-deployable              |
| Visual editor + iframe preview  | Form-based content editing         |
| File System Access API          | GitHub OAuth                       |
| For the designer / developer    | For the end client / non-technical |

---

## Porting Studio to another Astro project

1. Copy these folders/files to the target project:
   - `public/studio/` (entire folder)
   - `src/components/RenderBlocks.astro`
   - `src/lib/blocks.ts`
   - The blocks you want in `src/components/blocks/`
2. Add a `src/data/pages/home.json` with an initial block list
3. Make sure `BaseLayout.astro` includes the inject loader (search this repo
   for `studio/inject.js` to see the snippet)
4. Update `public/studio/presets.json` to match your block registry
5. `npm run dev` → open `/studio/index.html`

---

## Known limitations (today)

- File picker permission must be re-granted on every Studio reload
  (browser security; will improve as the FS Access API matures)
- Pages tab `+ New` creates an empty page but doesn't wire up a dynamic route
- Image upload via inspector is a path input — full image picker integration
  with media library is a future iteration
- Theme changes write to `theme.json` but don't yet stream into `@theme` at
  runtime (manual CSS update needed; future iteration)
- Singleton blocks (Hero, Work, FAQ, Contact, Footer) can't be re-ordered;
  they're fixed-position by design. Presets in between can be reordered freely.

---

## Roadmap (in order of likely value)

1. **Image library** — drop a folder, browse uploaded images in inspector
2. **More presets** — pricing, video, contact form, footer variants, image-text alt
3. **Per-block theme overrides** — give one block a different palette
4. **Page templates** — "New page" presets like "Landing", "Case study", "Blog post"
5. **Cross-page link picker** — pick a page from a dropdown instead of typing the slug
6. **Local handle persistence** — `navigator.storage.persist()` + `IDBObjectStore`
   to remember the folder grant across reloads
