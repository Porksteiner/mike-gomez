/* ================================================================ *
 *  STUDIO — Visual Editor app.
 *  Vanilla JS, browser-only. Uses File System Access API to read/write
 *  the project's src/data/*.json directly. The iframe loads /?studio=1
 *  which triggers inject.js inside the site, providing block selection
 *  and inline text editing via postMessage.
 * ================================================================ */

const STATE = {
  presets: null,         // loaded from ./presets.json
  presetMap: new Map(),  // type → meta
  dirHandle: null,       // FS Access API directory handle (project root)
  pages: [],             // list of page slugs found in src/data/pages/
  currentPageSlug: "home",
  currentPage: null,     // { title, blocks: [...] }
  selectedBlockId: null,
  selectedBlockType: null,
  dirty: false,
  settings: null,        // src/data/settings.json
  theme: null,           // src/data/theme.json (optional)
  singletonCache: {},    // { fileBase: object } cache of singleton data
  tab: "page",           // page | library | theme | pages
  viewport: "desktop",
  history: [],           // undo
};

/* Map each singleton block type to its data file (under src/data/) */
const SINGLETON_FILES = {
  hero: "hero",
  "how-i-work": "howiwork",
  faq: "faq",
  footer: "footer",
  creation: "creation",
  header: "settings",
  contact: "settings",
  // work uses content collections (markdown), inline-editing not yet supported
};

/* Inspector schemas for singletons — same shape as preset fields */
const SINGLETON_SCHEMAS = {
  hero: [
    { name: "line1", label: "Headline line 1", type: "text" },
    { name: "line2", label: "Headline line 2 (outlined)", type: "text" },
    { name: "line3Accent", label: "Line 3 — gold italic word", type: "text" },
    { name: "line3Rest", label: "Line 3 — rest of line", type: "text" },
    { name: "line4", label: "Headline line 4 (gold outlined)", type: "text" },
    { name: "bio", label: "Bio paragraph", type: "textarea" },
    { name: "currentlyBuildingLabel", label: "Currently-building label", type: "text" },
    { name: "scrollCtaLabel", label: "Scroll CTA label", type: "text" },
  ],
  "how-i-work": [
    { name: "headingLine1", label: "Heading line 1", type: "text" },
    { name: "headingLine2Pre", label: "Heading line 2 — pre", type: "text" },
    { name: "headingLine2Accent", label: "Heading line 2 — gold word", type: "text" },
    { name: "headingLine2Post", label: "Heading line 2 — post", type: "text" },
    { name: "lede", label: "Lede paragraph", type: "textarea" },
    { name: "inscription", label: "Inscription (default)", type: "text" },
    { name: "inscriptionAccent", label: "Inscription (gold)", type: "text" },
    {
      name: "stages", label: "Stages", type: "list",
      itemFields: [
        { name: "n", label: "Numeral", type: "text" },
        { name: "kicker", label: "Stage name", type: "text" },
        { name: "duration", label: "Duration", type: "text" },
        { name: "body", label: "Body", type: "textarea" },
      ],
    },
  ],
  faq: [
    {
      name: "items", label: "FAQ entries", type: "list",
      itemFields: [
        { name: "q", label: "Question", type: "text" },
        { name: "a", label: "Answer", type: "textarea" },
      ],
    },
  ],
  footer: [
    { name: "verse", label: "Verse / opener", type: "textarea" },
    { name: "verseReference", label: "Reference", type: "text" },
    { name: "tagline", label: "Tagline line 1", type: "text" },
    { name: "taglineAccent", label: "Tagline line 2", type: "text" },
    { name: "wordmark", label: "Giant wordmark", type: "text" },
    { name: "fineprint", label: "Fineprint", type: "text" },
    {
      name: "siteLinks", label: "Site nav", type: "list",
      itemFields: [
        { name: "label", label: "Label", type: "text" },
        { name: "href", label: "Href", type: "url" },
      ],
    },
    {
      name: "socialLinks", label: "Social links", type: "list",
      itemFields: [
        { name: "label", label: "Label", type: "text" },
        { name: "href", label: "URL", type: "url" },
      ],
    },
  ],
  creation: [
    { name: "inscription", label: "Inscription text", type: "text" },
    { name: "handLeftImage", label: "Left hand image", type: "image" },
    { name: "handRightImage", label: "Right hand image", type: "image" },
    {
      name: "dividers", label: "Section divider labels", type: "object",
      objectFields: [
        { name: "work", label: "Before Work", type: "text" },
        { name: "workingTogether", label: "Before How-I-Work", type: "text" },
        { name: "getInTouch", label: "Before Contact", type: "text" },
      ],
    },
  ],
  header: [
    { name: "name", label: "Your name", type: "text" },
    { name: "availability", label: "Availability label", type: "text" },
    { name: "calendly", label: "Calendly URL", type: "url" },
  ],
  contact: [
    { name: "email", label: "Contact email", type: "text" },
    { name: "calendly", label: "Calendly URL", type: "url" },
    { name: "availabilityNote", label: "Bottom note", type: "textarea" },
  ],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const PRESETS_URL = "./presets.json";

/* ================================================================ *
 *  FS ACCESS API helpers
 * ================================================================ */

async function pickProject() {
  if (!("showDirectoryPicker" in window)) {
    toast("Your browser doesn't support the File System Access API. Use Chrome, Edge, or Brave.", "err");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite", id: "studio-project" });
    STATE.dirHandle = handle;
    await loadProject();
    setStatus("Connected", "ok");
  } catch (e) {
    if (e?.name === "AbortError") return;
    console.error(e);
    toast("Could not open project: " + (e?.message ?? e), "err");
  }
}

async function getPath(path, { create = false } = {}) {
  if (!STATE.dirHandle) throw new Error("No project open");
  const parts = path.split("/").filter(Boolean);
  let dir = STATE.dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i], { create });
  }
  return dir.getFileHandle(parts[parts.length - 1], { create });
}

