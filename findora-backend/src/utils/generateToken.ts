import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  role: string;
}

const ACCESS_SECRET = process.env.JWT_SECRET || "findora_dev_access_secret";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "findora_dev_refresh_secret";

export function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
