import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Shopify CRO Lab — Thomas Maghanga",
  description:
    "An interactive engineering case study: subscription pricing, resilient cart UX and inspectable experiment events. Fictional products; no checkout.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
