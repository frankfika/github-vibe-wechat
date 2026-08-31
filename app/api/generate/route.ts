import { NextRequest, NextResponse } from 'next/server';
import { generateMaster, type AiLike } from '@/src/lib/ai';
import type { Brief } from '@/src/lib/types';
import { resolveAgent } from '@/src/lib/agents';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { brief, material, ai, config } = (await req.json()) as {
      brief: Brief;
      material?: string;
      ai?: AiLike;
      config?: { seriesTitle?: string };
    };
    if (!brief || typeof brief !== 'object') {
      return NextResponse.json({ error: '缺少创作指令' }, { status: 400 });
    }
    const source = material ?? brief.material;
    if (!source || typeof source !== 'string' || !source.trim()) {
      return NextResponse.json({ error: '请先放入素材' }, { status: 400 });
    }
    if (source.length > 100_000) {
      return NextResponse.json({ error: '素材过长，请控制在 10 万字以内' }, { status: 413 });
    }
    const directive = resolveAgent(brief?.agentId)?.directive;
    const md = await generateMaster(brief, source, directive, ai, {
      seriesTitle: config?.seriesTitle,
    });
    const titleMatch = md.match(/^# (.+)$/m);
    const title = titleMatch?.[1]?.trim();
    return NextResponse.json({ md, title });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
