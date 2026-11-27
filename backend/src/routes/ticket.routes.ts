import { Router } from "express";
import { getTicketActivities } from "../controllers/activity-log.controller";
import { addComment, getComments } from "../controllers/comment.controller";
import { createTicket, deleteTicket, getTicketById, getTickets, updateTicket } from "../controllers/ticket.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { idParams } from "../validators/common.validator";
import { createCommentBody, createTicketBody, listTicketsQuery, updateTicketBody } from "../validators/ticket.validator";

const router = Router();
router.use(protect);

router.post("/", validate({ body: createTicketBody }), createTicket);
router.get("/", validate({ query: listTicketsQuery }), getTickets);
router.get("/:id", validate({ params: idParams }), getTicketById);
router.patch("/:id", validate({ params: idParams, body: updateTicketBody }), updateTicket);
router.delete("/:id", validate({ params: idParams }), deleteTicket);

// Nested resources
router.get("/:id/comments", validate({ params: idParams }), getComments);
router.post("/:id/comments", validate({ params: idParams, body: createCommentBody }), addComment);
router.get("/:id/activities", validate({ params: idParams }), getTicketActivities);

export default router;
