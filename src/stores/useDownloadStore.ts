import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DownloaderState {
  // Global Config
  folder: string;
  quality: string;
  isAudioOnly: boolean;
  downloadCaptions: boolean;
  autoCaptions: boolean;
  captionLanguages: string;
  captionFormat: "vtt" | "srt";

  // App State
  isDownloading: boolean;
  currentProcessTitle: string;

  // Actions
  setFolder: (path: string) => void;
  setQuality: (q: string) => void;
  setAudioOnly: (val: boolean) => void;
  setDownloadCaptions: (val: boolean) => void;
  setAutoCaptions: (val: boolean) => void;
  setCaptionLanguages: (val: string) => void;
  setCaptionFormat: (val: "vtt" | "srt") => void;
  setDownloading: (val: boolean, title?: string) => void;
}

export const useDownloaderStore = create<DownloaderState>()(
  persist(
    (set) => ({
      folder: "",
      quality: "1080",
      isAudioOnly: false,
      downloadCaptions: false,
      autoCaptions: true,
      captionLanguages: "en.*",
      captionFormat: "vtt",
      isDownloading: false,
      currentProcessTitle: "",

      setFolder: (folder) => set({ folder }),
      setQuality: (quality) => set({ quality }),
      setAudioOnly: (isAudioOnly) => set({ isAudioOnly }),
      setDownloadCaptions: (downloadCaptions) => set({ downloadCaptions }),
      setAutoCaptions: (autoCaptions) => set({ autoCaptions }),
      setCaptionLanguages: (captionLanguages) => set({ captionLanguages }),
      setCaptionFormat: (captionFormat) => set({ captionFormat }),
      setDownloading: (isDownloading, currentProcessTitle = "") =>
        set({ isDownloading, currentProcessTitle }),
    }),
    { name: "voidstream-config" },
  ),
);
