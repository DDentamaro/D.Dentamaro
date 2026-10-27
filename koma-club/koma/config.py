"""Fixed constants and user settings loaded from config.yaml."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

# Instagram portrait format (4:5).
WIDTH = 1080
HEIGHT = 1350
FIT_PADDING = 40
JPEG_QUALITY = 92
MAX_UPSCALE = 1.5

SIGNATURE_MARGIN = 28
SIGNATURE_SIZE = 22
SIGNATURE_COLOR = "#1A1A1A"
SIGNATURE_OPACITY = 0.55

CAPTION_MAX_CHARS = 2200
CAPTION_MAX_HASHTAGS = 30
POST_MIN_HASHTAGS = 3
POST_MAX_HASHTAGS = 15
CAROUSEL_MIN = 2
CAROUSEL_MAX = 10

REEL_WIDTH = 1080
REEL_HEIGHT = 1920
REEL_SLIDE_SECONDS = 2.5
REEL_FADE_SECONDS = 0.3
REEL_FPS = 30

WEEKDAYS_IT = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FONT = PACKAGE_ROOT / "assets" / "fonts" / "Inter-Medium.otf"

MODES = ("fit", "crop")


@dataclass(frozen=True)
class Settings:
    root: Path
    handle: str = "@koma.club"
    background: str = "#F4F1EA"
    mode: str = "fit"
    inbox: str = "inbox"
    out: str = "out"
    calendar: str = "calendar"
    font: str | None = None

    @property
    def inbox_dir(self) -> Path:
        return self.root / self.inbox

    @property
    def out_dir(self) -> Path:
        return self.root / self.out

    @property
    def calendar_dir(self) -> Path:
        return self.root / self.calendar

    @property
    def font_path(self) -> Path:
        return (self.root / self.font) if self.font else DEFAULT_FONT


class ConfigError(Exception):
    pass


def load_settings(root: Path, config_file: Path | None = None) -> Settings:
    """Read config.yaml from the project root; every key is optional."""
    root = root.resolve()
    path = config_file or root / "config.yaml"
    if not path.exists():
        return Settings(root=root)
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise ConfigError(f"{path.name}: YAML non valido ({exc})") from exc
    if not isinstance(raw, dict):
        raise ConfigError(f"{path.name}: atteso un elenco di chiavi")

    paths = raw.get("paths") or {}
    settings = Settings(
        root=root,
        handle=str(raw.get("handle", Settings.handle)),
        background=str(raw.get("background", Settings.background)),
        mode=str(raw.get("mode", Settings.mode)),
        inbox=str(paths.get("inbox", Settings.inbox)),
        out=str(paths.get("out", Settings.out)),
        calendar=str(paths.get("calendar", Settings.calendar)),
        font=raw.get("font"),
    )
    if settings.mode not in MODES:
        raise ConfigError(f"{path.name}: mode deve essere fit o crop, non {settings.mode!r}")
    try:
        from PIL import ImageColor

        ImageColor.getrgb(settings.background)
    except ValueError as exc:
        raise ConfigError(f"{path.name}: background {settings.background!r} non è un colore valido") from exc
    if not settings.font_path.exists():
        raise ConfigError(f"{path.name}: font non trovato ({settings.font_path})")
    return settings
