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
  Search,
  PackageSearch,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard, EmptyState, Avatar } from "@/components/ui-bits";
import { ItemCard } from "@/components/item-card";
import { LiveMap, MapPin as MapPinType } from "@/components/live-map";
import { DonutChart } from "@/components/charts";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Report, MatchRecord } from "@/lib/types";

const BADGE_THRESHOLDS = { bronze: 0, silver: 50, gold: 100 };

function nextBadgeInfo(points: number) {
  if (points < BADGE_THRESHOLDS.silver) {
    return { next: "Silver", needed: BADGE_THRESHOLDS.silver, pct: Math.min(100, (points / BADGE_THRESHOLDS.silver) * 100) };
  }
  if (points < BADGE_THRESHOLDS.gold) {
    return {
      next: "Gold",
      needed: BADGE_THRESHOLDS.gold,
      pct: Math.min(100, ((points - BADGE_THRESHOLDS.silver) / (BADGE_THRESHOLDS.gold - BADGE_THRESHOLDS.silver)) * 100),
    };
  }
  return { next: null, needed: 0, pct: 100 };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [lost, setLost] = useState<Report[]>([]);
  const [found, setFound] = useState<Report[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<{ data: Report[] }>("/lost/mine").then((r) => setLost(r.data)).catch(() => {}),
      api.get<{ data: Report[] }>("/found/mine").then((r) => setFound(r.data)).catch(() => {}),
      api.get<{ data: MatchRecord[] }>("/matches").then((r) => setMatches(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
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

  const points = user?.trustPoints ?? 0;
  const badgeInfo = nextBadgeInfo(points);
  const firstName = user?.name?.split(" ")[0];

  return (
    <DashboardShell>
      {/* Hero greeting banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-indigo via-indigo-600 to-blue-600 p-6 shadow-lg shadow-brand-indigo/20 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 animate-blob rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-48 animate-blob rounded-full bg-white/10 blur-3xl [animation-delay:3s]" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="animate-in fade-in slide-in-from-left-3 duration-500">
            <p className="flex items-center gap-2 text-sm font-medium text-indigo-100">
              Welcome back <span className="animate-[wave_1.6s_ease-in-out_infinite] inline-block origin-[70%_70%]">👋</span>
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">{firstName}</h1>
            <p className="mt-2 text-sm text-indigo-100">
              {matches.length > 0 ? (
                <>
                  You have <span className="font-semibold text-white">{matches.length}</span>{" "}
                  {matches.length === 1 ? "match" : "matches"} waiting for you.
                </>
              ) : (
                "No matches yet — report an item and we'll find it for you."
              )}
            </p>
          </div>
          <div className="flex animate-in fade-in slide-in-from-right-3 flex-wrap gap-2 duration-500">
            <Link
              href="/report/lost"
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-brand-indigo shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus className="size-4" /> Report Lost
            </Link>
            <Link
              href="/report/found"
              className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              <Plus className="size-4" /> Report Found
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { icon: FileText, label: "Lost items", value: openLost, accent: "red" as const },
          { icon: FileText, label: "Found items", value: openFound, accent: "green" as const },
          { icon: Sparkles, label: "Matches", value: matches.length, accent: "indigo" as const },
          { icon: Award, label: "Trust points", value: points, accent: "orange" as const },
        ].map((s, i) => (
          <div
            key={s.label}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
          >
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/search", icon: Search, label: "Explore", accent: "bg-blue-50 text-brand-blue dark:bg-blue-500/10" },
          { href: "/matches", icon: Sparkles, label: "Matches", accent: "bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10" },
          { href: "/saved", icon: PackageSearch, label: "Saved Items", accent: "bg-emerald-50 text-brand-green dark:bg-emerald-500/10" },
          { href: "/leaderboard", icon: Trophy, label: "Leaderboard", accent: "bg-amber-50 text-amber-500 dark:bg-amber-500/10" },
        ].map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className="animate-in fade-in slide-in-from-bottom-2 group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: `${280 + i * 70}ms`, animationFillMode: "backwards" }}
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", a.accent)}>
              <a.icon className="size-4.5" />
            </span>
            <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10">
                  <Sparkles className="size-4" />
                </span>
                Recent matches
              </h2>
              <Link href="/matches" className="flex items-center gap-0.5 text-xs font-semibold text-brand-indigo transition hover:gap-1.5 hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {!loading && matches.length === 0 && (
                <EmptyState
                  icon={Sparkles}
                  title="No matches yet"
                  description="Report an item and we'll notify you the moment a likely match appears."
                />
              )}
              {matches.slice(0, 3).map((m, i) => (
                <Link
                  key={m._id}
                  href="/matches"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-indigo/40 hover:bg-indigo-50/40 hover:shadow-sm dark:border-slate-800 dark:hover:bg-indigo-500/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-500/10">
                      <Sparkles className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.lostItem?.title}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        Found near {m.foundItem?.location} · {m.score}% match
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-brand-green dark:bg-emerald-500/10">
                    {m.score}%
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: "600ms", animationFillMode: "backwards" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-brand-blue dark:bg-blue-500/10">
                  <FileText className="size-4" />
                </span>
                Your recent reports
              </h2>
              <Link href="/my-reports" className="flex items-center gap-0.5 text-xs font-semibold text-brand-indigo transition hover:gap-1.5 hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!loading && recentReports.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState
                    icon={FileText}
                    title="No reports yet"
                    description="You haven't filed any lost or found reports."
                    action={
                      <Link
                        href="/report"
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-indigo-dark"
                      >
                        <Plus className="size-3.5" /> Create your first report
                      </Link>
                    }
                  />
                </div>
              )}
              {recentReports.map((r, i) => (
                <div
                  key={r._id}
                  className="animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${700 + i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <ItemCard item={r} kind={r.kind} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: "550ms", animationFillMode: "backwards" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green dark:bg-emerald-500/10">
                  <MapPin className="size-4" />
                </span>
                Nearby reports
              </h2>
            </div>
            <LiveMap className="aspect-square w-full" pins={nearbyPins} />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: "650ms", animationFillMode: "backwards" }}
          >
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-slate-100">Your reports by category</h2>
            <DonutChart data={categoryData} height={180} />
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: "750ms", animationFillMode: "backwards" }}
          >
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-slate-100">Your trust badge</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-brand-orange transition-transform duration-300 hover:scale-110 dark:bg-orange-500/10">
                <Award className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                  {user?.badge === "none" ? "New member" : `${user?.badge} badge`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{points} trust points earned</p>
              </div>
            </div>

            {badgeInfo.next ? (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Progress to {badgeInfo.next}</span>
                  <span>
                    {points}/{badgeInfo.needed}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${badgeInfo.pct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <CheckCircle2 className="size-4" /> You've reached the top tier — Gold badge!
              </div>
            )}

            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Earn points every time you return an item or verify a match. Reach 50 points for
              Silver, 100 for Gold.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
