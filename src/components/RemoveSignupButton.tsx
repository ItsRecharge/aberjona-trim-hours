"use client";

import { X } from "lucide-react";
import { removeSignupAction } from "@/actions/signups";

/** Small "×" on a signup chip that removes that member from the timeslot. */
export function RemoveSignupButton({
  timeslotId,
  userId,
  name,
}: {
  timeslotId: number;
  userId: number;
  name: string;
}) {
  return (
    <form
      action={removeSignupAction}
      className="inline-flex"
      onSubmit={(e) => {
        if (!window.confirm(`Remove ${name} from this timeslot?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="timeslotId" value={timeslotId} />
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        aria-label={`Remove ${name}`}
        title="Remove"
        className="ml-1 rounded-full p-0.5 opacity-60 transition hover:bg-black/10 hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </form>
  );
}
