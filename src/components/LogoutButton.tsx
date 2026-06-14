import { LogOut, ShieldOff } from "lucide-react";
import { logoutAction, logoutEverywhereAction } from "@/actions/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <form action={logoutAction}>
        <button
          type="submit"
          className={`flex items-center gap-2 text-sm transition hover:opacity-100 ${className}`}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
      <form action={logoutEverywhereAction}>
        <button
          type="submit"
          title="Revoke every session on all devices"
          className={`flex items-center gap-2 text-xs opacity-70 transition hover:opacity-100 ${className}`}
        >
          <ShieldOff className="h-3.5 w-3.5" />
          Log out everywhere
        </button>
      </form>
    </div>
  );
}
