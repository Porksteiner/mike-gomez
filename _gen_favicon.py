"""Generate favicon.ico and favicon-32.png in the gold MG style."""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path("D:/Vanta/public")

# Render at 256 then downscale — gives nicer edges
SIZE = 256
BG = (5, 4, 3)        # void
ACCENT = (212, 175, 109)  # gold

img = Image.new("RGBA", (SIZE, SIZE), BG)
d = ImageDraw.Draw(img)

# Gold border
border_w = max(8, SIZE // 24)
d.rectangle([0, 0, SIZE - 1, SIZE - 1], outline=ACCENT, width=border_w)

# Try to use a bold font; fall back to default
for path in [
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/Arial Black.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]:
    try:
        font = ImageFont.truetype(path, int(SIZE * 0.55))
        break
    except Exception:
        font = None
if font is None:
    font = ImageFont.load_default()

text = "MG"
# Center the text
bbox = d.textbbox((0, 0), text, font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (SIZE - w) // 2 - bbox[0]
y = (SIZE - h) // 2 - bbox[1] - SIZE // 30
d.text((x, y), text, fill=ACCENT, font=font)

# Save 32x32 PNG
png32 = img.resize((32, 32), Image.LANCZOS)
png32.save(OUT / "favicon-32.png", "PNG")
print(f"Saved {OUT / 'favicon-32.png'}")

# Save 180x180 PNG (apple-touch-icon)
apple = img.resize((180, 180), Image.LANCZOS)
apple.save(OUT / "apple-touch-icon.png", "PNG")
print(f"Saved {OUT / 'apple-touch-icon.png'}")

# Save .ico with multiple sizes
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
img.save(OUT / "favicon.ico", format="ICO", sizes=ico_sizes)
print(f"Saved {OUT / 'favicon.ico'}")
