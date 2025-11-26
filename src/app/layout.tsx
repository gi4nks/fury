import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Fury – Smart Bookmark Organizer",
  description: "Import, organize and explore Chrome bookmarks with Fury.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="corporate" >
      <body
        className={`${geistSans.variable} font-sans antialiased bg-base-100 text-base-content`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="navbar bg-base-200 shadow-sm">
            <div className="flex-1">
              <Link
                href="/"
                className="btn btn-ghost normal-case text-xl font-bold"
              >
                Fury
              </Link>
            </div>
            <nav className="flex-none flex gap-2">
              <Link href="/" className="btn btn-ghost">
                Home
              </Link>
              <Link href="/import" className="btn btn-ghost">
                Import
              </Link>
              <Link href="/bookmarks" className="btn btn-ghost">
                Bookmarks
              </Link>
              <Link href="/categories" className="btn btn-ghost">
                Categories
              </Link>
            </nav>
          </header>
          <main className="flex-1 w-full">
            <div className="max-w-5xl mx-auto w-full p-4 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
