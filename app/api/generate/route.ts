import { NextRequest, NextResponse } from 'next/server';
import { generateMaster } from '@/src/lib/ai';
import type { Brief } from '@/src/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { brief, material } = (await req.json()) as { brief: Brief; material?: string };
    const md = await generateMaster(brief, material ?? brief.material);
    const titleMatch = md.match(/^# (.+)$/m);
    const title = titleMatch?.[1]?.trim();
    return NextResponse.json({ md, title });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
