import crypto from "crypto";

const VERIFICATION_TOKEN_TTL = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? 15 * 60 * 1000);

export class VerificationTokenService {
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
  hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
  getExpiresAt(): Date {
    return new Date(Date.now() + VERIFICATION_TOKEN_TTL);
  }
}
