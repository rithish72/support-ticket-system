"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Plus, Ticket as TicketIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert, Card, CardHeader, EmptyState, PageHeader, PriorityBadge, Skeleton, StatusBadge, TableSkeleton, btnPrimary } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, ticketRef } from "@/lib/format";
import type { Ticket, TicketStatus } from "@/types";

const total = async (status?: TicketStatus) => {
  const res = await api.get("/tickets", { params: { limit: 1, ...(status ? { status } : {}) } });
  return res.data.pagination.total as number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [recent, setRecent] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Counts come from the API's totals — counting the first page of tickets would cap every stat at 10.
      const [list, all, open, inProgress, resolved] = await Promise.all([
        api.get("/tickets", { params: { limit: 5 } }),
        total(),
        total("open"),
        total("in_progress"),
        total("resolved"),
      ]);
      setRecent(list.data.data);
      setCounts({ all, open, in_progress: inProgress, resolved });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = [
    { title: "All tickets", value: counts.all, icon: TicketIcon, tone: "text-teal-700 bg-teal-50" },
    { title: "Open", value: counts.open, icon: AlertCircle, tone: "text-amber-700 bg-amber-50" },
    { title: "In progress", value: counts.in_progress, icon: Clock, tone: "text-sky-700 bg-sky-50" },
    { title: "Resolved", value: counts.resolved, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Here's where your support requests stand."
        actions={<Link href="/tickets/create" className={btnPrimary}><Plus size={17} /> New ticket</Link>}
      />

      {error && <div className="mb-6"><Alert action={{ label: "Try again", onClick: () => void load() }}>{error}</Alert></div>}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, tone }) => (
          <Card key={title} className="p-5">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${tone}`}><Icon size={20} /></div>
            {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-3xl font-semibold tabular-nums">{value}</p>}
            <p className="mt-1 text-sm text-slate-500">{title}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Recent tickets" actions={<Link href="/tickets" className="text-sm font-medium text-teal-700 hover:underline">View all</Link>} />
        {loading ? (
          <TableSkeleton rows={4} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={TicketIcon}
            title="No tickets yet"
            description="When something goes wrong or you need help, raise a ticket and the support team will pick it up."
            action={<Link href="/tickets/create" className={btnPrimary}>Create your first ticket</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((t) => (
                  <tr key={t._id} onClick={() => router.push(`/tickets/${t._id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="max-w-xs px-5 py-3.5">
                      <Link href={`/tickets/${t._id}`} className="block truncate font-medium text-slate-900 hover:text-teal-700" onClick={(e) => e.stopPropagation()}>{t.title}</Link>
                      <span className="text-xs text-slate-400">{ticketRef(t._id)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{t.category}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
