import z from "zod";

export const UpdateUserSchema = z.object({
  username: z.string().min(2, "Минимум 2 символа").optional(),
  avatar: z.string().nullable().optional(),
});

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
