import { getEnv } from "@/common/get-env-utils";
import jwt, { type JwtPayload } from "jsonwebtoken";
import ms, { type StringValue } from "ms";

export interface TokenPayload {
  userId: string;
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

export class JwtService {
  generateTokens(payload: TokenPayload): GeneratedAuthTokens {
    return {
      accessToken: this._generateAccessToken(payload),
      refreshTokenData: this._generateRefreshToken(payload),
    };
  }

  private _generateAccessToken(payload: TokenPayload): string {
    return jwt.sign({ sub: payload.userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  }

  private _generateRefreshToken(payload: TokenPayload): RefreshTokenData {
    const token = jwt.sign({ sub: payload.userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
    return {
      token,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    };
  }

  verifyAccessToken(token: string): JwtPayload | string {
    //  TODO обработка string в authMiddleware
    return jwt.verify(token, ACCESS_SECRET);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_SECRET);
  }
}
