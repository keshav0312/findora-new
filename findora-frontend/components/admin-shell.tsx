"use client";

import { ReactNode, useEffect } from "react";
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

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800/50 bg-brand-ink px-4 py-6 lg:flex">
        <Logo dark />
        <p className="mt-1 pl-1 text-xs uppercase tracking-wider text-slate-500">
          {variant === "admin" ? "Admin Panel" : "Police Portal"}
        </p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label + i}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-brand-indigo text-white shadow-sm shadow-brand-indigo/30"
                    : "text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="size-4.5" />
            Back to main app
          </Link>
        </nav>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4.5" />
          Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90 lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="hidden font-heading text-sm font-semibold text-slate-500 dark:text-slate-400 sm:block">
            {variant === "admin" ? "Admin Dashboard" : "Police Dashboard"}
          </p>
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition sm:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
              pulse && "scale-105"
            )}
          >
            <span className={cn("size-1.5 rounded-full bg-emerald-500", pulse ? "animate-ping" : "animate-pulse")} />
            Live
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Avatar name={user.name} src={user.avatar} size={9} />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
              <p className="text-xs capitalize text-slate-400">{user.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
