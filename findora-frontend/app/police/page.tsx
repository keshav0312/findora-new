"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  Users,
  PieChart as PieChartIcon,
  MapPinned,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard, StatusPill, ChartCard } from "@/components/ui-bits";
import { PieBreakdown, AreaTrendChart, GaugeChart } from "@/components/charts";
import { LiveMap, MapPin } from "@/components/live-map";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function PoliceDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get<{ data: any[] }>("/admin/reports").then((r) => setReports(r.data)).catch(() => {});
    api.get<{ data: any }>("/admin/analytics").then((r) => setAnalytics(r.data)).catch(() => {});
  }, []);

  const lostCount = analytics?.lostCount ?? 0;
  const foundCount = analytics?.foundCount ?? 0;
  const totalReports = lostCount + foundCount;
  const resolved = analytics?.resolvedCount ?? 0;
  const pending = Math.max(0, totalReports - resolved);

  const pins: MapPin[] = reports
    .filter((r) => r.coordinates?.lat && r.coordinates?.lng)
    .slice(0, 30)
    .map((r) => ({
      id: r._id,
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      label: r.title,
      sublabel: r.location,
      kind: r.type,
    }));

  return (
    <AdminShell variant="police">
      {/* Gradient header banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-brand-ink to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold">Police Portal</h1>
              <p className="mt-1 text-sm text-white/70">
                Verification view of citizen reports and recovery activity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <TrendingUp className="size-4" />
            {analytics?.recoveryRate ?? 0}% recovery rate
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Total reports" value={totalReports} accent="indigo" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolved} accent="green" />
        <StatCard icon={Users} label="Registered citizens" value={analytics?.totalUsers ?? 0} accent="blue" />
      </div>

      {/* Pie charts + gauge */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Lost vs Found" icon={PieChartIcon}>
          <PieBreakdown
            data={[
              { name: "Lost", value: lostCount },
              { name: "Found", value: foundCount },
            ]}
            colors={["#dc2626", "#16a34a"]}
            height={220}
          />
        </ChartCard>

        <ChartCard title="Resolution status" icon={CheckCircle2}>
          <PieBreakdown
            data={[
              { name: "Resolved", value: resolved },
              { name: "Pending", value: pending },
            ]}
            colors={["#16a34a", "#f97316"]}
            height={220}
          />
        </ChartCard>

        <ChartCard title="Recovery rate" icon={TrendingUp}>
          <GaugeChart value={analytics?.recoveryRate ?? 0} height={220} label="items returned" />
        </ChartCard>
      </div>

      {/* Live map + trend */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Live reports map" icon={MapPinned} className="lg:col-span-2">
          <LiveMap className="h-64 w-full" pins={pins} />
        </ChartCard>
        <ChartCard title="Reports (last 6 months)" icon={BarChart3}>
          <AreaTrendChart data={analytics?.trend ?? []} height={220} color="#2563eb" />
        </ChartCard>
      </div>

      {/* Activity feed */}
      <div className="mt-6">
        <LiveActivityFeed />
      </div>

      {/* Citizen reports table */}
      <ChartCard title="Citizen-submitted reports" icon={FileText} className="mt-6">
        <p className="-mt-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
          Read-only view for verification purposes. Citizens' verification answers remain private to them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">Item</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Category</th>
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
                  <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.category}</td>
                  <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.location}</td>
                  <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{formatDate(r.createdAt)}</td>
                  <td className="py-2.5"><StatusPill status={r.status} /></td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
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
