import { getEnv } from "@/common/get-env-utils";
import ms, { type StringValue } from "ms";

export const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");
export const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const ACCESS_EXPIRES_IN = getEnv("JWT_ACCESS_EXPIRES_IN") as StringValue;
export const REFRESH_EXPIRES_IN = getEnv("JWT_REFRESH_EXPIRES_IN") as StringValue;

export const ACCESS_TTL_MS = ms(REFRESH_EXPIRES_IN as StringValue);
export const REFRESH_TTL_MS = ms(REFRESH_EXPIRES_IN as StringValue);
