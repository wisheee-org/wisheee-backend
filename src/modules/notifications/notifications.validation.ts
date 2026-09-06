import z from "zod";

export const CreateNotificationSchema = z.object({
  addresseeId: z.string().trim().min(1),
});

export const ListRequestsSchema = z.object({
  direction: z.enum(["incoming", "outgoing"]).default("incoming"),
});

export const RequestIdParamsSchema = z.object({
  requestId: z.string().trim().min(1),
});

export type CreateNotificationType = z.infer<typeof CreateNotificationSchema>;
export type ListRequestsType = z.infer<typeof ListRequestsSchema>;
export type RequestIdParamsType = z.infer<typeof RequestIdParamsSchema>;
