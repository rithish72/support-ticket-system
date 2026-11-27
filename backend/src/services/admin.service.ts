import { FilterQuery } from "mongoose";
import { AppError } from "../errors/AppError";
import { Ticket } from "../models/ticket.model";
import { IUser, User, UserDocument } from "../models/user.model";
import { escapeRegex } from "../utils/escapeRegex";
import { getPagination, paginationMeta } from "../utils/pagination";
import { ListUsersQuery } from "../validators/admin.validator";

export const listUsers = async (q: ListUsersQuery) => {
  const { page, limit, skip } = getPagination(q);
  const filter: FilterQuery<IUser> = {};
  if (q.role) filter.role = q.role;
  if (q.search) {
    const rx = { $regex: escapeRegex(q.search), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    User.countDocuments(filter),
  ]);
  return { users, pagination: paginationMeta(total, page, limit) };
};

export const setUserActive = async (actor: UserDocument, id: string, isActive: boolean) => {
  if (actor.id === id) throw new AppError(400, "You cannot change your own account status");
  const { matchedCount } = await User.updateOne({ _id: id }, { $set: { isActive } });
  if (matchedCount === 0) throw new AppError(404, "User not found");
  return User.findById(id); // password is never selected by default
};

type SumCount = { total: number; count: number };
const avgHours = (r?: SumCount) => (r && r.count > 0 ? Math.round((r.total / r.count / 36e5) * 10) / 10 : null);

export const getDashboardStats = async () => {
  const live = { deletedAt: null };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, byStatusRaw, byPriorityRaw, categoriesRaw, createdLast7Days, unassignedActive, resolution, response] =
    await Promise.all([
      User.countDocuments({ role: "user" }),
      Ticket.aggregate([{ $match: live }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: live }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: live },
        { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Ticket.countDocuments({ ...live, createdAt: { $gte: weekAgo } }),
      Ticket.countDocuments({ ...live, assignedTo: null, status: { $in: ["open", "in_progress"] } }),
      Ticket.aggregate([
        { $match: { ...live, resolvedAt: { $ne: null } } },
        { $group: { _id: null, total: { $sum: { $subtract: ["$resolvedAt", "$createdAt"] } }, count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { ...live, firstResponseAt: { $ne: null } } },
        { $group: { _id: null, total: { $sum: { $subtract: ["$firstResponseAt", "$createdAt"] } }, count: { $sum: 1 } } },
      ]),
    ]);

  const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 } as Record<string, number>;
  byStatusRaw.forEach((r) => (byStatus[r._id] = r.count));
  const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 } as Record<string, number>;
  byPriorityRaw.forEach((r) => (byPriority[r._id] = r.count));

  return {
    // keys kept for backward compatibility with the existing frontend
    totalUsers,
    totalTickets: Object.values(byStatus).reduce((a, b) => a + b, 0),
    openTickets: byStatus.open,
    inProgressTickets: byStatus.in_progress,
    resolvedTickets: byStatus.resolved,
    closedTickets: byStatus.closed,
    urgentTickets: byPriority.urgent,
    // new
    byStatus,
    byPriority,
    topCategories: categoriesRaw.map((c) => ({ category: c._id, count: c.count })),
    createdLast7Days,
    unassignedActiveTickets: unassignedActive,
    avgResolutionHours: avgHours(resolution[0]),
    avgFirstResponseHours: avgHours(response[0]),
  };
};
