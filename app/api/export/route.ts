import { NextRequest, NextResponse } from 'next/server';
import { buildZip } from '@/src/lib/export-zip';
import { htmlToMarkdown, rewriteImageSrcs } from '@/src/lib/export-html';

export const runtime = 'nodejs';

interface ExportImage {
  src: string; // 文章 HTML 里的原始 src
  dataUrl: string; // dataURL
  file: string; // ZIP 内路径 images/xx
}

export async function POST(req: NextRequest) {
  try {
    const { title, md, eyebrow, author, images } = (await req.json()) as {
      title?: string;
      md?: string;
      eyebrow?: string;
      author?: string;
      images?: ExportImage[];
    };
    const content = md ?? '';
    const imageMap: Record<string, string> = {};
    const srcMap: Record<string, string> = {};
    for (const im of images ?? []) {
      if (!im || !im.src || !im.dataUrl || !im.file) continue;
      imageMap[im.file] = im.dataUrl;
      srcMap[im.src] = im.file; // buildWechatHtml 内改写为 images/xx
    }
    const zip = await buildZip({
      title: title || 'article',
      mdBody: content,
      mdRaw: htmlToMarkdown(rewriteImageSrcs(content, srcMap)), // 文章内图片指向 images/ 下的文件
      eyebrow,
      author,
      images: imageMap,
      imageSrcMap: srcMap,
    });
    const buf = Buffer.from(await zip.arrayBuffer());
    const name = slug(title || 'article');
    return new NextResponse(buf, {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${encodeURIComponent(name)}.zip"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function slug(s: string) {
  return (s || 'article').toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}
