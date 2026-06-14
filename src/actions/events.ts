"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser, fullName } from "@/lib/current-user";
import { eventSchema } from "@/lib/validation";
import {
  approveRequest,
  createEvent,
  denyRequest,
  requestEvent,
} from "@/lib/services/event-service";
import {
  notifyEventPosted,
  notifyNewRequest,
  notifyRequestDecision,
} from "@/lib/email/notify";
import { setFlash } from "@/lib/flash";

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    location: formData.get("location") || undefined,
    hoursValue: formData.get("hoursValue"),
  });
}

export async function createEventAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect("/officer/events");
  }

  const event = await createEvent(parsed.data, officer.id);
  after(() =>
    notifyEventPosted({
      title: event.title,
      date: event.date,
      hoursValue: event.hoursValue,
    }),
  );

  await setFlash("success", `Event "${event.title}" created and members notified.`);
  revalidatePath("/officer/events");
  redirect("/officer/events");
}

export async function requestEventAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect("/member/request-event");
  }

  const event = await requestEvent(parsed.data, member.id);
  after(() => notifyNewRequest(event.title, fullName(member)));

  await setFlash("success", "Your event request was submitted for officer approval.");
  revalidatePath("/member/dashboard");
  redirect("/member/dashboard");
}

export async function approveRequestAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const eventId = Number(formData.get("eventId"));

  const event = await approveRequest(eventId, officer.id);
  if (event) {
    const requesterId = event.createdById;
    after(async () => {
      await notifyRequestDecision(requesterId, event.title, true);
      await notifyEventPosted({
        title: event.title,
        date: event.date,
        hoursValue: event.hoursValue,
      });
    });
    await setFlash("success", `Approved "${event.title}". Members have been notified.`);
  } else {
    await setFlash("warning", "That request could not be approved.");
  }

  revalidatePath("/officer/requests");
  redirect("/officer/requests");
}

export async function denyRequestAction(formData: FormData): Promise<void> {
  await requireUser("officer");
  const eventId = Number(formData.get("eventId"));

  const event = await denyRequest(eventId);
  if (event) {
    const requesterId = event.createdById;
    after(() => notifyRequestDecision(requesterId, event.title, false));
    await setFlash("info", `Denied "${event.title}".`);
  } else {
    await setFlash("warning", "That request could not be denied.");
  }

  revalidatePath("/officer/requests");
  redirect("/officer/requests");
}
