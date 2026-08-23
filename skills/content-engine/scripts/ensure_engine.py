#!/usr/bin/env python3
"""Ensure the wechat-silicon-editor rendering engine is available.

Resolution order:
  1. --root PATH (explicit install location)
  2. config/creator.yaml -> engine_root (relative to the platform repo)
  3. $HOME/.codex/skills/wechat-silicon-editor
  4. $HOME/.claude/skills/wechat-silicon-editor

If a usable engine is found, prints its root and exits 0.
If not, clones frankfika/wechat-silicon-editor into the chosen root and
re-checks. Exits non-zero with a concrete reason on failure.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ENGINE_REPO = "https://github.com/frankfika/wechat-silicon-editor.git"
ENGINE_MARKER = "scripts/build_wechat_article.py"

PLATFORM_ROOT = Path(__file__).resolve().parents[2]  # <repo>/skills/content-engine -> <repo>


def _candidates(explicit: str | None) -> list[Path]:
    out: list[Path] = []
    if explicit:
        out.append(Path(explicit).expanduser())
    cfg = PLATFORM_ROOT / "config" / "creator.yaml"
    if cfg.exists():
        for line in cfg.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("engine_root:"):
                value = line.split(":", 1)[1].strip().strip('"').strip("'")
                if value:
                    out.append(Path(value).expanduser())
    out.append(Path.home() / ".codex" / "skills" / "wechat-silicon-editor")
    out.append(Path.home() / ".claude" / "skills" / "wechat-silicon-editor")
    return out


def _usable(root: Path) -> bool:
    return (root / ENGINE_MARKER).is_file()


def _clone(root: Path) -> None:
    root.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["git", "clone", "--depth", "1", ENGINE_REPO, str(root)],
        check=True,
        capture_output=True,
        text=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", help="explicit install location for the engine")
    args = parser.parse_args()

    for candidate in _candidates(args.root):
        if _usable(candidate):
            print(f"engine-ready: {candidate}")
            return 0

    install_root = Path(args.root).expanduser() if args.root else (
        Path.home() / ".codex" / "skills" / "wechat-silicon-editor"
    )
    try:
        _clone(install_root)
    except subprocess.CalledProcessError as exc:
        print(f"engine-install-failed: git clone error: {exc.stderr.strip()}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"engine-install-failed: {exc}", file=sys.stderr)
        return 1

    if _usable(install_root):
        print(f"engine-installed: {install_root}")
        return 0
    print(f"engine-install-failed: {install_root} exists but lacks {ENGINE_MARKER}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
