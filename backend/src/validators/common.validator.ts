import { z } from "zod";

export const objectId = (msg = "Invalid ID") => z.string().regex(/^[a-f\d]{24}$/i, msg);

export const idParams = z.object({ id: objectId("Invalid ID") });

/** Treat empty query values (`?status=`) as "not provided" — common from frontend forms. */
export const optionalQuery = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};
