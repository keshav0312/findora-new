"use client";

import Link from "next/link";
import { PackageX, PackageCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ReportChoicePage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl py-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-slate-900">What would you like to report?</h1>
        <p className="mt-2 text-sm text-slate-500">Choose an option to get started — it takes less than a minute.</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href="/report/lost"
            className="group rounded-2xl border border-slate-200 bg-white p-8 text-left transition hover:-translate-y-1 hover:border-brand-red/40 hover:shadow-md"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red">
              <PackageX className="size-6" />
            </span>
            <p className="mt-4 font-heading text-lg font-semibold text-slate-900">I Lost Something</p>
            <p className="mt-1 text-sm text-slate-500">
              Tell us what you lost and where — we'll match it against found reports.
            </p>
          </Link>

          <Link
            href="/report/found"
            className="group rounded-2xl border border-slate-200 bg-white p-8 text-left transition hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-md"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-brand-green">
              <PackageCheck className="size-6" />
            </span>
            <p className="mt-4 font-heading text-lg font-semibold text-slate-900">I Found Something</p>
            <p className="mt-1 text-sm text-slate-500">
              Help reunite it with its owner by reporting what you found.
            </p>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
