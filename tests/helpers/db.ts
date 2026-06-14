import type { PrismaClient } from "@prisma/client";

/** Wipe all rows between tests (respecting FK order). */
export async function truncateAll(db: PrismaClient): Promise<void> {
  await db.eventSignup.deleteMany();
  await db.authToken.deleteMany();
  await db.inviteToken.deleteMany();
  await db.event.deleteMany();
  await db.user.deleteMany();
}
