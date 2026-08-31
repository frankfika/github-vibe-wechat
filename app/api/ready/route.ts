import { NextResponse } from 'next/server';
import { isAiConfigured, MODEL } from '@/src/lib/ai';
import { PLATFORM_ORDER } from '@/src/lib/platforms';
import { WECHAT_TEMPLATES } from '@/src/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const version = process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev';
  const instance = process.env.INSTANCE_ID ?? 'local';
  const productionIdentity = process.env.NODE_ENV !== 'production'
    || (version !== 'dev' && ['app-a', 'app-b'].includes(instance));
  const capabilities = {
    platforms: PLATFORM_ORDER.length,
    templates: WECHAT_TEMPLATES.length,
    export: true,
    offlineShell: true,
  };
  const ready = productionIdentity && capabilities.platforms === 9 && capabilities.templates >= 7;
  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not-ready',
      service: 'omniwriter',
      instance,
      version,
      checks: {
        productionIdentity,
        capabilities,
        ai: {
          mode: isAiConfigured() ? 'server-configured' : 'bring-your-own-key',
          model: MODEL,
        },
      },
      runtime: {
        uptimeSeconds: Math.floor(process.uptime()),
        heapUsedMiB: Math.round(memory.heapUsed / 1024 / 1024),
        rssMiB: Math.round(memory.rss / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  );
}
