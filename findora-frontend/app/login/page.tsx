"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <ThemeToggle className="fixed right-4 top-4 z-10" />
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">Log in to continue to Findora</p>

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
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red">{error}</p>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-indigo py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Log in
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Demo logins (after running <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">npm run seed</code>):
          <br />
          arjun@example.com / password123 · admin@findora.app / admin12345
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          New to Findora?{" "}
          <Link href="/register" className="font-semibold text-brand-indigo hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
