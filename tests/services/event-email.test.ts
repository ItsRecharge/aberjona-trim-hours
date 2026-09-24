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
import { sendMail } from "@/lib/email/mailer";

vi.mock("@/lib/email/mailer", () => ({ sendMail: vi.fn() }));

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
  vi.mocked(sendMail).mockResolvedValue(true);
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

  it("sends one BCC email with reply-to set to the officer", async () => {
    const sent = await emailEventSignups({
      emails: ["a@test.local", "b@test.local"],
      subject: "Call time",
      body: "Meet at 3pm.",
      officer,
    });
    expect(sent).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(sendMail).mock.calls[0][0];
    expect(msg.bcc).toEqual(["a@test.local", "b@test.local"]);
    expect(msg.replyTo).toBe("o@test.local");
    expect(msg.subject).toBe("Tri-M Hours - Call time");
    expect(msg.html).toContain("Sent by Olive Officer");
  });

  it("chunks recipients at 80 per email", async () => {
    const emails = Array.from({ length: 81 }, (_, i) => `m${i}@test.local`);
    await emailEventSignups({ emails, subject: "S", body: "B", officer });
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendMail).mock.calls[0][0].bcc).toHaveLength(80);
    expect(vi.mocked(sendMail).mock.calls[1][0].bcc).toHaveLength(1);
  });

  it("returns false when mail is unconfigured", async () => {
    vi.mocked(sendMail).mockResolvedValue(false);
    const sent = await emailEventSignups({
      emails: ["a@test.local"],
      subject: "S",
      body: "B",
      officer,
    });
    expect(sent).toBe(false);
  });

  it("propagates transport errors", async () => {
    vi.mocked(sendMail).mockRejectedValue(new Error("smtp down"));
    await expect(
      emailEventSignups({ emails: ["a@test.local"], subject: "S", body: "B", officer }),
    ).rejects.toThrow("smtp down");
  });
});
