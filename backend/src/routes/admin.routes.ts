import { Router } from "express";
import {
  assignTicket,
  getAdminTicketById,
  getAllTickets,
  getAllUsers,
  getDashboardStats,
  updateTicketPriority,
  updateTicketStatus,
  updateUserStatus,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { assignTicketBody, listUsersQuery, updatePriorityBody, updateStatusBody, updateUserStatusBody } from "../validators/admin.validator";
import { idParams } from "../validators/common.validator";
import { listTicketsQuery } from "../validators/ticket.validator";

const router = Router();

// Every admin route requires a valid session AND the admin role.
router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/tickets", validate({ query: listTicketsQuery }), getAllTickets);
router.get("/tickets/:id", validate({ params: idParams }), getAdminTicketById);
router.patch("/tickets/:id/status", validate({ params: idParams, body: updateStatusBody }), updateTicketStatus);
router.patch("/tickets/:id/priority", validate({ params: idParams, body: updatePriorityBody }), updateTicketPriority);
router.patch("/tickets/:id/assign", validate({ params: idParams, body: assignTicketBody }), assignTicket);

router.get("/users", validate({ query: listUsersQuery }), getAllUsers);
router.patch("/users/:id/status", validate({ params: idParams, body: updateUserStatusBody }), updateUserStatus);

export default router;
