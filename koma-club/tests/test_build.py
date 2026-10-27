"""Milestone 4 and acceptance criteria: end-to-end build on the fixture calendar."""

import hashlib
import os
from pathlib import Path

import pytest
from PIL import Image

from .conftest import SNAPSHOTS, write_week

FOLDERS = {
    "2026-11-02_lun_panel-muto": 1,
    "2026-11-03_mar_tema": 3,
    "2026-11-05_gio_dettaglio": 1,
    "2026-11-07_sab_duello": 2,
}


def tree_hashes(folder: Path) -> dict[str, str]:
    return {str(p.relative_to(folder)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(folder.rglob("*")) if p.is_file()}


def assert_snapshot(actual_path: Path, name: str) -> None:
    """Compare with tests/snapshots/<name>; UPDATE_SNAPSHOTS=1 rewrites the snapshot."""
    actual = actual_path.read_text(encoding="utf-8")
    snapshot = SNAPSHOTS / name
    if os.environ.get("UPDATE_SNAPSHOTS"):
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text(actual, encoding="utf-8")
    assert actual == snapshot.read_text(encoding="utf-8"), name


def test_build_week_matches_expected_output(project, run):
    inbox_before = tree_hashes(project / "inbox")
    result = run("build", "--week", "2026-11-02")
    assert result.exit_code == 0, result.output

    week = project / "out" / "2026-11-02"
    assert sorted(p.name for p in week.iterdir()) == sorted([*FOLDERS, "riepilogo.md"])
    for folder, n in FOLDERS.items():
        files = sorted(p.name for p in (week / folder).iterdir())
        assert files == [f"{i:02d}.jpg" for i in range(1, n + 1)] + ["alt.txt", "caption.txt"]
        for jpg in (week / folder).glob("*.jpg"):
            with Image.open(jpg) as im:
                assert (im.format, im.size, im.mode) == ("JPEG", (1080, 1350), "RGB")
        for name in ("caption.txt", "alt.txt"):
            assert_snapshot(week / folder / name, f"{folder}/{name}")
    assert_snapshot(week / "riepilogo.md", "riepilogo.md")

    assert tree_hashes(project / "inbox") == inbox_before


def test_build_is_reproducible_and_only_touches_its_week(project, run):
    other = project / "out" / "2026-10-26" / "keep.txt"
    other.parent.mkdir(parents=True)
    other.write_text("altra settimana")
    stale = project / "out" / "2026-11-02" / "vecchio"
    stale.mkdir(parents=True)

    assert run("build", "--week", "2026-11-02").exit_code == 0
    first = tree_hashes(project / "out" / "2026-11-02")
    assert run("build", "--week", "2026-11-02").exit_code == 0
    assert tree_hashes(project / "out" / "2026-11-02") == first
    assert other.read_text() == "altra settimana"
    assert not stale.exists()


def test_check_writes_nothing_and_reports_warnings(project, run):
    result = run("check", "--week", "2026-11-02")
    assert result.exit_code == 0, result.output
    assert not (project / "out").exists()
    assert "AVVISO" in result.output and "crediti[1].volume: volume mancante" in result.output
    assert "piccola.png è piccola (300×400 px), verrà ingrandita 3,2×" in result.output
    assert "OK: 4 post, 2 avvisi." in result.output


def _break(project: Path, old: str, new: str) -> None:
    path = project / "calendar" / "2026-11-02.yaml"
    text = path.read_text(encoding="utf-8")
    assert old in text
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


@pytest.mark.parametrize("command", ["check", "build"])
def test_missing_image_fails(project, run, command):
    _break(project, "images: [verticale.jpg]", "images: [mancante.jpg]")
    result = run(command, "--week", "2026-11-02")
    assert result.exit_code == 1
    assert ("ERRORE · calendar/2026-11-02.yaml · post 1 (2026-11-02, Panel muto) · images[1]: "
            "mancante.jpg non esiste in inbox/") in result.output
    assert not (project / "out").exists()


@pytest.mark.parametrize("command", ["check", "build"])
def test_carousel_with_one_image_fails(project, run, command):
    _break(project, "images: [orizzontale.jpg, verticale.jpg]", "images: [orizzontale.jpg]")
    result = run(command, "--week", "2026-11-02")
    assert result.exit_code == 1
    assert ("calendar/2026-11-02.yaml · post 4 (2026-11-07, Duello) · images: "
            "carosello con 1 immagine") in result.output


def test_caption_too_long_fails_build(project, run):
    _break(project, "testo: Guardate le mani.", "testo: " + "a" * 2300)
    result = run("build", "--week", "2026-11-02")
    assert result.exit_code == 1
    assert "post 3 (2026-11-05, Dettaglio) · didascalia: didascalia di" in result.output


def test_unreadable_image_fails(project, run):
    (project / "inbox" / "verticale.jpg").write_bytes(b"not an image")
    result = run("check", "--week", "2026-11-02")
    assert result.exit_code == 1
    assert "verticale.jpg non è un'immagine leggibile" in result.output


def test_build_single_date(project, run):
    assert run("build", "--week", "2026-11-02").exit_code == 0
    week = project / "out" / "2026-11-02"
    untouched = tree_hashes(week / "2026-11-02_lun_panel-muto")
    (week / "2026-11-04_extra").mkdir()

    result = run("build", "--date", "2026-11-03")
    assert result.exit_code == 0, result.output
    assert "Pronto: out/2026-11-02/2026-11-03_mar_tema" in result.output
    assert tree_hashes(week / "2026-11-02_lun_panel-muto") == untouched
    assert (week / "2026-11-04_extra").exists() and (week / "riepilogo.md").exists()


def test_build_single_date_ignores_errors_in_other_posts(project, run):
    _break(project, "images: [verticale.jpg]", "images: [mancante.jpg]")
    assert run("build", "--date", "2026-11-03").exit_code == 0
    result = run("build", "--date", "2026-11-02")
    assert result.exit_code == 1 and "mancante.jpg" in result.output


def test_unknown_date_and_week(run):
    result = run("build", "--date", "2026-12-25")
    assert result.exit_code == 1 and "nessun post in data 2026-12-25" in result.output
    result = run("check", "--week", "2026-12-21")
    assert result.exit_code == 1 and "file del calendario non trovato" in result.output
    assert run("check").exit_code == 1


def test_config_background_and_handle(project, run):
    (project / "config.yaml").write_text('handle: "@altro"\nbackground: "#000000"\nmode: crop\n')
    assert run("build", "--date", "2026-11-02").exit_code == 0
    with Image.open(project / "out/2026-11-02/2026-11-02_lun_panel-muto/01.jpg") as im:
        assert im.size == (1080, 1350)
    (project / "config.yaml").write_text("mode: zoom\n")
    result = run("check", "--week", "2026-11-02")
    assert result.exit_code == 1 and "mode deve essere fit o crop" in result.output


def test_week_file_name_mismatch_warns(project, run):
    write_week(project, (project / "calendar" / "2026-11-02.yaml").read_text(), name="altra")
    (project / "calendar" / "2026-11-02.yaml").unlink()
    result = run("build", "--date", "2026-11-02")
    assert result.exit_code == 0
    assert "il nome del file non corrisponde a week_start" in result.output
