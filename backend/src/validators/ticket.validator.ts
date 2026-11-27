import { z } from "zod";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "../constants";
import { objectId, optionalQuery, paginationQuery } from "./common.validator";

const title = z.string().trim().min(5, "Title must be between 5 and 120 characters").max(120, "Title must be between 5 and 120 characters");
const description = z.string().trim().min(10, "Description must be between 10 and 5000 characters").max(5000, "Description must be between 10 and 5000 characters");
const category = z.string().trim().min(2, "Category must be between 2 and 50 characters").max(50, "Category must be between 2 and 50 characters");

export const createTicketBody = z.object({
  title,
  description,
  category,
  priority: z.enum(TICKET_PRIORITIES, { errorMap: () => ({ message: "Invalid priority" }) }).optional(),
});

export const updateTicketBody = z
  .object({ title: title.optional(), description: description.optional(), category: category.optional() })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Provide at least one field to update" });

export const listTicketsQuery = z.object({
  ...paginationQuery,
  status: optionalQuery(z.enum(TICKET_STATUSES)),
  priority: optionalQuery(z.enum(TICKET_PRIORITIES)),
  category: optionalQuery(z.string().trim().max(50)),
  search: optionalQuery(z.string().trim().max(100)),
  createdBy: optionalQuery(objectId("Invalid user ID")), // admin only (ignored for users)
  assignedTo: optionalQuery(objectId("Invalid user ID")), // admin only
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createCommentBody = z.object({
  message: z.string().trim().min(1, "Comment message is required").max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateTicketInput = z.infer<typeof createTicketBody>;
export type UpdateTicketInput = z.infer<typeof updateTicketBody>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuery>;
