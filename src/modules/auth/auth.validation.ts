import z from "zod";

export const SignUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Минимум 8 символов").max(16, "Максимум 16 символов"),
  username: z.string().min(2, "Минимум 2 символа"),
});

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Неверный пароль").max(16, "Неверный пароль"),
});

export const EmailSchema = z.object({
  email: z.email(),
});

export const TokenSchema = z.object({
  token: z.string(),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type SignInSchemaType = z.infer<typeof SignInSchema>;
export type EmailSchemaType = z.infer<typeof EmailSchema>;
export type TokenSchemaType = z.infer<typeof TokenSchema>;
