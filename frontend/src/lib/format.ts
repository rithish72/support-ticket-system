export const ticketRef = (id: string) => `#${id.slice(-6).toUpperCase()}`;

export const formatDate = (date?: string | null, withTime = false) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return "";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : formatDate(date);
};

export const formatEvent = (event: string) =>
  event.replace("ticket.", "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const formatHours = (h?: number | null) => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} days`;
};
