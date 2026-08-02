import z from "zod";

export const CreateWishlistSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().nullable().default(null),
  isPublic: z.boolean().default(false),
});

export const UpdateWishlistSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export type WishlistType = z.infer<typeof CreateWishlistSchema>;
export type UpdateWishlistType = z.infer<typeof UpdateWishlistSchema>;
