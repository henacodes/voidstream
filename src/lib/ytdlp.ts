import { Command } from "@tauri-apps/plugin-shell";

type CaptionOptions = {
  enabled: boolean;
  autoCaptions: boolean;
  languages: string;
  format: "vtt" | "srt";
};

type DownloadArgsOptions = {
  url: string;
  outputTemplate: string;
  quality: string;
  format: string;
  isAudioOnly: boolean;
  captions: CaptionOptions;
  playlistItems?: string;
  noPlaylist?: boolean;
};

const buildCaptionArgs = (captions: CaptionOptions) => {
  if (!captions.enabled) return [];

  const args = ["--write-subs", "--sub-format", captions.format];

  if (captions.autoCaptions) args.push("--write-auto-subs");
  if (captions.languages.trim()) args.push("--sub-langs", captions.languages);

  return args;
};

const buildVideoFormatSelector = (quality: string) =>
  `bv*[height<=${quality}]+ba/b[height<=${quality}]`;

const buildVideoSortSelector = (format: string) => {
  if (format === "mp4") return "res,ext:mp4:m4a";
  if (format === "webm") return "res,ext:webm:webm";
  return "res";
};

const YT_DLP_SIDECAR = "binaries/yt-dlp";

let ytDlpProbe: Promise<void> | null = null;

export const createYtDlpCommand = (args: string[]) =>
  Command.sidecar(YT_DLP_SIDECAR, args);

export const explainYtDlpError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = message.toLowerCase();

  if (
    lower.includes("sidecar") ||
    lower.includes("not found") ||
    lower.includes("could not find") ||
    lower.includes("os error 2")
  ) {
    return "Bundled yt-dlp is missing from the release build. Re-run the Windows setup/build scripts and verify src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe exists before building.";
  }

  if (
    lower.includes("access is denied") ||
    lower.includes("permission denied") ||
    lower.includes("os error 5")
  ) {
    return "Bundled yt-dlp was blocked from starting. Windows Defender or another AV may have quarantined or blocked the binary. Restore it only after validating the release, or rebuild and sign the app.";
  }

  return `yt-dlp failed: ${message}`;
};

export const ensureYtDlpReady = async () => {
  if (!ytDlpProbe) {
    ytDlpProbe = (async () => {
      const out = await createYtDlpCommand(["--version"]).execute();
      if (out.code !== 0) {
        throw new Error(out.stderr?.trim() || `Exit code ${out.code}`);
      }
    })().catch((error) => {
      ytDlpProbe = null;
      throw error;
    });
  }

  await ytDlpProbe;
};

export const formatDurationLabel = (duration?: number | null) => {
  if (!duration || duration < 0) return "";

  const total = Math.floor(duration);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

export const buildYtDlpDownloadArgs = ({
  url,
  outputTemplate,
  quality,
  format,
  isAudioOnly,
  captions,
  playlistItems,
  noPlaylist,
}: DownloadArgsOptions) => {
  const args = [url, "--newline", "--windows-filenames", "-o", outputTemplate];

  if (noPlaylist) args.push("--no-playlist");
  if (playlistItems) args.push("--playlist-items", playlistItems);

  args.push(...buildCaptionArgs(captions));

  if (isAudioOnly) {
    args.push("-x", "--audio-format", "mp3");
    return args;
  }

  args.push("-f", buildVideoFormatSelector(quality));
  args.push("-S", buildVideoSortSelector(format));
  args.push("--merge-output-format", format);
  args.push("--remux-video", format);
  args.push("--check-formats");

  return args;
};
