"""Screenshot the Creation of Adam section at multiple scroll progresses."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots")

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.mouse.move(0, 0)

    # Find the Creation section's scroll range
    info = page.evaluate("""
() => {
  const s = document.getElementById('creation-of-adam');
  const rect = s.getBoundingClientRect();
  return {
    sectionTop: rect.top + window.scrollY,
    sectionHeight: s.offsetHeight,
    vh: window.innerHeight,
  };
}
""")
    section_top = info['sectionTop']
    section_height = info['sectionHeight']
    vh = info['vh']
    total_scroll = section_height - vh
    print(f"Section: top={section_top}, height={section_height}, vh={vh}, total_scroll={total_scroll}")

    # Screenshot at scroll progress: 0.0, 0.5, 0.9, 1.0
    for p_target in [0.0, 0.5, 0.9, 1.0]:
        scroll_y = section_top + (total_scroll * p_target)
        page.evaluate(f"window.scrollTo({{top: {scroll_y}, behavior: 'instant'}})")
        page.wait_for_timeout(500)
        name = f"adam-p{int(p_target*100):03d}.png"
        page.screenshot(path=str(OUT / name), full_page=False)
        print(f"  {name} at scroll {scroll_y:.0f}")

    browser.close()
print("Done")
