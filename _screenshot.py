"""Screenshot key sections after the major rework."""

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

    # Numbers (verify no 000)
    page.evaluate("document.querySelector('section.bg-void:nth-of-type(5)')?.scrollIntoView({block: 'center'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "10-numbers-fixed.png"), full_page=False)
    print("  numbers")

    # Testimonials
    page.evaluate("document.getElementById('testimonials')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "11-testimonials.png"), full_page=False)
    print("  testimonials")

    # Work (BaitIQ + Unlearn — both full width now)
    page.evaluate("document.getElementById('work')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "12-work-new.png"), full_page=False)
    print("  work")

    # FAQ
    page.evaluate("document.getElementById('faq')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "13-faq.png"), full_page=False)
    print("  faq")

    # Full page 1x
    ctx.close()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1800)
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)
    page.screenshot(path=str(OUT / "14-full.png"), full_page=True)
    print("  full")

    browser.close()
print("Done")
