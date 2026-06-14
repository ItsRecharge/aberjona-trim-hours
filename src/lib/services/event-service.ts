import type { Event } from "@prisma/client";
import { db } from "../db";
import type { TimeslotInput } from "../validation";
import { promoteWaitlist } from "./slot-signup-service";

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  slots: TimeslotInput[];
}

function eventData(input: CreateEventInput) {
  return {
    title: input.title,
    description: input.description ?? null,
    location: input.location ?? null,
    timeslots: {
      create: input.slots.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        hoursValue: s.hoursValue,
        quota: s.quota,
      })),
    },
  };
}

export async function createEvent(
  input: CreateEventInput,
  officerId: number,
): Promise<Event> {
  return db.event.create({
    data: {
      ...eventData(input),
      status: "active",
      createdById: officerId,
      approvedById: officerId,
    },
  });
}

export async function requestEvent(
  input: CreateEventInput,
  memberId: number,
): Promise<Event> {
  return db.event.create({
    data: {
      ...eventData(input),
      status: "pending_approval",
      createdById: memberId,
    },
  });
}

export async function approveRequest(
  eventId: number,
  officerId: number,
): Promise<Event | null> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "pending_approval") return null;
  return db.event.update({
    where: { id: eventId },
    data: { status: "active", approvedById: officerId },
  });
}

export async function denyRequest(eventId: number): Promise<Event | null> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "pending_approval") return null;
  return db.event.update({
    where: { id: eventId },
    data: { status: "cancelled" },
  });
}

/**
 * Raises (or changes) a slot's quota and promotes FIFO waitlisters up to the new
 * capacity. Returns the userIds promoted so the caller can notify them.
 */
export async function updateSlotQuota(
  timeslotId: number,
  quota: number,
): Promise<number[]> {
  await db.timeslot.update({ where: { id: timeslotId }, data: { quota } });
  return promoteWaitlist(timeslotId);
}

export async function listEvents() {
  return db.event.findMany({
    include: {
      timeslots: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: { signups: { select: { status: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingRequests() {
  return db.event.findMany({
    where: { status: "pending_approval" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      timeslots: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Active events with per-slot fill counts and this member's own signup state. */
export async function listActiveEventsForMember(memberId: number) {
  return db.event.findMany({
    where: { status: "active" },
    include: {
      timeslots: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
          signups: { select: { userId: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
