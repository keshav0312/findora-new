"use client";

import { useEffect, useState } from "react";
import { Award, Save, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Avatar } from "@/components/ui-bits";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", city: "", phone: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm({ name: user.name, city: user.city || "", phone: user.phone || "" });
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch("/auth/me", form);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">My Profile</h1>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center lg:col-span-1">
          <div className="flex justify-center">
            <Avatar name={user?.name} src={user?.avatar} size={20} />
          </div>
          <p className="mt-3 font-heading text-base font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-50 p-3">
            <Award className="size-4.5 text-brand-orange" />
            <span className="text-xs font-medium text-slate-700">
              {user?.trustPoints ?? 0} trust points · <span className="capitalize">{user?.badge}</span>
            </span>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Full name</span>
            <input className="input-plain" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">City</span>
            <input className="input-plain" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span>
            <input className="input-plain" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red">{error}</p>}
          {saved && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-brand-green">Profile updated.</p>}

          <button
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-indigo-dark disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
