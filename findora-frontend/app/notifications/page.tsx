"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Sparkles, MessageCircle, CheckCircle2, MapPinned, Info } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { AppNotification } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const ICONS: Record<string, any> = {
  match: Sparkles,
  message: MessageCircle,
  claim: Info,
  returned: CheckCircle2,
  nearby: MapPinned,
  system: Bell,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get<{ data: AppNotification[] }>("/notifications")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    load();
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Notifications</h1>
        <button onClick={markAllRead} className="text-sm font-semibold text-brand-indigo hover:underline">
          Mark all as read
        </button>
      </div>

      {!loading && items.length === 0 && (
        <EmptyState icon={Bell} title="You're all caught up" description="New matches, messages and claims will show up here." />
      )}

      <div className="space-y-2">
        {items.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          const content = (
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                n.read ? "border-slate-100 bg-white" : "border-indigo-100 bg-indigo-50/40"
              }`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-indigo" />}
            </div>
          );
          return n.link ? (
            <Link key={n._id} href={n.link}>
              {content}
            </Link>
          ) : (
            <div key={n._id}>{content}</div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
