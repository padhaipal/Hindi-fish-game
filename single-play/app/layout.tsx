import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PadhaiPal Hindi Games",
  description:
    "A collection of simple Hindi learning games for young children — a fish letter game and a blocks word game.",
};

// Mobile-first viewport: lock zoom so big tap targets stay put on small phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#34c6f4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
