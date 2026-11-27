"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, RefreshCw, Save, Tag, User as UserIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ActivityTimeline, CommentsSection } from "@/components/TicketThread";
import { Alert, Card, CardHeader, PageHeader, PageLoader, PriorityBadge, Spinner, StatusBadge, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { PRIORITY_OPTIONS, allowedStatuses } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, ticketRef } from "@/lib/format";
import type { ActivityLog, Comment, Ticket, TicketPriority, TicketStatus, User } from "@/types";

const OBJECT_ID = /^[a-f\d]{24}$/i;
type Saving = "status" | "priority" | "assign" | null;

export default function AdminTicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [status, setStatus] = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState<Saving>(null);

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    setActivitiesError("");
    try {
      setActivities((await api.get(`/tickets/${id}/activities`)).data.data ?? []);
    } catch (err) {
      setActivitiesError(getErrorMessage(err, "We couldn't load the activity history."));
    } finally {
      setLoadingActivities(false);
    }
  }, [id]);

  // The admin endpoint returns the ticket together with its comments in one request.
  const fetchTicket = useCallback(async () => {
    if (!OBJECT_ID.test(id)) {
      setError("That ticket link isn't valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = (await api.get(`/admin/tickets/${id}`)).data.data as Ticket & { comments?: Comment[] };
      setTicket(data);
      setComments(data.comments ?? []);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignee(data.assignedTo && typeof data.assignedTo === "object" ? data.assignedTo._id : "");
    } catch (err) {
      setTicket(null);
      setError(getErrorMessage(err, "We couldn't load this ticket."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchTicket();
    void fetchActivities();
    api.get("/admin/users", { params: { role: "admin", limit: 100 } }).then((r) => setAdmins(r.data.data ?? [])).catch(() => setAdmins([]));
  }, [fetchTicket, fetchActivities]);

  const refreshAll = () => { void fetchTicket(); void fetchActivities(); };

  const apply = async (kind: Exclude<Saving, null>) => {
    setSaving(kind);
    setError("");
    setSuccess("");
    try {
      if (kind === "status") await api.patch(`/admin/tickets/${id}/status`, { status });
      if (kind === "priority") await api.patch(`/admin/tickets/${id}/priority`, { priority });
      if (kind === "assign") await api.patch(`/admin/tickets/${id}/assign`, { assigneeId: assignee || null });
      setSuccess(kind === "assign" ? "Assignment updated." : `Ticket ${kind} updated.`);
      await Promise.all([fetchTicket(), fetchActivities()]);
    } catch (err) {
      setError(getErrorMessage(err, `We couldn't update the ${kind}.`));
      void fetchTicket(); // resync the controls with what the server really has
    } finally {
      setSaving(null);
    }
  };

  const postComment = async (message: string) => {
    await api.post(`/tickets/${id}/comments`, { message });
    await Promise.all([fetchTicket(), fetchActivities()]);
  };

  const back = <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"><ArrowLeft size={16} /> All tickets</Link>;

  if (loading && !ticket) return <PageLoader label="Loading ticket…" />;
  if (!ticket) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader back={back} title="Ticket not found" />
        <Alert action={{ label: "Try again", onClick: refreshAll }}>{error || "This ticket doesn't exist or was deleted."}</Alert>
      </div>
    );
  }

  const creator = typeof ticket.createdBy === "object" ? ticket.createdBy : null;
  const currentAssignee = ticket.assignedTo && typeof ticket.assignedTo === "object" ? ticket.assignedTo._id : "";

  const control = (
    kind: Exclude<Saving, null>,
    label: string,
    dirty: boolean,
    input: React.ReactNode,
  ) => (
    <div>
      <label className={labelClass} htmlFor={`ctl-${kind}`}>{label}</label>
      {input}
      <button onClick={() => void apply(kind)} disabled={saving !== null || !dirty} className={`${btnPrimary} mt-3 w-full`}>
        {saving === kind ? <Spinner /> : <Save size={16} />} {saving === kind ? "Saving…" : "Save"}
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        back={back}
        title={ticket.title}
        description={ticketRef(ticket._id)}
        actions={<button onClick={refreshAll} className={btnSecondary}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>}
      />

      {success && <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
            <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">{ticket.description}</p>
            <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="flex gap-3"><UserIcon size={18} className="mt-0.5 text-slate-400" /><div className="min-w-0"><dt className="text-xs text-slate-500">Raised by</dt><dd className="text-sm font-medium">{creator?.name ?? "Unknown user"}</dd>{creator && <dd className="break-all text-xs text-slate-500">{creator.email}</dd>}</div></div>
              <div className="flex gap-3"><Tag size={18} className="mt-0.5 text-slate-400" /><div><dt className="text-xs text-slate-500">Category</dt><dd className="text-sm font-medium">{ticket.category}</dd></div></div>
              <div className="flex gap-3"><CalendarDays size={18} className="mt-0.5 text-slate-400" /><div><dt className="text-xs text-slate-500">Created</dt><dd className="text-sm font-medium">{formatDate(ticket.createdAt, true)}</dd></div></div>
              <div className="flex gap-3"><Clock size={18} className="mt-0.5 text-slate-400" /><div><dt className="text-xs text-slate-500">First response</dt><dd className="text-sm font-medium">{ticket.firstResponseAt ? formatDate(ticket.firstResponseAt, true) : "Not yet"}</dd></div></div>
            </dl>
          </Card>

          <CommentsSection comments={comments} loading={loading} onRefresh={() => void fetchTicket()} onSubmit={postComment} formLabel="Reply as support" />
          <ActivityTimeline activities={activities} loading={loadingActivities} error={activitiesError} onRefresh={() => void fetchActivities()} />
        </div>

        <aside className="space-y-4 self-start lg:sticky lg:top-20">
          <Card>
            <CardHeader title="Manage ticket" />
            <div className="space-y-6 p-5">
              {control("status", "Status", status !== ticket.status,
                <select id="ctl-status" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} disabled={saving !== null} className={inputClass}>
                  {allowedStatuses(ticket.status).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>,
              )}
              {control("priority", "Priority", priority !== ticket.priority,
                <select id="ctl-priority" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} disabled={saving !== null} className={inputClass}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>,
              )}
              {control("assign", "Assigned to", assignee !== currentAssignee,
                <select id="ctl-assign" value={assignee} onChange={(e) => setAssignee(e.target.value)} disabled={saving !== null} className={inputClass}>
                  <option value="">Unassigned</option>
                  {admins.map((a) => <option key={a._id} value={a._id}>{a.name}{a._id === me?._id ? " (you)" : ""}</option>)}
                </select>,
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
