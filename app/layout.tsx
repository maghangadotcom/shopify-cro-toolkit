import type { Metadata } from "next";
import "./globals.css";
import "./playbook.css";
import "./ritual-story.css";
export const metadata: Metadata = {
  title: "Shopify CRO Lab — Thomas Maghanga",
  description:
    "A plain-language guide to clearer product pages: explore shopper questions, try fictional examples and make an evidence-led test plan. No checkout or promised results.",
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

