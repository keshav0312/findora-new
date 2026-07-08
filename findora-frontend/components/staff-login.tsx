"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

/**
 * Dedicated staff sign-in used by the Admin Portal (/admin/login) and the
 * Police Portal (/police/login). It reuses the normal auth flow but enforces
 * the required role on the client: if the account isn't allowed for this
 * portal, the session is cleared and an error is shown instead of redirecting.
 */
export function StaffLogin({ variant }: { variant: "admin" | "police" }) {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = variant === "admin";
  const title = isAdmin ? "Admin Portal" : "Police Portal";
  const subtitle = isAdmin
    ? "Restricted access — administrators only"
    : "Restricted access — authorised police staff only";
  const destination = isAdmin ? "/admin" : "/police";
  const allowedRoles = isAdmin ? ["admin"] : ["police", "admin"];
  const demo = isAdmin
    ? "admin@findora.app / admin12345"
    : "police@findora.app / police12345";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (!allowedRoles.includes(user.role)) {
        logout();
        setError(
          isAdmin
            ? "This account doesn't have administrator access."
            : "This account doesn't have police access."
        );
        return;
      }
      router.push(destination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ink px-4 py-12">
      <ThemeToggle className="fixed right-4 top-4 z-10" />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex justify-center">
          <Logo dark />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-indigo/20 text-brand-indigo">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="font-heading text-xl font-bold text-white">{title}</h1>
        </div>
        <p className="mt-1 text-center text-sm text-slate-400">{subtitle}</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-300">Email</span>
            <span className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-3 size-4 text-slate-500" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={isAdmin ? "admin@findora.app" : "police@findora.app"}
                className="w-full rounded-lg border border-white/10 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-indigo"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-300">Password</span>
            <span className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 size-4 text-slate-500" />
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                className="w-full rounded-lg border border-white/10 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-indigo"
              />
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-indigo py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sign in to {title}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-800/60 p-3 text-center text-xs text-slate-400">
          Demo login (after running{" "}
          <code className="rounded bg-slate-700 px-1">npm run seed</code>):
          <br />
          {demo}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link
            href={isAdmin ? "/police/login" : "/admin/login"}
            className="font-medium text-brand-indigo hover:underline"
          >
            {isAdmin ? "Police login" : "Admin login"}
          </Link>
          <span className="text-slate-600">•</span>
          <Link
            href="/login"
            className="flex items-center gap-1 font-medium text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="size-3.5" />
            User login
          </Link>
        </div>
      </div>
    </div>
  );
}
