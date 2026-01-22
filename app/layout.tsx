import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X402 Account",
  description: "X402 Account Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">{children}</body>
    </html>
  );
}
