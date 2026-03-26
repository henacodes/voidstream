# Voidstream

A minimal `yt-dlp` desktop client built with Tauri v2 + React + Vite + TypeScript.

## Prereqs (Windows 11)

- Git
- Node.js (LTS recommended) + npm
- Rust toolchain (`rustup`)
- Visual Studio Build Tools 2022:
  - “Desktop development with C++”
  - Windows 10/11 SDK
- Microsoft Edge WebView2 Runtime (usually already installed on Windows 11)
- `ffmpeg` in `PATH` (required for merging best video + audio)

## Sidecar: `yt-dlp`

This app runs `yt-dlp` as a Tauri sidecar via `Command.sidecar("binaries/yt-dlp", ...)`.

Place the platform binary in `src-tauri/binaries/` using the target-triple naming convention:

- Windows: `src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe`
- Linux: `src-tauri/binaries/yt-dlp-x86_64-unknown-linux-gnu`
- macOS (Apple Silicon): `src-tauri/binaries/yt-dlp-aarch64-apple-darwin`

Run this before a Windows build to stage the correct binary:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

## Windows Defender / AV

Security tools may quarantine unsigned downloader binaries. This project does not try to bypass or evade that.

Recommended release steps:

- sign the installer/app before distribution
- publish a SHA-256 checksum for the bundled `yt-dlp` binary
- if Defender quarantines the binary during local testing, restore it only after verifying the checksum and rebuilding

## Develop

```bash
npm ci
npm run tauri dev
```

## Build a Windows executable/installer

```bash
npm ci
npm run tauri build
```

Build outputs land under `src-tauri/target/release/bundle/` (e.g. NSIS/MSI, depending on your bundle config).

## Recommended IDE Setup

- VS Code + Tauri extension + rust-analyzer
