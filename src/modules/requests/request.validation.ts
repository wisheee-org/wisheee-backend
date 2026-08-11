import z from "zod";

export const CreateRequestSchema = z.object({
  addresseeId: z.string().trim().min(1),
});

export const ListRequestsSchema = z.object({
  direction: z.enum(["incoming", "outgoing"]).default("incoming"),
});

export const RequestIdParamsSchema = z.object({
  requestId: z.string().trim().min(1),
});

export type CreateRequestType = z.infer<typeof CreateRequestSchema>;
export type ListRequestsType = z.infer<typeof ListRequestsSchema>;
export type RequestIdParamsType = z.infer<typeof RequestIdParamsSchema>;
