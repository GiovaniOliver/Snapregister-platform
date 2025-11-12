import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export const metadata: Metadata = {
  title: "SnapRegister - AI-Powered Product Registration",
  description: "Register your products and activate warranties in 30 seconds with AI. No typing required.",
  keywords: ["product registration", "warranty", "AI", "OCR", "appliances", "electronics"],
  authors: [{ name: "SnapRegister" }],
  creator: "SnapRegister",
  publisher: "SnapRegister",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://snapregister.com",
    siteName: "SnapRegister",
    title: "SnapRegister - AI-Powered Product Registration",
    description: "Register your products in 30 seconds with AI. Just snap 4 photos.",
    images: [
      {
        url: "https://snapregister.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapRegister Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapRegister - AI-Powered Product Registration",
    description: "Register your products in 30 seconds with AI. Just snap 4 photos.",
    images: ["https://snapregister.com/og-image.png"],
    creator: "@snapregister",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}