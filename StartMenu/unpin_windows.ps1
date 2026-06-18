# Unpin all default Windows 11 Start menu items and reset layout.
$ErrorActionPreference = "SilentlyContinue"

$startMenuHost = Get-ChildItem "$env:LOCALAPPDATA\Packages" -Filter "Microsoft.Windows.StartMenuExperienceHost*" | Select-Object -First 1
if ($startMenuHost) {
    $localState = Join-Path $startMenuHost.FullName "LocalState"
    if (Test-Path $localState) {
        Get-ChildItem $localState -Filter "start*.bin" | Remove-Item -Force
    }
}

# Clear pinned layout backup files
$cloudStore = Join-Path $env:LOCALAPPDATA "Packages\Microsoft.Windows.StartMenuExperienceHost_cw5n1h2txyewy\LocalState"
if (Test-Path $cloudStore) {
    Get-ChildItem $cloudStore -Filter "*.bin" | Remove-Item -Force
}

Stop-Process -Name "StartMenuExperienceHost" -Force
Start-Sleep -Milliseconds 500

Write-Output "Windows Start menu pins cleared."
