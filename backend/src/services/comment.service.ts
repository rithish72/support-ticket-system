import { TICKET_EVENTS } from "../constants";
import { AppError } from "../errors/AppError";
import { Comment } from "../models/comment.model";
import { Ticket } from "../models/ticket.model";
import { UserDocument } from "../models/user.model";
import { findAccessibleTicket, publishTicketEvent } from "./ticket.service";

export const addComment = async (actor: UserDocument, ticketId: string, message: string) => {
  const ticket = await findAccessibleTicket(actor, ticketId);
  const isAdmin = actor.role === "admin";

  // Closed tickets are read-only for requesters; admins can still respond (e.g. before reopening).
  if (ticket.status === "closed" && !isAdmin) {
    throw new AppError(400, "Comments cannot be added to closed tickets");
  }

  const comment = await Comment.create({
    ticketId: ticket._id,
    userId: actor._id,
    message,
    isAdminResponse: isAdmin,
  });

  const now = new Date();
  const set: Record<string, unknown> = { lastActivityAt: now };
  const update: Record<string, unknown> = { $inc: { commentCount: 1 }, $set: set };
  await Ticket.updateOne({ _id: ticket._id }, update);
  if (isAdmin) {
    // Only set once: the first admin reply defines the "first response time"
    await Ticket.updateOne({ _id: ticket._id, firstResponseAt: null }, { $set: { firstResponseAt: now } });
  }

  publishTicketEvent(TICKET_EVENTS.COMMENT_ADDED, ticket, actor, "A comment was added to the ticket", {
    commentId: comment.id,
    byAdmin: isAdmin,
  });

  return comment.populate("userId", "name email role");
};

export const listComments = async (actor: UserDocument, ticketId: string) => {
  const ticket = await findAccessibleTicket(actor, ticketId);
  return Comment.find({ ticketId: ticket._id })
    .populate("userId", "name email role")
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();
};
