"use client";

import { Check, FileText, Sparkles, Bell, MessagesSquare, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackingStep {
  key: string;
  label: string;
  description?: string;
  date?: string | null;
}

const ICONS: Record<string, typeof FileText> = {
  reported: FileText,
  matched: Sparkles,
  notified: Bell,
  connected: MessagesSquare,
  returned: PackageCheck,
};

interface TrackingStepperProps {
  steps: TrackingStep[];
  /** Index of the current/active step (0-based). Steps before it are done. */
  activeIndex: number;
  className?: string;
}

/**
 * A Flipkart/e-commerce-style shipment tracker, repurposed for an item's
 * lost-&-found journey: Reported -> AI Matched -> Notified -> Connected -> Returned.
 * Completed steps get a filled green check node connected by a solid line;
 * the active step pulses; upcoming steps are greyed out.
 */
export function TrackingStepper({ steps, activeIndex, className }: TrackingStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: horizontal timeline */}
      <div className="hidden sm:flex sm:items-start">
        {steps.map((step, i) => {
          const Icon = ICONS[step.key] || FileText;
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className={cn("flex flex-1 flex-col items-center", !isLast && "relative")}>
              <div className="flex w-full items-center">
                <div className="flex-1" />
                <span
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-500",
                    isDone && "border-brand-green bg-brand-green text-white",
                    isActive &&
                      "border-brand-indigo bg-brand-indigo text-white shadow-lg shadow-brand-indigo/30 animate-pulse",
                    !isDone && !isActive && "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600"
                  )}
                >
                  {isDone ? <Check className="size-5" /> : <Icon className="size-4.5" />}
                </span>
                <div className="flex-1" />
                {!isLast && (
                  <div className="absolute left-1/2 top-5 -z-0 h-0.5 w-full -translate-y-1/2">
                    <div
                      className={cn(
                        "h-full transition-all duration-700",
                        isDone ? "bg-brand-green" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    isDone || isActive ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {step.label}
                </p>
                {step.date && <p className="mt-0.5 text-[11px] text-slate-400">{step.date}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical timeline */}
      <div className="flex flex-col sm:hidden">
        {steps.map((step, i) => {
          const Icon = ICONS[step.key] || FileText;
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    isDone && "border-brand-green bg-brand-green text-white",
                    isActive && "border-brand-indigo bg-brand-indigo text-white animate-pulse",
                    !isDone && !isActive && "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600"
                  )}
                >
                  {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                {!isLast && (
                  <div className={cn("w-0.5 flex-1 py-1", isDone ? "bg-brand-green" : "bg-slate-200 dark:bg-slate-700")} style={{ minHeight: 28 }} />
                )}
              </div>
              <div className="pb-6">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isDone || isActive ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {step.label}
                </p>
                {step.description && <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>}
                {step.date && <p className="mt-0.5 text-[11px] text-slate-400">{step.date}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Default 5-stage journey used across item detail & matches pages. */
export const DEFAULT_TRACKING_STEPS: Omit<TrackingStep, "date">[] = [
  { key: "reported", label: "Reported", description: "Report submitted to Findora" },
  { key: "matched", label: "AI Matched", description: "A likely match was found" },
  { key: "notified", label: "Notified", description: "Both parties alerted" },
  { key: "connected", label: "Connected", description: "Chat started to verify details" },
  { key: "returned", label: "Returned", description: "Item back with its owner" },
];
