import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'omniwriter',
      instance: process.env.INSTANCE_ID ?? 'local',
      version: process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
