import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubRepositoryMaterial, fetchMaterial, parseGitHubRepositoryUrl } from '@/src/lib/fetch';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string; urls?: string[] };
    const legacySingle = typeof body.url === 'string' && !Array.isArray(body.urls);
    const candidates = legacySingle ? [body.url as string] : body.urls;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: '请提供有效链接' }, { status: 400 });
    }
    const urls = Array.from(new Set(candidates.filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url.trim())).map((url) => url.trim())));
    if (urls.length === 0) return NextResponse.json({ error: '请提供有效链接' }, { status: 400 });
    if (urls.length > 8) return NextResponse.json({ error: '一次最多读取 8 个链接' }, { status: 400 });

    const items = await Promise.all(urls.map(async (url) => {
      const github = parseGitHubRepositoryUrl(url);
      const text = github ? await fetchGitHubRepositoryMaterial(url) : await fetchMaterial(url);
      return text
        ? { url, kind: github ? 'github' as const : 'web' as const, text }
        : { url, kind: github ? 'github' as const : 'web' as const, text: null, error: '没有读取到可用正文' };
    }));
    const successful = items.filter((item) => item.text);
    if (legacySingle && successful.length === 0) {
      return NextResponse.json({ error: '没有读取到可用正文' }, { status: 422 });
    }
    return NextResponse.json({ text: items.length === 1 ? items[0].text : null, items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
