import { MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand-indigo text-white shadow-sm shadow-brand-indigo/30 transition-transform group-hover:scale-105">
        <MapPin className="size-4.5" strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "font-heading text-xl font-bold tracking-tight",
          dark ? "text-white" : "text-slate-900 dark:text-slate-100"
        )}
      >
        Findora
      </span>
    </Link>
  );
}
