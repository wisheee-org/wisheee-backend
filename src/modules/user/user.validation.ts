import z from "zod";

export const UpdateUserSchema = z.object({
  username: z.string().min(2, "Минимум 2 символа").optional(),
  avatar: z.string().nullable().optional(),
});

export const SearchUsersSchema = z.object({
  q: z.string().trim().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
export type SearchUserType = z.infer<typeof SearchUsersSchema>;
