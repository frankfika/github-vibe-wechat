import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Pencil · 中文写作与多平台排版',
  description: 'pen.dev 风格的写作与排版工作台，专为公众号、X、知乎、小红书、B站、CSDN 等多平台发布设计。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
