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
     5. Hero numeric counter (incrementing project count)
     ==================================================== */
  const counterEl = document.getElementById("project-counter");
  if (counterEl) {
    const target = 412;
    let current = 0;
    const step = () => {
      current += Math.max(1, Math.round((target - current) / 18));
      if (current >= target) {
        current = target;
        counterEl.textContent = String(target);
        return;
      }
      counterEl.textContent = String(current).padStart(3, "0");
      requestAnimationFrame(step);
    };
    // Start when scrolled near
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        step();
        obs.disconnect();
      }
    });
    obs.observe(counterEl);
  }
})();
