import Link from "next/link";
import { Calendar, Clock, LayoutDashboard, Music, PlusCircle } from "lucide-react";
import { requireUser, fullName } from "@/lib/current-user";
import { getFlash } from "@/lib/flash";
import { FlashMessages } from "@/components/FlashMessages";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/events", label: "Events", icon: Calendar },
  { href: "/member/report-hours", label: "Report Hours", icon: Clock },
  { href: "/member/request-event", label: "Request Event", icon: PlusCircle },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("member");
  const flash = await getFlash();

  return (
    <div className="min-h-screen">
      <header className="bg-indigo-700 text-white shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/member/dashboard" className="flex items-center gap-2 font-bold">
            <Music className="h-5 w-5" />
            <span className="tracking-wide">Tri-M Hours</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/80 md:inline">{fullName(user)}</span>
            <LogoutButton className="text-white/85 opacity-85" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <FlashMessages messages={flash} />
        {children}
      </main>
    </div>
  );
}
