$ErrorActionPreference = "Stop"

function Test-Command($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Import-VsDevEnv {
  $vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
  if (-not (Test-Path $vswhere)) {
    return $false
  }

  $vsInstall = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  if (-not $vsInstall) {
    return $false
  }

  $vsDevCmd = Join-Path $vsInstall "Common7\Tools\VsDevCmd.bat"
  if (-not (Test-Path $vsDevCmd)) {
    return $false
  }

  cmd /c "`"$vsDevCmd`" -arch=x64 -host_arch=x64 >nul & set" |
    ForEach-Object {
      if ($_ -match "^(.*?)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
      }
    }

  return $true
}

Write-Host "Voidstream Windows setup checks" -ForegroundColor Cyan

$missing = New-Object System.Collections.Generic.List[string]

if (Test-Path (Join-Path $env:USERPROFILE ".cargo\bin")) {
  $env:Path = (Join-Path $env:USERPROFILE ".cargo\bin") + ";" + $env:Path
}

foreach ($p in @(
  (Join-Path $env:USERPROFILE "scoop\apps\ffmpeg\current\bin"),
  "C:\ffmpeg\bin",
  "C:\Program Files\ffmpeg\bin",
  "C:\Program Files\FFmpeg\bin"
)) {
  if ($p -and (Test-Path (Join-Path $p "ffmpeg.exe"))) {
    $env:Path = $p + ";" + $env:Path
    break
  }
}

# Try to load MSVC compiler into PATH for this session if possible.
Import-VsDevEnv | Out-Null

if (-not (Test-Command "git")) { $missing.Add("git") }
if (-not (Test-Command "node")) { $missing.Add("node") }
if (-not (Test-Command "npm")) { $missing.Add("npm") }
if (-not (Test-Command "rustc")) { $missing.Add("rustc (Rust toolchain)") }
if (-not (Test-Command "cargo")) { $missing.Add("cargo (Rust toolchain)") }
if (-not (Test-Command "cl")) { $missing.Add("cl.exe (MSVC Build Tools)") }
if (-not (Test-Command "ffmpeg")) { $missing.Add("ffmpeg") }

if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Missing prerequisites:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  Write-Host ""
  Write-Host "Install these, then re-run this script. Notes:" -ForegroundColor Gray
  Write-Host "  - Rust: https://rustup.rs/ (install stable; re-open terminal after install)" -ForegroundColor Gray
  Write-Host "  - MSVC: Visual Studio Build Tools 2022 -> 'Desktop development with C++' + Windows SDK" -ForegroundColor Gray
  Write-Host "  - ffmpeg: install and ensure it's on PATH (needed for merging video+audio)" -ForegroundColor Gray
  exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$sidecarDir = Join-Path $repoRoot "src-tauri\\binaries"
$sidecarPath = Join-Path $sidecarDir "yt-dlp-x86_64-pc-windows-msvc.exe"
$legacySidecarPath = Join-Path $repoRoot "src-tauri\\yt-dlp-x86_64-pc-windows-msvc.exe"

New-Item -ItemType Directory -Force -Path $sidecarDir | Out-Null

if ((-not (Test-Path $sidecarPath)) -and (Test-Path $legacySidecarPath)) {
  Move-Item -Force -Path $legacySidecarPath -Destination $sidecarPath
  Write-Host "Moved legacy sidecar into src-tauri\\binaries" -ForegroundColor Yellow
}

$unexpectedExe = Get-ChildItem -Path $sidecarDir -Filter "*.exe" |
  Where-Object { $_.Name -notlike "yt-dlp-*" }
if ($unexpectedExe) {
  Write-Host ""
  Write-Host "Unexpected executables found in src-tauri\\binaries:" -ForegroundColor Yellow
  $unexpectedExe | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Yellow }
  Write-Host "These files are not used by Command.sidecar(\"binaries/yt-dlp\")." -ForegroundColor Yellow
}

if (-not (Test-Path $sidecarPath)) {
  Write-Host ""
  Write-Host "yt-dlp sidecar missing; downloading..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile $sidecarPath
  Write-Host "Saved: $sidecarPath" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "yt-dlp sidecar present: $sidecarPath" -ForegroundColor Green
}

$sidecarHash = Get-FileHash -Algorithm SHA256 -Path $sidecarPath
Write-Host "SHA256: $($sidecarHash.Hash)" -ForegroundColor Gray

Write-Host ""
Write-Host "OK: prerequisites look good." -ForegroundColor Green
Write-Host "Next: run scripts\\build-windows.ps1" -ForegroundColor Cyan
