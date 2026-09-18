"use client";

import { AlertTriangle } from "lucide-react";
import { issueStrikeAction } from "@/actions/strikes";
import { MAX_STRIKES } from "@/lib/constants";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200";

/** Reason + confirm-guarded submit. Warns when the next strike removes the member. */
export function IssueStrikeForm({
  userId,
  name,
  currentCount,
}: {
  userId: number;
  name: string;
  currentCount: number;
}) {
  const next = currentCount + 1;
  const final = next >= MAX_STRIKES;
  const prompt = final
    ? `This is strike ${next} of ${MAX_STRIKES} and will remove ${name} from the chapter. Continue?`
    : `Issue strike ${next} of ${MAX_STRIKES} to ${name}?`;

  return (
    <form
      action={issueStrikeAction}
      onSubmit={(e) => {
        if (!window.confirm(prompt)) e.preventDefault();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">
          Reason
        </label>
        <input
          id="reason"
          name="reason"
          required
          maxLength={200}
          placeholder="e.g. Missed a required rehearsal"
          className={field}
        />
      </div>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <AlertTriangle className="h-4 w-4" />
        {final ? `Issue final strike (${next} of ${MAX_STRIKES})` : `Issue strike (${next} of ${MAX_STRIKES})`}
      </button>
    </form>
  );
}
