import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth-service";
import { listOfficers } from "@/lib/services/roster-service";
import { isAdmin } from "@/lib/services/admin-service";
import { truncateAll } from "../helpers/db";

async function makeOfficer(
  firstName: string,
  opts: { admin?: boolean; createdAt?: Date } = {},
) {
  return db.user.create({
    data: {
      firstName,
      lastName: "Test",
      email: `${firstName.toLowerCase()}@test.local`,
      passwordHash: await hashPassword("password123"),
      role: "officer",
      isAdmin: opts.admin ?? false,
      createdAt: opts.createdAt ?? new Date(),
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));

describe("listOfficers + protection", () => {
  it("returns every officer with the admin flag", async () => {
    await makeOfficer("Boot", { admin: true });
    await makeOfficer("Reg");

    const officers = await listOfficers();
    expect(officers).toHaveLength(2);
    expect(officers.find((o) => o.firstName === "Boot")?.isAdmin).toBe(true);
    expect(officers.find((o) => o.firstName === "Reg")?.isAdmin).toBe(false);
  });

  it("flags only admins, regardless of account age", async () => {
    const old = new Date();
    old.setUTCFullYear(old.getUTCFullYear() - 5);
    const boot = await makeOfficer("Boot", { admin: true, createdAt: old });
    const reg = await makeOfficer("Reg");

    expect(isAdmin(boot)).toBe(true);
    expect(isAdmin(reg)).toBe(false);
  });
});
