from __future__ import annotations

import subprocess
from pathlib import Path


UNPIN_SCRIPT = Path(__file__).resolve().parent.parent / "unpin_windows.ps1"


def unpin_windows_start() -> None:
    if not UNPIN_SCRIPT.exists():
        return
    subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(UNPIN_SCRIPT),
        ],
        check=False,
        capture_output=True,
        text=True,
    )


def block_native_start_menu() -> None:
    subprocess.run(
        ["taskkill", "/F", "/IM", "StartMenuExperienceHost.exe"],
        check=False,
        capture_output=True,
    )
