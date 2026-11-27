import * as notifications from "../services/notification.service";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { items, unreadCount, pagination } = await notifications.listNotifications(req.user!._id, req.query as never);
  res.status(200).json({ success: true, data: items, unreadCount, pagination });
});

// PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notifications.markRead(req.user!._id, req.params.id);
  res.status(200).json({ success: true, data });
});

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const updated = await notifications.markAllRead(req.user!._id);
  res.status(200).json({ success: true, message: "All notifications marked as read", updated });
});
