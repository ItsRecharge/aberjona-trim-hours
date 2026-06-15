import Link from "next/link";
import { ArrowLeft, ShieldOff } from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { logoutEverywhereAction } from "@/actions/auth";
import { getFlash } from "@/lib/flash";
import { FlashMessages } from "@/components/FlashMessages";
import { ChangePasswordForm, ChangeEmailForm, ProfileForm } from "./SettingsForms";

export default async function SettingsPage() {
  const user = await requireUser();
  const flash = await getFlash();
  const back = user.role === "officer" ? "/officer/dashboard" : "/member/dashboard";

  const activeSessions = await db.session.count({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
  });

  return (
    <div className="min-h-screen">
      <header className="bg-indigo-700 text-white shadow">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href={back} className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="font-bold tracking-wide">Settings</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24 sm:py-8 md:pb-8">
        <FlashMessages messages={flash} />

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName(user)}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
          <ProfileForm
            firstName={user.firstName}
            lastName={user.lastName}
            graduationYear={user.graduationYear}
          />
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Change password</h2>
          <p className="mb-4 text-sm text-gray-500">
            Confirm with your current password — no email needed while you&apos;re
            signed in.
          </p>
          <ChangePasswordForm />
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Change email</h2>
          <p className="mb-4 text-sm text-gray-500">
            Confirm with your current password. We&apos;ll email a verification link
            to the new address — it only takes effect once you click it.
          </p>
          {user.pendingEmail && (
            <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Pending change to <strong>{user.pendingEmail}</strong> — check that inbox
              for the verification link.
            </div>
          )}
          <ChangeEmailForm currentEmail={user.email} />
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Sessions</h2>
          <p className="mb-4 text-sm text-gray-500">
            You have {activeSessions} active session{activeSessions === 1 ? "" : "s"}.
            Sign out everywhere to revoke them on all devices (you&apos;ll be logged
            out here too).
          </p>
          <form action={logoutEverywhereAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <ShieldOff className="h-4 w-4" />
              Sign out everywhere
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
