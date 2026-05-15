import type { Metadata } from "next";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crel — Privacy-first analytics",
  description:
    "Open-source web analytics. Deploy on Vercel + Supabase. No cookies required.",
};

const TRACKING_ID = process.env.NEXT_PUBLIC_CREL_TRACKING_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        {TRACKING_ID && (
          <Script
            src={`${APP_URL}/crel.js`}
            data-website-id={TRACKING_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
