import type { ChapterSettings } from "@prisma/client";
import { db } from "../db";
import { DEFAULT_YEARLY_HOURS_GOAL } from "../hours";

/** Reads the singleton chapter settings, creating defaults on first use. */
export async function getChapterSettings(): Promise<ChapterSettings> {
  const existing = await db.chapterSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return db.chapterSettings.create({
    data: { id: 1, yearlyHoursGoal: DEFAULT_YEARLY_HOURS_GOAL },
  });
}

/** Convenience: just the yearly hours goal. */
export async function getYearlyGoal(): Promise<number> {
  return (await getChapterSettings()).yearlyHoursGoal;
}

export async function updateChapterSettings(input: {
  chapterName: string;
  yearlyHoursGoal: number;
}): Promise<ChapterSettings> {
  return db.chapterSettings.upsert({
    where: { id: 1 },
    update: input,
    create: { id: 1, ...input },
  });
}
