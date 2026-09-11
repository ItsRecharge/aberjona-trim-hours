import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validation";

const base = {
  firstName: "New",
  lastName: "Member",
  password: "password123",
  graduationYear: "",
  inviteToken: "tok",
};

describe("signupSchema email domain", () => {
  it("accepts a @wpsstudent.com address", () => {
    const parsed = signupSchema.safeParse({ ...base, email: "student@wpsstudent.com" });
    expect(parsed.success).toBe(true);
  });

  it("normalizes case before checking the domain", () => {
    const parsed = signupSchema.safeParse({ ...base, email: "  Student@WPSStudent.COM " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("student@wpsstudent.com");
  });

  it("rejects other domains with a school-email message", () => {
    const parsed = signupSchema.safeParse({ ...base, email: "student@gmail.com" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(["email"]);
      expect(parsed.error.issues[0].message).toContain("@wpsstudent.com");
    }
  });

  it.each([
    "student@wpsstudent.com.evil.com",
    "student@notwpsstudent.com",
    "student@sub.wpsstudent.com",
    "student@wpsstudent.org",
  ])("rejects lookalike domain %s", (email) => {
    expect(signupSchema.safeParse({ ...base, email }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("still accepts any email domain (existing accounts are unaffected)", () => {
    const parsed = loginSchema.safeParse({ email: "advisor@gmail.com", password: "x" });
    expect(parsed.success).toBe(true);
  });
});
