"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { AppNotification, UserRole } from "@/types";

export default function NotificationBell({ role }: { role: UserRole }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notifications", { params: { limit: 8 } });
      setItems(res.data.data ?? []);
      setUnread(res.data.unreadCount ?? 0);
    } catch {
      /* the bell is non-critical; stay quiet */
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openNotification = async (n: AppNotification) => {
    setOpen(false);
    if (!n.readAt) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((c) => Math.max(0, c - 1));
      api.patch(`/notifications/${n._id}/read`).catch(() => void load());
    }
    router.push(role === "admin" ? `/admin/tickets/${n.ticketId}` : `/tickets/${n.ticketId}`);
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
    } finally {
      void load();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-md p-2 text-teal-50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button
              onClick={() => void markAll()}
              disabled={unread === 0}
              className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n._id}>
                  <button onClick={() => void openNotification(n)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-teal-600"}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm ${n.readAt ? "text-slate-600" : "font-medium text-slate-900"}`}>{n.message}</span>
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
