import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./animations.css";
import "./performance.css";
import "./theme.css"; // Add the new theme CSS

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MovieSense - AI-Powered Film Review Analysis",
  description: "Analyze movie reviews with advanced AI sentiment analysis",
  keywords: "movie reviews, sentiment analysis, AI, film analysis, movie recommendations",
  authors: [{ name: "MovieSense Team" }],
  openGraph: {
    title: "MovieSense - AI-Powered Film Review Analysis",
    description: "Analyze movie reviews with advanced AI sentiment analysis",
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#4C1D95" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased animated-bg-gradient transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
