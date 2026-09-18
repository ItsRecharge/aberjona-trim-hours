import type { HourReport, User } from "@prisma/client";
import { db } from "../db";
import { revokeAllUserSessions } from "./session-service";
import type { Role } from "../constants";
import { isAdmin } from "./admin-service";

export interface OfficerRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  deactivatedAt: Date | null;
  isAdmin: boolean;
  createdAt: Date;
}

/** Every officer account. Admins are protected until admin is revoked. */
export async function listOfficers(): Promise<OfficerRow[]> {
  return db.user.findMany({
    where: { role: "officer" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      deactivatedAt: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: { firstName: "asc" },
  });
}

export class AdminProtectionError extends Error {
  constructor() {
    super("Admin accounts can't be demoted or deactivated. Revoke admin first.");
    this.name = "AdminProtectionError";
  }
}

async function assertNotAdmin(userId: number): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (user && isAdmin(user)) {
    throw new AdminProtectionError();
  }
}

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

/** Any officer may promote a member to officer; only admins may demote. */
export function canSetRole(actor: Pick<User, "isAdmin">, role: Role): boolean {
  return role === "officer" || actor.isAdmin;
}

export async function setMemberRole(userId: number, role: Role): Promise<void> {
  if (role === "member" || role === "officer") {
    await assertNotAdmin(userId);
  }
  await db.user.update({ where: { id: userId }, data: { role } });
}

/** Deactivating a member also revokes their sessions so they're logged out. */
export async function setMemberActive(userId: number, active: boolean): Promise<void> {
  if (!active) {
    await assertNotAdmin(userId);
  }
  await db.user.update({
    where: { id: userId },
    data: { deactivatedAt: active ? null : new Date() },
  });
  if (!active) await revokeAllUserSessions(userId);
}
