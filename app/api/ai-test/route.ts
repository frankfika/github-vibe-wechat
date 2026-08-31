import { NextRequest, NextResponse } from 'next/server';
import { testAiConnection, type AiLike } from '@/src/lib/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { ai?: AiLike };
    const result = await testAiConnection(body.ai);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || 'AI 连接失败' },
      { status: 502 },
    );
  }
}
