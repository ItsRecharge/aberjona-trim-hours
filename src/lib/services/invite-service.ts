import type { InviteToken, Prisma } from "@prisma/client";
import { db } from "../db";
import { generateToken, hashToken } from "../tokens";
import { generateInviteCode, normalizeInviteCode } from "../invite-code";
import type { InviteKind, Role } from "../constants";

export type InviteValidation =
  | { valid: true; invite: InviteToken; reason?: undefined }
  | { valid: false; reason: "not_found" | "revoked" | "expired" | "exhausted"; invite?: undefined };

/**
 * Creates an invite. Link invites are used via the raw token in a URL; code
 * invites also get a short human-typable code that is stored in plain text so
 * officers can see it again in the invites table.
 */
export async function createInvite(params: {
  createdById: number;
  role: Role;
  expiresInDays: number;
  maxUses?: number;
  kind?: InviteKind;
  email?: string;
}): Promise<{ invite: InviteToken; rawToken: string; code: string | null }> {
  const rawToken = generateToken();
  const data = {
    tokenHash: hashToken(rawToken),
    createdById: params.createdById,
    role: params.role,
    expiresAt: new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000),
    maxUses: params.maxUses ?? null,
    email: params.email ?? null,
  };
  if (params.kind !== "code") {
    const invite = await db.inviteToken.create({ data });
    return { invite, rawToken, code: null };
  }
  // Retry once on the (very unlikely) unique-code collision.
  for (let attempt = 0; ; attempt++) {
    const code = generateInviteCode();
    try {
      const invite = await db.inviteToken.create({ data: { ...data, code } });
      return { invite, rawToken, code };
    } catch (err) {
      if (attempt >= 1) throw err;
    }
  }
}

type Client = Pick<typeof db, "inviteToken"> | Prisma.TransactionClient;

/** Looks up an invite by raw link token or by typed code. */
export async function findInviteByRaw(raw: string, client: Client = db): Promise<InviteToken | null> {
  const code = normalizeInviteCode(raw);
  return client.inviteToken.findFirst({
    where: { OR: [{ tokenHash: hashToken(raw) }, ...(code ? [{ code }] : [])] },
  });
}

export async function validateInvite(raw: string): Promise<InviteValidation> {
  const invite = await findInviteByRaw(raw);
  if (!invite) return { valid: false, reason: "not_found" };
  if (invite.revokedAt) return { valid: false, reason: "revoked" };
  if (invite.expiresAt < new Date()) return { valid: false, reason: "expired" };
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return { valid: false, reason: "exhausted" };
  }
  return { valid: true, invite };
}

export async function revokeInvite(id: number): Promise<void> {
  await db.inviteToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function listActiveInvites(): Promise<
  (InviteToken & { createdBy: { firstName: string; lastName: string } })[]
> {
  return db.inviteToken.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
}
