import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, fullName } from "@/lib/current-user";
import { getEventWithSignups } from "@/lib/services/attendance-service";
import { markAttendanceAction } from "@/actions/attendance";
import { SubmitButton } from "@/components/SubmitButton";
import { formatEventDate } from "@/lib/format";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("officer");
  const { id } = await params;
  const event = await getEventWithSignups(Number(id));
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/officer/events"
          className="text-sm text-indigo-700 hover:underline"
        >
          ← Back to events
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-sm text-gray-500">
          {formatEventDate(event.date)} · {event.hoursValue} hrs · Marking attendance
          will mark this event completed.
        </p>
      </div>

      <form
        action={markAttendanceAction}
        className="rounded-xl bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="eventId" value={event.id} />

        {event.signups.length === 0 ? (
          <p className="text-sm text-gray-500">No one signed up for this event.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {event.signups.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  id={`present-${s.userId}`}
                  name="present"
                  value={s.userId}
                  defaultChecked={s.attended}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label
                  htmlFor={`present-${s.userId}`}
                  className="text-sm font-medium text-gray-900"
                >
                  {fullName(s.user)}
                </label>
              </li>
            ))}
          </ul>
        )}

        {event.signups.length > 0 && (
          <div className="mt-5">
            <SubmitButton pendingText="Saving…">Save Attendance</SubmitButton>
          </div>
        )}
      </form>
    </div>
  );
}
