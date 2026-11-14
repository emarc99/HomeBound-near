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
  title: "Homebound® — Every milestone earns its release",
  description:
    "Diaspora construction escrow on NEAR. Fund Circle USDC per stage, verify physical masonry via NEAR AI Cloud TEE, and release funds only on your 1 yoctoNEAR wallet signature.",
  icons: { icon: "/homebound.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const config = nearPublicConfig();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap"
        />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <NearProvider config={config}>{children}</NearProvider>
      </body>
    </html>
  );
}
