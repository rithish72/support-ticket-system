import { z } from "zod";
import { ROLES, TICKET_PRIORITIES, TICKET_STATUSES } from "../constants";
import { objectId, optionalQuery, paginationQuery } from "./common.validator";

export const updateStatusBody = z.object({
  status: z.enum(TICKET_STATUSES, { errorMap: () => ({ message: "Invalid ticket status" }) }),
});

export const updatePriorityBody = z.object({
  priority: z.enum(TICKET_PRIORITIES, { errorMap: () => ({ message: "Invalid ticket priority" }) }),
});

export const assignTicketBody = z.object({ assigneeId: objectId("Invalid user ID").nullable() });

export const listUsersQuery = z.object({
  ...paginationQuery,
  search: optionalQuery(z.string().trim().max(100)),
  role: optionalQuery(z.enum(ROLES)),
});

export const updateUserStatusBody = z.object({ isActive: z.boolean() });

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
