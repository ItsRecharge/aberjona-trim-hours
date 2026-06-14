// Pure JWT sign/verify — no next/headers import, so it is safe to use from
// middleware (edge runtime) as well as server components and actions.
import { SignJWT, jwtVerify } from "jose";
import { SESSION_TTL_SECONDS, type Role } from "./constants";

export interface SessionPayload {
  userId: number;
  role: Role;
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = Number(payload.sub);
    const role = payload.role;
    if (!Number.isInteger(userId) || (role !== "member" && role !== "officer")) {
      return null;
    }
    return { userId, role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
