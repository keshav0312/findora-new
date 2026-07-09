"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
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
  ChevronDown,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./ui-bits";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useUserSocket, useLiveNotifications } from "@/lib/socket";

// Primary horizontal nav row — kept short on purpose (5 items) so it reads
// as a clean navbar rather than a crammed one. Profile/Settings/Logout live
// in the avatar dropdown instead of taking a nav slot each.
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-reports", label: "My Reports", icon: FileText },
  { href: "/matches", label: "Matches", icon: MapPin },
  { href: "/saved", label: "Saved Items", icon: Bookmark },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

// Compact set for the mobile bottom tab bar — Flipkart-app style.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Joins this user's private Socket.IO room so the server can push
  // real-time match/notification/chat events straight to this browser tab.
  useUserSocket();
  const liveNotification = useLiveNotifications();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!liveNotification || liveNotification.type !== "message") return;
    setToast(liveNotification.title);
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [liveNotification]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90">
        {/* Row 1 — brand, search, actions */}
        <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
          <Logo />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="relative ml-4 hidden max-w-md flex-1 sm:block"
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

            {/* Avatar dropdown — Profile / Settings / Admin / Logout */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-transparent py-1 pl-1 pr-2 transition hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Avatar name={user.name} src={user.avatar} size={8} />
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
              </button>

              {menuOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <DropdownLink href="/profile" icon={UserIcon} label="My Profile" />
                  <DropdownLink href="/settings" icon={Settings} label="Settings" />
                  {(user.role === "admin" || user.role === "police") && (
                    <DropdownLink
                      href={user.role === "admin" ? "/admin" : "/police"}
                      icon={Shield}
                      label={user.role === "admin" ? "Admin Dashboard" : "Police Dashboard"}
                    />
                  )}
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="size-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 — primary nav links */}
        <nav className="scrollbar-thin hidden gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 dark:border-slate-800/60 lg:flex lg:px-8">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-brand-indigo text-white shadow-sm shadow-brand-indigo/25"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>

      {/* Mobile bottom tab bar */}
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

function DropdownLink({ href, icon: Icon, label }: { href: string; icon: typeof UserIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon className="size-4 text-slate-400" /> {label}
    </Link>
  );
}