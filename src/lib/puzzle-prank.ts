import { cookies } from "next/headers";
import { PUZZLE_PASS_COOKIE } from "./constants";

/** True while an admin's puzzle prank is active and this visit isn't solved yet. */
export async function mustSolvePuzzle(user: { puzzlePrankUntil: Date | null }): Promise<boolean> {
  if (!user.puzzlePrankUntil || user.puzzlePrankUntil <= new Date()) return false;
  return !(await cookies()).has(PUZZLE_PASS_COOKIE);
}
