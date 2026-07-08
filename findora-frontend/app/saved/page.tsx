"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ItemCard } from "@/components/item-card";
import { EmptyState } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { Report } from "@/lib/types";

interface SavedItem extends Report {
  kind: "lost" | "found";
}

export default function SavedItemsPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: SavedItem[] }>("/users/me/saved")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="mb-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Saved Items</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Reports you've bookmarked to check on later — tap the bookmark icon on any card to save or remove it.
      </p>

      {!loading && items.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Browse Search / Explore and tap the bookmark icon on a report to save it here."
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item._id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
            <ItemCard item={item} kind={item.kind} />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
