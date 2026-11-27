import { HydratedDocument, Schema, Types, model } from "mongoose";
import { TICKET_PRIORITIES, TICKET_STATUSES, TicketPriority, TicketStatus } from "../constants";

export interface ITicket {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  commentCount: number;
  firstResponseAt: Date | null; // first admin comment (SLA metric)
  resolvedAt: Date | null;
  closedAt: Date | null;
  lastActivityAt: Date;
  deletedAt: Date | null; // soft delete
  createdAt: Date;
  updatedAt: Date;
}

export type TicketDocument = HydratedDocument<ITicket>;

const ticketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: TICKET_PRIORITIES, default: "medium" },
    status: { type: String, enum: TICKET_STATUSES, default: "open" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    commentCount: { type: Number, default: 0, min: 0 },
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: () => new Date() },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// "My tickets" list
ticketSchema.index({ createdBy: 1, deletedAt: 1, createdAt: -1 });
// Admin list filtered by status / priority
ticketSchema.index({ deletedAt: 1, status: 1, priority: 1, createdAt: -1 });
// Admin "assigned to me"
ticketSchema.index({ assignedTo: 1, status: 1 });

export const Ticket = model<ITicket>("Ticket", ticketSchema);
