"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert, Card, EmptyState, PageHeader, Pagination, Spinner, TableSkeleton, btnSecondary, inputClass } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import type { Pagination as PaginationData, User } from "@/types";

const EMPTY: PaginationData = { total: 0, page: 1, limit: 10, totalPages: 0 };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim());
  const latest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users", { params: { page, limit: 10, ...(debouncedSearch && { search: debouncedSearch }), ...(role && { role }) } });
      if (requestId !== latest.current) return;
      setUsers(res.data.data ?? []);
      setPagination(res.data.pagination);
    } catch (err) {
      if (requestId === latest.current) { setError(getErrorMessage(err, "We couldn't load the users.")); setUsers([]); }
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [page, debouncedSearch, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (u: User) => {
    const next = !(u.isActive ?? true);
    if (!next && !window.confirm(`Deactivate ${u.name}? They'll be signed out and won't be able to sign in.`)) return;
    setTogglingId(u._id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/admin/users/${u._id}/status`, { isActive: next });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: next } : x)));
      setSuccess(`${u.name} was ${next ? "reactivated" : "deactivated"}.`);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't update that account."));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        description={`${pagination.total} registered ${pagination.total === 1 ? "account" : "accounts"}. Deactivate an account to block sign-in.`}
        actions={<button onClick={() => void load()} disabled={loading} className={btnSecondary}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>}
      />

      <div className="mb-4 space-y-3">
        {success && <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>}
        {error && <Alert onClose={() => setError("")} action={{ label: "Retry", onClick: () => void load() }}>{error}</Alert>}
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_12rem]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email" aria-label="Search users" maxLength={100} className={`${inputClass} pl-10`} />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role" className={inputClass}>
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {loading && users.length === 0 ? (
          <TableSkeleton />
        ) : users.length === 0 && !error ? (
          <EmptyState icon={Users} title="No users found" description="Try a different search or role filter." />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const active = u.isActive ?? true;
                  const isMe = u._id === me?._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-800">{u.name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{u.name}{isMe && <span className="ml-2 text-xs font-normal text-slate-400">you</span>}</p>
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${u.role === "admin" ? "bg-teal-50 text-teal-800 ring-teal-600/20" : "bg-slate-100 text-slate-700 ring-slate-500/20"}`}>
                          {u.role === "admin" && <ShieldCheck size={12} />}{u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><span className={`text-xs font-medium ${active ? "text-emerald-700" : "text-red-700"}`}>{active ? "Active" : "Deactivated"}</span></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {!isMe && (
                          <button onClick={() => void toggleActive(u)} disabled={togglingId === u._id} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                            {togglingId === u._id ? <Spinner /> : active ? <UserX size={15} /> : <UserCheck size={15} />}
                            {active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onChange={(p) => p >= 1 && p <= pagination.totalPages && setPage(p)} noun="users" />
      </Card>
    </>
  );
}
