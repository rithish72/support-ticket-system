import * as admin from "../services/admin.service";
import * as tickets from "../services/ticket.service";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: await admin.getDashboardStats() });
});

// GET /api/admin/tickets
export const getAllTickets = asyncHandler(async (req, res) => {
  const { tickets: data, pagination } = await tickets.listTickets(req.user!, req.query as never, "all");
  res.status(200).json({ success: true, data, pagination });
});

// GET /api/admin/tickets/:id  (ticket + comments)
export const getAdminTicketById = asyncHandler(async (req, res) => {
  const data = await tickets.getTicketDetail(req.user!, req.params.id, true);
  res.status(200).json({ success: true, data });
});

// PATCH /api/admin/tickets/:id/status
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticket, changed } = await tickets.changeTicketStatus(req.user!, req.params.id, req.body.status);
  res.status(200).json({
    success: true,
    message: changed ? "Ticket status updated successfully" : "Ticket already has this status",
    data: ticket,
  });
});

// PATCH /api/admin/tickets/:id/priority
export const updateTicketPriority = asyncHandler(async (req, res) => {
  const { ticket, changed } = await tickets.changeTicketPriority(req.user!, req.params.id, req.body.priority);
  res.status(200).json({
    success: true,
    message: changed ? "Ticket priority updated successfully" : "Ticket already has this priority",
    data: ticket,
  });
});

// PATCH /api/admin/tickets/:id/assign
export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await tickets.assignTicket(req.user!, req.params.id, req.body.assigneeId);
  res.status(200).json({ success: true, message: "Ticket assignment updated", data: ticket });
});

// GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await admin.listUsers(req.query as never);
  res.status(200).json({ success: true, data: users, pagination });
});

// PATCH /api/admin/users/:id/status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await admin.setUserActive(req.user!, req.params.id, req.body.isActive);
  res.status(200).json({ success: true, message: "User status updated", data: user });
});
