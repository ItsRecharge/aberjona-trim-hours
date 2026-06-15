"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { adjustHoursSchema } from "@/lib/validation";
import {
  createAdjustment,
  setMemberActive,
  setMemberRole,
} from "@/lib/services/roster-service";
import { setFlash } from "@/lib/flash";
import type { Role } from "@/lib/constants";

function memberPath(id: number) {
  return `/officer/members/${id}`;
}

export async function adjustHoursAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));

  const parsed = adjustHoursSchema.safeParse({
    description: formData.get("description"),
    date: formData.get("date"),
    hours: formData.get("hours"),
  });
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect(memberPath(userId));
  }

  await createAdjustment({
    userId,
    description: parsed.data.description,
    date: parsed.data.date,
    hours: parsed.data.hours,
    officerId: officer.id,
  });
  await setFlash(
    "success",
    `${parsed.data.hours > 0 ? "Added" : "Deducted"} ${Math.abs(parsed.data.hours)} hrs.`,
  );
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId));
}

export async function setRoleAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));
  const role = String(formData.get("role")) as Role;

  if (userId === officer.id) {
    await setFlash("warning", "You can't change your own role.");
    redirect(memberPath(userId));
  }
  if (role !== "member" && role !== "officer") {
    redirect(memberPath(userId));
  }

  await setMemberRole(userId, role);
  await setFlash("success", role === "officer" ? "Promoted to officer." : "Set to member.");
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId));
}

export async function setActiveAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));
  const active = formData.get("active") === "true";

  if (userId === officer.id) {
    await setFlash("warning", "You can't deactivate your own account.");
    redirect(memberPath(userId));
  }

  await setMemberActive(userId, active);
  await setFlash("info", active ? "Member reactivated." : "Member deactivated.");
  revalidatePath(memberPath(userId));
  redirect(memberPath(userId));
}
