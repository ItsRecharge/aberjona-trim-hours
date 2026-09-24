import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fullName, requireUser } from "@/lib/current-user";
import { getEventForEmail } from "@/lib/services/event-email-service";
import { emailSignupsAction } from "@/actions/event-email";
import { RecipientPicker, type PickerSlot } from "@/components/forms/RecipientPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { fieldClass, labelClass } from "@/components/AuthShell";
import { formatSlot } from "@/lib/format";

export default async function EmailSignupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const officer = await requireUser("officer");
  const { id } = await params;
  const eventId = Number(id);
  const event = await getEventForEmail(eventId);
  if (!event) notFound();

  const slots: PickerSlot[] = event.timeslots.map((slot) => ({
    id: slot.id,
    label: formatSlot(slot),
    signups: slot.signups.map((s) => ({
      id: s.id,
      name: fullName(s.user),
      status: s.status,
    })),
  }));
  const total = slots.reduce((n, s) => n + s.signups.length, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/officer/events"
          className="flex items-center gap-1.5 text-sm text-indigo-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Email signups: {event.title}
        </h1>
        <p className="text-sm text-gray-500">
          Sent BCC from the chapter account. Replies go to {officer.email}.
        </p>
      </div>

      {total === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          No one has signed up yet.
        </p>
      ) : (
        <form
          action={emailSignupsAction}
          className="space-y-6 rounded-xl bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="eventId" value={event.id} />

          <div>
            <p className={labelClass}>Recipients</p>
            <RecipientPicker slots={slots} />
          </div>

          <div>
            <label htmlFor="subject" className={labelClass}>
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              required
              maxLength={200}
              defaultValue={event.title}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="body" className={labelClass}>
              Message
            </label>
            <textarea
              id="body"
              name="body"
              rows={8}
              required
              maxLength={5000}
              className={fieldClass}
            />
          </div>

          <SubmitButton pendingText="Sending…">Send email</SubmitButton>
        </form>
      )}
    </div>
  );
}
