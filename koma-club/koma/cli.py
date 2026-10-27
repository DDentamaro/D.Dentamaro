"""koma: prepares the week's Instagram posts from inbox/ and the YAML calendar."""

from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Optional

import typer

from . import pipeline
from .calendar import Post, Report, Week
from .config import ConfigError, Settings, load_settings

app = typer.Typer(add_completion=False, no_args_is_help=True, help=__doc__)

RootOpt = typer.Option(Path("."), "--root", help="Cartella del progetto (con config.yaml, inbox/, calendar/).")
ConfigOpt = typer.Option(None, "--config", help="File di configurazione alternativo.")
WeekOpt = typer.Option(None, "--week", help="Lunedì della settimana, es. 2026-11-02.")
DateOpt = typer.Option(None, "--date", help="Data di un singolo post, es. 2026-11-04.")


def _fail(message: str) -> None:
    typer.echo(f"ERRORE {message}", err=True)
    raise typer.Exit(1)


def _settings(root: Path, config_file: Optional[Path]) -> Settings:
    try:
        return load_settings(root, config_file)
    except ConfigError as exc:
        _fail(str(exc))


def _parse_day(value: str, option: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        _fail(f"{option}: {value!r} non è una data (AAAA-MM-GG)")


def _print_report(report: Report) -> None:
    def order(issue):
        return (issue.post_index or 0, issue.field or "")

    for issue in sorted(report.errors, key=order):
        typer.echo(str(issue), err=True)
    for issue in sorted(report.warnings, key=order):
        typer.echo(str(issue))


def _load(settings: Settings, week: Optional[str], day: Optional[str]) -> tuple[Week, Report, Optional[Post]]:
    """Run the check for a week or a single date; exits with 1 on errors."""
    if bool(week) == bool(day):
        _fail("indica --week oppure --date")
    target: Optional[date] = None
    if week:
        _parse_day(week, "--week")
        path = pipeline.week_file(settings, week)
    else:
        target = _parse_day(day, "--date")
        try:
            path = pipeline.find_week_for_date(settings, target)
        except pipeline.PipelineError as exc:
            _fail(str(exc))

    loaded, report = pipeline.check(settings, path)
    post: Optional[Post] = None
    if loaded is not None and target is not None:
        matches = loaded.post_on(target)
        if matches:
            post = matches[0]
            report = report.only_post(post.index)
        else:
            # The post on that date failed validation: keep only its issues.
            report = Report([i for i in report.issues if i.post is None or target.isoformat() in i.post])

    _print_report(report)
    if loaded is None or not report.ok:
        n = len(report.errors)
        typer.echo(f"{n} error{'e' if n == 1 else 'i'}, {len(report.warnings)} avvisi.", err=True)
        raise typer.Exit(1)
    if target is not None and post is None:
        _fail(f"nessun post valido in data {target}")
    return loaded, report, post


@app.command()
def check(
    week: Optional[str] = WeekOpt,
    day: Optional[str] = DateOpt,
    root: Path = RootOpt,
    config_file: Optional[Path] = ConfigOpt,
) -> None:
    """Valida calendario e immagini senza scrivere nulla."""
    settings = _settings(root, config_file)
    loaded, report, post = _load(settings, week, day)
    n_posts = 1 if post else len(loaded.posts)
    typer.echo(f"OK: {n_posts} post, {len(report.warnings)} avvisi.")


@app.command()
def build(
    week: Optional[str] = WeekOpt,
    day: Optional[str] = DateOpt,
    root: Path = RootOpt,
    config_file: Optional[Path] = ConfigOpt,
) -> None:
    """Esegue check e genera la settimana (o un solo post) in out/."""
    settings = _settings(root, config_file)
    loaded, report, post = _load(settings, week, day)
    if post is not None:
        dest = pipeline.build_post(settings, loaded, post)
        typer.echo(f"Pronto: {dest.relative_to(settings.root)}")
    else:
        dest = pipeline.build_week(settings, loaded, report)
        typer.echo(f"Pronto: {dest.relative_to(settings.root)} ({len(loaded.posts)} post)")


@app.command()
def reel(
    day: str = typer.Option(..., "--date", help="Data del carosello, es. 2026-11-07."),
    root: Path = RootOpt,
    config_file: Optional[Path] = ConfigOpt,
) -> None:
    """Genera un MP4 verticale 1080×1920 da un carosello (serve ffmpeg)."""
    settings = _settings(root, config_file)
    loaded, _, post = _load(settings, None, day)
    try:
        dest = pipeline.make_reel(settings, loaded, post)
    except pipeline.PipelineError as exc:
        _fail(str(exc))
    typer.echo(f"Pronto: {dest.relative_to(settings.root)}")


def main() -> None:
    app()


if __name__ == "__main__":
    main()
