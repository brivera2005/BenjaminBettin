# Unpin all default Windows 11 Start menu items.
$ErrorActionPreference = "SilentlyContinue"

$startMenuHost = Get-ChildItem "$env:LOCALAPPDATA\Packages" -Filter "Microsoft.Windows.StartMenuExperienceHost*" | Select-Object -First 1
if ($startMenuHost) {
    $localState = Join-Path $startMenuHost.FullName "LocalState"
    if (Test-Path $localState) {
        Get-ChildItem $localState -Filter "*.bin" | Remove-Item -Force
    }
}

Stop-Process -Name "StartMenuExperienceHost" -Force
Write-Host "Windows Start pins cleared."
