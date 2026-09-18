import type { Strike } from "@prisma/client";
import { db } from "../db";
import { MAX_STRIKES } from "../constants";
import { setMemberActive } from "./roster-service";

export type StrikeRow = Strike & { issuedBy: { firstName: string; lastName: string } };

/** A member's strikes, newest first, with the issuing officer's name. */
export function listStrikes(userId: number): Promise<StrikeRow[]> {
  return db.strike.findMany({
    where: { userId },
    include: { issuedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function countStrikes(userId: number): Promise<number> {
  return db.strike.count({ where: { userId } });
}

/**
 * Records a strike. Reaching MAX_STRIKES removes the member from the chapter
 * via the normal deactivation path (login blocked, sessions revoked).
 */
export async function issueStrike(input: {
  userId: number;
  issuedById: number;
  reason: string;
}): Promise<{ strike: Strike; count: number; removed: boolean }> {
  const strike = await db.strike.create({ data: input });
  const count = await countStrikes(input.userId);
  const removed = count >= MAX_STRIKES;
  if (removed) await setMemberActive(input.userId, false);
  return { strike, count, removed };
}
