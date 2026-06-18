from __future__ import annotations

import subprocess


def block_native_start() -> None:
    subprocess.run(
        ["taskkill", "/F", "/IM", "StartMenuExperienceHost.exe"],
        check=False,
        capture_output=True,
    )


def disable_open_shell() -> None:
    for process in ("StartMenu", "ClassicExplorerSettings"):
        subprocess.run(
            ["taskkill", "/F", "/IM", f"{process}.exe"],
            check=False,
            capture_output=True,
        )

    ps = """
    $p = 'HKCU:\\Software\\OpenShell\\StartMenu\\Settings'
    if (Test-Path $p) {
        Set-ItemProperty -Path $p -Name AutoStart -Value 0 -Type DWord -ErrorAction SilentlyContinue
    }
    Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name SimpleStartMenu -ErrorAction SilentlyContinue
    """
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps],
        check=False,
        capture_output=True,
    )
