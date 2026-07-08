"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ItemCard } from "@/components/item-card";
import { EmptyState } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { CATEGORIES, Report } from "@/lib/types";

function SearchInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    try {
      const res = await api.get<{ data: Report[] }>(`/${tab}?${params.toString()}`, false);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <DashboardShell>
      <h1 className="mb-1 font-heading text-2xl font-bold text-slate-900">Search / Explore</h1>
      <p className="mb-6 text-sm text-slate-500">Browse all open lost & found reports across the community.</p>

      <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white p-1">
        {(["lost", "found"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-brand-indigo text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t} items
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <span className="relative flex-1 min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by keyword..." className="input" />
        </span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-plain w-40">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="input-plain w-32" />
        <button className="flex items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-brand-indigo-dark">
          <SlidersHorizontal className="size-4" /> Apply
        </button>
      </form>

      {!loading && items.length === 0 && (
        <EmptyState icon={SearchIcon} title="No reports found" description="Try a different keyword, category or city." />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item._id} item={item} kind={tab} />
        ))}
      </div>
    </DashboardShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
