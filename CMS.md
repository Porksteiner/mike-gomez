# Content Management — Sveltia CMS

This branch (`cms-conversion`) wires the site up to **Sveltia CMS** so you
can edit every dynamic section through a browser admin panel at
`/admin` instead of editing component code.

---

## What changed

### New files

```
src/
├── content.config.ts          ← Astro content collection schema (projects)
├── content/
│   └── projects/
│       ├── baitiq.md          ← BaitIQ project (was inline in Work.astro)
│       └── unlearn.md         ← Unlearn project (same)
└── data/
    ├── faq.json               ← FAQ items (was inline in FAQ.astro)
    ├── now.json               ← "Currently building" cards
    ├── testimonials.json      ← Quote wall (draft entries are hidden)
    └── settings.json          ← Name, email, calendly, availability

public/
└── admin/
    ├── index.html             ← Sveltia CMS bootstrap (loaded from unpkg)
    └── config.yml             ← Schema mirroring the data files above
```

### Refactored components

- `Work.astro` — uses `getCollection('projects')`, sorts by `order`.
  Same visual output, every project field now editable.
- `FAQ.astro` — imports `src/data/faq.json`.
- `Now.astro` — imports `src/data/now.json`.
- `Testimonials.astro` — imports `src/data/testimonials.json`. Entries
  with `draft: true` are hidden from the live build, so the placeholder
  rows stay out of the way until you fill them with real quotes.
- `Contact.astro` — pulls email, calendly URL, and the bottom availability
  note from `src/data/settings.json`.
- `Header.astro` — pulls name, calendly URL, and the "Open for new work"
  status label from settings.

### Not changed

- `Hero.astro` — the four-line stroke/gold headline is too tightly art-directed
  per-word to be safely abstracted into a CMS field. Leaving hardcoded. The
  small "Currently building" snippet in the bottom row could be wired to
  `now.json` later if you want — currently still hardcoded.
- `HowIWork.astro`, `Capabilities.astro`, `Manifesto.astro`,
  `CreationOfAdam.astro`, `Stack.astro`, `Numbers.astro`, `Process.astro`,
  `Footer.astro` — left as-is. Convert any of them to data-driven if
  they start getting touched often.

---

## What you need to do before `/admin` works in production

### 1. Set the GitHub repo in `public/admin/config.yml`

Open the file and change this line:

```yaml
backend:
  name: github
  repo: <YOUR_GH_USER>/<YOUR_REPO>     # ← replace this
  branch: main                          # ← branch Vercel deploys from
```

Example:

```yaml
  repo: mikegomez/mikegomez.dev
  branch: main
```

### 2. Authorize Sveltia with GitHub

Sveltia uses GitHub's PKCE OAuth flow, so **no proxy server is required**.
The first time you visit `https://mikegomez.dev/admin`, it'll walk you
through authorizing a GitHub OAuth App.

You have two options for the OAuth app:

- **Easiest:** use Sveltia's hosted GitHub App. Visit `/admin`, click
  "Sign in with GitHub", and authorize the Sveltia app for your repo.
  No setup. The token is scoped only to the repos you grant.
- **Self-hosted:** if you'd rather own the OAuth app, register one at
  https://github.com/settings/applications/new with:
  - Homepage URL: `https://mikegomez.dev`
  - Auth callback URL: `https://mikegomez.dev/admin/`
  Then add `app_id: <client-id>` and `auth_type: pkce` under the
  `backend` block in config.yml. (Sveltia handles PKCE without
  needing the client secret.)

The hosted-app route is fine for a personal site. Use the self-hosted
route only if a client asks for it later.

### 3. Merge this branch

```bash
git checkout main
git merge cms-conversion
git push
```

Vercel rebuilds. `/admin` is live.

---

## What the admin panel can edit

When you log in at `mikegomez.dev/admin` you'll see five collections:

| Collection      | What it controls                                                      |
| --------------- | --------------------------------------------------------------------- |
| **Projects**    | Cards in the Work section. Add / edit / reorder / hide via `draft`.   |
| **Now**         | "What I'm building right now" cards.                                  |
| **Testimonials**| Quote wall. Mark a quote as `Draft` to hide it from the live site.    |
| **FAQ**         | Q&A list.                                                             |
| **Settings**    | Your name, contact email, Calendly URL, availability label and note.  |

Image uploads go to `public/projects/`. They commit to git like any
other change, and Vercel rebuilds within ~30 seconds.

---

## Adding a new project from `/admin`

1. Click **Projects → New Project**.
2. Fill in:
   - **Title** — display name. Becomes the big headline.
   - **Display order** — 1 = first card on the page.
   - **Roman numeral** — shown above the title. `I`, `II`, etc.
   - **Year** — string, e.g. `2026`.
   - **Tech / role chips** — right-aligned label, e.g. `iOS · React Native · OpenAI`.
   - **Headline size** — `xl` (short brand titles), `lg`, `md` (longer titles).
   - **Description** — main paragraph.
   - **Tail** — optional bold-bone-colored end-of-paragraph line.
   - **Icon** — optional small square (BaitIQ-style app icon).
   - **Main image** — the screenshot.
   - **Image hover tilt** — `left`, `right`, or `none`.
   - **Card background pattern** — `grid`, `dots`, or `none`.
   - **Badges** — small pills. `live` = pulsing green dot. `stars` = ★★★★★.
     `note` = plain.
   - **Draft** — leave unchecked to publish.
3. Click **Save**. Sveltia commits to GitHub. Vercel rebuilds.

---

## Adding a new project by editing files directly

Drop a markdown file in `src/content/projects/`. Format:

```markdown
---
title: Project Name
order: 3
roman: III
year: "2026"
tech: "Web · Stripe · Auth"
titleSize: lg
description: "One-paragraph description."
tail: "Optional bold end-of-description sentence."
image: /projects/myproject-marketing.png
icon: /projects/myproject-icon.png   # optional
imageRotation: left
pattern: grid
badges:
  - { text: "Live", kind: live }
  - { text: "12 weeks · solo", kind: note }
draft: false
---
```

Place referenced images in `public/projects/`.

---

## Verifying locally

```bash
npm run dev      # → http://localhost:4321
npm run build    # check the production build is clean
```

The `/admin` panel works locally too, but auth will redirect through
GitHub, so testing the editing flow is easiest against the deployed
site.

---

## Worth knowing

- All edits go through git, so nothing is ever truly lost.
- The site stays a pure-Astro project. No vendor lock-in. If you ever
  rip out Sveltia, your content is still right there in markdown and
  JSON.
- Image uploads default to `public/projects/`. To use a different folder
  (e.g. one per collection), change `media_folder` in `config.yml`.
- Drafts: any item with `draft: true` is filtered out at build time.
  The site never ships placeholders.
