"use client";

import type { ComponentType, ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { priorityLabel, priorityStyles, statusLabel, statusStyles } from "@/lib/constants";
import type { Pagination as PaginationData, TicketPriority, TicketStatus } from "@/types";

// ---------- shared class names ----------
const btn =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-teal-700 text-white hover:bg-teal-800`;
export const btnSecondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;
export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

// ---------- feedback ----------
export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} size={18} aria-hidden />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="text-teal-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export function Alert({
  type = "error",
  children,
  onClose,
  action,
}: {
  type?: "error" | "success" | "info";
  children: ReactNode;
  onClose?: () => void;
  action?: { label: string; onClick: () => void };
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[type];
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-md border p-3.5 text-sm ${styles}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action && (
        <button onClick={action.onClick} className="shrink-0 font-medium underline underline-offset-2">
          {action.label}
        </button>
      )}
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ---------- badges ----------
const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export const StatusBadge = ({ status }: { status: TicketStatus }) => (
  <span className={`${pill} ${statusStyles[status]}`}>{statusLabel(status)}</span>
);

export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`${pill} ${priorityStyles[priority]}`}>{priorityLabel(priority)}</span>
);

// ---------- layout ----------
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {back && <div className="mb-4">{back}</div>}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-prose text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</section>;
}

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <Icon size={19} className="shrink-0 text-teal-700" />}
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <Icon size={36} className="mx-auto mb-3 text-slate-300" />
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({
  pagination,
  onChange,
  noun = "results",
}: {
  pagination: PaginationData;
  onChange: (page: number) => void;
  noun?: string;
}) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={`${btnSecondary} !px-3 !py-1.5`} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-20 text-center text-sm text-slate-600">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={`${btnSecondary} !px-3 !py-1.5`} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="ml-auto h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
