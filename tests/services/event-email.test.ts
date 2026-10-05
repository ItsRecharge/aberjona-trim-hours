import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { truncateAll } from "../helpers/db";
import { hashPassword } from "@/lib/services/auth-service";
import { createEvent } from "@/lib/services/event-service";
import { signupForSlot } from "@/lib/services/slot-signup-service";
import {
  getEventForEmail,
  resolveEmailRecipients,
} from "@/lib/services/event-email-service";
import { emailEventSignups } from "@/lib/email/notify";
import { sendMailBatch } from "@/lib/email/mailer";

vi.mock("@/lib/email/mailer", () => ({ sendMailBatch: vi.fn() }));

async function makeOfficer() {
  return db.user.create({
    data: {
      firstName: "Olive",
      lastName: "Officer",
      email: "o@test.local",
      passwordHash: await hashPassword("password123"),
      role: "officer",
      emailVerifiedAt: new Date(),
    },
  });
}
async function makeMember(
  email: string,
  extra: { emailVerifiedAt?: Date | null; deactivatedAt?: Date | null } = {},
) {
  return db.user.create({
    data: {
      firstName: "M",
      lastName: email,
      email,
      passwordHash: await hashPassword("password123"),
      role: "member",
      emailVerifiedAt: new Date(),
      ...extra,
    },
  });
}
function slot(startTime = "09:00", quota = 5) {
  return {
    date: new Date("2026-10-03T00:00:00.000Z"),
    startTime,
    endTime: "11:00",
    hoursValue: 2,
    quota,
  };
}
async function slotIds(eventId: number) {
  const slots = await db.timeslot.findMany({ where: { eventId }, orderBy: { startTime: "asc" } });
  return slots.map((s) => s.id);
}
async function signupId(timeslotId: number, userId: number) {
  await signupForSlot(timeslotId, userId);
  return (await db.eventSignup.findUniqueOrThrow({
    where: { timeslotId_userId: { timeslotId, userId } },
  })).id;
}

beforeEach(async () => {
  await truncateAll(db);
  vi.clearAllMocks();
  vi.mocked(sendMailBatch).mockImplementation(async (recipients) => ({
    unconfigured: false,
    sent: recipients.length,
    failed: [],
  }));
});

describe("getEventForEmail", () => {
  it("returns slots in order with signups confirmed-first", async () => {
    const officer = await makeOfficer();
    const [a, b] = [await makeMember("a@test.local"), await makeMember("b@test.local")];
    const event = await createEvent(
      { title: "E", slots: [slot("13:00"), slot("09:00", 1)] },
      officer.id,
    );
    const [early] = await slotIds(event.id);
    await signupForSlot(early, a.id); // confirmed
    await signupForSlot(early, b.id); // waitlisted

    const loaded = await getEventForEmail(event.id);
    expect(loaded?.timeslots.map((s) => s.startTime)).toEqual(["09:00", "13:00"]);
    expect(loaded?.timeslots[0].signups.map((s) => s.status)).toEqual([
      "confirmed",
      "waitlisted",
    ]);
    expect(loaded?.timeslots[0].signups[0].user.firstName).toBe("M");
  });

  it("returns null for a missing event", async () => {
    expect(await getEventForEmail(999)).toBeNull();
  });
});

describe("resolveEmailRecipients", () => {
  it("returns only the emails behind the chosen signup ids", async () => {
    const officer = await makeOfficer();
    const [a, b] = [await makeMember("a@test.local"), await makeMember("b@test.local")];
    const event = await createEvent({ title: "E", slots: [slot()] }, officer.id);
    const [s] = await slotIds(event.id);
    const idA = await signupId(s, a.id);
    await signupId(s, b.id);

    const result = await resolveEmailRecipients(event.id, [idA]);
    expect(result).toEqual({ eventTitle: "E", emails: ["a@test.local"] });
  });

  it("excludes unverified and deactivated members", async () => {
    const officer = await makeOfficer();
    const a = await makeMember("a@test.local");
    const unverified = await makeMember("u@test.local", { emailVerifiedAt: null });
    const gone = await makeMember("d@test.local", { deactivatedAt: new Date() });
    const event = await createEvent({ title: "E", slots: [slot()] }, officer.id);
    const [s] = await slotIds(event.id);
    const ids = [
      await signupId(s, a.id),
      await signupId(s, unverified.id),
      await signupId(s, gone.id),
    ];

    const result = await resolveEmailRecipients(event.id, ids);
    expect(result?.emails).toEqual(["a@test.local"]);
  });

  it("de-duplicates a member signed up for two slots", async () => {
    const officer = await makeOfficer();
    const a = await makeMember("a@test.local");
    const event = await createEvent(
      { title: "E", slots: [slot("09:00"), slot("13:00")] },
      officer.id,
    );
    const [s1, s2] = await slotIds(event.id);
    const ids = [await signupId(s1, a.id), await signupId(s2, a.id)];

    const result = await resolveEmailRecipients(event.id, ids);
    expect(result?.emails).toEqual(["a@test.local"]);
  });

  it("returns null when an id belongs to another event", async () => {
    const officer = await makeOfficer();
    const a = await makeMember("a@test.local");
    const event = await createEvent({ title: "E", slots: [slot()] }, officer.id);
    const other = await createEvent({ title: "Other", slots: [slot()] }, officer.id);
    const [s] = await slotIds(event.id);
    const [os] = await slotIds(other.id);
    const mine = await signupId(s, a.id);
    const theirs = await signupId(os, a.id);

    expect(await resolveEmailRecipients(event.id, [mine, theirs])).toBeNull();
    expect(await resolveEmailRecipients(event.id, [999])).toBeNull();
  });

  it("returns null for a missing event", async () => {
    expect(await resolveEmailRecipients(999, [1])).toBeNull();
  });
});

describe("emailEventSignups", () => {
  const officer = { firstName: "Olive", lastName: "Officer", email: "o@test.local" };

  it("sends one batched BCC email with reply-to set to the officer", async () => {
    const result = await emailEventSignups({
      emails: ["a@test.local", "b@test.local"],
      subject: "Call time",
      body: "Meet at 3pm.",
      officer,
    });
    expect(result).toEqual({ unconfigured: false, sent: 2, failed: [] });
    expect(sendMailBatch).toHaveBeenCalledTimes(1);
    const [recipients, msg] = vi.mocked(sendMailBatch).mock.calls[0];
    expect(recipients).toEqual(["a@test.local", "b@test.local"]);
    expect(msg.replyTo).toBe("o@test.local");
    expect(msg.subject).toBe("Tri-M Hours - Call time");
    expect(msg.html).toContain("Sent by Olive Officer");
  });

  it("passes through the unconfigured result", async () => {
    vi.mocked(sendMailBatch).mockResolvedValue({ unconfigured: true, sent: 0, failed: [] });
    const result = await emailEventSignups({
      emails: ["a@test.local"],
      subject: "S",
      body: "B",
      officer,
    });
    expect(result.unconfigured).toBe(true);
  });
});
