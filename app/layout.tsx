import type { Metadata, Viewport } from 'next';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniWriter · 多平台 AI 创作工作台',
  description: '多平台 AI 创作工作台，专为公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt 设计。',
  manifest: '/manifest.webmanifest',
};

// viewport-fit=cover 让 iOS 刘海屏可用 env(safe-area-inset-*) 撑开安全区，
// 否则 CSS 里的 safe-area 变量全部失效（iOS 编辑器底栏会被 Home 条遮挡）。
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#f5f5f7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans text-ink antialiased">
        {children}
        <AvailabilityStatus />
      </body>
    </html>
  );
}