async function readJson(path) {
  try {
    const fh = await getPath(path);
    const file = await fh.getFile();
    const txt = await file.text();
    return JSON.parse(txt);
  } catch (e) {
    if (e?.name === "NotFoundError") return null;
    throw e;
  }
}

async function writeJson(path, data) {
  const fh = await getPath(path, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(data, null, 2) + "\n");
  await w.close();
}

async function listPagesDir() {
  if (!STATE.dirHandle) return [];
  try {
    const data = await STATE.dirHandle.getDirectoryHandle("src");
    const dataDir = await data.getDirectoryHandle("data");
    const pagesDir = await dataDir.getDirectoryHandle("pages");
    const names = [];
    for await (const [name, entry] of pagesDir.entries()) {
      if (entry.kind === "file" && name.endsWith(".json")) {
        names.push(name.replace(/\.json$/, ""));
      }
    }
    return names.sort();
  } catch {
    return [];
  }
}

/* ================================================================ *
 *  PROJECT LOADING
 * ================================================================ */

async function loadProject() {
  STATE.pages = await listPagesDir();
  if (!STATE.pages.includes(STATE.currentPageSlug)) {
    STATE.currentPageSlug = STATE.pages[0] || "home";
  }
  await loadPage(STATE.currentPageSlug);

  STATE.settings = await readJson("src/data/settings.json");
  STATE.theme = await readJson("src/data/theme.json");

  loadIframe();
  renderAll();
}

async function loadPage(slug) {
  STATE.currentPageSlug = slug;
  STATE.selectedBlockId = null;
  STATE.history = [];
  STATE.dirty = false;
  setSaveEnabled(false);
  const doc = await readJson(`src/data/pages/${slug}.json`);
  STATE.currentPage = doc || { title: "Untitled", blocks: [] };
}

function loadIframe() {
  const f = $("#preview");
  const dev = window.location.origin;
  const slug = STATE.currentPageSlug === "home" ? "" : STATE.currentPageSlug;
  f.src = `${dev}/${slug}?studio=1#cache=${Date.now()}`;
}

/* ================================================================ *
 *  RENDER — pieces of the UI
 * ================================================================ */

function renderAll() {
  renderBlockList();
  renderLibrary();
  renderPagesList();
  renderThemePanel();
  renderInspector();
}

