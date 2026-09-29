import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    wishlistItem: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { wishlistItemService } from "./item.service";

const item = {
  id: "item-1",
  wishlistId: "wishlist-1",
  title: "Gift",
  description: "",
  link: "",
  price: null,
  image: "",
  reserverId: null,
  createdAt: new Date("2026-09-28T00:00:00.000Z"),
  updatedAt: new Date("2026-09-28T00:00:00.000Z"),
  wishlist: { ownerId: "owner" },
};

describe("wishlistItemService.reserve", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reserves a free item using a conditional update", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue(item);
    prismaMock.wishlistItem.updateMany.mockResolvedValue({ count: 1 });

    await expect(wishlistItemService.reserve("viewer", item.id)).resolves.toMatchObject({
      id: item.id,
      reserverId: "viewer",
    });
    expect(prismaMock.wishlistItem.updateMany).toHaveBeenCalledWith({
      where: { id: item.id, reserverId: null },
      data: { reserverId: "viewer" },
    });
  });

  it("removes the current user's reservation", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue({ ...item, reserverId: "viewer" });
    prismaMock.wishlistItem.updateMany.mockResolvedValue({ count: 1 });

    await expect(wishlistItemService.reserve("viewer", item.id)).resolves.toMatchObject({
      id: item.id,
      reserverId: null,
    });
    expect(prismaMock.wishlistItem.updateMany).toHaveBeenCalledWith({
      where: { id: item.id, reserverId: "viewer" },
      data: { reserverId: null },
    });
  });

  it("rejects an item reserved by another user", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue({ ...item, reserverId: "other-user" });

    await expect(wishlistItemService.reserve("viewer", item.id)).rejects.toMatchObject({
      statusCode: 409,
      code: "ALREADY_RESERVED",
    });
    expect(prismaMock.wishlistItem.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a stale reservation update", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue(item);
    prismaMock.wishlistItem.updateMany.mockResolvedValue({ count: 0 });

    await expect(wishlistItemService.reserve("viewer", item.id)).rejects.toMatchObject({
      statusCode: 409,
      code: "RESERVATION_CHANGED",
    });
  });
});
