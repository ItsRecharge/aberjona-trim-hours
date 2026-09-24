import Link from "next/link";
import { requireUser, fullName } from "@/lib/current-user";
import { listEvents } from "@/lib/services/event-service";
import { createEventAction } from "@/actions/events";
import { EventFormFields } from "@/components/forms/EventForm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSlot } from "@/lib/format";

export default async function OfficerEventsPage() {
  await requireUser("officer");
  const events = await listEvents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500">Create events and manage attendance.</p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create event</h2>
        <form action={createEventAction}>
          <EventFormFields submitLabel="Create Event" />
        </form>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <h2 className="px-6 pt-5 text-lg font-semibold text-gray-900">All events</h2>
        {events.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No events yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Timeslots</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((e) => {
                const totalSignups = e.timeslots.reduce(
                  (n, slot) => n + slot.signups.length,
                  0,
                );
                return (
                  <tr key={e.id}>
                    <td className="px-6 py-3 align-top">
                      <p className="font-medium text-gray-900">{e.title}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      <ul className="space-y-1">
                        {e.timeslots.map((slot) => {
                          const confirmed = slot.signups.filter(
                            (s) => s.status === "confirmed",
                          ).length;
                          const waiting = slot.signups.filter(
                            (s) => s.status === "waitlisted",
                          ).length;
                          return (
                            <li key={slot.id} className="text-xs">
                              {formatSlot(slot)} · {slot.hoursValue} hrs ·{" "}
                              <span className="font-medium">
                                {confirmed}/{slot.quota}
                              </span>
                              {waiting > 0 ? ` (+${waiting} waitlisted)` : ""}
                            </li>
                          );
                        })}
                      </ul>
                      {totalSignups > 0 && (
                        <details className="group mt-2">
                          <summary className="inline-block cursor-pointer list-none rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition select-none hover:bg-gray-50">
                            <span className="group-open:hidden">
                              Show signups
                            </span>
                            <span className="hidden group-open:inline">
                              Hide signups
                            </span>
                          </summary>
                          <ul className="mt-2 space-y-2">
                            {e.timeslots.map((slot) => {
                              const confirmed = slot.signups.filter(
                                (s) => s.status === "confirmed",
                              );
                              const waiting = slot.signups.filter(
                                (s) => s.status === "waitlisted",
                              );
                              return (
                                <li key={slot.id} className="text-xs">
                                  <p className="font-medium text-gray-700">
                                    {formatSlot(slot)}
                                  </p>
                                  {confirmed.length === 0 &&
                                  waiting.length === 0 ? (
                                    <p className="text-gray-400">No signups</p>
                                  ) : (
                                    <ul className="mt-0.5 flex flex-wrap gap-1">
                                      {confirmed.map((s) => (
                                        <li
                                          key={s.id}
                                          className="rounded-full bg-green-50 px-2 py-0.5 text-green-800"
                                        >
                                          {fullName(s.user)}
                                        </li>
                                      ))}
                                      {waiting.map((s) => (
                                        <li
                                          key={s.id}
                                          className="rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-800"
                                        >
                                          {fullName(s.user)} (waitlist)
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-3 align-top">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-6 py-3 text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        {(e.status === "active" ||
                          e.status === "completed") && (
                          <Link
                            href={`/officer/events/${e.id}/attendance`}
                            className="text-sm font-medium text-indigo-700 hover:underline"
                          >
                            {e.status === "completed"
                              ? "Edit attendance"
                              : "Take attendance"}
                          </Link>
                        )}
                        {e.status !== "cancelled" && (
                          <Link
                            href={`/officer/events/${e.id}/edit`}
                            className="text-sm font-medium text-gray-600 hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                        {totalSignups > 0 && (
                          <Link
                            href={`/officer/events/${e.id}/email`}
                            className="text-sm font-medium text-gray-600 hover:underline"
                          >
                            Email signups
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
