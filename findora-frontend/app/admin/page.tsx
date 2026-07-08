"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  PieChart as PieChartIcon,
  Layers,
  Building2,
  MapPinned,
  BarChart3,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard, StatusPill, ChartCard } from "@/components/ui-bits";
import { DonutChart, PieBreakdown, AreaTrendChart, GaugeChart } from "@/components/charts";
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

  const lostCount = data?.lostCount ?? 0;
  const foundCount = data?.foundCount ?? 0;
  const totalReports = lostCount + foundCount;
  const resolved = data?.resolvedCount ?? 0;
  const pending = Math.max(0, totalReports - resolved);
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
      {/* Gradient header banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-indigo via-brand-indigo to-brand-indigo-dark p-6 text-white shadow-lg shadow-brand-indigo/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/80">
              Platform-wide insight into reports, recoveries and community activity.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
            <TrendingUp className="size-4" />
            {data?.recoveryRate ?? 0}% recovery rate
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={data?.totalUsers ?? "—"} accent="indigo" />
        <StatCard icon={FileText} label="Total reports" value={totalReports} accent="blue" />
        <StatCard icon={CheckCircle2} label="Resolved reports" value={resolved} accent="green" />
        <StatCard icon={Sparkles} label="AI matches" value={data?.matches ?? "—"} accent="orange" />
      </div>

      {/* Pie chart trio */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Lost vs Found" icon={PieChartIcon}>
          <PieBreakdown
            data={[
              { name: "Lost", value: lostCount },
              { name: "Found", value: foundCount },
            ]}
            colors={["#dc2626", "#16a34a"]}
          />
        </ChartCard>

        <ChartCard title="Resolution status" icon={CheckCircle2}>
          <PieBreakdown
            data={[
              { name: "Resolved", value: resolved },
              { name: "Pending", value: pending },
            ]}
            colors={["#16a34a", "#f97316"]}
          />
        </ChartCard>

        <ChartCard title="Top categories" icon={Layers}>
          <DonutChart
            data={(data?.topCategories ?? []).map((c) => ({ name: c.category, value: c.count }))}
            height={240}
          />
        </ChartCard>
      </div>

      {/* Recovery gauge + trend */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Recovery rate" icon={TrendingUp}>
          <GaugeChart value={data?.recoveryRate ?? 0} label="items returned to owners" />
        </ChartCard>

        <ChartCard title="Reports overview (last 6 months)" icon={BarChart3} className="lg:col-span-2">
          <AreaTrendChart data={data?.trend ?? []} height={220} />
        </ChartCard>
      </div>

      {/* Live map + activity feed */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Live reports map" icon={MapPinned} className="lg:col-span-2">
          <LiveMap className="h-64 w-full" pins={pins} />
        </ChartCard>
        <LiveActivityFeed />
      </div>

      {/* City pie + category bars */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="City-wise reports" icon={Building2}>
          <PieBreakdown
            data={(data?.topCities ?? []).map((c) => ({ name: c.city, value: c.count }))}
            height={240}
          />
        </ChartCard>

        <ChartCard title="Category breakdown" icon={Layers}>
          <div className="space-y-3">
            {(data?.topCategories ?? []).map((c, i) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{c.category}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{c.count}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(c.count / maxCategory) * 100}%`,
                      background: ["#4338ca", "#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed"][i % 6],
                    }}
                  />
                </div>
              </div>
            ))}
            {!data?.topCategories?.length && <p className="text-sm text-slate-400">No data yet.</p>}
          </div>
        </ChartCard>
      </div>

      {/* Recent reports table */}
      <ChartCard title="Recent reports" icon={FileText} className="mt-6">
        <div className="overflow-x-auto">
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
                <tr key={r._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">{r.title}</td>
                  <td className="py-2.5 pr-4"><StatusPill status={r.type} /></td>
                  <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.location}</td>
                  <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{formatDate(r.createdAt)}</td>
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
      </ChartCard>
    </AdminShell>
  );
}
