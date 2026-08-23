import { NextResponse } from 'next/server';
import { isAiConfigured } from '@/src/lib/ai';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ configured: isAiConfigured() });
}
