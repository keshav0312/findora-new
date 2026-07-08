"use client";

import { useEffect, useState } from "react";
import { ShieldOff, ShieldCheck, UserPlus, Loader2, X } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Avatar, StatusPill } from "@/components/ui-bits";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { User } from "@/lib/types";

const EMPTY_FORM = { name: "", email: "", password: "", role: "police" as "admin" | "police" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () =>
    api
      .get<{ data: User[] }>("/admin/users")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const toggleRestrict = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/ban`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update user.");
    }
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ message: string }>("/admin/users", form);
      setNotice(res.message || "Staff account created");
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell variant="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Users Management</h1>
        <button
          onClick={() => {
            setShowForm((s) => !s);
            setFormError(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark"
        >
          {showForm ? <X className="size-4" /> : <UserPlus className="size-4" />}
          {showForm ? "Close" : "New staff account"}
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createStaff}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="mb-4 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
            Create an admin or police account
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ward 12 Police Desk"
                className="input-plain"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@findora.app"
                className="input-plain"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Temporary password
              </span>
              <input
                required
                type="text"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                className="input-plain"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Role</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "police" })}
                className="input-plain"
              >
                <option value="police">Police</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          {formError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-500/10">{formError}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ ...EMPTY_FORM });
                setFormError(null);
              }}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-indigo px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 transition hover:bg-brand-indigo-dark disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create account
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Trust points</th>
              <th className="p-4">Verified</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                <td className="flex items-center gap-3 p-4">
                  <Avatar name={u.name} src={u.avatar} size={8} />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </td>
                <td className="p-4"><StatusPill status={u.role} /></td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{u.trustPoints}</td>
                <td className="p-4">
                  {u.isVerified ? (
                    <span className="text-brand-green text-xs font-medium">Verified</span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Unverified</span>
                  )}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleRestrict(u.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      u.isVerified
                        ? "bg-red-50 text-brand-red hover:bg-red-100 dark:bg-red-500/10"
                        : "bg-emerald-50 text-brand-green hover:bg-emerald-100 dark:bg-emerald-500/10"
                    }`}
                  >
                    {u.isVerified ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                    {u.isVerified ? "Restrict" : "Restore"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
