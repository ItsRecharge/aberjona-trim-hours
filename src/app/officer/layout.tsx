import Link from "next/link";
import {
  Calendar,
  LayoutDashboard,
  Mail,
  Star,
  Users,
  ClipboardList,
} from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { getFlash } from "@/lib/flash";
import { FlashMessages } from "@/components/FlashMessages";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/officer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/officer/events", label: "Events", icon: Calendar },
  { href: "/officer/requests", label: "Requests", icon: ClipboardList },
  { href: "/officer/members", label: "Members", icon: Users },
  { href: "/officer/invites", label: "Invites", icon: Mail },
];

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("officer");
  const flash = await getFlash();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[220px] flex-col bg-[#1d2d35] text-white">
        <div className="flex items-center gap-2 px-5 py-5 text-sm font-bold tracking-wide">
          <Star className="h-5 w-5 text-yellow-400" />
          Officer Panel
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="mb-2 text-xs text-white/60">{fullName(user)}</p>
          <LogoutButton className="text-white/75 opacity-100" />
        </div>
      </aside>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <FlashMessages messages={flash} />
          {children}
        </div>
      </main>
    </div>
  );
}
