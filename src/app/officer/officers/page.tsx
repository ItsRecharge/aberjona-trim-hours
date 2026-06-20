import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { listOfficers } from "@/lib/services/roster-service";
import { sendPasswordResetForUserAction, setOfficerActiveAction } from "@/actions/officers";
import { ResetLinkReveal } from "@/components/ResetLinkReveal";

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function OfficersPage() {
  const me = await requireUser("officer");
  const officers = await listOfficers();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/officer/admin"
          className="flex items-center gap-1.5 text-sm text-indigo-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Officers</h1>
        <p className="text-sm text-gray-500">
          Everyone with officer access. Reset a password or remove an officer as the
          roster changes. The bootstrap officer is protected during its first year.
        </p>
      </div>

      <ResetLinkReveal />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Officer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {officers.map((o) => {
              const isSelf = o.id === me.id;
              const protectedNow = o.protectedUntil !== null;
              const active = o.deactivatedAt === null;
              return (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      {fullName(o)}
                      {o.isBootstrapOfficer ? (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          <ShieldCheck className="h-3 w-3" /> Bootstrap
                        </span>
                      ) : null}
                      {isSelf ? <span className="text-xs text-gray-400">(you)</span> : null}
                    </div>
                    <div className="text-xs text-gray-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {active ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        Deactivated
                      </span>
                    )}
                    {protectedNow ? (
                      <div className="mt-1 text-xs text-gray-400">
                        Protected until {dateLabel(o.protectedUntil!)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isSelf ? (
                        <span className="text-xs text-gray-400">
                          Manage your own account in Settings
                        </span>
                      ) : (
                        <>
                          <form action={sendPasswordResetForUserAction}>
                            <input type="hidden" name="userId" value={o.id} />
                            <button
                              type="submit"
                              className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset password
                            </button>
                          </form>
                          <form action={setOfficerActiveAction}>
                            <input type="hidden" name="userId" value={o.id} />
                            <input type="hidden" name="active" value={active ? "false" : "true"} />
                            <button
                              type="submit"
                              disabled={protectedNow}
                              title={
                                protectedNow
                                  ? "The bootstrap officer can't be removed during its first year."
                                  : undefined
                              }
                              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                protectedNow
                                  ? "cursor-not-allowed border border-gray-200 text-gray-300"
                                  : active
                                    ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {active ? "Deactivate" : "Reactivate"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
