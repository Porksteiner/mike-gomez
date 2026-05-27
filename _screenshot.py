"""Screenshot BaitIQ card with laptop mockup."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots")

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 1000},
                              device_scale_factor=2)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)
    page.mouse.move(0, 0)
    page.wait_for_timeout(200)

    # Scroll to the BaitIQ card specifically
    page.evaluate("document.querySelector('#work article')?.scrollIntoView({block: 'center'})")
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / "baitiq-with-mockup.png"), full_page=False)
    print("  baitiq-with-mockup")
    browser.close()
print("Done")
