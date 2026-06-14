import { db } from "../db";
import { schoolYearRange, hoursRemaining } from "../hours";

export interface MemberProgress {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  earned: number;
  remaining: number;
}

/** Sum of attended signup hours for a user in the current school year. */
export async function hoursEarnedForUser(userId: number): Promise<number> {
  const { start, end } = schoolYearRange();
  const signups = await db.eventSignup.findMany({
    where: {
      userId,
      attended: true,
      event: { date: { gte: start, lte: end } },
    },
    include: { event: { select: { hoursValue: true } } },
  });
  return signups.reduce((sum, s) => sum + s.event.hoursValue, 0);
}

/** All members with computed hours, sorted by remaining (most-needed first). */
export async function listMembersWithProgress(): Promise<MemberProgress[]> {
  const { start, end } = schoolYearRange();
  const members = await db.user.findMany({
    where: { role: "member" },
    include: {
      signups: {
        where: { attended: true, event: { date: { gte: start, lte: end } } },
        include: { event: { select: { hoursValue: true } } },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return members
    .map((m) => {
      const earned = m.signups.reduce((sum, s) => sum + s.event.hoursValue, 0);
      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        emailVerifiedAt: m.emailVerifiedAt,
        createdAt: m.createdAt,
        earned,
        remaining: hoursRemaining(earned),
      };
    })
    .sort((a, b) => b.remaining - a.remaining);
}
