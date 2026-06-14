import type { Event } from "@prisma/client";
import { db } from "../db";

export interface CreateEventInput {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  hoursValue: number;
}

export async function createEvent(
  input: CreateEventInput,
  officerId: number,
): Promise<Event> {
  return db.event.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      date: input.date,
      hoursValue: input.hoursValue,
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
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      date: input.date,
      hoursValue: input.hoursValue,
      status: "pending_approval",
      createdById: memberId,
    },
  });
}

/** Approves a pending request → active. Returns the event, or null if not pending. */
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

export async function listEvents() {
  return db.event.findMany({
    include: { _count: { select: { signups: true } } },
    orderBy: { date: "desc" },
  });
}

export async function listPendingRequests() {
  return db.event.findMany({
    where: { status: "pending_approval" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function listActiveEventsForMember(memberId: number) {
  return db.event.findMany({
    where: { status: "active" },
    include: { signups: { where: { userId: memberId }, select: { id: true } } },
    orderBy: { date: "asc" },
  });
}
