"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Pencil, RefreshCw, Save, Tag, Trash2, User as UserIcon, UserCheck, X } from "lucide-react";
import api from "@/lib/api";
import { ActivityTimeline, CommentsSection } from "@/components/TicketThread";
import { Alert, Card, PageHeader, PageLoader, PriorityBadge, Spinner, StatusBadge, btnDanger, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, ticketRef } from "@/lib/format";
import type { ActivityLog, Comment, Ticket } from "@/types";

const OBJECT_ID = /^[a-f\d]{24}$/i;

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "" });

  const fetchTicket = useCallback(async () => {
    if (!OBJECT_ID.test(id)) {
      setError("That ticket link isn't valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setTicket((await api.get(`/tickets/${id}`)).data.data);
    } catch (err) {
      setTicket(null);
      setError(getErrorMessage(err, "We couldn't load this ticket."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentsError("");
    try {
      setComments((await api.get(`/tickets/${id}/comments`)).data.data ?? []);
    } catch (err) {
      setCommentsError(getErrorMessage(err, "We couldn't load the comments."));
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

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

  const reloadAll = useCallback(() => {
    void fetchTicket();
    void fetchComments();
    void fetchActivities();
  }, [fetchTicket, fetchComments, fetchActivities]);

  useEffect(() => {
    if (OBJECT_ID.test(id)) reloadAll();
    else void fetchTicket();
  }, [id, reloadAll, fetchTicket]);

  const startEdit = () => {
    if (!ticket) return;
    setForm({ title: ticket.title, description: ticket.description, category: ticket.category });
    setSuccess("");
    setError("");
    setEditing(true);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    const body = { title: form.title.trim(), description: form.description.trim(), category: form.category.trim() };
    if (body.title.length < 5 || body.description.length < 10 || body.category.length < 2) {
      setError("Title needs 5+ characters, the description 10+, and the category 2+.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/tickets/${id}`, body);
      setEditing(false);
      setSuccess("Your changes were saved.");
      void fetchTicket(); // refetch: the PATCH response isn't populated
      void fetchActivities();
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't save your changes."));
      void fetchTicket(); // status may have changed under us (editing is only allowed while open)
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this ticket? This can't be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/tickets/${id}`);
      router.push("/tickets");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't delete this ticket."));
      setDeleting(false);
    }
  };

  const postComment = async (message: string) => {
    await api.post(`/tickets/${id}/comments`, { message });
    await Promise.all([fetchComments(), fetchActivities()]);
  };

  const back = <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"><ArrowLeft size={16} /> My tickets</Link>;

  if (loading && !ticket) return <PageLoader label="Loading ticket…" />;

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader back={back} title="Ticket not found" />
        <Alert action={{ label: "Try again", onClick: reloadAll }}>{error || "This ticket doesn't exist or you don't have access to it."}</Alert>
      </div>
    );
  }

  const creator = typeof ticket.createdBy === "object" ? ticket.createdBy.name : "You";
  const assignee = ticket.assignedTo && typeof ticket.assignedTo === "object" ? ticket.assignedTo.name : null;
  const isOpen = ticket.status === "open";

  const facts = [
    { icon: CalendarDays, label: "Created", value: formatDate(ticket.createdAt, true) },
    { icon: Clock, label: "Last updated", value: formatDate(ticket.updatedAt, true) },
    { icon: UserIcon, label: "Raised by", value: creator },
    { icon: UserCheck, label: "Handled by", value: assignee ?? "Not assigned yet" },
    { icon: Tag, label: "Category", value: ticket.category },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        back={back}
        title={editing ? "Edit ticket" : ticket.title}
        description={`${ticketRef(ticket._id)}`}
        actions={
          !editing && (
            <>
              <button onClick={reloadAll} className={btnSecondary} aria-label="Refresh ticket"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
              {isOpen && <button onClick={startEdit} className={btnPrimary}><Pencil size={16} /> Edit</button>}
              {isOpen && <button onClick={() => void handleDelete()} disabled={deleting} className={btnDanger}>{deleting ? <Spinner /> : <Trash2 size={16} />} Delete</button>}
            </>
          )
        }
      />

      {success && <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <Card className="p-6 md:p-8">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label htmlFor="title" className={labelClass}>Title</label>
              <input id="title" required maxLength={120} value={form.title} disabled={saving} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea id="description" required rows={7} maxLength={5000} value={form.description} disabled={saving} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-y`} />
            </div>
            <div>
              <label htmlFor="category" className={labelClass}>Category</label>
              <input id="category" required maxLength={50} value={form.category} disabled={saving} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className={btnSecondary}><X size={16} /> Cancel</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? <Spinner /> : <Save size={16} />} {saving ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
            <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">{ticket.description}</p>
            {!isOpen && <p className="mt-5 text-sm text-slate-500">This ticket is being handled by support, so it can no longer be edited or deleted.</p>}
            <dl className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="break-words text-sm font-medium text-slate-900">{value}</dd></div>
                </div>
              ))}
            </dl>
          </>
        )}
      </Card>

      <CommentsSection
        comments={comments}
        loading={loadingComments}
        error={commentsError}
        onRefresh={() => void fetchComments()}
        onSubmit={postComment}
        blockedReason={ticket.status === "closed" ? "This ticket is closed, so new comments can't be added. Raise a new ticket if you still need help." : undefined}
      />
      <ActivityTimeline activities={activities} loading={loadingActivities} error={activitiesError} onRefresh={() => void fetchActivities()} />
    </div>
  );
}
