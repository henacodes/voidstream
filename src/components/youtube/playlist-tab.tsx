import { useEffect, useState, useRef, useMemo } from "react";
import { Download, Loader2, Terminal, Music, Settings2 } from "lucide-react";
import { Command, Child } from "@tauri-apps/plugin-shell";

// Store Hooks
import { useDownloaderStore } from "@/stores/useDownloadStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

// UI Components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Helpers
import { parsePercent } from "@/lib/helpers";
import { buildYtDlpDownloadArgs } from "@/lib/ytdlp";

export const PlaylistTab = () => {
  // Global State from Zustand
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

  // Local Component State
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4"); // Local format state
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progressLine, setProgressLine] = useState("");
  const childRef = useRef<Child | null>(null);

  const currentPercent = useMemo(
    () => parsePercent(progressLine),
    [progressLine],
  );

  useEffect(() => {
    const promptOnLeave = (event: BeforeUnloadEvent) => {
      if (!childRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    const cleanup = () => {
      const child = childRef.current;

      if (!child) return;

      childRef.current = null;
      setDownloading(false);
      void child.kill();
    };

    window.addEventListener("beforeunload", promptOnLeave);
    window.addEventListener("pagehide", cleanup);

    return () => {
      window.removeEventListener("beforeunload", promptOnLeave);
      window.removeEventListener("pagehide", cleanup);
      cleanup();
    };
  }, [setDownloading]);

  const cancelDownload = async () => {
    const child = childRef.current;

    if (!child) return;

    childRef.current = null;
    setDownloading(false);
    setProgressLine("Process Terminated");

    try {
      await child.kill();
    } catch {
      // Ignore cleanup errors.
    }
  };

  const fetchPlaylist = async () => {
    if (!url.includes("list=")) {
      return addNotification("Invalid Playlist URL: Missing list ID", "error");
    }

    setIsFetching(true);
    setItems([]);
    setMeta(null);

    try {
      const listCmd = Command.sidecar("binaries/yt-dlp", [
        "--flat-playlist",
        "--print",
        "%(playlist_title)s\n%(uploader)s\n%(title)s\n%(duration_string)s\n%(thumbnails.-1.url)s",
        url,
      ]);

      const out = await listCmd.execute();
      const lines = out.stdout.trim().split("\n");

      if (lines.length < 3) throw new Error("Could not parse playlist");

      const videoList = [];
      for (let i = 0; i < lines.length; i += 5) {
        if (!lines[i + 2]) continue;
        videoList.push({
          title: lines[i + 2],
          time: lines[i + 3],
          thumb: lines[i + 4],
          index: i / 5,
        });
      }

      setMeta({
        title: lines[0] !== "NA" ? lines[0] : "YouTube Playlist",
        uploader: lines[1] !== "NA" ? lines[1] : "Various Artists",
        thumb: videoList[0]?.thumb,
        count: videoList.length,
      });

      setItems(videoList);
      setSelected(new Set(videoList.map((_, i) => i)));
    } catch (e) {
      addNotification("Failed to fetch playlist metadata", "error");
    } finally {
      setIsFetching(false);
    }
  };

  const startDownload = async () => {
    if (!folder) return addNotification("Target folder not set!", "error");

    setDownloading(true, meta?.title);
    const itemsStr = Array.from(selected)
      .map((i) => i + 1)
      .join(",");

    const args = buildYtDlpDownloadArgs({
      url,
      outputTemplate: `${folder}/%(playlist_title)s/%(title)s.%(ext)s`,
      quality,
      format,
      isAudioOnly,
      playlistItems: itemsStr,
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
        addNotification(`Finished: ${meta?.title}`, "success");
        setProgressLine("PROCESS_COMPLETED_SUCCESSFULLY");
      } else {
        addNotification("Download process interrupted", "error");
      }
    });

    childRef.current = await cmd.spawn();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 items-start animate-in fade-in duration-500">
      {/* LEFT COLUMN: Controls & Settings */}
      <div className="lg:col-span-5 space-y-6">
        <div className="relative w-full group">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Playlist URL..."
            className="h-12 bg-secondary/20 border-primary/10 pr-32 focus:ring-1 focus:ring-primary/30"
          />
          <Button
            onClick={fetchPlaylist}
            disabled={isFetching || isDownloading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 font-black text-[10px] tracking-widest"
          >
            {isFetching ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              "LOAD_PLAYLIST"
            )}
          </Button>
        </div>

        {meta && (
          <div className="space-y-4 animate-in slide-in-from-left-4">
            <Card className="border-none bg-secondary/10 overflow-hidden relative aspect-video  group ring-1 ring-white/5">
              <img
                src={meta.thumb}
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                alt="cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent p-6 flex flex-col justify-end">
                <Badge className="w-fit mb-2 bg-primary/80 backdrop-blur-md font-black">
                  PLAYLIST
                </Badge>
                <h2 className="text-xl font-black text-white line-clamp-1 tracking-tight uppercase">
                  {meta.title}
                </h2>
                <p className="text-xs text-muted-foreground font-mono tracking-widest">
                  {meta.uploader.toUpperCase()}
                </p>
              </div>
            </Card>

            {/* Config Grid */}
            <div className="grid grid-cols-1 gap-4 p-4 bg-secondary/10 rounded-2xl border border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">
                    <Settings2 size={10} /> Resolution
                  </label>
                  <Select
                    disabled={isDownloading || isAudioOnly}
                    value={quality}
                    onValueChange={setQuality}
                  >
                    <SelectTrigger className="bg-background/50 border-none h-10 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4320">8K Ultra</SelectItem>
                      <SelectItem value="2160">4K Ultra</SelectItem>
                      <SelectItem value="1440">1440p QHD</SelectItem>
                      <SelectItem value="1080">1080p FHD</SelectItem>
                      <SelectItem value="720">720p HD</SelectItem>
                      <SelectItem value="480">480p SD</SelectItem>
                      <SelectItem value="360">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">
                    <Settings2 size={10} /> Container
                  </label>
                  <Select
                    disabled={isDownloading || isAudioOnly}
                    value={format}
                    onValueChange={setFormat}
                  >
                    <SelectTrigger className="bg-background/50 border-none h-10 text-xs font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="mkv">MKV</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between h-11 px-4 bg-background/50 rounded-md border border-white/5">
                <div className="flex items-center gap-2">
                  <Music
                    size={14}
                    className={
                      isAudioOnly ? "text-primary" : "text-muted-foreground/40"
                    }
                  />
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Audio Only Mode
                  </span>
                </div>
                <Switch
                  checked={isAudioOnly}
                  onCheckedChange={setAudioOnly}
                  disabled={isDownloading}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between h-11 px-4 bg-background/50 rounded-md border border-white/5">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Download Captions
                  </span>
                  <Switch
                    checked={downloadCaptions}
                    onCheckedChange={setDownloadCaptions}
                    disabled={isDownloading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between h-11 px-4 bg-background/50 rounded-md border border-white/5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Auto Captions
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
                    <SelectTrigger className="bg-background/50 border-none h-11 text-xs font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  className="h-11 bg-background/50 border border-white/5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Terminal Progress Alert */}
        {isDownloading && (
          <Alert className="bg-black border-primary/20 text-primary font-mono  rounded-xl border">
            <Terminal className="h-4 w-4 text-primary! animate-pulse" />
            <AlertTitle className="text-[10px] tracking-[0.2em] font-black opacity-50 mb-4">
              VOID_SHELL_ACTIVE_QUEUE
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>DOWNLOADING...</span>
                  <span>{currentPercent || 0}%</span>
                </div>
                <Progress
                  value={currentPercent || 0}
                  className="h-1 bg-primary/10"
                />
              </div>
              <div className="text-[9px] leading-relaxed break-all opacity-70 h-16 overflow-y-auto no-scrollbar font-mono bg-primary/5 p-2 rounded">
                {`> STDOUT: ${progressLine}`}
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full h-8 text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                onClick={() => void cancelDownload()}
              >
                ABORT_MISSION
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Button
          disabled={selected.size === 0 || isDownloading || !folder || !meta}
          onClick={startDownload}
          className="w-full h-14 bg-primary text-primary-foreground text-md font-black tracking-widest  uppercase transition-all active:scale-[0.98]"
        >
          {isDownloading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Download size={20} className="mr-2" />
          )}
          {isDownloading
            ? "DOWNLOADING"
            : `INITIALIZE_${selected.size}_DOWNLOADS`}
        </Button>
      </div>

      {/* RIGHT COLUMN: Video Queue */}
      <div className="lg:col-span-7">
        <Card className="border-none bg-secondary/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/5">
          <div className="p-5 bg-secondary/10 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selected.size === items.length && items.length > 0}
                onCheckedChange={(c) =>
                  setSelected(c ? new Set(items.map((_, i) => i)) : new Set())
                }
              />
              <span className="text-xs font-black tracking-widest uppercase opacity-70">
                Queue Master ({selected.size})
              </span>
            </div>
            {isDownloading && (
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary animate-pulse font-mono"
              >
                ASYNC_MODE
              </Badge>
            )}
          </div>

          <ScrollArea className="h-145">
            <div className="p-3 space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-2.5 rounded-2xl transition-all group border border-transparent ${
                    selected.has(i)
                      ? "bg-secondary/20 border-white/5"
                      : "opacity-30 grayscale blur-[1px] hover:blur-0"
                  }`}
                >
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={(c) => {
                      const next = new Set(selected);
                      c ? next.add(i) : next.delete(i);
                      setSelected(next);
                    }}
                  />

                  <div className="relative w-24 h-14 rounded-xl overflow-hidden shrink-0 shadow-lg">
                    <img
                      src={item.thumb}
                      alt="min"
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] px-1.5 py-0.5 rounded font-black text-white">
                      {item.time}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors uppercase tracking-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 uppercase">
                      ID: {i < 9 ? `00${i + 1}` : `0${i + 1}`}
                    </p>
                  </div>

                  {progressLine.includes(item.title) && (
                    <div className="flex items-center gap-2 pr-2 animate-pulse">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
