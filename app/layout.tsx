import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pine — The AI Shopping Assitant",
  description:
    "Describe exactly what you need and our AI concierge surfaces the perfect products in seconds.",
  openGraph: {
    siteName: "Pine",
    url: "https://www.pineshopping.com",
    title: "Pine",
    description:
      "Describe exactly what you need and our AI concierge surfaces the perfect products in seconds.",
    images: [{ url: "/logo.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans m-0`}>
        {children}
      </body>
    </html>
  );
}