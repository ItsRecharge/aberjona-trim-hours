"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { eventSchema, eventRequestSchema } from "@/lib/validation";
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
import type { z } from "zod";

/** Collects the dynamic slot rows (parallel arrays) into objects for zod. */
function collectSlots(formData: FormData) {
  const dates = formData.getAll("slotDate");
  const starts = formData.getAll("slotStart");
  const ends = formData.getAll("slotEnd");
  const hours = formData.getAll("slotHours");
  const quotas = formData.getAll("slotQuota");
  return dates.map((date, i) => ({
    date: String(date),
    startTime: String(starts[i] ?? ""),
    endTime: String(ends[i] ?? ""),
    hoursValue: String(hours[i] ?? ""),
    quota: String(quotas[i] ?? ""),
  }));
}

function parseEvent<S extends typeof eventSchema | typeof eventRequestSchema>(
  formData: FormData,
  schema: S,
): z.SafeParseReturnType<unknown, z.infer<S>> {
  return schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    slots: collectSlots(formData),
  }) as z.SafeParseReturnType<unknown, z.infer<S>>;
}

async function eventSlots(eventId: number) {
  return db.timeslot.findMany({
    where: { eventId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: { date: true, startTime: true, endTime: true },
  });
}

export async function createEventAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const parsed = parseEvent(formData, eventSchema);
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect("/officer/events");
  }

  const event = await createEvent(parsed.data, officer.id);
  const slots = await eventSlots(event.id);
  after(() => notifyEventPosted({ title: event.title, slots }));

  await setFlash("success", `Event "${event.title}" created and members notified.`);
  revalidatePath("/officer/events");
  redirect("/officer/events");
}

export async function requestEventAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");
  const parsed = parseEvent(formData, eventRequestSchema);
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
    const slots = await eventSlots(event.id);
    after(async () => {
      await notifyRequestDecision(requesterId, event.title, true);
      await notifyEventPosted({ title: event.title, slots });
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
