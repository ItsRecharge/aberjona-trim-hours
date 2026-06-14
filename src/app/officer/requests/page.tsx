import { requireUser, fullName } from "@/lib/current-user";
import { listPendingRequests } from "@/lib/services/event-service";
import { approveRequestAction, denyRequestAction } from "@/actions/events";
import { SubmitButton } from "@/components/SubmitButton";
import { formatEventDate } from "@/lib/format";

export default async function OfficerRequestsPage() {
  await requireUser("officer");
  const requests = await listPendingRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event requests</h1>
        <p className="text-sm text-gray-500">
          Approve to publish the event (members are notified) or deny it.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          No pending requests.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((e) => (
            <li key={e.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{e.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatEventDate(e.date)}
                    {e.location ? ` · ${e.location}` : ""} · {e.hoursValue} hrs
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Requested by {fullName(e.createdBy)}
                  </p>
                  {e.description && (
                    <p className="mt-2 text-sm text-gray-600">{e.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={approveRequestAction}>
                    <input type="hidden" name="eventId" value={e.id} />
                    <SubmitButton pendingText="…">Approve</SubmitButton>
                  </form>
                  <form action={denyRequestAction}>
                    <input type="hidden" name="eventId" value={e.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Deny
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
