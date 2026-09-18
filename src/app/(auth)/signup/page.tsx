import Link from "next/link";
import { AuthShell, fieldClass, labelClass } from "@/components/AuthShell";
import { validateInvite } from "@/lib/services/invite-service";
import { SignupForm } from "./SignupForm";

const INVALID_MESSAGE: Record<string, string> = {
  not_found: "This invite is not valid.",
  revoked: "This invite has been revoked.",
  expired: "This invite has expired.",
  exhausted: "This invite has reached its usage limit.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  if (!invite) {
    return (
      <AuthShell
        title="Invite required"
        subtitle="Sign-up is invite-only for chapter members."
      >
        <p className="text-sm text-gray-600">
          Open the invite link an officer sent you, or enter your invite code below.
        </p>
        <form method="get" action="/signup" className="mt-4 space-y-3">
          <div>
            <label htmlFor="invite" className={labelClass}>
              Invite code
            </label>
            <input
              id="invite"
              name="invite"
              required
              autoComplete="off"
              placeholder="XXXX-XXXX"
              className={`${fieldClass} font-mono uppercase tracking-widest`}
            />
          </div>
          <button
            type="submit"
            className="w-full cursor-pointer rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800"
          >
            Continue
          </button>
        </form>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline"
        >
          Already have an account? Log in
        </Link>
      </AuthShell>
    );
  }

  const validation = await validateInvite(invite);
  if (!validation.valid) {
    return (
      <AuthShell title="Invite unavailable">
        <p className="text-sm text-gray-600">
          {INVALID_MESSAGE[validation.reason ?? "not_found"]}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline"
        >
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="You've been invited to the chapter.">
      <SignupForm inviteToken={invite} memberInvite={validation.invite.role === "member"} />
    </AuthShell>
  );
}
