"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Sparkles,
  Award,
  Plus,
  MapPin,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui-bits";
import { ItemCard } from "@/components/item-card";
import { LiveMap, MapPin as MapPinType } from "@/components/live-map";
import { DonutChart } from "@/components/charts";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Report, MatchRecord } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [lost, setLost] = useState<Report[]>([]);
  const [found, setFound] = useState<Report[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<{ data: Report[] }>("/lost/mine").then((r) => setLost(r.data)).catch(() => {});
    api.get<{ data: Report[] }>("/found/mine").then((r) => setFound(r.data)).catch(() => {});
    api.get<{ data: MatchRecord[] }>("/matches").then((r) => setMatches(r.data)).catch(() => {});
  }, [user]);

  const openLost = lost.filter((i) => i.status !== "closed").length;
  const openFound = found.filter((i) => i.status !== "closed").length;
  const recentReports = [...lost.map((i) => ({ ...i, kind: "lost" as const })), ...found.map((i) => ({ ...i, kind: "found" as const }))]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const allItems = [...lost, ...found];
  const categoryCounts = allItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const nearbyPins: MapPinType[] = allItems
    .filter((i) => i.coordinates?.lat && i.coordinates?.lng)
    .slice(0, 20)
    .map((i) => ({
      id: i._id,
      lat: i.coordinates.lat as number,
      lng: i.coordinates.lng as number,
      label: i.title,
      sublabel: i.location,
      kind: lost.includes(i) ? "lost" : "found",
    }));

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Welcome back, {user?.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500">You have {matches.length} new matches</p>
        </div>
        <Link
          href="/report"
          className="flex items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 hover:bg-brand-indigo-dark"
        >
          <Plus className="size-4" /> New report
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FileText} label="Lost items" value={openLost} accent="red" />
        <StatCard icon={FileText} label="Found items" value={openFound} accent="green" />
        <StatCard icon={Sparkles} label="Matches" value={matches.length} accent="indigo" />
        <StatCard icon={Award} label="Trust points" value={user?.trustPoints ?? 0} accent="orange" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-slate-900">Recent matches</h2>
              <Link href="/matches" className="text-xs font-semibold text-brand-indigo hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {matches.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No matches yet — report an item and we'll notify you the moment one appears.
                </p>
              )}
              {matches.slice(0, 3).map((m) => (
                <Link
                  key={m._id}
                  href="/matches"
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:border-brand-indigo/40 hover:bg-indigo-50/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo">
                      <Sparkles className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{m.lostItem?.title}</p>
                      <p className="text-xs text-slate-500">
                        Found near {m.foundItem?.location} · {m.score}% match
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-brand-green">
                    {m.score}%
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-slate-900">Your recent reports</h2>
              <Link href="/my-reports" className="text-xs font-semibold text-brand-indigo hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentReports.length === 0 && (
                <p className="col-span-2 py-6 text-center text-sm text-slate-400">
                  You haven't filed any reports yet.
                </p>
              )}
              {recentReports.map((r) => (
                <ItemCard key={r._id} item={r} kind={r.kind} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-slate-900">Nearby reports</h2>
              <MapPin className="size-4 text-slate-400" />
            </div>
            <LiveMap className="aspect-square w-full" pins={nearbyPins} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-heading text-base font-semibold text-slate-900">Your reports by category</h2>
            <DonutChart data={categoryData} height={180} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-heading text-base font-semibold text-slate-900">Your trust badge</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-brand-orange">
                <Award className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold capitalize text-slate-800">
                  {user?.badge === "none" ? "New member" : `${user?.badge} badge`}
                </p>
                <p className="text-xs text-slate-500">{user?.trustPoints ?? 0} trust points earned</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Earn points every time you return an item or verify a match. Reach 50 points for
              Silver, 100 for Gold.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
