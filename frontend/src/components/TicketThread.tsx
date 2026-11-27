"use client";

import { useState, type FormEvent } from "react";
import { History, MessageSquare, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { Alert, Card, CardHeader, EmptyState, Skeleton, Spinner, btnPrimary, inputClass } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatEvent, timeAgo } from "@/lib/format";
import type { ActivityLog, Comment } from "@/types";

const RefreshButton = ({ onClick, busy, label }: { onClick: () => void; busy: boolean; label: string }) => (
  <button onClick={onClick} disabled={busy} aria-label={label} title={label} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 disabled:opacity-50">
    <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
  </button>
);

interface CommentsProps {
  comments: Comment[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  /** Resolve to post; throw to show an error under the form. */
  onSubmit: (message: string) => Promise<void>;
  /** When set, the form is replaced by this explanation. */
  blockedReason?: string;
  formLabel?: string;
}

export function CommentsSection({ comments, loading, error, onRefresh, onSubmit, blockedReason, formLabel = "Add a comment" }: CommentsProps) {
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setPosting(true);
    setFormError("");
    try {
      await onSubmit(text);
      setMessage("");
    } catch (err) {
      setFormError(getErrorMessage(err, "We couldn't post your comment."));
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={MessageSquare} title="Conversation" subtitle={`${comments.length} ${comments.length === 1 ? "comment" : "comments"}`} actions={<RefreshButton onClick={onRefresh} busy={loading} label="Refresh comments" />} />
      <div className="space-y-5 p-5">
        {error && <Alert action={{ label: "Try again", onClick: onRefresh }}>{error}</Alert>}

        {loading && comments.length === 0 ? (
          <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : comments.length === 0 && !error ? (
          <EmptyState icon={MessageSquare} title="No comments yet" description="Replies from you and the support team will show up here." />
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => {
              const staff = c.isAdminResponse || c.userId?.role === "admin";
              return (
                <li key={c._id} className="flex gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${staff ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {(c.userId?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className={`min-w-0 flex-1 rounded-lg border p-4 ${staff ? "border-teal-200 bg-teal-50/60" : "border-slate-200 bg-white"}`}>
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-semibold text-slate-900">{c.userId?.name ?? "Deleted user"}</span>
                      {staff && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-2 py-0.5 text-xs font-medium text-white">
                          <ShieldCheck size={12} /> Support
                        </span>
                      )}
                      <span className="text-xs text-slate-400" title={formatDate(c.createdAt, true)}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{c.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {blockedReason ? (
          <Alert type="info">{blockedReason}</Alert>
        ) : (
          <form onSubmit={submit} className="border-t border-slate-100 pt-5">
            <label htmlFor="comment" className="mb-1.5 block text-sm font-medium text-slate-700">{formLabel}</label>
            <textarea
              id="comment"
              rows={3}
              maxLength={2000}
              value={message}
              disabled={posting}
              onChange={(e) => { setMessage(e.target.value); setFormError(""); }}
              placeholder="Write your message…"
              className={`${inputClass} resize-y`}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{message.length}/2000</p>
              <button type="submit" disabled={posting || !message.trim()} className={btnPrimary}>
                {posting ? <Spinner /> : <Send size={16} />}
                {posting ? "Posting…" : "Post comment"}
              </button>
            </div>
            {formError && <p role="alert" className="mt-2 text-sm text-red-600">{formError}</p>}
          </form>
        )}
      </div>
    </Card>
  );
}

interface ActivityProps {
  activities: ActivityLog[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

export function ActivityTimeline({ activities, loading, error, onRefresh }: ActivityProps) {
  return (
    <Card>
      <CardHeader icon={History} title="Activity history" subtitle="Every change to this ticket" actions={<RefreshButton onClick={onRefresh} busy={loading} label="Refresh activity" />} />
      <div className="p-5">
        {error && <Alert action={{ label: "Try again", onClick: onRefresh }}>{error}</Alert>}
        {loading && activities.length === 0 ? (
          <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
        ) : activities.length === 0 && !error ? (
          <EmptyState icon={History} title="No activity yet" />
        ) : (
          <ol className="relative space-y-5 border-l border-slate-200 pl-6">
            {activities.map((a) => (
              <li key={a._id} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-teal-700 bg-white" />
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <p className="text-sm font-medium text-slate-900">{formatEvent(a.event)}</p>
                  <time className="text-xs text-slate-400" dateTime={a.createdAt}>{formatDate(a.createdAt, true)}</time>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{a.details}</p>
                <p className="mt-1 text-xs text-slate-400">by {a.actorId?.name ?? "Unknown"}{a.actorId?.role === "admin" ? " (support)" : ""}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
