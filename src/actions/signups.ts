"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { signupForSlot, withdrawFromSlot } from "@/lib/services/slot-signup-service";
import { notifyWaitlistPromoted } from "@/lib/email/notify";
import { formatSlot } from "@/lib/format";
import { setFlash } from "@/lib/flash";
import { recordAudit } from "@/lib/services/audit-service";

export async function signupAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const timeslotId = Number(formData.get("timeslotId"));

  const outcome = await signupForSlot(timeslotId, member.id);
  switch (outcome) {
    case "confirmed":
      await setFlash("success", "You're confirmed for this timeslot.");
      break;
    case "waitlisted":
      await setFlash("info", "This slot is full — you've been added to the waitlist.");
      break;
    case "already":
      await setFlash("info", "You're already signed up for this timeslot.");
      break;
    default:
      await setFlash("warning", "This event is no longer open for sign-ups.");
  }

  revalidatePath("/member/events");
  redirect("/member/events");
}

export async function withdrawAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const timeslotId = Number(formData.get("timeslotId"));

  const { withdrawn, promotedUserId } = await withdrawFromSlot(timeslotId, member.id);
  if (withdrawn && promotedUserId) notifyPromotedLater(timeslotId, promotedUserId);

  await setFlash(
    withdrawn ? "info" : "warning",
    withdrawn
      ? "You've withdrawn from this timeslot."
      : "Couldn't withdraw — attendance may already be recorded.",
  );

  revalidatePath("/member/events");
  redirect("/member/events");
}

/** Officer removes a member from a timeslot (same rules as a self-withdraw). */
export async function removeSignupAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const timeslotId = Number(formData.get("timeslotId"));
  const userId = Number(formData.get("userId"));

  const [slot, user] = await Promise.all([
    db.timeslot.findUnique({
      where: { id: timeslotId },
      include: { event: { select: { id: true, title: true } } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    }),
  ]);

  const { withdrawn, promotedUserId } = await withdrawFromSlot(timeslotId, userId);
  if (withdrawn && promotedUserId) notifyPromotedLater(timeslotId, promotedUserId);

  if (withdrawn && slot && user) {
    await recordAudit({
      actor: officer,
      action: "signup.remove",
      summary: `Removed ${fullName(user)} from "${slot.event.title}" ${formatSlot(slot)}`,
      targetType: "event",
      targetId: slot.event.id,
    });
  }

  await setFlash(
    withdrawn ? "success" : "warning",
    withdrawn
      ? `Removed ${user ? fullName(user) : "member"} from this timeslot.`
      : "Couldn't remove — attendance may already be recorded.",
  );

  revalidatePath("/officer/events");
  redirect("/officer/events");
}

/** After the response, email a waitlister who was promoted into the slot. */
function notifyPromotedLater(timeslotId: number, promotedUserId: number) {
  after(async () => {
    const slot = await db.timeslot.findUnique({
      where: { id: timeslotId },
      include: { event: { select: { title: true } } },
    });
    if (slot) {
      await notifyWaitlistPromoted([promotedUserId], slot.event.title, formatSlot(slot));
    }
  });
}
