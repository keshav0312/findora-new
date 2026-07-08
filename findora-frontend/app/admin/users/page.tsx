"use client";

import { useEffect, useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Avatar, StatusPill } from "@/components/ui-bits";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminShell variant="admin">
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">Users Management</h1>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
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
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="flex items-center gap-3 p-4">
                  <Avatar name={u.name} src={u.avatar} size={8} />
                  <div>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </td>
                <td className="p-4"><StatusPill status={u.role} /></td>
                <td className="p-4 text-slate-600">{u.trustPoints}</td>
                <td className="p-4">
                  {u.isVerified ? (
                    <span className="text-brand-green text-xs font-medium">Verified</span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Unverified</span>
                  )}
                </td>
                <td className="p-4 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleRestrict(u.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      u.isVerified
                        ? "bg-red-50 text-brand-red hover:bg-red-100"
                        : "bg-emerald-50 text-brand-green hover:bg-emerald-100"
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
