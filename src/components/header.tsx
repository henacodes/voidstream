import { useState, useEffect } from "react";
import { ListVideo, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";
import { ModeSwitch } from "./mode-toggle";

export const AppHeader = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-16" />;

  return (
    <header className="flex justify-between items-center border-b border-border/40 pb-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
          <ListVideo className="text-primary" size={32} /> VOIDSTREAM
        </h1>
      </div>

      <ModeSwitch />
    </header>
  );
};
