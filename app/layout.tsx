import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Pizza Comrades Upsizer — 2056×2056 for the kitchen",
  description:
    "Upsize your Pizza Comrades ordinals art to 2056×2056 with Lanczos-quality resampling. Runs in your browser — free, no uploads to our servers.",
  openGraph: {
    title: "Pizza Comrades Upsizer",
    description: "2056×2056 upscale in-browser. For comrades who cook.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-mono">{children}</body>
    </html>
  );
}
