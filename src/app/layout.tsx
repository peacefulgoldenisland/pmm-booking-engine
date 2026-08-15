// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// 1. Load Font Luxury (Serif untuk Judul/Heading)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// 2. Load Font Clean (Sans-Serif untuk Body Text)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// 3. Update Meta Data Enterprise
export const metadata: Metadata = {
  title: "PMM Voyage | Premium Private Cabin Reserve",
  description: "Exclusive private cabin reservations for your ultimate Phinisi expedition in Labuan Bajo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-surface-50)] text-[var(--color-navy-800)] selection:bg-[var(--color-gold-500)] selection:text-white">
        {children}
      </body>
    </html>
  );
}