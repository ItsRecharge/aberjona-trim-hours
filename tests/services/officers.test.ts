import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth-service";
import { listOfficers } from "@/lib/services/roster-service";
import { truncateAll } from "../helpers/db";

async function makeOfficer(
  firstName: string,
  opts: { bootstrap?: boolean; createdAt?: Date } = {},
) {
  return db.user.create({
    data: {
      firstName,
      lastName: "Test",
      email: `${firstName.toLowerCase()}@test.local`,
      passwordHash: await hashPassword("password123"),
      role: "officer",
      isBootstrapOfficer: opts.bootstrap ?? false,
      createdAt: opts.createdAt ?? new Date(),
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));

describe("listOfficers", () => {
  it("flags the bootstrap officer as protected and leaves others unprotected", async () => {
    await makeOfficer("Boot", { bootstrap: true }); // created now → within first year
    await makeOfficer("Reg");

    const officers = await listOfficers();
    const boot = officers.find((o) => o.firstName === "Boot");
    const reg = officers.find((o) => o.firstName === "Reg");

    expect(boot?.protectedUntil).toBeInstanceOf(Date);
    expect(reg?.protectedUntil).toBeNull();
  });

  it("drops protection once the bootstrap year has passed", async () => {
    const old = new Date();
    old.setUTCFullYear(old.getUTCFullYear() - 2);
    await makeOfficer("Boot", { bootstrap: true, createdAt: old });

    const [boot] = await listOfficers();
    expect(boot.protectedUntil).toBeNull();
  });
});
