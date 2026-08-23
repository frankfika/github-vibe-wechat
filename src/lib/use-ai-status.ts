'use client';

import * as React from 'react';
import { loadAiConfig, isAiConfigured } from './ai-config';

// 判断「AI 是否可用」：读用户自己在设置页填的密钥(存浏览器本地)，
// 以及服务端是否有 .env.local 兜底。无需请求 /api/ai-status。
export function useAiStatus() {
  const [aiReady, setAiReady] = React.useState<boolean | null>(null);

  const refresh = React.useCallback(async (): Promise<boolean> => {
    const ok = isAiConfigured(loadAiConfig());
    setAiReady(ok);
    return ok;
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { aiReady, refresh };
}