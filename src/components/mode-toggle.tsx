import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function ModeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-12 h-6" />;

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="flex items-center">
      <SwitchPrimitives.Root
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className={cn(
          "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          "bg-secondary hover:bg-secondary/80 data-[state=checked]:bg-primary/20",
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            "border border-border/50",
          )}
        >
          {/* Icons inside the thumb */}
          <Sun className="h-3.5 w-3.5  transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90 absolute" />
          <Moon className="h-3.5 w-3.5  transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0 absolute" />
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
    </div>
  );
}
