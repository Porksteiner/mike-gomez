"""Screenshot the rebuilt site after godmode pass."""

from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("D:/Vanta/_screenshots/godmode")
OUT.mkdir(parents=True, exist_ok=True)

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
    page.wait_for_timeout(300)

    page.screenshot(path=str(OUT / "01-hero.png"), full_page=False)
    print("  01-hero")

    # Creation moment at p=1
    page.evaluate("""
() => {
  const s = document.getElementById('creation-of-adam');
  const rect = s.getBoundingClientRect();
  const total = s.offsetHeight - window.innerHeight;
  window.scrollTo({top: window.scrollY + rect.top + total, behavior: 'instant'});
}
""")
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / "02-creation-touch.png"), full_page=False)
    print("  02-creation-touch")

    # Work section
    page.evaluate("document.getElementById('work')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "03-work.png"), full_page=False)
    print("  03-work")

    # How I work
    page.evaluate("document.getElementById('how')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "04-how.png"), full_page=False)
    print("  04-how")

    # FAQ
    page.evaluate("document.getElementById('faq')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "05-faq.png"), full_page=False)
    print("  05-faq")

    # Contact
    page.evaluate("document.getElementById('contact')?.scrollIntoView({block: 'start'})")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "06-contact.png"), full_page=False)
    print("  06-contact")

    # Footer with Bible verse — scroll to absolute bottom
    page.evaluate("window.scrollTo(0, document.body.scrollHeight - 900)")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "07-footer.png"), full_page=False)
    print("  07-footer")

    ctx.close()

    # Full page at 1x
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              device_scale_factor=1)
    page = ctx.new_page()
    page.goto("http://localhost:4321/", wait_until="networkidle")
    page.wait_for_timeout(1800)
    page.add_style_tag(content="""
        html.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    """)
    page.screenshot(path=str(OUT / "08-full.png"), full_page=True)
    print("  08-full")
    ctx.close()

    browser.close()
print("Done")
