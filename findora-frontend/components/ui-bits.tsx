"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { initials, resolveImage } from "@/lib/format";
import Image from "next/image";
import { LucideIcon } from "lucide-react";

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    Lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    Found: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    found: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    matched: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    closed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    suggested: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    returned: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    rejected: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  };
  const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        cls
      )}
    >
      {status}
    </span>
  );
}

/** Animates a number counting up from 0 to `value` on mount / when it changes. */
function useCountUp(value: number, durationMs = 900) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf: number;

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (value - fromRef.current) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "indigo",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "indigo" | "blue" | "green" | "orange" | "red";
}) {
  const accentMap = {
    indigo: "bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10",
    blue: "bg-blue-50 text-brand-blue dark:bg-blue-500/10",
    green: "bg-emerald-50 text-brand-green dark:bg-emerald-500/10",
    orange: "bg-orange-50 text-brand-orange dark:bg-orange-500/10",
    red: "bg-red-50 text-brand-red dark:bg-red-500/10",
  };
  const numeric = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  const animated = useCountUp(Number.isFinite(numeric) ? numeric : 0);
  const displayValue = typeof value === "number" || /^\d+$/.test(String(value)) ? animated : value;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            accentMap[accent]
          )}
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {displayValue}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Card wrapper with an icon header, used across the admin & police dashboards. */
export function ChartCard({
  title,
  icon: Icon,
  children,
  className,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
            <Icon className="size-4" />
          </span>
        )}
        <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 9,
}: {
  name?: string;
  src?: string | null;
  size?: 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20;
}) {
  const sizeMap: Record<number, string> = {
    6: "size-6 text-[10px]",
    7: "size-7 text-xs",
    8: "size-8 text-xs",
    9: "size-9 text-sm",
    10: "size-10 text-sm",
    12: "size-12 text-base",
    14: "size-14 text-lg",
    16: "size-16 text-xl",
    20: "size-20 text-2xl",
  };
  const dim = sizeMap[size] || sizeMap[9];
  const resolved = resolveImage(src);
  if (resolved) {
    return (
      <Image
        src={resolved}
        alt={name || "avatar"}
        width={size * 4}
        height={size * 4}
        unoptimized
        className={cn("rounded-full object-cover shrink-0", dim.split(" ")[0])}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-indigo/10 font-semibold text-brand-indigo dark:bg-brand-indigo/20",
        dim
      )}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="size-7" />
      </span>
      <p className="font-heading text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
