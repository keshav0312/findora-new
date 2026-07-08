"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard, StatusPill } from "@/components/ui-bits";
import { DonutChart } from "@/components/charts";
import { LiveMap, MapPin } from "@/components/live-map";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { FileText, CheckCircle2, Users } from "lucide-react";

export default function PoliceDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get<{ data: any[] }>("/admin/reports").then((r) => setReports(r.data)).catch(() => {});
    api.get<{ data: any }>("/admin/analytics").then((r) => setAnalytics(r.data)).catch(() => {});
  }, []);

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
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="size-6 text-brand-indigo" />
        <h1 className="font-heading text-2xl font-bold text-slate-900">Police Portal</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Total reports" value={(analytics?.lostCount ?? 0) + (analytics?.foundCount ?? 0)} accent="indigo" />
        <StatCard icon={CheckCircle2} label="Resolved" value={analytics?.resolvedCount ?? 0} accent="green" />
        <StatCard icon={Users} label="Registered citizens" value={analytics?.totalUsers ?? 0} accent="blue" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">Lost vs found</p>
          <DonutChart
            data={[
              { name: "Lost", value: analytics?.lostCount ?? 0 },
              { name: "Found", value: analytics?.foundCount ?? 0 },
            ]}
            height={200}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <p className="mb-3 font-heading text-sm font-semibold text-slate-900">Live reports map</p>
          <LiveMap className="h-56 w-full" pins={pins} />
        </div>
      </div>

      <div className="mt-6">
        <LiveActivityFeed />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-heading text-sm font-semibold text-slate-900">Citizen-submitted reports</p>
        <p className="mb-4 text-xs text-slate-500">
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
                <tr key={r._id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{r.title}</td>
                  <td className="py-2.5 pr-4"><StatusPill status={r.type} /></td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.category}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.location}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{formatDate(r.createdAt)}</td>
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
      </div>
    </AdminShell>
  );
}
