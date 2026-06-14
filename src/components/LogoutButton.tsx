import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`flex items-center gap-2 text-sm transition hover:opacity-100 ${className}`}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </form>
  );
}
