export type Voice = 'relaxed' | 'editorial' | 'technical' | 'market';

export type PlatformId =
  | 'wechat'
  | 'x'
  | 'reddit'
  | 'hacker-news'
  | 'zhihu'
  | 'csdn'
  | 'product-hunt'
  | 'bilibili'
  | 'xiaohongshu';

export interface Brief {
  material: string;          // URL / 文本 / 主题
  materialType: 'news' | 'project-own' | 'project-third' | 'topic' | 'copy';
  angle: string;             // 角度 / 立场
  voice: Voice;
  length: 'short' | 'medium' | 'long';
  platforms: PlatformId[];
  bilingual: boolean;
  titleHint?: string;
  imagePlan?: string;
  cta?: string;
}

export interface Article {
  id: string;
  title: string;
  brief: Brief;
  content: string;           // Markdown 母稿
  platformDrafts: Partial<Record<PlatformId, string>>;
  createdAt: number;
  updatedAt: number;
}

export interface CreatorConfig {
  defaultPlatforms: PlatformId[];
  bilingual: boolean;
  voice: Voice;
  seriesTitle: string;
  accountName: string;
  authorSignature: string;
  wechatEyebrow: string;
  newsEyebrow: string;
  askWhenMissing: boolean;
}
