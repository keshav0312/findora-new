"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "./utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (t: { kind?: ToastKind; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastKind, string> = {
  success: "text-brand-green bg-emerald-50 dark:bg-emerald-500/10",
  error: "text-brand-red bg-red-50 dark:bg-red-500/10",
  info: "text-brand-indigo bg-indigo-50 dark:bg-indigo-500/10",
};

/**
 * App-wide toast notifications — used for form success/error feedback
 * (report submitted, profile updated, login failed, etc.) as a lightweight
 * companion to the real-time Socket.IO match toast in DashboardShell.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ kind = "info", title, description }: { kind?: ToastKind; title: string; description?: string }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, kind, title, description }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-6 sm:translate-x-0">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="animate-in slide-in-from-bottom-3 fade-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", STYLES[t.kind])}>
                <Icon className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-300 transition hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
