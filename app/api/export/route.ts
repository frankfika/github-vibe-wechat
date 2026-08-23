import { NextRequest, NextResponse } from 'next/server';
import { buildWechatHtml } from '@/src/lib/export-html';
import { buildZip } from '@/src/lib/export-zip';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title, md, format = 'zip' } = (await req.json()) as { title: string; md: string; format?: 'html' | 'zip' };
    if (format === 'html') {
      const html = buildWechatHtml({ title, mdBody: md });
      return new NextResponse(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-disposition': `attachment; filename="${encodeURIComponent(title || 'article')}.html"`,
        },
      });
    }
    const html = buildWechatHtml({ title, mdBody: md });
    const zip = await buildZip({ title, mdBody: html, mdRaw: md, images: {} });
    const buf = Buffer.from(await zip.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${encodeURIComponent(title || 'article')}.zip"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
