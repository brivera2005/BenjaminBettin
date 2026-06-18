# Black Glass Start Menu

A fork of [Open-Shell](https://github.com/Open-Shell/Open-Shell-Menu) tuned for Windows 11: **black glass aesthetic**, **no pinned clutter**, and your **top 9 most-used apps in a 3×3 icon grid**.

## Quick install (standalone EXE)

1. Double-click **`install.bat`**
2. Press **Win** or click **Start**

That's it. Open-Shell replaces the Windows start menu completely — no Python, no tray hacks.

## What you get

| Feature | Description |
|---------|-------------|
| **3×3 grid** | Top 9 frequently used apps as large icons (no text clutter) |
| **Black glass** | Midnight7 skin + full glass transparency |
| **Clean menu** | No programs column, no default Windows pins |
| **Search** | Built-in Open-Shell search box |
| **Power menu** | Shutdown / restart / sleep via shutdown box |
| **Auto-start** | Runs at Windows sign-in |

## Fork source

Custom code lives in `OpenShellFork/`:

- `RecentGridLayout` — 3×3 grid for frequent apps
- `ProgramsStyle=Hidden` — removes the programs sidebar
- Darkened **Midnight7** skin (`#0a0a0a` black glass)
- Minimal menu layout (search + grid + power only)

### Build the fork yourself

Requires Visual Studio 2022 + Windows 11 SDK. See `OpenShellFork/Src/BUILDME.txt`.

```bat
cd OpenShellFork\Src\Setup
__MakeFinal.bat
```

Output: `OpenShellFork/Src/Setup/Final/OpenShellSetup_*.exe`

Install that EXE instead of the stock download in `install.bat` for the full 3×3 grid build.

## Files

| File | Purpose |
|------|---------|
| `install.bat` | Download Open-Shell, install, apply Black Glass settings |
| `apply-settings.ps1` | Registry settings for layout + theme |
| `unpin-windows.ps1` | Clears Windows 11 default Start pins |

## Replacing stock Open-Shell with fork build

After building from `OpenShellFork/`:

```bat
OpenShellFork\Src\Setup\Final\OpenShellSetup_4_4_199.exe /quiet
BlackGlassStart\apply-settings.ps1
```

## Credits

Based on [Open-Shell-Menu](https://github.com/Open-Shell/Open-Shell-Menu) (MIT/GPL). Original Classic Shell by Ivo Beltchev.
