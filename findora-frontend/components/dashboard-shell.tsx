"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  Bell,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  Plus,
  MapPin,
  Shield,
  Trophy,
  Bookmark,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./ui-bits";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useUserSocket, useLiveNotifications } from "@/lib/socket";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/my-reports", label: "My Reports", icon: FileText },
      { href: "/matches", label: "Matches", icon: MapPin },
      { href: "/search", label: "Search / Explore", icon: Search },
      { href: "/saved", label: "Saved Items", icon: Bookmark },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

// Compact set for the mobile bottom tab bar — only the highest-traffic
// destinations fit comfortably, Flipkart-app style.
const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/search", label: "Explore", icon: Search },
  { href: "/report", label: "Report", icon: Plus, cta: true },
  { href: "/matches", label: "Matches", icon: MapPin },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [query, setQuery] = useState("");

  // Joins this user's private Socket.IO room so the server can push
  // real-time match/notification/chat events straight to this browser tab.
  useUserSocket();
  const liveNotification = useLiveNotifications();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    // Only pop a toast when someone sends a new message — other real-time
    // events (matches, claims, returns, etc.) still update the app silently.
    if (!liveNotification || liveNotification.type !== "message") return;
    setToast(liveNotification.title);
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [liveNotification]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-brand-ink px-3 py-5 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo dark />
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>

        <nav className="mt-7 flex flex-1 flex-col gap-5 overflow-y-auto px-1 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 text-sm font-medium transition-all duration-200",
                        active ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-indigo transition-all duration-200",
                          active ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <item.icon className={cn("size-4.5", active && "text-brand-indigo")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {(user.role === "admin" || user.role === "police") && (
            <Link
              href={user.role === "admin" ? "/admin" : "/police"}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Shield className="size-4.5" />
              {user.role === "admin" ? "Admin Dashboard" : "Police Dashboard"}
            </Link>
          )}
        </nav>

        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2.5 py-2 transition hover:bg-white/[0.08]"
          >
            <Avatar name={user.name} src={user.avatar} size={9} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] capitalize text-slate-400">
                {user.badge && user.badge !== "none" ? `${user.badge} badge` : "New member"} · {user.trustPoints ?? 0} pts
              </p>
            </div>
            <Settings className="size-4 shrink-0 text-slate-500" />
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
          >
            <LogOut className="size-4.5" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90 lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="relative hidden max-w-md flex-1 sm:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items, categories, locations..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            <Link
              href="/report"
              className="hidden items-center gap-1.5 rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:-translate-y-0.5 hover:bg-brand-indigo-dark hover:shadow-md sm:flex"
            >
              <Plus className="size-4" /> Report
            </Link>
            <Link
              href="/notifications"
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Bell className="size-4.5" />
            </Link>
            <Link href="/profile">
              <Avatar name={user.name} src={user.avatar} size={9} />
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar — Flipkart/e-commerce app style quick nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          if (tab.cta) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-brand-indigo text-white shadow-lg shadow-brand-indigo/40 transition active:scale-95"
              >
                <tab.icon className="size-6" />
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-medium transition-colors",
                active ? "text-brand-indigo" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <tab.icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {toast && (
        <div className="animate-in slide-in-from-bottom-4 fixed bottom-24 right-6 z-50 flex max-w-xs items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 lg:bottom-6">
          <Bell className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
