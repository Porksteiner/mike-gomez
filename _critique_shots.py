"""Critique screenshots — capture production site at multiple breakpoints + scroll positions."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots/critique")
OUT.mkdir(parents=True, exist_ok=True)
URL = "https://www.mikegomez.dev"


def force_reveals(page):
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # Desktop 1440 sharp
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(2200)
    force_reveals(page)
    page.mouse.move(0, 0)
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "01-hero.png"), full_page=False)
    print("  01-hero")

    sections = ["manifesto", "work", "now", "process", "faq", "stack", "contact"]
    for s in sections:
        page.evaluate(f"document.getElementById('{s}')?.scrollIntoView({{block:'start'}})")
        page.wait_for_timeout(500)
        page.screenshot(path=str(OUT / f"sec-{s}.png"), full_page=False)
        print(f"  sec-{s}")
    ctx.close()

    # 1x DPR full page
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1800)
    force_reveals(page)
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    print("  full")
    ctx.close()

    # Mobile
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1800)
    force_reveals(page)
    page.screenshot(path=str(OUT / "mobile-full.png"), full_page=True)
    print("  mobile-full")
    ctx.close()

    browser.close()
print("Done")
