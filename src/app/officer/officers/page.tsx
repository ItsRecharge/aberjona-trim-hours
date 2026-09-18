import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { listOfficers } from "@/lib/services/roster-service";
import { ResetLinkReveal } from "@/components/ResetLinkReveal";
import { OfficerActionsMenu } from "@/components/OfficerActionsMenu";

export default async function OfficersPage() {
  const me = await requireUser("officer");
  const officers = await listOfficers();
  const meIsAdmin = me.isAdmin;

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
          roster changes. Admins can grant or revoke admin access from the actions
          menu; an admin is protected from removal until their access is revoked.
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
              const active = o.deactivatedAt === null;
              return (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      {fullName(o)}
                      {isSelf ? <span className="text-xs text-gray-400">(you)</span> : null}
                    </div>
                    <div className="text-xs text-gray-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {active ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          Deactivated
                        </span>
                      )}
                      {o.isAdmin ? (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      ) : null}
                    </div>
                    {o.isAdmin ? (
                      <div className="mt-1 text-xs text-gray-400">
                        Protected — revoke admin to remove
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {isSelf ? (
                        <span className="text-xs text-gray-400">
                          Manage your own account in Settings
                        </span>
                      ) : (
                        <OfficerActionsMenu
                          officerId={o.id}
                          active={active}
                          targetIsAdmin={o.isAdmin}
                          meIsAdmin={meIsAdmin}
                        />
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
