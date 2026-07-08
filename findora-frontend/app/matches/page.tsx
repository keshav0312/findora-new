"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, MessageCircle, CheckCircle2, XCircle, Bot } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState, Avatar } from "@/components/ui-bits";
import { TrackingStepper, DEFAULT_TRACKING_STEPS } from "@/components/tracking-stepper";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { MatchRecord } from "@/lib/types";
import { resolveImage, formatDate } from "@/lib/format";
import Image from "next/image";

function activeIndexFor(status: MatchRecord["status"]) {
  switch (status) {
    case "suggested":
      return 3; // reported, matched, notified done — waiting to connect
    case "confirmed":
      return 4; // connected done — waiting for return
    case "returned":
      return 5; // all steps complete
    case "rejected":
      return 3;
    default:
      return 2;
  }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = () => api.get<{ data: MatchRecord[] }>("/matches").then((r) => setMatches(r.data)).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const respond = async (id: string, status: "confirmed" | "rejected" | "returned") => {
    try {
      await api.patch(`/matches/${id}`, { status });
      toast({
        kind: "success",
        title: status === "returned" ? "Marked as returned 🎉" : status === "confirmed" ? "Match confirmed" : "Match dismissed",
        description: status === "returned" ? "Trust points awarded to both parties." : undefined,
      });
      load();
    } catch (err) {
      toast({ kind: "error", title: "Could not update match", description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <DashboardShell>
      <h1 className="mb-1 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Possible Matches</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Ranked by AI similarity score across category, location, description, date and photos.
      </p>

      {!loading && matches.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No matches yet"
          description="As soon as a lost and found report line up, they'll appear here."
        />
      )}

      <div className="space-y-5">
        {matches.map((m, idx) => (
          <div
            key={m._id}
            className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10">
                  <Sparkles className="size-4.5" />
                </span>
                <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {m.lostItem?.title} ↔ {m.foundItem?.title}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-brand-green dark:bg-emerald-500/10">
                {m.score}% Match
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MatchItemPreview label="Lost report" report={m.lostItem} owner={m.lostOwner} />
              <MatchItemPreview label="Found report" report={m.foundItem} owner={m.foundOwner} />
            </div>

            {m.aiExplanation && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50/60 p-3 text-xs text-slate-600 dark:bg-indigo-500/5 dark:text-slate-300">
                <Bot className="mt-0.5 size-3.5 shrink-0 text-brand-indigo" />
                <p>
                  <span className="font-semibold text-brand-indigo">AI insight:</span> {m.aiExplanation}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px] text-slate-400">
              <ScoreBar label="Category" value={m.breakdown.category} max={25} />
              <ScoreBar label="Location" value={m.breakdown.location} max={35} />
              <ScoreBar label="Description" value={m.breakdown.description} max={20} />
              <ScoreBar label="Date" value={m.breakdown.date} max={10} />
              <ScoreBar label="Photo" value={m.breakdown.image} max={10} />
            </div>

            {m.status !== "rejected" && (
              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <TrackingStepper
                  steps={DEFAULT_TRACKING_STEPS.map((s, i) => ({
                    ...s,
                    date: i === 0 ? formatDate(m.createdAt) : i === activeIndexFor(m.status) - 1 && m.updatedAt ? formatDate(m.updatedAt) : null,
                  }))}
                  activeIndex={activeIndexFor(m.status)}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium capitalize text-slate-400">Status: {m.status}</span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/chat/${m._id}`}
                  className="flex items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-indigo-dark hover:shadow-md"
                >
                  <MessageCircle className="size-3.5" /> Chat
                </Link>
                {m.status === "suggested" && (
                  <>
                    <button
                      onClick={() => respond(m._id, "confirmed")}
                      className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-brand-green transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="size-3.5" /> Confirm
                    </button>
                    <button
                      onClick={() => respond(m._id, "rejected")}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <XCircle className="size-3.5" /> Not a match
                    </button>
                  </>
                )}
                {m.status === "confirmed" && (
                  <button
                    onClick={() => respond(m._id, "returned")}
                    className="flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 hover:shadow-md"
                  >
                    <CheckCircle2 className="size-3.5" /> Mark returned
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

function MatchItemPreview({ label, report, owner }: { label: string; report: any; owner: any }) {
  const photo = resolveImage(report?.photos?.[0]);
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {photo && <Image src={photo} alt="" width={48} height={48} unoptimized className="size-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{report?.title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <Avatar name={owner?.name} src={owner?.avatar} size={6} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{owner?.name}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-indigo transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1">{label}</p>
    </div>
  );
}
