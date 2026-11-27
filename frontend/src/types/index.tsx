export type UserRole = "user" | "admin";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string | User;
  assignedTo?: string | User | null;
  commentCount?: number;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  ticketId: string;
  userId: User;
  message: string;
  isAdminResponse?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  ticketId: string;
  actorId: User;
  event: string;
  details: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  ticketId: string;
  event: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  byPriority?: Record<TicketPriority, number>;
  topCategories?: { category: string; count: number }[];
  createdLast7Days?: number;
  unassignedActiveTickets?: number;
  avgResolutionHours?: number | null;
  avgFirstResponseHours?: number | null;
}
