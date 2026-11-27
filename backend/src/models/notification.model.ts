import { HydratedDocument, Schema, Types, model } from "mongoose";
import { TICKET_EVENT_NAMES, TicketEventName } from "../constants";

export interface INotification {
  userId: Types.ObjectId; // recipient
  ticketId: Types.ObjectId;
  event: TicketEventName;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    event: { type: String, enum: TICKET_EVENT_NAMES, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
// Housekeeping: notifications expire after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = model<INotification>("Notification", notificationSchema);
