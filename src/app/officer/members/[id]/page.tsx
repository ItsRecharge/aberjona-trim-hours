import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { hoursEarnedForUser } from "@/lib/services/member-service";
import { hoursHistoryForUser } from "@/lib/services/history-service";
import { getYearlyGoal } from "@/lib/services/chapter-service";
import { hoursRemaining } from "@/lib/hours";
import { isBootstrapProtected } from "@/lib/services/bootstrap-service";
import { ProgressBar } from "@/components/ProgressBar";
import { SubmitButton } from "@/components/SubmitButton";
import { adjustHoursAction, setActiveAction, setRoleAction } from "@/actions/roster";
import { formatEventDate } from "@/lib/format";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const label = "mb-1 block text-sm font-medium text-gray-700";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const officer = await requireUser("officer");
  const { id } = await params;
  const memberId = Number(id);
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member) notFound();

  const [earned, goal, history] = await Promise.all([
    hoursEarnedForUser(member.id),
    getYearlyGoal(),
    hoursHistoryForUser(member.id),
  ]);
  const isSelf = member.id === officer.id;
  const bootstrapProtected = isBootstrapProtected(member);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/officer/members"
          className="flex items-center gap-1.5 text-sm text-indigo-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roster
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{fullName(member)}</h1>
        <p className="text-sm text-gray-500">
          {member.email}
          {member.graduationYear ? ` · Class of ${member.graduationYear}` : ""} ·{" "}
          <span className="capitalize">{member.role}</span>
          {member.deactivatedAt ? " · inactive" : ""}
          {bootstrapProtected ? " · bootstrap admin" : ""}
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <p className="text-sm text-gray-500">Hours earned</p>
          <p className="text-sm text-gray-600">
            {earned} / {goal} · {hoursRemaining(earned, goal)} remaining
          </p>
        </div>
        <ProgressBar earned={earned} goal={goal} />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Adjust hours</h2>
        <p className="mb-4 text-sm text-gray-500">
          Add a correction directly. Use a negative number to deduct hours.
        </p>
        <form action={adjustHoursAction} className="space-y-4">
          <input type="hidden" name="userId" value={member.id} />
          <div>
            <label htmlFor="description" className={label}>
              Reason
            </label>
            <input
              id="description"
              name="description"
              required
              placeholder="e.g. Make-up hours for cancelled event"
              className={field}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className={label}>
                Date
              </label>
              <input id="date" name="date" type="date" required className={field} />
            </div>
            <div>
              <label htmlFor="hours" className={label}>
                Hours (+/−)
              </label>
              <input
                id="hours"
                name="hours"
                type="number"
                step="0.5"
                required
                className={field}
              />
            </div>
          </div>
          <SubmitButton pendingText="Saving…">Apply Adjustment</SubmitButton>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Hours breakdown</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No credited hours yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((e, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{e.source}</p>
                  <p className="text-xs text-gray-500">
                    {formatEventDate(e.date)} · {e.kind === "event" ? "Event" : "Reported"}
                  </p>
                </div>
                <span className="font-medium text-gray-900">{e.hours}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isSelf && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Manage</h2>
          {bootstrapProtected ? (
            <p className="mb-4 text-sm text-amber-700">
              This is the bootstrap officer account and is protected for the first year.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <form action={setRoleAction}>
              <input type="hidden" name="userId" value={member.id} />
              <input
                type="hidden"
                name="role"
                value={member.role === "officer" ? "member" : "officer"}
              />
              <button
                type="submit"
                disabled={bootstrapProtected}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {member.role === "officer" ? "Demote to member" : "Promote to officer"}
              </button>
            </form>
            <form action={setActiveAction}>
              <input type="hidden" name="userId" value={member.id} />
              <input
                type="hidden"
                name="active"
                value={member.deactivatedAt ? "true" : "false"}
              />
              <button
                type="submit"
                disabled={bootstrapProtected}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  member.deactivatedAt
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {member.deactivatedAt ? "Reactivate" : "Deactivate"}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
