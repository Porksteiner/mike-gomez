/* VANTA — site interactivity. Vanilla, no deps. */

(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ====================================================
     1. Scroll progress bar
     ==================================================== */
  const bar = document.getElementById("scroll-progress");
  if (bar) {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = `scaleX(${pct})`;
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ====================================================
     2. Custom cursor (desktop fine-pointer only)
     ==================================================== */
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fineHover && !reduce) {
    document.body.classList.add("cursor-on");
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) {
        dot.style.left = mx + "px";
        dot.style.top = my + "px";
      }
    });
    const lerpLoop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring) {
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
      }
      requestAnimationFrame(lerpLoop);
    };
    lerpLoop();

    const setHover = (on) => document.body.classList.toggle("cursor-hover", on);
    document.querySelectorAll("a, button, [data-cursor='hover']").forEach((el) => {
      el.addEventListener("mouseenter", () => setHover(true));
      el.addEventListener("mouseleave", () => setHover(false));
    });
  }

  /* ====================================================
     3. Scroll-reveal (IntersectionObserver)
     ==================================================== */
  if (!reduce) {
    const reveals = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((r) => io.observe(r));
  } else {
    document.querySelectorAll(".reveal").forEach((r) => r.classList.add("in"));
  }

  /* ====================================================
     4. Live clock + status indicator
     ==================================================== */
  const clockEl = document.getElementById("live-time");
  if (clockEl) {
    const tick = () => {
      const opts = {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      clockEl.textContent = new Intl.DateTimeFormat("en-US", opts).format(new Date()) + " PT";
    };
    tick();
    setInterval(tick, 30_000);
  }

  /* ====================================================
     4a. Magnetic buttons — slightly follow cursor on hover
     ==================================================== */
  if (fineHover && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      let bounds = null;
      el.addEventListener("mouseenter", () => {
        bounds = el.getBoundingClientRect();
      });
      el.addEventListener("mousemove", (e) => {
        if (!bounds) return;
        const x = e.clientX - bounds.left - bounds.width / 2;
        const y = e.clientY - bounds.top - bounds.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        bounds = null;
      });
    });
  }

  /* ====================================================
     6. Creation of Adam — scroll progress (0 → 1)
     drives both --creation-p (CSS) and the video's currentTime
     ==================================================== */
  const adamSection = document.getElementById("creation-of-adam");
  const adamVideo  = document.getElementById("creation-video");
  if (adamSection && !reduce) {
    let videoReady = false;
    let lastT = -1;
    if (adamVideo) {
      const onMeta = () => {
        videoReady = !isNaN(adamVideo.duration) && adamVideo.duration > 0;
        update();
      };
      if (adamVideo.readyState >= 1) onMeta();
      adamVideo.addEventListener("loadedmetadata", onMeta);
      adamVideo.addEventListener("canplaythrough", onMeta);
      // Force fetch — Chrome sometimes won't preload otherwise
      adamVideo.load();
    }
    let scheduled = false;
    function update() {
      const rect = adamSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalScroll = Math.max(1, adamSection.offsetHeight - vh);
      const scrolled = Math.max(0, -rect.top);
      const p = Math.max(0, Math.min(1, scrolled / totalScroll));
      adamSection.style.setProperty("--creation-p", p.toFixed(4));

      // Seek video — only when sufficiently changed, to avoid jank
      if (videoReady && adamVideo) {
        const dur = adamVideo.duration;
        const target = p * dur;
        if (Math.abs(target - lastT) > 0.02) {
          // Use fastSeek when available (smoother) — else assign directly
          try {
            if (typeof adamVideo.fastSeek === "function") {
              adamVideo.fastSeek(target);
            } else {
              adamVideo.currentTime = target;
            }
            lastT = target;
          } catch {}
        }
      }
    }
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        update();
        scheduled = false;
      });
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  } else if (adamSection && reduce) {
    // Reduced-motion: hold the end state — hands touching, light visible.
    adamSection.style.setProperty("--creation-p", "1");
    if (adamVideo) {
      adamVideo.addEventListener("loadedmetadata", () => {
        try { adamVideo.currentTime = adamVideo.duration; } catch {}
      });
    }
  }
})();

