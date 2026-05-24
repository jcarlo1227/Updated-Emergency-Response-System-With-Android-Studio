# Runs the Flutter User app with API_BASE_URL pointing at the active Cloudflare
# tunnel (read from tunnel-url.txt). Run .\start-tunnel.ps1 first in another
# terminal.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$urlFile = Join-Path $root 'tunnel-url.txt'

if (-not (Test-Path $urlFile)) {
  Write-Host "tunnel-url.txt not found." -ForegroundColor Red
  Write-Host "Start the tunnel first: .\start-tunnel.ps1" -ForegroundColor Yellow
  exit 1
}

$base = (Get-Content $urlFile -Raw).Trim()
if (-not $base) {
  Write-Host "tunnel-url.txt is empty." -ForegroundColor Red
  exit 1
}

$api = "$base/api"
Write-Host "Mobile User app -> API_BASE_URL=$api" -ForegroundColor Cyan

Set-Location (Join-Path $root 'MobileAppFlutter\mobileUser')
flutter run --dart-define=API_BASE_URL=$api
