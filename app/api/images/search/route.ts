import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicBytes, fetchPublicHtml, probePublicImage, type SafeImageMime } from '@/src/lib/fetch';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;
const MAX_SOURCE_CANDIDATES = 18;
const MIN_IMAGE_AREA = 100_000;
const SAFE_WIKIMEDIA_MIMES = new Set<SafeImageMime>([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]);

export interface ImageSearchResult {
  id: string;
  origin: 'source-page' | 'wikimedia';
  imageUrl: string;
  thumbnailUrl: string;
  proxyUrl: string;
  thumbnailProxyUrl: string;
  sourcePageUrl: string;
  sourceLabel: string;
  license: string;
  licenseUrl?: string;
  creator: string;
  sourceDate?: string;
  alt: string;
  mime: SafeImageMime;
  width?: number;
  height?: number;
  byteSize?: number;
}

interface RawSourceCandidate {
  imageUrl: string;
  alt: string;
  width?: number;
  height?: number;
  priority: number;
}

interface PageContext {
  title: string;
  canonicalUrl: string;
  sourceLabel: string;
  creator: string;
  sourceDate?: string;
  license: string;
  licenseUrl?: string;
  candidates: RawSourceCandidate[];
}

interface WikimediaPage {
  pageid?: number;
  title?: string;
  index?: number;
  canonicalurl?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    mime?: string;
    width?: number;
    height?: number;
    size?: number;
    extmetadata?: Record<string, { value?: string }>;
  }>;
}

