import { FilterQuery, Types } from "mongoose";
import { STATUS_TRANSITIONS, TICKET_EVENTS, TicketEventName, TicketPriority, TicketStatus } from "../constants";
import { AppError } from "../errors/AppError";
import { ticketEvents } from "../events/event-bus";
import { Comment } from "../models/comment.model";
import { ITicket, Ticket, TicketDocument } from "../models/ticket.model";
import { User, UserDocument } from "../models/user.model";
import { escapeRegex } from "../utils/escapeRegex";
import { getPagination, paginationMeta } from "../utils/pagination";
import { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from "../validators/ticket.validator";

const isAdmin = (u: UserDocument) => u.role === "admin";

/** Publish a domain event for a ticket (called only after the DB write succeeded). */
export const publishTicketEvent = (
  event: TicketEventName,
  ticket: TicketDocument,
  actor: UserDocument,
  details: string,
  metadata: Record<string, unknown> = {},
) =>
  ticketEvents.publish({
    event,
    ticketId: ticket._id,
    ticketTitle: ticket.title,
    ticketOwnerId: ticket.createdBy,
    assignedToId: ticket.assignedTo,
    actorId: actor._id,
    actorRole: actor.role,
    details,
    metadata,
  });

/** Loads a ticket the actor may see: owners see their own, admins see all. 404 otherwise (no existence leak). */
export const findAccessibleTicket = async (actor: UserDocument, id: string): Promise<TicketDocument> => {
  const filter: FilterQuery<ITicket> = { _id: id, deletedAt: null };
  if (!isAdmin(actor)) filter.createdBy = actor._id;
  const ticket = await Ticket.findOne(filter);
  if (!ticket) throw new AppError(404, "Ticket not found");
  return ticket;
};

export const createTicket = async (actor: UserDocument, input: CreateTicketInput) => {
  const ticket = await Ticket.create({ ...input, priority: input.priority ?? "medium", createdBy: actor._id });
  publishTicketEvent(TICKET_EVENTS.CREATED, ticket, actor, "Ticket was created", {
    title: ticket.title,
    priority: ticket.priority,
    category: ticket.category,
  });
  return ticket;
};

/** scope "own": only the actor's tickets (user view). scope "all": every ticket (admin view). */
export const listTickets = async (actor: UserDocument, q: ListTicketsQuery, scope: "own" | "all") => {
  const { page, limit, skip } = getPagination(q);
  const filter: FilterQuery<ITicket> = { deletedAt: null };

  if (scope === "own") {
    filter.createdBy = actor._id;
  } else {
    if (q.createdBy) filter.createdBy = q.createdBy;
    if (q.assignedTo) filter.assignedTo = q.assignedTo;
  }
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = { $regex: `^${escapeRegex(q.category)}$`, $options: "i" };
  if (q.search) {
    const rx = { $regex: escapeRegex(q.search), $options: "i" };
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const sort = { [q.sortBy]: q.order === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
  const query = Ticket.find(filter).sort(sort).skip(skip).limit(limit);
  if (scope === "all") query.populate("createdBy", "name email").populate("assignedTo", "name email");

  const [tickets, total] = await Promise.all([query.lean(), Ticket.countDocuments(filter)]);
  return { tickets, pagination: paginationMeta(total, page, limit) };
};

export const getTicketDetail = async (actor: UserDocument, id: string, withComments = false) => {
  const accessible = await findAccessibleTicket(actor, id);
  await accessible.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ]);
  const data = accessible.toObject() as unknown as Record<string, unknown>;
  if (withComments) {
    data.comments = await Comment.find({ ticketId: accessible._id })
      .populate("userId", "name email role")
      .sort({ createdAt: 1 })
      .lean();
  }
  return data;
};

/** Distinguishes "doesn't exist / not yours" (404) from "exists but locked by status" (409). */
const explainOwnerWriteFailure = async (actor: UserDocument, id: string, action: string): Promise<never> => {
  const exists = await Ticket.exists({ _id: id, createdBy: actor._id, deletedAt: null });
  if (exists) throw new AppError(409, `Only tickets with status "open" can be ${action}`);
  throw new AppError(404, "Ticket not found");
};

export const updateOwnTicket = async (actor: UserDocument, id: string, updates: UpdateTicketInput) => {
  const set = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  const ticket = await Ticket.findOneAndUpdate(
    { _id: id, createdBy: actor._id, status: "open", deletedAt: null },
    { $set: { ...set, lastActivityAt: new Date() } },
    { new: true, runValidators: true },
  );
  if (!ticket) return explainOwnerWriteFailure(actor, id, "edited");
  publishTicketEvent(TICKET_EVENTS.UPDATED, ticket, actor, "Ticket details were updated", {
    updatedFields: Object.keys(set),
  });
  return ticket;
};

export const deleteOwnTicket = async (actor: UserDocument, id: string) => {
  const ticket = await Ticket.findOneAndUpdate(
    { _id: id, createdBy: actor._id, status: "open", deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!ticket) return explainOwnerWriteFailure(actor, id, "deleted");
  publishTicketEvent(TICKET_EVENTS.DELETED, ticket, actor, "Ticket was deleted");
};

// ---------------- admin actions ----------------

const findLiveTicket = async (id: string) => {
  const ticket = await Ticket.findOne({ _id: id, deletedAt: null });
  if (!ticket) throw new AppError(404, "Ticket not found");
  return ticket;
};

export const changeTicketStatus = async (actor: UserDocument, id: string, status: TicketStatus) => {
  const ticket = await findLiveTicket(id);
  const previousStatus = ticket.status;
  if (previousStatus === status) return { ticket, changed: false };

  if (!STATUS_TRANSITIONS[previousStatus].includes(status)) {
    throw new AppError(400, `Cannot change status from "${previousStatus}" to "${status}"`);
  }

  const now = new Date();
  const set: Record<string, unknown> = { status, lastActivityAt: now };
  if (status === "resolved") set.resolvedAt = now;
  if (status === "closed") set.closedAt = now;
  if (status === "open" || status === "in_progress") {
    set.resolvedAt = null;
    set.closedAt = null;
  }

  // Compare-and-set on the previous status => safe against two admins racing.
  const updated = await Ticket.findOneAndUpdate(
    { _id: id, deletedAt: null, status: previousStatus },
    { $set: set },
    { new: true },
  );
  if (!updated) throw new AppError(409, "Ticket was modified by someone else. Please refresh and retry.");

  publishTicketEvent(
    TICKET_EVENTS.STATUS_CHANGED,
    updated,
    actor,
    `Ticket status changed from ${previousStatus} to ${status}`,
    { previousStatus, newStatus: status },
  );
  if (status === "resolved") {
    publishTicketEvent(TICKET_EVENTS.RESOLVED, updated, actor, "Ticket was resolved by an administrator", {
      previousStatus,
    });
  }
  return { ticket: updated, changed: true };
};

export const changeTicketPriority = async (actor: UserDocument, id: string, priority: TicketPriority) => {
  const ticket = await findLiveTicket(id);
  const previousPriority = ticket.priority;
  if (previousPriority === priority) return { ticket, changed: false };

  const updated = await Ticket.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { priority, lastActivityAt: new Date() } },
    { new: true },
  );
  if (!updated) throw new AppError(404, "Ticket not found");

  publishTicketEvent(
    TICKET_EVENTS.PRIORITY_CHANGED,
    updated,
    actor,
    `Ticket priority changed from ${previousPriority} to ${priority}`,
    { previousPriority, newPriority: priority },
  );
  return { ticket: updated, changed: true };
};

export const assignTicket = async (actor: UserDocument, id: string, assigneeId: string | null) => {
  await findLiveTicket(id);
  if (assigneeId) {
    const assignee = await User.findOne({ _id: assigneeId, role: "admin", isActive: true }).select("name");
    if (!assignee) throw new AppError(400, "Assignee must be an active admin");
  }
  const updated = await Ticket.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { assignedTo: assigneeId ? new Types.ObjectId(assigneeId) : null, lastActivityAt: new Date() } },
    { new: true },
  );
  if (!updated) throw new AppError(404, "Ticket not found");

  publishTicketEvent(
    TICKET_EVENTS.ASSIGNED,
    updated,
    actor,
    assigneeId ? "Ticket was assigned" : "Ticket was unassigned",
    { assigneeId },
  );
  return updated;
};
