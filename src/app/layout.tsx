import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "./theme-script";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Unblur",
  description: "Get unstuck — post a doubt, get a real answer live.",
};

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
