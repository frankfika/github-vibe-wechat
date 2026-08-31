import type { Article, CreatorConfig } from './types';
import { DEFAULT_CONFIG } from './config';

export const BACKUP_FORMAT = 'omniwriter-backup' as const;
export const BACKUP_VERSION = 1 as const;

export interface OmniWriterBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  articles: Article[];
  config?: CreatorConfig;
}

export function createBackup(articles: Article[], config: CreatorConfig): OmniWriterBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    articles,
    config,
  };
}

export function parseBackup(raw: string): OmniWriterBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('备份文件不是有效的 JSON');
  }

  // 兼容早期直接导出的文章数组，避免格式升级后旧备份失效。
  if (Array.isArray(parsed)) {
    const articles = validateArticles(parsed);
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      articles,
    };
  }

  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT || parsed.version !== BACKUP_VERSION) {
    throw new Error('不是受支持的 OmniWriter 备份文件');
  }
  const articles = validateArticles(parsed.articles);
  const config = isRecord(parsed.config)
    ? { ...DEFAULT_CONFIG, ...parsed.config } as CreatorConfig
    : undefined;
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    articles,
    config,
  };
}

export function mergeArticles(current: Article[], incoming: Article[]): Article[] {
  const byId = new Map(current.map((article) => [article.id, article]));
  for (const article of incoming) {
    const existing = byId.get(article.id);
    if (!existing || article.updatedAt >= existing.updatedAt) byId.set(article.id, article);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

function validateArticles(value: unknown): Article[] {
  if (!Array.isArray(value)) throw new Error('备份中缺少文章列表');
  if (!value.every(isArticle)) throw new Error('备份中包含无法识别的文章数据');
  return value as Article[];
}

function isArticle(value: unknown): value is Article {
  if (!isRecord(value) || !isRecord(value.brief) || !isRecord(value.platformDrafts)) return false;
  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.title === 'string'
    && typeof value.content === 'string'
    && typeof value.createdAt === 'number'
    && Number.isFinite(value.createdAt)
    && typeof value.updatedAt === 'number'
    && Number.isFinite(value.updatedAt)
    && typeof value.brief.material === 'string'
    && typeof value.brief.materialType === 'string'
    && Array.isArray(value.brief.platforms);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
