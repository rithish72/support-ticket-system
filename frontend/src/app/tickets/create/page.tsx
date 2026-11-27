"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import api from "@/lib/api";
import { Alert, Card, PageHeader, Spinner, btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { CATEGORY_SUGGESTIONS, PRIORITY_OPTIONS, priorityStyles } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { TicketPriority } from "@/types";

const PRIORITY_HINT: Record<TicketPriority, string> = {
  low: "Not blocking anything",
  medium: "Affects my work, with a workaround",
  high: "Blocks important work",
  urgent: "Everything is stopped",
};

export default function CreateTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = title.trim();
  const d = description.trim();
  const c = category.trim();
  const valid = t.length >= 5 && d.length >= 10 && c.length >= 2;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/tickets", { title: t, description: d, category: c, priority });
      router.push(`/tickets/${res.data.data._id}`); // go straight to the new ticket so they can add details
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't submit your ticket."));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={<Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"><ArrowLeft size={16} /> My tickets</Link>}
        title="New ticket"
        description="Tell us what's wrong. The more detail you give, the faster we can help."
      />

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className={labelClass}>Title</label>
            <input id="title" required minLength={5} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Can't reset my password" className={inputClass} />
            <p className="mt-1 flex justify-between text-xs text-slate-400"><span>At least 5 characters</span><span>{title.length}/120</span></p>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>What happened?</label>
            <textarea id="description" required minLength={10} maxLength={5000} rows={7} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Include what you expected, what actually happened and any error messages." className={`${inputClass} resize-y`} />
            <p className="mt-1 flex justify-between text-xs text-slate-400"><span>At least 10 characters</span><span>{description.length}/5000</span></p>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <input id="category" list="category-suggestions" required minLength={2} maxLength={50} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Pick one or type your own" className={inputClass} />
            <datalist id="category-suggestions">{CATEGORY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          </div>

          <fieldset>
            <legend className={labelClass}>Priority</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRIORITY_OPTIONS.map((o) => (
                <label key={o.value} className={`cursor-pointer rounded-md border p-3 text-sm transition has-[:checked]:border-teal-600 has-[:checked]:ring-2 has-[:checked]:ring-teal-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-600 ${priority === o.value ? "border-teal-600" : "border-slate-300 hover:border-slate-400"}`}>
                  <input type="radio" name="priority" value={o.value} checked={priority === o.value} onChange={() => setPriority(o.value)} className="sr-only" />
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityStyles[o.value]}`}>{o.label}</span>
                  <span className="mt-2 block text-xs text-slate-500">{PRIORITY_HINT[o.value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-sm text-slate-500">New tickets start as <strong className="font-medium text-slate-700">Open</strong>. You can edit or delete a ticket until the support team starts working on it.</p>

          {error && <Alert>{error}</Alert>}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link href="/tickets" className={btnSecondary}>Cancel</Link>
            <button type="submit" disabled={loading || !valid} className={btnPrimary}>
              {loading ? <Spinner /> : <Send size={16} />}
              {loading ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
