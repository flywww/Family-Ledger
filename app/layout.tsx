import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from "next-auth/react"
import { SettingProvider } from "@/context/SettingProvider";

export const metadata: Metadata = {
  title: {
    template: '%s | Family Ledger',
    default: "Family Ledger"
  },
  description: "Manage family assets easily",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  //BUG: get application error on vecel (possibility happened on session)
  return (
    <html lang="en">
      <body>
        <SessionProvider refetchInterval={5*30} refetchOnWindowFocus> 
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
