import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Visentry", template: "%s · Visentry" },
  description: "A secure, multi-tenant digital visitors log.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
