"""Milestone 3: caption and alt text composition, Instagram limits."""

from datetime import date

from koma import captions
from koma.calendar import Credit, Post, Slide


def make_post(**kw):
    defaults = dict(
        index=1, date=date(2026, 11, 2), rubrica="Panel muto", formato="singolo",
        slides=[Slide("a.jpg")], credits=[Credit("Vagabond", "Takehiko Inoue", 27)],
        testo="Testo.", hashtags=["vagabond", "musashi", "seinen"],
    )
    defaults.update(kw)
    return Post(**defaults)


def test_single_caption_layout():
    post = make_post(domanda="Domanda?")
    assert captions.build_caption(post) == (
        "Vagabond · Takehiko Inoue · vol. 27\n"
        "Testo.\n"
        "Domanda?\n"
        "\n"
        "#vagabond #musashi #seinen"
    )


def test_carousel_caption_with_title_and_credits():
    post = make_post(
        formato="carosello", titolo="Titolo",
        credits=[Credit("Berserk", "Kentaro Miura", None), Credit("Vagabond", "Takehiko Inoue", 26)],
    )
    assert captions.build_caption(post).splitlines()[:4] == [
        "Titolo",
        "Berserk · Kentaro Miura · vol. [__]",
        "Vagabond · Takehiko Inoue · vol. 26",
        "Testo.",
    ]


def test_optional_lines_are_omitted():
    caption = captions.build_caption(make_post())
    assert caption.count("\n") == 3  # credit, testo, blank, hashtags


def test_alt_text_deduplicates():
    post = make_post(credits=[Credit("Berserk", "Kentaro Miura"), Credit("Vagabond", "Takehiko Inoue"),
                              Credit("Berserk", "Kentaro Miura")])
    assert captions.build_alt(post) == "Tavola da Berserk di Kentaro Miura.\nTavola da Vagabond di Takehiko Inoue."


def test_length_limit():
    ok = make_post(testo="x" * 2000)
    assert captions.limit_errors(captions.build_caption(ok)) == []
    long = make_post(testo="x" * 2200)
    errors = captions.limit_errors(captions.build_caption(long))
    assert len(errors) == 1 and "al massimo 2200" in errors[0]


def test_exactly_2200_chars_is_allowed():
    base = captions.build_caption(make_post(testo=""))
    caption = captions.build_caption(make_post(testo="x" * (2200 - len(base))))
    assert len(caption) == 2200 and captions.limit_errors(caption) == []


def test_hashtag_limit_counts_hashtags_in_text():
    text = " ".join(f"#extra{i}" for i in range(28))
    errors = captions.limit_errors(captions.build_caption(make_post(testo=text)))
    assert errors == ["31 hashtag in didascalia, Instagram ne accetta al massimo 30"]
    assert captions.count_hashtags("Prezzo 5€ &#38; numero #1 e a#b") == 1
