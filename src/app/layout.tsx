import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWARegister } from "@/components/pwa-register";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#065F46",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Chimbo Direct - Navigate Kariakoo Like a Local",
  description: "Connect with verified local market guides in Kariakoo, Dar es Salaam. Navigate the market like a local, find fair prices, and explore with confidence.",
  keywords: ["Kariakoo", "Dar es Salaam", "Tanzania", "market guide", "local guide", "tourism", "wholesale"],
  authors: [{ name: "Chimbo Direct" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chimbo Direct",
  },
  openGraph: {
    title: "Chimbo Direct",
    description: "Your trusted guide to Kariakoo market - Connect with verified local experts",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#065F46" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" type="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chimbo Direct" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-[#FAFAF9] text-[#1C1917] dark:bg-[#0C0A1D] dark:text-[#E7E5E4]`}
      >
        <Providers>
          {children}
          <Toaster />
          <PWARegister />
        </Providers>
      </body>
    </html>
  );
  }
