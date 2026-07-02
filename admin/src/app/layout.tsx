import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "企業進捗管理",
  description: "動画をもとに企業ごとの決定事項・宿題を蓄積する管理サイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
            <Link href="/" className="text-sm font-semibold">
              企業進捗管理
            </Link>
            <Link href="/upload" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
              動画アップロード
            </Link>
            <Link href="/companies" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
              企業管理
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
