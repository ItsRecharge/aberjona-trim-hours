import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/services/auth-service";
import { isAdmin, setAdmin } from "@/lib/services/admin-service";
import { truncateAll } from "../helpers/db";

async function makeOfficer(email: string, admin = false) {
  return db.user.create({
    data: {
      firstName: "O",
      lastName: "F",
      email,
      passwordHash: await hashPassword("password123"),
      role: "officer",
      isAdmin: admin,
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));

describe("verifyPassword", () => {
  it("accepts the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword(hash, "correct-horse")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });
});

describe("admin flag", () => {
  it("isAdmin reflects the flag", async () => {
    const admin = await makeOfficer("a@test.local", true);
    const plain = await makeOfficer("p@test.local");
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(plain)).toBe(false);
  });

  it("setAdmin grants and revokes the flag", async () => {
    const officer = await makeOfficer("o@test.local");

    await setAdmin(officer.id, true);
    expect((await db.user.findUnique({ where: { id: officer.id } }))?.isAdmin).toBe(true);

    await setAdmin(officer.id, false);
    expect((await db.user.findUnique({ where: { id: officer.id } }))?.isAdmin).toBe(false);
  });

  it("allows several admins at once", async () => {
    const first = await makeOfficer("one@test.local", true);
    const second = await makeOfficer("two@test.local");
    await setAdmin(second.id, true);

    const admins = await db.user.findMany({ where: { isAdmin: true } });
    expect(admins.map((u) => u.id).sort()).toEqual([first.id, second.id].sort());
  });
});
