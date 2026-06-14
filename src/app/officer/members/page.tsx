import { requireUser } from "@/lib/current-user";
import { listMembersWithProgress } from "@/lib/services/member-service";
import { formatEventDate } from "@/lib/format";

export default async function OfficerMembersPage() {
  await requireUser("officer");
  const members = await listMembersWithProgress();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Member roster</h1>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {members.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No members yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{m.email}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatEventDate(m.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {m.emailVerifiedAt ? (
                      <span className="text-xs font-medium text-green-700">Verified</span>
                    ) : (
                      <span className="text-xs font-medium text-yellow-700">
                        Unverified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
