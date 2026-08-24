import type { CreatorConfig } from './types';

export const DEFAULT_CONFIG: CreatorConfig = {
  defaultPlatforms: ['wechat', 'x', 'zhihu', 'xiaohongshu'],
  bilingual: false,
  voice: 'relaxed',
  seriesTitle: '',
  authorSignature: '',
  wechatEyebrow: "FRANK'S AI NOTES / TOPIC",
  newsEyebrow: 'FIELD NOTES / NEWS',
};

const STORAGE_KEY = 'pencil:config:v1';

export function loadConfig(): CreatorConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<CreatorConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: CreatorConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
