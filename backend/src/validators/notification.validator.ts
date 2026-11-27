import { z } from "zod";
import { optionalQuery, paginationQuery } from "./common.validator";

export const listNotificationsQuery = z.object({
  ...paginationQuery,
  unread: optionalQuery(z.enum(["true", "false"]).transform((v) => v === "true")),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;