/* ====================================================================
   PHASE 2 — Card spotlight, headline split, image parallax, divider IO.
   Same IIFE-style top-level, additive only.
   ==================================================================== */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ----- 7. Card spotlight ----- */
  if (fineHover && !reduce) {
    document.querySelectorAll(".spotlight-host").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }, { passive: true });
    });
  }

  /* ----- 8. Headline character split + stagger reveal ----- */
  {
    const splitNode = (root) => {
      const wrapText = (text) => {
        const frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.appendChild(document.createTextNode(tok));
          } else {
            const word = document.createElement("span");
            word.className = "word";
            [...tok].forEach((ch, i) => {
              const c = document.createElement("span");
              c.className = "char";
              c.textContent = ch;
              c.style.transitionDelay = `${0.025 * i + 0.04}s`;
              word.appendChild(c);
            });
            frag.appendChild(word);
          }
        });
        return frag;
      };
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const wrapped = wrapText(child.textContent);
            if (wrapped.childNodes.length) child.replaceWith(wrapped);
          } else if (child.nodeType === Node.ELEMENT_NODE
                     && !child.classList.contains("char")
                     && !child.classList.contains("word")) {
            walk(child);
          }
        });
      };
      walk(root);
    };

    // In Studio mode, skip splitting — it shatters text into chars and breaks inline editing
    const inStudio = location.search.includes("studio=1");
    document.querySelectorAll("[data-split]").forEach((el) => {
      if (!inStudio) splitNode(el);
      if (reduce || inStudio) {
        el.classList.add("in");
        return;
      }
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            el.classList.add("in");
            obs.disconnect();
          }
        });
      }, { threshold: 0.1 });
      obs.observe(el);
    });
  }

  /* ----- 9. Image parallax ----- */
  if (!reduce) {
    const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
    if (parallaxEls.length) {
      let ticking = false;
      const update = () => {
        const vh = window.innerHeight;
        parallaxEls.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          const amount = parseFloat(el.dataset.parallax) || 16;
          el.style.setProperty("--py", String(-p * amount));
        });
        ticking = false;
      };
      document.addEventListener("scroll", () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      update();
    }
  }

  /* ----- 10. Section divider reveal ----- */
  {
    const dividers = document.querySelectorAll(".section-divider");
    if (!dividers.length) return;
    if (reduce) {
      dividers.forEach((d) => d.classList.add("in"));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add("in");
          obs.unobserve(ent.target);
        }
      });
    }, { threshold: 0.5 });
    dividers.forEach((d) => obs.observe(d));
  }
})();

/* ====================================================================
   PHASE 3 — Block-level scroll effects (fx-fade-up, fx-staircase,
             fx-mask, fx-parallax, fx-counter).
   Driven by IntersectionObserver + scroll handler.
   ==================================================================== */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    document.querySelectorAll(".fx-host").forEach((el) => el.classList.add("is-in"));
    return;
  }

  /* In-view triggers */
  const inviewSel = ".fx-fade-up, .fx-staircase, .fx-mask, .fx-counter";
  const ioInview = new IntersectionObserver((entries) => {
    entries.forEach((ent) => {
      if (ent.isIntersecting) {
        ent.target.classList.add("is-in");
        if (ent.target.classList.contains("fx-counter")) runCounter(ent.target);
        ioInview.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(inviewSel).forEach((el) => ioInview.observe(el));

  /* Parallax (host translates content) */
  const parallaxHosts = [...document.querySelectorAll(".fx-parallax")];
  if (parallaxHosts.length) {
    let ticking = false;
    const tick = () => {
      const vh = window.innerHeight;
      parallaxHosts.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty("--fxy", String(-p * 30));
      });
      ticking = false;
    };
    document.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(tick);
        ticking = true;
      }
    }, { passive: true });
    tick();
  }

  /* Counter — animate numeric values from 0 to current text */
  function runCounter(host) {
    host.querySelectorAll("[data-stat-value]").forEach((el) => {
      const text = el.textContent.trim();
      const m = text.match(/^(-?[\d,.]+)(\D*)$/);
      if (!m) return;
      const end = parseFloat(m[1].replace(/,/g, ""));
      const suffix = m[2] || "";
      if (Number.isNaN(end)) return;
      const start = 0;
      const dur = 1400;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(start + (end - start) * eased);
        el.textContent = `${v.toLocaleString()}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = `${m[1]}${suffix}`;
      };
      requestAnimationFrame(step);
    });
  }
})();

/* ====================================================================
   PHASE 4 — Depth layers parallax engine.
   Each .depth-layer has data-depth-speed (0..2). The container
   (.block-shell.has-depth) gets --depth-y per layer via JS that maps
   the layer's viewport offset times speed.
   ==================================================================== */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const layers = [...document.querySelectorAll(".depth-layer")];
  if (!layers.length) return;
  let ticking = false;
  const tick = () => {
    const vh = window.innerHeight;
    layers.forEach((el) => {
      const host = el.parentElement;
      if (!host) return;
      const r = host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      const speed = parseFloat(el.dataset.depthSpeed) || 0.5;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty("--depth-y", String(-p * 60 * speed));
    });
    ticking = false;
  };
  document.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(tick);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", tick, { passive: true });
  tick();
})();
