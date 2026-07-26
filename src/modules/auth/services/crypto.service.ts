import crypto from "crypto";

export class CryptoService {
  sha256(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  randomToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
