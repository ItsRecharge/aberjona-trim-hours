import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/services/auth-service";
import { isSuperAdmin } from "@/lib/ops-access";
import { signOpsGrant, verifyOpsGrant } from "@/lib/ops-grant";
import { truncateAll } from "../helpers/db";

async function makeAdmin(createdAt = new Date()) {
  return db.user.create({
    data: {
      firstName: "B",
      lastName: "O",
      email: "boot@test.local",
      passwordHash: await hashPassword("password123"),
      role: "officer",
      isAdmin: true,
      createdAt,
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));

describe("ops access", () => {
  it("treats an admin as a super admin", async () => {
    const createdAt = new Date();
    createdAt.setUTCMonth(createdAt.getUTCMonth() - 2);
    const admin = await makeAdmin(createdAt);

    expect(isSuperAdmin(admin)).toBe(true);
  });

  it("signs and verifies an ops grant token", async () => {
    const admin = await makeAdmin();
    const token = await signOpsGrant({
      userId: admin.id,
      email: admin.email,
      admin: admin.isAdmin,
    });

    expect(await verifyOpsGrant(token)).toEqual({
      userId: admin.id,
      email: admin.email,
      admin: true,
    });
  });
});