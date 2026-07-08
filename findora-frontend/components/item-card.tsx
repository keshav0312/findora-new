"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, Calendar, ImageOff, Bookmark } from "lucide-react";
import { Report } from "@/lib/types";
import { formatDate, resolveImage } from "@/lib/format";
import { StatusPill } from "./ui-bits";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// Small module-level cache so every ItemCard on a page shares one fetch of
// "which items has this user saved" instead of each card calling the API.
let savedIdsCache: Promise<string[]> | null = null;
function getSavedIds(): Promise<string[]> {
  if (!savedIdsCache) {
    savedIdsCache = api
      .get<{ data: string[] }>("/users/me/saved/ids")
      .then((r) => r.data)
      .catch(() => []);
  }
  return savedIdsCache;
}

export function ItemCard({ item, kind }: { item: Report; kind: "lost" | "found" }) {
  const { user } = useAuth();
  const photo = resolveImage(item.photos?.[0]);
  const [saved, setSaved] = useState(false);
  const key = `${kind}:${item._id}`;

  useEffect(() => {
    if (!user) return;
    getSavedIds().then((ids) => setSaved(ids.includes(key)));
  }, [user, key]);

  const toggleSaved = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setSaved((s) => !s); // optimistic
    try {
      await api.post(`/users/me/saved/${kind}/${item._id}`, {});
      savedIdsCache = null; // invalidate cache so /saved page refetches fresh
    } catch {
      setSaved((s) => !s); // revert on failure
    }
  };

  return (
    <Link
      href={`/items/${kind}/${item._id}`}
      className="group relative flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
        {photo ? (
          <Image src={photo} alt={item.title} width={64} height={64} className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <ImageOff className="size-6" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-heading text-sm font-semibold text-slate-900 transition-colors group-hover:text-brand-indigo dark:text-slate-100">
            {item.title}
          </p>
          <StatusPill status={kind} />
        </div>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="size-3.5 shrink-0" /> {item.location}
          {item.city ? `, ${item.city}` : ""}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Calendar className="size-3.5 shrink-0" /> {formatDate(item.date)}
        </p>
      </div>

      {user && (
        <button
          onClick={toggleSaved}
          title={saved ? "Remove from saved" : "Save for later"}
          className={cn(
            "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full backdrop-blur transition-all duration-200",
            saved
              ? "bg-brand-indigo text-white"
              : "bg-white/80 text-slate-300 hover:text-brand-indigo dark:bg-slate-900/80 dark:text-slate-600"
          )}
        >
          <Bookmark className={cn("size-3.5 transition-transform", saved && "scale-110 fill-current")} />
        </button>
      )}
    </Link>
  );
}
