import { z } from "zod";
import { paginationQuery } from "../../lib/pagination";
import { emailField } from "../auth/auth.schema";

export const customerSegment = z.enum(["new", "returning", "vip"]);

export const listCustomersQuery = paginationQuery.extend({
  segment: customerSegment.optional(),
});

export const createCustomerBody = z.object({
  email: emailField,
  name: z.string().trim().min(1, { error: "El nombre es obligatorio" }).max(100),
});

export const updateCustomerBody = createCustomerBody.partial();

export type CustomerSegment = z.infer<typeof customerSegment>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuery>;
export type CreateCustomerInput = z.infer<typeof createCustomerBody>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerBody>;
