"""Milestone 2: fit/crop, orientation, signature, resolution warnings."""

import io

import pytest
from PIL import Image, ImageChops, ImageCms

from koma import config, images
from koma.calendar import Slide

BG = "#F4F1EA"
BG_RGB = (0xF4, 0xF1, 0xEA)
RED = (220, 30, 30)


def solid(tmp_path, size, color=RED, name="src.png", **save):
    path = tmp_path / name
    Image.new("RGB", size, color).save(path, **save)
    return path


def content_box(im):
    """Bounding box of everything that is not the background (ignoring the signature corner)."""
    probe = im.copy()
    probe.paste(BG_RGB, (config.WIDTH - 300, config.HEIGHT - 70, config.WIDTH, config.HEIGHT))
    diff = ImageChops.difference(probe, Image.new("RGB", probe.size, BG_RGB)).convert("L")
    return diff.point(lambda v: 255 if v > 40 else 0).getbbox()


def render(path, mode="fit", focus=(0.5, 0.5)):
    return images.render_slide(
        path, Slide(path.name, mode, focus), mode=mode, background=BG,
        handle="@koma.club", font_path=config.DEFAULT_FONT,
    )


@pytest.mark.parametrize(
    "size",
    [(3000, 1000), (1600, 900), (900, 1600), (1000, 1250), (1200, 1200), (200, 300), (100, 100)],
    ids=["panoramica", "orizzontale", "verticale", "4:5", "quadrata", "piccola", "minuscola"],
)
def test_fit_exact_size_and_aspect(tmp_path, size):
    out = render(solid(tmp_path, size))
    assert out.size == (1080, 1350) and out.mode == "RGB"

    left, top, right, bottom = content_box(out)
    w, h = right - left, bottom - top
    assert w / h == pytest.approx(size[0] / size[1], rel=0.01)
    # Inside the 40 px inner margin, touching it on at least one axis, centred.
    assert left >= 40 and top >= 40 and right <= 1040 and bottom <= 1310
    assert w == 1000 or h == 1270
    assert abs(left - (1080 - right)) <= 1 and abs(top - (1350 - bottom)) <= 1
    assert out.getpixel((5, 5)) == BG_RGB


@pytest.mark.parametrize("size", [(3000, 1000), (900, 1600), (1200, 1200), (200, 300)])
def test_crop_fills_frame(tmp_path, size):
    out = render(solid(tmp_path, size), mode="crop")
    assert out.size == (1080, 1350)
    for xy in [(0, 0), (1079, 0), (0, 1349), (540, 675)]:
        assert max(abs(a - b) for a, b in zip(out.getpixel(xy), RED)) < 10


def test_crop_focus_moves_window(tmp_path):
    # Left half blue, right half red, wide image: focus decides which side survives.
    im = Image.new("RGB", (2000, 1000), RED)
    im.paste((30, 30, 220), (0, 0, 1000, 1000))
    path = tmp_path / "split.png"
    im.save(path)
    left = render(path, "crop", (0.0, 0.5))
    right = render(path, "crop", (1.0, 0.5))
    assert left.getpixel((540, 675))[2] > 200   # blue
    assert right.getpixel((540, 675))[0] > 200  # red
    centred = render(path, "crop", (0.5, 0.5))
    assert centred.getpixel((300, 675))[2] > 200 and centred.getpixel((780, 675))[0] > 200


def test_crop_vertical_focus(tmp_path):
    im = Image.new("RGB", (1000, 3000), RED)
    im.paste((30, 30, 220), (0, 0, 1000, 1500))
    path = tmp_path / "tall.png"
    im.save(path)
    assert render(path, "crop", (0.5, 0.0)).getpixel((540, 675))[2] > 200
    assert render(path, "crop", (0.5, 1.0)).getpixel((540, 675))[0] > 200


def test_exif_orientation_is_applied(tmp_path):
    im = Image.new("RGB", (1600, 800), RED)
    exif = Image.Exif()
    exif[0x0112] = 6  # rotate 90° CW on display
    path = tmp_path / "rot.jpg"
    im.save(path, exif=exif)
    assert images.oriented_size(path) == (800, 1600)
    left, top, right, bottom = content_box(render(path))
    assert (bottom - top) > (right - left)


def test_transparency_and_palette_become_rgb(tmp_path):
    path = tmp_path / "alpha.png"
    Image.new("RGBA", (500, 500), (0, 0, 0, 0)).save(path)
    out = render(path)
    assert out.mode == "RGB" and out.getpixel((540, 675)) == BG_RGB
    p = tmp_path / "pal.gif"
    Image.new("P", (400, 400), 3).save(p)
    assert render(p).size == (1080, 1350)


def test_icc_and_cmyk_sources_become_srgb(tmp_path):
    srgb = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
    path = tmp_path / "icc.jpg"
    Image.new("RGB", (500, 600), RED).save(path, icc_profile=srgb.tobytes())
    assert render(path).size == (1080, 1350)
    cmyk = tmp_path / "cmyk.jpg"
    Image.new("CMYK", (500, 600), (0, 200, 200, 0)).save(cmyk)
    assert render(cmyk).mode == "RGB"


def test_signature_bottom_right_same_place(tmp_path):
    blank = Image.new("RGB", (1080, 1350), BG_RGB)
    signed = images.sign(blank, "@koma.club", config.DEFAULT_FONT)
    left, top, right, bottom = ImageChops.difference(signed, blank).getbbox()
    assert right <= 1080 - 28 and right >= 1080 - 28 - 3
    assert bottom <= 1350 - 28 and bottom >= 1350 - 28 - 8
    assert bottom - top <= 22 and right - left > 60
    # Semi-transparent: never full #1A1A1A ink on the light background.
    darkest = min(signed.crop((left, top, right, bottom)).convert("L").tobytes())
    assert darkest > 80
    # Same anchor whatever the slide underneath.
    boxes = set()
    for size in [(3000, 1000), (900, 1600), (1200, 1200)]:
        unsigned = images.fit(images.load_rgb(solid(tmp_path, size), BG), BG)
        resigned = images.sign(unsigned, "@koma.club", config.DEFAULT_FONT)
        boxes.add(ImageChops.difference(resigned, unsigned).getbbox()[2:])
    assert boxes == {(right, bottom)}


def test_jpeg_output(tmp_path):
    out = tmp_path / "01.jpg"
    images.save_jpeg(render(solid(tmp_path, (800, 800))), out)
    with Image.open(out) as im:
        assert im.format == "JPEG" and im.size == (1080, 1350) and im.mode == "RGB"
        profile = ImageCms.ImageCmsProfile(io.BytesIO(im.info["icc_profile"]))
        assert "sRGB" in ImageCms.getProfileDescription(profile)


@pytest.mark.parametrize(
    "size, mode, warn",
    [((1000, 1270), "fit", False), ((660, 840), "fit", True), ((700, 900), "fit", False),
     ((1080, 1350), "crop", False), ((700, 900), "crop", True), ((4000, 4000), "fit", False)],
)
def test_upscale_threshold(size, mode, warn):
    assert (images.scale_factor(size, mode) > config.MAX_UPSCALE) is warn


def test_source_is_never_modified(tmp_path):
    path = solid(tmp_path, (1200, 900), name="orig.jpg")
    before = path.read_bytes()
    render(path)
    render(path, "crop")
    assert path.read_bytes() == before
