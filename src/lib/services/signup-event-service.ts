import { Prisma } from "@prisma/client";
import { db } from "../db";

export type SignupOutcome = "signed_up" | "already" | "not_active";

export async function signupForEvent(
  eventId: number,
  userId: number,
): Promise<SignupOutcome> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "active") return "not_active";
  try {
    await db.eventSignup.create({ data: { eventId, userId } });
    return "signed_up";
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return "already";
    }
    throw err;
  }
}

export async function withdrawFromEvent(
  eventId: number,
  userId: number,
): Promise<boolean> {
  const result = await db.eventSignup.deleteMany({
    where: { eventId, userId, attended: false },
  });
  return result.count > 0;
}
