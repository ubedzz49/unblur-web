import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "./theme-script";
import { Providers } from "./providers";

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
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
