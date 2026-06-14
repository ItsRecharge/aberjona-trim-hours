"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import {
  signupForEvent,
  withdrawFromEvent,
} from "@/lib/services/signup-event-service";
import { setFlash } from "@/lib/flash";

export async function signupAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const eventId = Number(formData.get("eventId"));

  const outcome = await signupForEvent(eventId, member.id);
  if (outcome === "signed_up") {
    await setFlash("success", "You're signed up for this event.");
  } else if (outcome === "already") {
    await setFlash("info", "You're already signed up for this event.");
  } else {
    await setFlash("warning", "This event is no longer open for sign-ups.");
  }

  revalidatePath("/member/events");
  redirect("/member/events");
}

export async function withdrawAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const eventId = Number(formData.get("eventId"));

  const removed = await withdrawFromEvent(eventId, member.id);
  await setFlash(
    removed ? "info" : "warning",
    removed ? "You've withdrawn from this event." : "Couldn't withdraw from this event.",
  );

  revalidatePath("/member/events");
  redirect("/member/events");
}
