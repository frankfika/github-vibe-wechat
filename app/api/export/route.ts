import { NextRequest, NextResponse } from 'next/server';
import { buildZip } from '@/src/lib/export-zip';
import { htmlToMarkdown, rewriteImageSrcs } from '@/src/lib/export-html';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ExportImage {
  src: string; // 文章 HTML 里的原始 src
  dataUrl: string; // dataURL
  file: string; // ZIP 内路径 images/xx
}

export async function POST(req: NextRequest) {
  try {
    const { title, md, eyebrow, author, images, templateId } = (await req.json()) as {
      title?: string;
      md?: string;
      eyebrow?: string;
      author?: string;
      images?: ExportImage[];
      templateId?: string;
    };
    const content = md ?? '';
    const imageMap: Record<string, string> = {};
    const srcMap: Record<string, string> = {};
    for (const im of images ?? []) {
      if (!im || !im.src || !im.dataUrl || !im.file) continue;
      imageMap[im.file] = im.dataUrl;
      srcMap[im.src] = im.file; // buildWechatHtml 内改写为 images/xx
    }
    const articleTitle = title || 'article';
    const rawMarkdown = htmlToMarkdown(rewriteImageSrcs(content, srcMap));
    const markdownWithTitle = /^#\s+\S/m.test(rawMarkdown)
      ? rawMarkdown
      : `# ${articleTitle}\n\n${rawMarkdown}`;
    const zip = await buildZip({
      title: articleTitle,
      mdBody: content,
      mdRaw: markdownWithTitle, // 文章内图片指向 images/ 下的文件，并保证单一主标题
      eyebrow,
      author,
      images: imageMap,
      imageSrcMap: srcMap,
      templateId,
    });
    const buf = Buffer.from(await zip.arrayBuffer());
    const name = slug(title || 'article');
    // filename*（RFC 5987）让中文/非 ASCII 文件名在主流浏览器里正确保存；
    // 保留 ASCII fallback 兼容旧客户端。
    return new NextResponse(buf, {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${name}.zip"; filename*=UTF-8''${encodeURIComponent(name)}.zip`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function slug(s: string) {
  return (s || 'article').toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
}
