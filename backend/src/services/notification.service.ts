import { FilterQuery, Types } from "mongoose";
import { AppError } from "../errors/AppError";
import { INotification, Notification } from "../models/notification.model";
import { getPagination, paginationMeta } from "../utils/pagination";
import { ListNotificationsQuery } from "../validators/notification.validator";

export const listNotifications = async (userId: Types.ObjectId, q: ListNotificationsQuery) => {
  const { page, limit, skip } = getPagination(q);
  const filter: FilterQuery<INotification> = { userId };
  if (q.unread) filter.readAt = null;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, readAt: null }),
  ]);
  return { items, unreadCount, pagination: paginationMeta(total, page, limit) };
};

export const markRead = async (userId: Types.ObjectId, id: string) => {
  const n = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!n) throw new AppError(404, "Notification not found");
  return n;
};

export const markAllRead = async (userId: Types.ObjectId) => {
  const res = await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
  return res.modifiedCount;
};
