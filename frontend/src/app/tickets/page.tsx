"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, Search, SearchX, Ticket as TicketIcon, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { Alert, Card, EmptyState, PageHeader, Pagination, PriorityBadge, Spinner, StatusBadge, TableSkeleton, btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, ticketRef } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import type { Pagination as PaginationData, Ticket } from "@/types";

const EMPTY_PAGINATION: PaginationData = { total: 0, page: 1, limit: 10, totalPages: 0 };

export default function TicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim());
  const latest = useRef(0); // ignore responses from outdated requests

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/tickets", {
        params: { page, limit: 10, order, ...(debouncedSearch && { search: debouncedSearch }), ...(status && { status }), ...(priority && { priority }) },
      });
      if (requestId !== latest.current) return;
      setTickets(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      if (requestId === latest.current) setError(getErrorMessage(err, "We couldn't load your tickets."));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [page, order, debouncedSearch, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(search || status || priority);
  const resetFilters = () => { setSearch(""); setStatus(""); setPriority(""); setPage(1); };

  const handleDelete = async (ticket: Ticket) => {
    if (!window.confirm(`Delete "${ticket.title}"? This can't be undone.`)) return;
    setDeletingId(ticket._id);
    setError("");
    try {
      await api.delete(`/tickets/${ticket._id}`);
      setSuccess("Ticket deleted.");
      if (tickets.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't delete that ticket."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="My tickets"
        description="Track your support requests and follow the replies."
        actions={<Link href="/tickets/create" className={btnPrimary}><Plus size={17} /> New ticket</Link>}
      />

      <div className="mb-4 space-y-3">
        {success && <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>}
        {error && <Alert action={{ label: "Retry", onClick: () => void load() }}>{error}</Alert>}
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} maxLength={100} placeholder="Search by title or description" aria-label="Search tickets" className={`${inputClass} pl-10`} />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className={inputClass}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} aria-label="Filter by priority" className={inputClass}>
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={order} onChange={(e) => { setOrder(e.target.value as "asc" | "desc"); setPage(1); }} aria-label="Sort order" className={inputClass}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {loading && tickets.length === 0 ? (
          <TableSkeleton />
        ) : tickets.length === 0 && !error ? (
          hasFilters ? (
            <EmptyState icon={SearchX} title="No tickets match your filters" description="Try a different search term or clear the filters." action={<button onClick={resetFilters} className={btnSecondary}><X size={16} /> Clear filters</button>} />
          ) : (
            <EmptyState icon={TicketIcon} title="You haven't raised any tickets" description="Describe your problem and the support team will take it from there." action={<Link href="/tickets/create" className={btnPrimary}>Create a ticket</Link>} />
          )
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="max-w-xs px-5 py-3.5">
                      <Link href={`/tickets/${t._id}`} className="block truncate font-medium text-slate-900 hover:text-teal-700">{t.title}</Link>
                      <span className="text-xs text-slate-400">{ticketRef(t._id)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{t.category}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/tickets/${t._id}`)} title="View ticket" aria-label={`View ${t.title}`} className="rounded-md p-2 text-teal-700 hover:bg-teal-50"><Eye size={17} /></button>
                        {t.status === "open" && (
                          <button onClick={() => void handleDelete(t)} disabled={deletingId === t._id} title="Delete ticket" aria-label={`Delete ${t.title}`} className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50">
                            {deletingId === t._id ? <Spinner /> : <Trash2 size={17} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onChange={(p) => p >= 1 && p <= pagination.totalPages && setPage(p)} noun="tickets" />
      </Card>
    </>
  );
}
