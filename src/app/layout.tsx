import "./globals.css";
import type { Metadata } from "next";
import AppGate from "@/components/AppGate";

export const metadata: Metadata = {
  title: "BuikeCore",
  description: "Sticky notes + Study Tutor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuikeCore",
  },
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuikeCore" />
      </head>
      <body>
        <AppGate>{children}</AppGate>
      </body>
    </html>
  );
}