"""Zoom into a section transition + texture detail."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots")

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1800)
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)
    page.mouse.move(0, 0)
    page.wait_for_timeout(300)

    # Scroll to capabilities to see the section divider + hatch
    page.evaluate("document.getElementById('capabilities')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "04-capabilities-textured.png"), full_page=False)
    print("  04-capabilities-textured")

    # Scroll to Stack
    page.evaluate("document.getElementById('stack')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "05-stack-textured.png"), full_page=False)
    print("  05-stack-textured")

    browser.close()
print("Done")
