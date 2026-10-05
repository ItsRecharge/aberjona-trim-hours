"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/current-user";
import { setFlash } from "@/lib/flash";
import { PUZZLE_PASS_COOKIE, PUZZLE_PASS_SECONDS } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const FOREVER = new Date("9999-12-31T00:00:00Z");

/**
 * Admin-only prank: the user must solve a random puzzle at the start of each
 * visit until the chosen time. Deliberately not audit-logged, since officers
 * can read the audit log and that would give it away.
 */
export async function setPuzzlePrankAction(formData: FormData): Promise<void> {
  const userId = Number(formData.get("userId"));
  const backTo = `/officer/members/${userId}`;
  await requireAdmin(backTo);

  const length = String(formData.get("length") ?? "");
  let until: Date | null;
  if (length === "off") until = null;
  else if (length === "forever") until = FOREVER;
  else {
    const days = Number(length);
    if (![1, 3, 7].includes(days)) {
      await setFlash("danger", "Pick a prank length.");
      redirect(backTo);
    }
    until = new Date(Date.now() + days * DAY_MS);
  }

  await db.user.update({ where: { id: userId }, data: { puzzlePrankUntil: until } });
  await setFlash("success", until ? "Puzzle prank is on. 😈" : "Puzzle prank stopped.");
  redirect(backTo);
}

/** Called by the puzzle screen once solved: skip puzzles for the next hour. */
export async function passPuzzleAction(): Promise<void> {
  await requireUser();
  (await cookies()).set(PUZZLE_PASS_COOKIE, "1", {
    path: "/",
    maxAge: PUZZLE_PASS_SECONDS,
    httpOnly: true,
    sameSite: "lax",
  });
}
