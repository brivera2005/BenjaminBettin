# Black Glass Start Menu - applies Open-Shell settings for slick 3x3 frequent-apps layout.
$ErrorActionPreference = "Stop"

$settingsPath = "HKCU:\Software\OpenShell\StartMenu\Settings"
New-Item -Path $settingsPath -Force | Out-Null

function Set-StartSetting {
    param([string]$Name, $Value, [string]$Type = "DWord")
    if ($null -eq $Value) { return }
    Set-ItemProperty -Path $settingsPath -Name $Name -Value $Value -Type $Type
}

# Core layout - Win7 style, black glass, frequent apps only
Set-StartSetting "MenuStyle" 2
Set-StartSetting "ProgramsStyle" 2          # Hidden - no cluttered programs column
Set-StartSetting "RecentPrograms" 2         # Frequent / most-used (UserAssist)
Set-StartSetting "MaxRecentPrograms" 9    # Top 9 apps
Set-StartSetting "RecentGridLayout" 1     # 3x3 grid (Black Glass fork build)
Set-StartSetting "RecentProgsTop" 1
Set-StartSetting "RecentMetroApps" 1
Set-StartSetting "EnableJumplists" 0
Set-StartSetting "PinnedPrograms" 0       # Fast items, not pinned clutter

# Black glass look
Set-StartSetting "SkinW7" "Midnight7" "String"
Set-StartSetting "SkinOptionsW7" "TRANSPARENT_MORE" "String"
Set-StartSetting "EnableGlass" 1
Set-StartSetting "GlassIntensity" 100
Set-StartSetting "GlassBlending" 1
Set-StartSetting "LargeIconSize" 48
Set-StartSetting "SmallIconSize" 24

# Behavior
Set-StartSetting "AutoStart" 1
Set-StartSetting "ShowNextToTaskbar" 1
Set-StartSetting "SkipMetro" 1
Set-StartSetting "DisableHotCorner" 1        # Block Windows 11 Start hot corner
Set-StartSetting "ShutdownCommand" 8      # Shutdown box
Set-StartSetting "EnableSearchBox" 1
Set-StartSetting "SearchBoxLabel" 0

# Remove old Python start menu from startup if present
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "SimpleStartMenu" -ErrorAction SilentlyContinue

Write-Host "Black Glass settings applied."
