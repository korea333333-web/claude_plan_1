import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달새김 — 소중한 날을 달에 새기다",
  description: "음력/양력 기념일을 자동으로 관리하고 미리 알려주는 서비스",
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
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('dalsaegim-theme');
              if (t === 'light') document.documentElement.setAttribute('data-theme','light');
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
