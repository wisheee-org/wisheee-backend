import * as z from "zod";

export const SignUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Минимум 8 символов").max(16, "Максимум 16 символов"),
  username: z.string().min(2, "Минимум 2 символа"),
});

export const TokenSchema = z.object({
  token: z.string(),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type TokenSchemaType = z.infer<typeof TokenSchema>;
