import { Types } from "mongoose";
import { TICKET_EVENTS } from "../../constants";
import { Notification } from "../../models/notification.model";
import { User } from "../../models/user.model";
import { TicketEventPayload } from "../event-bus";

const adminIds = async (): Promise<Types.ObjectId[]> => {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id").lean();
  return admins.map((a) => a._id as Types.ObjectId);
};

const label = (s: unknown) => String(s).replace(/_/g, " ");

/** Action 2: create in-app notifications for the people who care about the event. */
export const notificationListener = async (p: TicketEventPayload): Promise<void> => {
  let recipients: Types.ObjectId[] = [];
  let message = "";
  const title = `"${p.ticketTitle}"`;
  const m = p.metadata ?? {};

  switch (p.event) {
    case TICKET_EVENTS.CREATED:
      recipients = await adminIds();
      message = `New ticket ${title} was submitted`;
      break;
    case TICKET_EVENTS.COMMENT_ADDED:
      if (p.actorRole === "admin") {
        recipients = [p.ticketOwnerId];
        message = `Support replied on your ticket ${title}`;
      } else {
        recipients = p.assignedToId ? [p.assignedToId] : await adminIds();
        message = `New comment from the requester on ${title}`;
      }
      break;
    case TICKET_EVENTS.STATUS_CHANGED:
      if (m.newStatus === "resolved") return; // covered by ticket.resolved
      recipients = [p.ticketOwnerId];
      message = `Status of ${title} changed to ${label(m.newStatus)}`;
      break;
    case TICKET_EVENTS.RESOLVED:
      recipients = [p.ticketOwnerId];
      message = `Your ticket ${title} was resolved`;
      break;
    case TICKET_EVENTS.PRIORITY_CHANGED:
      recipients = [p.ticketOwnerId];
      message = `Priority of ${title} changed to ${m.newPriority}`;
      break;
    case TICKET_EVENTS.ASSIGNED:
      recipients = [p.ticketOwnerId];
      if (m.assigneeId) recipients.push(new Types.ObjectId(String(m.assigneeId)));
      message = m.assigneeId ? `Ticket ${title} was assigned to a support agent` : `Ticket ${title} was unassigned`;
      break;
    default:
      return; // updated / deleted -> activity log only
  }

  const unique = [...new Set(recipients.map(String))].filter((id) => id !== String(p.actorId));
  if (unique.length === 0) return;

  await Notification.insertMany(
    unique.map((userId) => ({ userId, ticketId: p.ticketId, event: p.event, message })),
  );
};
