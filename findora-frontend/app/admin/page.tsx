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
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-[#101d2b] via-[#1e3b52] to-[#315f70] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-28 size-80 rounded-full border border-white/10 bg-white/[0.03]" />
        <div className="pointer-events-none absolute -right-2 -top-16 size-52 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              Platform overview
            </span>
            <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Admin dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200/85 sm:text-base">
              A clear view of reports, community activity, and successful recoveries across Findora.
            </p>
          </div>
          <div className="flex min-w-48 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-inner shadow-white/5 backdrop-blur">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none tabular-nums">{data?.recoveryRate ?? 0}%</p>
              <p className="mt-1 text-xs text-slate-200/80">recovery rate</p>
            </div>
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
            colors={["#c87570", "#6f9f93"]}
          />
        </ChartCard>

        <ChartCard title="Resolution status" icon={CheckCircle2}>
          <PieBreakdown
            data={[
              { name: "Resolved", value: resolved },
              { name: "Pending", value: pending },
            ]}
            colors={["#6f9f93", "#c79a5b"]}
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
          <GaugeChart value={data?.recoveryRate ?? 0} color="#6f9f93" label="items returned to owners" />
        </ChartCard>

        <ChartCard title="Reports overview (last 6 months)" icon={BarChart3} className="lg:col-span-2">
          <AreaTrendChart data={data?.trend ?? []} height={220} color="#547b96" />
        </ChartCard>
      </div>

      {/* Live map + activity feed */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Live reports map" icon={MapPinned} className="lg:col-span-2">
          <LiveMap className="h-64 w-full" pins={pins} />
        </ChartCard>
        <LiveActivityFeed />
      </div>

      {/* Connected ecosystem concept + category breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Connected ecosystem" icon={Building2} className="lg:col-span-2">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            How people, reports, matching, and recovery partners can connect through Findora.
          </p>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950/30">
            <svg
              className="h-auto w-full"
              viewBox="0 0 760 420"
              role="img"
              aria-labelledby="ecosystem-title ecosystem-description"
            >
              <title id="ecosystem-title">Findora connected ecosystem</title>
              <desc id="ecosystem-description">
                An illustrative workflow linking user reports to matching, future partner centers, and verified recovery.
              </desc>
              <defs>
                <pattern id="ecosystem-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="#94a3b8"
                    strokeOpacity="0.14"
                    strokeWidth="1"
                  />
                </pattern>
                <linearGradient id="ecosystem-line" x1="0" x2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.28" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <rect width="760" height="420" fill="url(#ecosystem-grid)" />
              <g fill="none" stroke="url(#ecosystem-line)" strokeWidth="2">
                <path d="M160 120 L360 200 L600 120" />
                <path d="M160 280 L360 200 L600 280" />
                <path d="M160 120 L600 280" />
                <path d="M160 280 L600 120" />
                <path d="M360 200 L600 120 L600 280" />
              </g>
              <g>
                <circle cx="160" cy="120" r="7" fill="#2563eb" />
                <circle cx="160" cy="280" r="7" fill="#0f172a" />
                <circle cx="360" cy="200" r="9" fill="#203b59" />
                <circle cx="600" cy="120" r="7" fill="#0f172a" />
                <circle cx="600" cy="280" r="8" fill="#10b981" />
                <circle cx="280" cy="130" r="5" fill="#64748b" />
                <circle cx="505" cy="260" r="5" fill="#2563eb" />
              </g>
              <g fontFamily="Arial, sans-serif" fontSize="14" fontWeight="600">
                <rect x="34" y="30" width="142" height="40" rx="20" fill="#dbeafe" />
                <text x="105" y="55" fill="#1d4ed8" textAnchor="middle">User reports</text>

                <rect x="536" y="30" width="190" height="40" rx="20" fill="#dcfce7" />
                <text x="631" y="55" fill="#15803d" textAnchor="middle">Partner centers (future)</text>

                <rect x="34" y="348" width="146" height="40" rx="20" fill="#fef3c7" />
                <text x="107" y="373" fill="#a16207" textAnchor="middle">Smart matching</text>

                <rect x="528" y="348" width="198" height="40" rx="20" fill="#e0e7ff" />
                <text x="627" y="373" fill="#4338ca" textAnchor="middle">Verified recovery</text>
              </g>
            </svg>
          </div>
          <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
            Illustrative workflow only. The connections shown are not live partner integrations or real-time network data.
          </p>
        </ChartCard>

        <ChartCard title="Category breakdown" icon={Layers}>
          <div className="space-y-3">
            {(data?.topCategories ?? []).map((c, i) => (
              <div key={c.category} className="rounded-xl border border-slate-100 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{c.category}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{c.count}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(c.count / maxCategory) * 100}%`,
                      background: ["#294760", "#547b96", "#6f9f93", "#c79a5b", "#9d7775", "#71899a"][i % 6],
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
