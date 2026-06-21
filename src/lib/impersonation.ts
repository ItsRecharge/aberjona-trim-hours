import { cookies } from "next/headers";
import { db } from "./db";
import { fullName, getCurrentUser } from "./current-user";
import { getSessionClaims } from "./session";
import { verifySessionToken } from "./session-token";
import { revokeSession } from "./services/session-service";
import { recordAudit } from "./services/audit-service";
import {
  IMPERSONATOR_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./constants";

/**
 * If an impersonation is active, end it: revoke the impersonated session and
 * restore the admin's own session from the stashed cookie. Returns true if an
 * impersonation was ended (so callers can redirect back to the admin area instead
 * of logging out).
 */
export async function endImpersonationIfActive(): Promise<boolean> {
  const jar = await cookies();
  const saved = jar.get(IMPERSONATOR_COOKIE)?.value;
  if (!saved) return false;

  const impersonated = await getCurrentUser();

  // Resolve the admin from the stashed token (not a cookie re-read) for the audit.
  const adminClaims = await verifySessionToken(saved);
  const adminSession = adminClaims
    ? await db.session.findUnique({ where: { id: adminClaims.sid }, include: { user: true } })
    : null;

  const claims = await getSessionClaims();
  if (claims) await revokeSession(claims.sid);

  jar.set(SESSION_COOKIE, saved, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  jar.delete(IMPERSONATOR_COOKIE);

  if (adminSession?.user) {
    await recordAudit({
      actor: adminSession.user,
      action: "impersonate.stop",
      summary: `Stopped impersonating ${impersonated ? fullName(impersonated) : "a user"}`,
      targetType: "user",
      targetId: impersonated?.id,
    });
  }
  return true;
}
