"""Screenshot the desert/gold rebrand."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots")
OUT.mkdir(exist_ok=True)


def force_reveals(page):
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # Hero (sharp)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(2000)
    force_reveals(page)
    page.mouse.move(0, 0)
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / "01-hero-fold.png"), full_page=False)
    print("  01-hero-fold")
    ctx.close()

    # Full page at 1x to stay under canvas limit
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1800)
    force_reveals(page)
    page.screenshot(path=str(OUT / "02-home-full.png"), full_page=True)
    print("  02-home-full")
    ctx.close()

    # Mobile
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1800)
    force_reveals(page)
    page.screenshot(path=str(OUT / "03-mobile-full.png"), full_page=True)
    print("  03-mobile-full")
    ctx.close()

    browser.close()
print("Done")
