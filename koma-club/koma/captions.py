"""Caption and alt text composition, plus Instagram limit checks."""

from __future__ import annotations

import re

from . import config
from .calendar import Credit, Post

MISSING_VOLUME = "[__]"
_HASHTAG_IN_TEXT = re.compile(r"(?<![\w&])#\w+")


def credit_line(credit: Credit) -> str:
    volume = MISSING_VOLUME if credit.volume is None else str(credit.volume).strip()
    return f"{credit.opera} · {credit.autore} · vol. {volume}"


def build_caption(post: Post) -> str:
    """Caption text without the trailing newline (that is what Instagram counts)."""
    head = []
    if post.titolo:
        head.append(post.titolo)
    head.extend(credit_line(c) for c in post.credits)
    head.append(post.testo)
    if post.domanda:
        head.append(post.domanda)
    tags = " ".join(f"#{t}" for t in post.hashtags)
    return "\n".join(head) + "\n\n" + tags


def build_alt(post: Post) -> str:
    lines: list[str] = []
    for credit in post.credits:
        line = f"Tavola da {credit.opera} di {credit.autore}."
        if line not in lines:
            lines.append(line)
    return "\n".join(lines)


def count_hashtags(caption: str) -> int:
    """All hashtags Instagram will see, including any written inside testo/domanda."""
    return len(_HASHTAG_IN_TEXT.findall(caption))


def limit_errors(caption: str) -> list[str]:
    errors = []
    if len(caption) > config.CAPTION_MAX_CHARS:
        errors.append(
            f"didascalia di {len(caption)} caratteri, Instagram ne accetta al massimo {config.CAPTION_MAX_CHARS}"
        )
    n = count_hashtags(caption)
    if n > config.CAPTION_MAX_HASHTAGS:
        errors.append(f"{n} hashtag in didascalia, Instagram ne accetta al massimo {config.CAPTION_MAX_HASHTAGS}")
    return errors
