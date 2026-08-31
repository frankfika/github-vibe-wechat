import { NextResponse } from 'next/server';
import { isAiConfigured } from '@/src/lib/ai';

export const runtime = 'nodejs';
// 该值来自容器运行时环境，不能在 next build 时静态固化。
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ configured: isAiConfigured() });
}
