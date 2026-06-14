import { requireUser } from "@/lib/current-user";
import { listMembersWithProgress } from "@/lib/services/member-service";
import { YEARLY_HOURS_GOAL } from "@/lib/hours";
import { ProgressBar } from "@/components/ProgressBar";

export default async function OfficerDashboard() {
  await requireUser("officer");
  const members = await listMembersWithProgress();

  const atRisk = members.filter((m) => m.remaining > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Member progress</h1>
        <p className="text-sm text-gray-500">
          {members.length} members · {atRisk} still working toward {YEARLY_HOURS_GOAL} hrs
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {members.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No members yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3 w-1/3">Progress</th>
                <th className="px-5 py-3 text-right">Earned</th>
                <th className="px-5 py-3 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <ProgressBar earned={m.earned} />
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {m.earned}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{m.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
