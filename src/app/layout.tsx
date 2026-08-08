import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "./theme-script";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unblur",
  description: "Get unstuck — post a doubt, get a real answer live.",
};

// Every route in this app is a "use client" page gated on browser-only auth state
// (localStorage) -- there's no meaningful server-rendered content to statically cache.
// Without this, Next prerenders these pages at BUILD time (no browser, no localStorage,
// no backend), bakes that broken/logged-out snapshot into a static shell, and serves it
// with a 1-year s-maxage via its own ISR cache on cold hits right after every deploy --
// a real bug that showed up live as a flash of totally unstyled content on /home.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
