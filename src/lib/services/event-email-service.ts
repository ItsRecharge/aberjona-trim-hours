import { db } from "@/lib/db";

/** Event with its timeslots and each slot's signups (for the recipient picker). */
export async function getEventForEmail(eventId: number) {
  return db.event.findUnique({
    where: { id: eventId },
    include: {
      timeslots: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
          signups: {
            select: {
              id: true,
              status: true,
              user: { select: { firstName: true, lastName: true } },
            },
            orderBy: [{ status: "asc" }, { signedUpAt: "asc" }],
          },
        },
      },
    },
  });
}

export interface EmailRecipients {
  eventTitle: string;
  emails: string[];
}

/**
 * Verified, active, de-duplicated emails behind the chosen signup ids.
 * Returns null if the event doesn't exist or any id isn't a signup of it.
 */
export async function resolveEmailRecipients(
  eventId: number,
  signupIds: number[],
): Promise<EmailRecipients | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  if (!event) return null;

  const ids = [...new Set(signupIds)];
  const found = await db.eventSignup.findMany({
    where: { id: { in: ids }, timeslot: { eventId } },
    select: { userId: true },
  });
  if (found.length !== ids.length) return null;

  const userIds = [...new Set(found.map((s) => s.userId))];
  const users = await db.user.findMany({
    where: { id: { in: userIds }, emailVerifiedAt: { not: null }, deactivatedAt: null },
    select: { email: true },
    orderBy: { email: "asc" },
  });
  return { eventTitle: event.title, emails: users.map((u) => u.email) };
}
