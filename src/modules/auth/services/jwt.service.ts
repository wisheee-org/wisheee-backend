import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { ACCESS_EXPIRES_IN, ACCESS_SECRET, REFRESH_EXPIRES_IN, REFRESH_SECRET, REFRESH_TTL_MS } from "@/config/auth.config";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  sub: string; //userId
}

export interface GeneratedAuthTokens {
  accessToken: string;
  refreshTokenData: RefreshTokenData;
}
interface RefreshTokenData {
  token: string;
  expiresAt: Date;
}

export const jwtService = {
  generateTokens(payload: TokenPayload): GeneratedAuthTokens {
    return {
      accessToken: this._generateAccessToken(payload),
      refreshTokenData: this._generateRefreshToken(payload),
    };
  },

  _generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  },

  _generateRefreshToken(payload: TokenPayload): RefreshTokenData {
    const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
    return {
      token,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    };
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      if (typeof payload === "string") throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
      return payload as TokenPayload;
    } catch {
      throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
    }
  },

  verifyRefreshToken(token: string) {
    try {
      const payload = jwt.verify(token, REFRESH_SECRET);
      if (typeof payload === "string") throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
      return payload as TokenPayload;
    } catch {
      throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
    }
  },
};
