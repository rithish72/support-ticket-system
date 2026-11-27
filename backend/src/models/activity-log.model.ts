import { HydratedDocument, Schema, Types, model } from "mongoose";
import { TICKET_EVENT_NAMES, TicketEventName } from "../constants";

export interface IActivityLog {
  ticketId: Types.ObjectId;
  actorId: Types.ObjectId;
  event: TicketEventName;
  details: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityLogDocument = HydratedDocument<IActivityLog>;

const activityLogSchema = new Schema<IActivityLog>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: String, enum: TICKET_EVENT_NAMES, required: true },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }, // logs are append-only
);

activityLogSchema.index({ ticketId: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);
