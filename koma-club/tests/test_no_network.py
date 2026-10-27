"""Acceptance: no project module imports networking libraries."""

import ast
from pathlib import Path

import koma

FORBIDDEN = {"requests", "urllib", "urllib3", "httpx", "http", "aiohttp", "socket", "ftplib",
             "smtplib", "websocket", "websockets", "selenium", "playwright", "bs4", "scrapy"}


def test_no_network_imports():
    package = Path(koma.__file__).parent
    offenders = []
    for path in sorted(package.rglob("*.py")):
        for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
            names = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                names = [node.module]
            offenders += [f"{path.name}: {n}" for n in names if n.split(".")[0] in FORBIDDEN]
    assert offenders == []
