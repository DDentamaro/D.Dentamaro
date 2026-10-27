"""Regenerates the synthetic images in tests/fixtures/inbox (no real manga pages).

    python tests/fixtures/make_fixtures.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

INBOX = Path(__file__).parent / "inbox"


def panel(size, color, mode="RGB"):
    w, h = size
    im = Image.new(mode, size, (*color, 255) if mode == "RGBA" else color)
    d = ImageDraw.Draw(im)
    ink = (20, 20, 20, 255) if mode == "RGBA" else (20, 20, 20)
    d.rectangle([0, 0, w - 1, h - 1], outline=ink, width=max(2, w // 100))
    d.line([0, 0, w, h], fill=ink, width=max(2, w // 150))
    d.ellipse([w * 0.3, h * 0.3, w * 0.7, h * 0.7], outline=ink, width=max(2, w // 150))
    return im


def main():
    INBOX.mkdir(exist_ok=True)
    panel((1600, 900), (200, 70, 60)).save(INBOX / "orizzontale.jpg", quality=90)
    panel((900, 1400), (60, 110, 190)).save(INBOX / "verticale.jpg", quality=90)
    panel((1200, 1200), (70, 160, 90)).save(INBOX / "quadrata.jpg", quality=90)
    panel((300, 400), (230, 180, 40), "RGBA").save(INBOX / "piccola.png")
    # Stored landscape, EXIF says "rotate 90° CW": it must come out portrait.
    rotated = panel((1400, 1000), (150, 80, 170))
    exif = Image.Exif()
    exif[0x0112] = 6
    rotated.save(INBOX / "ruotata.jpg", quality=90, exif=exif)


if __name__ == "__main__":
    main()
