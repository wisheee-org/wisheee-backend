import z from "zod";

export const CreateWishlistItemSchema = z.object({
  wishlistId: z.string().nonempty(),
  title: z.string().nonempty(),
  description: z.string().nullable().default(null),
  // link: z.string().url().optional().or(z.literal(""))
  link: z.string().nullable().default(null),
  price: z.coerce.number().int().nonnegative().nullable().default(null),
  // imageUrl: z.string().url().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
});

export const UpdateWishlistItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  link: z.string().nullable().optional(),
  price: z.coerce.number().int().nonnegative().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export type CreateWishlistItemType = z.infer<typeof CreateWishlistItemSchema>;
export type UpdateWishlistItemType = z.infer<typeof UpdateWishlistItemSchema>;
