import { NextRequest, NextResponse } from 'next/server';
import { refineMaster, type AiLike } from '@/src/lib/ai';
import { htmlToMarkdown } from '@/src/lib/export-html';
import type { Brief } from '@/src/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { brief, master, instruction, ai } = (await req.json()) as {
      brief: Brief;
      master: string;
      instruction: string;
      ai?: AiLike;
    };
    if (!brief || typeof master !== 'string' || !master.trim()) {
      return NextResponse.json({ error: '请先生成或导入母稿' }, { status: 400 });
    }
    if (typeof instruction !== 'string' || !instruction.trim()) {
      return NextResponse.json({ error: '请告诉我这次想怎么改' }, { status: 400 });
    }
    if (instruction.length > 2_000) {
      return NextResponse.json({ error: '单次修改要求请控制在 2000 字以内' }, { status: 413 });
    }
    const normalizedMaster = htmlToMarkdown(master);
    if (normalizedMaster.length > 250_000) {
      return NextResponse.json({ error: '母稿过长，暂时无法继续优化' }, { status: 413 });
    }
    const md = await refineMaster(brief, normalizedMaster, instruction, ai, { signal: req.signal });
    const title = md.match(/^# (.+)$/m)?.[1]?.trim();
    return NextResponse.json({ md, title });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json({ error: '本轮修改已取消' }, { status: 504 });
    }
    return NextResponse.json({ error: (error as Error).message || '修改失败' }, { status: 500 });
  }
}
