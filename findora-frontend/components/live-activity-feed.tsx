"use client";

import { FileText, Sparkles, PackageCheck, Radio } from "lucide-react";
import { useAdminLiveFeed } from "@/lib/socket";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = {
  report: FileText,
  match: Sparkles,
  returned: PackageCheck,
} as const;

const COLORS = {
  report: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  match: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  returned: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
} as const;

/**
 * Real-time feed of platform activity — new reports filed, AI matches
 * detected, items returned — pushed over Socket.IO the instant they happen
 * anywhere on the platform (see `admin:activity` in server.ts).
 */
export function LiveActivityFeed({ className }: { className?: string }) {
  const { events, pulse } = useAdminLiveFeed();

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Live activity</p>
        <span className={cn("flex items-center gap-1 text-[11px] font-medium text-slate-400", pulse && "text-emerald-500")}>
          <Radio className="size-3.5" /> Real-time
        </span>
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Waiting for activity — new reports, matches, and returns will appear here instantly.
          </p>
        )}
        {events.map((evt, i) => {
          const Icon = ICONS[evt.kind];
          return (
            <div
              key={evt.id}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-2.5 transition",
                i === 0 && "animate-in fade-in slide-in-from-top-1"
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", COLORS[evt.kind])}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">{evt.message}</p>
                <p className="text-xs text-slate-400">
                  {evt.city ? `${evt.city} · ` : ""}
                  {timeAgo(evt.at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
