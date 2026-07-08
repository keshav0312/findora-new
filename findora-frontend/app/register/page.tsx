"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, MapPinned, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.city);
      router.push("/dashboard");
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
          Join thousands of people reuniting with their belongings
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">Create your free Findora account</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <Field icon={User} label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Arjun Sharma"
              className="input"
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="input"
            />
          </Field>
          <Field icon={MapPinned} label="City (optional)">
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Bhopal"
              className="input"
            />
          </Field>
          <Field icon={Lock} label="Password">
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="input"
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red">{error}</p>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-indigo py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-indigo hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-3 size-4 text-slate-400" />
        {children}
      </span>
    </label>
  );
}
