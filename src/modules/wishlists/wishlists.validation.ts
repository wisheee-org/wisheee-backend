import z from "zod";

export const CreateWishlistSchema = z.object({
  title: z.string().nonempty(),
  description: z.string(),
  isPublic: z.boolean().default(true),
});

export const UpdateWishlistSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type CreateWishlistType = z.infer<typeof CreateWishlistSchema>;
export type UpdateWishlistType = z.infer<typeof UpdateWishlistSchema>;
