import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中国绿电与算力项目情报 · 2026.08.07—08.14",
  description: "集中式新能源、绿电直连、零碳园区、算电协同与 AIDC 政策市场周报。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
