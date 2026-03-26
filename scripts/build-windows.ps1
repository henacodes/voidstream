$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Building Voidstream (Tauri) for Windows..." -ForegroundColor Cyan

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

if (Test-Path (Join-Path $env:USERPROFILE ".cargo\bin")) {
  $env:Path = (Join-Path $env:USERPROFILE ".cargo\bin") + ";" + $env:Path
}

Import-VsDevEnv | Out-Null

$sidecarPath = Join-Path $repoRoot "src-tauri\binaries\yt-dlp-x86_64-pc-windows-msvc.exe"
if (-not (Test-Path $sidecarPath)) {
  throw "Missing yt-dlp sidecar: $sidecarPath (run scripts\setup-windows.ps1 first)"
}

$unexpectedExe = Get-ChildItem -Path (Split-Path -Parent $sidecarPath) -Filter "*.exe" |
  Where-Object { $_.Name -notlike "yt-dlp-*" }
if ($unexpectedExe) {
  Write-Host "Warning: unexpected executables in src-tauri\binaries" -ForegroundColor Yellow
  $unexpectedExe | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Yellow }
}

npm ci
npm run tauri build

$bin = Join-Path $repoRoot "src-tauri\\target\\release\\voidstream.exe"
$bundle = Join-Path $repoRoot "src-tauri\\target\\release\\bundle"

Write-Host ""
Write-Host "Build outputs:" -ForegroundColor Green
Write-Host "  - App exe: $bin" -ForegroundColor Green
Write-Host "  - Bundles: $bundle" -ForegroundColor Green
