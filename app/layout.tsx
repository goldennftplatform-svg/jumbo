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
  title: "Pizza Comrades Upsizer — high-res square export",
  description:
    "Upsize Pizza Comrades ordinal art to 8192×8192 in the browser. Lanczos resampling. No uploads.",
  openGraph: {
    title: "Pizza Comrades Upsizer",
    description: "8192×8192 upscale in-browser.",
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