function renderBlockList() {
  const list = $("#block-list");
  if (!STATE.currentPage) {
    list.innerHTML = '<li class="empty">No project open. Click <strong>Open project</strong>.</li>';
    return;
  }
  const { blocks } = STATE.currentPage;
  if (!blocks.length) {
    list.innerHTML = '<li class="empty">No blocks yet. Click <strong>+ Add</strong> to begin.</li>';
    return;
  }
  list.innerHTML = "";
  blocks.forEach((b, i) => {
    const meta = STATE.presetMap.get(b.type);
    const isSingleton = meta?.kind === "singleton";
    const li = document.createElement("li");
    li.className = "block-row" +
      (STATE.selectedBlockId === b.id ? " is-selected" : "") +
      (isSingleton ? " is-singleton" : "");
    li.draggable = !isSingleton;
    li.dataset.blockId = b.id;
    li.innerHTML = `
      <span class="handle" aria-hidden="true">⋮⋮</span>
      <span class="label">${meta?.label ?? b.type}</span>
      <span class="type">${b.type}</span>
      <button class="kill" title="Delete">×</button>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".kill")) {
        if (confirm(`Delete this ${meta?.label ?? b.type}?`)) {
          pushHistory();
          STATE.currentPage.blocks.splice(i, 1);
          STATE.selectedBlockId = null;
          markDirty();
          renderBlockList();
          renderInspector();
          reloadIframe();
        }
        return;
      }
      selectBlock(b.id);
    });
    if (!isSingleton) {
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", b.id);
        li.classList.add("is-dragging");
      });
      li.addEventListener("dragend", () => li.classList.remove("is-dragging"));
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        li.classList.add("is-drop-target");
      });
      li.addEventListener("dragleave", () => li.classList.remove("is-drop-target"));
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.classList.remove("is-drop-target");
        const fromId = e.dataTransfer.getData("text/plain");
        if (fromId && fromId !== b.id) moveBlock(fromId, b.id);
      });
    }
    list.appendChild(li);
  });
}

function renderLibrary() {
  const grid = $("#lib-grid");
  if (!STATE.presets) return;
  const q = ($("#lib-search")?.value || "").toLowerCase();
  const items = STATE.presets.blocks.filter(
    (b) => b.kind === "preset" && (
      !q ||
      b.label.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    )
  );
  grid.innerHTML = items.map(libCardHTML).join("");
  $$(".lib-card", grid).forEach((card) => {
    card.addEventListener("click", () => addBlock(card.dataset.type));
  });
}

function libCardHTML(b) {
  return `
    <button class="lib-card" data-type="${b.type}">
      <span class="ico">${iconFor(b.icon)}</span>
      <span class="lab">${b.label}</span>
      <span class="cat">${b.category}</span>
    </button>
  `;
}

function iconFor(name) {
  const ICONS = {
    menu: "≡",
    star: "★",
    sparkles: "✦",
    briefcase: "▣",
    list: "≡",
    question: "?",
    mail: "✉",
    minus: "—",
    arrows: "⇄",
    chart: "▤",
    "arrow-right": "→",
    grid: "▦",
    image: "▣",
    quote: "❝",
  };
  return ICONS[name] ?? "◆";
}

function renderPagesList() {
  const list = $("#page-list");
  if (!STATE.dirHandle) {
    list.innerHTML = '<li class="empty">No project open.</li>';
    return;
  }
  list.innerHTML = "";
  STATE.pages.forEach((slug) => {
    const li = document.createElement("li");
    li.className = "page-row" + (slug === STATE.currentPageSlug ? " is-current" : "");
    li.innerHTML = `
      <span class="name">${slug === "home" ? "Home" : slug}</span>
      <span class="count">/${slug === "home" ? "" : slug}</span>
    `;
    li.addEventListener("click", async () => {
      if (STATE.dirty && !confirm("Unsaved changes. Switch pages anyway?")) return;
      await loadPage(slug);
      loadIframe();
      renderAll();
    });
    list.appendChild(li);
  });
}

function renderInspector() {
  const body = $("#inspector-body");
  const title = $("#inspector-title");
  const sub = $("#inspector-sub");
  if (!STATE.selectedBlockId) {
    title.textContent = "Inspector";
    sub.textContent = "Select a block to edit";
    body.innerHTML = `<div class="empty"><p>Click any block in the preview, or pick from the sidebar.</p></div>`;
    return;
  }
  const block = STATE.currentPage?.blocks.find((b) => b.id === STATE.selectedBlockId);
  if (!block) return;
  const meta = STATE.presetMap.get(block.type);
  title.textContent = meta?.label ?? block.type;
  sub.textContent = `${block.type} · id ${block.id}`;

  let html = "";
  if (meta?.kind === "singleton") {
    const fileBase = SINGLETON_FILES[block.type];
    const schema = SINGLETON_SCHEMAS[block.type];
    if (!schema) {
      html += `<div class="empty">
        <p>This block (<code>${block.type}</code>) doesn't have an inspector schema yet.</p>
        <p style="margin-top: 8px;">Edit its data file directly, or open <a href="/admin/index.html" target="_blank" style="color: var(--gold)">/admin</a>.</p>
      </div>`;
    } else {
      // Ensure data loaded into cache
      const cached = STATE.singletonCache[fileBase];
      if (!cached && fileBase) {
        // Trigger load (async), inspector re-renders when ready
        readJson(`src/data/${fileBase}.json`).then((d) => {
          if (d) {
            STATE.singletonCache[fileBase] = d;
            renderInspector();
          }
        });
        html += `<div class="empty"><p>Loading ${fileBase}.json…</p></div>`;
      } else if (cached) {
        html += `<div class="form-section" style="background: rgba(212, 175, 109, 0.06); padding: 10px 12px; border-radius: 4px; margin-bottom: 14px; border: 1px solid rgba(212, 175, 109, 0.3);">
          <p style="font-size: 12px; color: var(--gold-hi); line-height: 1.5;">
            💡 <strong>Tip:</strong> Click any text in the live preview to edit it inline.
          </p>
        </div>`;
        html += '<div class="form">';
        schema.forEach((field) => {
          html += renderSingletonField(field, cached, field.name);
        });
        html += "</div>";
      }
    }
  } else if (meta?.fields) {
    block.data = block.data || { ...(meta.defaults || {}) };
    html += '<div class="form">';
    meta.fields.forEach((field) => {
      html += renderField(field, block.data, `data.${field.name}`);
    });
    html += "</div>";
  }

  // Effects
  html += `
    <div class="form-section">
      <div class="form-section-title">Scroll effects</div>
      <div class="effects-row" id="effects-row">
        ${(STATE.presets?.effects || []).map((e) => {
          const active = (block.effects || []).includes(e.key);
          return `<button class="effect-chip ${active ? "is-active" : ""}" data-effect-key="${e.key}">${e.label}</button>`;
        }).join("")}
      </div>
    </div>
  `;

  body.innerHTML = html;

  // Wire field listeners
  $$(".field-input", body).forEach((input) => {
    const path = input.dataset.path;
    const singletonKey = input.dataset.singleton;
    input.addEventListener("input", async () => {
      if (singletonKey) {
        const cache = STATE.singletonCache[singletonKey];
        if (cache) {
          writeNestedPath(cache, path, valueOf(input));
          try {
            await writeJson(`src/data/${singletonKey}.json`, cache);
            setStatus("Saved", "ok");
            scheduleReload();
          } catch (e) {
            console.error(e);
            toast("Save failed", "err");
          }
        }
      } else {
        writePath(block, path, valueOf(input));
        markDirty();
        scheduleReload();
      }
    });
  });
  $$(".field-list-add", body).forEach((btn) => {
    if (btn.dataset.singletonListAdd) return; // handled by singleton block
    btn.addEventListener("click", () => {
      const path = btn.dataset.path;
      const itemFieldsRaw = btn.dataset.itemFields;
      const itemFields = JSON.parse(itemFieldsRaw);
      const newItem = {};
      itemFields.forEach((f) => (newItem[f.name] = f.default ?? ""));
      const list = readPath(block, path) || [];
      list.push(newItem);
      writePath(block, path, list);
      markDirty();
      renderInspector();
      reloadIframe();
    });
  });
  $$(".field-list-item-remove", body).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const singletonKey = btn.dataset.singletonList;
      if (singletonKey) {
        const cache = STATE.singletonCache[singletonKey];
        const listPath = btn.dataset.listPath;
        const list = readNestedPath(cache, listPath);
        const idx = parseInt(btn.dataset.idx, 10);
        if (Array.isArray(list)) {
          list.splice(idx, 1);
          try {
            await writeJson(`src/data/${singletonKey}.json`, cache);
            renderInspector();
            scheduleReload();
          } catch (e) {
            toast("Save failed", "err");
          }
        }
      } else {
        const path = btn.dataset.path;
        const list = readPath(block, path);
        const idx = parseInt(btn.dataset.idx, 10);
        if (Array.isArray(list)) {
          list.splice(idx, 1);
          markDirty();
          renderInspector();
          reloadIframe();
        }
      }
    });
  });
  $$(".field-list-add", body).forEach((btn) => {
    const singletonAddKey = btn.dataset.singletonListAdd;
    if (!singletonAddKey) return; // already wired above for presets
    btn.addEventListener("click", async () => {
      const cache = STATE.singletonCache[singletonAddKey];
      const listPath = btn.dataset.listPath;
      const itemFields = JSON.parse(btn.dataset.itemFields);
      const newItem = {};
      itemFields.forEach((f) => (newItem[f.name] = f.default ?? ""));
      let list = readNestedPath(cache, listPath);
      if (!Array.isArray(list)) {
        list = [];
        writeNestedPath(cache, listPath, list);
      }
      list.push(newItem);
      try {
        await writeJson(`src/data/${singletonAddKey}.json`, cache);
        renderInspector();
        scheduleReload();
      } catch (e) {
        toast("Save failed", "err");
      }
    });
  });
  $$(".effect-chip", body).forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.effectKey;
      block.effects = block.effects || [];
      const idx = block.effects.indexOf(key);
      if (idx > -1) block.effects.splice(idx, 1);
      else block.effects.push(key);
      chip.classList.toggle("is-active");
      markDirty();
      reloadIframe();
    });
  });
}

function renderField(field, dataRoot, path) {
  const value = readPath(dataRoot, path.replace(/^data\./, "")) ?? field.default ?? "";
  const id = `f-${path.replace(/[^a-z0-9]/gi, "-")}`;
  let inner = "";
  switch (field.type) {
    case "text":
    case "url":
      inner = `<input type="${field.type}" id="${id}" class="field-input" data-path="${pathInData(path)}" value="${escapeAttr(value)}">`;
      break;
    case "number":
      inner = `<input type="number" id="${id}" class="field-input" data-path="${pathInData(path)}" value="${escapeAttr(value)}">`;
      break;
    case "textarea":
    case "richtext":
      inner = `<textarea id="${id}" class="field-input" data-path="${pathInData(path)}">${escapeHtml(value)}</textarea>`;
      break;
    case "select":
      inner = `<select id="${id}" class="field-input" data-path="${pathInData(path)}">
        ${(field.options || []).map((o) => `<option value="${escapeAttr(o)}" ${o === value ? "selected" : ""}>${o}</option>`).join("")}
      </select>`;
      break;
    case "boolean":
      inner = `<label class="toggle">
        <input type="checkbox" id="${id}" class="field-input" data-path="${pathInData(path)}" ${value ? "checked" : ""}>
        <span class="track"></span>
      </label>`;
      break;
    case "image":
      inner = `<input type="text" id="${id}" class="field-input" data-path="${pathInData(path)}" value="${escapeAttr(value)}" placeholder="/projects/your-image.png">
        <span class="hint">Path relative to /public, e.g. <code>/projects/myimage.png</code></span>`;
      break;
    case "list": {
      const arr = Array.isArray(value) ? value : [];
      const itemFieldsJSON = JSON.stringify(field.itemFields || []);
      inner = `<div class="field-list">
        ${arr.map((it, i) => `
          <div class="field-list-item">
            <div class="field-list-item-head">
              <span class="idx">Item ${i + 1}</span>
              <button class="field-list-item-remove" data-path="${pathInData(path)}" data-idx="${i}">remove</button>
            </div>
            ${(field.itemFields || []).map((sub) => {
              const subPath = `${path}[${i}].${sub.name}`;
              return renderField(sub, dataRoot, subPath);
            }).join("")}
          </div>
        `).join("")}
        <button class="field-list-add" data-path="${pathInData(path)}" data-item-fields='${escapeAttr(itemFieldsJSON)}'>+ Add item</button>
      </div>`;
      break;
    }
    default:
      inner = `<input type="text" id="${id}" class="field-input" data-path="${pathInData(path)}" value="${escapeAttr(value)}">`;
  }
  return `<div class="field">
    <label for="${id}">${field.label}</label>
    ${inner}
    ${field.hint ? `<span class="hint">${field.hint}</span>` : ""}
  </div>`;
}

function pathInData(p) {
  // path like 'data.foo[2].bar' → 'foo[2].bar' (strip leading 'data.')
  return p.replace(/^data\./, "");
}

/**
 * Render an inspector field bound to a singleton data file.
 * `dataRoot` is the singleton's cached object; `path` is dotted-bracket path.
 */
function renderSingletonField(field, dataRoot, path) {
  const fileBase = SINGLETON_FILES[STATE.selectedBlockType];
  const value = readNestedPath(dataRoot, path) ?? field.default ?? "";
  const id = `sf-${path.replace(/[^a-z0-9]/gi, "-")}`;
  const ds = `data-singleton="${fileBase}" data-path="${path}"`;
  let inner = "";
  switch (field.type) {
    case "text":
    case "url":
    case "number":
      inner = `<input type="${field.type}" id="${id}" class="field-input" ${ds} value="${escapeAttr(value)}">`;
      break;
    case "textarea":
      inner = `<textarea id="${id}" class="field-input" ${ds}>${escapeHtml(value)}</textarea>`;
      break;
    case "image":
      inner = `<input type="text" id="${id}" class="field-input" ${ds} value="${escapeAttr(value)}" placeholder="/projects/your-image.png">
        <span class="hint">Path relative to /public</span>`;
      break;
    case "object": {
      inner = `<div class="field-list" style="background: transparent;">`;
      (field.objectFields || []).forEach((sub) => {
        inner += renderSingletonField(sub, dataRoot, `${path}.${sub.name}`);
      });
      inner += "</div>";
      break;
    }
    case "list": {
      const arr = Array.isArray(value) ? value : [];
      const itemFieldsJSON = JSON.stringify(field.itemFields || []);
      inner = `<div class="field-list">
        ${arr.map((it, i) => `
          <div class="field-list-item">
            <div class="field-list-item-head">
              <span class="idx">Item ${i + 1}</span>
              <button class="field-list-item-remove" data-singleton-list="${fileBase}" data-list-path="${path}" data-idx="${i}">remove</button>
            </div>
            ${(field.itemFields || []).map((sub) => {
              const subPath = `${path}[${i}].${sub.name}`;
              return renderSingletonField(sub, dataRoot, subPath);
            }).join("")}
          </div>
        `).join("")}
        <button class="field-list-add" data-singleton-list-add="${fileBase}" data-list-path="${path}" data-item-fields='${escapeAttr(itemFieldsJSON)}'>+ Add item</button>
      </div>`;
      break;
    }
    default:
      inner = `<input type="text" id="${id}" class="field-input" ${ds} value="${escapeAttr(value)}">`;
  }
  return `<div class="field">
    <label for="${id}">${field.label}</label>
    ${inner}
    ${field.hint ? `<span class="hint">${field.hint}</span>` : ""}
  </div>`;
}

function valueOf(input) {
  if (input.type === "checkbox") return input.checked;
  if (input.type === "number") return parseFloat(input.value);
  return input.value;
}

/* ================================================================ *
 *  PATH READ/WRITE — supports foo.bar[3].baz on block.data
 * ================================================================ */

function readPath(obj, path) {
  if (!path) return undefined;
  const parts = path.match(/[^.[\]]+/g) || [];
  let cur = obj?.data ?? obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function writePath(block, path, value) {
  if (!block.data) block.data = {};
  const parts = path.match(/[^.[\]]+/g) || [];
  let cur = block.data;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    if (cur[p] == null) cur[p] = nextIsIndex ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

/* ================================================================ *
 *  THEME PANEL
 * ================================================================ */

function renderThemePanel() {
  const f = $("#theme-form");
  if (!STATE.theme) {
    STATE.theme = defaultTheme();
  }
  const t = STATE.theme;
  f.innerHTML = `
    <div class="form-section">
      <div class="form-section-title">Brand</div>
      <div class="field">
        <label>Brand name</label>
        <input type="text" class="theme-input" data-tk="name" value="${escapeAttr(STATE.settings?.name ?? "")}" />
        <span class="hint">Edit settings.json directly via Sveltia for the rest.</span>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Palette</div>
      ${Object.entries(t.colors ?? {}).map(([key, val]) => `
        <div class="color-row">
          <label>--${key}</label>
          <input type="color" class="theme-input theme-color-pick" data-tk="colors.${key}" value="${normalizeColor(val)}" />
          <input type="text" class="theme-input theme-color-text" data-tk="colors.${key}" value="${val}" />
        </div>
      `).join("")}
    </div>
    <div class="form-section">
      <div class="form-section-title">Typography</div>
      <div class="field">
        <label>Display font</label>
        <input type="text" class="theme-input" data-tk="fonts.display" value="${escapeAttr(t.fonts?.display ?? "")}" />
      </div>
      <div class="field">
        <label>Body / sans font</label>
        <input type="text" class="theme-input" data-tk="fonts.sans" value="${escapeAttr(t.fonts?.sans ?? "")}" />
      </div>
      <div class="field">
        <label>Mono font</label>
        <input type="text" class="theme-input" data-tk="fonts.mono" value="${escapeAttr(t.fonts?.mono ?? "")}" />
      </div>
    </div>
  `;
  $$(".theme-input", f).forEach((input) => {
    input.addEventListener("input", (e) => {
      const path = input.dataset.tk;
      // Sync color pickers ↔ text fields
      if (input.classList.contains("theme-color-pick")) {
        const txt = f.querySelector(`.theme-color-text[data-tk="${path}"]`);
        if (txt) txt.value = input.value;
      } else if (input.classList.contains("theme-color-text")) {
        const pick = f.querySelector(`.theme-color-pick[data-tk="${path}"]`);
        if (pick) pick.value = normalizeColor(input.value);
      }
      writePath({ data: STATE.theme }, path, input.value);
      markDirty();
    });
  });
}

function defaultTheme() {
  return {
    colors: {
      void: "#faf6ed",
      coal: "#f0e8d4",
      bone: "#2d1f0a",
      paper: "#4a3a24",
      gold: "#a8854a",
      smoke: "#6b5a3f",
    },
    fonts: {
      display: "Anton, Impact, sans-serif",
      sans: "Space Grotesk, Inter, system-ui, sans-serif",
      mono: "JetBrains Mono, ui-monospace, monospace",
    },
  };
}

function normalizeColor(c) {
  if (!c) return "#000000";
  if (c.startsWith("#") && (c.length === 7 || c.length === 4)) return c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
  return "#000000";
}

/* ================================================================ *
 *  SELECTION + BLOCK OPS
 * ================================================================ */

function selectBlock(id) {
  STATE.selectedBlockId = id;
  const b = STATE.currentPage?.blocks.find((x) => x.id === id);
  STATE.selectedBlockType = b?.type ?? null;
  // Switch the sidebar tab to Page so user sees block selected
  if (STATE.tab !== "page") switchTab("page");
  renderBlockList();
  renderInspector();
  // Tell iframe to highlight
  const f = $("#preview");
  f?.contentWindow?.postMessage({ type: "studio:highlight", id }, "*");
}

/* Handle a text-edit message from the iframe inline editor. */
async function handleTextEdit({ blockId, blockType, path, value }) {
  const meta = STATE.presetMap.get(blockType);
  if (meta?.kind === "singleton") {
    const fileBase = SINGLETON_FILES[blockType];
    if (!fileBase) {
      toast(`No data file mapped for ${blockType}`, "err");
      return;
    }
    const filePath = `src/data/${fileBase}.json`;
    let data = STATE.singletonCache[fileBase];
    if (!data) {
      data = await readJson(filePath);
      if (!data) {
        toast(`Couldn't read ${filePath}`, "err");
        return;
      }
      STATE.singletonCache[fileBase] = data;
    }
    writeNestedPath(data, path, value);
    try {
      await writeJson(filePath, data);
      toast("Saved ✓", "ok");
      setStatus("Saved", "ok");
      renderInspector();
      scheduleReload();
    } catch (e) {
      console.error(e);
      toast("Save failed: " + (e?.message ?? e), "err");
    }
  } else {
    // Preset block — update block.data on the page composition
    const block = STATE.currentPage?.blocks.find((b) => b.id === blockId);
    if (block) {
      writePath(block, path, value);
      markDirty();
      renderInspector();
      scheduleReload();
    }
  }
}

