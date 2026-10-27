"""Milestone 1: calendar loading and validation rules."""

from pathlib import Path

import pytest

from koma.calendar import load_week, slugify

from .conftest import write_week

BASE = """\
week_start: 2026-11-02
posts:
  - date: {date}
    rubrica: Panel muto
    formato: {formato}
    images: {images}
{credits}
    testo: Testo di prova.
    hashtags: {hashtags}
"""
SINGLE_CREDIT = "    opera: Vagabond\n    autore: Takehiko Inoue\n    volume: 27"


def week(project: Path, *, date="2026-11-02", formato="singolo", images="[verticale.jpg]",
         credits=SINGLE_CREDIT, hashtags="[uno, due, tre]"):
    path = write_week(project, BASE.format(date=date, formato=formato, images=images,
                                           credits=credits, hashtags=hashtags))
    return load_week(path, project / "inbox")


def messages(report, level="errore"):
    return [f"{i.field}: {i.message}" for i in report.issues if i.level == level]


def test_valid_post(project):
    w, report = week(project)
    assert report.ok and not report.warnings
    post = w.posts[0]
    assert post.folder_name == "2026-11-02_lun_panel-muto"
    assert post.credits[0].volume == 27


def test_fixture_calendar_is_valid(project):
    w, report = load_week(project / "calendar" / "2026-11-02.yaml", project / "inbox")
    assert report.ok
    assert [p.folder_name for p in w.posts] == [
        "2026-11-02_lun_panel-muto",
        "2026-11-03_mar_tema",
        "2026-11-05_gio_dettaglio",
        "2026-11-07_sab_duello",
    ]


@pytest.mark.parametrize("date", ["2026-11-01", "2026-11-09", "domani"])
def test_date_outside_week(project, date):
    _, report = week(project, date=date)
    assert any(m.startswith("date:") for m in messages(report))


def test_last_day_of_week_is_inside(project):
    _, report = week(project, date="2026-11-08")
    assert report.ok


def test_single_needs_exactly_one_image(project):
    _, report = week(project, images="[verticale.jpg, quadrata.jpg]")
    assert messages(report) == ["images: post singolo con 2 immagini, ne serve esattamente 1"]


def test_carousel_with_one_image_fails(project):
    _, report = week(project, formato="carosello", images="[verticale.jpg]")
    assert messages(report) == ["images: carosello con 1 immagine, ne servono da 2 a 10"]


def test_carousel_with_eleven_images_fails(project):
    _, report = week(project, formato="carosello", images="[" + ", ".join(["verticale.jpg"] * 11) + "]")
    assert "carosello con 11 immagini" in messages(report)[0]


def test_carousel_limits_ok(project):
    for n in (2, 10):
        _, report = week(project, formato="carosello", images="[" + ", ".join(["verticale.jpg"] * n) + "]")
        assert report.ok, n


def test_unknown_format(project):
    _, report = week(project, formato="reel")
    assert any(m.startswith("formato:") for m in messages(report))


def test_missing_image(project):
    _, report = week(project, images="[non_esiste.jpg]")
    assert messages(report) == ["images[1]: non_esiste.jpg non esiste in inbox/"]
    issue = report.errors[0]
    assert issue.source == "2026-11-02.yaml"
    assert issue.post == "post 1 (2026-11-02, Panel muto)"


def test_image_path_outside_inbox_rejected(project):
    _, report = week(project, images="[../calendar/2026-11-02.yaml]")
    assert "indica solo il nome del file" in messages(report)[0]


def test_needs_opera_and_autore_or_crediti(project):
    _, report = week(project, credits="")
    assert messages(report) == ["opera: serve opera + autore oppure crediti"]
    _, report = week(project, credits="    opera: Vagabond")
    assert messages(report) == ["autore: campo obbligatorio"]


