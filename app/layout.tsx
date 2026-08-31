import type { Metadata } from 'next';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniWriter · 多平台 AI 创作工作台',
  description: '多平台 AI 创作工作台，专为公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt 设计。',
  manifest: '/manifest.webmanifest',
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
