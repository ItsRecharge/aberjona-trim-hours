import { describe, expect, it } from "vitest";
import { strikeIssuedEmail } from "@/lib/email/templates";

describe("strikeIssuedEmail", () => {
  it("warns about a non-final strike with the reason and count", () => {
    const email = strikeIssuedEmail("Sam", 2, 3, "Missed call time", false, "http://x");
    expect(email.subject).toContain("Disciplinary strike issued (2 of 3)");
    expect(email.text).toContain("Missed call time");
    expect(email.text).toContain("2 of 3");
    expect(email.text).not.toContain("removed");
    expect(email.html).toContain("Missed call time");
  });

  it("announces removal on the final strike", () => {
    const email = strikeIssuedEmail("Sam", 3, 3, "Third offense", true, "http://x");
    expect(email.subject).toContain("Removed from the chapter after 3 strikes");
    expect(email.text).toContain("Third offense");
    expect(email.text.toLowerCase()).toContain("deactivated");
  });
});
