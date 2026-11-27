export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

/** Allowed admin-driven status transitions (a tiny state machine). */
export const STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved", "closed"],
  resolved: ["open", "in_progress", "closed"], // reopen allowed
  closed: ["open"], // only reopening
};

export const TICKET_EVENTS = {
  CREATED: "ticket.created",
  UPDATED: "ticket.updated",
  STATUS_CHANGED: "ticket.status_changed",
  PRIORITY_CHANGED: "ticket.priority_changed",
  ASSIGNED: "ticket.assigned",
  COMMENT_ADDED: "ticket.comment_added",
  RESOLVED: "ticket.resolved",
  DELETED: "ticket.deleted",
} as const;
export type TicketEventName = (typeof TICKET_EVENTS)[keyof typeof TICKET_EVENTS];
export const TICKET_EVENT_NAMES = Object.values(TICKET_EVENTS) as TicketEventName[];