/* writeNestedPath — like writePath but works on a plain object, not on block.data */
function writeNestedPath(obj, path, value) {
  const parts = path.match(/[^.[\]]+/g) || [];
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    if (cur[p] == null) cur[p] = nextIsIndex ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function readNestedPath(obj, path) {
  if (!path) return undefined;
  const parts = path.match(/[^.[\]]+/g) || [];
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

async function addBlock(type, atIndex) {
  const meta = STATE.presetMap.get(type);
  if (!meta) return;
  const block = {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    data: JSON.parse(JSON.stringify(meta.defaults || {})),
  };
  pushHistory();
  const blocks = STATE.currentPage.blocks;
  if (atIndex == null) atIndex = blocks.length;
  blocks.splice(atIndex, 0, block);
  STATE.selectedBlockId = block.id;
  markDirty();
  closeModal("add-block-modal");
  renderBlockList();
  renderInspector();
  reloadIframe();
}

function moveBlock(fromId, toId) {
  const blocks = STATE.currentPage.blocks;
  const fromIdx = blocks.findIndex((b) => b.id === fromId);
  const toIdx = blocks.findIndex((b) => b.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  pushHistory();
  const [item] = blocks.splice(fromIdx, 1);
  blocks.splice(toIdx, 0, item);
  markDirty();
  renderBlockList();
  reloadIframe();
}

function pushHistory() {
  STATE.history.push(JSON.parse(JSON.stringify(STATE.currentPage)));
  if (STATE.history.length > 50) STATE.history.shift();
}

function undo() {
  const prev = STATE.history.pop();
  if (!prev) return;
  STATE.currentPage = prev;
  STATE.selectedBlockId = null;
  markDirty();
  renderAll();
  reloadIframe();
}

/* ================================================================ *
 *  SAVE / DIRTY STATE
 * ================================================================ */

function markDirty() {
  STATE.dirty = true;
  setSaveEnabled(true);
  setStatus("Modified — Cmd/Ctrl+S to save", "dirty");
}

function setSaveEnabled(on) {
  $("#save-btn").disabled = !on;
}

async function saveAll() {
  if (!STATE.dirHandle || !STATE.dirty) return;
  try {
    await writeJson(`src/data/pages/${STATE.currentPageSlug}.json`, STATE.currentPage);
    if (STATE.theme) await writeJson("src/data/theme.json", STATE.theme);
    STATE.dirty = false;
    setSaveEnabled(false);
    setStatus("Saved", "ok");
    toast("Saved ✓", "ok");
  } catch (e) {
    console.error(e);
    toast("Save failed: " + (e?.message ?? e), "err");
    setStatus("Save failed", "err");
  }
}

/* ================================================================ *
 *  IFRAME RELOAD (debounced)
 * ================================================================ */

let reloadTimer = null;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(reloadIframe, 350);
}
async function reloadIframe() {
  // Write to disk first so dev server picks up the change, then reload
  if (STATE.dirHandle && STATE.currentPage) {
    try {
      await writeJson(`src/data/pages/${STATE.currentPageSlug}.json`, STATE.currentPage);
    } catch {}
  }
  const f = $("#preview");
  if (!f) return;
  f.src = f.src.replace(/#cache=\d+$/, "") + `#cache=${Date.now()}`;
}

/* ================================================================ *
 *  TOAST / STATUS
 * ================================================================ */

const TOAST = $("#toast");
let toastTimer = null;
function toast(msg, kind = "") {
  TOAST.textContent = msg;
  TOAST.className = "toast is-visible " + (kind ? `is-${kind}` : "");
  TOAST.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    TOAST.classList.remove("is-visible");
  }, 2400);
}

function setStatus(text, kind = "") {
  const s = $("#status-pill");
  s.textContent = text;
  s.className = "status-pill " + (kind ? `is-${kind}` : "");
}

/* ================================================================ *
 *  MODAL
 * ================================================================ */

function openModal(id) {
  const m = document.getElementById(id);
  m?.classList.remove("hidden");
}
function closeModal(id) {
  const m = document.getElementById(id);
  m?.classList.add("hidden");
}

function renderAddBlockGrid(cat = "all") {
  const grid = $("#add-block-grid");
  const items = STATE.presets.blocks.filter(
    (b) => b.kind === "preset" && (cat === "all" || b.category === cat)
  );
  grid.innerHTML = items.map(libCardHTML).join("");
  $$(".lib-card", grid).forEach((card) => {
    card.addEventListener("click", () => addBlock(card.dataset.type));
  });
}

/* ================================================================ *
 *  TAB SWITCHING
 * ================================================================ */

function switchTab(tab) {
  STATE.tab = tab;
  $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
  $$(".panel").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== tab));
}

