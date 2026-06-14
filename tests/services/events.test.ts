import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { truncateAll } from "../helpers/db";
import { hashPassword } from "@/lib/services/auth-service";
import {
  approveRequest,
  createEvent,
  denyRequest,
  requestEvent,
} from "@/lib/services/event-service";
import {
  signupForEvent,
  withdrawFromEvent,
} from "@/lib/services/signup-event-service";
import { markAttendance } from "@/lib/services/attendance-service";
import { hoursEarnedForUser } from "@/lib/services/member-service";

async function makeUsers() {
  const officer = await db.user.create({
    data: {
      firstName: "O",
      lastName: "F",
      email: "o@test.local",
      passwordHash: await hashPassword("password123"),
      role: "officer",
      emailVerifiedAt: new Date(),
    },
  });
  const member = await db.user.create({
    data: {
      firstName: "M",
      lastName: "B",
      email: "m@test.local",
      passwordHash: await hashPassword("password123"),
      role: "member",
      emailVerifiedAt: new Date(),
    },
  });
  return { officer, member };
}

// A date guaranteed to be inside the current school year.
function inYear(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

beforeEach(() => truncateAll(db));

describe("event request lifecycle", () => {
  it("approves a pending request into an active event", async () => {
    const { officer, member } = await makeUsers();
    const req = await requestEvent(
      { title: "Bake Sale", date: inYear(), hoursValue: 2 },
      member.id,
    );
    expect(req.status).toBe("pending_approval");

    const approved = await approveRequest(req.id, officer.id);
    expect(approved?.status).toBe("active");
    expect(approved?.approvedById).toBe(officer.id);
  });

  it("denies a pending request (cancelled)", async () => {
    const { member } = await makeUsers();
    const req = await requestEvent(
      { title: "Car Wash", date: inYear(), hoursValue: 1 },
      member.id,
    );
    const denied = await denyRequest(req.id);
    expect(denied?.status).toBe("cancelled");
  });

  it("won't approve an event that isn't pending", async () => {
    const { officer } = await makeUsers();
    const event = await createEvent(
      { title: "Active", date: inYear(), hoursValue: 1 },
      officer.id,
    );
    expect(await approveRequest(event.id, officer.id)).toBeNull();
  });
});

describe("signups", () => {
  it("is idempotent on duplicate signup", async () => {
    const { officer, member } = await makeUsers();
    const event = await createEvent(
      { title: "Concert", date: inYear(), hoursValue: 2 },
      officer.id,
    );
    expect(await signupForEvent(event.id, member.id)).toBe("signed_up");
    expect(await signupForEvent(event.id, member.id)).toBe("already");
    expect(await db.eventSignup.count()).toBe(1);
  });

  it("blocks signup for non-active events", async () => {
    const { officer, member } = await makeUsers();
    const req = await requestEvent(
      { title: "Pending", date: inYear(), hoursValue: 1 },
      member.id,
    );
    expect(await signupForEvent(req.id, member.id)).toBe("not_active");
  });

  it("allows withdrawing before attendance is marked", async () => {
    const { officer, member } = await makeUsers();
    const event = await createEvent(
      { title: "Cleanup", date: inYear(), hoursValue: 1 },
      officer.id,
    );
    await signupForEvent(event.id, member.id);
    expect(await withdrawFromEvent(event.id, member.id)).toBe(true);
    expect(await db.eventSignup.count()).toBe(0);
  });
});

describe("attendance crediting", () => {
  it("credits hours, completes the event, and reports newly-credited members", async () => {
    const { officer, member } = await makeUsers();
    const event = await createEvent(
      { title: "Festival", date: inYear(), hoursValue: 3 },
      officer.id,
    );
    await signupForEvent(event.id, member.id);

    const result = await markAttendance(event.id, [member.id]);
    expect(result?.credited).toEqual([
      { userId: member.id, hours: 3, eventTitle: "Festival" },
    ]);

    const updated = await db.event.findUnique({ where: { id: event.id } });
    expect(updated?.status).toBe("completed");
    expect(await hoursEarnedForUser(member.id)).toBe(3);
  });

  it("does not re-credit an already-attended member", async () => {
    const { officer, member } = await makeUsers();
    const event = await createEvent(
      { title: "Repeat", date: inYear(), hoursValue: 2 },
      officer.id,
    );
    await signupForEvent(event.id, member.id);
    await markAttendance(event.id, [member.id]);
    const second = await markAttendance(event.id, [member.id]);
    expect(second?.credited).toHaveLength(0);
    expect(await hoursEarnedForUser(member.id)).toBe(2);
  });
});
