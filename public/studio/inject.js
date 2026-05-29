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

  /* ---------- 1. Outline overlay ---------- */
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;
    box-shadow: none; transition: outline 0.15s, background 0.15s;
  `;
  overlay.id = "__studio_overlay__";
  const label = document.createElement("div");
  label.style.cssText = `
    position: absolute; padding: 3px 9px; font: 600 11px/1 ui-monospace, monospace;
    background: #d4af6d; color: #1a1308; border-radius: 0 0 4px 0;
    transform: translateY(-100%); letter-spacing: 0.08em; text-transform: uppercase;
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
    label.style.left = "0";
    label.style.top = "0";
  }

  function reposition() {
    paintOverlay(selectedEl || hoverEl, selectedEl ? "selected" : "hover");
  }

  document.addEventListener("mousemove", (e) => {
    if (document.body.classList.contains("__studio_editing__")) return;
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

  /* ---------- 2. Click to select ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-edit]")) return; // inline editing handles its own
    const block = findBlockAncestor(e.target);
    if (block) {
      e.preventDefault();
      e.stopPropagation();
      selectedEl = block;
      reposition();
      PARENT.postMessage({ type: "studio:block-click", id: block.dataset.blockId }, "*");
    }
  }, true);

  /* ---------- 3. Inline text editing ---------- */
  function setupInlineEditing() {
    document.querySelectorAll("[data-edit]").forEach((el) => {
      if (el.__studioWired) return;
      el.__studioWired = true;
      el.style.cursor = "text";
      el.title = "Click to edit";
      el.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startEdit(el);
      });
    });
  }

  function startEdit(el) {
    document.body.classList.add("__studio_editing__");
    el.contentEditable = "true";
    el.classList.add("__studio_editing__");
    el.style.outline = "2px solid #d4af6d";
    el.style.outlineOffset = "2px";
    el.focus();
    // Select all content
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);

    const finish = () => {
      el.contentEditable = "false";
      el.classList.remove("__studio_editing__");
      el.style.outline = "";
      el.style.outlineOffset = "";
      document.body.classList.remove("__studio_editing__");
      // Post update
      const block = findBlockAncestor(el);
      if (!block) return;
      const field = el.dataset.edit;
      const value = el.textContent.trim();
      PARENT.postMessage({
        type: "studio:text-edit",
        blockId: block.dataset.blockId,
        path: field,
        value,
      }, "*");
      el.removeEventListener("blur", finish);
      el.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        el.blur();
      }
    };
    el.addEventListener("blur", finish);
    el.addEventListener("keydown", onKey);
  }

  /* ---------- 4. Receive highlights from parent ---------- */
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

  /* ---------- 5. Re-position on scroll / resize ---------- */
  window.addEventListener("scroll", reposition, { passive: true });
  window.addEventListener("resize", reposition, { passive: true });

  /* ---------- 6. Studio ready ---------- */
  function ready() {
    setupInlineEditing();
    PARENT.postMessage({ type: "studio:ready" }, "*");
    overlay.style.display = "none";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }

  // Re-wire when content changes (e.g. after iframe content updates)
  const mo = new MutationObserver(() => setupInlineEditing());
  mo.observe(document.body, { childList: true, subtree: true });
})();