export async function POST(req: NextRequest) {
  let body: { query?: string; sourceUrl?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确' }, { status: 400 });
  }

  const requestedQuery = typeof body.query === 'string' ? body.query.trim().slice(0, 240) : '';
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim().slice(0, 4096) : '';
  const limit = clampLimit(body.limit);
  if (!requestedQuery && !sourceUrl) {
    return NextResponse.json({ error: '请提供搜索词或原文链接' }, { status: 400 });
  }

  const warnings: string[] = [];
  const sourceResults: ImageSearchResult[] = [];
  let pageContext: PageContext | null = null;

  if (sourceUrl) {
    try {
      const document = await fetchPublicHtml(sourceUrl, { timeoutMs: 15_000, maxBytes: 2_000_000, signal: req.signal });
      pageContext = extractPageContext(document.html, document.finalUrl);
      const candidates = pageContext.candidates
        .filter((candidate) => !looksLikeIcon(candidate))
        .slice(0, MAX_SOURCE_CANDIDATES);
      const probed = await mapWithConcurrency(candidates, 4, async (candidate) => {
        const probe = await probePublicImage(candidate.imageUrl, { timeoutMs: 10_000, maxImageBytes: 8_000_000, signal: req.signal });
        if (!probe) return null;
        return toResult({
          origin: 'source-page',
          imageUrl: probe.finalUrl.href,
          thumbnailUrl: probe.finalUrl.href,
          sourcePageUrl: pageContext!.canonicalUrl,
          sourceLabel: pageContext!.sourceLabel,
          license: pageContext!.license,
          licenseUrl: pageContext!.licenseUrl,
          creator: pageContext!.creator,
          sourceDate: pageContext!.sourceDate,
          alt: candidate.alt || pageContext!.title,
          mime: probe.contentType,
          width: candidate.width,
          height: candidate.height,
          byteSize: probe.declaredSize,
        });
      });
      sourceResults.push(...probed.filter((result): result is ImageSearchResult => Boolean(result)));
    } catch (error) {
      if (req.signal.aborted) throw error;
      warnings.push(`原文图片读取失败：${safeError(error)}`);
    }
  }

  const effectiveQuery = (requestedQuery || pageContext?.title || '').trim().slice(0, 240);
  let wikimediaResults: ImageSearchResult[] = [];
  if (effectiveQuery && sourceResults.length < limit) {
    try {
      wikimediaResults = await searchWikimediaWithRetry(effectiveQuery, Math.min(MAX_LIMIT, limit - sourceResults.length + 4), req.signal);
    } catch (error) {
      if (req.signal.aborted) throw error;
      warnings.push(`Wikimedia Commons 搜图失败：${safeError(error)}`);
    }
  }

  const results = dedupeResults([...sourceResults, ...wikimediaResults]).slice(0, limit);
  if (!results.length && warnings.length && !effectiveQuery) {
    return NextResponse.json({ error: warnings[0] }, { status: 422 });
  }
  return NextResponse.json(
    {
      query: effectiveQuery,
      sourceUrl: (pageContext?.canonicalUrl ?? sourceUrl) || undefined,
      images: results.map((result) => ({
        ...result,
        title: result.alt,
        origin: result.origin === 'source-page' ? 'source' : result.origin,
        thumbnailUrl: result.thumbnailProxyUrl,
      })),
      results,
      warnings,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}

async function searchWikimediaWithRetry(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
  try {
    return await searchWikimedia(query, limit, signal);
  } catch (error) {
    // Commons 偶尔会在 IPv4/IPv6 切换时出现一次性网络失败；只重试一次，
    // 避免把瞬时故障直接呈现成“没有找到图片”。但请求被取消时直接上抛。
    if (signal?.aborted) throw error;
    return searchWikimedia(query, limit, signal);
  }
}

async function searchWikimedia(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php');
  apiUrl.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(Math.max(1, Math.min(MAX_LIMIT, limit))),
    prop: 'imageinfo|info',
    inprop: 'url',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '720',
  }).toString();
  const resource = await fetchPublicBytes(apiUrl, {
    timeoutMs: 15_000,
    maxBytes: 2_000_000,
    headers: { accept: 'application/json' },
    signal,
  });
  const payload = JSON.parse(new TextDecoder().decode(resource.bytes)) as { query?: { pages?: WikimediaPage[] } };
  const pages = [...(payload.query?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const results: ImageSearchResult[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const mime = info?.mime as SafeImageMime | undefined;
    if (!info?.url || !mime || !SAFE_WIKIMEDIA_MIMES.has(mime)) continue;
    if (looksLikeSvgOrIconUrl(info.url) || !hasUsefulDimensions(info.width, info.height)) continue;
    const metadata = info.extmetadata ?? {};
    const license = cleanMetadata(metadata.LicenseShortName?.value) || '未知许可';
    const licenseUrl = cleanUrl(metadata.LicenseUrl?.value);
    const creator = cleanMetadata(metadata.Artist?.value || metadata.Credit?.value) || '未知创作者';
    const alt = cleanMetadata(metadata.ImageDescription?.value) || page.title?.replace(/^File:/i, '') || query;
    results.push(toResult({
      origin: 'wikimedia',
      imageUrl: info.url,
      thumbnailUrl: info.thumburl || info.url,
      sourcePageUrl: info.descriptionurl || page.canonicalurl || `https://commons.wikimedia.org/?curid=${page.pageid ?? ''}`,
      sourceLabel: 'Wikimedia Commons',
      license,
      licenseUrl,
      creator,
      alt,
      mime,
      width: info.width,
      height: info.height,
      byteSize: info.size,
    }));
  }
  return results;
}

function extractPageContext(html: string, finalUrl: URL): PageContext {
  const metas = extractMeta(html);
  const title = firstMeta(metas, ['og:title', 'twitter:title'])
    || cleanMetadata(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1])
    || finalUrl.hostname;
  const canonicalHref = findLink(html, 'canonical');
  const canonicalUrl = resolveHttpUrl(canonicalHref, finalUrl)?.href ?? finalUrl.href;
  const sourceLabel = firstMeta(metas, ['og:site_name', 'application-name']) || finalUrl.hostname;
  const creator = firstMeta(metas, ['author', 'article:author', 'byl']) || sourceLabel;
  const sourceDate = firstMeta(metas, ['article:published_time', 'datepublished', 'date']);
  const licenseHref = findLink(html, 'license');
  const licenseUrl = resolveHttpUrl(licenseHref, finalUrl)?.href;
  const license = firstMeta(metas, ['license', 'dcterms.license', 'rights', 'copyright'])
    || (licenseUrl ? '见来源页许可' : '未知许可');

  const candidates: RawSourceCandidate[] = [];
  const seen = new Set<string>();
  const add = (raw: string | undefined, alt: string, priority: number, width?: number, height?: number) => {
    const resolved = resolveHttpUrl(raw, finalUrl);
    if (!resolved || seen.has(resolved.href)) return;
    seen.add(resolved.href);
    candidates.push({ imageUrl: resolved.href, alt: cleanMetadata(alt), priority, width, height });
  };

  add(firstMeta(metas, ['og:image:secure_url', 'og:image']), firstMeta(metas, ['og:image:alt']) || title, 0,
    parsePositiveInt(firstMeta(metas, ['og:image:width'])), parsePositiveInt(firstMeta(metas, ['og:image:height'])));
  add(firstMeta(metas, ['twitter:image']), firstMeta(metas, ['twitter:image:alt']) || title, 1);

  for (const figure of html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)) {
    const imgTag = figure[1].match(/<img\b[^>]*>/i)?.[0];
    if (!imgTag) continue;
    const attrs = parseAttributes(imgTag);
    const caption = cleanMetadata(figure[1].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]);
    add(bestImageSource(attrs), caption || attrs.alt || title, 2, parsePositiveInt(attrs.width), parsePositiveInt(attrs.height));
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    add(bestImageSource(attrs), attrs.alt || attrs.title || title, 3, parsePositiveInt(attrs.width), parsePositiveInt(attrs.height));
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return { title, canonicalUrl, sourceLabel, creator, sourceDate, license, licenseUrl, candidates };
}

