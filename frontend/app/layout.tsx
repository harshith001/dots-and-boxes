import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dots & Boxes",
  description: "Real-time multiplayer Dots and Boxes game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
