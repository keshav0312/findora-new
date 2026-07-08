"use client";

import Link from "next/link";
import {
  FileText,
  Sparkles,
  Bell,
  MessagesSquare,
  CheckCircle2,
  MapPin,
  Wallet,
  Smartphone,
  KeyRound,
  Backpack,
  Cat,
  Watch,
  ShieldCheck,
  Users,
  Building2,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { MapPreview } from "@/components/map-preview";
import { ThemeToggle } from "@/components/theme-toggle";

const STEPS = [
  { icon: FileText, title: "Report", desc: "Post what you lost or found in under a minute.", color: "indigo" },
  { icon: Sparkles, title: "AI Matching", desc: "Findora + Groq compare category, location, date & photos.", color: "blue" },
  { icon: Bell, title: "Get Notified", desc: "Both sides are alerted instantly — in-app and by email.", color: "green" },
  { icon: MessagesSquare, title: "Connect", desc: "Chat safely in real time, verify ownership, agree on a spot.", color: "orange" },
  { icon: CheckCircle2, title: "Return", desc: "Mark it resolved, track the journey, and earn trust points.", color: "red" },
];

const STEP_COLORS: Record<string, string> = {
  indigo: "bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10",
  blue: "bg-blue-50 text-brand-blue dark:bg-blue-500/10",
  green: "bg-emerald-50 text-brand-green dark:bg-emerald-500/10",
  orange: "bg-orange-50 text-brand-orange dark:bg-orange-500/10",
  red: "bg-red-50 text-brand-red dark:bg-red-500/10",
};

const CATEGORY_ICONS = [
  { icon: Wallet, label: "Wallets" },
  { icon: Smartphone, label: "Phones" },
  { icon: KeyRound, label: "Keys" },
  { icon: Backpack, label: "Bags" },
  { icon: Cat, label: "Pets" },
  { icon: Watch, label: "Watches" },
];

const AUDIENCES = [
  { icon: Users, title: "Individuals", desc: "Students, travelers, families, commuters." },
  { icon: Building2, title: "Businesses", desc: "Malls, restaurants, hotels, airports, stations." },
  { icon: ShieldCheck, title: "Authorities", desc: "Police stations, municipal offices, campuses." },
];

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a href="#how-it-works" className="transition hover:text-brand-indigo">How it works</a>
          <a href="#categories" className="transition hover:text-brand-indigo">What we cover</a>
          <a href="#trust" className="transition hover:text-brand-indigo">Trust & safety</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm font-semibold text-slate-700 transition hover:text-brand-indigo dark:text-slate-200 sm:block">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:-translate-y-0.5 hover:bg-brand-indigo-dark hover:shadow-md"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 size-96 animate-blob rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute -right-24 top-20 size-96 animate-blob rounded-full bg-blue-200/40 blur-3xl [animation-delay:2s] dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-80 animate-blob rounded-full bg-emerald-200/30 blur-3xl [animation-delay:4s] dark:bg-emerald-500/10" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-10 md:grid-cols-2 md:pt-16">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-brand-indigo dark:bg-indigo-500/10">
              <Sparkles className="size-3.5 animate-pulse" /> Community-powered &amp; AI-matched
            </span>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Lost Something?
              <br />
              <span className="bg-gradient-to-r from-brand-indigo to-brand-blue bg-clip-text text-transparent">Findora</span> Helps You Find It.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate-600 dark:text-slate-400">
              Skip the WhatsApp groups and Facebook posts. Report your lost or found item once,
              and Findora automatically connects likely matches by location, date and category —
              then tracks the whole journey like a delivery, from report to reunion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/report/lost"
                className="rounded-full bg-brand-indigo px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-indigo/30 transition hover:-translate-y-0.5 hover:bg-brand-indigo-dark hover:shadow-lg"
              >
                Report Lost Item
              </Link>
              <Link
                href="/report/found"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Report Found Item
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div>
                <p className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">2,543+</p>
                <p>Community members</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">1,132</p>
                <p>Items reunited</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">92%</p>
                <p>AI match accuracy</p>
              </div>
            </div>
          </div>
          <div className="relative animate-in fade-in slide-in-from-right-4 duration-700">
            <MapPreview className="aspect-[4/5] w-full" dense />
            <div className="absolute -bottom-6 left-6 right-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-brand-green dark:bg-emerald-500/10">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">92% Likely Match</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Black Wallet · DB Mall · 2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
            How Findora Works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500 dark:text-slate-400">
            Five steps, tracked end-to-end like a delivery — you always know exactly where things stand.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="animate-in fade-in slide-in-from-bottom-3 group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
              >
                <span className={`flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${STEP_COLORS[s.color]}`}>
                  <s.icon className="size-5" />
                </span>
                <p className="mt-4 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-10 hidden text-slate-300 lg:block dark:text-slate-700">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
                What people find and lose
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                Wallets, phones, keys, pets, documents and more — plus custom categories for
                anything else.
              </p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {CATEGORY_ICONS.map((c, i) => (
              <div
                key={c.label}
                className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white py-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo transition-transform duration-300 hover:rotate-6 dark:bg-indigo-500/10">
                  <c.icon className="size-5" />
                </span>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Audiences */}
      <section id="trust" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
            Built for the whole community
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <div
                key={a.title}
                className="animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10">
                  <a.icon className="size-5" />
                </span>
                <p className="mt-4 font-heading text-base font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            <Trophy className="size-5 shrink-0 text-amber-500" />
            Every return earns trust points and climbs the community leaderboard — the more you help, the more you're recognized.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-brand-ink px-8 py-14 text-center">
          <div className="pointer-events-none absolute -left-10 -top-10 size-64 animate-blob rounded-full bg-brand-indigo/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 size-64 animate-blob rounded-full bg-brand-blue/20 blur-3xl [animation-delay:3s]" />
          <MapPin className="relative mx-auto size-8 text-brand-indigo" />
          <h2 className="relative mt-4 font-heading text-2xl font-bold text-white md:text-3xl">
            Where lost things find their way home.
          </h2>
          <p className="relative mt-3 text-sm text-slate-400">
            Join the community and report your first item in under a minute.
          </p>
          <Link
            href="/register"
            className="relative mt-7 inline-block rounded-full bg-brand-indigo px-7 py-3 text-sm font-semibold text-white shadow-md shadow-brand-indigo/40 transition hover:-translate-y-0.5 hover:bg-brand-indigo-dark hover:shadow-lg"
          >
            Create your free account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 dark:border-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-400 sm:flex-row">
          <Logo className="scale-90" />
          <p>© {new Date().getFullYear()} Findora. Helping communities reunite with what matters.</p>
        </div>
      </footer>
    </div>
  );
}
