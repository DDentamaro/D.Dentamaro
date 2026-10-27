import shutil
import textwrap
from pathlib import Path

import pytest
from typer.testing import CliRunner

from koma.cli import app

FIXTURES = Path(__file__).parent / "fixtures"
SNAPSHOTS = Path(__file__).parent / "snapshots"


@pytest.fixture
def project(tmp_path: Path) -> Path:
    """A throwaway project with the fixture calendar and inbox."""
    shutil.copytree(FIXTURES / "calendar", tmp_path / "calendar")
    shutil.copytree(FIXTURES / "inbox", tmp_path / "inbox")
    return tmp_path


@pytest.fixture
def run(project: Path):
    runner = CliRunner()

    def _run(*args: str):
        return runner.invoke(app, [*args, "--root", str(project)])

    return _run


def write_week(project: Path, body: str, name: str = "2026-11-02") -> Path:
    path = project / "calendar" / f"{name}.yaml"
    path.write_text(textwrap.dedent(body), encoding="utf-8")
    return path
