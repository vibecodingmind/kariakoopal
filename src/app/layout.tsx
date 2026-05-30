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
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Kariako Guide - Your Guide to Kariakoo Market",
  description: "Connect with verified local market guides in Kariakoo, Dar es Salaam. Navigate the market like a local, find fair prices, and explore with confidence.",
  keywords: ["Kariakoo", "Dar es Salaam", "Tanzania", "market guide", "local guide", "tourism", "wholesale"],
  authors: [{ name: "Kariako Guide" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kariako Guide",
  },
  openGraph: {
    title: "Kariako Guide",
    description: "Your guide to Kariakoo market - Connect with verified local experts",
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
        <meta name="theme-color" content="#d97706" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/logo.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/logo.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kariako Guide" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground relative`}
      >
        <Providers>
          <div className="mesh-gradient" aria-hidden="true" />
          {children}
          <Toaster />
          <PWARegister />
        </Providers>
      </body>
    </html>
  );
}
