#!/usr/bin/env python3
"""Forwarder for CI / PATHS: tools/import_script.py.

Runs the demo pack dry-run when tools/demo/srm-import is present.
Never posts to Cloud. No API keys.
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "tools" / "demo" / "srm-import" / "import_script.py"


def main() -> int:
    if not PACK.is_file():
        print(
            "import dry-run SKIP: tools/demo/srm-import/import_script.py not in this tree "
            "(merge the SRM demo import pack to enforce CSV acceptance on CI)."
        )
        return 0
    sys.path.insert(0, str(PACK.parent))
    sys.argv[0] = str(PACK)
    runpy.run_path(str(PACK), run_name="__main__")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
