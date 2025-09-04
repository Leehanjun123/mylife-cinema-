import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { GoogleAnalytics } from '@/components/Analytics';
import { AuthProvider } from '@/contexts/AuthContext';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyLife Cinema - 당신의 일기가 영화가 됩니다",
  description: "AI가 당신의 하루를 분석해 감동적인 영화로 만들어드립니다. GPT-4와 Stable Diffusion으로 3분만에 나만의 특별한 영화를 무료로 제작하세요.",
  keywords: "AI 영화 제작, 일기 영화, 개인 영화, 스토리텔링, 영상 생성, GPT-4, AI 콘텐츠, 무료 영화 제작, 감정 분석, 자동 영상 편집",
  authors: [{ name: "MyLife Cinema" }],
  creator: "MyLife Cinema",
  publisher: "MyLife Cinema",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://lifecinema.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyLife Cinema - AI가 만드는 나만의 감동 영화",
    description: "일기를 쓰면 AI가 자동으로 영화를 만들어드립니다. 무료로 3편까지 제작 가능!",
    url: "https://lifecinema.site",
    siteName: "MyLife Cinema",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MyLife Cinema - AI 영화 제작 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLife Cinema - 당신의 일기가 영화가 됩니다",
    description: "AI가 당신의 하루를 분석해 감동적인 영화로 만들어드립니다.",
    images: ["/og-image.jpg"],
    creator: "@lifecinema",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1752582087901677"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
