import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { hoursEarnedForUser } from "@/lib/services/member-service";
import { YEARLY_HOURS_GOAL, hoursRemaining, schoolYearRange } from "@/lib/hours";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEventDate } from "@/lib/format";

export default async function MemberDashboard() {
  const user = await requireUser("member");
  const earned = await hoursEarnedForUser(user.id);
  const remaining = hoursRemaining(earned);
  const { start, end } = schoolYearRange();
  const today = new Date();

  const upcoming = await db.eventSignup.findMany({
    where: {
      userId: user.id,
      event: { status: "active", date: { gte: new Date(today.toDateString()) } },
    },
    include: { event: true },
    orderBy: { event: { date: "asc" } },
  });

  const myRequests = await db.event.findMany({
    where: {
      createdById: user.id,
      status: { in: ["pending_approval", "cancelled"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {fullName(user)}
        </h1>
        <p className="text-sm text-gray-500">
          School year {start.getUTCFullYear()}–{end.getUTCFullYear()}
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-500">Service hours earned</p>
            <p className="text-3xl font-bold text-gray-900">
              {earned}
              <span className="text-lg font-normal text-gray-400">
                {" "}
                / {YEARLY_HOURS_GOAL}
              </span>
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {remaining > 0 ? `${remaining} to go` : "Goal reached 🎉"}
          </p>
        </div>
        <ProgressBar earned={earned} />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t signed up for any upcoming events.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{s.event.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatEventDate(s.event.date)}
                    {s.event.location ? ` · ${s.event.location}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium text-indigo-700">
                  {s.event.hoursValue} hrs
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {myRequests.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Your event requests
          </h2>
          <ul className="divide-y divide-gray-100">
            {myRequests.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{e.title}</p>
                  <p className="text-sm text-gray-500">{formatEventDate(e.date)}</p>
                </div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
