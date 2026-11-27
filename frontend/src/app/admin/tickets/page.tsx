"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, RefreshCw, Search, SearchX, Ticket as TicketIcon, X } from "lucide-react";
import api from "@/lib/api";
import { Alert, Card, EmptyState, PageHeader, Pagination, TableSkeleton, btnSecondary, inputClass } from "@/components/ui";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, allowedStatuses, priorityStyles, statusStyles } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, ticketRef } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import type { Pagination as PaginationData, Ticket, TicketPriority, TicketStatus } from "@/types";

const EMPTY: PaginationData = { total: 0, page: 1, limit: 10, totalPages: 0 };
const pillSelect = "cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset outline-none focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50";

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim());
  const latest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/tickets", {
        params: { page, limit: 10, order, ...(debouncedSearch && { search: debouncedSearch }), ...(status && { status }), ...(priority && { priority }) },
      });
      if (requestId !== latest.current) return;
      setTickets(res.data.data ?? []);
      setPagination(res.data.pagination);
    } catch (err) {
      if (requestId === latest.current) setError(getErrorMessage(err, "We couldn't load the tickets."));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [page, order, debouncedSearch, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(search || status || priority);
  const resetFilters = () => { setSearch(""); setStatus(""); setPriority(""); setPage(1); };

  const patchTicket = async (ticket: Ticket, kind: "status" | "priority", value: TicketStatus | TicketPriority) => {
    setUpdatingId(ticket._id);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/admin/tickets/${ticket._id}/${kind}`, { [kind]: value });
      // keep populated fields (createdBy, assignedTo): merge only what changed
      setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, [kind]: res.data.data[kind], updatedAt: res.data.data.updatedAt } : t)));
      setSuccess(`${ticketRef(ticket._id)} ${kind} updated.`);
    } catch (err) {
      setError(getErrorMessage(err, `We couldn't update the ${kind}.`));
      void load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Every ticket from every user. Change status and priority inline, or open a ticket to reply."
        actions={<button onClick={() => void load()} disabled={loading} className={btnSecondary}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>}
      />

      <div className="mb-4 space-y-3">
        {success && <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>}
        {error && <Alert onClose={() => setError("")} action={{ label: "Retry", onClick: () => void load() }}>{error}</Alert>}
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
            <EmptyState icon={SearchX} title="No tickets match these filters" action={<button onClick={resetFilters} className={btnSecondary}><X size={16} /> Clear filters</button>} />
          ) : (
            <EmptyState icon={TicketIcon} title="No tickets yet" description="Tickets raised by users will show up here." />
          )
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Raised by</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Assigned to</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const busy = updatingId === t._id;
                  const creator = typeof t.createdBy === "object" ? t.createdBy : null;
                  const assignee = t.assignedTo && typeof t.assignedTo === "object" ? t.assignedTo.name : null;
                  return (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="max-w-[240px] px-5 py-3.5">
                        <Link href={`/admin/tickets/${t._id}`} className="block truncate font-medium text-slate-900 hover:text-teal-700">{t.title}</Link>
                        <span className="text-xs text-slate-400">{ticketRef(t._id)}{t.commentCount ? ` · ${t.commentCount} comments` : ""}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{creator?.name ?? "User"}</p>
                        {creator && <p className="text-xs text-slate-400">{creator.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{t.category}</td>
                      <td className="px-5 py-3.5">
                        <select value={t.status} disabled={busy} onChange={(e) => void patchTicket(t, "status", e.target.value as TicketStatus)} aria-label={`Status of ${t.title}`} className={`${pillSelect} ${statusStyles[t.status]}`}>
                          {allowedStatuses(t.status).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <select value={t.priority} disabled={busy} onChange={(e) => void patchTicket(t, "priority", e.target.value as TicketPriority)} aria-label={`Priority of ${t.title}`} className={`${pillSelect} ${priorityStyles[t.priority]}`}>
                          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{assignee ?? <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(t.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => router.push(`/admin/tickets/${t._id}`)} title="Open ticket" aria-label={`Open ${t.title}`} className="rounded-md p-2 text-teal-700 hover:bg-teal-50"><Eye size={17} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onChange={(p) => p >= 1 && p <= pagination.totalPages && setPage(p)} noun="tickets" />
      </Card>
    </>
  );
}
