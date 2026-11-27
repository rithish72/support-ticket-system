import { ActivityLog } from "../../models/activity-log.model";
import { TicketEventPayload } from "../event-bus";

/** Action 1: persist every event as an immutable audit trail entry. */
export const activityLogListener = async (p: TicketEventPayload): Promise<void> => {
  await ActivityLog.create({
    ticketId: p.ticketId,
    actorId: p.actorId,
    event: p.event,
    details: p.details,
    metadata: p.metadata ?? {},
  });
};
