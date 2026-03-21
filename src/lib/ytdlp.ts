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
