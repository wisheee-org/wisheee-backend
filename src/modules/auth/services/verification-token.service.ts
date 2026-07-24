import crypto from "crypto";

const VERIFICATION_TOKEN_TTL_MS = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? 15 * 60 * 1000);

interface VerificationTokenData {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export class VerificationTokenService {
  generate(): VerificationTokenData {
    const token = crypto.randomBytes(32).toString("hex");

    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    };
  }
  hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
