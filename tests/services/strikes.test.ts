import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { truncateAll } from "../helpers/db";
import { hashPassword } from "@/lib/services/auth-service";
import { createSessionRow } from "@/lib/services/session-service";
import { countStrikes, issueStrike, listStrikes } from "@/lib/services/strike-service";
import { MAX_STRIKES } from "@/lib/constants";

async function makeUser(email: string, role: "member" | "officer") {
  return db.user.create({
    data: {
      firstName: role === "officer" ? "Olive" : "Mem",
      lastName: role === "officer" ? "Officer" : "Ber",
      email,
      passwordHash: await hashPassword("password123"),
      role,
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));

describe("strikes", () => {
  it("MAX_STRIKES is three", () => {
    expect(MAX_STRIKES).toBe(3);
  });

  it("two strikes leave the member active and count them", async () => {
    const officer = await makeUser("o@test.local", "officer");
    const member = await makeUser("m@wpsstudent.com", "member");

    const first = await issueStrike({ userId: member.id, issuedById: officer.id, reason: "Late" });
    const second = await issueStrike({ userId: member.id, issuedById: officer.id, reason: "No-show" });

    expect(first).toMatchObject({ count: 1, removed: false });
    expect(second).toMatchObject({ count: 2, removed: false });
    expect(await countStrikes(member.id)).toBe(2);

    const fresh = await db.user.findUnique({ where: { id: member.id } });
    expect(fresh?.deactivatedAt).toBeNull();
  });

  it("third strike deactivates the member and revokes their sessions", async () => {
    const officer = await makeUser("o@test.local", "officer");
    const member = await makeUser("m@wpsstudent.com", "member");
    await createSessionRow(member.id);

    await issueStrike({ userId: member.id, issuedById: officer.id, reason: "One" });
    await issueStrike({ userId: member.id, issuedById: officer.id, reason: "Two" });
    const third = await issueStrike({ userId: member.id, issuedById: officer.id, reason: "Three" });

    expect(third).toMatchObject({ count: 3, removed: true });
    const fresh = await db.user.findUnique({ where: { id: member.id } });
    expect(fresh?.deactivatedAt).not.toBeNull();
    const sessions = await db.session.findMany({ where: { userId: member.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].revokedAt).not.toBeNull();
  });

  it("lists strikes newest first with the issuing officer's name", async () => {
    const officer = await makeUser("o@test.local", "officer");
    const member = await makeUser("m@wpsstudent.com", "member");
    await issueStrike({ userId: member.id, issuedById: officer.id, reason: "First" });
    await db.strike.updateMany({ data: { createdAt: new Date(Date.now() - 60_000) } });
    await issueStrike({ userId: member.id, issuedById: officer.id, reason: "Second" });

    const strikes = await listStrikes(member.id);
    expect(strikes.map((s) => s.reason)).toEqual(["Second", "First"]);
    expect(strikes[0].issuedBy).toEqual({ firstName: "Olive", lastName: "Officer" });
  });
});
