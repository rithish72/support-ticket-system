import { ActivityLog } from "../models/activity-log.model";
import { UserDocument } from "../models/user.model";
import { findAccessibleTicket } from "./ticket.service";

export const listActivities = async (actor: UserDocument, ticketId: string) => {
  const ticket = await findAccessibleTicket(actor, ticketId);
  return ActivityLog.find({ ticketId: ticket._id })
    .populate("actorId", "name email role")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
};
