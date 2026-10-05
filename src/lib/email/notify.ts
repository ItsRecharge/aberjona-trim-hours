import { db } from "@/lib/db";
import { fullName } from "@/lib/current-user";
import { hoursEarnedForUser } from "@/lib/services/member-service";
import { getPublicBaseUrl, getYearlyGoal } from "@/lib/services/chapter-service";
import { hoursRemaining, schoolYearRange } from "@/lib/hours";
import { sendMail, sendMailBatch, sendMailEach, type BatchResult } from "./mailer";
import {
  domainRenewalEmail,
  eventCancelledEmail,
  eventPostedEmail,
  eventSignupEmail,
  hourReportDecisionEmail,
  hoursCreditedEmail,
  hoursSummaryEmail,
  newRequestEmail,
  requestDecisionEmail,
  strikeIssuedEmail,
  waitlistPromotedEmail,
} from "./templates";
import { MAX_STRIKES } from "@/lib/constants";

/** Email failures must never break the triggering request. */
async function safeSend(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error("[notify] email send failed:", err);
  }
}

async function verifiedEmailsByRole(role: string): Promise<string[]> {
  const users = await db.user.findMany({
    where: { role, emailVerifiedAt: { not: null }, deactivatedAt: null },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function notifyEventPosted(event: {
  title: string;
  slots: { date: Date; startTime: string; endTime: string }[];
}): Promise<void> {
  await safeSend(async () => {
    const recipients = await verifiedEmailsByRole("member");
    if (recipients.length === 0) return;
    const whenLabel =
      event.slots.length === 1
        ? `${dateLabel(event.slots[0].date)}, ${event.slots[0].startTime}–${event.slots[0].endTime}`
        : `${event.slots.length} timeslots starting ${dateLabel(event.slots[0].date)}`;
    const content = eventPostedEmail(event.title, whenLabel, await getPublicBaseUrl());
    await sendMailBatch(recipients, content);
  });
}

export async function notifyRequestDecision(
  userId: number,
  eventTitle: string,
  approved: boolean,
): Promise<void> {
  await safeSend(async () => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerifiedAt || user.deactivatedAt) return;
    await sendMail({
      to: user.email,
      ...requestDecisionEmail(eventTitle, approved, await getPublicBaseUrl()),
    });
  });
}

export async function notifyHoursCredited(
  credits: { userId: number; hours: number; eventTitle: string }[],
): Promise<void> {
  await safeSend(async () => {
    const baseUrl = await getPublicBaseUrl();
    const messages = [];
    for (const c of credits) {
      const user = await db.user.findUnique({ where: { id: c.userId } });
      if (!user?.emailVerifiedAt || user.deactivatedAt) continue;
      messages.push({
        to: user.email,
        ...hoursCreditedEmail(fullName(user), c.hours, c.eventTitle, baseUrl),
      });
    }
    await sendMailEach(messages);
  });
}

/**
 * Officer-triggered: emails every verified, active member a personalized hours
 * summary (earned / remaining vs the chapter goal) as an end-of-year reminder.
 * Sent over one connection; one bad address doesn't abort the batch.
 */
export async function notifyHoursSummary(): Promise<void> {
  await safeSend(async () => {
    const goal = await getYearlyGoal();
    const { end } = schoolYearRange();
    const deadline = end.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const members = await db.user.findMany({
      where: { role: "member", emailVerifiedAt: { not: null }, deactivatedAt: null },
    });
    const baseUrl = await getPublicBaseUrl();

    const messages = [];
    for (const m of members) {
      const earned = await hoursEarnedForUser(m.id);
      messages.push({
        to: m.email,
        ...hoursSummaryEmail(
          fullName(m),
          earned,
          hoursRemaining(earned, goal),
          goal,
          deadline,
          baseUrl,
        ),
      });
    }
    await sendMailEach(messages);
  });
}

export async function notifyNewRequest(
  eventTitle: string,
  requesterName: string,
): Promise<void> {
  await safeSend(async () => {
    const recipients = await verifiedEmailsByRole("officer");
    if (recipients.length === 0) return;
    const content = newRequestEmail(eventTitle, requesterName, await getPublicBaseUrl());
    await sendMailBatch(recipients, content);
  });
}

/** Yearly domain-renewal reminder to every verified, active officer. */
export async function notifyDomainRenewal(): Promise<void> {
  await safeSend(async () => {
    const recipients = await verifiedEmailsByRole("officer");
    if (recipients.length === 0) return;
    const content = domainRenewalEmail();
    await sendMailBatch(recipients, content);
  });
}

export async function notifyEventCancelled(
  userIds: number[],
  eventTitle: string,
): Promise<void> {
  if (userIds.length === 0) return;
  await safeSend(async () => {
    const users = await db.user.findMany({
      where: { id: { in: userIds }, emailVerifiedAt: { not: null }, deactivatedAt: null },
      select: { email: true },
    });
    const emails = users.map((u) => u.email);
    if (emails.length === 0) return;
    const content = eventCancelledEmail(eventTitle, await getPublicBaseUrl());
    await sendMailBatch(emails, content);
  });
}

export async function notifyWaitlistPromoted(
  userIds: number[],
  eventTitle: string,
  slotLabel: string,
): Promise<void> {
  if (userIds.length === 0) return;
  await safeSend(async () => {
    const baseUrl = await getPublicBaseUrl();
    const messages = [];
    for (const id of userIds) {
      const user = await db.user.findUnique({ where: { id } });
      if (!user?.emailVerifiedAt || user.deactivatedAt) continue;
      messages.push({
        to: user.email,
        ...waitlistPromotedEmail(fullName(user), eventTitle, slotLabel, baseUrl),
      });
    }
    await sendMailEach(messages);
  });
}

export async function notifyHourReportDecision(
  userId: number,
  description: string,
  hours: number,
  approved: boolean,
): Promise<void> {
  await safeSend(async () => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerifiedAt || user.deactivatedAt) return;
    await sendMail({
      to: user.email,
      ...hourReportDecisionEmail(
        fullName(user),
        description,
        hours,
        approved,
        await getPublicBaseUrl(),
      ),
    });
  });
}

/**
 * Strike notice. Unlike the other notifications this does not skip deactivated
 * users: the final strike deactivates the account before this runs.
 */
export async function notifyStrikeIssued(
  userId: number,
  count: number,
  reason: string,
  removed: boolean,
): Promise<void> {
  await safeSend(async () => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerifiedAt) return;
    await sendMail({
      to: user.email,
      ...strikeIssuedEmail(
        fullName(user),
        count,
        MAX_STRIKES,
        reason,
        removed,
        await getPublicBaseUrl(),
      ),
    });
  });
}

/**
 * Officer-composed message to chosen event signups, batched BCC with
 * reply-to set to the officer. Unlike the other notifiers the result is
 * returned so the action can report the outcome to the officer.
 */
export async function emailEventSignups(input: {
  emails: string[];
  subject: string;
  body: string;
  officer: { firstName: string; lastName: string; email: string };
}): Promise<BatchResult> {
  const content = eventSignupEmail(input.subject, input.body, fullName(input.officer));
  return sendMailBatch(input.emails, { replyTo: input.officer.email, ...content });
}
