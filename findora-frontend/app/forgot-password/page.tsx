"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email }, false);
    } finally {
      setLoading(false);
      setSent(true);
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
          Reset your password
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          We'll send a reset link to your email
        </p>

        {sent ? (
          <div className="mt-7 flex flex-col items-center rounded-2xl bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="size-8 text-brand-green" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              If an account exists for <span className="font-semibold">{email}</span>, a reset
              link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</span>
              <span className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3 size-4 text-slate-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </span>
            </label>
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-indigo py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-indigo hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
