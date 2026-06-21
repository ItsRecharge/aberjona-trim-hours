import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aberjona Tri-M Hours Log",
  description:
    "Track and manage community service hours for the Aberjona chapter of the Tri-M Music Honor Society.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <div className="flex-1">{children}</div>
        <footer className="border-t-2 border-indigo-600 bg-[#1d2d35] py-4 text-center text-sm font-semibold tracking-wide text-white">
          Designed &amp; built by{" "}
          <span className="font-bold text-yellow-400">Neel Bansal</span>
        </footer>
      </body>
    </html>
  );
}
