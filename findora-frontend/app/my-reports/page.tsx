"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileX } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ItemCard } from "@/components/item-card";
import { EmptyState } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { Report } from "@/lib/types";

export default function MyReportsPage() {
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [lost, setLost] = useState<Report[]>([]);
  const [found, setFound] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Report[] }>("/lost/mine").catch(() => ({ data: [] })),
      api.get<{ data: Report[] }>("/found/mine").catch(() => ({ data: [] })),
    ]).then(([l, f]) => {
      setLost(l.data);
      setFound(f.data);
      setLoading(false);
    });
  }, []);

  const items = tab === "lost" ? lost : found;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-slate-900">My Reports</h1>
        <Link
          href="/report"
          className="flex items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 hover:bg-brand-indigo-dark"
        >
          <Plus className="size-4" /> New report
        </Link>
      </div>

      <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white p-1">
        {(["lost", "found"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-brand-indigo text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t} items ({t === "lost" ? lost.length : found.length})
          </button>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <EmptyState
          icon={FileX}
          title={`No ${tab} reports yet`}
          description={`Reports you file will show up here so you can track their status.`}
          action={
            <Link href={`/report/${tab}`} className="rounded-full bg-brand-indigo px-5 py-2 text-sm font-semibold text-white hover:bg-brand-indigo-dark">
              Report {tab} item
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item._id} item={item} kind={tab} />
        ))}
      </div>
    </DashboardShell>
  );
}
