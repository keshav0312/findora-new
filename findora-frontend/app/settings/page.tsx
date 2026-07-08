"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Lock, LogOut, Trash2, Palette, Sun, Moon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    matchAlerts: true,
    messageAlerts: true,
    nearbyAlerts: false,
    emailDigest: true,
  });

  const updatePref = (key: keyof typeof prefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    toast({ kind: "success", title: "Preference saved" });
  };

  return (
    <DashboardShell>
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Palette className="size-4.5 text-brand-indigo" /> Appearance
          </p>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose how Findora looks on this device</p>
            </div>
            <div className="flex overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition",
                  theme === "light" ? "bg-brand-indigo text-white" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Sun className="size-3.5" /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition",
                  theme === "dark" ? "bg-brand-indigo text-white" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Moon className="size-3.5" /> Dark
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Bell className="size-4.5 text-brand-indigo" /> Notification preferences
          </p>
          <div className="space-y-3">
            <Toggle
              label="Match alerts"
              description="Get notified when a possible match is found"
              checked={prefs.matchAlerts}
              onChange={(v) => updatePref("matchAlerts", v)}
            />
            <Toggle
              label="Message alerts"
              description="Get notified about new chat messages"
              checked={prefs.messageAlerts}
              onChange={(v) => updatePref("messageAlerts", v)}
            />
            <Toggle
              label="Nearby reports"
              description="Alert me about reports filed within 5km"
              checked={prefs.nearbyAlerts}
              onChange={(v) => updatePref("nearbyAlerts", v)}
            />
            <Toggle
              label="Weekly email digest"
              description="A summary of activity in your area, sent via Brevo"
              checked={prefs.emailDigest}
              onChange={(v) => updatePref("emailDigest", v)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Lock className="size-4.5 text-brand-indigo" /> Account
          </p>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <LogOut className="size-4" /> Log out
            </span>
          </button>
          <button className="mt-2 flex w-full items-center justify-between rounded-xl border border-red-100 px-4 py-3 text-sm font-medium text-brand-red transition hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
            <span className="flex items-center gap-2">
              <Trash2 className="size-4" /> Delete account
            </span>
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-brand-indigo" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
