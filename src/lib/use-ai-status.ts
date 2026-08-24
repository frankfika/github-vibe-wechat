'use client';

import * as React from 'react';
import { loadAiConfig, isAiConfigured } from './ai-config';

// 判断「AI 是否可用」：客户端设置里填的密钥（浏览器本地）或服务端 .env.local 兜底，任一存在即可用。
export function useAiStatus() {
  const [aiReady, setAiReady] = React.useState<boolean | null>(null);

  const refresh = React.useCallback(async (): Promise<boolean> => {
    const clientOk = isAiConfigured(loadAiConfig());
    let serverOk = false;
    try {
      const res = await fetch('/api/ai-status', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { configured?: boolean };
        serverOk = Boolean(data.configured);
      }
    } catch {
      serverOk = false;
    }
    const ok = clientOk || serverOk;
    setAiReady(ok);
    return ok;
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { aiReady, refresh };
}
