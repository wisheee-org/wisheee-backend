import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function _isRetryableTransactionError(error: unknown): error is { code: "P2002" | "P2034" } {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "P2002" || error.code === "P2034";
}

export async function runSerializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (e) {
      if (attempt === 1 || !_isRetryableTransactionError(e)) throw e;
    }
  }

  throw new Error("Unreachable transaction retry state");
}
