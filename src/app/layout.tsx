import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DisclaimerStrip } from "@/components/Disclaimer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "药典对照层 · Pharmacopoeia Index MVP",
    template: "%s · 药典对照层",
  },
  description:
    "中文优先的药典索引与杂质发现层（示例数据）。限度与方法以现行官方药典为准；本站提供索引与对照，不替代法定文本。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <DisclaimerStrip />
        <Header />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
