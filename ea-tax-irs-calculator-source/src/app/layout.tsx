import type { Metadata } from "next";
import { Raleway, Inter } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = "https://calculator.eataxresolutions.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "IRS Penalty and Interest Calculator | EA Tax Resolutions",
  description:
    "Estimate certain IRS late-filing penalties, late-payment penalties, and interest using published IRS rules and quarterly rates.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "IRS Penalty and Interest Calculator | EA Tax Resolutions",
    description:
      "Estimate certain IRS late-filing penalties, late-payment penalties, and interest using published IRS rules and quarterly rates.",
    url: siteUrl,
    siteName: "EA Tax Resolutions",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "IRS Penalty and Interest Calculator | EA Tax Resolutions",
    description:
      "Estimate certain IRS late-filing penalties, late-payment penalties, and interest using published IRS rules and quarterly rates.",
  },
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
