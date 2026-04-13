import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthHydration } from "@/components/AuthHydration";

export const metadata: Metadata = {
  title: "2une — AI data work & projects",
  description:
    "Train AI with data sourcing, annotation, and RLHF. Find flexible projects and apply to work with 2une — built for talent in India and beyond.",
  icons: {
    icon: "/logo_white.png",
    apple: "/logo_white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AuthHydration />
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
