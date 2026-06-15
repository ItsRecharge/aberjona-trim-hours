import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/actions/auth";

/** Settings link + quick Log out. "Log out everywhere" lives on the settings page. */
export function AccountControls({
  className = "",
  align = "start",
}: {
  className?: string;
  align?: "start" | "end";
}) {
  const itemClass = `flex items-center gap-2 text-sm opacity-85 transition hover:opacity-100 ${className}`;
  return (
    <div
      className={`flex flex-col gap-1.5 ${align === "end" ? "items-end" : "items-start"}`}
    >
      <Link href="/settings" className={itemClass}>
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <form action={logoutAction}>
        <button type="submit" className={itemClass}>
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </div>
  );
}
