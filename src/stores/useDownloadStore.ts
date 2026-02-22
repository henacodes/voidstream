import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DownloaderState {
  // Global Config
  folder: string;
  quality: string;
  isAudioOnly: boolean;

  // App State
  isDownloading: boolean;
  currentProcessTitle: string;

  // Actions
  setFolder: (path: string) => void;
  setQuality: (q: string) => void;
  setAudioOnly: (val: boolean) => void;
  setDownloading: (val: boolean, title?: string) => void;
}

export const useDownloaderStore = create<DownloaderState>()(
  persist(
    (set) => ({
      folder: "",
      quality: "1080",
      isAudioOnly: false,
      isDownloading: false,
      currentProcessTitle: "",

      setFolder: (folder) => set({ folder }),
      setQuality: (quality) => set({ quality }),
      setAudioOnly: (isAudioOnly) => set({ isAudioOnly }),
      setDownloading: (isDownloading, currentProcessTitle = "") =>
        set({ isDownloading, currentProcessTitle }),
    }),
    { name: "voidstream-config" },
  ),
);
