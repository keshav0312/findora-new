"use client";

import { useState } from "react";
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
  Globe,
  MessageCircle,
  Share2,
  ArrowRight,
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

const PHOTO_STEPS = [
  {
    step: "Step 1",
    title: "Report what you lost or found",
    desc: "Describe the item, drop a pin on the map for where it went missing or turned up, and add a photo.",
    icon: MapPin,
    img: "/lost_image.png",
  },
  {
    step: "Step 2",
    title: "Findora's AI finds the match",
    desc: "Every new report is instantly compared against open cases by category, location, date and photo — no manual searching.",
    icon: Sparkles,
    img: "/transport.png",
  },
  {
    step: "Step 3",
    title: "Connect & get it back",
    desc: "Chat in real time, verify a few details only the real owner would know, and arrange a safe handoff.",
    icon: CheckCircle2,
    img: "/found.png",
  },
];

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

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Businesses & campuses manage lost & found efficiently" },
  { icon: Users, text: "Finders and owners connect directly, no middleman" },
  { icon: CheckCircle2, text: "Every handoff is verified and tracked end-to-end" },
];

const FOOTER_COLUMNS = [
  {
    title: "Lost & Found",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Report an item", href: "/report" },
      { label: "Search items", href: "/search" },
      { label: "My reports", href: "/my-reports" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Organizations",
    links: [
      { label: "Admin portal", href: "/admin/login" },
      { label: "Police portal", href: "/police/login" },
      { label: "Trust & safety", href: "#trust" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "My profile", href: "/profile" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

/** Tries the user-provided /home_page.png; falls back to the animated map preview if it isn't there yet. */
function HeroImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return <MapPreview className="aspect-[4/5] w-full" dense />;
  return (
    <img
      src="/home_page.png"
      alt="Findora — reuniting people with what they lost"
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full rounded-3xl border border-slate-200 object-cover shadow-xl dark:border-slate-800"
    />
  );
}

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-900 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-brand-indigo">How it works</a>
            <a href="#categories" className="transition hover:text-brand-indigo">What we cover</a>
            <a href="#trust" className="transition hover:text-brand-indigo">Trust & safety</a>
            <Link href="/search" className="transition hover:text-brand-indigo">Search items</Link>
            <Link href="/leaderboard" className="transition hover:text-brand-indigo">Leaderboard</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="hidden sm:flex" />
            <Link
              href="/admin/login"
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-indigo/40 hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300 lg:flex"
            >
              <Building2 className="size-4" /> For Organizations
            </Link>
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
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-32 size-96 animate-blob rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute -right-24 top-20 size-96 animate-blob rounded-full bg-blue-200/40 blur-3xl [animation-delay:2s] dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-80 animate-blob rounded-full bg-emerald-200/30 blur-3xl [animation-delay:4s] dark:bg-emerald-500/10" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-10 md:grid-cols-2 md:pt-16">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-brand-indigo dark:bg-indigo-500/10">
              <Sparkles className="size-3.5 animate-pulse" />Community-powered &amp; AI-matched
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
            <HeroImage />
            <div
              className="absolute -bottom-6 left-6 right-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              style={{ animationDelay: "600ms", animationFillMode: "backwards" }}
            >
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

      {/* How it works — photo steps */}
      <section id="how-it-works" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-indigo">Simple process</p>
          <h2 className="mt-2 text-center font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
            How Findora Works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500 dark:text-slate-400">
            Three moves to get an item back — tracked end-to-end like a delivery, so you always know where things stand.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PHOTO_STEPS.map((s, i) => (
              <div
                key={s.title}
                className="animate-in fade-in slide-in-from-bottom-3 group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-brand-indigo dark:bg-indigo-500/10">
                    <s.icon className="size-3.5" /> {s.step}
                  </span>
                  <p className="mt-3 font-heading text-base font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed 5-stage tracker underneath the 3 headline photo-steps */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="animate-in fade-in slide-in-from-bottom-2 relative rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                style={{ animationDelay: `${400 + i * 80}ms`, animationFillMode: "backwards" }}
              >
                <span className={`flex size-8 items-center justify-center rounded-lg ${STEP_COLORS[s.color]}`}>
                  <s.icon className="size-4" />
                </span>
                <p className="mt-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
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

      {/* Powered by Community & Businesses */}
      <section id="trust" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div className="animate-in fade-in slide-in-from-left-3 overflow-hidden rounded-3xl border border-slate-200 shadow-md dark:border-slate-800">
              <img
                src="https://picsum.photos/seed/findora-community/800/650"
                alt="People connecting through Findora"
                className="aspect-[4/3.2] w-full object-cover"
              />
            </div>
            <div className="animate-in fade-in slide-in-from-right-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-indigo">Trust & community</p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
                Powered by Community <span className="bg-gradient-to-r from-brand-indigo to-brand-blue bg-clip-text text-transparent">& Businesses</span>
              </h2>
              <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Individuals, businesses and authorities work together on one platform to return
                lost items with speed, accuracy and trust.
              </p>
              <div className="mt-6 space-y-3">
                {TRUST_POINTS.map((t) => (
                  <div key={t.text} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-brand-indigo dark:bg-indigo-500/10">
                      <t.icon className="size-4" />
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/login"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-indigo transition hover:gap-2.5"
              >
                Set up an organization account <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-slate-900 to-brand-indigo-dark px-8 py-16 text-center">
          <div className="pointer-events-none absolute -left-10 -top-10 size-64 animate-blob rounded-full bg-brand-indigo/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 size-64 animate-blob rounded-full bg-brand-blue/30 blur-3xl [animation-delay:3s]" />
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
            <Sparkles className="size-3.5" /> Join thousands recovering their items
          </span>
          <h2 className="relative mt-5 font-heading text-3xl font-bold text-white md:text-4xl">
            Lost something?{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
              Start your search now.
            </span>
          </h2>
          <p className="relative mt-3 text-sm text-slate-300">Found something? Help return it to its owner.</p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-indigo shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Browse items
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-brand-ink dark:border-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo dark />
              <p className="mt-4 max-w-xs text-sm text-slate-400">
                A community-powered, AI-matched lost &amp; found platform connecting people with
                their belongings across cities.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a href="#" aria-label="Community forum" className="flex size-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                  <MessageCircle className="size-4" />
                </a>
                <a href="#" aria-label="Website" className="flex size-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                  <Globe className="size-4" />
                </a>
                <a href="#" aria-label="Share" className="flex size-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                  <Share2 className="size-4" />
                </a>
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="font-heading text-sm font-semibold text-white">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Findora. Helping communities reunite with what matters.</p>
            <p>Made for cities, campuses and communities everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}