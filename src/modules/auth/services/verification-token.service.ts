import { CryptoService } from "./crypto.service";

const VERIFICATION_TOKEN_TTL_MS = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? 15 * 60 * 1000);

interface VerificationTokenData {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export class VerificationTokenService {
  private _cryptoService = new CryptoService();

  generate(): VerificationTokenData {
    const token = this._cryptoService.randomToken();

    return {
      token,
      tokenHash: this._cryptoService.sha256(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    };
  }
}
