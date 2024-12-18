import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { auth } from '@/auth'
import { SessionProvider } from "next-auth/react"
import { SettingProvider } from "@/context/SettingProvider";

export const metadata: Metadata = {
  title: "Family Ledger",
  description: "Manage family assets easily",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SettingProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <SpeedInsights />
                <Analytics />
            </ThemeProvider>
          </SettingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
