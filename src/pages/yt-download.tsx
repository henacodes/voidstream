import { FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SingleVideoTab } from "@/components/youtube/single-video-tab";
import { PlaylistTab } from "@/components/youtube/playlist-tab";
import { AppHeader } from "@/components/header";

// Import the store
import { useDownloaderStore } from "@/stores/useDownloadStore";

export const YoutubeDownloader = () => {
  // Use store actions and state instead of local useState
  const { folder, setFolder } = useDownloaderStore();

  const handlePickFolder = async () => {
    const selected = await open({
      directory: true,
      title: "Select Destination",
    });
    // This now updates the global state that all tabs consume
    if (selected) setFolder(selected as string);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 transition-colors duration-300">
      <main className="max-w-6xl mx-auto space-y-10">
        <AppHeader />

        <div className="space-y-6">
          <div
            onClick={handlePickFolder}
            className="group flex items-center justify-between p-4 bg-secondary/20 border border-primary/5 cursor-pointer hover:bg-secondary/40 transition-all hover:border-primary/20 "
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-2.5 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all ">
                <FolderOpen size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
                  Save Location
                </span>
                <span className="text-sm font-mono truncate text-foreground/80">
                  {folder || "Click to set download directory..."}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold uppercase border-primary/20 "
            >
              Browse
            </Button>
          </div>

          <Tabs defaultValue="single" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-secondary/50 p-1 h-12 ">
                <TabsTrigger
                  value="single"
                  className="font-bold  data-[state=active]:bg-background"
                >
                  SINGLE VIDEO
                </TabsTrigger>
                <TabsTrigger
                  value="playlist"
                  className="font-bold  data-[state=active]:bg-background"
                >
                  PLAYLIST
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="single"
              className="mt-0 focus-visible:outline-none"
            >
              <SingleVideoTab />
            </TabsContent>
            <TabsContent
              value="playlist"
              className="mt-0 focus-visible:outline-none"
            >
              <PlaylistTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="mt-20 text-center py-10">
        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/20">
          Voidstream YT-DL Client
        </p>
      </footer>
    </div>
  );
};
