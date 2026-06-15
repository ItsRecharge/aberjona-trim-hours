"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { chapterSettingsSchema } from "@/lib/validation";
import { updateChapterSettings } from "@/lib/services/chapter-service";
import { setFlash } from "@/lib/flash";

export async function updateChapterAction(formData: FormData): Promise<void> {
  await requireUser("officer");
  const parsed = chapterSettingsSchema.safeParse({
    chapterName: formData.get("chapterName"),
    yearlyHoursGoal: formData.get("yearlyHoursGoal"),
  });
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect("/officer/chapter");
  }

  await updateChapterSettings(parsed.data);
  await setFlash("success", "Chapter settings updated.");
  revalidatePath("/officer/chapter");
  redirect("/officer/chapter");
}
