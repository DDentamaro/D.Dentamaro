"""Slide rendering: orientation, sRGB, fit/crop to 4:5 and the @koma.club signature.

Source files are only ever opened for reading.
"""

from __future__ import annotations

import io
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageCms, ImageColor, ImageDraw, ImageFont, ImageOps

from . import config
from .calendar import Slide

_SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
SRGB_ICC = _SRGB.tobytes()

# EXIF orientations that rotate the image by 90°/270°.
_SWAPPED_ORIENTATIONS = {5, 6, 7, 8}


def oriented_size(path: Path) -> tuple[int, int]:
    """Size after EXIF orientation, without decoding the pixels."""
    with Image.open(path) as im:
        w, h = im.size
        if im.getexif().get(0x0112) in _SWAPPED_ORIENTATIONS:
            w, h = h, w
    return w, h


def scale_factor(size: tuple[int, int], mode: str) -> float:
    """How much the source is enlarged (>1) or reduced (<1) to make the slide."""
    w, h = size
    if mode == "crop":
        return max(config.WIDTH / w, config.HEIGHT / h)
    inner_w = config.WIDTH - 2 * config.FIT_PADDING
    inner_h = config.HEIGHT - 2 * config.FIT_PADDING
    return min(inner_w / w, inner_h / h)


def load_rgb(path: Path, background: str) -> Image.Image:
    """Open, apply EXIF orientation, convert to sRGB and flatten transparency."""
    with Image.open(path) as src:
        src.load()
        icc = src.info.get("icc_profile")
        im = ImageOps.exif_transpose(src)

    if im.mode in ("RGBA", "LA", "PA") or (im.mode == "P" and "transparency" in im.info):
        rgba = im.convert("RGBA")
        flat = Image.new("RGBA", rgba.size, ImageColor.getrgb(background))
        flat.alpha_composite(rgba)
        im = flat.convert("RGB")

    if icc and im.mode in ("RGB", "CMYK"):
        try:
            source_profile = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            return ImageCms.profileToProfile(im, source_profile, _SRGB, outputMode="RGB")
        except (ImageCms.PyCMSError, OSError):
            pass
    return im.convert("RGB")


def fit(im: Image.Image, background: str) -> Image.Image:
    scale = scale_factor(im.size, "fit")
    w = max(1, round(im.width * scale))
    h = max(1, round(im.height * scale))
    resized = im.resize((w, h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (config.WIDTH, config.HEIGHT), ImageColor.getrgb(background))
    canvas.paste(resized, ((config.WIDTH - w) // 2, (config.HEIGHT - h) // 2))
    return canvas


def crop(im: Image.Image, focus: tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    """Largest 4:5 window centred on the focus point (clamped to the image)."""
    w, h = im.size
    ratio = config.WIDTH / config.HEIGHT
    if w / h > ratio:
        cw, ch = h * ratio, float(h)
    else:
        cw, ch = float(w), w / ratio
    cx = min(max(focus[0] * w, cw / 2), w - cw / 2)
    cy = min(max(focus[1] * h, ch / 2), h - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return im.resize((config.WIDTH, config.HEIGHT), Image.Resampling.LANCZOS, box=box)


@lru_cache(maxsize=4)
def _font(path: str) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, config.SIGNATURE_SIZE)


def sign(im: Image.Image, handle: str, font_path: Path) -> Image.Image:
    """Draw the handle bottom-right; the anchor keeps it in the same spot on every slide."""
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    r, g, b = ImageColor.getrgb(config.SIGNATURE_COLOR)
    alpha = round(255 * config.SIGNATURE_OPACITY)
    ImageDraw.Draw(overlay).text(
        (im.width - config.SIGNATURE_MARGIN, im.height - config.SIGNATURE_MARGIN),
        handle,
        font=_font(str(font_path)),
        fill=(r, g, b, alpha),
        anchor="rd",
    )
    out = im.convert("RGBA")
    out.alpha_composite(overlay)
    return out.convert("RGB")


def render_slide(path: Path, slide: Slide, *, mode: str, background: str, handle: str, font_path: Path) -> Image.Image:
    im = load_rgb(path, background)
    out = crop(im, slide.focus) if mode == "crop" else fit(im, background)
    return sign(out, handle, font_path)


def save_jpeg(im: Image.Image, path: Path) -> None:
    im.save(path, "JPEG", quality=config.JPEG_QUALITY, icc_profile=SRGB_ICC, optimize=True)
