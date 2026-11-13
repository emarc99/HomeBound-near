import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NearProvider from "@/components/near/NearProvider";
import { nearPublicConfig } from "@/lib/near/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Homebound — every milestone earns its release",
  description:
    "Milestone escrow on NEAR for diaspora construction. Fund Circle USDC per stage, verify contractor photos in a NEAR AI Cloud TEE, and release only on your wallet signature.",
  icons: { icon: "/homebound.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const config = nearPublicConfig();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NearProvider config={config}>{children}</NearProvider>
      </body>
    </html>
  );
}
