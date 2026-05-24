# Starts a Cloudflare quick tunnel to the local backend (port 5000),
# captures the public *.trycloudflare.com URL, and writes it to tunnel-url.txt
# so the mobile-app run scripts can pick it up.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cf = Join-Path $root 'tools\cloudflared.exe'
$logFile = Join-Path $root 'tunnel.log'
$errFile = Join-Path $root 'tunnel.log.err'
$urlFile = Join-Path $root 'tunnel-url.txt'
$jsonFile = Join-Path $root 'tunnel-config.json'

if (-not (Test-Path $cf)) {
  Write-Host "cloudflared not found at $cf" -ForegroundColor Red
  Write-Host "Download from https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
  exit 1
}

Remove-Item $logFile, $errFile, $urlFile, $jsonFile -Force -ErrorAction SilentlyContinue

Write-Host "Starting Cloudflare Tunnel -> http://localhost:5000 ..." -ForegroundColor Cyan
$proc = Start-Process $cf `
  -ArgumentList 'tunnel','--no-autoupdate','--url','http://localhost:5000' `
  -RedirectStandardOutput $logFile `
  -RedirectStandardError $errFile `
  -PassThru -NoNewWindow

$url = $null
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline -and -not $url) {
  Start-Sleep -Milliseconds 500
  $combined = ''
  if (Test-Path $logFile) { $combined += (Get-Content $logFile -Raw) }
  if (Test-Path $errFile) { $combined += (Get-Content $errFile -Raw) }
  $m = [regex]::Match($combined, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($m.Success) { $url = $m.Value }
}

if (-not $url) {
  Write-Host "Failed to obtain tunnel URL within 60s. See tunnel.log / tunnel.log.err" -ForegroundColor Red
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  exit 1
}

Set-Content -Path $urlFile -Value $url -Encoding ASCII -NoNewline

$apiUrl = "$url/api"
$json = "{`r`n  `"API_BASE_URL`": `"$apiUrl`"`r`n}"
Set-Content -Path $jsonFile -Value $json -Encoding ASCII

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  TUNNEL READY" -ForegroundColor Green
Write-Host "  Public URL : $url" -ForegroundColor Green
Write-Host "  API base   : $apiUrl" -ForegroundColor Green
Write-Host "  Saved to   : tunnel-url.txt + tunnel-config.json" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "In another terminal, run the mobile apps:" -ForegroundColor Yellow
Write-Host "  .\run-mobile-user.ps1"
Write-Host "  .\run-mobile-responder.ps1"
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel." -ForegroundColor Cyan

try {
  Wait-Process -Id $proc.Id
} finally {
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  Remove-Item $urlFile, $jsonFile -Force -ErrorAction SilentlyContinue
  Write-Host "Tunnel stopped." -ForegroundColor Yellow
}
