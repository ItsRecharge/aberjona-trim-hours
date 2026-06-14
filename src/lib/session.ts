import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "./constants";
import {
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session-token";

export type { SessionPayload };

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