def test_opera_and_crediti_together_rejected(project):
    credits = SINGLE_CREDIT + "\n    crediti: [{opera: Berserk, autore: Kentaro Miura, volume: 1}]"
    _, report = week(project, credits=credits)
    assert messages(report) == ["crediti: usa opera + autore oppure crediti, non entrambi"]


def test_crediti(project):
    credits = ("    crediti:\n"
               "      - {opera: Berserk, autore: Kentaro Miura, volume: null}\n"
               "      - {opera: Vagabond, autore: Takehiko Inoue, volume: 26}")
    w, report = week(project, formato="carosello", images="[verticale.jpg, quadrata.jpg]", credits=credits)
    assert report.ok
    assert messages(report, "avviso") == ["crediti[1].volume: volume mancante, in didascalia comparirà vol. [__]"]
    assert [c.opera for c in w.posts[0].credits] == ["Berserk", "Vagabond"]


def test_null_volume_is_a_warning_not_an_error(project):
    w, report = week(project, credits="    opera: Vagabond\n    autore: Takehiko Inoue\n    volume: null")
    assert report.ok
    assert messages(report, "avviso") == ["volume: volume mancante, in didascalia comparirà vol. [__]"]
    assert w.posts[0].credits[0].volume is None


def test_missing_volume_key_is_a_warning(project):
    _, report = week(project, credits="    opera: Vagabond\n    autore: Takehiko Inoue")
    assert report.ok and len(report.warnings) == 1


@pytest.mark.parametrize(
    "hashtags, expected",
    [
        ("[uno, due]", "hashtags: 2 hashtag, ne servono da 3 a 15"),
        ("[" + ", ".join(f"t{i}" for i in range(16)) + "]", "hashtags: 16 hashtag, ne servono da 3 a 15"),
        ('["#uno", due, tre]', "hashtags: #uno: scrivilo senza #"),
        ("[Uno, due, tre]", "hashtags: Uno: deve essere minuscolo"),
        ("[uno, due, uno]", "hashtags: uno: duplicato"),
        ('["manga art", due, tre]', "hashtags: manga art: solo lettere, numeri e _"),
    ],
)
def test_hashtag_rules(project, hashtags, expected):
    _, report = week(project, hashtags=hashtags)
    assert expected in messages(report)


def test_crop_slide_with_focus(project):
    w, report = week(project, images="[{file: verticale.jpg, mode: crop, focus: [0.2, 0.8]}]")
    assert report.ok
    slide = w.posts[0].slides[0]
    assert (slide.mode, slide.focus) == ("crop", (0.2, 0.8))


@pytest.mark.parametrize("item", ["{file: verticale.jpg, mode: zoom}", "{file: verticale.jpg, mode: crop, focus: [2, 0]}"])
def test_bad_slide_options(project, item):
    _, report = week(project, images=f"[{item}]")
    assert not report.ok


def test_focus_without_crop_warns(project):
    _, report = week(project, images="[{file: verticale.jpg, focus: [0.5, 0.2]}]")
    assert report.ok
    assert "focus vale solo con mode: crop" in messages(report, "avviso")[0]


def test_duplicate_output_folder(project):
    path = write_week(project, """\
        week_start: 2026-11-02
        posts:
          - &p {date: 2026-11-02, rubrica: Tema, formato: singolo, images: [verticale.jpg],
                opera: A, autore: B, volume: 1, testo: x, hashtags: [a, b, c]}
          - *p
        """)
    _, report = load_week(path, project / "inbox")
    assert "le cartelle di output coinciderebbero" in report.errors[0].message


def test_week_level_errors(project):
    path = write_week(project, "week_start: ieri\nposts: []\n")
    w, report = load_week(path, project / "inbox")
    assert w is None and report.errors[0].field == "week_start"
    path = write_week(project, "week_start: 2026-11-02\nposts: [\n")
    w, report = load_week(path, project / "inbox")
    assert w is None and "YAML non valido" in report.errors[0].message


def test_slugify():
    assert slugify("Panel muto") == "panel-muto"
    assert slugify("Perché sì!") == "perche-si"
