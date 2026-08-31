import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OmniWriter · 多平台 AI 创作工作台',
    short_name: 'OmniWriter',
    description: '本地优先的多平台 AI 创作工作台。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8fc',
    theme_color: '#312e81',
    lang: 'zh-CN',
  };
}
