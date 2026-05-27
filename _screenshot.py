"""Capture the BaitIQ featured card fully."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots")
OUT.mkdir(exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)
    page.mouse.move(0, 0)
    page.wait_for_timeout(200)

    # Scroll the BaitIQ <article> into center of viewport
    page.evaluate("""
() => {
  const work = document.getElementById('work');
  if (!work) return;
  const firstArticle = work.querySelector('article');
  firstArticle?.scrollIntoView({block: 'center'});
}
""")
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / "06-work-baitiq.png"), full_page=False)
    print("  06-work-baitiq")
    browser.close()
print("Done")
