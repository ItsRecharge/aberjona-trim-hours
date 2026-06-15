import type { HourReport } from "@prisma/client";
import { db } from "../db";
import { revokeAllUserSessions } from "./session-service";
import type { Role } from "../constants";

/**
 * Records an officer hours adjustment as a pre-approved HourReport. `hours` may
 * be negative to deduct hours; it flows through the normal earned-hours sum.
 */
export async function createAdjustment(input: {
  userId: number;
  description: string;
  date: Date;
  hours: number;
  officerId: number;
}): Promise<HourReport> {
  return db.hourReport.create({
    data: {
      userId: input.userId,
      description: input.description,
      date: input.date,
      hoursRequested: input.hours,
      status: "approved",
      reviewedById: input.officerId,
      reviewedAt: new Date(),
    },
  });
}

export async function setMemberRole(userId: number, role: Role): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { role } });
}

/** Deactivating a member also revokes their sessions so they're logged out. */
export async function setMemberActive(userId: number, active: boolean): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { deactivatedAt: active ? null : new Date() },
  });
  if (!active) await revokeAllUserSessions(userId);
}
