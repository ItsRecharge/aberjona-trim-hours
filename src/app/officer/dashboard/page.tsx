import Link from "next/link";
import { Settings } from "lucide-react";
import { requireUser } from "@/lib/current-user";
import { listMembersWithProgress } from "@/lib/services/member-service";
import { getYearlyGoal } from "@/lib/services/chapter-service";
import { ProgressBar } from "@/components/ProgressBar";

export default async function OfficerDashboard() {
  await requireUser("officer");
  const [members, goal] = await Promise.all([
    listMembersWithProgress(),
    getYearlyGoal(),
  ]);

  const atRisk = members.filter((m) => !m.deactivatedAt && m.remaining > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member progress</h1>
          <p className="text-sm text-gray-500">
            {members.length} members · {atRisk} still working toward {goal} hrs
          </p>
        </div>
        <Link
          href="/officer/chapter"
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:underline"
        >
          <Settings className="h-4 w-4" />
          Chapter settings
        </Link>
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
                <tr key={m.id} className={m.deactivatedAt ? "opacity-50" : ""}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/officer/members/${m.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-700 hover:underline"
                    >
                      {m.firstName} {m.lastName}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {m.email}
                      {m.graduationYear ? ` · '${String(m.graduationYear).slice(-2)}` : ""}
                      {m.deactivatedAt ? " · inactive" : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <ProgressBar earned={m.earned} goal={goal} />
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
