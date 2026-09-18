import { SignJWT, jwtVerify } from "jose";
import { OPS_GRANT_TTL_SECONDS } from "./constants";

export interface OpsGrantClaims {
  userId: number;
  email: string;
  admin: boolean;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signOpsGrant(claims: OpsGrantClaims): Promise<string> {
  return new SignJWT({ email: claims.email, admin: claims.admin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(claims.userId))
    .setIssuedAt()
    .setExpirationTime(`${OPS_GRANT_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyOpsGrant(token: string): Promise<OpsGrantClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = Number(payload.sub);
    const email = payload.email;
    const admin = payload.admin;
    if (!Number.isInteger(userId) || typeof email !== "string" || typeof admin !== "boolean") {
      return null;
    }
    return { userId, email: email.toLowerCase(), admin };
  } catch {
    return null;
  }
}