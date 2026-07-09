"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./ui-bits";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useUserSocket, useAdminLiveFeed } from "@/lib/socket";
import { cn } from "@/lib/utils";

export function AdminShell({
  children,
  variant = "admin",
}: {
  children: ReactNode;
  variant?: "admin" | "police";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useUserSocket();
  const { pulse } = useAdminLiveFeed();

  const nav =
    variant === "admin"
      ? [
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/users", label: "Users Management", icon: Users },
          { href: "/admin", label: "Reports", icon: FileText },
          { href: "/admin", label: "Analytics", icon: BarChart3 },
        ]
      : [
          { href: "/police", label: "Recovered Items", icon: ShieldCheck },
          { href: "/police", label: "Citizens", icon: Users },
          { href: "/police", label: "Reports", icon: FileText },
        ];

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (variant === "admin" && user.role !== "admin") router.replace("/dashboard");
      else if (variant === "police" && !["admin", "police"].includes(user.role)) router.replace("/dashboard");
    }
  }, [loading, user, router, variant]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
          <Logo />
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline-block">
            {variant === "admin" ? "Admin Panel" : "Police Portal"}
          </span>
          <span
            className={cn(
              "ml-1 hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition sm:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
              pulse && "scale-105"
            )}
          >
            <span className={cn("size-1.5 rounded-full bg-emerald-500", pulse ? "animate-ping" : "animate-pulse")} />
            Live
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
            >
              <ArrowLeft className="size-4" /> Main app
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-transparent py-1 pl-1 pr-2 transition hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Avatar name={user.name} src={user.avatar} size={8} />
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">{user.name}</span>
                  <span className="block text-[11px] capitalize leading-tight text-slate-400">{user.role}</span>
                </span>
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
              </button>

              {menuOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 sm:hidden"
                  >
                    <ArrowLeft className="size-4 text-slate-400" /> Back to main app
                  </Link>
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

        <nav className="scrollbar-thin hidden gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 dark:border-slate-800/60 lg:flex lg:px-8">
          {nav.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label + i}
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

      <main className="px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}