function extractMeta(html: string): Map<string, string[]> {
  const values = new Map<string, string[]>();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    const key = (attrs.property || attrs.name || attrs.itemprop || '').trim().toLowerCase();
    const content = decodeEntities(attrs.content || '').trim();
    if (!key || !content) continue;
    values.set(key, [...(values.get(key) ?? []), content]);
  }
  return values;
}

function firstMeta(values: Map<string, string[]>, keys: string[]): string {
  for (const key of keys) {
    const value = values.get(key)?.find(Boolean);
    if (value) return value;
  }
  return '';
}

function findLink(html: string, rel: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    const rels = (attrs.rel || '').toLowerCase().split(/\s+/);
    if (rels.includes(rel)) return attrs.href;
  }
  return undefined;
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const body = tag.replace(/^<[^\s>]+|\/?\s*>$/g, '');
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of body.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function bestImageSource(attrs: Record<string, string>): string | undefined {
  const direct = attrs.src || attrs['data-src'] || attrs['data-original'] || attrs['data-lazy-src'];
  const srcset = attrs.srcset || attrs['data-srcset'];
  if (!srcset) return direct;
  const options = srcset.split(',').map((item) => {
    const [url, descriptor = ''] = item.trim().split(/\s+/, 2);
    const score = descriptor.endsWith('w') ? Number(descriptor.slice(0, -1)) : descriptor.endsWith('x') ? Number(descriptor.slice(0, -1)) * 1000 : 0;
    return { url, score: Number.isFinite(score) ? score : 0 };
  }).filter((item) => item.url);
  return options.sort((a, b) => b.score - a.score)[0]?.url || direct;
}

function looksLikeIcon(candidate: RawSourceCandidate): boolean {
  if (looksLikeSvgOrIconUrl(candidate.imageUrl)) return true;
  if (!hasUsefulDimensions(candidate.width, candidate.height)) return true;
  const hint = `${candidate.imageUrl} ${candidate.alt}`.toLowerCase();
  return /(?:^|[\/_\-.])(favicon|sprite|emoji|avatar|icon)(?:[\/_\-.]|$)/i.test(hint);
}

function looksLikeSvgOrIconUrl(rawUrl: string): boolean {
  try {
    const pathname = new URL(rawUrl).pathname.toLowerCase();
    return /\.(?:svg|svgz|ico)(?:$|\?)/i.test(pathname)
      || /(?:^|[\/_\-.])(favicon|sprite|emoji|avatar|icon)(?:[\/_\-.]|$)/i.test(pathname);
  } catch {
    return true;
  }
}

function hasUsefulDimensions(width?: number, height?: number): boolean {
  if (!width || !height) return true;
  return width >= 160 && height >= 120 && width * height >= MIN_IMAGE_AREA;
}

function toResult(input: Omit<ImageSearchResult, 'id' | 'proxyUrl' | 'thumbnailProxyUrl'>): ImageSearchResult {
  return {
    ...input,
    id: createHash('sha256').update(`${input.origin}\n${input.imageUrl}\n${input.sourcePageUrl}`).digest('hex').slice(0, 20),
    proxyUrl: proxyUrl(input.imageUrl),
    thumbnailProxyUrl: proxyUrl(input.thumbnailUrl),
  };
}

function proxyUrl(imageUrl: string): string {
  return `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
}

function dedupeResults(results: ImageSearchResult[]): ImageSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = normalizeImageUrl(result.imageUrl);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeImageUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    return url.href;
  } catch {
    return rawUrl;
  }
}

function resolveHttpUrl(value: string | undefined, base: URL): URL | null {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return null;
  try {
    const url = new URL(decodeEntities(value), base);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function cleanMetadata(value: string | undefined): string {
  return decodeEntities((value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function cleanUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(decodeEntities(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function parsePositiveInt(value: string | undefined): number | undefined {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function clampLimit(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.floor(value as number) : DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : '未知错误';
  return message.replace(/[\r\n]+/g, ' ').slice(0, 160);
}
