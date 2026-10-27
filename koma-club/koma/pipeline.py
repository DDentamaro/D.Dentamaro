"""check / build / reel, shared by the CLI and the tests."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from datetime import date
from pathlib import Path

import yaml
from PIL import Image, ImageColor

from . import captions, config, images
from .calendar import Issue, Post, Report, Week, load_week
from .config import Settings


class PipelineError(Exception):
    pass


# --- locating calendar files -------------------------------------------------


def week_file(settings: Settings, week: str) -> Path:
    for ext in (".yaml", ".yml"):
        path = settings.calendar_dir / f"{week}{ext}"
        if path.exists():
            return path
    return settings.calendar_dir / f"{week}.yaml"


def find_week_for_date(settings: Settings, day: date) -> Path:
    """The calendar file that has a post on `day`."""
    candidates = sorted(settings.calendar_dir.glob("*.y*ml"))
    for path in candidates:
        try:
            raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError:
            continue
        for post in raw.get("posts") or []:
            if isinstance(post, dict) and str(post.get("date")) == day.isoformat():
                return path
    raise PipelineError(f"nessun post in data {day} nei calendari di {settings.calendar}/")


# --- check -------------------------------------------------------------------


def slide_mode(settings: Settings, mode: str | None) -> str:
    return mode or settings.mode


def check(settings: Settings, path: Path) -> tuple[Week | None, Report]:
    """Validate calendar, images and captions without writing anything."""
    week, report = load_week(path, settings.inbox_dir, settings.root)
    if week is None:
        return None, report
    source = _display(path, settings)

    for post in week.posts:
        def add(level: str, message: str, field: str | None = None) -> None:
            report.issues.append(Issue(level, source, message, post.label, field, post.index))

        for n, slide in enumerate(post.slides, start=1):
            try:
                size = images.oriented_size(settings.inbox_dir / slide.file)
            except (OSError, Image.DecompressionBombError) as exc:
                add("errore", f"{slide.file} non è un'immagine leggibile ({exc.__class__.__name__})", f"images[{n}]")
                continue
            scale = images.scale_factor(size, slide_mode(settings, slide.mode))
            if scale > config.MAX_UPSCALE:
                add(
                    "avviso",
                    f"{slide.file} è piccola ({size[0]}×{size[1]} px), verrà ingrandita {_num(scale)}×",
                    f"images[{n}]",
                )
        for message in captions.limit_errors(captions.build_caption(post)):
            add("errore", message, "didascalia")

    return week, report


def _num(value: float) -> str:
    return f"{value:.1f}".replace(".", ",")


def _display(path: Path, settings: Settings) -> str:
    try:
        return str(path.relative_to(settings.root))
    except ValueError:
        return path.name


# --- build -------------------------------------------------------------------


def _write_post(settings: Settings, post: Post, dest: Path) -> None:
    dest.mkdir(parents=True)
    for n, slide in enumerate(post.slides, start=1):
        im = images.render_slide(
            settings.inbox_dir / slide.file,
            slide,
            mode=slide_mode(settings, slide.mode),
            background=settings.background,
            handle=settings.handle,
            font_path=settings.font_path,
        )
        images.save_jpeg(im, dest / f"{n:02d}.jpg")
    (dest / "caption.txt").write_text(captions.build_caption(post) + "\n", encoding="utf-8")
    (dest / "alt.txt").write_text(captions.build_alt(post) + "\n", encoding="utf-8")


def _replace_dir(tmp: Path, final: Path) -> None:
    if final.exists():
        shutil.rmtree(final)
    tmp.rename(final)


def week_out_dir(settings: Settings, week: Week) -> Path:
    return settings.out_dir / week.week_start.isoformat()


def build_week(settings: Settings, week: Week, report: Report) -> Path:
    """Regenerate out/<week_start>/ entirely; other weeks are untouched."""
    final = week_out_dir(settings, week)
    tmp = final.with_name(f".{final.name}.tmp")
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    try:
        for post in week.posts:
            _write_post(settings, post, tmp / post.folder_name)
        (tmp / "riepilogo.md").write_text(summary(week, report), encoding="utf-8")
    except BaseException:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    _replace_dir(tmp, final)
    return final


def build_post(settings: Settings, week: Week, post: Post) -> Path:
    """Regenerate one post folder; the rest of the week and riepilogo.md are untouched."""
    final = week_out_dir(settings, week) / post.folder_name
    tmp = final.with_name(f".{final.name}.tmp")
    if tmp.exists():
        shutil.rmtree(tmp)
    try:
        _write_post(settings, post, tmp)
    except BaseException:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    _replace_dir(tmp, final)
    return final


def _cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


def summary(week: Week, report: Report) -> str:
    lines = [
        f"# Settimana {week.week_start.isoformat()}",
        "",
        "| Data | Rubrica | Opera | Slide | Avvisi |",
        "| --- | --- | --- | ---: | --- |",
    ]
    for post in week.posts:
        weekday = config.WEEKDAYS_IT[post.date.weekday()]
        operas = list(dict.fromkeys(c.opera for c in post.credits))
        warnings = [
            f"{i.field}: {i.message}" if i.field else i.message
            for i in report.for_post(post.index)
            if i.level == "avviso"
        ]
        lines.append(
            "| "
            + " | ".join(
                [
                    f"{post.date.isoformat()} {weekday}",
                    _cell(post.rubrica),
                    _cell(" / ".join(operas)),
                    str(len(post.slides)),
                    _cell("; ".join(warnings)) or "—",
                ]
            )
            + " |"
        )
    general = [i for i in report.warnings if i.post_index is None]
    if general:
        lines += ["", "## Avvisi generali", ""]
        lines += [f"- {i.field + ': ' if i.field else ''}{i.message}" for i in general]
    total = sum(len(p.slides) for p in week.posts)
    lines += ["", f"{len(week.posts)} post, {total} slide, {len(report.warnings)} avvisi.", ""]
    return "\n".join(lines)


# --- reel --------------------------------------------------------------------


def reel_filter(n: int) -> str:
    """xfade chain: each slide owns a 2.5 s slot, fading into the next over 0.3 s."""
    prep = [f"[{i}:v]fps={config.REEL_FPS},format=yuv420p,setsar=1[v{i}]" for i in range(n)]
    if n == 1:
        return ";".join(prep) + ";[v0]null[out]"
    chain, prev = [], "v0"
    for i in range(1, n):
        offset = i * config.REEL_SLIDE_SECONDS
        label = "out" if i == n - 1 else f"x{i}"
        chain.append(
            f"[{prev}][v{i}]xfade=transition=fade:duration={config.REEL_FADE_SECONDS}:offset={offset:.3f}[{label}]"
        )
        prev = label
    return ";".join(prep + chain)


def make_reel(settings: Settings, week: Week, post: Post) -> Path:
    if post.formato != "carosello":
        raise PipelineError(f"{post.label}: il reel si genera solo dai caroselli")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise PipelineError("ffmpeg non trovato: installalo per generare i reel")

    dest_dir = week_out_dir(settings, week) / post.folder_name
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "reel.mp4"
    n = len(post.slides)

    with tempfile.TemporaryDirectory(prefix="koma-reel-") as tmp:
        inputs: list[str] = []
        bg = ImageColor.getrgb(settings.background)
        for i, slide in enumerate(post.slides):
            im = images.render_slide(
                settings.inbox_dir / slide.file,
                slide,
                mode=slide_mode(settings, slide.mode),
                background=settings.background,
                handle=settings.handle,
                font_path=settings.font_path,
            )
            frame = Image.new("RGB", (config.REEL_WIDTH, config.REEL_HEIGHT), bg)
            frame.paste(im, ((config.REEL_WIDTH - im.width) // 2, (config.REEL_HEIGHT - im.height) // 2))
            frame_path = Path(tmp) / f"{i:02d}.png"
            frame.save(frame_path)
            # Every slide but the last runs into the next one's fade.
            seconds = config.REEL_SLIDE_SECONDS + (config.REEL_FADE_SECONDS if i < n - 1 else 0)
            inputs += ["-loop", "1", "-framerate", str(config.REEL_FPS), "-t", f"{seconds:.3f}", "-i", str(frame_path)]

        cmd = [
            ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
            *inputs,
            "-filter_complex", reel_filter(n),
            "-map", "[out]", "-an",
            "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
            "-r", str(config.REEL_FPS), "-movflags", "+faststart",
            str(dest),
        ]  # fmt: skip
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise PipelineError(f"ffmpeg non è riuscito a creare il reel: {result.stderr.strip()}")
    return dest
