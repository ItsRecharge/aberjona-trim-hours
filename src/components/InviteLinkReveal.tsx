"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Shows the one-time invite (a link or a code) read server-side from its
 * cookie, with a copy button, then clears the cookie.
 */
export function InviteLinkReveal({ value }: { value: string | null }) {
  const [link, setLink] = useState<string | null>(value);
  const [copied, setCopied] = useState(false);

  // The page stays mounted across the create-invite redirect, so a new invite
  // arrives as a prop change rather than a fresh mount.
  useEffect(() => {
    if (value) {
      setLink(value);
      document.cookie = "trim_last_invite=; path=/officer/invites; max-age=0";
    }
  }, [value]);

  if (!link) return null;
  const isCode = !link.startsWith("http");

  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-4">
      <p className="mb-2 text-sm font-semibold text-green-800">
        {isCode
          ? "New invite code (also listed in the table below):"
          : "New invite link (copy it now — it won\u2019t be shown again):"}
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          className={`flex-1 rounded-md border border-green-300 bg-white px-3 py-2 font-mono text-gray-800 ${
            isCode ? "text-lg font-semibold tracking-widest" : "text-xs"
          }`}
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
