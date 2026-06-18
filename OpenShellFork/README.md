# Open-Shell fork for Black Glass Start Menu

See `../BlackGlassStart/README.md` for install instructions.

## Changes from upstream Open-Shell

- **RecentGridLayout** — top 9 frequent apps in a 3×3 large-icon grid
- **ProgramsStyle=Hidden** by default — no sidebar clutter
- **RecentPrograms=Frequent** — uses Windows UserAssist (most-used apps)
- **Midnight7 skin** darkened to `#0a0a0a` black glass
- **Minimal menu** — search box + grid + power only (no programs button)

## Build

See `Src/BUILDME.txt`. Requires Visual Studio 2022.

```bat
cd Src\Setup
__MakeFinal.bat
```

## License

Same as Open-Shell (MIT/GPL). See LICENSE.txt.
