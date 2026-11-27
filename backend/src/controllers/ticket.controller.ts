import * as tickets from "../services/ticket.service";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/tickets
export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await tickets.createTicket(req.user!, req.body);
  res.status(201).json({ success: true, message: "Ticket created successfully", data: ticket });
});

// GET /api/tickets
export const getTickets = asyncHandler(async (req, res) => {
  const { tickets: data, pagination } = await tickets.listTickets(req.user!, req.query as never, "own");
  res.status(200).json({ success: true, data, pagination });
});

// GET /api/tickets/:id  (owner, or any admin)
export const getTicketById = asyncHandler(async (req, res) => {
  const data = await tickets.getTicketDetail(req.user!, req.params.id);
  res.status(200).json({ success: true, data });
});

// PATCH /api/tickets/:id
export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await tickets.updateOwnTicket(req.user!, req.params.id, req.body);
  res.status(200).json({ success: true, message: "Ticket updated successfully", data: ticket });
});

// DELETE /api/tickets/:id
export const deleteTicket = asyncHandler(async (req, res) => {
  await tickets.deleteOwnTicket(req.user!, req.params.id);
  res.status(200).json({ success: true, message: "Ticket deleted successfully" });
});
