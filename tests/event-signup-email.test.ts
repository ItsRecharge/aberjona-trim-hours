import { describe, expect, it } from "vitest";
import { eventSignupEmail } from "@/lib/email/templates";

describe("eventSignupEmail", () => {
  it("prefixes the subject and signs the message with the officer's name", () => {
    const email = eventSignupEmail("Call time change", "Meet at 3pm.", "Olive Officer");
    expect(email.subject).toBe("Tri-M Hours - Call time change");
    expect(email.html).toContain("Sent by Olive Officer");
    expect(email.text).toContain("Sent by Olive Officer");
    expect(email.text).toContain("Meet at 3pm.");
  });

  it("escapes HTML in the body and subject and keeps line breaks", () => {
    const email = eventSignupEmail(
      "<x> & y",
      "Bring <b>water</b> & snacks\nSee you there",
      "Olive Officer",
    );
    expect(email.html).toContain("&lt;b&gt;water&lt;/b&gt; &amp; snacks<br>See you there");
    expect(email.html).not.toContain("<b>water</b>");
    expect(email.html).toContain("&lt;x&gt; &amp; y");
    expect(email.text).toContain("Bring <b>water</b> & snacks\nSee you there");
  });
});
