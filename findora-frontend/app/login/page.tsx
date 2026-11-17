"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "police") router.push("/police");
      else router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <ThemeToggle className="fixed right-4 top-4 z-20" />

      {/* Decorative background: gradient blobs + concentric rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-brand-indigo/25 blur-3xl dark:bg-brand-indigo/20" />
        <div className="absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/10" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-indigo/10" />
          <div className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-indigo/10" />
          <div className="absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-indigo/[0.06]" />
          <div className="absolute left-1/2 top-1/2 size-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-indigo/[0.04]" />
          {/* slow-spinning dashed ring for subtle motion */}
          <div className="absolute left-1/2 top-1/2 size-[37rem] -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite] rounded-full border-2 border-dashed border-brand-indigo/10" />
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* gradient glow ring behind the card */}
        <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-br from-brand-indigo/50 via-transparent to-blue-400/50 opacity-70 blur" />

        <div className="relative rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
          {/* Icon badge with pulsing rings */}
          <div className="flex justify-center">
            <div className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-brand-indigo/10" />
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-indigo/10 [animation-duration:2.5s]" />
              <span className="absolute -inset-2 rounded-full ring-1 ring-brand-indigo/15" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-indigo-dark text-white shadow-lg shadow-brand-indigo/40">
                <ShieldCheck className="size-7" />
              </span>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <Logo />
          </div>

          <h1 className="mt-4 text-center font-heading text-2xl font-bold">
            <span className="bg-gradient-to-r from-brand-indigo to-blue-500 bg-clip-text text-transparent">
              Welcome back
            </span>
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
            Log in to continue to Findora
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</span>
              <span className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3 size-4 text-slate-400" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input"
                />
              </span>
            </label>
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Password</span>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-indigo hover:underline">
                  Forgot password?
                </Link>
              </div>
              <span className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3 size-4 text-slate-400" />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  className="input"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-500/10">{error}</p>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo to-brand-indigo-dark py-3 text-sm font-semibold text-white shadow-lg shadow-brand-indigo/30 transition hover:scale-[1.01] hover:shadow-brand-indigo/50 active:scale-[0.99] disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Log in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            New to Findora?{" "}
            <Link href="/register" className="font-semibold text-brand-indigo hover:underline">
              Create an account
            </Link>
          </p>

          {/* <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Staff access</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div> */}

          {/* <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-2 rounded-full border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300"
            >
              <ShieldCheck className="size-3.5" />
              Admin login
            </Link>
            <Link
              href="/police/login"
              className="flex items-center justify-center gap-2 rounded-full border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300"
            >
              <ShieldCheck className="size-3.5" />
              Police login
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
