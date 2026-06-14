import { requireUser } from "@/lib/current-user";
import { listActiveEventsForMember } from "@/lib/services/event-service";
import { signupAction, withdrawAction } from "@/actions/signups";
import { SubmitButton } from "@/components/SubmitButton";
import { formatEventDate } from "@/lib/format";

export default async function MemberEventsPage() {
  const user = await requireUser("member");
  const events = await listActiveEventsForMember(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Volunteer events</h1>

      {events.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          There are no active events right now. Check back soon!
        </p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const signedUp = event.signups.length > 0;
            return (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatEventDate(event.date)}
                    {event.location ? ` · ${event.location}` : ""} · {event.hoursValue}{" "}
                    hrs
                  </p>
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
                <form action={signedUp ? withdrawAction : signupAction}>
                  <input type="hidden" name="eventId" value={event.id} />
                  {signedUp ? (
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Withdraw
                    </button>
                  ) : (
                    <SubmitButton pendingText="Signing up…">Sign Up</SubmitButton>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
