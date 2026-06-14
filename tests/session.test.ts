import { beforeAll, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session-token";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-at-least-16-chars";
});

describe("session tokens", () => {
  it("round-trips a session payload", async () => {
    const token = await signSessionToken({ userId: 42, role: "officer", name: "Pat" });
    const session = await verifySessionToken(token);
    expect(session).toEqual({ userId: 42, role: "officer", name: "Pat" });
  });

  it("rejects tampered tokens", async () => {
    const token = await signSessionToken({ userId: 1, role: "member", name: "M" });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await signSessionToken({ userId: 1, role: "member", name: "M" });
    process.env.SESSION_SECRET = "another-secret-16-chars-long";
    expect(await verifySessionToken(token)).toBeNull();
    process.env.SESSION_SECRET = "test-secret-at-least-16-chars";
  });
});
