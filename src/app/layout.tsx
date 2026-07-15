import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boardly — Collaborative whiteboards, perfectly controlled",
  description:
    "A permission-first collaborative canvas built around Excalidraw. Every board is an independent, secure workspace you own.",
  keywords: [
    "Boardly",
    "Excalidraw",
    "whiteboard",
    "collaboration",
    "canvas",
    "permissions",
  ],
  authors: [{ name: "Boardly" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Boardly",
    description: "Collaborative whiteboards, perfectly controlled.",
    siteName: "Boardly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
