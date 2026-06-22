"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Mail,
  MoreVertical,
  Pencil,
  Power,
  UserCog,
} from "lucide-react";
import {
  sendPasswordResetForUserAction,
  setOfficerActiveAction,
} from "@/actions/officers";
import { startImpersonationAction } from "@/actions/impersonation";

interface OfficerActionsMenuProps {
  officerId: number;
  active: boolean;
  protectedNow: boolean;
  meIsBootstrap: boolean;
}

const itemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50";

export function OfficerActionsMenu({
  officerId,
  active,
  protectedNow,
  meIsBootstrap,
}: OfficerActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Officer actions"
        className="flex items-center justify-center rounded-md border border-gray-300 p-1.5 text-gray-600 transition hover:bg-gray-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {meIsBootstrap ? (
            <Link
              href={`/officer/members/${officerId}`}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Manage
            </Link>
          ) : null}

          {meIsBootstrap && active ? (
            <form action={startImpersonationAction}>
              <input type="hidden" name="userId" value={officerId} />
              <button type="submit" className={`${itemClass} text-amber-800`}>
                <UserCog className="h-3.5 w-3.5" />
                Impersonate
              </button>
            </form>
          ) : null}

          <div className="my-1 border-t border-gray-100" />
          <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Reset password
          </p>
          <form action={sendPasswordResetForUserAction}>
            <input type="hidden" name="userId" value={officerId} />
            <button type="submit" className={itemClass}>
              <KeyRound className="h-3.5 w-3.5" />
              Generate reset link
            </button>
          </form>
          <form action={sendPasswordResetForUserAction}>
            <input type="hidden" name="userId" value={officerId} />
            <input type="hidden" name="emailIt" value="1" />
            <button type="submit" className={itemClass}>
              <Mail className="h-3.5 w-3.5" />
              Send reset email
            </button>
          </form>

          <div className="my-1 border-t border-gray-100" />
          <form action={setOfficerActiveAction}>
            <input type="hidden" name="userId" value={officerId} />
            <input type="hidden" name="active" value={active ? "false" : "true"} />
            <button
              type="submit"
              disabled={protectedNow}
              title={
                protectedNow
                  ? "Transfer the bootstrap role before removing this officer."
                  : undefined
              }
              className={
                protectedNow
                  ? "flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm text-gray-300"
                  : active
                    ? `${itemClass} text-red-700`
                    : `${itemClass} text-green-700`
              }
            >
              <Power className="h-3.5 w-3.5" />
              {active ? "Deactivate" : "Reactivate"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
