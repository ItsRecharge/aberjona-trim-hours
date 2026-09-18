"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { MAX_STRIKES } from "@/lib/constants";
import { issueStrike } from "@/lib/services/strike-service";
import { recordAudit } from "@/lib/services/audit-service";
import { syncSheetsAfterChange } from "@/lib/services/sheet-sync-service";
import { notifyStrikeIssued } from "@/lib/email/notify";
import { setFlash } from "@/lib/flash";

const reasonSchema = z.string().trim().min(1, "Give a reason for the strike").max(200);

function memberPath(id: number) {
  return `/officer/members/${id}`;
}

export async function issueStrikeAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));

  const parsed = reasonSchema.safeParse(formData.get("reason"));
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect(memberPath(userId));
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  if (!target || target.role !== "member") {
    await setFlash("warning", "Strikes can only be issued to members.");
    redirect(memberPath(userId));
  }

  const { count, removed } = await issueStrike({
    userId: target.id,
    issuedById: officer.id,
    reason: parsed.data,
  });
  const name = fullName(target);

  after(() => notifyStrikeIssued(target.id, count, parsed.data, removed));
  if (removed) after(() => syncSheetsAfterChange());

  await recordAudit({
    actor: officer,
    action: "member.strike",
    summary: `Issued strike ${count}/${MAX_STRIKES} to ${name}: ${parsed.data}`,
    targetType: "user",
    targetId: target.id,
  });
  if (removed) {
    await recordAudit({
      actor: officer,
      action: "roster.deactivate",
      summary: `Deactivated ${name} after ${MAX_STRIKES} strikes`,
      targetType: "user",
      targetId: target.id,
    });
    await setFlash(
      "danger",
      `Strike ${count} of ${MAX_STRIKES} issued. ${name} has been removed from the chapter.`,
    );
  } else {
    await setFlash("warning", `Strike issued (${count} of ${MAX_STRIKES}).`);
  }
  revalidatePath(memberPath(target.id));
  redirect(memberPath(target.id));
}
