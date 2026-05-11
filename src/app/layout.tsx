import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";

export const metadata: Metadata = {
  title: "달새김 — 소중한 날을 달에 새기다",
  description: "음력/양력 기념일을 자동으로 관리하고 미리 알려주는 서비스",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "달새김",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0d14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/manifest" />
        <link rel="apple-touch-icon" href="/icons/app-icon-3.png" />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ThemeInit />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
