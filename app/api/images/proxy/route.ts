import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicImage } from '@/src/lib/fetch';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 8_000_000;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url')?.trim() ?? '';
  return proxyImage(rawUrl);
}

export async function POST(req: NextRequest) {
  let rawUrl = '';
  try {
    const body = (await req.json()) as { url?: unknown };
    rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确' }, { status: 400 });
  }
  return proxyImage(rawUrl);
}

async function proxyImage(rawUrl: string) {
  if (!rawUrl) return NextResponse.json({ error: '请提供图片链接' }, { status: 400 });
  if (rawUrl.length > 4096) return NextResponse.json({ error: '图片链接过长' }, { status: 400 });

  try {
    const image = await fetchPublicImage(rawUrl, { timeoutMs: 20_000, maxBytes: MAX_IMAGE_BYTES });
    return new NextResponse(Buffer.from(image.bytes), {
      status: 200,
      headers: {
        'content-type': image.contentType,
        'content-length': String(image.bytes.byteLength),
        'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片读取失败';
    const status = message.includes('体积超过限制') ? 413
      : message.includes('不是受支持的图片') || message.includes('格式不一致') ? 415
        : message.includes('本地网络') || message.includes('内网') || message.includes('保留地址') ? 422
          : 502;
    return NextResponse.json({ error: safeMessage(message) }, { status });
  }
}

function safeMessage(message: string): string {
  return message.replace(/[\r\n]+/g, ' ').slice(0, 180) || '图片读取失败';
}
