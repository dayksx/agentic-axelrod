import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DynamicRootProvider } from "@/components/DynamicRootProvider";
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
  title: "Agentic Axelrod",
  description: "AI agent tournament replays — Prisoner's Dilemma with language",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <DynamicRootProvider>{children}</DynamicRootProvider>
      </body>
    </html>
  );
}
