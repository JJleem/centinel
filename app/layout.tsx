import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Centinel — 경쟁 게임 트렌드 분석 AI",
  description:
    "경쟁 게임 트렌드를 자동 분석하고 광고 소재를 즉시 생성하는 AI 파이프라인 툴",
  keywords: ["hyper casual", "game marketing", "UA", "ad creative", "AI", "Supercent"],
  authors: [{ name: "임재준" }],
  openGraph: {
    title: "Centinel — 경쟁 게임 트렌드 분석 AI",
    description: "경쟁 게임 트렌드 자동 분석 → 광고 소재 5종 즉시 생성",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centinel — 경쟁 게임 트렌드 분석 AI",
    description: "경쟁 게임 트렌드 자동 분석 → 광고 소재 5종 즉시 생성",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
