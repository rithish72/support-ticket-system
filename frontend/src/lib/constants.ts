import type { TicketPriority, TicketStatus } from "@/types";

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const statusLabel = (s: TicketStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
export const priorityLabel = (p: TicketPriority) => PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p;

export const statusStyles: Record<TicketStatus, string> = {
  open: "bg-amber-50 text-amber-800 ring-amber-600/20",
  in_progress: "bg-sky-50 text-sky-800 ring-sky-600/20",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  closed: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-500/20",
  medium: "bg-amber-50 text-amber-800 ring-amber-600/20",
  high: "bg-orange-50 text-orange-800 ring-orange-600/20",
  urgent: "bg-red-50 text-red-800 ring-red-600/20",
};

export const statusBar: Record<TicketStatus, string> = {
  open: "bg-amber-500",
  in_progress: "bg-sky-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-400",
};

/** Mirrors the API's status rules, so admins are only offered changes the server accepts. */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved", "closed"],
  resolved: ["open", "in_progress", "closed"],
  closed: ["open"],
};

export const allowedStatuses = (current: TicketStatus) =>
  STATUS_OPTIONS.filter((o) => o.value === current || STATUS_TRANSITIONS[current].includes(o.value));

export const CATEGORY_SUGGESTIONS = ["Technical issue", "Billing", "Account", "Feature request", "General question"];
