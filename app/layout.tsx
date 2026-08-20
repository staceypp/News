import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "光储智·晶汇｜JA Green × News",
  description: "追踪国内外新能源、绿电直连、零碳园区、AIDC 政策及市场信息，掌握同行最新动态。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
