import { NextRequest, NextResponse } from 'next/server';
import { fetchMaterial } from '@/src/lib/fetch';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url: string };
    const text = await fetchMaterial(url);
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
