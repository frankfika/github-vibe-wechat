import { NextRequest, NextResponse } from 'next/server';
import { adaptPlatform, stripImagePayloads, type AiLike } from '@/src/lib/ai';
import type { Brief, PlatformId } from '@/src/lib/types';
import { PLATFORMS } from '@/src/lib/platforms';
import { htmlToMarkdown } from '@/src/lib/export-html';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { brief, master, platform, ai } = (await req.json()) as {
      brief: Brief;
      master: string;
      platform: PlatformId;
      ai?: AiLike;
    };
    if (!brief || typeof master !== 'string' || !master.trim()) {
      return NextResponse.json({ error: '请先生成或导入母稿' }, { status: 400 });
    }
    if (!platform || !(platform in PLATFORMS)) {
      return NextResponse.json({ error: '目标平台无效' }, { status: 400 });
    }
    // 编辑器会把用户插入的图片保存成 data URL。平台改写不需要图片二进制，
    // 因此先移除图片载荷，再按真正会发给模型的文本长度做限制。
    const normalizedMaster = stripImagePayloads(htmlToMarkdown(master));
    if (normalizedMaster.length > 250_000) {
      return NextResponse.json({ error: '母稿过长，暂时无法适配' }, { status: 413 });
    }
    const text = await adaptPlatform(brief, normalizedMaster, platform, ai, { signal: req.signal });
    return NextResponse.json({ text });
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      return NextResponse.json({ error: '平台稿生成已取消' }, { status: 504 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
