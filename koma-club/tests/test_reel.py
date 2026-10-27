"""Milestone 5 (optional): vertical MP4 from a carousel."""

import json
import shutil
import subprocess

import pytest

from koma.pipeline import reel_filter

needs_ffmpeg = pytest.mark.skipif(not (shutil.which("ffmpeg") and shutil.which("ffprobe")),
                                  reason="ffmpeg non installato")


def test_filter_offsets():
    f = reel_filter(3)
    assert "offset=2.500" in f and "offset=5.000" in f and f.count("xfade") == 2
    assert "duration=0.3" in f and f.endswith("[out]")


@needs_ffmpeg
def test_reel_from_carousel(project, run):
    result = run("reel", "--date", "2026-11-03")
    assert result.exit_code == 0, result.output
    mp4 = project / "out/2026-11-02/2026-11-03_mar_tema/reel.mp4"
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(mp4)],
        capture_output=True, text=True, check=True).stdout)
    streams = probe["streams"]
    assert [s["codec_type"] for s in streams] == ["video"]  # no audio
    assert (streams[0]["width"], streams[0]["height"]) == (1080, 1920)
    assert float(probe["format"]["duration"]) == pytest.approx(3 * 2.5, abs=0.1)


def test_reel_refuses_single_post(project, run):
    result = run("reel", "--date", "2026-11-02")
    assert result.exit_code == 1 and "solo dai caroselli" in result.output
