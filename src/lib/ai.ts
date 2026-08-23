// AI 客户端 + 提示词（MiniMax-M3，Anthropic 兼容）
// 与 pen.dev 同款（~/.pencil/models.json: api.minimaxi.com/anthropic）。

import Anthropic from '@anthropic-ai/sdk';
import type { Brief, PlatformId } from './types';
import { EDITORIAL_RULES, FACT_CHECK_RULES, STYLE_GUIDE } from './editorial';
import { PLATFORMS, PLATFORM_ORDER } from './platforms';

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      '未配置 ANTHROPIC_API_KEY。请在 .env.local 设置（参考 .env.local.example）。',
    );
  }
  client = new Anthropic({
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.minimaxi.com/anthropic',
  });
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL || 'MiniMax-M3';

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// 创作指令卡 → 系统提示（母稿生成）
const MASTER_SYSTEM = `你是中文写作助手，专注多平台内容生产（公众号 + 全平台）。严格遵守：

${EDITORIAL_RULES}

${STYLE_GUIDE}

输出要求：
- 仅输出 Markdown 源稿，从恰好一个 "# 标题" 开始；不要解释、不要前缀。
- 图按阅读顺序用 Markdown 图片语法占位：![图 01｜描述。图片来源：…](images/01_xxx.jpg)
- 文末附"## 来源链接"列表（新闻类）。`;

export async function generateMaster(brief: Brief, material: string): Promise<string> {
  const user = buildUserPrompt(brief, material);
  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: brief.length === 'short' ? 1500 : brief.length === 'long' ? 4500 : 3000,
    system: MASTER_SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  return extractText(msg);
}

function buildUserPrompt(brief: Brief, material: string): string {
  const parts: string[] = [];
  parts.push('## 素材');
  parts.push(brief.materialType === 'news' ? `[新闻链接/资讯]\n${material || brief.material}` : material || brief.material);
  parts.push('');
  parts.push('## 创作指令');
  parts.push(`- 角度/立场：${brief.angle || '由素材提炼'}`);
  parts.push(`- 语气：${brief.voice}`);
  parts.push(`- 长度：${brief.length === 'short' ? '短（<800 字）' : brief.length === 'long' ? '长（>2000 字）' : '中（800–2000 字）'}`);
  if (brief.titleHint) parts.push(`- 标题方向：${brief.titleHint}`);
  if (brief.cta) parts.push(`- CTA：${brief.cta}`);
  if (brief.materialType === 'news') parts.push(`\n${FACT_CHECK_RULES}`);
  parts.push('\n仅输出 Markdown。');
  return parts.join('\n');
}

// 母稿 → 平台适配稿
const ADAPT_SYSTEM = `你是中文写作助手，负责把公众号母稿改写到指定平台。规则：
- 严格遵循该平台的形态、钩子、事实深度、复制模式与官方约束。
- 钩子、长度、证据、CTA 都要重写，禁止跨平台复制同一段文案。
- 保留事实对等（动机、痛点、工作流、限制、安全、链接）。
- 仅输出最终平台文案，前面加一段 markdown 标题行（"# 标题" 或该平台的字段），方便直接复制。`;

export async function adaptPlatform(
  brief: Brief,
  master: string,
  platform: PlatformId,
): Promise<string> {
  const spec = PLATFORMS[platform];
  const user = `## 母稿（公众号）\n\n${master}\n\n## 目标平台：${spec.label}（${spec.name}）\n\n平台约束：\n${spec.rules}\n\n形态：${spec.shape}\n钩子：${spec.hook}\n事实深度：${spec.depth}\n${spec.maxChars ? `字数上限：${spec.maxChars}\n` : ''}复制模式：${spec.copyMode}\n\n请按上述改写。`;
  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: ADAPT_SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  return extractText(msg);
}

export async function adaptAllPlatforms(
  brief: Brief,
  master: string,
  platforms: PlatformId[],
  onOne?: (p: PlatformId, text: string) => void,
): Promise<Record<string, string>> {
  const targets = platforms.length ? platforms : PLATFORM_ORDER;
  const out: Record<string, string> = {};
  await Promise.all(
    targets.map(async (p) => {
      const text = await adaptPlatform(brief, master, p);
      out[p] = text;
      onOne?.(p, text);
    }),
  );
  return out;
}

function extractText(msg: { content: Array<{ type: string; text?: string }> }): string {
  return msg.content
    .map((b) => (b.type === 'text' ? b.text ?? '' : ''))
    .join('');
}
