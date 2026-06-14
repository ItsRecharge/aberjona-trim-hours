import { db } from "../db";

export interface AttendanceCredit {
  userId: number;
  hours: number;
  eventTitle: string;
}

/**
 * Marks attendance for an event and completes it, in one transaction.
 * `presentUserIds` is the set of signup user IDs checked present.
 * Returns the newly-credited members (those flipped from not-attended →
 * attended) so the caller can notify them and back them up to Sheets.
 */
export async function markAttendance(
  eventId: number,
  presentUserIds: number[],
): Promise<{ credited: AttendanceCredit[]; eventTitle: string } | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { signups: true },
  });
  if (!event) return null;

  const present = new Set(presentUserIds);
  const newlyCredited = event.signups.filter(
    (s) => present.has(s.userId) && !s.attended,
  );

  await db.$transaction([
    ...event.signups.map((s) =>
      db.eventSignup.update({
        where: { id: s.id },
        data: {
          attended: present.has(s.userId),
          markedById: present.has(s.userId) ? event.createdById : null,
        },
      }),
    ),
    db.event.update({ where: { id: eventId }, data: { status: "completed" } }),
  ]);

  return {
    eventTitle: event.title,
    credited: newlyCredited.map((s) => ({
      userId: s.userId,
      hours: event.hoursValue,
      eventTitle: event.title,
    })),
  };
}

export async function getEventWithSignups(eventId: number) {
  return db.event.findUnique({
    where: { id: eventId },
    include: {
      signups: {
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { user: { firstName: "asc" } },
      },
    },
  });
}
