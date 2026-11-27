"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RefreshCw, Ticket as TicketIcon, Timer, UserX, Users } from "lucide-react";
import api from "@/lib/api";
import { Alert, Card, CardHeader, PageHeader, Skeleton, btnSecondary } from "@/components/ui";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, statusBar } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatHours } from "@/lib/format";
import type { DashboardStats } from "@/types";

const priorityBar = { low: "bg-slate-400", medium: "bg-amber-500", high: "bg-orange-500", urgent: "bg-red-500" } as const;

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-700">{label}</span><span className="font-medium tabular-nums">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${label}: ${value} of ${total}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats((await api.get("/admin/dashboard")).data.data);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load the statistics."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = stats?.totalTickets ?? 0;
  const statusCounts: Record<string, number> = stats
    ? { open: stats.openTickets, in_progress: stats.inProgressTickets, resolved: stats.resolvedTickets, closed: stats.closedTickets }
    : {};
  const resolutionRate = total > 0 && stats ? Math.round(((stats.resolvedTickets + stats.closedTickets) / total) * 100) : 0;

  const attention = [
    { icon: AlertTriangle, label: "Urgent tickets", value: stats?.urgentTickets, tone: "text-red-700 bg-red-50", href: "/admin/tickets" },
    { icon: UserX, label: "Active and unassigned", value: stats?.unassignedActiveTickets, tone: "text-amber-700 bg-amber-50", href: "/admin/tickets" },
    { icon: TicketIcon, label: "New in the last 7 days", value: stats?.createdLast7Days, tone: "text-teal-700 bg-teal-50", href: "/admin/tickets" },
    { icon: Users, label: "Registered users", value: stats?.totalUsers, tone: "text-sky-700 bg-sky-50", href: "/admin/users" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="What needs attention across all support tickets."
        actions={<button onClick={() => void load()} disabled={loading} className={btnSecondary}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>}
      />

      {error && <div className="mb-6"><Alert action={{ label: "Try again", onClick: () => void load() }}>{error}</Alert></div>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {attention.map(({ icon: Icon, label, value, tone, href }) => (
          <Link key={label} href={href} className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-teal-300">
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}><Icon size={20} /></div>
              <ArrowRight size={16} className="text-slate-300 transition group-hover:text-teal-700" />
            </div>
            {loading ? <Skeleton className="h-8 w-14" /> : <p className="text-3xl font-semibold tabular-nums">{value ?? 0}</p>}
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tickets by status" subtitle={`${total} tickets in total · ${resolutionRate}% resolved or closed`} />
          <div className="space-y-4 p-5">
            {loading ? <Skeleton className="h-32" /> : STATUS_OPTIONS.map((o) => <Bar key={o.value} label={o.label} value={statusCounts[o.value] ?? 0} total={total} color={statusBar[o.value]} />)}
          </div>
        </Card>

        <Card>
          <CardHeader icon={Timer} title="Response times" />
          <dl className="space-y-5 p-5">
            <div><dt className="text-sm text-slate-500">Average first response</dt><dd className="text-2xl font-semibold">{loading ? "…" : formatHours(stats?.avgFirstResponseHours)}</dd></div>
            <div><dt className="text-sm text-slate-500">Average time to resolve</dt><dd className="text-2xl font-semibold">{loading ? "…" : formatHours(stats?.avgResolutionHours)}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tickets by priority" />
          <div className="space-y-4 p-5">
            {loading ? <Skeleton className="h-32" /> : PRIORITY_OPTIONS.map((o) => <Bar key={o.value} label={o.label} value={stats?.byPriority?.[o.value] ?? 0} total={total} color={priorityBar[o.value]} />)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Most common categories" />
          <div className="space-y-4 p-5">
            {loading ? <Skeleton className="h-32" /> : (stats?.topCategories ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Categories will appear once tickets are submitted.</p>
            ) : (
              stats!.topCategories!.map((c) => <Bar key={c.category} label={c.category} value={c.count} total={total} color="bg-teal-600" />)
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
