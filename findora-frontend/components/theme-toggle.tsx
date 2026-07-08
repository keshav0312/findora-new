"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-14 items-center rounded-full border border-slate-200 bg-slate-100 px-1 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800",
        className
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full bg-white shadow-sm shadow-slate-900/10 transition-transform duration-300 ease-out dark:bg-slate-950",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        <Sun
          className={cn(
            "absolute size-3.5 text-amber-500 transition-all duration-300",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute size-3.5 text-indigo-300 transition-all duration-300",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
          )}
        />
      </span>
    </button>
  );
}
