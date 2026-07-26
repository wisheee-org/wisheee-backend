import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { getEnv } from "@/common/get-env-utils";
import jwt from "jsonwebtoken";
import ms, { type StringValue } from "ms";

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

const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
const ACCESS_EXPIRES_IN = getEnv("JWT_ACCESS_EXPIRES_IN") as StringValue;
const REFRESH_EXPIRES_IN = getEnv("JWT_REFRESH_EXPIRES_IN") as StringValue;
const REFRESH_TTL_MS = ms(REFRESH_EXPIRES_IN as StringValue);

class JwtService {
  generateTokens(payload: TokenPayload): GeneratedAuthTokens {
    return {
      accessToken: this._generateAccessToken(payload),
      refreshTokenData: this._generateRefreshToken(payload),
    };
  }

  private _generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  }

  private _generateRefreshToken(payload: TokenPayload): RefreshTokenData {
    const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
    return {
      token,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      if (typeof payload === "string") throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
      return payload as TokenPayload;
    } catch {
      throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
    }
  }

  verifyRefreshToken(token: string) {
    try {
      const payload = jwt.verify(token, REFRESH_SECRET);
      if (typeof payload === "string") throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
      return payload as TokenPayload;
    } catch {
      throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");
    }
  }
}

export const jwtService = new JwtService();
