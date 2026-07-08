"use client";

import { useEffect, useState } from "react";
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard, StatusPill } from "@/components/ui-bits";
import { DonutChart, TrendChart } from "@/components/charts";
import { LiveMap, MapPin } from "@/components/live-map";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Analytics {
  totalUsers: number;
  lostCount: number;
  foundCount: number;
  resolvedCount: number;
  matches: number;
  recoveryRate: number;
  topCategories: { category: string; count: number }[];
  topCities: { city: string; count: number }[];
  trend: { label: string; value: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ data: Analytics }>("/admin/analytics").then((r) => setData(r.data)).catch(() => {});
    api.get<{ data: any[] }>("/admin/reports").then((r) => setReports(r.data)).catch(() => {});
  }, []);

  const maxCategory = data ? Math.max(1, ...data.topCategories.map((c) => c.count)) : 1;

  const pins: MapPin[] = reports
    .filter((r) => r.coordinates?.lat && r.coordinates?.lng)
    .slice(0, 40)
    .map((r) => ({
      id: r._id,
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      label: r.title,
      sublabel: r.location,
      kind: r.type,
    }));

  return (
    <AdminShell variant="admin">
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={data?.totalUsers ?? "—"} accent="indigo" />
        <StatCard icon={FileText} label="Lost + found reports" value={(data?.lostCount ?? 0) + (data?.foundCount ?? 0)} accent="blue" />
        <StatCard icon={CheckCircle2} label="Resolved reports" value={data?.resolvedCount ?? "—"} accent="green" />
        <StatCard icon={TrendingUp} label="Recovery rate" value={`${data?.recoveryRate ?? 0}%`} accent="orange" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <p className="mb-3 font-heading text-sm font-semibold text-slate-900">Live reports map</p>
          <LiveMap className="h-64 w-full" pins={pins} />
        </div>
        <LiveActivityFeed />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <p className="font-heading text-sm font-semibold text-slate-900">Reports overview (last 6 months)</p>
          <TrendChart data={data?.trend ?? []} height={220} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">Top categories</p>
          <DonutChart
            data={(data?.topCategories ?? []).map((c) => ({ name: c.category, value: c.count }))}
            height={220}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">Category breakdown</p>
          <div className="mt-4 space-y-3">
            {(data?.topCategories ?? []).map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{c.category}</span>
                  <span>{c.count}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-indigo"
                    style={{ width: `${(c.count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!data?.topCategories?.length && <p className="text-sm text-slate-400">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">City-wise reports</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(data?.topCities ?? []).map((c) => (
              <span key={c.city} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-brand-indigo">
                {c.city} · {c.count}
              </span>
            ))}
            {!data?.topCities?.length && <p className="text-sm text-slate-400">No data yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-heading text-sm font-semibold text-slate-900">Recent reports</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">Item</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Location</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{r.title}</td>
                  <td className="py-2.5 pr-4"><StatusPill status={r.type} /></td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.location}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="py-2.5"><StatusPill status={r.status} /></td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
