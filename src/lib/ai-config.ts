// 用户自己的 AI 模型配置(存浏览器本地,每用户独立)
// 请求时随生成/适配请求发送给服务端,服务端用它创建模型客户端。
// 留空则回退到服务端 .env.local 的环境变量(可选兜底)。

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  apiKey: '',
  baseUrl: 'https://api.minimaxi.com/anthropic',
  model: 'MiniMax-M3',
};

const STORAGE_KEY = 'omniwriter:ai:v1';

export function loadAiConfig(): AiConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    return { ...DEFAULT_AI_CONFIG, ...(JSON.parse(raw) as Partial<AiConfig>) };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(cfg: AiConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function isAiConfigured(cfg: AiConfig): boolean {
  return Boolean(cfg.apiKey.trim());
}