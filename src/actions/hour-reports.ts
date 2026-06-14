"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/current-user";
import { hourReportSchema } from "@/lib/validation";
import {
  createReport,
  reviewReport,
} from "@/lib/services/hour-report-service";
import { notifyHourReportDecision } from "@/lib/email/notify";
import { setFlash } from "@/lib/flash";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request-ip";

export async function reportHoursAction(formData: FormData): Promise<void> {
  const member = await requireUser("member");

  const parsed = hourReportSchema.safeParse({
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
    hoursRequested: formData.get("hoursRequested"),
  });
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect("/member/report-hours");
  }

  const ip = await requestIp();
  if (!rateLimit(`report:${ip}:${member.id}`, 10, 60 * 60 * 1000)) {
    await setFlash("warning", "Too many submissions. Please try again later.");
    redirect("/member/report-hours");
  }

  await createReport({ userId: member.id, ...parsed.data });
  await setFlash("success", "Hours submitted for officer approval.");
  revalidatePath("/member/report-hours");
  redirect("/member/report-hours");
}

async function reviewAction(formData: FormData, approve: boolean): Promise<void> {
  const officer = await requireUser("officer");
  const reportId = Number(formData.get("reportId"));

  const report = await reviewReport(reportId, approve, officer.id);
  if (report) {
    after(() =>
      notifyHourReportDecision(
        report.userId,
        report.description,
        report.hoursRequested,
        approve,
      ),
    );
    await setFlash(
      approve ? "success" : "info",
      approve
        ? `Approved ${report.hoursRequested} hrs for ${report.user.firstName}.`
        : "Hour report denied.",
    );
  } else {
    await setFlash("warning", "That report could not be reviewed.");
  }

  revalidatePath("/officer/requests");
  redirect("/officer/requests");
}

export async function approveReportAction(formData: FormData): Promise<void> {
  await reviewAction(formData, true);
}

export async function denyReportAction(formData: FormData): Promise<void> {
  await reviewAction(formData, false);
}
