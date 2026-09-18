import { describe, expect, it } from "vitest";
import {
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
  parseInviteEmails,
} from "@/lib/invite-code";

describe("invite codes", () => {
  it("generates 8 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateInviteCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("formats a stored code as XXXX-XXXX", () => {
    expect(formatInviteCode("ABCDEFGH")).toBe("ABCD-EFGH");
  });

  it("normalizes typed input to the stored form", () => {
    expect(normalizeInviteCode("abcd-efgh")).toBe("ABCDEFGH");
    expect(normalizeInviteCode(" ab cd efgh ")).toBe("ABCDEFGH");
  });

  it("returns null for anything that isn't an 8-character code", () => {
    expect(normalizeInviteCode("ABC")).toBeNull();
    expect(normalizeInviteCode("a".repeat(43))).toBeNull();
    expect(normalizeInviteCode("")).toBeNull();
  });
});

describe("parseInviteEmails", () => {
  it("splits on commas and whitespace, trims, lowercases, and dedupes", () => {
    expect(
      parseInviteEmails(" A@wpsstudent.com, b@wpsstudent.com\n a@wpsstudent.com "),
    ).toEqual({ emails: ["a@wpsstudent.com", "b@wpsstudent.com"] });
  });

  it("returns an empty list for blank input", () => {
    expect(parseInviteEmails("")).toEqual({ emails: [] });
    expect(parseInviteEmails("  ,\n ")).toEqual({ emails: [] });
  });

  it("reports the first invalid address", () => {
    expect(parseInviteEmails("ok@wpsstudent.com, nope")).toEqual({
      error: "Invalid email: nope",
    });
  });
});
