"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Renders /logo.png from the public folder if it exists; otherwise falls
 * back to the default pin-mark. Drop your own logo file at
 * findora-frontend/public/logo.png (square, transparent background works
 * best) and it'll be picked up automatically everywhere Logo is used.
 */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)}>
      {!imageFailed ? (
        <img
          src="/logo.png"
          alt="Findora"
          onError={() => setImageFailed(true)}
          className="size-8 shrink-0 rounded-xl object-contain transition-transform group-hover:scale-105"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-indigo text-white shadow-sm shadow-brand-indigo/30 transition-transform group-hover:scale-105">
          <MapPin className="size-4.5" strokeWidth={2.5} />
        </span>
      )}
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