function switchViewport(vp) {
  STATE.viewport = vp;
  $$(".vp").forEach((b) => b.classList.toggle("is-active", b.dataset.vp === vp));
  const vph = $("#viewport");
  vph.classList.remove("is-mobile", "is-desktop", "is-fluid");
  vph.classList.add(`is-${vp}`);
  $("#viewport-info").textContent =
    vp === "mobile" ? "iPhone 14 — 390 × 844" :
    vp === "desktop" ? "Desktop — 1440 × auto" :
    "Fluid — full available width";
}

/* ================================================================ *
 *  IFRAME MESSAGING
 * ================================================================ */

window.addEventListener("message", (e) => {
  const msg = e.data;
  if (!msg || typeof msg !== "object" || !msg.type?.startsWith("studio:")) return;
  switch (msg.type) {
    case "studio:ready":
      // Tell iframe to apply highlighting
      if (STATE.selectedBlockId) {
        e.source.postMessage({ type: "studio:highlight", id: STATE.selectedBlockId }, "*");
      }
      break;
    case "studio:block-click":
      selectBlock(msg.id);
      break;
    case "studio:text-edit": {
      handleTextEdit(msg);
      break;
    }
  }
});

/* ================================================================ *
 *  HELPERS
 * ================================================================ */

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

/* ================================================================ *
 *  BOOT
 * ================================================================ */

async function boot() {
  // Load presets
  const res = await fetch(PRESETS_URL);
  STATE.presets = await res.json();
  STATE.presetMap = new Map(STATE.presets.blocks.map((b) => [b.type, b]));

  // Wire UI
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  $$(".vp").forEach((b) => b.addEventListener("click", () => switchViewport(b.dataset.vp)));
  $("#open-project").addEventListener("click", pickProject);
  $("#save-btn").addEventListener("click", saveAll);
  $("#add-block-btn").addEventListener("click", () => {
    renderAddBlockGrid("all");
    openModal("add-block-modal");
  });
  $$(".cat-tab").forEach((t) => t.addEventListener("click", () => {
    $$(".cat-tab").forEach((x) => x.classList.toggle("is-active", x === t));
    renderAddBlockGrid(t.dataset.cat);
  }));
  $$('[data-close]').forEach((el) => el.addEventListener("click", () => closeModal("add-block-modal")));
  $("#lib-search").addEventListener("input", renderLibrary);

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      saveAll();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
  });

  // Initial render
  renderAll();
}

boot();
