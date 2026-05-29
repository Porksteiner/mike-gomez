/* ================================================================ *
 *  STUDIO INJECT — loaded inside the live site iframe when the URL
 *  carries ?studio=1. Provides:
 *    - block hover / click → posts to parent Studio
 *    - inline text edit via contentEditable on [data-edit] spans
 *    - highlight overlay for selected block
 * ================================================================ */

(() => {
  if (window.parent === window) return; // only run in iframes
  const PARENT = window.parent;

  /* ---------- Inject style for editable hints ---------- */
  const style = document.createElement("style");
  style.id = "__studio_styles__";
  style.textContent = `
    [data-edit] {
      cursor: text !important;
      outline: 1px dashed transparent;
      outline-offset: 3px;
      transition: outline-color 0.15s, background 0.15s;
    }
    [data-edit]:hover {
      outline-color: rgba(212, 175, 109, 0.6);
      background: rgba(212, 175, 109, 0.06);
    }
    [data-edit].__studio_editing__ {
      outline: 2px solid #d4af6d !important;
      background: rgba(212, 175, 109, 0.08) !important;
      cursor: text !important;
    }
    [data-block-id] {
      cursor: pointer;
    }
    body.__studio_editing__ [data-edit]:not(.__studio_editing__):hover {
      outline-color: transparent !important;
      background: transparent !important;
    }
  `;
  document.head.appendChild(style);

  /* ---------- Overlay (selection / hover highlight) ---------- */
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; pointer-events: none; z-index: 2147483647;
    transition: outline 0.15s, background 0.15s;
    box-sizing: border-box;
  `;
  overlay.id = "__studio_overlay__";
  const label = document.createElement("div");
  label.style.cssText = `
    position: absolute; padding: 3px 9px; font: 600 11px/1 ui-monospace, monospace;
    background: #d4af6d; color: #1a1308; border-radius: 0 4px 0 0;
    bottom: 100%; left: 0; letter-spacing: 0.08em; text-transform: uppercase;
    pointer-events: none; white-space: nowrap;
  `;
  overlay.appendChild(label);
  document.documentElement.appendChild(overlay);

  let hoverEl = null;
  let selectedEl = null;

  function findBlockAncestor(el) {
    while (el && el !== document.body) {
      if (el.dataset?.blockId) return el;
      el = el.parentElement;
    }
    return null;
  }

  function paintOverlay(target, kind) {
    if (!target) {
      overlay.style.display = "none";
      return;
    }
    const r = target.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = r.left + "px";
    overlay.style.top = r.top + "px";
    overlay.style.width = r.width + "px";
    overlay.style.height = r.height + "px";
    overlay.style.outline = kind === "selected"
      ? "2px solid #d4af6d"
      : "1px dashed rgba(212, 175, 109, 0.7)";
    overlay.style.background = kind === "selected"
      ? "rgba(212, 175, 109, 0.06)"
      : "transparent";
    label.textContent = `${target.dataset.blockType || ""}`;
  }

  function reposition() {
    paintOverlay(selectedEl || hoverEl, selectedEl ? "selected" : "hover");
  }

  /* ---------- Hover ---------- */
  document.addEventListener("mousemove", (e) => {
    if (document.body.classList.contains("__studio_editing__")) return;
    // Don't paint hover overlay if user is over a [data-edit] (its own hover is the cue)
    if (e.target.closest("[data-edit]")) {
      hoverEl = null;
      reposition();
      return;
    }
    const target = findBlockAncestor(e.target);
    if (target !== hoverEl) {
      hoverEl = target;
      reposition();
    }
  });
  document.addEventListener("mouseleave", () => {
    hoverEl = null;
    reposition();
  });

  /* ---------- Click — selects block, optionally enters edit mode ---------- */
  document.addEventListener("click", (e) => {
    if (document.body.classList.contains("__studio_editing__")) return;

    const editEl = e.target.closest("[data-edit]");
    const block = findBlockAncestor(e.target);

    if (block) {
      // Prevent native link navigation while editing
      const link = e.target.closest("a[href]");
      if (link) {
        e.preventDefault();
      }
      selectedEl = block;
      reposition();
      PARENT.postMessage({
        type: "studio:block-click",
        id: block.dataset.blockId,
        blockType: block.dataset.blockType,
      }, "*");
    }

    if (editEl) {
      e.preventDefault();
      e.stopPropagation();
      startEdit(editEl, block);
    }
  }, true);

  /* ---------- Inline text editing ---------- */
  function startEdit(el, blockEl) {
    if (el.contentEditable === "true") return;
    document.body.classList.add("__studio_editing__");
    el.contentEditable = "true";
    el.classList.add("__studio_editing__");
    el.focus();

    // Select all content
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    });

    const finish = (commit = true) => {
      el.contentEditable = "false";
      el.classList.remove("__studio_editing__");
      document.body.classList.remove("__studio_editing__");
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("keydown", onKey);
      if (!commit) return;
      const block = blockEl || findBlockAncestor(el);
      if (!block) return;
      const field = el.dataset.edit;
      const value = el.textContent;
      PARENT.postMessage({
        type: "studio:text-edit",
        blockId: block.dataset.blockId,
        blockType: block.dataset.blockType,
        path: field,
        value,
      }, "*");
    };
    const onBlur = () => finish(true);
    const onKey = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    };
    el.addEventListener("blur", onBlur);
    el.addEventListener("keydown", onKey);
  }

  /* ---------- Receive highlights from parent ---------- */
  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (!msg || msg.type !== "studio:highlight") return;
    const el = document.querySelector(`[data-block-id="${msg.id}"]`);
    if (el) {
      selectedEl = el;
      reposition();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  /* ---------- Re-position on scroll / resize ---------- */
  window.addEventListener("scroll", reposition, { passive: true });
  window.addEventListener("resize", reposition, { passive: true });

  /* ---------- Studio ready ---------- */
  function ready() {
    overlay.style.display = "none";
    PARENT.postMessage({ type: "studio:ready" }, "*");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
