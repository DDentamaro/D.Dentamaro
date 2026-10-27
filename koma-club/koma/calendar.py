"""Loading and validation of the weekly editorial calendar (one YAML per week)."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import yaml

from . import config

FORMATS = ("singolo", "carosello")
HASHTAG_RE = re.compile(r"^\w+$")


@dataclass(frozen=True)
class Slide:
    file: str
    mode: str | None = None  # None means "use the default from config.yaml"
    focus: tuple[float, float] = (0.5, 0.5)


@dataclass(frozen=True)
class Credit:
    opera: str
    autore: str
    volume: Any = None
    capitolo: Any = None


@dataclass
class Post:
    index: int
    date: date
    rubrica: str
    formato: str
    slides: list[Slide]
    credits: list[Credit]
    testo: str
    hashtags: list[str]
    titolo: str | None = None
    domanda: str | None = None

    @property
    def label(self) -> str:
        return f"post {self.index} ({self.date.isoformat()}, {self.rubrica})"

    @property
    def folder_name(self) -> str:
        weekday = config.WEEKDAYS_IT[self.date.weekday()]
        return f"{self.date.isoformat()}_{weekday}_{slugify(self.rubrica)}"


@dataclass
class Week:
    path: Path
    week_start: date
    posts: list[Post]

    def post_on(self, day: date) -> list[Post]:
        return [p for p in self.posts if p.date == day]


@dataclass(frozen=True)
class Issue:
    level: str  # "errore" | "avviso"
    source: str
    message: str
    post: str | None = None
    field: str | None = None
    post_index: int | None = None

    def __str__(self) -> str:
        parts = [self.level.upper(), self.source]
        if self.post:
            parts.append(self.post)
        if self.field:
            parts.append(self.field)
        return " · ".join(parts) + f": {self.message}"


@dataclass
class Report:
    issues: list[Issue] = field(default_factory=list)

    @property
    def errors(self) -> list[Issue]:
        return [i for i in self.issues if i.level == "errore"]

    @property
    def warnings(self) -> list[Issue]:
        return [i for i in self.issues if i.level == "avviso"]

    @property
    def ok(self) -> bool:
        return not self.errors

    def for_post(self, index: int) -> list[Issue]:
        return [i for i in self.issues if i.post_index == index]

    def only_post(self, index: int) -> "Report":
        """Keep week-level issues and the issues of a single post."""
        return Report([i for i in self.issues if i.post_index in (None, index)])

    def extend(self, other: "Report") -> None:
        self.issues.extend(other.issues)


def slugify(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-") or "post"


class _Ctx:
    """Collects issues for one calendar file, tagging them with the current post."""

    def __init__(self, source: str, report: Report):
        self.source = source
        self.report = report
        self.post: str | None = None
        self.post_index: int | None = None

    def error(self, message: str, field_name: str | None = None) -> None:
        self._add("errore", message, field_name)

    def warn(self, message: str, field_name: str | None = None) -> None:
        self._add("avviso", message, field_name)

    def _add(self, level: str, message: str, field_name: str | None) -> None:
        self.report.issues.append(
            Issue(level, self.source, message, self.post, field_name, self.post_index)
        )


def _as_date(value: Any) -> date | None:
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value.strip())
        except ValueError:
            return None
    return None


def _text(raw: dict, key: str) -> str | None:
    value = raw.get(key)
    if value is None:
        return None
    return str(value).strip()


def load_week(path: Path, inbox: Path, display_root: Path | None = None) -> tuple[Week | None, Report]:
    """Parse and validate a week file. Returns (None, report) if it cannot be parsed at all."""
    report = Report()
    try:
        source = str(path.relative_to(display_root)) if display_root else path.name
    except ValueError:
        source = path.name
    ctx = _Ctx(source, report)

    if not path.exists():
        ctx.error("file del calendario non trovato")
        return None, report
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        ctx.error(f"YAML non valido: {exc}")
        return None, report
    if not isinstance(raw, dict):
        ctx.error("il file deve contenere week_start e posts")
        return None, report

    week_start = _as_date(raw.get("week_start"))
    if week_start is None:
        ctx.error("manca o non è una data (AAAA-MM-GG)", "week_start")
        return None, report
    if path.stem != week_start.isoformat():
        ctx.warn(f"il nome del file non corrisponde a week_start ({week_start})", "week_start")

    raw_posts = raw.get("posts")
    if not isinstance(raw_posts, list) or not raw_posts:
        ctx.error("serve un elenco di post non vuoto", "posts")
        return None, report

    posts: list[Post] = []
    for i, raw_post in enumerate(raw_posts, start=1):
        post = _parse_post(i, raw_post, week_start, inbox, ctx)
        if post is not None:
            posts.append(post)

    ctx.post = ctx.post_index = None
    seen: dict[str, Post] = {}
    for post in posts:
        other = seen.get(post.folder_name)
        if other:
            ctx.post, ctx.post_index = post.label, post.index
            ctx.error(f"stessa data e rubrica del post {other.index}: le cartelle di output coinciderebbero")
        seen[post.folder_name] = post

    return Week(path, week_start, posts), report


def _parse_post(index: int, raw: Any, week_start: date, inbox: Path, ctx: _Ctx) -> Post | None:
    ctx.post, ctx.post_index = f"post {index}", index
    if not isinstance(raw, dict):
        ctx.error("ogni post deve essere un elenco di campi")
        return None

    day = _as_date(raw.get("date"))
    rubrica = _text(raw, "rubrica") or ""
    ctx.post = f"post {index} ({day.isoformat() if day else '?'}, {rubrica or '?'})"
    valid = True

    if day is None:
        ctx.error("manca o non è una data (AAAA-MM-GG)", "date")
        valid = False
    elif not (week_start <= day < week_start + timedelta(days=7)):
        end = week_start + timedelta(days=6)
        ctx.error(f"{day} è fuori dalla settimana {week_start} – {end}", "date")
        valid = False

    if not rubrica:
        ctx.error("campo obbligatorio", "rubrica")
        valid = False

    formato = _text(raw, "formato")
    if formato not in FORMATS:
        ctx.error(f"deve essere singolo o carosello, non {formato!r}", "formato")
        valid = False

    slides = _parse_slides(raw.get("images"), formato, inbox, ctx)
    if slides is None:
        valid = False

    credits = _parse_credits(raw, ctx)
    if credits is None:
        valid = False

    testo = _text(raw, "testo")
    if not testo:
        ctx.error("campo obbligatorio", "testo")
        valid = False

    hashtags = _parse_hashtags(raw.get("hashtags"), ctx)
    if hashtags is None:
        valid = False

    if not valid:
        return None
    return Post(
        index=index,
        date=day,
        rubrica=rubrica,
        formato=formato,
        slides=slides,
        credits=credits,
        testo=testo,
        hashtags=hashtags,
        titolo=_text(raw, "titolo") or None,
        domanda=_text(raw, "domanda") or None,
    )


def _parse_slides(raw: Any, formato: str | None, inbox: Path, ctx: _Ctx) -> list[Slide] | None:
    if not isinstance(raw, list) or not raw:
        ctx.error("serve un elenco di immagini", "images")
        return None

    ok = True
    if formato == "singolo" and len(raw) != 1:
        ctx.error(f"post singolo con {len(raw)} immagini, ne serve esattamente 1", "images")
        ok = False
    elif formato == "carosello" and not (config.CAROUSEL_MIN <= len(raw) <= config.CAROUSEL_MAX):
        ctx.error(
            f"carosello con {len(raw)} immagin{'e' if len(raw) == 1 else 'i'}, "
            f"ne servono da {config.CAROUSEL_MIN} a {config.CAROUSEL_MAX}",
            "images",
        )
        ok = False

    slides: list[Slide] = []
    for n, item in enumerate(raw, start=1):
        where = f"images[{n}]"
        if isinstance(item, str):
            slide = Slide(item.strip())
        elif isinstance(item, dict) and isinstance(item.get("file"), str):
            mode = item.get("mode")
            if mode is not None and mode not in config.MODES:
                ctx.error(f"mode deve essere fit o crop, non {mode!r}", where)
                ok = False
                continue
            focus = item.get("focus", [0.5, 0.5])
            if (
                not isinstance(focus, list)
                or len(focus) != 2
                or not all(isinstance(v, (int, float)) and 0 <= v <= 1 for v in focus)
            ):
                ctx.error("focus deve essere [x, y] con valori tra 0 e 1", where)
                ok = False
                continue
            if "focus" in item and mode != "crop":
                ctx.warn("focus vale solo con mode: crop, verrà ignorato", where)
            slide = Slide(item["file"].strip(), mode, (float(focus[0]), float(focus[1])))
        else:
            ctx.error("ogni immagine è un nome di file oppure {file, mode, focus}", where)
            ok = False
            continue

        if Path(slide.file).name != slide.file:
            ctx.error(f"{slide.file}: indica solo il nome del file dentro inbox/", where)
            ok = False
        elif not (inbox / slide.file).is_file():
            ctx.error(f"{slide.file} non esiste in {inbox.name}/", where)
            ok = False
        slides.append(slide)

    return slides if ok else None


def _parse_credit(raw: Any, where: str, ctx: _Ctx) -> Credit | None:
    if not isinstance(raw, dict):
        ctx.error("ogni credito deve avere opera e autore", where)
        return None
    opera = _text(raw, "opera")
    autore = _text(raw, "autore")
    prefix = f"{where}." if where else ""
    if not opera or not autore:
        missing = [k for k, v in (("opera", opera), ("autore", autore)) if not v]
        ctx.error("campo obbligatorio", prefix + "/".join(missing))
        return None
    volume = raw.get("volume")
    if volume is None or str(volume).strip() == "":
        ctx.warn("volume mancante, in didascalia comparirà vol. [__]", prefix + "volume")
        volume = None
    return Credit(opera, autore, volume, raw.get("capitolo"))


def _parse_credits(raw: dict, ctx: _Ctx) -> list[Credit] | None:
    has_single = "opera" in raw or "autore" in raw
    crediti = raw.get("crediti")
    if has_single and crediti is not None:
        ctx.error("usa opera + autore oppure crediti, non entrambi", "crediti")
        return None
    if crediti is not None:
        if not isinstance(crediti, list) or not crediti:
            ctx.error("deve essere un elenco non vuoto", "crediti")
            return None
        credits = [_parse_credit(c, f"crediti[{n}]", ctx) for n, c in enumerate(crediti, start=1)]
        return None if any(c is None for c in credits) else credits
    if not has_single:
        ctx.error("serve opera + autore oppure crediti", "opera")
        return None
    credit = _parse_credit(raw, "", ctx)
    return [credit] if credit else None


def _parse_hashtags(raw: Any, ctx: _Ctx) -> list[str] | None:
    if not isinstance(raw, list):
        ctx.error("serve un elenco di hashtag", "hashtags")
        return None
    ok = True
    if not (config.POST_MIN_HASHTAGS <= len(raw) <= config.POST_MAX_HASHTAGS):
        ctx.error(
            f"{len(raw)} hashtag, ne servono da {config.POST_MIN_HASHTAGS} a {config.POST_MAX_HASHTAGS}",
            "hashtags",
        )
        ok = False
    seen: set[str] = set()
    for tag in raw:
        if not isinstance(tag, str):
            ctx.error(f"{tag!r} deve essere testo", "hashtags")
            ok = False
            continue
        if tag.startswith("#"):
            ctx.error(f"{tag}: scrivilo senza #", "hashtags")
            ok = False
        elif tag != tag.lower():
            ctx.error(f"{tag}: deve essere minuscolo", "hashtags")
            ok = False
        elif not HASHTAG_RE.match(tag):
            ctx.error(f"{tag}: solo lettere, numeri e _", "hashtags")
            ok = False
        if tag in seen:
            ctx.error(f"{tag}: duplicato", "hashtags")
            ok = False
        seen.add(tag)
    return list(raw) if ok else None
