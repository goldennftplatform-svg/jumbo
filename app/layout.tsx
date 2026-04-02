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
  title: "Pizza Comrades Upsizer — square export",
  description:
    "Upsize Pizza Comrades ordinal art in the browser. Up to 4096×4096, JPEG or PNG. No uploads.",
  openGraph: {
    title: "Pizza Comrades Upsizer",
    description: "Lanczos upscale in-browser.",
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
