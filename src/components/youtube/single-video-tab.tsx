import { useState, useRef, useMemo } from "react";
import {
  Download,
  Link as LinkIcon,
  Music,
  Loader2,
  CheckCircle2,
  Settings2,
  Terminal,
} from "lucide-react";
import { Command, Child } from "@tauri-apps/plugin-shell";

// Store Hooks
import { useDownloaderStore } from "@/stores/useDownloadStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helpers
import { parsePercent } from "@/lib/helpers";
import { buildYtDlpDownloadArgs } from "@/lib/ytdlp";

export const SingleVideoTab = () => {
  // Global State
  const {
    folder,
    quality,
    isAudioOnly,
    downloadCaptions,
    autoCaptions,
    captionLanguages,
    captionFormat,
    isDownloading,
    setDownloading,
    setQuality,
    setAudioOnly,
    setDownloadCaptions,
    setAutoCaptions,
    setCaptionLanguages,
    setCaptionFormat,
  } = useDownloaderStore();

  const { addNotification } = useNotificationStore();

  // Local State
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [metadata, setMetadata] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [progressLine, setProgressLine] = useState("");
  const childRef = useRef<Child | null>(null);

  const percent = useMemo(() => parsePercent(progressLine), [progressLine]);

  const fetchInfo = async () => {
    if (!url.trim().startsWith("http")) {
      return addNotification("Please enter a valid URL", "error");
    }

    setIsFetching(true);
    setMetadata(null);
    try {
      const cmd = Command.sidecar("binaries/yt-dlp", [
        "--print",
        "%(title)s\n%(uploader)s\n%(thumbnail)s\n%(duration_string)s\n%(view_count)s",
        "--no-playlist",
        url,
      ]);
      const out = await cmd.execute();

      if (out.code === 0) {
        const [title, uploader, thumb, dur, views] = out.stdout.split("\n");
        setMetadata({ title, uploader, thumb, dur, views });
      } else {
        addNotification("Failed to fetch video details", "error");
      }
    } catch (e) {
      addNotification("Process error while fetching", "error");
    } finally {
      setIsFetching(false);
    }
  };

  const handleDownload = async () => {
    if (!folder) return addNotification("Save location not set", "error");

    setDownloading(true, metadata?.title || "Video");
    setProgressLine("Initializing Engine...");

    const args = buildYtDlpDownloadArgs({
      url,
      outputTemplate: `${folder}/%(title)s.%(ext)s`,
      quality,
      format,
      isAudioOnly,
      noPlaylist: true,
      captions: {
        enabled: downloadCaptions,
        autoCaptions,
        languages: captionLanguages,
        format: captionFormat,
      },
    });

    const cmd = Command.sidecar("binaries/yt-dlp", args);

    cmd.stdout.on("data", (line) => {
      if (line.includes("%")) setProgressLine(line);
    });

    cmd.on("close", (data) => {
      setDownloading(false);
      if (data.code === 0) {
        setProgressLine("Download Complete! 100%");
        addNotification(`Finished: ${metadata?.title}`, "success");
      } else {
        setProgressLine("Process Terminated");
        addNotification("Download failed", "error");
      }
      childRef.current = null;
    });

    childRef.current = await cmd.spawn();
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-2xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Input Section */}
      <div className="relative w-full group">
        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube Video URL..."
          className="pl-11 pr-24 h-12 bg-secondary/20 border-primary/10 transition-all focus:bg-secondary/40 rounded-none shadow-none"
        />
        <Button
          onClick={fetchInfo}
          disabled={isFetching || isDownloading || !url}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 font-black text-[10px] tracking-widest rounded-none shadow-none"
        >
          {isFetching ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "LOAD_METADATA"
          )}
        </Button>
      </div>

      {metadata && (
        <Card className="w-full overflow-hidden border-none bg-secondary/10 shadow-none rounded-none ring-1 ring-white/5">
          {/* Thumbnail Preview */}
          <div className="aspect-video relative overflow-hidden group">
            <img
              src={metadata.thumb}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
              alt="thumb"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end p-6">
              <div className="space-y-1">
                <h3 className="font-black text-xl text-white line-clamp-1 tracking-tight uppercase">
                  {metadata.title}
                </h3>
                <p className="text-white/60 text-xs font-mono uppercase tracking-[0.2em]">
                  {metadata.uploader}
                </p>
              </div>
            </div>
            <span className="absolute bottom-6 right-6 bg-primary text-[10px] text-primary-foreground px-2 py-1 font-black shadow-none rounded-none uppercase tracking-tighter">
              {metadata.dur}
            </span>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* 3-Column Config Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Settings2 size={10} /> Resolution
                </label>
                <Select
                  value={quality}
                  onValueChange={setQuality}
                  disabled={isDownloading || isAudioOnly}
                >
                  <SelectTrigger className="bg-background/40 border-none h-10 font-bold rounded-none shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="4320">8K Ultra HD</SelectItem>
                    <SelectItem value="2160">4K Ultra HD</SelectItem>
                    <SelectItem value="1440">1440p QHD</SelectItem>
                    <SelectItem value="1080">1080p FHD</SelectItem>
                    <SelectItem value="720">720p HD</SelectItem>
                    <SelectItem value="480">480p SD</SelectItem>
                    <SelectItem value="360">360p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Settings2 size={10} /> Container
                </label>
                <Select
                  value={format}
                  onValueChange={setFormat}
                  disabled={isDownloading || isAudioOnly}
                >
                  <SelectTrigger className="bg-background/40 border-none h-10 font-bold uppercase rounded-none shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="mkv">MKV</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Music size={10} /> Mode
                </label>
                <div className="flex items-center justify-between h-10 px-4 bg-background/40 border-none rounded-none">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Audio Only
                  </span>
                  <Switch
                    checked={isAudioOnly}
                    onCheckedChange={setAudioOnly}
                    disabled={isDownloading}
                  />
                </div>
              </div>
            </div>

            {/* Captions */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Settings2 size={10} /> Captions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between h-10 px-4 bg-background/40 border-none rounded-none">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Download
                  </span>
                  <Switch
                    checked={downloadCaptions}
                    onCheckedChange={setDownloadCaptions}
                    disabled={isDownloading}
                  />
                </div>

                <div className="flex items-center justify-between h-10 px-4 bg-background/40 border-none rounded-none">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Auto
                  </span>
                  <Switch
                    checked={autoCaptions}
                    onCheckedChange={setAutoCaptions}
                    disabled={isDownloading || !downloadCaptions}
                  />
                </div>

                <Select
                  value={captionFormat}
                  onValueChange={(v) => setCaptionFormat(v as "vtt" | "srt")}
                  disabled={isDownloading || !downloadCaptions}
                >
                  <SelectTrigger className="bg-background/40 border-none h-10 font-bold uppercase rounded-none shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="vtt">VTT</SelectItem>
                    <SelectItem value="srt">SRT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={captionLanguages}
                onChange={(e) => setCaptionLanguages(e.target.value)}
                disabled={isDownloading || !downloadCaptions}
                placeholder="Subtitle languages (e.g. en.*,en,es)"
                className="h-10 bg-secondary/20 border-primary/10 transition-all focus:bg-secondary/40 rounded-none shadow-none"
              />
            </div>

            <div className="space-y-4 pt-2">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !folder}
                className="w-full h-14 bg-primary text-primary-foreground font-black tracking-[0.2em] uppercase transition-all active:scale-[0.98] rounded-none shadow-none"
              >
                {isDownloading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Download size={18} className="mr-2" />
                )}
                {isDownloading ? "SYSTEM_ACTIVE" : "INITIALIZE_CORE"}
              </Button>

              {/* TERMINAL STYLE ALERT - Sharp edges, No shadow */}
              {isDownloading && (
                <Alert className="bg-black border-primary/20 text-primary font-mono rounded-none border shadow-none animate-in zoom-in-95">
                  <Terminal className="h-4 w-4 !text-primary animate-pulse" />
                  <AlertTitle className="text-[10px] tracking-[0.2em] font-black opacity-50 mb-4 uppercase">
                    VOID_SHELL_ACTIVE
                  </AlertTitle>
                  <AlertDescription className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="flex items-center gap-2">
                          <Loader2 size={10} className="animate-spin" />
                          DOWNLOADING...
                        </span>
                        <span>{percent || 0}%</span>
                      </div>
                      <Progress
                        value={percent || 0}
                        className="h-1 bg-primary/5 rounded-none"
                      />
                    </div>
                    <div className="text-[9px] leading-relaxed break-all opacity-70 h-16 overflow-y-auto no-scrollbar font-mono bg-primary/5 p-2 rounded-none">
                      {`> STDOUT: ${progressLine}`}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-8 text-[10px] font-black tracking-widest uppercase hover:bg-red-600/20 hover:text-red-500 transition-all border border-red-500/20 rounded-none shadow-none"
                      onClick={() => childRef.current?.kill()}
                    >
                      ABORT_MISSION
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {progressLine.includes("Complete") && !isDownloading && (
                <div className="flex items-center justify-center gap-2 text-primary text-[10px] font-black tracking-widest uppercase animate-in fade-in zoom-in-50">
                  <CheckCircle2 size={14} /> TASK_SUCCESSFUL
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
