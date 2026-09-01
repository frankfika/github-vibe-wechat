import type { CreatorConfig } from './types';
import { DEFAULT_WECHAT_TEMPLATE_ID } from './templates';

export const DEFAULT_CONFIG: CreatorConfig = {
  defaultPlatforms: ['wechat', 'x', 'zhihu', 'xiaohongshu'],
  bilingual: false,
  voice: 'relaxed',
  seriesTitle: '',
  authorSignature: '',
  wechatEyebrow: "FRANK'S AI NOTES / TOPIC",
  newsEyebrow: 'FIELD NOTES / NEWS',
  defaultTemplateId: DEFAULT_WECHAT_TEMPLATE_ID,
};

const STORAGE_KEY = 'omniwriter:config:v1';
const LEGACY_STORAGE_KEYS = ['pencil:config:v1'];

function migrateConfigKey() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(STORAGE_KEY) !== null) return;
  for (const legacy of LEGACY_STORAGE_KEYS) {
    const value = window.localStorage.getItem(legacy);
    if (value !== null) {
      window.localStorage.setItem(STORAGE_KEY, value);
      window.localStorage.removeItem(legacy);
      break;
    }
  }
}

export function loadConfig(): CreatorConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    migrateConfigKey();
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
