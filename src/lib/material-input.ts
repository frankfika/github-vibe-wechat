export interface FetchedMaterialSource {
  url: string;
  kind: 'github' | 'web';
  text: string | null;
  error?: string;
}

export function extractHttpUrls(value: string, limit = 8): string[] {
  const matches = value.match(/https?:\/\/[^\s<>{}\[\]"']+/gi) ?? [];
  return Array.from(new Set(matches.map((url) => url.replace(/[),.;!?，。；！？]+$/g, '')).filter(Boolean))).slice(0, limit);
}

export function isGitHubUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === 'github.com';
  } catch {
    return false;
  }
}

export async function fetchMaterialSources(urls: string[]): Promise<FetchedMaterialSource[]> {
  const response = await fetch('/api/fetch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ urls: urls.slice(0, 8) }),
  });
  const result = (await response.json().catch(() => ({}))) as { items?: FetchedMaterialSource[]; error?: string };
  if (!response.ok) throw new Error(result.error || `读取链接失败 (HTTP ${response.status})`);
  return result.items ?? [];
}

export function composeFetchedMaterial(input: string, urls: string[], sources: FetchedMaterialSource[]): string {
  const instruction = urls.reduce((text, url) => text.replace(url, ' '), input).replace(/\n{3,}/g, '\n\n').trim();
  const blocks: string[] = [];
  if (instruction) blocks.push(`## 用户说明\n${instruction}`);
  sources.forEach((source, index) => {
    blocks.push(source.text
      ? `## 来源 ${index + 1} · ${source.kind === 'github' ? 'GitHub' : '网页'}\n${source.url}\n\n${source.text}`
      : `## 来源 ${index + 1} · 未读取正文\n${source.url}`);
  });
  if (!sources.length) blocks.push(input.trim());
  return blocks.join('\n\n---\n\n').slice(0, 90_000);
}
