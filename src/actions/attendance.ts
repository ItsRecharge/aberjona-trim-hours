"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/current-user";
import { markAttendance } from "@/lib/services/attendance-service";
import { db } from "@/lib/db";
import { notifyHoursCredited } from "@/lib/email/notify";
import { appendHoursRows } from "@/lib/sheets";
import { fullName } from "@/lib/current-user";
import { setFlash } from "@/lib/flash";

export async function markAttendanceAction(formData: FormData): Promise<void> {
  await requireUser("officer");
  const eventId = Number(formData.get("eventId"));

  // Checkboxes named "present" carry the present user IDs.
  const presentUserIds = formData
    .getAll("present")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));

  const result = await markAttendance(eventId, presentUserIds);
  if (!result) {
    await setFlash("warning", "Event not found.");
    redirect("/officer/events");
  }

  if (result.credited.length > 0) {
    const credited = result.credited;
    after(async () => {
      await notifyHoursCredited(credited);

      const users = await db.user.findMany({
        where: { id: { in: credited.map((c) => c.userId) } },
        select: { id: true, firstName: true, lastName: true },
      });
      const nameById = new Map(users.map((u) => [u.id, fullName(u)]));
      await appendHoursRows(
        credited.map((c) => ({
          memberName: nameById.get(c.userId) ?? `User ${c.userId}`,
          hours: c.hours,
          source: `Event: ${c.eventTitle}`,
          date: new Date(),
        })),
      );
    });
  }

  await setFlash(
    "success",
    `Attendance saved. ${result.credited.length} member(s) credited.`,
  );
  revalidatePath("/officer/events");
  redirect("/officer/events");
}
