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
        <footer className="bg-white py-3 text-center text-sm text-gray-500">
          Made by Neel Bansal
        </footer>
      </body>
    </html>
  );
}
