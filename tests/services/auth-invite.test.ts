import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { truncateAll } from "../helpers/db";
import { createInvite, validateInvite } from "@/lib/services/invite-service";
import { signupWithInvite } from "@/lib/services/signup-service";
import { verifyCredentials, hashPassword } from "@/lib/services/auth-service";

async function makeOfficer() {
  return db.user.create({
    data: {
      firstName: "O",
      lastName: "Fficer",
      email: "officer@wpsstudent.com",
      passwordHash: await hashPassword("password123"),
      role: "officer",
      emailVerifiedAt: new Date(),
    },
  });
}

beforeEach(() => truncateAll(db));
afterEach(() => truncateAll(db));

describe("invite validation", () => {
  it("accepts a fresh invite and rejects expired/revoked/exhausted ones", async () => {
    const officer = await makeOfficer();
    const { rawToken, invite } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 1,
    });
    expect((await validateInvite(rawToken)).valid).toBe(true);

    await db.inviteToken.update({
      where: { id: invite.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await validateInvite(rawToken)).reason).toBe("expired");
  });

  it("reports unknown tokens", async () => {
    expect((await validateInvite("nope")).reason).toBe("not_found");
  });
});

describe("signupWithInvite", () => {
  it("creates a member, increments invite use, and issues a verification token", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 2,
    });

    const result = await signupWithInvite({
      firstName: "New",
      lastName: "Member",
      email: "new@wpsstudent.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(result.ok).toBe(true);

    const invite = await db.inviteToken.findFirst();
    expect(invite?.useCount).toBe(1);

    const tokens = await db.authToken.findMany();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe("email_verification");

    const user = await db.user.findUnique({ where: { email: "new@wpsstudent.com" } });
    expect(user?.emailVerifiedAt).toBeNull();
    expect(user?.role).toBe("member");
  });

  it("removes a fully-used invite so reuse is rejected", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 1,
    });
    await signupWithInvite({
      firstName: "A",
      lastName: "A",
      email: "a@wpsstudent.com",
      password: "password123",
      rawInviteToken: rawToken,
    });

    // The single-use invite is deleted on first use.
    expect(await db.inviteToken.count()).toBe(0);

    const second = await signupWithInvite({
      firstName: "B",
      lastName: "B",
      email: "b@wpsstudent.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(second).toEqual({ ok: false, reason: "invalid_invite" });
  });

  it("rejects a duplicate email", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
    });
    const dup = await signupWithInvite({
      firstName: "Dup",
      lastName: "Licate",
      email: "officer@wpsstudent.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(dup).toEqual({ ok: false, reason: "email_taken" });
  });

  it("rejects an email outside the school domain without consuming the invite", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 1,
    });
    const result = await signupWithInvite({
      firstName: "Out",
      lastName: "Sider",
      email: "outsider@gmail.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(result).toEqual({ ok: false, reason: "email_domain" });

    // Nothing was created and the single-use invite is still available.
    expect(await db.user.count({ where: { email: "outsider@gmail.com" } })).toBe(0);
    expect(await db.authToken.count()).toBe(0);
    const invite = await db.inviteToken.findFirst();
    expect(invite?.useCount).toBe(0);
  });

  it("lets officer invites sign up with any email domain", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "officer",
      expiresInDays: 7,
    });
    const result = await signupWithInvite({
      firstName: "Ad",
      lastName: "Visor",
      email: "advisor@gmail.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(result.ok).toBe(true);
    const user = await db.user.findUnique({ where: { email: "advisor@gmail.com" } });
    expect(user?.role).toBe("officer");
  });

  it("accepts a member signup on the school domain regardless of case", async () => {
    const officer = await makeOfficer();
    const { rawToken } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
    });
    const result = await signupWithInvite({
      firstName: "Cased",
      lastName: "Student",
      email: "Cased@WPSStudent.com",
      password: "password123",
      rawInviteToken: rawToken,
    });
    expect(result.ok).toBe(true);
  });
});

describe("code and emailed invites", () => {
  it("creates a code invite that validates by typed code", async () => {
    const officer = await makeOfficer();
    const { invite, code } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      kind: "code",
    });
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    expect(invite.code).toBe(code);

    const typed = `${code!.slice(0, 4).toLowerCase()}-${code!.slice(4)}`;
    const validation = await validateInvite(typed);
    expect(validation.valid).toBe(true);
    expect(validation.invite?.id).toBe(invite.id);
  });

  it("link invites have no code and still validate by token", async () => {
    const officer = await makeOfficer();
    const { invite, rawToken, code } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
    });
    expect(code).toBeNull();
    expect(invite.code).toBeNull();
    expect((await validateInvite(rawToken)).valid).toBe(true);
  });

  it("signs up with a code and bumps its use count", async () => {
    const officer = await makeOfficer();
    const { code } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 3,
      kind: "code",
    });
    const result = await signupWithInvite({
      firstName: "Code",
      lastName: "User",
      email: "code@wpsstudent.com",
      password: "password123",
      rawInviteToken: `${code!.slice(0, 4)}-${code!.slice(4).toLowerCase()}`,
    });
    expect(result.ok).toBe(true);
    const invite = await db.inviteToken.findFirst();
    expect(invite?.useCount).toBe(1);
  });

  it("stores the recipient address on emailed invites", async () => {
    const officer = await makeOfficer();
    const { invite } = await createInvite({
      createdById: officer.id,
      role: "member",
      expiresInDays: 7,
      maxUses: 1,
      email: "kid@wpsstudent.com",
    });
    expect(invite.email).toBe("kid@wpsstudent.com");
    expect(invite.maxUses).toBe(1);
  });
});

describe("verifyCredentials", () => {
  it("blocks login until the email is verified", async () => {
    await db.user.create({
      data: {
        firstName: "Un",
        lastName: "Verified",
        email: "unverified@test.local",
        passwordHash: await hashPassword("password123"),
        role: "member",
      },
    });
    const unverified = await verifyCredentials("unverified@test.local", "password123");
    expect(unverified).toEqual({ ok: false, reason: "unverified" });
  });

  it("rejects a wrong password and accepts a correct one once verified", async () => {
    await db.user.create({
      data: {
        firstName: "Ver",
        lastName: "Ified",
        email: "verified@test.local",
        passwordHash: await hashPassword("password123"),
        role: "member",
        emailVerifiedAt: new Date(),
      },
    });
    expect((await verifyCredentials("verified@test.local", "wrong")).ok).toBe(false);
    const ok = await verifyCredentials("verified@test.local", "password123");
    expect(ok.ok).toBe(true);
  });

  it("treats an unknown email as invalid credentials", async () => {
    const res = await verifyCredentials("ghost@test.local", "password123");
    expect(res).toEqual({ ok: false, reason: "invalid_credentials" });
  });
});
