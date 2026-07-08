"use client";

import { useEffect, useState } from "react";
import { Trophy, Award, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Avatar, EmptyState } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  _id: string;
  name: string;
  avatar?: string;
  city?: string;
  trustPoints: number;
  badge: "none" | "bronze" | "silver" | "gold";
}

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  silver: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  bronze: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  none: "bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500",
};

const RANK_STYLES = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/30",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-lg shadow-orange-500/30",
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: LeaderboardUser[] }>("/users/leaderboard")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const myRank = users.findIndex((u) => u._id === user?.id);

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
          <Trophy className="size-5.5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Community Leaderboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trust points earned by returning items and helping others reunite with theirs.
          </p>
        </div>
      </div>

      {!loading && users.length === 0 && (
        <EmptyState icon={Sparkles} title="No ranked members yet" description="Return an item to start earning trust points." />
      )}

      {top3.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {top3.map((u, i) => (
            <div
              key={u._id}
              className="animate-in fade-in zoom-in-95 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-full text-sm font-bold", RANK_STYLES[i])}>
                {i + 1}
              </span>
              <div className="mt-3">
                <Avatar name={u.name} src={u.avatar} size={16} />
              </div>
              <p className="mt-3 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
              <p className="text-xs text-slate-400">{u.city || "Findora community"}</p>
              <p className="mt-2 font-heading text-xl font-bold text-brand-indigo tabular-nums">{u.trustPoints}</p>
              <p className="text-[11px] text-slate-400">trust points</p>
              <span className={cn("mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", BADGE_STYLES[u.badge])}>
                {u.badge === "none" ? "New member" : `${u.badge} badge`}
              </span>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {rest.map((u, i) => (
            <div
              key={u._id}
              className={cn(
                "flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                i !== rest.length - 1 && "border-b border-slate-100 dark:border-slate-800"
              )}
            >
              <span className="w-6 text-center text-sm font-semibold text-slate-400">{i + 4}</span>
              <Avatar name={u.name} src={u.avatar} size={9} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                <p className="text-xs text-slate-400">{u.city || "Findora community"}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", BADGE_STYLES[u.badge])}>
                {u.badge}
              </span>
              <span className="w-14 text-right font-heading text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {u.trustPoints}
              </span>
            </div>
          ))}
        </div>
      )}

      {myRank >= 3 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-medium text-brand-indigo dark:bg-indigo-500/10">
          <Award className="size-4" /> You're currently ranked #{myRank + 1} — keep returning items to climb the board!
        </div>
      )}
    </DashboardShell>
  );
}
