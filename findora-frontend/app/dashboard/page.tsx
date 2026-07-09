"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui-bits";
import { LiveMap, MapPin as MapPinType } from "@/components/live-map";
import { DonutChart, AreaTrendChart, GaugeChart } from "@/components/charts";
import { TrackingStepper, TrackingStep } from "@/components/tracking-stepper";
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
  const allItems = [...lost, ...found];
  const totalReports = allItems.length;

  const returnedMatches = matches.filter((m) => m.status === "returned");
  const activeMatches = matches.filter((m) => m.status !== "returned" && m.status !== "rejected");
  const scanPct = totalReports > 0 ? Math.round((matches.length / totalReports) * 100) : 0;

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
      const d = new Date(m.createdAt || Date.now());
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
    { key: "matched", label: "AI scanning", description: "Comparing against open reports" },
    { key: "notified", label: "Matches found", description: `${matches.length} match${matches.length === 1 ? "" : "es"}` },
    { key: "returned", label: "Returned", description: `${returnedMatches.length} closed out` },
  ];
  const journeyActiveIndex =
    totalReports === 0 ? 0 : returnedMatches.length > 0 ? 3 : matches.length > 0 ? 2 : 1;

  const topMatch = [...matches].sort((a, b) => b.score - a.score)[0];
  const secondMatch = [...matches].sort((a, b) => b.score - a.score)[1];

  const EARNED_BADGES = [
    { key: "first_report", label: "First Report", icon: FileText, earned: totalReports > 0 },
    { key: "first_match", label: "First Match", icon: Sparkles, earned: matches.length > 0 },
    { key: "bronze", label: "Bronze", icon: Award, earned: points >= BADGE_THRESHOLDS.bronze && points > 0 },
    { key: "silver", label: "Silver", icon: Medal, earned: points >= BADGE_THRESHOLDS.silver },
    { key: "gold", label: "Gold", icon: Trophy, earned: points >= BADGE_THRESHOLDS.gold },
    { key: "reunited", label: "Reunited Someone", icon: Heart, earned: returnedMatches.length > 0 },
  ];

  return (
    <DashboardShell>
      {/* Row 1 — Recovery Pulse (live AI scan) + Active near you map */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1220] via-[#0f1b33] to-[#0b1220] p-6 text-white lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-indigo/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 size-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                <Radar className="size-3.5 animate-spin [animation-duration:3s]" /> Recovery Pulse &amp; Live AI Scan
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-300">
                <span className="flex gap-0.5">
                  <span className="size-1 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
                  <span className="size-1 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                  <span className="size-1 animate-bounce rounded-full bg-emerald-400" />
                </span>
                AI is scanning your reports against the live database…
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {matches.length} matches detected
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
              <PulseStage color="amber" label="Matching phase" value={activeMatches.length} />
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

        <MatchSpotlightCard match={secondMatch} label="Global success feed" fallbackLabel="Recent activity" />
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
          description="Matches will appear here as soon as the AI finds one."
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
                {match.score}% AI match confidence
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="size-3" /> Found near {match.foundItem?.location}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/matches"
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:border-brand-indigo/40 hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300"
            >
              View details
            </Link>
            <Link
              href={`/chat/${match._id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-indigo px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-indigo-dark"
            >
              <MessageCircle className="size-3.5" /> Start chat
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}