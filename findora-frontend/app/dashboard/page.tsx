"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Award,
  MapPin,
  ArrowRight,
  Trophy,
  Medal,
  Heart,
  ShieldCheck,
  Radar,
  MessageCircle,
  Search,
  PackageCheck,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui-bits";
import { LiveMap, MapPin as MapPinType } from "@/components/live-map";
import { DonutChart, AreaTrendChart, GaugeChart } from "@/components/charts";
import { TrackingStepper, TrackingStep } from "@/components/tracking-stepper";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { AppNotification, Report, MatchRecord } from "@/lib/types";

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
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasLoaded = useRef(false);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const [lostResponse, foundResponse, matchResponse] = await Promise.all([
        api.get<{ data: Report[] }>("/lost/mine"),
        api.get<{ data: Report[] }>("/found/mine"),
        api.get<{ data: MatchRecord[] }>("/matches"),
      ]);
      setLost(lostResponse.data);
      setFound(foundResponse.data);
      setMatches(matchResponse.data);
      setLoadError(false);
      setStale(false);
      setLastUpdated(new Date());
      hasLoaded.current = true;
    } catch {
      if (hasLoaded.current) setStale(true);
      else setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    const refreshOnNotification = (notification: AppNotification) => {
      if (["match", "returned", "claim"].includes(notification.type)) {
        void refreshDashboard();
      }
    };
    const refreshOnMatchUpdate = () => void refreshDashboard();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshDashboard();
    };
    const pollId = window.setInterval(refreshWhenVisible, 30_000);
    const initialRefreshId = window.setTimeout(() => void refreshDashboard(), 0);

    socket.on("notification:new", refreshOnNotification);
    socket.on("match:updated", refreshOnMatchUpdate);
    socket.on("connect", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      window.clearInterval(pollId);
      window.clearTimeout(initialRefreshId);
      socket.off("notification:new", refreshOnNotification);
      socket.off("match:updated", refreshOnMatchUpdate);
      socket.off("connect", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [userId, refreshDashboard]);

  const openLost = lost.filter((i) => i.status !== "closed").length;
  const openFound = found.filter((i) => i.status !== "closed").length;
  const allItems = [...lost, ...found];
  const totalReports = allItems.length;

  const returnedMatches = matches.filter((m) => m.status === "returned");
  const activeMatches = matches.filter((m) => m.status !== "returned" && m.status !== "rejected");
  const ownedReportIds = new Set(allItems.map((item) => item._id));
  const matchedReportIds = new Set(
    matches.flatMap((match) =>
      [match.lostItem?._id, match.foundItem?._id].filter(
        (id): id is string => Boolean(id && ownedReportIds.has(id))
      )
    )
  );
  const scanPct = totalReports > 0 ? Math.round((matchedReportIds.size / totalReports) * 100) : 0;

  const categoryCounts = allItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Matches grouped by week so "Match Success Rate" has something real to
  // chart instead of fabricated numbers.
  const successTrend = useMemo(() => {
    const buckets = new Map<string, number>();
    matches.forEach((m) => {
      if (!m.createdAt) return;
      const d = new Date(m.createdAt);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      buckets.set(label, (buckets.get(label) || 0) + 1);
    });
    const entries = Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
    return entries.length > 0 ? entries.slice(-8) : [{ label: "So far", value: 0 }];
  }, [matches]);

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

  const journeySteps: TrackingStep[] = [
    { key: "reported", label: "Item reported", description: `${totalReports} report${totalReports === 1 ? "" : "s"} filed` },
    { key: "matched", label: "Match review", description: `${activeMatches.length} possible match${activeMatches.length === 1 ? "" : "es"} to review` },
    { key: "notified", label: "Matches found", description: `${matches.length} match${matches.length === 1 ? "" : "es"}` },
    { key: "returned", label: "Returned", description: `${returnedMatches.length} closed out` },
  ];
  const journeyActiveIndex =
    totalReports === 0 ? 0 : returnedMatches.length > 0 ? 3 : activeMatches.length > 0 ? 2 : 1;

  const matchPriority = { suggested: 0, confirmed: 1, returned: 2, rejected: 3 };
  const prioritizedMatches = [...matches].sort(
    (a, b) => matchPriority[a.status] - matchPriority[b.status] || b.score - a.score
  );
  const topMatch = prioritizedMatches[0];
  const secondMatch = prioritizedMatches[1];

  const EARNED_BADGES = [
    { key: "first_report", label: "First Report", icon: FileText, earned: totalReports > 0 },
    { key: "first_match", label: "First Match", icon: Sparkles, earned: matches.length > 0 },
    { key: "bronze", label: "Bronze", icon: Award, earned: points >= BADGE_THRESHOLDS.bronze && points > 0 },
    { key: "silver", label: "Silver", icon: Medal, earned: points >= BADGE_THRESHOLDS.silver },
    { key: "gold", label: "Gold", icon: Trophy, earned: points >= BADGE_THRESHOLDS.gold },
    { key: "reunited", label: "Reunited Someone", icon: Heart, earned: returnedMatches.length > 0 },
  ];

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
          <span className="sr-only">Loading your dashboard</span>
        </div>
      </DashboardShell>
    );
  }

  if (loadError) {
    return (
      <DashboardShell>
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-brand-red dark:bg-rose-500/10">
            <FileText className="size-7" />
          </div>
          <h1 className="mt-5 font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
            We couldn&apos;t load your dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Check your connection and try again. Your reports haven&apos;t been changed.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              void refreshDashboard();
            }}
            disabled={refreshing}
            className="mt-6 rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-indigo-dark disabled:opacity-60"
          >
            {refreshing ? "Retrying..." : "Try again"}
          </button>
        </section>
      </DashboardShell>
    );
  }

  if (totalReports === 0) {
    return (
      <DashboardShell>
        <section className="relative mx-auto max-w-7xl">
          <div className="pointer-events-none absolute -left-16 top-8 size-72 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-500/10" />
          <div className="pointer-events-none absolute -right-12 top-48 size-72 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-500/10" />

          <div className="relative grid overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-[#18334f] to-[#1e5965] text-white shadow-2xl shadow-slate-900/15 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="relative px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border border-white/10 bg-white/[0.03]" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur">
                <Sparkles className="size-3.5" /> A safer way to reunite people with their things
              </span>
              <h1 className="mt-6 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome, {user?.name}.
                <span className="mt-1 block bg-gradient-to-r from-sky-200 to-emerald-200 bg-clip-text text-transparent">
                  Let&apos;s get you started.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                Tell us what you lost or found. Findora checks for possible matches and helps both sides coordinate a safer return.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/report/lost"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  <MapPin className="size-4" /> Report a lost item <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/report/found"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <PackageCheck className="size-4" /> Report a found item
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-200" /> Private details stay protected</span>
                <span className="inline-flex items-center gap-2"><Radar className="size-4 text-sky-200" /> Possible matches in one place</span>
              </div>
            </div>

            <div className="relative flex items-center border-t border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="w-full rounded-3xl border border-white/10 bg-slate-950/25 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Your recovery journey</p>
                    <h2 className="mt-1 font-heading text-lg font-semibold">Simple from the start</h2>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                    <MessageCircle className="size-5" />
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { icon: FileText, title: "Create a report", detail: "Add the details you remember", color: "text-sky-200" },
                    { icon: Search, title: "Review possible matches", detail: "Compare reports that may be related", color: "text-amber-200" },
                    { icon: ShieldCheck, title: "Coordinate a safe return", detail: "Verify details before meeting", color: "text-emerald-200" },
                  ].map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ${step.color}`}>
                        <step.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="mt-0.5 text-xs text-slate-300">{step.detail}</p>
                      </div>
                      {index < 2 && <span className="text-xs font-medium text-slate-400">0{index + 1}</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-300">
                  You stay in control at every step. Never share sensitive ownership details in a public report.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-indigo">Choose your first step</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">How can Findora help?</h2>
            </div>
            <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-indigo transition hover:gap-2.5 dark:text-sky-200">
              <Search className="size-4" /> Browse reports first <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative mt-4 grid gap-4 md:grid-cols-2">
            <Link
              href="/report/lost"
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-sky-50/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_18px_38px_rgba(49,87,119,0.12)] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 text-brand-indigo shadow-inner dark:from-slate-700 dark:to-slate-800 dark:text-sky-200">
                  <MapPin className="size-5" />
                </span>
                <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-sky-800 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-200">OWNER</span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900 dark:text-slate-100">I lost something</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                Tell the community what went missing and where you last saw it.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition group-hover:gap-3">
                Start lost report <ArrowRight className="size-4" />
              </span>
            </Link>

            <Link
              href="/report/found"
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-emerald-50/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_38px_rgba(49,87,119,0.12)] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 shadow-inner dark:from-slate-700 dark:to-slate-800 dark:text-emerald-200">
                  <PackageCheck className="size-5" />
                </span>
                <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-200">FINDER</span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900 dark:text-slate-100">I found something</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                Share a safe description so its owner can discover it and verify it.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition group-hover:gap-3">
                Start found report <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>

          <div className="relative mt-7">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">What happens next</p>
              <h2 className="mt-1 font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">A simple, safer recovery journey</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, title: "Share the basics", detail: "Describe the item and where it was lost or found.", tint: "text-sky-700 bg-sky-100 dark:text-sky-200 dark:bg-sky-500/10" },
                { icon: Search, title: "Check possible matches", detail: "Review reports that could be related to yours.", tint: "text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-500/10" },
                { icon: ShieldCheck, title: "Verify before handoff", detail: "Keep private details private and arrange a safe return.", tint: "text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-500/10" },
              ].map((step, index) => (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${step.tint}`}>
                    <step.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span className="mr-1.5 text-xs text-slate-400">0{index + 1}</span>{step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <section className="relative mb-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/80 to-indigo-50/80 p-6 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-brand-indigo/10 blur-3xl dark:bg-brand-indigo/20" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-indigo dark:text-sky-200">
              <Sparkles className="size-4" /> Your Findora dashboard
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Welcome back, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Keep track of your reports, review possible matches, and help belongings find their way home.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/report/lost"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/20 transition hover:-translate-y-0.5 hover:bg-brand-indigo-dark"
            >
              <MapPin className="size-4" /> Report lost item
            </Link>
            <Link
              href="/report/found"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:text-emerald-200"
            >
              <PackageCheck className="size-4" /> Report found item
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-2.5 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className={cn("size-2 rounded-full", stale ? "bg-amber-500" : "animate-pulse bg-emerald-500")} />
          {stale
            ? "Could not refresh right now. Showing your last loaded data."
            : `Dashboard updates automatically${lastUpdated ? ` · Last updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`}
        </p>
        <button
          type="button"
          onClick={() => void refreshDashboard()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-brand-indigo transition hover:bg-sky-50 disabled:opacity-60 dark:text-sky-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DashboardMetric
          icon={FileText}
          label="Open reports"
          value={openLost + openFound}
          detail={`${openLost} lost · ${openFound} found`}
          tint="sky"
        />
        <DashboardMetric
          icon={Sparkles}
          label="Possible matches"
          value={activeMatches.length}
          detail={`${activeMatches.length} active`}
          tint="amber"
        />
        <DashboardMetric
          icon={ShieldCheck}
          label="Items returned"
          value={returnedMatches.length}
          detail="Verified handovers"
          tint="emerald"
        />
      </div>

      {/* Row 1 — Recovery Pulse (live AI scan) + Active near you map */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1220] via-[#0f1b33] to-[#0b1220] p-6 text-white lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-indigo/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 size-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-200">
                <Radar className="size-3.5" /> Your recovery activity
              </p>
              <p className="mt-1.5 text-sm text-slate-300">
                {activeMatches.length > 0
                  ? `${activeMatches.length} active possible match${activeMatches.length === 1 ? "" : "es"} to review.`
                  : matches.length > 0
                    ? "No active matches right now. Check your match history for updates."
                    : totalReports > 0
                      ? "No possible matches yet. Your open reports remain available for matching."
                      : "Create a report to start your recovery journey."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {matches.length} {matches.length === 1 ? "match" : "matches"} found
            </span>
          </div>

          {/* Animated flow visual: your reports -> AI core -> pipeline stages */}
          <div className="relative mt-8 flex items-center justify-between gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300">
              You
            </div>

            <svg viewBox="0 0 200 60" className="h-14 flex-1" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="200" y2="10" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <line x1="0" y1="30" x2="200" y2="30" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <line x1="0" y1="30" x2="200" y2="50" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <circle cx="0" cy="30" r="5" fill="#6366f1">
                <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>

            <div className="flex shrink-0 flex-col gap-2">
              <PulseStage color="emerald" label="Reported" value={totalReports} />
              <PulseStage color="amber" label="Possible matches" value={activeMatches.length} />
              <PulseStage color="indigo" label="Returned" value={returnedMatches.length} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green dark:bg-emerald-500/10">
                <MapPin className="size-4" />
              </span>
              Active near you
            </h2>
          </div>
          <LiveMap className="aspect-square w-full" pins={nearbyPins} />
        </div>
      </div>

      {/* Row 2 — top match, journey timeline, second match / feed */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <MatchSpotlightCard match={topMatch} label="Top potential match" />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">My reports timeline</h2>
          <p className="mb-4 text-xs text-slate-400">Where your most recent report stands right now</p>
          <div className="flex flex-col gap-4">
            <GaugeChart value={scanPct} height={120} color="#4338ca" label="Matched" />
            <TrackingStepper steps={journeySteps} activeIndex={journeyActiveIndex} />
          </div>
        </div>

        <MatchSpotlightCard match={secondMatch} label="More potential matches" fallbackLabel="No additional matches" />
      </div>

      {/* Row 3 — analytics */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Platform overview &amp; analytics</h2>
          <DonutChart data={categoryData} height={200} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Match activity over time</h2>
          <AreaTrendChart data={successTrend} height={200} />
        </div>
      </div>

      {/* Row 4 — gamification & trust score */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-brand-orange dark:bg-orange-500/10">
              <Trophy className="size-4" />
            </span>
            Gamification &amp; trust score
          </h2>
          <Link href="/leaderboard" className="flex items-center gap-0.5 text-xs font-semibold text-brand-indigo transition hover:gap-1.5 hover:underline">
            View leaderboard <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          {/* Gauge — spans both rows on the left at md+ */}
          <div className="flex items-center justify-center md:row-span-2">
            <GaugeChart value={Math.min(100, points)} height={140} color="#f97316" label="Trust points" />
          </div>

          {/* Stats column */}
          <div className="flex flex-col gap-2 border-slate-100 md:border-l md:border-slate-200 md:pl-6 dark:md:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-brand-green" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{returnedMatches.length}</span> item
                {returnedMatches.length === 1 ? "" : "s"} reunited
              </p>
            </div>
            {badgeInfo.next ? (
              <p className="text-xs text-slate-400">
                {badgeInfo.needed - points} points to {badgeInfo.next}
              </p>
            ) : (
              <p className="text-xs text-amber-500">Gold tier reached 🎉</p>
            )}
          </div>

          {/* Badges column */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Earned badges</p>
            <div className="flex flex-wrap gap-3">
              {EARNED_BADGES.map((b) => (
                <div key={b.key} className="flex flex-col items-center gap-1.5" title={b.label}>
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border-2 transition",
                      b.earned
                        ? "border-brand-orange/30 bg-orange-50 text-brand-orange dark:bg-orange-500/10"
                        : "border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-600"
                    )}
                  >
                    <b.icon className="size-5" />
                  </span>
                  <span className="max-w-14 truncate text-center text-[10px] text-slate-400">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function PulseStage({ color, label, value }: { color: "emerald" | "amber" | "indigo"; label: string; value: number }) {
  const dot = { emerald: "bg-emerald-400", amber: "bg-amber-400", indigo: "bg-indigo-400" }[color];
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur">
      <span className={cn("size-2 shrink-0 animate-pulse rounded-full", dot)} />
      <span className="text-xs font-medium text-slate-200">{label}</span>
      <span className="ml-auto text-xs font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
  detail,
  tint,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  detail: string;
  tint: "sky" | "amber" | "emerald";
}) {
  const styles = {
    sky: "from-white to-sky-50/80 text-sky-800 dark:from-slate-900 dark:to-slate-800 dark:text-sky-200",
    amber: "from-white to-amber-50/80 text-amber-800 dark:from-slate-900 dark:to-slate-800 dark:text-amber-200",
    emerald: "from-white to-emerald-50/80 text-emerald-800 dark:from-slate-900 dark:to-slate-800 dark:text-emerald-200",
  }[tint];
  const iconStyles = {
    sky: "bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200",
  }[tint];

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 shadow-sm dark:border-slate-700/80", styles)}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconStyles)}>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
        <p className="mt-1 text-xs font-semibold">{label}</p>
      </div>
      <p className="ml-auto text-right text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function MatchSpotlightCard({
  match,
  label,
  fallbackLabel,
}: {
  match?: MatchRecord;
  label: string;
  fallbackLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</h2>
      {!match ? (
        <EmptyState
          icon={Sparkles}
          title={fallbackLabel || "Nothing yet"}
          description="Possible matches appear here when Findora finds a likely report."
        />
      ) : (
        <div>
          <div className="flex gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10">
              <Sparkles className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{match.lostItem?.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {match.score}% match score
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="size-3" /> Found near {match.foundItem?.location}
              </p>
            </div>
            <span className={cn(
              "ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
              match.status === "suggested" && "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200",
              match.status === "confirmed" && "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200",
              match.status === "returned" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              match.status === "rejected" && "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
            )}>
              {match.status}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/matches"
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:border-brand-indigo/40 hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300"
            >
              View details
            </Link>
            {(match.status === "suggested" || match.status === "confirmed") && (
              <Link
                href={`/chat/${match._id}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-indigo px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-indigo-dark"
              >
                <MessageCircle className="size-3.5" /> Start chat
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}