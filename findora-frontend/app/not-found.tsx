import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo className="mb-8" />
      <span className="flex size-16 items-center justify-center rounded-3xl bg-indigo-50 text-brand-indigo">
        <MapPinOff className="size-8" />
      </span>
      <h1 className="mt-6 font-heading text-3xl font-bold text-slate-900">404 — Lost in transit</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        This page doesn't exist — much like the sock you've been looking for. Let's get you back on track.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-brand-indigo px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 hover:bg-brand-indigo-dark"
      >
        Back to Findora
      </Link>
    </div>
  );
}
