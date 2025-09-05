import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "결제 - MyLife Cinema",
  description: "결제 처리 중",
};

// 결제 페이지 전용 레이아웃 - AuthProvider 없음
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* Auth 없이 직접 렌더링 */}
      {children}
    </div>
  );
}