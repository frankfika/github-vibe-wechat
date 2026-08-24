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
    const directive = resolveAgent(brief?.agentId)?.directive;
    const md = await generateMaster(brief, material ?? brief.material, directive, ai, {
      seriesTitle: config?.seriesTitle,
    });
    const titleMatch = md.match(/^# (.+)$/m);
    const title = titleMatch?.[1]?.trim();
    return NextResponse.json({ md, title });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
