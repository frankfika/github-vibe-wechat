import { NextRequest, NextResponse } from 'next/server';
import { adaptPlatform } from '@/src/lib/ai';
import type { Brief, PlatformId } from '@/src/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { brief, master, platform } = (await req.json()) as {
      brief: Brief;
      master: string;
      platform: PlatformId;
    };
    const text = await adaptPlatform(brief, master, platform);
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
