import Link from "next/link";
import { Settings, Plug, ScrollText, AlertTriangle, Users, Send } from "lucide-react";
import { requireUser } from "@/lib/current-user";
import { isOpsConsoleEnabled } from "@/lib/ops-access";

const CARDS = [
  {
    href: "/officer/chapter",
    title: "Chapter settings",
    desc: "Chapter name and the yearly service-hours goal.",
    icon: Settings,
  },
  {
    href: "/officer/officers",
    title: "Officers",
    desc: "View officers, reset passwords, and remove officers as they change.",
    icon: Users,
  },
  {
    href: "/officer/integrations",
    title: "Integrations",
    desc: "Email (Gmail) and Google Sheets backup credentials.",
    icon: Plug,
  },
  {
    href: "/officer/email-test",
    title: "Email test",
    desc: "Send a sample of any email template to check delivery.",
    icon: Send,
  },
  {
    href: "/officer/audit",
    title: "Audit log",
    desc: "A record of every officer action.",
    icon: ScrollText,
  },
  {
    href: "/officer/reset",
    title: "Year-end reset",
    desc: "Remove all members and the year's activity. Officers are kept.",
    icon: AlertTriangle,
    danger: true,
  },
];

export default async function AdminPage() {
  await requireUser("officer");
  const cards = isOpsConsoleEnabled()
    ? [...CARDS, { href: "/officer/ops", title: "Operations console", desc: "Unlock terminal-grade admin tools.", icon: Settings }]
    : CARDS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Chapter configuration and officer tools.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md ${
              c.danger ? "ring-1 ring-red-100" : ""
            }`}
          >
            <c.icon
              className={`mt-0.5 h-5 w-5 shrink-0 ${c.danger ? "text-red-600" : "text-indigo-700"}`}
            />
            <div>
              <p className="font-semibold text-gray-900">{c.title}</p>
              <p className="mt-0.5 text-sm text-gray-500">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
