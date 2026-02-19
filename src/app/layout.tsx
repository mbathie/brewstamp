import type { Metadata } from "next";
import { Geist, Geist_Mono, Kaushan_Script } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kaushanScript = Kaushan_Script({
  weight: "400",
  variable: "--font-logo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app"
  ),
  title: {
    default: "Brewstamp - Digital Coffee Stamp Card",
    template: "%s | Brewstamp",
  },
  description:
    "Replace paper loyalty cards with a digital stamp card. No app download required.",
  openGraph: {
    type: "website",
    siteName: "Brewstamp",
    title: "Brewstamp - Digital Coffee Stamp Card",
    description:
      "Replace paper loyalty cards with a digital stamp card. No app download required.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brewstamp - Digital Coffee Stamp Card",
    description:
      "Replace paper loyalty cards with a digital stamp card. No app download required.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kaushanScript.variable} antialiased`}
      >
        <SessionProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                border: "none",
              },
              classNames: {
                success: "!bg-green-600 !text-white",
                error: "!bg-red-600 !text-white",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
